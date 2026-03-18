import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
import joblib
import os

# Load processed data
df = pd.read_csv('data/processed/clean_diabetes.csv')

# Final safety check
df = df.fillna(df.median())

# Features and target
X = df.drop('Outcome', axis=1)
y = df['Outcome']

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train model
model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)

# Prediction
y_pred = model.predict(X_test)

# Accuracy
accuracy = accuracy_score(y_test, y_pred)
print("Diabetes Model Accuracy:", accuracy)

# Save model
os.makedirs('models', exist_ok=True)
joblib.dump(model, 'models/diabetes_model.pkl')
print("Model saved successfully")
