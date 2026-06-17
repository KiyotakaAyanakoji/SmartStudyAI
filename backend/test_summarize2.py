import requests
import json
import time

base_url = "http://localhost:8000"

# Register and login
res = requests.post(f"{base_url}/api/auth/login", data={"username": "testmulti@example.com", "password": "password"})
token = res.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

print("Fetching documents...")
docs_res = requests.get(f"{base_url}/api/documents/", headers=headers)
docs = docs_res.json()

if not docs:
    print("No docs found")
else:
    doc_id = docs[0]["id"]
    print("Testing summarize with real doc_id:", doc_id)
    try:
        summ_res = requests.post(f"{base_url}/api/tools/summarize", json={"document_ids": [doc_id]}, headers=headers, timeout=10)
        print("Status:", summ_res.status_code)
        print("Response:", summ_res.text[:200])
    except Exception as e:
        print("Error:", e)
