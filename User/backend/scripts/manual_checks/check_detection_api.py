import os
import requests
import io
from PIL import Image

BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8003")

# Login first
print("Testing login...")
response = requests.post(f"{BASE_URL}/api/auth/login", json={
    "username": "testuser2",
    "password": "password123"
})
print(f"Login: {response.status_code}")
data = response.json()
token = data.get("access_token")

# Create a test image
print("\nCreating test image...")
img = Image.new('RGB', (640, 480), color='gray')
# Add some darker rectangles to simulate potholes
from PIL import ImageDraw
draw = ImageDraw.Draw(img)
draw.rectangle([100, 100, 200, 150], fill='darkgray')
draw.rectangle([300, 200, 400, 280], fill='darkgray')
draw.rectangle([500, 300, 580, 350], fill='darkgray')

img_bytes = io.BytesIO()
img.save(img_bytes, format='JPEG')
img_bytes.seek(0)

# Test detect endpoint
print("\nTesting detect endpoint...")
headers = {"Authorization": f"Bearer {token}"}
files = {"file": ("test.jpg", img_bytes, "image/jpeg")}
data = {"latitude": "12.9716", "longitude": "77.5946", "road_name": "Test Road"}

response = requests.post(f"{BASE_URL}/api/detect", headers=headers, files=files, data=data)
print(f"Detect: {response.status_code}")
result = response.json()
print(f"Potholes detected: {result.get('potholes_detected')}")
print(f"Severity: {result.get('severity')}")
print(f"Confidence: {result.get('confidence')}")
print(f"Message: {result.get('message')}")
print(f"Image path: {result.get('image_path')}")
print(f"Annotated image path: {result.get('annotated_image_path')}")
print(f"Bounding boxes: {result.get('bounding_boxes')}")

# Test if annotated image is accessible
if result.get('annotated_image_path'):
    print("\nTesting annotated image access...")
    img_response = requests.get(f"{BASE_URL}{result['annotated_image_path']}")
    print(f"Annotated image: {img_response.status_code}, Size: {len(img_response.content)} bytes")

# Test if original image is accessible
if result.get('image_path'):
    print("\nTesting original image access...")
    img_response = requests.get(f"{BASE_URL}{result['image_path']}")
    print(f"Original image: {img_response.status_code}, Size: {len(img_response.content)} bytes")
