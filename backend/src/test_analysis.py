from health_analysis import analyze_parameters

sample_patient = {
    'Glucose': 160,
    'BloodPressure': 145,
    'BMI': 32
}

results = analyze_parameters(sample_patient)

for r in results:
    print(r)
