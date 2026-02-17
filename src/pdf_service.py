import pdfplumber
import re

from src.cbc_analysis import extract_cbc_from_text


def _extract_number(text, patterns):
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            value = match.group(1).replace(",", "")
            try:
                return float(value)
            except ValueError:
                return None
    return None


def extract_parameters_from_pdf(file_path):
    text = ""

    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            text += page_text + "\n"

    data = {}

    patterns = {
        "Pregnancies": [r"Pregnanc(?:y|ies)\s*[:\-]?\s*(\d+)", r"Gravida\s*[:\-]?\s*(\d+)"] ,
        "Glucose": [r"Glucose\s*[:\-]?\s*(\d+(?:\.\d+)?)", r"Blood\s*Sugar\s*[:\-]?\s*(\d+(?:\.\d+)?)"],
        "BloodPressure": [r"Blood\s*Pressure\s*[:\-]?\s*(\d+(?:\.\d+)?)", r"BP\s*[:\-]?\s*(\d+(?:\.\d+)?)"],
        "BMI": [r"BMI\s*[:\-]?\s*(\d+(?:\.\d+)?)", r"Body\s*Mass\s*Index\s*[:\-]?\s*(\d+(?:\.\d+)?)"],
        "Insulin": [r"Insulin\s*[:\-]?\s*(\d+(?:\.\d+)?)"],
        "SkinThickness": [r"Skin\s*Thickness\s*[:\-]?\s*(\d+(?:\.\d+)?)"],
        "DiabetesPedigreeFunction": [r"Diabetes\s*Pedigree\s*Function\s*[:\-]?\s*(\d+(?:\.\d+)?)", r"DPF\s*[:\-]?\s*(\d+(?:\.\d+)?)"],
        "Age": [r"Age\s*[:\-]?\s*(\d+(?:\.\d+)?)", r"Age\s*\(years\)\s*[:\-]?\s*(\d+(?:\.\d+)?)"]
    }

    for key, pattern_list in patterns.items():
        value = _extract_number(text, pattern_list)
        if value is not None:
            if key in {"Pregnancies", "Age"}:
                data[key] = int(value)
            else:
                data[key] = float(value)

    return data


def extract_cbc_from_pdf(file_path):
    text = ""

    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            text += page_text + "\n"

    return extract_cbc_from_text(text)
