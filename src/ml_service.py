import joblib
import pandas as pd

# Load ML model once
model = joblib.load("models/diabetes_model.pkl")

def predict_diabetes(patient):
    df = pd.DataFrame([patient])
    prediction = model.predict(df)
    return int(prediction[0])
