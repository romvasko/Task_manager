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
    
    $query = "SELECT id, username, password_hash, role FROM users WHERE username = ?";
    $stmt = $db->prepare($query);
    $stmt->execute([$username]);
    
    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (password_verify($password, $user['password_hash'])) {
            jsonResponse([
                'message' => 'Login successful',
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'role' => $user['role']
                ],
                'token' => $user['id']
            ]);
        } else {
            jsonResponse(['error' => 'Invalid password'], 401);
        }
    } else {
        jsonResponse(['error' => 'User not found'], 404);
    }
} else {
    jsonResponse(['error' => 'Method not allowed'], 405);
}
?> 