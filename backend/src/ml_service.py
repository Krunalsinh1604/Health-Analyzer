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

def get_prediction_insights(model, df):
    prediction = model.predict(df)[0]
    
    probability = 0.0
    if hasattr(model, "predict_proba"):
        proba_array = model.predict_proba(df)[0]
        probability = float(max(proba_array))
        
    algorithm = type(model).__name__
    
    return {
        "prediction": prediction,
        "probability": round(probability * 100, 2),
        "algorithm": algorithm
    }

def predict_diabetes(patient):
    if not models.get("diabetes"):
        return {"prediction": -1, "probability": 0.0, "algorithm": "Unknown"}
    df = pd.DataFrame([patient])
    insights = get_prediction_insights(models["diabetes"], df)
    insights["prediction"] = int(insights["prediction"])
    return insights

def predict_heart_disease(patient):
    if not models.get("heart"):
        return {"prediction": -1, "probability": 0.0, "algorithm": "Unknown"}
    # Expected keys: age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal
    df = pd.DataFrame([patient])
    insights = get_prediction_insights(models["heart"], df)
    insights["prediction"] = int(insights["prediction"])
    return insights

def predict_hypertension(patient):
    if not models.get("hypertension"):
        return {"prediction": -1, "probability": 0.0, "algorithm": "Unknown"}
    # Expected keys: age, sex, bmi, heart_rate, activity_level, smoker, family_history
    df = pd.DataFrame([patient])
    insights = get_prediction_insights(models["hypertension"], df)
    insights["prediction"] = int(insights["prediction"])
    return insights

def predict_cbc_condition(cbc_data):
    if not models.get("cbc"):
        return {"prediction": "Unknown", "probability": 0.0, "algorithm": "Unknown"}
    # Expected keys matching training data
    df = pd.DataFrame([cbc_data])
    insights = get_prediction_insights(models["cbc"], df)
    return insights
