"""
Central configuration for GridScan analytics engine.

Every value here is a DEFAULT that can be overridden per-request via the
`AnalysisParams` payload sent to POST /analyze. Nothing here is a hardcoded
result — these are algorithm/engineering knobs, not KPIs or output values.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- Server ---
    app_name: str = "GridScan Analytics API"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    upload_dir: str = "uploads"
    max_upload_mb: int = 512

    # --- LAS/LAZ classification scheme (from the source dataset) ---
    pole_class: int = 18
    conductor_classes: list[int] = [20, 21]
    ground_class: int = 2
    other_class: int = 9

    # --- Pole detection (DBSCAN) ---
    pole_dbscan_eps: float = 0.5
    pole_dbscan_min_samples: int = 10

    # --- Conductor extraction ---
    span_crop_buffer_m: float = 2.0
    conductor_dbscan_eps: float = 0.5
    conductor_dbscan_min_samples: int = 10
    min_conductor_points: int = 20  # clusters smaller than this are discarded as noise

    # --- Sag / curve fitting ---
    curve_fit_degree: int = 2  # parabolic fit, matches the notebook's np.polyfit(y, z, 2)

    # --- Energy loss engineering constants (all configurable per analysis) ---
    current_amps: float = 250.0
    resistance_per_km_ohm: float = 0.15
    initial_sag_m: float = 0.09  # reference/baseline sag used for Additional_Sag comparison

    # --- Point cloud viewer ---
    pointcloud_max_points_default: int = 200_000

    class Config:
        env_prefix = "GRIDSCAN_"


settings = Settings()
