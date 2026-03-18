import pandas as pd
import numpy as np

# Load raw dataset
df = pd.read_csv('data/raw/diabetes.csv')

if 'Pregnancies' in df.columns:
    df = df.drop('Pregnancies', axis=1)

# Columns where zero is not a valid value
invalid_zero_cols = ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI']

# Replace 0 with NaN
df[invalid_zero_cols] = df[invalid_zero_cols].replace(0, np.nan)

# Fill missing values using median (safe for medical data)
for col in invalid_zero_cols:
    df[col].fillna(df[col].median(), inplace=True)

# Save processed dataset
df.to_csv('data/processed/clean_diabetes.csv', index=False)

print("Data preprocessing completed successfully")

