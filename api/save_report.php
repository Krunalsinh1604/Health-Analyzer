<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$payload = json_decode(file_get_contents('php://input'), true);
if (!$payload) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload']);
    exit;
}

require_once __DIR__ . '/db.php';

$inputs = $payload['inputs'] ?? [];
$outputs = $payload['outputs'] ?? [];
$source = $payload['source'] ?? 'manual';

$analysis = $outputs['analysis'] ?? [];
$conditions = $outputs['possible_conditions'] ?? [];
$specialists = $outputs['recommended_specialists'] ?? [];

// Start session to get user_id
session_start();
$userId = $_SESSION['user_id'] ?? null;

$stmt = $connection->prepare(
    'INSERT INTO Patient_Reports (pregnancies, glucose, blood_pressure, skin_thickness, insulin, bmi, diabetes_pedigree_function, age, diabetes_prediction, hypertension_prediction, heart_disease_prediction, risk_level, abnormal_count, abnormal_json, conditions_json, specialists_json, source, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);

$pregnancies = $inputs['Pregnancies'] ?? null;
$glucose = $inputs['Glucose'] ?? null;
$bloodPressure = $inputs['BloodPressure'] ?? null;
$skinThickness = $inputs['SkinThickness'] ?? null;
$insulin = $inputs['Insulin'] ?? null;
$bmi = $inputs['BMI'] ?? null;
$dpf = $inputs['DiabetesPedigreeFunction'] ?? null;
$age = $inputs['Age'] ?? null;
$prediction = $outputs['diabetes_prediction'] ?? null;
$hypertensionPrediction = $outputs['hypertension_prediction'] ?? null;
$heartDiseasePrediction = $outputs['heart_disease_prediction'] ?? null;
$riskLevel = $outputs['risk_level'] ?? null;
$abnormalCount = is_array($analysis) ? count($analysis) : 0;
$analysisJson = json_encode($analysis);
$conditionsJson = json_encode($conditions);
$specialistsJson = json_encode($specialists);

$stmt->bind_param(
    'idddddddissssisssi',
    $pregnancies,
    $glucose,
    $bloodPressure,
    $skinThickness,
    $insulin,
    $bmi,
    $dpf,
    $age,
    $prediction,
    $hypertensionPrediction,
    $heartDiseasePrediction,
    $riskLevel,
    $abnormalCount,
    $analysisJson,
    $conditionsJson,
    $specialistsJson,
    $source,
    $userId
);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save report: ' . $connection->error]);
    exit;
}

echo json_encode(['success' => true, 'id' => $stmt->insert_id]);
