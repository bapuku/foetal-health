"""Fetal features for Feast feature store."""
from datetime import timedelta
from feast import Entity, FeatureView, Field, ValueType
from feast.types import Float32, Int32

patient_entity = Entity(name="patient_id", value_type=ValueType.STRING, description="Patient identifier")

fetal_features = FeatureView(
    name="fetal_features",
    entities=["patient_id"],
    ttl=timedelta(days=365),
    schema=[
        Field(name="fhr_baseline_bpm", dtype=Float32),
        Field(name="fhr_variability_stv", dtype=Float32),
        Field(name="fhr_variability_ltv", dtype=Float32),
        Field(name="decelerations_light", dtype=Float32),
        Field(name="decelerations_severe", dtype=Float32),
        Field(name="estimated_fetal_weight_g", dtype=Float32),
        Field(name="percentile_weight", dtype=Float32),
    ],
    source=None,
)
