"""Maternal features for Feast feature store."""
from datetime import timedelta
from feast import Entity, Feature, FeatureView, Field, ValueType
from feast.types import Float32, Int32
from google.protobuf.duration_pb2 import Duration

# Entity: patient/encounter
patient_entity = Entity(
    name="patient_id",
    value_type=ValueType.STRING,
    description="Patient identifier",
)

maternal_features = FeatureView(
    name="maternal_features",
    entities=["patient_id"],
    ttl=timedelta(days=365),
    schema=[
        Field(name="maternal_age", dtype=Int32),
        Field(name="bmi", dtype=Float32),
        Field(name="parity", dtype=Int32),
        Field(name="gestational_age_weeks", dtype=Int32),
        Field(name="previous_cesarean", dtype=Int32),
        Field(name="preeclampsia", dtype=Int32),
        Field(name="gestational_diabetes", dtype=Int32),
    ],
    source=None,  # Set to BatchSource in repo
)
