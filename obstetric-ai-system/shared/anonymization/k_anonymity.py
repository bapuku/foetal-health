"""
k-anonymity (k>=5): ensure at least k patients share same quasi-identifiers.
"""
from typing import Any

def _bucket(value: float, step: float) -> float:
    return round(value / step) * step

def check_k_anonymity(rows: list[dict], quasi_ids: list[str], k: int = 5) -> bool:
    """Check if dataset satisfies k-anonymity for given quasi-identifiers."""
    from collections import Counter
    keys = []
    for row in rows:
        key = tuple(row.get(q) for q in quasi_ids)
        keys.append(key)
    counts = Counter(keys)
    return all(c >= k for c in counts.values())

def anonymize_for_k(age: float, bmi: float, ga_weeks: float) -> tuple[float, float, float]:
    """Bucket quasi-identifiers: age ±5, BMI ±2, GA ±1 week (k>=5)."""
    return _bucket(age, 5), _bucket(bmi, 2), _bucket(ga_weeks, 1)
