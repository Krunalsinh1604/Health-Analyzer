from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
import os
import shutil
import json
from datetime import timedelta

# ---------------- IMPORT INTERNAL MODULES ----------------

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
from src.pdf_service import extract_parameters_from_pdf, extract_cbc_from_file
from src.cbc_analysis import interpret_cbc

# ---------------- INITIALIZE DATABASE ----------------

init_db()

# ---------------- APP CONFIG ----------------

app = FastAPI(
    title="Health Analyzer API",
    description="AI-powered Healthcare Analytics & Decision Support System",
    version="2.0"
)

# ---------------- CORS ----------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DATA MODELS ----------------

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

# ---------------- AUTH ROUTES ----------------

@app.post("/register", response_model=Token)
async def register(user: UserCreate):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT id FROM users WHERE email = %s", (user.email,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)

    cursor.execute(
        "INSERT INTO users (email, password_hash, full_name, role) VALUES (%s, %s, %s, 'user')",
        (user.email, hashed_password, user.full_name)
    )
    conn.commit()
    user_id = cursor.lastrowid

    access_token = create_access_token(
        data={"sub": user.email, "user_id": user_id, "role": "user"},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    cursor.close()
    conn.close()

    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM users WHERE email = %s", (form_data.username,))
    user = cursor.fetchone()

    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    access_token = create_access_token(
        data={"sub": user["email"], "user_id": user["id"], "role": user["role"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    cursor.close()
    conn.close()

    return {"access_token": access_token, "token_type": "bearer"}

# ---------------- BASIC ROUTES ----------------

@app.get("/")
def root():
    return {"message": "Health Analyzer API running successfully"}

@app.get("/users/me", response_model=User)
async def read_users_me(current_user=Depends(get_current_user)):
    print(f"DEBUG: /users/me requested for user_id: {current_user.user_id}")
    
    conn = get_db_connection()
    if not conn:
        print("ERROR: Database connection failed in read_users_me")
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE id = %s", (current_user.user_id,))
        user = cursor.fetchone()
        
        if user is None:
            print(f"ERROR: User ID {current_user.user_id} not found in DB")
            raise HTTPException(status_code=404, detail="User not found")
            
        return user
    except Exception as e:
        print(f"ERROR: Exception in read_users_me: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

# ---------------- PREDICTION ----------------

@app.post("/predict")
def predict(patient: PatientData):
    data = patient.dict()

    diabetes = predict_diabetes(data)
    analysis = analyze_parameters(data)
    risk = calculate_risk(analysis, diabetes)
    conditions = identify_conditions(analysis, diabetes)
    specialists = recommend_specialist(conditions)

    return {
        "diabetes_prediction": "Positive" if diabetes else "Negative",
        "risk_level": risk,
        "analysis": analysis,
        "possible_conditions": conditions,
        "recommended_specialists": specialists
    }

# ---------------- SAVE REPORT ----------------

@app.post("/reports/save")
async def save_report(report: ReportSave, current_user=Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Extract inputs and outputs safely
    inputs = report.inputs
    outputs = report.outputs
    
    # helper to get value or None
    def get_val(data, key, cast=None):
        val = data.get(key)
        if val == "" or val is None:
            return None
        if cast:
            try:
                return cast(val)
            except:
                return None
        return val

    cursor.execute(
        """
        INSERT INTO patient_reports
        (
            user_id, 
            pregnancies, glucose, blood_pressure, skin_thickness, insulin, bmi, diabetes_pedigree_function, age,
            diabetes_prediction, risk_level, 
            abnormal_json, conditions_json, specialists_json, source
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            current_user.user_id,
            get_val(inputs, 'Pregnancies', int),
            get_val(inputs, 'Glucose', float),
            get_val(inputs, 'BloodPressure', float),
            get_val(inputs, 'SkinThickness', float),
            get_val(inputs, 'Insulin', float),
            get_val(inputs, 'BMI', float),
            get_val(inputs, 'DiabetesPedigreeFunction', float),
            get_val(inputs, 'Age', int),
            get_val(outputs, 'diabetes_prediction', str),
            get_val(outputs, 'risk_level', str),
            json.dumps(outputs.get("analysis", [])),
            json.dumps(outputs.get("possible_conditions", [])),
            json.dumps(outputs.get("recommended_specialists", [])),
            report.source
        )
    )

    conn.commit()
    cursor.close()
    conn.close()

    return {"status": "saved"}

# ---------------- HISTORY ROUTE ----------------

@app.get("/reports/history")
async def get_user_history(current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                id, created_at, 
                diabetes_prediction, risk_level, 
                bmi, glucose, blood_pressure, insulin, age
            FROM patient_reports 
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (current_user.user_id,))
        
        reports = cursor.fetchall()
        return {"reports": reports}
        
    except Exception as e:
        print(f"Error in /reports/history: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

# ---------------- ADMIN ROUTES ----------------

@app.get("/reports/admin")
async def get_admin_data(current_user=Depends(get_current_admin)):
    print(f"DEBUG: /reports/admin requested by {current_user.email}")
    conn = get_db_connection()
    if not conn:
        print("ERROR: Database connection failed in /reports/admin")
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # 1. Fetch all reports with user details
        print("DEBUG: Fetching reports...")
        cursor.execute("""
            SELECT 
                r.id, r.user_id, r.created_at, 
                r.diabetes_prediction, r.risk_level, r.bmi, 
                u.full_name, u.email
            FROM patient_reports r
            LEFT JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC
        """)
        reports = cursor.fetchall()
        print(f"DEBUG: Found {len(reports)} reports")
        
        # 2. Fetch all users
        print("DEBUG: Fetching users...")
        cursor.execute("SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC")
        users = cursor.fetchall()
        print(f"DEBUG: Found {len(users)} users")
        
        return {
            "reports": reports,
            "users": users
        }
        
    except Exception as e:
        print(f"ERROR: Exception in /reports/admin: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

# ---------------- PDF UPLOAD ----------------

@app.post("/upload-report")
async def upload_report(file: UploadFile = File(...)):
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    extracted = extract_parameters_from_pdf(file_path)
    return {"extracted_parameters": extracted}

# ---------------- CBC UPLOAD ----------------

@app.post("/cbc/upload-report")
async def upload_cbc_report(file: UploadFile = File(...)):
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    cbc_data = extract_cbc_from_file(file_path)
    interpretation = interpret_cbc(cbc_data)

    return {"cbc": cbc_data, "interpretation": interpretation}


class ManualCbcInput(BaseModel):
    Hemoglobin: Optional[float] = None
    RBC: Optional[float] = None
    WBC: Optional[float] = None
    Platelets: Optional[float] = None
    ESR: Optional[float] = None
    MCV: Optional[float] = None
    MCH: Optional[float] = None
    RDW: Optional[float] = None
    Neutrophils: Optional[float] = None
    Lymphocytes: Optional[float] = None
    Monocytes: Optional[float] = None
    Eosinophils: Optional[float] = None
    Basophils: Optional[float] = None


@app.post("/cbc/analyze")
async def analyze_manual_cbc(data: ManualCbcInput):
    # Convert Pydantic model to dict, removing None values
    input_data = {k: v for k, v in data.dict().items() if v is not None}
    
    # Process using the shared logic
    from src.cbc_analysis import process_manual_cbc, interpret_cbc
    cbc_data = process_manual_cbc(input_data)
    interpretation = interpret_cbc(cbc_data)

    return {"cbc": cbc_data, "interpretation": interpretation}

# ---------------- CBC DATABASE ROUTES ----------------

class CbcReportSave(BaseModel):
    cbc: dict
    interpretation: dict
    source: str = "manual"

@app.post("/cbc/save")
async def save_cbc_report(report: CbcReportSave, current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO cbc_reports (user_id, cbc_json, interpretation_json, source)
            VALUES (%s, %s, %s, %s)
        """, (
            current_user.user_id,
            json.dumps(report.cbc),
            json.dumps(report.interpretation),
            report.source
        ))
        conn.commit()
        return {"status": "saved"}
    except Exception as e:
        print(f"Error saving CBC report: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@app.get("/cbc/history")
async def get_cbc_history(current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, created_at, cbc_json, interpretation_json, source
            FROM cbc_reports
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (current_user.user_id,))
        reports = cursor.fetchall()
        
        # Parse JSON strings back to objects
        for r in reports:
            if r['cbc_json']:
                r['cbc'] = json.loads(r['cbc_json'])
            if r['interpretation_json']:
                r['interpretation'] = json.loads(r['interpretation_json'])
            del r['cbc_json']
            del r['interpretation_json']
            
        return {"reports": reports}
    except Exception as e:
        print(f"Error fetching CBC history: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()
