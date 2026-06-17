import requests
import time

base_url = "http://localhost:8000"

print("Registering...")
requests.post(f"{base_url}/api/auth/register", json={
    "email": "testhang@example.com", 
    "password": "password123", 
    "full_name": "Test Hang"
})

print("Logging in...")
res = requests.post(f"{base_url}/api/auth/login", data={
    "username": "testhang@example.com", 
    "password": "password123"
})
token = res.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

print("Uploading doc 1...")
res1 = requests.post(f"{base_url}/api/documents/upload", files={"file": ("doc1.txt", b"First doc content.", "text/plain")}, headers=headers)
doc1_id = res1.json().get("id")

print("Uploading doc 2...")
res2 = requests.post(f"{base_url}/api/documents/upload", files={"file": ("doc2.txt", b"Second doc content.", "text/plain")}, headers=headers)
doc2_id = res2.json().get("id")

print(f"Doc1: {doc1_id}, Doc2: {doc2_id}")
time.sleep(3) # Wait for chunks to be processed in background

print("Summarizing both...")
try:
    start = time.time()
    summ_res = requests.post(f"{base_url}/api/tools/summarize", json={"document_ids": [doc1_id, doc2_id]}, headers=headers)
    print("Time:", time.time() - start)
    print("Status:", summ_res.status_code)
    print("Response:", summ_res.text[:300])
except Exception as e:
    print("Error:", e)
