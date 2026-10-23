import cv2
import numpy as np
from PIL import Image
from pathlib import Path
from typing import List, Tuple, Optional
import json
import math
import os

from .config import (
    YOLO_MODEL_PATH,
    MODEL_AVAILABLE,
    CONFIDENCE_THRESHOLD,
    IOU_THRESHOLD,
    MAX_INPUT_SIZE,
    ENABLE_HALF_PRECISION,
    ENABLE_TORCH_COMPILE,
    SEVERITY_THRESHOLDS,
)

# Try to import YOLO from ultralytics
try:
    from ultralytics import YOLO
    import torch
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    print("Warning: ultralytics package not available")


class PotholeDetector:
    """AI-based pothole detection using YOLO model with optimizations for faster inference."""
    
    def __init__(self):
        self.model = None
        self.model_loaded = False
        self.device = 'cpu'
        self.half_precision = False
        self.max_input_size = MAX_INPUT_SIZE
        self.enable_torch_compile = ENABLE_TORCH_COMPILE
        self.pothole_class_ids = set()
        self.reload_model()

    def reload_model(self):
        """Load the currently deployed weights, including after an admin deployment."""
        self.model = None
        self.model_loaded = False
        if YOLO_MODEL_PATH.exists() and YOLO_AVAILABLE:
            try:
                self.model = YOLO(str(YOLO_MODEL_PATH))

                names = self.model.names
                name_items = names.items() if isinstance(names, dict) else enumerate(names)
                self.pothole_class_ids = {
                    int(class_id)
                    for class_id, name in name_items
                    if "pothole" in str(name).lower()
                }
                # A single-class custom model is unambiguous even if its name is missing.
                if not self.pothole_class_ids and len(names) == 1:
                    self.pothole_class_ids = {0}
                if not self.pothole_class_ids:
                    raise ValueError(f"Model has no pothole class: {names}")
                
                # Optimize for inference
                self._optimize_model()
                
                self.model_loaded = True
                print(f"YOLO model loaded successfully from {YOLO_MODEL_PATH}")
                print(f"Pothole class IDs: {sorted(self.pothole_class_ids)}")
                print(f"Inference device: {self.device}, Half precision: {self.half_precision}, Max input size: {self.max_input_size}")
            except Exception as e:
                print(f"Error loading YOLO model: {e}")
        else:
            print("YOLO model file not found or ultralytics not available")
    
    def _optimize_model(self):
        """Apply inference optimizations to the YOLO model."""
        try:
            # Set device (use CUDA if available, else CPU)
            if torch.cuda.is_available():
                self.device = 'cuda'
                self.model.to('cuda')
                # Enable half-precision for faster inference on GPU
                self.half_precision = ENABLE_HALF_PRECISION
                if self.half_precision:
                    self.model.model.half()
                    print("GPU acceleration enabled with FP16")
                else:
                    print("GPU acceleration enabled with FP32")
            else:
                self.device = 'cpu'
                self.model.to('cpu')
                # On CPU, use torch.compile for optimization (PyTorch 2.0+)
                if self.enable_torch_compile:
                    try:
                        self.model.model = torch.compile(self.model.model, mode='reduce-overhead')
                        print("Torch compile optimization enabled for CPU")
                    except Exception:
                        pass  # torch.compile not available or failed
                        
        except Exception as e:
            print(f"Model optimization warning: {e}")
            self.device = 'cpu'
            self.half_precision = False
    
    def _preprocess_image(self, image):
        """Preprocess image for faster inference - resize if too large."""
        h, w = image.shape[:2]
        max_dim = max(h, w)
        
        if max_dim > self.max_input_size:
            scale = self.max_input_size / max_dim
            new_w = int(w * scale)
            new_h = int(h * scale)
            image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
        return image
    
    def detect_potholes(self, image_path: str) -> dict:
        """
        Detect potholes in an image using YOLO model.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary containing detection results
        """
        if not self.model_loaded:
            return {
                "success": False,
                "message": "AI model not available. Please configure the YOLO model.",
                "potholes_detected": 0,
                "bounding_boxes": [],
                "severity": None,
                "confidence": 0.0
            }
        
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                return {
                    "success": False,
                    "message": "Failed to load image",
                    "potholes_detected": 0,
                    "bounding_boxes": [],
                    "severity": None,
                    "confidence": 0.0
                }
            
            # Preprocess image for faster inference
            image = self._preprocess_image(image)
            
            # Run inference with optimizations
            inference_args = {
                'conf': CONFIDENCE_THRESHOLD,
                'iou': IOU_THRESHOLD,
                'verbose': False,
                'device': self.device,
                'classes': sorted(self.pothole_class_ids),
                'agnostic_nms': True,
            }
            
            if self.half_precision and self.device == 'cuda':
                inference_args['half'] = True
            
            with torch.inference_mode():
                results = self.model.predict(image, imgsz=self.max_input_size, **inference_args)
            
            # Extract bounding boxes
            bounding_boxes = []
            max_confidence = 0.0
            largest_area = 0
            
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    confidence = float(box.conf[0])
                    
                    bounding_boxes.append({
                        "x1": float(x1),
                        "y1": float(y1),
                        "x2": float(x2),
                        "y2": float(y2),
                        "confidence": confidence
                    })
                    
                    if confidence > max_confidence:
                        max_confidence = confidence
                    
                    # Calculate area
                    area = max(0.0, x2 - x1) * max(0.0, y2 - y1)
                    largest_area = max(largest_area, area)
            
            severity = self._calculate_severity(largest_area, len(bounding_boxes), image.shape[0] * image.shape[1])
            
            return {
                "success": True,
                "message": f"Detected {len(bounding_boxes)} pothole(s)",
                "potholes_detected": len(bounding_boxes),
                "bounding_boxes": bounding_boxes,
                "severity": severity,
                "confidence": max_confidence
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Detection error: {str(e)}",
                "potholes_detected": 0,
                "bounding_boxes": [],
                "severity": None,
                "confidence": 0.0
            }
    
    def detect_potholes_video(self, video_path: str, frame_skip: int = 30) -> dict:
        """
        Detect potholes in a video by processing frames.
        
        Args:
            video_path: Path to the video file
            frame_skip: Process every Nth frame (default 30 for ~1fps at 30fps video)
            
        Returns:
            Dictionary containing aggregated detection results
        """
        if not self.model_loaded:
            return {
                "success": False,
                "message": "AI model not available. Please configure the YOLO model.",
                "potholes_detected": 0,
                "bounding_boxes": [],
                "severity": None,
                "confidence": 0.0,
                "frames_processed": 0
            }
        
        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                return {
                    "success": False,
                    "message": "Failed to open video file",
                    "potholes_detected": 0,
                    "bounding_boxes": [],
                    "severity": None,
                    "confidence": 0.0,
                    "frames_processed": 0
                }
            
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            
            all_bounding_boxes = []
            max_confidence = 0.0
            total_detections = 0
            peak_frame_detections = 0
            most_severe = 'low'
            severity_rank = {'low': 0, 'medium': 1, 'high': 2}
            frames_processed = 0
            frame_idx = 0
            sample_interval = max(1, round(fps)) if fps and fps > 0 else max(1, frame_skip)
            
            # Prepare inference arguments
            inference_args = {
                'conf': CONFIDENCE_THRESHOLD,
                'iou': IOU_THRESHOLD,
                'verbose': False,
                'device': self.device,
                'classes': sorted(self.pothole_class_ids),
                'agnostic_nms': True,
            }
            
            if self.half_precision and self.device == 'cuda':
                inference_args['half'] = True
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                if frame_idx % sample_interval == 0:
                    # Preprocess frame for faster inference
                    frame = self._preprocess_image(frame)
                    
                    # Run inference on frame
                    with torch.inference_mode():
                        results = self.model.predict(frame, imgsz=self.max_input_size, **inference_args)
                    
                    frames_processed += 1
                    frame_boxes = []
                    frame_area = frame.shape[0] * frame.shape[1]
                    
                    for result in results:
                        boxes = result.boxes
                        for box in boxes:
                            x1, y1, x2, y2 = box.xyxy[0].tolist()
                            confidence = float(box.conf[0])
                            
                            detection = {
                                "x1": float(x1),
                                "y1": float(y1),
                                "x2": float(x2),
                                "y2": float(y2),
                                "confidence": confidence,
                                "frame": frame_idx
                            }
                            frame_boxes.append(detection)
                            if len(all_bounding_boxes) < 200:
                                all_bounding_boxes.append(detection)
                            
                            if confidence > max_confidence:
                                max_confidence = confidence
                            
                            total_detections += 1

                    peak_frame_detections = max(peak_frame_detections, len(frame_boxes))
                    frame_severity = self._calculate_severity(
                        max((max(0.0, box['x2'] - box['x1']) * max(0.0, box['y2'] - box['y1']) for box in frame_boxes), default=0.0),
                        len(frame_boxes),
                        frame_area,
                    )
                    if severity_rank[frame_severity] > severity_rank[most_severe]:
                        most_severe = frame_severity
                
                frame_idx += 1
            
            cap.release()
            
            severity = most_severe
            
            # Return representative bounding boxes (from first frame with detections)
            representative_boxes = [b for b in all_bounding_boxes if b.get("frame", 0) == 
                                   min([bb.get("frame", 0) for bb in all_bounding_boxes], default=0)]
            
            return {
                "success": True,
                "message": f"Sampled {frames_processed} frames at about 1 frame/second; saw up to {peak_frame_detections} pothole(s) in one frame ({total_detections} detections across the clip)",
                "potholes_detected": peak_frame_detections,
                "detections_across_frames": total_detections,
                "bounding_boxes": representative_boxes[:10],  # Limit to 10 for response
                "all_detections": all_bounding_boxes,
                "severity": severity,
                "confidence": max_confidence,
                "frames_processed": frames_processed,
                "total_frames": total_frames,
                "video_fps": fps
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Video detection error: {str(e)}",
                "potholes_detected": 0,
                "bounding_boxes": [],
                "severity": None,
                "confidence": 0.0,
                "frames_processed": 0
            }
    
    def _calculate_severity(self, largest_box_area: float, count: int, frame_area: Optional[float] = None) -> str:
        """
        Estimate visual risk from the portion of a frame occupied by detections.
        
        Args:
            largest_box_area: Pixel area of the largest detection in one frame
            count: Number of simultaneous pothole detections
            frame_area: Total pixel area of the processed frame
            
        Returns:
            Severity level: 'low', 'medium', or 'high'
        """
        if count <= 0:
            return "low"

        # Confidence measures detection certainty, not pothole size. Avoid adding
        # overlapping boxes together; use the largest detected area per frame.
        area_ratio = largest_box_area / frame_area if frame_area and frame_area > 0 else 0.0
        if area_ratio >= SEVERITY_THRESHOLDS["HIGH_AREA_RATIO"] or count >= SEVERITY_THRESHOLDS["HIGH_COUNT"]:
            return "high"
        elif area_ratio >= SEVERITY_THRESHOLDS["MEDIUM_AREA_RATIO"] or count >= SEVERITY_THRESHOLDS["MEDIUM_COUNT"]:
            return "medium"
        return "low"
    
    def draw_bounding_boxes(self, image_path: str, bounding_boxes: List[dict], output_path: str):
        """
        Draw bounding boxes on image and save.
        
        Args:
            image_path: Path to original image
            bounding_boxes: List of bounding box dictionaries
            output_path: Path to save annotated image
        """
        image = cv2.imread(image_path)
        if image is None:
            return False
        
        for box in bounding_boxes:
            x1, y1, x2, y2 = int(box["x1"]), int(box["y1"]), int(box["x2"]), int(box["y2"])
            confidence = box["confidence"]
            
            # Determine color based on confidence
            if confidence >= 0.85:
                color = (0, 0, 255)  # Red for high confidence
            elif confidence >= 0.75:
                color = (0, 165, 255)  # Orange for medium confidence
            else:
                color = (0, 255, 0)  # Green for low confidence
            
            # Draw rectangle
            cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
            
            # Add label
            label = f"Pothole: {confidence:.2f}"
            cv2.putText(image, label, (x1, y1 - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        
        cv2.imwrite(output_path, image)
        return True

    def detect_batch(self, image_paths: List[str], frame_skip: int = 1) -> List[dict]:
        """
        Detect potholes in multiple images (batch processing).
        
        Args:
            image_paths: List of image file paths
            frame_skip: For video frames, process every Nth frame
            
        Returns:
            List of detection results for each image
        """
        if not self.model_loaded:
            return [{
                "success": False,
                "message": "AI model not available",
                "potholes_detected": 0,
                "bounding_boxes": [],
                "severity": None,
                "confidence": 0.0,
                "image_path": path
            } for path in image_paths]
        
        # Prepare inference arguments
        inference_args = {
            'conf': CONFIDENCE_THRESHOLD,
            'iou': IOU_THRESHOLD,
            'verbose': False,
            'device': self.device,
            'classes': sorted(self.pothole_class_ids),
            'agnostic_nms': True,
        }
        
        if self.half_precision and self.device == 'cuda':
            inference_args['half'] = True
        
        results = []
        for i, path in enumerate(image_paths):
            if i % frame_skip == 0:
                image = cv2.imread(path)
                if image is None:
                    result = {
                        "success": False,
                        "message": "Failed to load image",
                        "potholes_detected": 0,
                        "bounding_boxes": [],
                        "severity": None,
                        "confidence": 0.0,
                        "image_path": path
                    }
                else:
                    # Preprocess for faster inference
                    image = self._preprocess_image(image)
                    with torch.inference_mode():
                        model_results = self.model.predict(image, imgsz=self.max_input_size, **inference_args)
                    
                    # Extract bounding boxes
                    bounding_boxes = []
                    max_confidence = 0.0
                    largest_area = 0
                    
                    for result in model_results:
                        boxes = result.boxes
                        for box in boxes:
                            x1, y1, x2, y2 = box.xyxy[0].tolist()
                            confidence = float(box.conf[0])
                            
                            bounding_boxes.append({
                                "x1": float(x1),
                                "y1": float(y1),
                                "x2": float(x2),
                                "y2": float(y2),
                                "confidence": confidence
                            })
                            
                            if confidence > max_confidence:
                                max_confidence = confidence
                            
                            area = max(0.0, x2 - x1) * max(0.0, y2 - y1)
                            largest_area = max(largest_area, area)
                    
                    severity = self._calculate_severity(largest_area, len(bounding_boxes), image.shape[0] * image.shape[1])
                    
                    result = {
                        "success": True,
                        "message": f"Detected {len(bounding_boxes)} pothole(s)",
                        "potholes_detected": len(bounding_boxes),
                        "bounding_boxes": bounding_boxes,
                        "severity": severity,
                        "confidence": max_confidence,
                        "image_path": path
                    }
            else:
                result = {
                    "success": True,
                    "message": "Skipped (frame skip)",
                    "potholes_detected": 0,
                    "bounding_boxes": [],
                    "severity": None,
                    "confidence": 0.0,
                    "image_path": path
                }
            results.append(result)
        return results

    def detect_realtime_frame(self, frame: np.ndarray) -> dict:
        """
        Detect potholes in a single frame (for real-time processing).
        
        Args:
            frame: OpenCV frame (numpy array)
            
        Returns:
            Detection result dictionary
        """
        if not self.model_loaded:
            return {
                "success": False,
                "message": "AI model not available",
                "potholes_detected": 0,
                "bounding_boxes": [],
                "severity": None,
                "confidence": 0.0
            }
        
        try:
            # Preprocess frame for faster inference
            frame = self._preprocess_image(frame)
            
            # Prepare inference arguments
            inference_args = {
                'conf': CONFIDENCE_THRESHOLD,
                'iou': IOU_THRESHOLD,
                'verbose': False,
                'device': self.device,
                'classes': sorted(self.pothole_class_ids),
                'agnostic_nms': True,
            }
            
            if self.half_precision and self.device == 'cuda':
                inference_args['half'] = True
            
            with torch.inference_mode():
                results = self.model.predict(frame, imgsz=self.max_input_size, **inference_args)
            
            bounding_boxes = []
            max_confidence = 0.0
            largest_area = 0
            total_detections = 0
            
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    confidence = float(box.conf[0])
                    
                    bounding_boxes.append({
                        "x1": float(x1),
                        "y1": float(y1),
                        "x2": float(x2),
                        "y2": float(y2),
                        "confidence": confidence
                    })
                    
                    if confidence > max_confidence:
                        max_confidence = confidence
                    
                    area = max(0.0, x2 - x1) * max(0.0, y2 - y1)
                    largest_area = max(largest_area, area)
                    total_detections += 1
            
            severity = self._calculate_severity(largest_area, total_detections, frame.shape[0] * frame.shape[1])
            
            return {
                "success": True,
                "message": f"Detected {total_detections} pothole(s)",
                "potholes_detected": total_detections,
                "bounding_boxes": bounding_boxes,
                "severity": severity,
                "confidence": max_confidence
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Detection error: {str(e)}",
                "potholes_detected": 0,
                "bounding_boxes": [],
                "severity": None,
                "confidence": 0.0
            }


# Singleton instance
detector = PotholeDetector()


def export_model_to_onnx(model_path: str = None, output_path: str = None, imgsz: int = 640) -> str:
    """
    Export YOLO model to ONNX format for faster inference.
    
    Args:
        model_path: Path to the PyTorch model (.pt file)
        output_path: Path to save ONNX model
        imgsz: Input image size for export
        
    Returns:
        Path to the exported ONNX model
    """
    if model_path is None:
        model_path = str(YOLO_MODEL_PATH)
    
    if output_path is None:
        output_path = str(YOLO_MODEL_PATH).replace('.pt', '.onnx')
    
    if not YOLO_AVAILABLE:
        raise RuntimeError("ultralytics package not available")
    
    if not Path(model_path).exists():
        raise FileNotFoundError(f"Model not found at {model_path}")
    
    try:
        model = YOLO(model_path)
        exported_path = model.export(format='onnx', imgsz=imgsz, simplify=True, opset=12)
        print(f"Model exported to ONNX: {exported_path}")
        return exported_path
    except Exception as e:
        raise RuntimeError(f"ONNX export failed: {e}")


def export_model_to_tensorrt(onnx_path: str, output_path: str = None) -> str:
    """
    Convert ONNX model to TensorRT engine for maximum inference speed on NVIDIA GPUs.
    
    Args:
        onnx_path: Path to the ONNX model
        output_path: Path to save TensorRT engine
        
    Returns:
        Path to the TensorRT engine
    """
    try:
        import tensorrt as trt
    except ImportError:
        raise RuntimeError("TensorRT not available. Install tensorrt package.")
    
    if output_path is None:
        output_path = onnx_path.replace('.onnx', '.engine')
    
    logger = trt.Logger(trt.Logger.WARNING)
    builder = trt.Builder(logger)
    network = builder.create_network(1 << int(trt.NetworkDefinitionCreationFlag.EXPLICIT_BATCH))
    parser = trt.OnnxParser(network, logger)
    
    with open(onnx_path, 'rb') as f:
        if not parser.parse(f.read()):
            for error in range(parser.num_errors):
                print(parser.get_error(error))
            raise RuntimeError("Failed to parse ONNX model")
    
    config = builder.create_builder_config()
    config.set_memory_pool_limit(trt.MemoryPoolType.WORKSPACE, 1 << 30)  # 1GB
    
    if builder.platform_has_fast_fp16:
        config.set_flag(trt.BuilderFlag.FP16)
    
    engine = builder.build_serialized_network(network, config)
    
    with open(output_path, 'wb') as f:
        f.write(engine)
    
    print(f"TensorRT engine created: {output_path}")
    return output_path


def check_duplicates(latitude: float, longitude: float, existing_potholes: List) -> Optional[int]:
    """
    Check if a pothole at given coordinates is a duplicate of existing records.
    
    Args:
        latitude: Latitude of new pothole
        longitude: Longitude of new pothole
        existing_potholes: List of existing pothole records
        
    Returns:
        ID of duplicate pothole if found, None otherwise
    """
    from .config import DUPLICATE_DISTANCE_THRESHOLD
    
    for pothole in existing_potholes:
        distance = math.sqrt(
            (latitude - pothole.latitude) ** 2 + 
            (longitude - pothole.longitude) ** 2
        )
        
        if distance <= DUPLICATE_DISTANCE_THRESHOLD:
            return pothole.id
    
    return None


def check_duplicates_with_image(latitude: float, longitude: float, existing_potholes: List, 
                                 image_path: str) -> Optional[int]:
    """
    Check for duplicates using both GPS coordinates and image similarity.
    
    Args:
        latitude: Latitude of new pothole
        longitude: Longitude of new pothole
        existing_potholes: List of existing pothole records
        image_path: Path to the new image
        
    Returns:
        ID of duplicate pothole if found, None otherwise
    """
    from .config import DUPLICATE_DISTANCE_THRESHOLD, DUPLICATE_SIMILARITY_THRESHOLD
    
    # First check GPS proximity
    gps_duplicates = []
    for pothole in existing_potholes:
        distance = math.sqrt(
            (latitude - pothole.latitude) ** 2 + 
            (longitude - pothole.longitude) ** 2
        )
        
        if distance <= DUPLICATE_DISTANCE_THRESHOLD:
            gps_duplicates.append(pothole)
    
    if not gps_duplicates:
        return None
    
    # If GPS duplicates found, check image similarity
    try:
        # Try to import skimage for structural similarity
        from skimage.metrics import structural_similarity as ssim
        SKIMAGE_AVAILABLE = True
    except ImportError:
        SKIMAGE_AVAILABLE = False
        print("Warning: scikit-image not available, using GPS-only duplicate detection")
    
    if not SKIMAGE_AVAILABLE:
        return gps_duplicates[0].id
    
    try:
        new_image = cv2.imread(image_path)
        if new_image is None:
            return gps_duplicates[0].id
        
        # Resize for comparison
        new_image = cv2.resize(new_image, (224, 224))
        new_gray = cv2.cvtColor(new_image, cv2.COLOR_BGR2GRAY)
        
        for pothole in gps_duplicates:
            if pothole.image_path and os.path.exists(pothole.image_path):
                existing_image = cv2.imread(pothole.image_path)
                if existing_image is not None:
                    existing_image = cv2.resize(existing_image, (224, 224))
                    existing_gray = cv2.cvtColor(existing_image, cv2.COLOR_BGR2GRAY)
                    
                    # Calculate structural similarity
                    similarity = ssim(new_gray, existing_gray)
                    
                    if similarity >= DUPLICATE_SIMILARITY_THRESHOLD:
                        return pothole.id
    except Exception:
        # If image comparison fails, fall back to GPS-only
        pass
    
    return gps_duplicates[0].id
