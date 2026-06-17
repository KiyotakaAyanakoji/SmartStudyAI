import requests
import time

print("Testing backend...")
try:
    start = time.time()
    res = requests.get("http://localhost:8000/api/health", timeout=5)
    print("Health check:", res.status_code, res.text)
    print(f"Time: {time.time()-start:.2f}s")
except Exception as e:
    print("Error:", e)
