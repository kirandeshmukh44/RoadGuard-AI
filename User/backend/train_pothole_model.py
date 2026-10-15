"""Train and evaluate the local RoadGuard pothole dataset.

From the User folder, run:
    backend\\venv\\Scripts\\python.exe backend\\train_pothole_model.py

The Roboflow train images are split by source-image group so augmented variants
do not leak across train/validation. The original ``valid`` folder stays held
out for the final comparison. A candidate only replaces the active weights if
its held-out metrics improve without a meaningful precision regression.
"""

from __future__ import annotations

import argparse
import json
import random
import shutil
import sys
from datetime import datetime
from pathlib import Path

import yaml


BACKEND_DIR = Path(__file__).resolve().parent
DATASET_DIR = BACKEND_DIR / "Dataset from kaggle"
MODELS_DIR = BACKEND_DIR / "models"
RUNS_DIR = BACKEND_DIR / "training_runs"
ACTIVE_MODEL = MODELS_DIR / "pothole_detection.pt"


def list_images(folder: Path) -> list[Path]:
    extensions = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    return sorted(path for path in folder.iterdir() if path.is_file() and path.suffix.lower() in extensions)


def validate_dataset(train_images: list[Path], test_images: list[Path]) -> None:
    if not train_images:
        raise RuntimeError(f"No training images found in {DATASET_DIR / 'train' / 'images'}")
    if not test_images:
        raise RuntimeError(f"No held-out validation images found in {DATASET_DIR / 'valid' / 'images'}")

    errors: list[str] = []
    for image in train_images + test_images:
        label = DATASET_DIR / image.parent.parent.name / "labels" / f"{image.stem}.txt"
        if not label.exists():
            errors.append(f"missing label: {label}")
            continue
        for line_number, line in enumerate(label.read_text(encoding="utf-8").splitlines(), start=1):
            fields = line.split()
            if not fields:
                continue
            try:
                class_id = int(fields[0])
                box = [float(value) for value in fields[1:]]
            except ValueError:
                errors.append(f"invalid label: {label}:{line_number}")
                continue
            if class_id != 0 or len(box) != 4 or any(value < 0 or value > 1 for value in box) or box[2] <= 0 or box[3] <= 0:
                errors.append(f"invalid class/box: {label}:{line_number}")
        if len(errors) >= 20:
            break

    if errors:
        raise RuntimeError("Dataset validation failed:\n- " + "\n- ".join(errors))


def grouped_split(
    images: list[Path], validation_fraction: float, test_fraction: float, seed: int
) -> tuple[list[Path], list[Path], list[Path]]:
    """Keep Roboflow variants together in train, validation, and test splits."""
    groups: dict[str, list[Path]] = {}
    for image in images:
        source_id = image.stem.split(".rf.", maxsplit=1)[0]
        groups.setdefault(source_id, []).append(image)

    group_ids = list(groups)
    random.Random(seed).shuffle(group_ids)
    test_group_count = max(1, round(len(group_ids) * test_fraction))
    validation_group_count = max(1, round(len(group_ids) * validation_fraction))
    test_groups = set(group_ids[:test_group_count])
    validation_groups = set(group_ids[test_group_count:test_group_count + validation_group_count])
    train_groups = set(group_ids[test_group_count + validation_group_count:])
    train = [image for key, paths in groups.items() if key in train_groups for image in paths]
    validation = [image for key, paths in groups.items() if key in validation_groups for image in paths]
    test = [image for key, paths in groups.items() if key in test_groups for image in paths]
    return sorted(train), sorted(validation), sorted(test)


def write_data_config(run_dir: Path, train: list[Path], validation: list[Path], test: list[Path]) -> Path:
    split_dir = run_dir / "splits"
    split_dir.mkdir(parents=True, exist_ok=True)
    train_file = split_dir / "train.txt"
    validation_file = split_dir / "validation.txt"
    test_file = split_dir / "test.txt"
    train_file.write_text("\n".join(path.resolve().as_posix() for path in train), encoding="utf-8")
    validation_file.write_text("\n".join(path.resolve().as_posix() for path in validation), encoding="utf-8")
    test_file.write_text("\n".join(path.resolve().as_posix() for path in test), encoding="utf-8")

    data = {
        "path": DATASET_DIR.resolve().as_posix(),
        "train": train_file.resolve().as_posix(),
        "val": validation_file.resolve().as_posix(),
        "test": test_file.resolve().as_posix(),
        "nc": 1,
        "names": ["pothole"],
    }
    data_file = run_dir / "data.yaml"
    data_file.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
    return data_file


