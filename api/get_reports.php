<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once __DIR__ . '/db.php';

$result = $connection->query(
    'SELECT id, created_at, pregnancies, glucose, blood_pressure, bmi, diabetes_prediction, hypertension_prediction, heart_disease_prediction, risk_level, source
     FROM Patient_Reports
     ORDER BY created_at DESC
     LIMIT 200'
);

if (!$result) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch reports']);
    exit;
}

$reports = [];
while ($row = $result->fetch_assoc()) {
    $reports[] = $row;
}

echo json_encode(['reports' => $reports]);
