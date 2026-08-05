"""Train the active backend model from the approved, cleaned schema.

Run from the repository root:
    python backend/ml_models/train_ahmedabad_model.py
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from bricklytics_model.train_model import main


if __name__ == '__main__':
    result = main(
        data_path=ROOT / 'bricklytics_model' / 'data' / 'clean_properties.csv',
        model_out=Path(__file__).resolve().parent / 'price_model.joblib',
        metrics_out=Path(__file__).resolve().parent / 'model_comparison.json',
    )
    print(result)
