import json
from datetime import datetime, timezone
from pathlib import Path
from typing import List

from schemas import DatasetSummary, ExperimentRecord, ExperimentRecordIn


class JsonlExperimentStore:
    """Simple file-based store for Phase 1 data capture."""

    def __init__(self, path: Path):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.touch()

    def _read_rows(self) -> List[dict]:
        rows: List[dict] = []
        with self.path.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                rows.append(json.loads(line))
        return rows

    def list(self) -> List[ExperimentRecord]:
        return [ExperimentRecord(**row) for row in self._read_rows()]

    def add(self, payload: ExperimentRecordIn) -> ExperimentRecord:
        rows = self._read_rows()
        next_id = (max((row["id"] for row in rows), default=0) + 1)
        record = ExperimentRecord(
            id=next_id,
            created_at=datetime.now(timezone.utc),
            **payload.model_dump(),
        )
        with self.path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(record.model_dump(mode="json")) + "\n")
        return record

    def summary(self) -> DatasetSummary:
        rows = self._read_rows()
        if not rows:
            return DatasetSummary(count=0)

        togs = [row["outputs"]["tog"] for row in rows]
        softness = [row["outputs"]["softness_index"] for row in rows]
        return DatasetSummary(
            count=len(rows),
            min_tog=min(togs),
            max_tog=max(togs),
            min_softness_index=min(softness),
            max_softness_index=max(softness),
        )
