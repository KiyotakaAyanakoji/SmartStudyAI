import requests
import json

base_url = "http://localhost:8000"

print("Logging in...")
res = requests.post(f"{base_url}/api/auth/login", data={"username": "test@example.com", "password": "password123"})
if res.status_code != 200:
    # Try creating user
    requests.post(f"{base_url}/api/auth/register", json={"email": "test@example.com", "password": "password123", "full_name": "Test"})
    res = requests.post(f"{base_url}/api/auth/login", data={"username": "test@example.com", "password": "password123"})

token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

print("Fetching documents...")
docs_res = requests.get(f"{base_url}/api/documents/", headers=headers)
docs = docs_res.json()

if not docs:
    print("No documents found for testing.")
else:
    doc_ids = [d["id"] for d in docs]
    print(f"Testing summarize for docs: {doc_ids}")
    
    try:
        summ_res = requests.post(f"{base_url}/api/tools/summarize", json={"document_ids": doc_ids}, headers=headers, timeout=10)
        print("Status:", summ_res.status_code)
        print("Response:", summ_res.text[:200])
    except Exception as e:
        print("Error during summarize:", e)
