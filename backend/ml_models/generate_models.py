"""Deprecated compatibility command.

Synthetic price or appreciation data must never be generated for Bricklytics.
Use the approved dataset trainer instead.
"""
from pathlib import Path
import runpy


def train_and_save_models():
    trainer = Path(__file__).with_name('train_ahmedabad_model.py')
    runpy.run_path(str(trainer), run_name='__main__')


if __name__ == '__main__':
    train_and_save_models()
