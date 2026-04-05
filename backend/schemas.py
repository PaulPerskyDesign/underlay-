from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class ChemistryControls(BaseModel):
    segment_flexibility: float = Field(ge=0, le=100)
    crosslink_density: float = Field(ge=0, le=100)
    phonon_scatter_fraction: float = Field(ge=0, le=100)
    interfacial_slip_tuning: float = Field(ge=0, le=100)
    pore_anisotropy: float = Field(ge=0, le=100)


class ProcessControls(BaseModel):
    foaming_temperature_c: float = Field(ge=0, le=300)
    cure_time_min: float = Field(ge=0, le=1000)
    line_speed_m_per_min: float = Field(ge=0, le=200)


class MeasuredOutputs(BaseModel):
    tog: float = Field(gt=0)
    softness_index: float = Field(ge=0, le=100)
    compression_set_pct: float = Field(ge=0, le=100)
    fatigue_retention_pct: float = Field(ge=0, le=100)


class ExperimentMetadata(BaseModel):
    batch_id: str = Field(min_length=1)
    operator: str = Field(min_length=1)
    lab_site: str = Field(min_length=1)
    test_standard: str = Field(min_length=1)
    experiment_date: date
    notes: Optional[str] = None


class ExperimentRecordIn(BaseModel):
    chemistry: ChemistryControls
    process: ProcessControls
    outputs: MeasuredOutputs
    metadata: ExperimentMetadata


class ExperimentRecord(ExperimentRecordIn):
    id: int
    created_at: datetime


class DatasetSummary(BaseModel):
    count: int
    min_tog: Optional[float] = None
    max_tog: Optional[float] = None
    min_softness_index: Optional[float] = None
    max_softness_index: Optional[float] = None
