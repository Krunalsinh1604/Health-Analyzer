import pandas as pd

# Sample analytics output (can be expanded later)
data = {
    'Patient_ID': [1, 2, 3, 4, 5],
    'Risk_Level': ['High', 'Medium', 'Low', 'High', 'Medium'],
    'Diabetes_Risk': ['Yes', 'No', 'No', 'Yes', 'No'],
    'Abnormal_Parameters': [3, 2, 1, 3, 2]
}

df = pd.DataFrame(data)

# Export for Power BI
df.to_csv('powerbi/health_analytics.csv', index=False)

print("Power BI dataset exported successfully")
