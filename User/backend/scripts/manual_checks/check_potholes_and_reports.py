import os
import requests

BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8003")
login_resp = requests.post(f'{BASE_URL}/api/auth/login', json={'username': 'admin', 'password': 'admin123'})
token = login_resp.json()['access_token']
headers = {'Authorization': 'Bearer ' + token}

# Get all potholes
resp = requests.get(f'{BASE_URL}/api/potholes', headers=headers)
print('Potholes:', resp.status_code)
if resp.status_code == 200:
    for p in resp.json():
        print('  ID: ' + str(p['id']) + ', Road: ' + str(p['road_name']) + ', Status: ' + str(p['status']) + ', Severity: ' + str(p['severity']) + ', Method: ' + str(p['detection_method']))

# Get my potholes
resp = requests.get(f'{BASE_URL}/api/users/me/potholes', headers=headers)
print('My potholes:', resp.status_code)
if resp.status_code == 200:
    for p in resp.json():
        print('  ID: ' + str(p['id']) + ', Road: ' + str(p['road_name']))

# Get reports
resp = requests.get(f'{BASE_URL}/api/reports', headers=headers)
print('Reports:', resp.status_code)
if resp.status_code == 200:
    for r in resp.json():
        print('  ID: ' + str(r['id']) + ', Pothole: ' + str(r['pothole_id']) + ', Path: ' + str(r['report_path']))
