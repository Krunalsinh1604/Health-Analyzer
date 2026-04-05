import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import LabelEncoder
import io

def train_and_test_csv(csv_content: bytes):
    """
    Takes CSV bytes, trains a Random Forest model on the data, 
    and returns performance metrics. Assumes the last column is the target.
    """
    try:
        # Load dataset
        df = pd.read_csv(io.BytesIO(csv_content))
        
        if df.empty:
            return {"error": "The uploaded CSV file is empty."}
        
        if df.shape[1] < 2:
            return {"error": "The CSV must have at least one feature and one target column."}
            
        # 1. Preprocessing
        # Drop columns with all NaN values
        df = df.dropna(axis=1, how='all')
        
        # Identify target and features
        # For simplicity, we assume the last column is the target
        target_col = df.columns[-1]
        X = df.iloc[:, :-1]
        y = df[target_col]
        
        # Handle non-numeric features (Label Encoding)
        for col in X.columns:
            if X[col].dtype == 'object':
                le = LabelEncoder()
                X.loc[:, col] = le.fit_transform(X[col].astype(str))
                
        # Handle non-numeric target
        if y.dtype == 'object':
            le_target = LabelEncoder()
            y = le_target.fit_transform(y.astype(str))
            
        # Impute missing values
        imputer = SimpleImputer(strategy='mean')
        X = imputer.fit_transform(X)
        
        # 2. Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # 3. Train Model
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        # 4. Predictions & Metrics
        y_pred = model.predict(X_test)
        
        # For multi-class, we use 'weighted' average for precision/recall/f1
        is_binary = len(np.unique(y)) <= 2
        average_method = 'binary' if is_binary else 'weighted'
        
        metrics = {
            "accuracy": round(accuracy_score(y_test, y_pred), 4),
            "precision": round(precision_score(y_test, y_pred, average=average_method, zero_division=0), 4),
            "recall": round(recall_score(y_test, y_pred, average=average_method, zero_division=0), 4),
            "f1_score": round(f1_score(y_test, y_pred, average=average_method, zero_division=0), 4),
            "total_samples": len(df),
            "training_samples": len(X_train),
            "testing_samples": len(X_test),
            "features_used": list(df.columns[:-1]),
            "target_column": target_col,
            "algorithm": "RandomForestClassifier (n=100)"
        }
        
        # Add a few example predictions
        sample_indices = np.random.choice(len(X_test), min(5, len(X_test)), replace=False)
        metrics["sample_predictions"] = [
            {"actual": int(y_test[i]), "predicted": int(y_pred[i])} for i in sample_indices
        ]
        
        return metrics
        
    except Exception as e:
        return {"error": f"Error during training: {str(e)}"}
