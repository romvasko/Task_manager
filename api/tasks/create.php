<?php
require_once __DIR__ . '/../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = authenticate();
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['title'])) {
        jsonResponse(['success' => false, 'error' => 'Title is required'], 400);
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    $title = $input['title'];
    $description = $input['description'] ?? '';
    
    $query = "INSERT INTO tasks (title, description, status_id, user_id) VALUES (?, ?, 1, ?)";
    $stmt = $db->prepare($query);
    
    if ($stmt->execute([$title, $description, $user['id']])) {
        $task_id = $db->lastInsertId();
        
        $query = "SELECT t.*, ts.status_name FROM tasks t 
                  JOIN task_statuses ts ON t.status_id = ts.id 
                  WHERE t.id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$task_id]);
        $task = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Возвращаем в правильном формате
        jsonResponse([
            'success' => true,
            'message' => 'Task created successfully',
            'data' => [
                'task' => $task
            ]
        ], 201);
    } else {
        jsonResponse(['success' => false, 'error' => 'Failed to create task'], 500);
    }
} else {
    jsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}
?>