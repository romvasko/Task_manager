<?php
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $user = authenticate();
        requireAdmin($user);
        
        if (!isset($_GET['id'])) {
            jsonResponse(['success' => false, 'error' => 'Task ID is required'], 400);
        }
        
        $database = new Database();
        $db = $database->getConnection();
        
        $task_id = $_GET['id'];
        
        $query = "SELECT t.*, ts.status_name, u.username as author_name 
                  FROM tasks t 
                  JOIN task_statuses ts ON t.status_id = ts.id 
                  JOIN users u ON t.user_id = u.id 
                  WHERE t.id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$task_id]);
        $task = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$task) {
            jsonResponse(['success' => false, 'error' => 'Task not found'], 404);
        }
        
        $tag_query = "SELECT tg.* FROM tags tg 
                      JOIN task_tags tt ON tg.id = tt.tag_id 
                      WHERE tt.task_id = ?";
        $tag_stmt = $db->prepare($tag_query);
        $tag_stmt->execute([$task_id]);
        $task['tags'] = $tag_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $comment_query = "SELECT tc.*, u.username, u.role, tc.comment_type 
                          FROM task_comments tc 
                          JOIN users u ON tc.user_id = u.id 
                          WHERE tc.task_id = ? 
                          ORDER BY tc.created_at ASC";
        $comment_stmt = $db->prepare($comment_query);
        $comment_stmt->execute([$task_id]);
        $task['comments'] = $comment_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $status_query = "SELECT * FROM task_statuses ORDER BY id";
        $status_stmt = $db->query($status_query);
        $all_statuses = $status_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $all_tags_query = "SELECT * FROM tags ORDER BY name";
        $all_tags_stmt = $db->query($all_tags_query);
        $all_tags = $all_tags_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        jsonResponse([
            'success' => true,
            'data' => [
                'task' => $task,
                'available_statuses' => $all_statuses,
                'available_tags' => $all_tags
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Admin task view error: " . $e->getMessage());
        jsonResponse([
            'success' => false,
            'error' => 'Server error: ' . $e->getMessage()
        ], 500);
    }
    
} else {
    jsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}
?>