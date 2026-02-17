from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Optional
import os
import shutil
import json
from datetime import timedelta

# Import our new modules
from src.database import get_db_connection, init_db
from src.auth import (
    Token, User, get_current_user, get_password_hash, 
    verify_password, create_access_token, get_current_admin,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

from src.ml_service import predict_diabetes
from src.health_analysis import analyze_parameters
from src.risk_scoring import calculate_risk
from src.conditions import identify_conditions
from src.recommendation import recommend_specialist
from src.pdf_service import extract_parameters_from_pdf, extract_cbc_from_pdf
from src.cbc_analysis import interpret_cbc

# Initialize Database on Startup
init_db()

# ---------- APP ----------
app = FastAPI(
    title="Health Analyzer API",
    description="AI-powered Healthcare Analytics & Decision Support System",
    version="2.0"
)

# ---------- CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- DATA MODELS ----------
class PatientData(BaseModel):
    Pregnancies: int
    Glucose: int
    BloodPressure: int
    SkinThickness: int
    Insulin: int
    BMI: float
    DiabetesPedigreeFunction: float
    Age: int

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str

class ReportSave(BaseModel):
    inputs: dict
    outputs: dict
    source: str = "manual"

# ---------- AUTH ROUTES ----------

@app.post("/register", response_model=Token)
async def register(user: UserCreate):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = conn.cursor(dictionary=True)
    
    # Check if user exists
    cursor.execute("SELECT id FROM users WHERE email = %s", (user.email,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(user.password)
    try:
        cursor.execute(
            "INSERT INTO users (email, password_hash, full_name, role) VALUES (%s, %s, %s, 'user')",
            (user.email, hashed_password, user.full_name)
        )
        conn.commit()
        user_id = cursor.lastrowid
        
        # Create token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email, "user_id": user_id, "role": "user"},
            expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE email = %s", (form_data.username,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not user or not verify_password(form_data.password, user['password_hash']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user['email'], "user_id": user['id'], "role": user['role']},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=User)
async def read_users_me(current_user = Depends(get_current_user)):
    return {
        "id": current_user.user_id,
        "email": current_user.email,
        "role": current_user.role,
        "full_name": "User" # Todo: Fetch full name if needed
    }

# ---------- ROOT ----------
@app.get("/")
def root():
    return {"message": "Health Analyzer API (Python Backend) running"}

# ---------- PREDICTION & SAVING ----------
@app.post("/predict")
def predict(patient: PatientData):
    patient_dict = patient.dict()
    # ... existing logic ...
    diabetes_prediction = predict_diabetes(patient_dict)
    hypertension_prediction = patient_dict["BloodPressure"] >= 130
    heart_disease_prediction = (
        patient_dict["Age"] >= 55 and 
        (patient_dict["BloodPressure"] >= 130 or patient_dict["Glucose"] >= 140 or patient_dict["BMI"] >= 30)
    )
    analysis = analyze_parameters(patient_dict)
    risk = calculate_risk(analysis, diabetes_prediction)
    conditions = identify_conditions(analysis, diabetes_prediction)
    doctors = recommend_specialist(conditions)

    return {
        "diabetes_prediction": "Positive" if diabetes_prediction else "Negative",
        "hypertension_prediction": "Positive" if hypertension_prediction else "Negative",
        "heart_disease_prediction": "Positive" if heart_disease_prediction else "Negative",
        "risk_level": risk,
        "analysis": analysis,
        "possible_conditions": conditions,
        "recommended_specialists": doctors
    }

@app.post("/reports/save")
async def save_report(report: ReportSave, current_user = Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor()
        
        inputs = report.inputs
        outputs = report.outputs
        
        # safely extract values with defaults
        pregnancies = inputs.get('Pregnancies')
        glucose = inputs.get('Glucose')
        bp = inputs.get('BloodPressure')
        skin = inputs.get('SkinThickness')
        insulin = inputs.get('Insulin')
        bmi = inputs.get('BMI')
        dpf = inputs.get('DiabetesPedigreeFunction')
        age = inputs.get('Age')
        
        prediction = outputs.get('diabetes_prediction')
        hyper_pred = outputs.get('hypertension_prediction')
        heart_pred = outputs.get('heart_disease_prediction')
        risk = outputs.get('risk_level')
        
        analysis = outputs.get('analysis', [])
        conditions = outputs.get('possible_conditions', [])
        specialists = outputs.get('recommended_specialists', [])
        
        abnormal_count = len(analysis) if isinstance(analysis, list) else 0
        
        query = """
            INSERT INTO Patient_Reports 
            (user_id, pregnancies, glucose, blood_pressure, skin_thickness, insulin, bmi, 
             diabetes_pedigree_function, age, diabetes_prediction, hypertension_prediction, 
             heart_disease_prediction, risk_level, abnormal_count, abnormal_json, 
             conditions_json, specialists_json, source)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        values = (
            current_user.user_id, pregnancies, glucose, bp, skin, insulin, bmi, dpf, age,
            prediction, hyper_pred, heart_pred, risk, abnormal_count,
            json.dumps(analysis), json.dumps(conditions), json.dumps(specialists),
            report.source
        )
        
        cursor.execute(query, values)
        conn.commit()
        
        return {"status": "success", "id": cursor.lastrowid}
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/reports/history")
async def get_user_history(current_user = Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT * FROM Patient_Reports 
        WHERE user_id = %s 
        ORDER BY created_at DESC
    """, (current_user.user_id,))
    
    reports = cursor.fetchall()
    cursor.close()
    conn.close()
    return {"reports": reports}

@app.get("/reports/admin")
async def get_all_reports(current_admin = Depends(get_current_admin)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    cursor = conn.cursor(dictionary=True)
    # Join with users table to get user details
    cursor.execute("""
        SELECT r.*, u.email, u.full_name 
        FROM Patient_Reports r
        LEFT JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC
    """)
    
    reports = cursor.fetchall()
    
    # Fetch all users for admin dashboard stats
    cursor.execute("SELECT id, email, full_name, role, created_at FROM users")
    users = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return {"reports": reports, "users": users}

# ---------- PDF UPLOAD ----------
@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    extracted_data = extract_parameters_from_pdf(file_path)
    return {"extracted_parameters": extracted_data}

@app.post("/cbc/upload-pdf")
async def upload_cbc_pdf(file: UploadFile = File(...)):
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    cbc_data = extract_cbc_from_pdf(file_path)
    interpretation = interpret_cbc(cbc_data)
    return {"cbc": cbc_data, "interpretation": interpretation}
