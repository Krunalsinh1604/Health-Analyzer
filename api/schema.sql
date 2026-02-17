CREATE TABLE IF NOT EXISTS Patient_Reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pregnancies INT NULL,
  glucose DECIMAL(8,2) NULL,
  blood_pressure DECIMAL(8,2) NULL,
  skin_thickness DECIMAL(8,2) NULL,
  insulin DECIMAL(8,2) NULL,
  bmi DECIMAL(8,2) NULL,
  diabetes_pedigree_function DECIMAL(8,4) NULL,
  age INT NULL,
  diabetes_prediction VARCHAR(64) NULL,
  hypertension_prediction VARCHAR(64) NULL,
  heart_disease_prediction VARCHAR(64) NULL,
  risk_level VARCHAR(64) NULL,
  abnormal_count INT NULL,
  abnormal_json JSON NULL,
  conditions_json JSON NULL,
  specialists_json JSON NULL,
  source VARCHAR(32) NULL
);

CREATE TABLE IF NOT EXISTS Cbc_Reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cbc_json JSON NULL,
  interpretation_json JSON NULL,
  source VARCHAR(32) NULL
);
