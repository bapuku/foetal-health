"""
Differential privacy: add Laplace noise to aggregates. Epsilon=1.0 (medical standard).
"""
import random
from typing import Union

def _laplace(scale: float) -> float:
    u = random.uniform(-0.5, 0.5)
    return -scale * (1 if u < 0 else -1) * __import__("math").log(1 - 2 * abs(u))

def add_laplace_noise(value: float, sensitivity: float, epsilon: float = 1.0) -> float:
    """Add Laplace noise for (epsilon)-differential privacy."""
    scale = sensitivity / epsilon
    return value + _laplace(scale)
