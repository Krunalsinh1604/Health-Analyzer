from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional, List
import os
import shutil
import json
from datetime import timedelta
from datetime import datetime
import random
import re
import smtplib
from email.message import EmailMessage

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

def _get_allowed_origins() -> List[str]:
    default_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ]
    extra_origins = [
        origin.strip()
        for origin in os.getenv("CORS_ALLOW_ORIGINS", "").split(",")
        if origin.strip()
    ]

    return list(dict.fromkeys(default_origins + extra_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_allowed_origins(),
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
    mobile_no: str
    password: str
    full_name: str


class EmailVerificationRequest(BaseModel):
    email: str


class EmailVerificationConfirm(BaseModel):
    email: str
    otp: str


class MobileVerificationRequest(BaseModel):
    mobile_no: str


class MobileVerificationConfirm(BaseModel):
    mobile_no: str
    otp: str


class LoginOtpRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    email: str
    otp: str
    new_password: str


class ReportSave(BaseModel):
    inputs: dict
    outputs: dict
    source: str = "manual"


def _is_valid_email(email: str) -> bool:
    return re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email) is not None


def _normalize_mobile(mobile_no: str) -> str:
    return re.sub(r"\D", "", mobile_no or "")


def _is_valid_mobile(mobile_no: str) -> bool:
    normalized = _normalize_mobile(mobile_no)
    return 10 <= len(normalized) <= 15


def _generate_otp() -> str:
    return f"{random.randint(0, 999999):06d}"


def _send_email_otp(email: str, otp: str):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    smtp_from = os.getenv("SMTP_FROM", smtp_user or "no-reply@health-analyzer.local")

    if not smtp_host or not smtp_user or not smtp_pass:
        print(f"[EMAIL OTP] {email}: {otp}")
        return

    msg = EmailMessage()
    msg["Subject"] = "Health Analyzer Email Verification OTP"
    msg["From"] = smtp_from
    msg["To"] = email
    msg.set_content(f"Your verification OTP is: {otp}. It expires in 10 minutes.")

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)


def _send_mobile_otp(mobile_no: str, otp: str):
    # Integrate SMS provider (Twilio/Fast2SMS/etc.) here in production.
    print(f"[SMS OTP] {mobile_no}: {otp}")


