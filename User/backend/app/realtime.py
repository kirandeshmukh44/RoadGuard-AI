"""
Real-time Camera Detection and WebSocket Support
"""

import asyncio
import base64
import json
import cv2
import numpy as np
from typing import Set
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime

# Connection manager for WebSockets
class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.camera_tasks: dict = {}
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        # Stop any camera task for this connection
        if websocket in self.camera_tasks:
            self.camera_tasks[websocket].cancel()
            del self.camera_tasks[websocket]
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_json(message)
        except:
            self.disconnect(websocket)
    
    async def broadcast(self, message: dict):
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                disconnected.add(connection)
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()


async def process_camera_stream(websocket: WebSocket, camera_id: int = 0, frame_skip: int = 5):
    """
    Process camera stream and send detections via WebSocket.
    
    Args:
        websocket: WebSocket connection
        camera_id: Camera device ID (0 for default webcam)
        frame_skip: Process every Nth frame
    """
    cap = cv2.VideoCapture(camera_id)
    if not cap.isOpened():
        await manager.send_personal_message({
            "type": "error",
            "message": f"Cannot open camera {camera_id}"
        }, websocket)
        return
    
    frame_count = 0
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            
            # Process every Nth frame
            if frame_count % frame_skip == 0:
                # Run detection
                result = detector.detect_realtime_frame(frame)
                
                # Send result via WebSocket
                await manager.send_personal_message({
                    "type": "detection",
                    "timestamp": datetime.now().isoformat(),
                    "frame": frame_count,
                    "data": result
                }, websocket)
                
                # If high severity, also broadcast to all
                if result.get("severity") == "high":
                    await manager.broadcast({
                        "type": "alert",
                        "level": "high",
                        "message": f"High severity pothole detected on camera {camera_id}",
                        "data": result,
                        "timestamp": datetime.now().isoformat()
                    })
            
            # Small delay to prevent overwhelming
            await asyncio.sleep(0.01)
            
    except asyncio.CancelledError:
        pass
    except Exception as e:
        await manager.send_personal_message({
            "type": "error",
            "message": f"Camera processing error: {str(e)}"
        }, websocket)
    finally:
        cap.release()
        if websocket in manager.camera_tasks:
            del manager.camera_tasks[websocket]


def encode_frame_to_base64(frame: np.ndarray) -> str:
    """Encode OpenCV frame to base64 string for WebSocket transmission"""
    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
    return base64.b64encode(buffer).decode('utf-8')


# WebSocket endpoint handler
async def websocket_endpoint(websocket: WebSocket, camera_id: int = 0):
    await manager.connect(websocket)
    try:
        # Send welcome message
        await manager.send_personal_message({
            "type": "connected",
            "message": "Connected to real-time detection",
            "camera_id": camera_id
        }, websocket)
        
        # Listen for commands
        while True:
            data = await websocket.receive_json()
            
            if data.get("command") == "start_camera":
                cam_id = data.get("camera_id", 0)
                skip = data.get("frame_skip", 5)
                
                # Cancel existing task if any
                if websocket in manager.camera_tasks:
                    manager.camera_tasks[websocket].cancel()
                
                # Start new camera task
                task = asyncio.create_task(process_camera_stream(websocket, cam_id, skip))
                manager.camera_tasks[websocket] = task
                
                await manager.send_personal_message({
                    "type": "camera_started",
                    "camera_id": cam_id,
                    "frame_skip": skip
                }, websocket)
            
            elif data.get("command") == "stop_camera":
                if websocket in manager.camera_tasks:
                    manager.camera_tasks[websocket].cancel()
                    del manager.camera_tasks[websocket]
                
                await manager.send_personal_message({
                    "type": "camera_stopped"
                }, websocket)
            
            elif data.get("command") == "detect_frame":
                # Single frame detection from base64
                frame_data = data.get("frame")
                if frame_data:
                    # Decode base64 frame
                    try:
                        frame_bytes = base64.b64decode(frame_data)
                        nparr = np.frombuffer(frame_bytes, np.uint8)
                        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                        
                        if frame is not None:
                            result = detector.detect_realtime_frame(frame)
                            await manager.send_personal_message({
                                "type": "detection",
                                "timestamp": datetime.now().isoformat(),
                                "data": result
                            }, websocket)
                    except Exception as e:
                        await manager.send_personal_message({
                            "type": "error",
                            "message": f"Frame decode error: {str(e)}"
                        }, websocket)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)
        print(f"WebSocket error: {e}")