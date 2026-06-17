import requests
import json
import time

base_url = "http://localhost:8000"

# Register and login
requests.post(f"{base_url}/api/auth/register", json={"email": "testmulti@example.com", "password": "password", "full_name": "Multi"})
res = requests.post(f"{base_url}/api/auth/login", data={"username": "testmulti@example.com", "password": "password"})
token = res.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

print("Uploading dummy document...")
files = {"file": ("test.txt", b"This is a test document with some content to summarize.", "text/plain")}
res = requests.post(f"{base_url}/api/documents/upload", files=files, headers=headers)
doc_id = res.json().get("id")
print("Doc uploaded:", doc_id)

time.sleep(2) # Wait for chunks

print("Calling summarize with single doc...")
res = requests.post(f"{base_url}/api/tools/summarize", json={"document_ids": [doc_id]}, headers=headers)
print(res.status_code)
print(res.text)

print("Calling summarize with multiple doc_ids (duplicate for testing)...")
res = requests.post(f"{base_url}/api/tools/summarize", json={"document_ids": [doc_id, doc_id]}, headers=headers)
print(res.status_code)
print(res.text)
