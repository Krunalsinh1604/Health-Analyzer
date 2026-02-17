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

$cbc = $payload['cbc'] ?? [];
$interpretation = $payload['interpretation'] ?? [];
$source = $payload['source'] ?? 'cbc';

$stmt = $connection->prepare(
    'INSERT INTO Cbc_Reports (cbc_json, interpretation_json, source)
     VALUES (?, ?, ?)'
);

$cbcJson = json_encode($cbc);
$interpretationJson = json_encode($interpretation);

$stmt->bind_param('sss', $cbcJson, $interpretationJson, $source);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save CBC report']);
    exit;
}

echo json_encode(['success' => true, 'id' => $stmt->insert_id]);
