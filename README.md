# 🌿 Netra Vision: Autonomous Plant Health Analytics

Netra Vision is an AI-powered agricultural telemetry application designed to detect crop diseases and recommend actionable treatments. By leveraging a multimodal Large Language Model (LLM) and an asynchronous cloud backend, the system analyzes raw botanical imagery, extracts structured health diagnostics, and maintains a persistent chronological archive of crop telemetry.

**Live Demo:** https://netra-vision.vercel.app/

**API Endpoint:** https://netra-vision-crop-disease-management.onrender.com/

---

## 🚀 Key Features

*   **Multimodal AI Diagnostics:** Processes raw image bytes through Google Gemini (Vision) to extract structured JSON data detailing crop species, pathogen signatures, and severity ratings.
*   **Asynchronous Data Pipeline:** Built on FastAPI and Motor (AsyncIO) to handle concurrent cloud media uploads and database operations without blocking the main event loop.
*   **Cloud Media Vault:** Automatically securely routes in-memory image uploads directly to Cloudinary for optimized delivery and storage.
*   **Chronological Telemetry Archive:** Maintains a persistent, interactive history of all diagnostic scans in a NoSQL MongoDB Atlas cluster.
*   **Responsive UI/UX:** Features drag-and-drop mechanics, real-time toast notifications, and dynamic atmospheric styling built with React and Tailwind CSS.

---

## 🛠 System Architecture & Tech Stack

Netra Vision is built as a **Monorepo**, housing both the client application and the API service in a unified version-controlled environment.

### Frontend (Client)
*   **Framework:** React 18 + Vite (for optimized build times)
*   **Styling:** Tailwind CSS + Lucide Icons
*   **Deployment:** Vercel

### Backend (API & Data)
*   **Framework:** Python 3 + FastAPI 
*   **Server:** Uvicorn (ASGI)
*   **AI Engine:** Google Generative AI (Gemini 3.6 Flash)
*   **Database:** MongoDB Atlas
*   **Cloud Storage:** Cloudinary
*   **Deployment:** Render

---

## 🔄 Data Flow & Processing Pipeline

1.  **Ingestion:** The user uploads a specimen image via the React client.
2.  **Routing:** FastAPI receives the `multipart/form-data` file into memory.
3.  **Parallel Processing (Async):** 
    *   The file is uploaded to Cloudinary, generating a secure CDN URL.
    *   The raw byte array is concurrently passed to the Gemini Vision model alongside a rigid system prompt for zero-shot classification.
4.  **Data Structuring:** The backend parses the LLM's raw markdown output into structured JSON.
5.  **Persistence:** The Cloudinary URL and structured diagnosis are merged into a single document and saved to MongoDB Atlas.
6.  **Delivery:** The completed telemetry record is returned to the client and rendered in the UI.

---

## 💻 Local Development Setup

### Prerequisites
*   Node.js (v18+)
*   Python (3.10+)
*   MongoDB Atlas Account
*   Cloudinary Account
*   Google AI Studio API Key

### 1. Clone the Repository
```bash
git clone [https://github.com/sharmaroshan29/netra-vision.git](https://github.com/sharmaroshn29/netra-vision.git)
cd netra-vision
cd app
python -m venv venv
source  venv\Scripts\activate
pip install -r requirements.txt