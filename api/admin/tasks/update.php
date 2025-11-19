<?php
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $user = authenticate();
        requireAdmin($user);
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['task_id'])) {
            jsonResponse(['success' => false, 'error' => 'Task ID is required'], 400);
        }
        
        $database = new Database();
        $db = $database->getConnection();
        
        $task_id = $input['task_id'];
        
        if (isset($input['status_id'])) {
            $query = "UPDATE tasks SET status_id = ? WHERE id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$input['status_id'], $task_id]);
        }
        
        if (isset($input['tags'])) {
            $delete_query = "DELETE FROM task_tags WHERE task_id = ?";
            $delete_stmt = $db->prepare($delete_query);
            $delete_stmt->execute([$task_id]);
            
            $insert_query = "INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)";
            $insert_stmt = $db->prepare($insert_query);
            foreach ($input['tags'] as $tag_id) {
                $insert_stmt->execute([$task_id, $tag_id]);
            }
        }
        
        if (isset($input['comment']) && !empty(trim($input['comment']))) {
            $comment_query = "INSERT INTO task_comments (task_id, user_id, comment, comment_type) VALUES (?, ?, ?, 'admin')";
            $comment_stmt = $db->prepare($comment_query);
            $comment_stmt->execute([$task_id, $user['id'], trim($input['comment'])]);
        }
        
        jsonResponse([
            'success' => true,
            'message' => 'Task updated successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Admin task update error: " . $e->getMessage());
        jsonResponse([
            'success' => false,
            'error' => 'Server error: ' . $e->getMessage()
        ], 500);
    }
    
} else {
    jsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}
?>