import joblib
import pandas as pd
import os

# Load ML models with error handling
models = {}
for name in ["diabetes", "heart", "hypertension", "cbc"]:
    path = f"models/{name}_model.pkl"
    if os.path.exists(path):
        try:
            models[name] = joblib.load(path)
        except Exception as e:
            print(f"Failed to load {name} model: {e}")
            models[name] = None
    else:
        print(f"Model {name} not found at {path}")
        models[name] = None

def predict_diabetes(patient):
    if not models.get("diabetes"):
        return -1 # Error code
    df = pd.DataFrame([patient])
    # Ensure columns match training order if necessary, but for now simple DF
    return int(models["diabetes"].predict(df)[0])

def predict_heart_disease(patient):
    if not models.get("heart"):
        return -1
    # Expected keys: age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal
    df = pd.DataFrame([patient])
    return int(models["heart"].predict(df)[0])

def predict_hypertension(patient):
    if not models.get("hypertension"):
        return -1
    # Expected keys: age, sex, bmi, heart_rate, activity_level, smoker, family_history
    df = pd.DataFrame([patient])
    return int(models["hypertension"].predict(df)[0])

def predict_cbc_condition(cbc_data):
    if not models.get("cbc"):
        return "Unknown"
    # Expected keys matching training data
    df = pd.DataFrame([cbc_data])
    return models["cbc"].predict(df)[0]
