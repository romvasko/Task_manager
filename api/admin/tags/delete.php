<?php
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        $user = authenticate();
        requireAdmin($user);
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['id'])) {
            jsonResponse(['success' => false, 'error' => 'Tag ID is required'], 400);
        }
        
        $database = new Database();
        $db = $database->getConnection();
        
        $id = $input['id'];
        
        $check_query = "SELECT COUNT(*) as count FROM task_tags WHERE tag_id = ?";
        $check_stmt = $db->prepare($check_query);
        $check_stmt->execute([$id]);
        $usage = $check_stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($usage['count'] > 0) {
            jsonResponse(['success' => false, 'error' => 'Cannot delete tag: it is used in tasks'], 400);
        }
        
        $query = "DELETE FROM tags WHERE id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() > 0) {
            jsonResponse([
                'success' => true,
                'message' => 'Tag deleted successfully'
            ]);
        } else {
            jsonResponse(['success' => false, 'error' => 'Tag not found'], 404);
        }
        
    } catch (Exception $e) {
        error_log("Admin tags delete error: " . $e->getMessage());
        jsonResponse(['success' => false, 'error' => 'Server error: ' . $e->getMessage()], 500);
    }
    
} else {
    jsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}
?>