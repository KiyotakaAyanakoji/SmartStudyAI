# SmartStudy AI 🧠

A production-ready full-stack application designed to assist with studying. Leverage the power of modern AI to instantly generate summaries, interactive quizzes, study plans, and perform intelligent RAG (Retrieval-Augmented Generation) Q&A directly from your PDF documents!

## ✨ Features
- **Secure Authentication:** JWT-based login and registration.
- **Document Management:** Upload PDFs with instant background text extraction and vector chunking.
- **AI Study Tools:**
  - **Summarize:** Condense long PDFs into digestible bullet points.
  - **Dynamic Quizzes:** Test your knowledge with interactive, AI-generated multiple-choice quizzes.
  - **Study Plans:** Break your material down into structured day-by-day goals.
  - **Important Questions:** Extract the top 10 most crucial questions from any text.
- **Contextual Q&A (RAG):** Ask questions and get answers sourced strictly from your uploaded materials, complete with page citations.

## 🛠️ Tech Stack
- **Frontend:** React, Vite, TailwindCSS, React Router, Axios, Lucide React, React Hot Toast
- **Backend:** FastAPI, Python, SQLAlchemy, Uvicorn, SlowAPI (Rate Limiting)
- **Database:** PostgreSQL 16
- **Vector Storage:** ChromaDB
- **AI/LLM Engine:** Gemini API (`gemini-flash-latest` model)

## 🚀 How to Run Locally

### 1. Backend Setup

Ensure you have Python 3.10+ installed and a running PostgreSQL 16 database.

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure your environment variables (see below)
# Create a .env file based on the environment variables list

# Run the FastAPI server
uvicorn main:app --reload
```
The backend will run on `http://127.0.0.1:8000`. You can access the automatic Swagger docs at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup

Ensure you have Node.js 18+ installed.

```bash
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
The frontend will run on `http://localhost:5173`.

## 🔐 Environment Variables (`backend/.env`)

Create a `.env` file in the `backend/` directory and populate it with the following required variables:

- `PORT=8000`: The port the backend runs on.
- `DATABASE_URL`: Your PostgreSQL connection string. (e.g., `postgresql://postgres:password@localhost:5432/smartstudy`)
- `SECRET_KEY`: A strong, random string used to sign JWT tokens.
- `ALGORITHM`: JWT encoding algorithm (default: `HS256`).
- `ACCESS_TOKEN_EXPIRE_MINUTES`: How long sessions last (default: `30`).
- `CHROMA_DB_PATH`: The local path to store vector embeddings (default: `./chroma_db`).
- `GEMINI_API_KEY`: Your Google Gemini API key required for all LLM interactions.
