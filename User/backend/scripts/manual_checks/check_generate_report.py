import os
import requests

BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8003")
login_resp = requests.post(f'{BASE_URL}/api/auth/login', json={'username': 'admin', 'password': 'admin123'})
token = login_resp.json()['access_token']
headers = {'Authorization': 'Bearer ' + token}

# Generate report for pothole 1
resp = requests.post(f'{BASE_URL}/api/potholes/1/report', headers=headers)
print('Generate report:', resp.status_code)
if resp.status_code == 200:
    print('Report:', resp.json())
else:
    print(resp.text)

# Get reports again
resp = requests.get(f'{BASE_URL}/api/reports', headers=headers)
print('Reports:', resp.status_code)
if resp.status_code == 200:
    for r in resp.json():
        print('  ID: ' + str(r['id']) + ', Pothole: ' + str(r['pothole_id']) + ', Path: ' + str(r['report_path']))
