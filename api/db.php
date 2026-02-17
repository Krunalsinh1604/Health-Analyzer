<?php
$DB_HOST = 'localhost';
$DB_PORT = 3306;
$DB_NAME = 'health_analyzer_db';
$DB_USER = 'root';
$DB_PASS = 'root';

$connection = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME, $DB_PORT);

if ($connection->connect_error) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$connection->set_charset('utf8mb4');
