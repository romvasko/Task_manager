<?php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['username']) || !isset($input['password'])) {
        jsonResponse(['error' => 'Username and password required'], 400);
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    $username = $input['username'];
    $password = $input['password'];
    
    $query = "SELECT id FROM users WHERE username = ?";
    $stmt = $db->prepare($query);
    $stmt->execute([$username]);
    
    if ($stmt->rowCount() > 0) {
        jsonResponse(['error' => 'Username already exists'], 400);
    }
    
    $query = "INSERT INTO users (username, password_hash) VALUES (?, ?)";
    $stmt = $db->prepare($query);
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    
    if ($stmt->execute([$username, $password_hash])) {
        $user_id = $db->lastInsertId();
        jsonResponse([
            'message' => 'User registered successfully',
            'user' => [
                'id' => $user_id,
                'username' => $username
            ]
        ], 201);
    } else {
        jsonResponse(['error' => 'Registration failed'], 500);
    }
} else {
    jsonResponse(['error' => 'Method not allowed'], 405);
}
?>