# 🚀 Deployment Guide: ReDessIo TrueForge Agent Harness

This project is configured to run as a **single unified container** (React Frontend + FastAPI Backend) or as split cloud services.

---

## 🌟 Option 1: Deploy on Render (Free & Recommended)
Render can build and host both your frontend and backend in 1 service using the included `Dockerfile`.

1. Push your repository to **GitHub**:
   ```bash
   git add .
   git commit -m "feat: complete project ready for deployment"
   git push origin main
   ```
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Select **Docker** runtime.
5. In **Environment Variables**, add:
   - `GROQ_API_KEY`: `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`
   - `GROQ_MODEL`: `openai/gpt-oss-120b`
6. Click **Deploy Web Service**.
7. Render will automatically build the React frontend, package the FastAPI backend, and give you a live HTTPS link (e.g., `https://redessio-agent.onrender.com`).

---

## 🚆 Option 2: Deploy on Railway
1. Go to [Railway.app](https://railway.app/).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Railway will detect the `Dockerfile`.
4. Add the environment variables:
   - `GROQ_API_KEY`: `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`
   - `GROQ_MODEL`: `openai/gpt-oss-120b`
5. Click **Deploy**. Railway will provide a public domain.

---

## 🐳 Option 3: Deploy Locally or on a VPS with Docker
You can run the full production build with a single command:

```bash
docker compose up --build
```
Your application will be live at `http://localhost:8000`.

---

## ⚡ Option 4: Split Deployment (Vercel Frontend + Render Backend)
If you prefer hosting the React frontend on **Vercel**:
1. **Backend on Render**:
   - Deploy the Python FastAPI backend on Render with command: `uvicorn api.app:app --host 0.0.0.0 --port $PORT`
2. **Frontend on Vercel**:
   - In Vercel, set root directory to `frontend`.
   - Set Build Command: `npm run build`
   - Output Directory: `dist`
   - Set environment variable `VITE_API_URL` pointing to your Render backend URL.