def _upsert_verification_code(target_type: str, target_value: str, otp: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO verification_codes (target_type, target_value, code, is_verified, expires_at)
        VALUES (%s, %s, %s, 0, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
        ON DUPLICATE KEY UPDATE
            code = VALUES(code),
            is_verified = 0,
            expires_at = VALUES(expires_at)
        """,
        (target_type, target_value, otp),
    )
    conn.commit()
    cursor.close()
    conn.close()


def _confirm_verification_code(target_type: str, target_value: str, otp: str):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT id, code, expires_at
        FROM verification_codes
        WHERE target_type = %s AND target_value = %s
        """,
        (target_type, target_value),
    )
    record = cursor.fetchone()

    if not record:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Verification code not requested")

    if datetime.now() > record["expires_at"]:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Verification code expired")

    if record["code"] != otp:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid verification code")

    cursor.execute(
        """
        UPDATE verification_codes
        SET is_verified = 1
        WHERE id = %s
        """,
        (record["id"],),
    )
    conn.commit()
    cursor.close()
    conn.close()


def _ensure_target_verified(target_type: str, target_value: str):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT is_verified, expires_at
        FROM verification_codes
        WHERE target_type = %s AND target_value = %s
        """,
        (target_type, target_value),
    )
    record = cursor.fetchone()
    cursor.close()
    conn.close()

    if not record or not record["is_verified"]:
        raise HTTPException(status_code=400, detail=f"{target_type.capitalize()} is not verified")

    if datetime.now() > record["expires_at"]:
        raise HTTPException(status_code=400, detail=f"{target_type.capitalize()} verification expired")

# ---------------- AUTH ROUTES ----------------

@app.post("/verify/email/request")
async def request_email_verification(payload: EmailVerificationRequest):
    email = (payload.email or "").strip().lower()
    if not _is_valid_email(email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    cursor.close()
    conn.close()

    otp = _generate_otp()
    _upsert_verification_code("email", email, otp)
    _send_email_otp(email, otp)
    return {"message": "Email verification code sent"}


@app.post("/verify/email/confirm")
async def confirm_email_verification(payload: EmailVerificationConfirm):
    email = (payload.email or "").strip().lower()
    _confirm_verification_code("email", email, payload.otp.strip())
    return {"message": "Email verified successfully"}


@app.post("/password/forgot/request")
async def request_password_reset_otp(payload: LoginOtpRequest):
    email = (payload.email or "").strip().lower()
    if not _is_valid_email(email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user:
        raise HTTPException(status_code=404, detail="User with this email does not exist")

    otp = _generate_otp()
    _upsert_verification_code("email", email, otp)
    _send_email_otp(email, otp)
    return {"message": "Password reset OTP sent to email"}


@app.post("/password/forgot/reset")
async def reset_password_with_otp(payload: PasswordResetConfirm):
    email = (payload.email or "").strip().lower()
    if not _is_valid_email(email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    if len((payload.new_password or "").strip()) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()

    if not user:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="User with this email does not exist")

    _confirm_verification_code("email", email, payload.otp.strip())

    new_password_hash = get_password_hash(payload.new_password.strip())
    cursor.execute(
        "UPDATE users SET password_hash = %s WHERE id = %s",
        (new_password_hash, user["id"]),
    )

    cursor.execute(
        "DELETE FROM verification_codes WHERE target_type = 'email' AND target_value = %s",
        (email,),
    )
    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "Password reset successful"}


@app.post("/verify/mobile/request")
async def request_mobile_verification(payload: MobileVerificationRequest):
    mobile_no = _normalize_mobile(payload.mobile_no)
    if not _is_valid_mobile(mobile_no):
        raise HTTPException(status_code=400, detail="Invalid mobile number")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id FROM users WHERE mobile_no = %s", (mobile_no,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Mobile number already registered")
    cursor.close()
    conn.close()

    otp = _generate_otp()
    _upsert_verification_code("mobile", mobile_no, otp)
    _send_mobile_otp(mobile_no, otp)
    return {"message": "Mobile verification code sent"}


@app.post("/verify/mobile/confirm")
async def confirm_mobile_verification(payload: MobileVerificationConfirm):
    mobile_no = _normalize_mobile(payload.mobile_no)
    _confirm_verification_code("mobile", mobile_no, payload.otp.strip())
    return {"message": "Mobile verified successfully"}

@app.post("/register", response_model=Token)
async def register(user: UserCreate):
    email = (user.email or "").strip().lower()
    mobile_no = _normalize_mobile(user.mobile_no)

    if not _is_valid_email(email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    if not _is_valid_mobile(mobile_no):
        raise HTTPException(status_code=400, detail="Valid mobile number is required")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Email already registered")

    cursor.execute("SELECT id FROM users WHERE mobile_no = %s", (mobile_no,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Mobile number already registered")

    hashed_password = get_password_hash(user.password)

    cursor.execute(
        """
        INSERT INTO users (email, mobile_no, password_hash, full_name, role, email_verified, mobile_verified)
        VALUES (%s, %s, %s, %s, 'user', 1, 1)
        """,
        (email, mobile_no, hashed_password, user.full_name)
    )
    conn.commit()
    user_id = cursor.lastrowid

    access_token = create_access_token(
        data={"sub": email, "user_id": user_id, "role": "user"},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    cursor.close()
    conn.close()

    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    login_id_raw = (form_data.username or "").strip()
    login_id_email = login_id_raw.lower()
    login_id_mobile = _normalize_mobile(login_id_raw)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT * FROM users WHERE email = %s OR mobile_no = %s",
        (login_id_email, login_id_mobile),
    )
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

# ---------------- HEART DISEASE PREDICTION ----------------

class HeartData(BaseModel):
    age: int
    sex: int
    cp: int
    trestbps: int
    chol: int
    fbs: int
    restecg: int
    thalach: int
    exang: int
    oldpeak: float
    slope: int
    ca: int
    thal: int

@app.post("/predict/heart")
def predict_heart(data: HeartData):
    from src.ml_service import predict_heart_disease
    prediction = predict_heart_disease(data.dict())
    
    result = "High Risk of Heart Disease" if prediction == 1 else "Low Risk"
    return {"prediction": result, "raw": prediction}

class HeartReportSave(HeartData):
    prediction: str
    probability: Optional[float] = None

@app.post("/heart/save")
async def save_heart_report(report: HeartReportSave, current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO heart_reports 
            (user_id, age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal, prediction, probability)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            current_user.user_id,
            report.age, report.sex, report.cp, report.trestbps, report.chol, report.fbs, report.restecg, 
            report.thalach, report.exang, report.oldpeak, report.slope, report.ca, report.thal,
            report.prediction, report.probability
        ))
        conn.commit()
        return {"status": "saved"}
    except Exception as e:
        print(f"Error saving heart report: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.get("/heart/history")
async def get_heart_history(current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM heart_reports WHERE user_id = %s ORDER BY created_at DESC", (current_user.user_id,))
        reports = cursor.fetchall()
        return {"reports": reports}
    except Exception as e:
        print(f"Error fetching heart history: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

# ---------------- HYPERTENSION PREDICTION ----------------

class HypertensionData(BaseModel):
    age: int
    sex: int
    bmi: float
    heart_rate: int
    activity_level: int
    smoker: int
    family_history: int

@app.post("/predict/hypertension")
def predict_htn(data: HypertensionData):
    from src.ml_service import predict_hypertension
    prediction = predict_hypertension(data.dict())
    
    result = "High Risk of Hypertension" if prediction == 1 else "Low Risk"
    return {"prediction": result, "raw": prediction}

class HypertensionReportSave(HypertensionData):
    prediction: str

@app.post("/hypertension/save")
async def save_htn_report(report: HypertensionReportSave, current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO hypertension_reports 
            (user_id, age, sex, bmi, heart_rate, activity_level, smoker, family_history, prediction)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            current_user.user_id,
            report.age, report.sex, report.bmi, report.heart_rate, 
            report.activity_level, report.smoker, report.family_history,
            report.prediction
        ))
        conn.commit()
        return {"status": "saved"}
    except Exception as e:
        print(f"Error saving hypertension report: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.get("/hypertension/history")
async def get_htn_history(current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM hypertension_reports WHERE user_id = %s ORDER BY created_at DESC", (current_user.user_id,))
        reports = cursor.fetchall()
        return {"reports": reports}
    except Exception as e:
        print(f"Error fetching hypertension history: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

# ---------------- UPDATE CBC ANALYSIS ----------------

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
    from src.ml_service import predict_cbc_condition
    
    cbc_data = process_manual_cbc(input_data)
    interpretation = interpret_cbc(cbc_data)
    
    # ML Prediction
    # We need to form a dict that matches the training data keys exactly
    # Training keys: Hemoglobin, RBC, WBC, Platelets, MCV, MCH, RDW, Neutrophils, Lymphocytes, Monocytes, Eosinophils, Basophils
    # We use 0.0 or mean values for missing optional fields to avoid crash if model expects them?
    # For now, let's just pass what we have and hope pandas/sklearn handles it or we fillna
    
    # Prepare ML input with safe defaults for missing values (using normal means)
    ml_input = {
        'Hemoglobin': input_data.get('Hemoglobin', 14.0),
        'RBC': input_data.get('RBC', 5.0),
        'WBC': input_data.get('WBC', 7000),
        'Platelets': input_data.get('Platelets', 250000),
        'MCV': input_data.get('MCV', 90),
        'MCH': input_data.get('MCH', 30),
        'RDW': input_data.get('RDW', 13),
        'Neutrophils': input_data.get('Neutrophils', 55),
        'Lymphocytes': input_data.get('Lymphocytes', 30),
        'Monocytes': input_data.get('Monocytes', 5),
        'Eosinophils': input_data.get('Eosinophils', 3),
        'Basophils': input_data.get('Basophils', 0.5)
    }
    
    ml_prediction = predict_cbc_condition(ml_input)
    interpretation['ml_prediction'] = ml_prediction

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
