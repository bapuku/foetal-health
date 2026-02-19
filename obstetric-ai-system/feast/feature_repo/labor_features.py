"""Labor features for Feast feature store."""
from datetime import timedelta
from feast import FeatureView, Field, ValueType
from feast.types import Float32, Int32

labor_features = FeatureView(
    name="labor_features",
    entities=["patient_id"],
    ttl=timedelta(days=30),
    schema=[
        Field(name="bishop_score", dtype=Int32),
        Field(name="cervical_dilation_cm", dtype=Float32),
        Field(name="cervical_effacement_pct", dtype=Float32),
        Field(name="labor_duration_hours", dtype=Float32),
        Field(name="contraction_frequency_per_10min", dtype=Float32),
    ],
    source=None,
)
