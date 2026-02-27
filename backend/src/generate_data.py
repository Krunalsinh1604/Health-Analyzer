import pandas as pd
import numpy as np
import os

def generate_heart_data(n_samples=1000):
    np.random.seed(42)
    data = {
        'age': np.random.randint(29, 77, n_samples),
        'sex': np.random.randint(0, 2, n_samples),
        'cp': np.random.randint(0, 4, n_samples), # Chest pain type
        'trestbps': np.random.randint(94, 200, n_samples), # Resting BP
        'chol': np.random.randint(126, 564, n_samples), # Cholesterol
        'fbs': np.random.randint(0, 2, n_samples), # Fasting blood sugar > 120
        'restecg': np.random.randint(0, 3, n_samples),
        'thalach': np.random.randint(71, 202, n_samples), # Max heart rate
        'exang': np.random.randint(0, 2, n_samples), # Exercise angina
        'oldpeak': np.random.uniform(0, 6.2, n_samples), # ST depression
        'slope': np.random.randint(0, 3, n_samples),
        'ca': np.random.randint(0, 5, n_samples), # Number of vessels
        'thal': np.random.randint(0, 4, n_samples)
    }
    
    df = pd.DataFrame(data)
    
    # Simple logic to generate somewhat realistic target
    # Higher age, higher chol, higher bp, angina -> higher risk
    risk_score = (
        (df['age'] > 50).astype(int) +
        (df['chol'] > 240).astype(int) +
        (df['trestbps'] > 140).astype(int) +
        df['cp'] +
        df['exang'] * 2 +
        (df['thalach'] < 150).astype(int)
    )
    
    df['target'] = (risk_score + np.random.normal(0, 1, n_samples) > 3.5).astype(int)
    return df

def generate_hypertension_data(n_samples=1000):
    np.random.seed(42)
    data = {
        'age': np.random.randint(18, 90, n_samples),
        'sex': np.random.randint(0, 2, n_samples),
        'bmi': np.random.uniform(15, 45, n_samples),
        'heart_rate': np.random.randint(50, 110, n_samples),
        'activity_level': np.random.randint(0, 3, n_samples), # 0: Sedentary, 1: Moderate, 2: Active
        'smoker': np.random.randint(0, 2, n_samples),
        'family_history': np.random.randint(0, 2, n_samples),
        'systolic': np.random.randint(90, 180, n_samples), # Training feature, but in reality we predict risk
        'diastolic': np.random.randint(60, 110, n_samples)
    }
    
    df = pd.DataFrame(data)
    
    # Risk calculation
    # High BP is the definition of hypertension, but let's try to predict risk factors
    # Actually, the user wants a "Hypertension Monitor". 
    # Usually we predict IF someone is hypertensive based on vitals.
    
    risk_score = (
        (df['age'] > 60).astype(int) * 2 +
        (df['bmi'] > 30).astype(int) * 2 +
        (df['smoker'] == 1).astype(int) * 3 +
        (df['family_history'] == 1).astype(int) * 2 +
        (df['activity_level'] == 0).astype(int) * 2
    )
    
    # Target: 0 = No Risk, 1 = Risk
    df['target'] = (risk_score + np.random.normal(0, 1, n_samples) > 4).astype(int)
    
    # We drop actual BP columns for prediction if the goal is risk prediction WITHOUT BP?
    # Or maybe with BP? The page has BP input. 
    # If the user inputs BP, they know if they have hypertension. 
    # But let's assume the model predicts "Risk Level" or future probability.
    # For now, let's keep it simple: Risk Prediction based on profile.
    
    return df

def generate_cbc_data(n_samples=1000):
    np.random.seed(42)
    
    # Normal ranges extended
    data = {
        'Hemoglobin': np.random.normal(14, 2, n_samples),
        'RBC': np.random.normal(5, 0.5, n_samples),
        'WBC': np.random.normal(7000, 2000, n_samples),
        'Platelets': np.random.normal(250000, 50000, n_samples),
        'MCV': np.random.normal(90, 5, n_samples),
        'MCH': np.random.normal(30, 2, n_samples),
        'RDW': np.random.normal(13, 1, n_samples),
        'Neutrophils': np.random.normal(55, 10, n_samples),
        'Lymphocytes': np.random.normal(30, 8, n_samples),
        'Monocytes': np.random.normal(5, 2, n_samples),
        'Eosinophils': np.random.normal(3, 1, n_samples),
        'Basophils': np.random.normal(0.5, 0.2, n_samples)
    }
    
    df = pd.DataFrame(data)
    
    def classify(row):
        conditions = []
        # Anemia types based on Hb and MCV
        if row['Hemoglobin'] < 12:
            if row['MCV'] < 80:
                conditions.append('Microcytic Anemia')
            elif row['MCV'] > 100:
                conditions.append('Macrocytic Anemia')
            else:
                conditions.append('Normocytic Anemia')
                
        # WBC conditions
        if row['WBC'] > 11000: 
            conditions.append('Leukocytosis (Infection/Inflammation)')
        elif row['WBC'] < 4000:
            conditions.append('Leukopenia')
            
        # Platelet conditions
        if row['Platelets'] < 150000: 
            conditions.append('Thrombocytopenia')
        elif row['Platelets'] > 450000:
            conditions.append('Thrombocytosis')
        
        if not conditions:
            return 'Normal'
        return conditions[0] # Simplification for single-label classification
        
    df['condition'] = df.apply(classify, axis=1)
    return df

if __name__ == "__main__":
    os.makedirs("data/processed", exist_ok=True)
    
    print("Generating Heart Disease data...")
    heart_df = generate_heart_data()
    heart_df.to_csv("data/processed/synthetic_heart.csv", index=False)
    
    print("Generating Hypertension data...")
    htn_df = generate_hypertension_data()
    htn_df.to_csv("data/processed/synthetic_hypertension.csv", index=False)
    
    print("Generating CBC data...")
    cbc_df = generate_cbc_data()
    cbc_df.to_csv("data/processed/synthetic_cbc.csv", index=False)
    
    print("Data generation complete.")
