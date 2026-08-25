# GridScan — LiDAR Powerline Sag & Energy Loss Analytics

Full-stack rebuild of the GridScan dashboard: a FastAPI backend running your
real point-cloud engineering pipeline, and a React frontend that renders
only what the backend returns — no hardcoded values anywhere.

```
gridscan/
├── backend/     FastAPI app — pole detection, span/conductor extraction,
│                sag analysis, energy-loss formulas (ported from your notebook)
└── frontend/    React + Vite dashboard (original dark UI theme preserved)
```

## Running it locally

**1. Backend** (from `backend/`):
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**2. Frontend** (from `frontend/`):
```bash
npm install
cp .env.example .env   # points VITE_API_BASE_URL at the backend above
npm run dev
```
Uses `three`, `@react-three/fiber`, and `@react-three/drei` for the WebGL
point cloud viewer — installed automatically by `npm install`.

Then open the frontend dev URL, upload a `.las`/`.laz` file, and the Home
page will show live results from the backend.

## Current status

| Page | Status |
|---|---|
| Backend API (`/analyze`, `/analysis/{id}`, `/analysis/{id}/pointcloud`, `/report/{id}`) | ✅ Fully dynamic, tested |
| Home dashboard | ✅ Fully dynamic — wired to live `AnalysisResult` |
| Assets (pole/span inventory) | ⏳ Not yet wired — still shows original demo data |
| Spans (wire length/sag detail) | ⏳ Not yet wired |
| Energy Loss | ⏳ Not yet wired — still has the typed-in sample table |
| Viewer (point cloud, WebGL) | ✅ Fully dynamic — real Three.js/WebGL point cloud, orbit/pan/zoom, class filtering, Top/Side/3D views |
| Reports | ⏳ Not yet wired |

See `backend/README.md` and the project conversation for details on each
piece and the plan for the remaining pages.
