import requests
import json

base_url = "http://localhost:8000"

res = requests.post(f"{base_url}/api/auth/login", data={"username": "user1@gmail.com", "password": "password123"})
if res.status_code != 200:
    res = requests.post(f"{base_url}/api/auth/login", data={"username": "user1@gmail.com", "password": "password"})

token = res.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

doc_ids = ['72e1a2b5-4bae-4419-b68a-ab42f3fbfb17', '58a824ca-bad6-450b-b529-e296211f8589']
print("Testing summarize with docs:", doc_ids)
try:
    summ_res = requests.post(f"{base_url}/api/tools/summarize", json={"document_ids": doc_ids}, headers=headers, timeout=20)
    print("Status:", summ_res.status_code)
    print("Response:", summ_res.text[:300])
except Exception as e:
    print("Error:", e)
