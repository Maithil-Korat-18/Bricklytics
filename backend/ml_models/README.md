# ml_models/
# ==========
# This directory stores trained scikit-learn model files (.joblib / .pkl).
#
# Naming convention:
#   <model_type>_v<version>.joblib
#
# Examples:
#   price_predictor_v1.joblib
#   property_recommender_v1.joblib
#
# Loading pattern (in a service):
#   import joblib
#   from django.conf import settings
#
#   model = joblib.load(settings.ML_MODELS_DIR / 'price_predictor_v1.joblib')
#   prediction = model.predict([[feature1, feature2, ...]])
