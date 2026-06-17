import requests
from reportlab.pdfgen import canvas
import time

base_url = "http://localhost:8000"

c = canvas.Canvas("dummy.pdf")
c.drawString(100, 750, "This is a test PDF document.")
c.save()

# Register and login
requests.post(f"{base_url}/api/auth/register", json={
    "email": "testhang3@example.com", 
    "password": "password123", 
    "full_name": "Test Hang 3"
})

res = requests.post(f"{base_url}/api/auth/login", data={
    "username": "testhang3@example.com", 
    "password": "password123"
})
token = res.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

print("Uploading doc 1...")
with open("dummy.pdf", "rb") as f:
    res1 = requests.post(f"{base_url}/api/documents/upload", files={"file": ("dummy1.pdf", f, "application/pdf")}, headers=headers)
doc1_id = res1.json().get("id")

print("Uploading doc 2...")
with open("dummy.pdf", "rb") as f:
    res2 = requests.post(f"{base_url}/api/documents/upload", files={"file": ("dummy2.pdf", f, "application/pdf")}, headers=headers)
doc2_id = res2.json().get("id")

print("Waiting 10 seconds for chunks...")
time.sleep(10)

print(f"Doc1: {doc1_id}, Doc2: {doc2_id}")
print("Summarizing both...")
try:
    start = time.time()
    summ_res = requests.post(f"{base_url}/api/tools/summarize", json={"document_ids": [doc1_id, doc2_id]}, headers=headers, timeout=30)
    print("Time:", time.time() - start)
    print("Status:", summ_res.status_code)
    print("Response:", summ_res.text[:300])
except Exception as e:
    print("Error:", e)
