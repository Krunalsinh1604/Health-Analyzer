import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

def train_heart_model():
    print("\n--- Training Heart Disease Model ---")
    try:
        df = pd.read_csv('data/processed/synthetic_heart.csv')
        X = df.drop('target', axis=1)
        y = df['target']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        model = LogisticRegression(max_iter=1000)
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        print(f"Heart Model Accuracy: {accuracy_score(y_test, y_pred):.2f}")
        
        joblib.dump(model, 'models/heart_model.pkl')
        print("Heart model saved.")
    except Exception as e:
        print(f"Error training heart model: {e}")

def train_hypertension_model():
    print("\n--- Training Hypertension Model ---")
    try:
        df = pd.read_csv('data/processed/synthetic_hypertension.csv')
        # Drop target AND vitals that are not part of the risk profile form (systolic/diastolic)
        X = df.drop(['target', 'systolic', 'diastolic'], axis=1)
        y = df['target']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        print(f"Hypertension Model Accuracy: {accuracy_score(y_test, y_pred):.2f}")
        
        joblib.dump(model, 'models/hypertension_model.pkl')
        print("Hypertension model saved.")
    except Exception as e:
        print(f"Error training hypertension model: {e}")

def train_cbc_model():
    print("\n--- Training CBC Model ---")
    try:
        df = pd.read_csv('data/processed/synthetic_cbc.csv')
        X = df.drop('condition', axis=1)
        y = df['condition']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        print(f"CBC Model Accuracy: {accuracy_score(y_test, y_pred):.2f}")
        
        joblib.dump(model, 'models/cbc_model.pkl')
        print("CBC model saved.")
    except Exception as e:
        print(f"Error training CBC model: {e}")

if __name__ == "__main__":
    os.makedirs("models", exist_ok=True)
    train_heart_model()
    train_hypertension_model()
    train_cbc_model()
