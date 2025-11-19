<?php
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $user = authenticate();
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['task_id'])) {
        jsonResponse(['success' => false, 'error' => 'Task ID is required'], 400);
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    $task_id = $input['task_id'];
    
    $check_query = "SELECT id FROM tasks WHERE id = ? AND user_id = ?";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->execute([$task_id, $user['id']]);
    
    if ($check_stmt->rowCount() === 0) {
        jsonResponse(['success' => false, 'error' => 'Task not found or access denied'], 404);
    }
    
    if (isset($input['status_id'])) {
        $query = "UPDATE tasks SET status_id = ? WHERE id = ? AND user_id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$input['status_id'], $task_id, $user['id']]);
    }
    
    if (isset($input['comment']) && !empty(trim($input['comment']))) {
        $comment_type = $input['comment_type'] ?? 'user';
        $comment_query = "INSERT INTO task_comments (task_id, user_id, comment, comment_type) VALUES (?, ?, ?, ?)";
        $comment_stmt = $db->prepare($comment_query);
        $comment_stmt->execute([$task_id, $user['id'], trim($input['comment']), $comment_type]);
    }
    
    jsonResponse(['success' => true, 'message' => 'Task updated successfully']);
    
} else {
    jsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}
?>