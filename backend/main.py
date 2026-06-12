from fastapi import FastAPI

app = FastAPI(title="SmartStudy AI")

@app.get("/")
def read_root():
    return {"message": "Welcome to SmartStudy AI API"}
