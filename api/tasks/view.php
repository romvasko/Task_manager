<?php
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $user = authenticate();
    
    if (!isset($_GET['id'])) {
        jsonResponse(['success' => false, 'error' => 'Task ID is required'], 400);
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    $task_id = $_GET['id'];
    
    $query = "SELECT t.*, ts.status_name 
              FROM tasks t 
              JOIN task_statuses ts ON t.status_id = ts.id 
              WHERE t.id = ? AND t.user_id = ?";
    $stmt = $db->prepare($query);
    $stmt->execute([$task_id, $user['id']]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$task) {
        jsonResponse(['success' => false, 'error' => 'Task not found'], 404);
    }
    
    $comment_query = "SELECT tc.*, u.username, u.role, tc.comment_type 
                      FROM task_comments tc 
                      JOIN users u ON tc.user_id = u.id 
                      WHERE tc.task_id = ? 
                      ORDER BY tc.created_at ASC";
    $comment_stmt = $db->prepare($comment_query);
    $comment_stmt->execute([$task_id]);
    $task['comments'] = $comment_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $tag_query = "SELECT tg.* FROM tags tg 
                  JOIN task_tags tt ON tg.id = tt.tag_id 
                  WHERE tt.task_id = ?";
    $tag_stmt = $db->prepare($tag_query);
    $tag_stmt->execute([$task_id]);
    $task['tags'] = $tag_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    jsonResponse([
        'success' => true,
        'data' => [
            'task' => $task
        ]
    ]);
    
} else {
    jsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}
?>