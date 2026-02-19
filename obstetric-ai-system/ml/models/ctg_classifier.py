"""
CTG Classifier - 1D-CNN + BiLSTM + Attention for FIGO classification (Normal/Suspect/Pathologique).
Input: FHR signal 4Hz time series. Output: probabilities [Normal, Suspect, Pathologique].
"""
import torch
import torch.nn as nn
from typing import Tuple

# Default: 60s at 4Hz = 240 timesteps, 1 channel (FHR)
INPUT_LEN = 240
INPUT_CHANNELS = 1
NUM_CLASSES = 3


class CTGClassifier(nn.Module):
    def __init__(
        self,
        input_len: int = INPUT_LEN,
        input_channels: int = INPUT_CHANNELS,
        num_classes: int = NUM_CLASSES,
        lstm_hidden: int = 128,
        lstm_layers: int = 2,
        dropout: float = 0.3,
    ):
        super().__init__()
        self.input_len = input_len
        self.conv = nn.Sequential(
            nn.Conv1d(input_channels, 64, kernel_size=7, padding=3),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Conv1d(64, 128, kernel_size=5, padding=2),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Conv1d(128, 256, kernel_size=3, padding=1),
            nn.BatchNorm1d(256),
            nn.ReLU(),
        )
        self.lstm = nn.LSTM(
            256, lstm_hidden, num_layers=lstm_layers, batch_first=True, bidirectional=True, dropout=dropout
        )
        self.attention = nn.MultiheadAttention(embed_dim=lstm_hidden * 2, num_heads=8, batch_first=True)
        self.fc = nn.Linear(lstm_hidden * 2, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (B, 1, T)
        x = self.conv(x)
        # (B, 256, T) -> (B, T, 256)
        x = x.transpose(1, 2)
        x, _ = self.lstm(x)
        x, _ = self.attention(x, x, x)
        x = x.mean(dim=1)
        return self.fc(x)

    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        logits = self.forward(x)
        return torch.softmax(logits, dim=-1)

    def predict(self, x: torch.Tensor) -> torch.Tensor:
        return self.predict_proba(x).argmax(dim=-1)


def build_ctg_classifier(**kwargs) -> CTGClassifier:
    return CTGClassifier(**kwargs)
