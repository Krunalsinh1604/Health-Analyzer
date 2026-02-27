from health_analysis import analyze_parameters
from risk_scoring import calculate_risk
from conditions import identify_conditions
from recommendation import recommend_specialist

# Sample patient
patient = {
    'Glucose': 165,
    'BloodPressure': 150,
    'BMI': 33
}

# Simulated ML output (1 = diabetic risk)
diabetes_prediction = 1

analysis = analyze_parameters(patient)
risk = calculate_risk(analysis, diabetes_prediction)
conditions = identify_conditions(analysis, diabetes_prediction)
doctors = recommend_specialist(conditions)

print("Analysis:", analysis)
print("Overall Risk:", risk)
print("Possible Conditions:", conditions)
print("Recommended Specialists:", doctors)