def metric_summary(metrics) -> dict[str, float]:
    return {
        "precision": float(metrics.box.mp),
        "recall": float(metrics.box.mr),
        "map50": float(metrics.box.map50),
        "map50_95": float(metrics.box.map),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Fine-tune the one-class pothole detector on the local Kaggle export.")
    parser.add_argument("--epochs", type=int, default=60)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--batch", type=int, default=8)
    parser.add_argument("--validation-fraction", type=float, default=0.15)
    parser.add_argument("--test-fraction", type=float, default=0.10)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--dry-run", action="store_true", help="Validate labels and prepare splits without starting training.")
    args = parser.parse_args()

    if not (0.05 <= args.validation_fraction <= 0.30):
        parser.error("--validation-fraction must be between 0.05 and 0.30")
    if not (0.05 <= args.test_fraction <= 0.20) or args.validation_fraction + args.test_fraction >= 0.50:
        parser.error("--test-fraction must be 0.05-0.20 and combined split fractions must stay below 0.50")
    if not DATASET_DIR.is_dir():
        print(f"Dataset folder not found: {DATASET_DIR}", file=sys.stderr)
        return 1
    if not ACTIVE_MODEL.exists():
        print(f"Active single-class weights not found: {ACTIVE_MODEL}", file=sys.stderr)
        return 1

    train_images = list_images(DATASET_DIR / "train" / "images")
    test_images = list_images(DATASET_DIR / "valid" / "images")
    validate_dataset(train_images, test_images)
    train_split, validation_split, train_test_split = grouped_split(
        train_images, args.validation_fraction, args.test_fraction, args.seed
    )
    holdout_images = sorted(train_test_split + test_images)

    run_name = datetime.now().strftime("pothole_%Y%m%d_%H%M%S")
    run_dir = RUNS_DIR / run_name
    run_dir.mkdir(parents=True, exist_ok=False)
    data_file = write_data_config(run_dir, train_split, validation_split, holdout_images)

    if args.dry_run:
        print(f"Dataset check passed: {len(train_images) + len(test_images)} labeled images.")
        print(f"Grouped split prepared: {len(train_split)} train / {len(validation_split)} validation / {len(train_test_split)} test, plus {len(test_images)} supplied holdout images.")
        print(f"Resolved data config: {data_file}")
        return 0

    from ultralytics import YOLO
    import torch

    device = "0" if torch.cuda.is_available() else "cpu"
    batch = args.batch if device != "cpu" else min(args.batch, 4)
    if device == "cpu":
        print("WARNING: CUDA is unavailable; CPU fine-tuning over this dataset may take many hours.")
    print(f"Dataset: {len(train_images)} train images; final test has {len(holdout_images)} held-out images")
    print(f"Grouped split: {len(train_split)} train / {len(validation_split)} validation / {len(train_test_split)} test images")
    print(f"Device: {device}; epochs: {args.epochs}; image size: {args.imgsz}; batch: {batch}")

    baseline_model = YOLO(str(ACTIVE_MODEL))
    baseline = metric_summary(baseline_model.val(
        data=str(data_file), split="test", imgsz=args.imgsz, batch=1, device=device,
        workers=0, plots=False, project=str(run_dir), name="baseline", exist_ok=True, verbose=False,
    ))
    print(f"Baseline holdout mAP50: {baseline['map50']:.4f}; precision: {baseline['precision']:.4f}; recall: {baseline['recall']:.4f}")

    model = YOLO(str(ACTIVE_MODEL))
    model.train(
        data=str(data_file), epochs=args.epochs, imgsz=args.imgsz, batch=batch,
        patience=15, project=str(run_dir), name="train", exist_ok=True,
        pretrained=True, seed=args.seed, deterministic=True, device=device,
        workers=0, cache=False, plots=False, verbose=True,
    )

    candidate = run_dir / "train" / "weights" / "best.pt"
    if not candidate.exists():
        print(f"Training finished without candidate weights: {candidate}", file=sys.stderr)
        return 1

    candidate_metrics = metric_summary(YOLO(str(candidate)).val(
        data=str(data_file), split="test", imgsz=args.imgsz, batch=1, device=device,
        workers=0, plots=False, project=str(run_dir), name="candidate", exist_ok=True, verbose=False,
    ))
    report = {"dataset": str(DATASET_DIR), "train_images": len(train_split), "validation_images": len(validation_split),
              "holdout_images": len(holdout_images), "baseline": baseline, "candidate": candidate_metrics,
              "promoted": False, "candidate_weights": str(candidate)}

    # Never promote based on a tiny or obviously insufficient test split.
    if len(holdout_images) >= 100 and candidate_metrics["map50"] > baseline["map50"] and candidate_metrics["precision"] >= baseline["precision"] * 0.95:
        MODELS_DIR.mkdir(parents=True, exist_ok=True)
        backup = MODELS_DIR / f"pothole_detection_before_{run_name}.pt"
        shutil.copy2(ACTIVE_MODEL, backup)
        shutil.copy2(candidate, ACTIVE_MODEL)
        report["promoted"] = True
        report["backup_weights"] = str(backup)
        print(f"Promoted candidate weights to {ACTIVE_MODEL}")
    else:
        if len(holdout_images) < 100:
            print("Holdout has fewer than 100 images; review the candidate manually before promoting it.")
        else:
            print("Candidate did not beat the baseline safely; active weights were kept.")

    report_file = run_dir / "metrics.json"
    report_file.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Metrics saved to {report_file}")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
