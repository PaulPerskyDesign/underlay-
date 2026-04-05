from pathlib import Path
from typing import List

from fastapi import FastAPI

from schemas import DatasetSummary, ExperimentRecord, ExperimentRecordIn
from storage import JsonlExperimentStore

app = FastAPI(title="Underlay AI Data API", version="0.1.0")
store = JsonlExperimentStore(Path(__file__).parent / "data" / "experiments.jsonl")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/experiments", response_model=List[ExperimentRecord])
def list_experiments() -> List[ExperimentRecord]:
    return store.list()


@app.post("/experiments", response_model=ExperimentRecord)
def create_experiment(payload: ExperimentRecordIn) -> ExperimentRecord:
    return store.add(payload)


@app.get("/experiments/summary", response_model=DatasetSummary)
def experiment_summary() -> DatasetSummary:
    return store.summary()
