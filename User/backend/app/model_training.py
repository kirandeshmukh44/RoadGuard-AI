"""
Model Training Pipeline for Pothole Detection
Supports dataset management, training, validation, and model versioning.
"""

import os
import json
import shutil
import zipfile
import yaml
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
import uuid
import random

# Training dependencies (optional)
try:
    from ultralytics import YOLO
    import torch
    TRAINING_AVAILABLE = True
except ImportError:
    TRAINING_AVAILABLE = False

BASE_DIR = Path(__file__).resolve().parents[1]
MODELS_DIR = BASE_DIR / "models"
DATASETS_DIR = BASE_DIR / "datasets"
TRAINING_RUNS_DIR = BASE_DIR / "training_runs"

for d in [MODELS_DIR, DATASETS_DIR, TRAINING_RUNS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

@dataclass
class ModelVersion:
    """Model version metadata"""
    version_id: str
    name: str
    base_model: str
    dataset_version: str
    epochs: int
    imgsz: int
    batch: int
    map50: float
    map50_95: float
    precision: float
    recall: float
    created_at: str
    model_path: str
    status: str  # training, completed, failed, deployed
    notes: str = ""

@dataclass
class DatasetVersion:
    """Dataset version metadata"""
    version_id: str
    name: str
    num_images: int
    num_annotations: int
    classes: List[str]
    train_split: float
    val_split: float
    created_at: str
    dataset_path: str
    description: str = ""

class ModelManager:
    """Manage model versions and training"""
    
    def __init__(self):
        self.versions_file = MODELS_DIR / "model_versions.json"
        self.datasets_file = DATASETS_DIR / "dataset_versions.json"
        self._load_versions()
    
    def _load_versions(self):
        if self.versions_file.exists():
            with open(self.versions_file, 'r') as f:
                self.versions = [ModelVersion(**v) for v in json.load(f)]
        else:
            self.versions = []
        
        if self.datasets_file.exists():
            with open(self.datasets_file, 'r') as f:
                self.datasets = [DatasetVersion(**v) for v in json.load(f)]
        else:
            self.datasets = []
    
    def _save_versions(self):
        with open(self.versions_file, 'w') as f:
            json.dump([asdict(v) for v in self.versions], f, indent=2)
        with open(self.datasets_file, 'w') as f:
            json.dump([asdict(v) for v in self.datasets], f, indent=2)
    
    def register_dataset(self, name: str, dataset_path: str, description: str = "") -> DatasetVersion:
        """Register a new dataset version"""
        dataset_path = Path(dataset_path).expanduser()
        if not dataset_path.is_absolute():
            working_directory_path = (Path.cwd() / dataset_path).resolve()
            dataset_path = working_directory_path if working_directory_path.exists() else (BASE_DIR / dataset_path).resolve()
        else:
            dataset_path = dataset_path.resolve()
        data_yaml = dataset_path / "data.yaml"
        if not dataset_path.is_dir() or not data_yaml.is_file():
            raise ValueError("Dataset folder must contain a data.yaml file")

        with open(data_yaml, 'r', encoding='utf-8') as f:
            data_config = yaml.safe_load(f) or {}
        names = data_config.get('names', ["pothole"])
        classes = list(names.values()) if isinstance(names, dict) else list(names)
        yaml_root = Path(data_config.get('path') or dataset_path)
        if not yaml_root.is_absolute():
            yaml_root = (dataset_path / yaml_root).resolve()

        def split_images(split_name: str, fallback: str):
            split_value = data_config.get(split_name, fallback)
            split_path = Path(split_value)
            if not split_path.is_absolute():
                split_path = yaml_root / split_path
            return split_path, sorted(p for p in split_path.glob("*") if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".bmp"})

        train_dir, train_images = split_images('train', 'train/images')
        val_dir, val_images = split_images('val', 'val/images')
        if not val_images and not data_config.get('val'):
            val_dir, val_images = split_images('val', 'valid/images')
        if not train_images or not val_images:
            raise ValueError("Dataset needs labeled training and validation images (train/images and val/images or valid/images)")

        train_labels_dir = train_dir.parent / "labels" if train_dir.name == "images" else train_dir / "labels"
        val_labels_dir = val_dir.parent / "labels" if val_dir.name == "images" else val_dir / "labels"
        missing_labels = [
            image.name
            for image, labels_dir in [(image, train_labels_dir) for image in train_images] + [(image, val_labels_dir) for image in val_images]
            if not (labels_dir / f"{image.stem}.txt").is_file()
        ]
        if missing_labels:
            raise ValueError(f"Dataset is missing YOLO label files for {len(missing_labels)} images")

        # Count images and object annotations from the YOLO label rows.
        num_images = len(train_images) + len(val_images)
        label_files = {labels_dir / f"{image.stem}.txt" for image, labels_dir in [(image, train_labels_dir) for image in train_images] + [(image, val_labels_dir) for image in val_images]}
        num_annotations = sum(len(label.read_text(encoding='utf-8').splitlines()) for label in label_files if label.exists())
        
        version_id = str(uuid.uuid4())[:8]
        dataset_version = DatasetVersion(
            version_id=version_id,
            name=name,
            num_images=num_images,
            num_annotations=num_annotations,
            classes=list(classes),
            train_split=len(train_images) / num_images,
            val_split=len(val_images) / num_images,
            created_at=datetime.now().isoformat(),
            dataset_path=str(dataset_path),
            description=description
        )
        
        self.datasets.append(dataset_version)
        self._save_versions()
        return dataset_version
    
    def start_training(self, config: Dict) -> ModelVersion:
        """Start a new training run"""
        if not TRAINING_AVAILABLE:
            raise RuntimeError("Training dependencies not available. Install ultralytics and torch.")

        dataset = next((d for d in self.datasets if d.version_id == config.get('dataset_version')), None)
        if not dataset:
            raise ValueError("Select a registered dataset before starting training")
        if not (Path(dataset.dataset_path) / "data.yaml").is_file():
            raise ValueError("The selected dataset no longer contains data.yaml")
        if not 1 <= int(config.get('epochs', 50)) <= 500:
            raise ValueError("Epochs must be between 1 and 500")
        if int(config.get('imgsz', 640)) < 320 or int(config.get('imgsz', 640)) > 1280:
            raise ValueError("Image size must be between 320 and 1280")
        
        version_id = str(uuid.uuid4())[:8]
        run_dir = TRAINING_RUNS_DIR / f"train_{version_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        run_dir.mkdir(parents=True, exist_ok=True)
        
        # Create model version entry
        model_version = ModelVersion(
            version_id=version_id,
            name=config.get('name', f'pothole_model_{version_id}'),
            base_model=config.get('base_model', 'yolov8n.pt'),
            dataset_version=config.get('dataset_version', ''),
            epochs=config.get('epochs', 50),
            imgsz=config.get('imgsz', 640),
            batch=config.get('batch', 16),
            map50=0.0,
            map50_95=0.0,
            precision=0.0,
            recall=0.0,
            created_at=datetime.now().isoformat(),
            model_path=str(run_dir / "weights" / "best.pt"),
            status="training",
            notes=config.get('notes', '')
        )
        
        self.versions.append(model_version)
        self._save_versions()
        
        # Start training in background (simplified - in production use Celery/RQ)
        import threading
        thread = threading.Thread(target=self._run_training, args=(model_version, config, run_dir))
        thread.daemon = True
        thread.start()
        
        return model_version
    
    def _run_training(self, model_version: ModelVersion, config: Dict, run_dir: Path):
        """Run training in background"""
        try:
            # Find dataset
            dataset = next((d for d in self.datasets if d.version_id == config['dataset_version']), None)
            if not dataset:
                raise ValueError(f"Dataset {config['dataset_version']} not found")
            
            source_yaml = Path(dataset.dataset_path) / "data.yaml"
            if not source_yaml.exists():
                raise ValueError("data.yaml not found in dataset")

            # Pin the dataset root in the run config so YOLO does not resolve
            # a relative `path` against its global datasets directory.
            with open(source_yaml, 'r', encoding='utf-8') as stream:
                data_config = yaml.safe_load(stream) or {}
            dataset_root = Path(dataset.dataset_path).resolve()
            yaml_root = Path(data_config.get('path') or dataset_root)
            if not yaml_root.is_absolute():
                yaml_root = (dataset_root / yaml_root).resolve()

            def configured_images(split, fallback):
                split_path = Path(data_config.get(split, fallback))
                if not split_path.is_absolute():
                    split_path = yaml_root / split_path
                return split_path, sorted(p for p in split_path.glob('*') if p.is_file() and p.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp', '.bmp'})

            train_dir, train_images = configured_images('train', 'train/images')
            val_dir, val_images = configured_images('val', 'val/images')
            if not val_images and not data_config.get('val'):
                val_dir, val_images = configured_images('val', 'valid/images')

            validation_ratio = len(val_images) / max(len(train_images) + len(val_images), 1)
            if train_images and validation_ratio < 0.1:
                # Roboflow image names retain the source stem before `.rf.`.
                # Group those variants before splitting to keep augmentations
                # of one source image on a single side of validation.
                groups = {}
                for image in train_images:
                    group = image.stem.split('.rf.')[0]
                    groups.setdefault(group, []).append(image)
                ordered_groups = sorted(groups)
                random.Random(42).shuffle(ordered_groups)
                target_holdout = max(1, round(len(train_images) * 0.1))
                holdout_groups = set()
                held_out_count = 0
                for group in ordered_groups:
                    if held_out_count >= target_holdout:
                        break
                    holdout_groups.add(group)
                    held_out_count += len(groups[group])

                run_dataset = run_dir / 'dataset'
                for split in ('train', 'val'):
                    (run_dataset / split / 'images').mkdir(parents=True, exist_ok=True)
                    (run_dataset / split / 'labels').mkdir(parents=True, exist_ok=True)

                def link_or_copy(source, destination):
                    try:
                        os.link(source, destination)
                    except OSError:
                        shutil.copy2(source, destination)

                for image in train_images:
                    split = 'val' if image.stem.split('.rf.')[0] in holdout_groups else 'train'
                    link_or_copy(image, run_dataset / split / 'images' / image.name)
                    label = train_dir.parent / 'labels' / f'{image.stem}.txt'
                    if label.is_file():
                        link_or_copy(label, run_dataset / split / 'labels' / label.name)
                for image in val_images:
                    link_or_copy(image, run_dataset / 'val' / 'images' / image.name)
                    label = val_dir.parent / 'labels' / f'{image.stem}.txt'
                    if label.is_file():
                        destination = run_dataset / 'val' / 'labels' / label.name
                        if not destination.exists():
                            link_or_copy(label, destination)

                data_config['path'] = str(run_dataset.resolve())
                data_config['train'] = 'train/images'
                data_config['val'] = 'val/images'
                data_config.pop('test', None)
                model_version.notes = (model_version.notes + ' | ' if model_version.notes else '') + f'Validation prepared with a deterministic 10% source-group holdout ({held_out_count} images).'
            else:
                data_config['path'] = str(dataset_root)

            data_yaml = run_dir / "data.yaml"
            with open(data_yaml, 'w', encoding='utf-8') as stream:
                yaml.safe_dump(data_config, stream, sort_keys=False)
            
            # Load base model
            base_model = Path(model_version.base_model).expanduser()
            if not base_model.is_absolute():
                local_weights = (BASE_DIR.parent / base_model).resolve()
                if local_weights.is_file():
                    base_model = local_weights
            model = YOLO(str(base_model))
            
            # Train
            results = model.train(
                data=str(data_yaml),
                epochs=model_version.epochs,
                imgsz=model_version.imgsz,
                batch=model_version.batch,
                patience=min(30, model_version.epochs),
                workers=0 if os.name == 'nt' else 4,
                project=str(run_dir.parent),
                name=run_dir.name,
                exist_ok=True,
                verbose=True
            )
            
            # Update metrics
            if hasattr(results, 'results_dict'):
                metrics = results.results_dict
                model_version.map50 = metrics.get('metrics/mAP50(B)', 0.0)
                model_version.map50_95 = metrics.get('metrics/mAP50-95(B)', 0.0)
                model_version.precision = metrics.get('metrics/precision(B)', 0.0)
                model_version.recall = metrics.get('metrics/recall(B)', 0.0)
            
            best_weights = run_dir / "weights" / "best.pt"
            if not best_weights.is_file():
                raise RuntimeError("Training finished without producing best.pt weights")
            model_version.status = "completed"
            model_version.model_path = str(best_weights)
            
        except Exception as e:
            model_version.status = "failed"
            model_version.notes = f"Training failed: {str(e)}"
        
        self._save_versions()
    
    def deploy_model(self, version_id: str) -> bool:
        """Deploy a model version as the active model"""
        version = next((v for v in self.versions if v.version_id == version_id), None)
        if not version:
            return False
        
        if version.status != "completed":
            return False
        
        source = Path(version.model_path)
        target = MODELS_DIR / "pothole_detection.pt"
        
        if source.exists():
            shutil.copy2(source, target)
            try:
                from .ai_detection import detector
                detector.reload_model()
            except Exception as exc:
                raise RuntimeError(f"Model file was copied, but the detector could not reload it: {exc}") from exc
            version.status = "deployed"
            # Mark others as not deployed
            for v in self.versions:
                if v.version_id != version_id and v.status == "deployed":
                    v.status = "completed"
            self._save_versions()
            return True
        return False
    
    def get_versions(self) -> List[ModelVersion]:
        return sorted(self.versions, key=lambda v: v.created_at, reverse=True)
    
    def get_datasets(self) -> List[DatasetVersion]:
        return sorted(self.datasets, key=lambda v: v.created_at, reverse=True)
    
    def get_deployed_model(self) -> Optional[ModelVersion]:
        return next((v for v in self.versions if v.status == "deployed"), None)

class DatasetManager:
    """Manage dataset creation and augmentation"""
    
    @staticmethod
    def create_yolo_dataset_structure(dataset_path: str, classes: List[str]):
        """Create YOLO dataset directory structure"""
        path = Path(dataset_path)
        for split in ['train', 'val', 'test']:
            (path / split / 'images').mkdir(parents=True, exist_ok=True)
            (path / split / 'labels').mkdir(parents=True, exist_ok=True)
        
        # Create data.yaml
        data_yaml = {
            'path': str(path.absolute()),
            'train': 'train/images',
            'val': 'val/images',
            'test': 'test/images',
            'names': {i: c for i, c in enumerate(classes)}
        }
        with open(path / 'data.yaml', 'w') as f:
            yaml.dump(data_yaml, f)
    
    @staticmethod
    def import_from_roboflow(zip_path: str, extract_to: str):
        """Import dataset from Roboflow export (YOLO format zip)"""
        extract_path = Path(extract_to)
        extract_path.mkdir(parents=True, exist_ok=True)
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)
    
    @staticmethod
    def augment_dataset(dataset_path: str, output_path: str, augmentations: int = 3):
        """Augment dataset with basic transformations"""
        import cv2
        import numpy as np
        import albumentations as A
        
        if not TRAINING_AVAILABLE:
            raise RuntimeError("Training dependencies not available")
        
        transform = A.Compose([
            A.HorizontalFlip(p=0.5),
            A.RandomBrightnessContrast(p=0.3),
            A.RandomRotate90(p=0.3),
            A.GaussNoise(p=0.2),
            A.MotionBlur(p=0.2),
        ], bbox_params=A.BboxParams(format='yolo', label_fields=['class_labels']))
        
        dataset_path = Path(dataset_path)
        output_path = Path(output_path)
        output_path.mkdir(parents=True, exist_ok=True)
        
        for split in ['train', 'val']:
            img_dir = dataset_path / split / 'images'
            lbl_dir = dataset_path / split / 'labels'
            out_img_dir = output_path / split / 'images'
            out_lbl_dir = output_path / split / 'labels'
            
            out_img_dir.mkdir(parents=True, exist_ok=True)
            out_lbl_dir.mkdir(parents=True, exist_ok=True)
            
            for img_file in img_dir.glob("*.jpg"):
                lbl_file = lbl_dir / f"{img_file.stem}.txt"
                if not lbl_file.exists():
                    continue
                
                # Copy original
                shutil.copy2(img_file, out_img_dir / img_file.name)
                shutil.copy2(lbl_file, out_lbl_dir / lbl_file.name)
                
                # Read image and labels
                image = cv2.imread(str(img_file))
                image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                
                with open(lbl_file, 'r') as f:
                    lines = f.readlines()
                
                bboxes = []
                class_labels = []
                for line in lines:
                    parts = line.strip().split()
                    if len(parts) >= 5:
                        class_labels.append(int(parts[0]))
                        bboxes.append([float(parts[1]), float(parts[2]), float(parts[3]), float(parts[4])])
                
                # Generate augmented versions
                for i in range(augmentations):
                    if bboxes:
                        transformed = transform(image=image, bboxes=bboxes, class_labels=class_labels)
                        aug_image = transformed['image']
                        aug_bboxes = transformed['bboxes']
                        aug_labels = transformed['class_labels']
                    else:
                        aug_image = image
                        aug_bboxes = bboxes
                        aug_labels = class_labels
                    
                    # Save augmented
                    aug_name = f"{img_file.stem}_aug{i}{img_file.suffix}"
                    cv2.imwrite(str(out_img_dir / aug_name), cv2.cvtColor(aug_image, cv2.COLOR_RGB2BGR))
                    
                    with open(out_lbl_dir / f"{img_file.stem}_aug{i}.txt", 'w') as f:
                        for bbox, cls in zip(aug_bboxes, aug_labels):
                            f.write(f"{cls} {bbox[0]} {bbox[1]} {bbox[2]} {bbox[3]}\n")

# Global instances
model_manager = ModelManager()
dataset_manager = DatasetManager()
