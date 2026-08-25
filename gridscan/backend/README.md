# GridScan Backend — Stage 1

FastAPI backend implementing the LiDAR powerline sag & energy loss analytics
pipeline, ported from the original notebook (`powerline_sag_and_pose_analysis.py`).

## What's implemented in this stage

- `POST /analyze` — upload a `.las`/`.laz` file (+ optional JSON `params`), runs the full pipeline synchronously
- `GET /analysis/{id}` — full structured JSON result (poles, spans, conductors, KPIs)
- `GET /analysis/{id}/pointcloud` — downsampled, classification-filtered points for the 3D viewer
- `GET /report/{id}` — stub returning the same result shape (report layout/PDF export comes once the frontend Reports page is wired up)

Pipeline steps ported 1:1 from the notebook:
1. `las_loader.py` — parse LAS/LAZ, extract X/Y/Z + classification
2. `pole_detection.py` — DBSCAN cluster the pole class, center = mean, height = max(Z)-min(Z), sorted along corridor
3. `span_generation.py` — adjacent pole pairs, 3D pole-to-pole distance
4. `conductor_extraction.py` — bbox crop per span + DBSCAN → individual conductors, parabolic `np.polyfit` sag fit, wire length via summed segment distances
5. `energy_loss.py` — exact formulas from the notebook: `expansion = wire_length - pole_distance`, `R = R_per_km * expansion / 1000`, `P = I²R`, `annual_kWh = P * 24 * 365 / 1000`

Every constant (DBSCAN eps/min_samples, class IDs, current, resistance, initial sag) is a request parameter with a config-file default — nothing is hardcoded into the calculations.

## Running it

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Testing it

```bash
pip install pytest
pytest tests/ -v
```

Tests run against a **synthetic** LAS fixture built in `tests/conftest.py` with
known pole positions/heights and a known parabolic sag profile — this is a
test fixture only, not sample/demo data used by the app itself. It exists so
we can assert the pipeline recovers ground-truth numbers, since no real
`clip.las` was available in this environment. All 13 tests pass; verified
also via a live HTTP round trip (`curl` against a running `uvicorn` instance).

## A known edge case to watch for on real data

With the default `span_crop_buffer_m = 2.0`, if two adjacent spans' conductors
both terminate very close to a shared pole, the buffer zone can pick up a
handful of stray points from the neighboring span's wire, which DBSCAN then
reports as a tiny extra "conductor" cluster. `min_conductor_points` filters
most of this out, but it's worth watching on your real dataset — if you see
a spurious low-point-count conductor per span, lowering `span_crop_buffer_m`
(e.g. to 0.5) is the fix.

## Not yet built (next stages)

- Frontend wiring (`index.tsx`, `assets.tsx`, `spans.tsx`, `energy.tsx`) to replace hardcoded consts with fetched data
- React Three Fiber point cloud viewer
- Report PDF export
- Background/async processing for very large files (currently synchronous)
