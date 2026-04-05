# Phase 1 Scaffold: Underlay Experiment Data API

This is the **Phase 1 data backbone scaffold** for the Underlay AI roadmap.

## What this provides
- Typed schema for experiment capture (`chemistry`, `process`, `outputs`, `metadata`).
- JSONL storage for fast local prototyping.
- FastAPI endpoints to create/list records and fetch dataset summary.

## Run locally
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

API docs: `http://127.0.0.1:8000/docs`

## Endpoints
- `GET /health`
- `GET /experiments`
- `POST /experiments`
- `GET /experiments/summary`

## Example payload for POST /experiments
```json
{
  "chemistry": {
    "segment_flexibility": 82,
    "crosslink_density": 34,
    "phonon_scatter_fraction": 74,
    "interfacial_slip_tuning": 73,
    "pore_anisotropy": 61
  },
  "process": {
    "foaming_temperature_c": 132,
    "cure_time_min": 16,
    "line_speed_m_per_min": 11
  },
  "outputs": {
    "tog": 0.96,
    "softness_index": 87,
    "compression_set_pct": 7.2,
    "fatigue_retention_pct": 91
  },
  "metadata": {
    "batch_id": "LAB-P1-004",
    "operator": "A. Chen",
    "lab_site": "R&D West",
    "test_standard": "ISO/BS Thermal + Internal Softness v2",
    "experiment_date": "2026-04-05",
    "notes": "Pilot candidate"
  }
}
```
