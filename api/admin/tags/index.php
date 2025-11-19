<?php
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $user = authenticate();
        requireAdmin($user);
        
        $database = new Database();
        $db = $database->getConnection();
        
        $query = "SELECT * FROM tags ORDER BY name";
        $stmt = $db->query($query);
        $tags = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        jsonResponse([
            'success' => true,
            'data' => [
                'tags' => $tags
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Admin tags index error: " . $e->getMessage());
        jsonResponse([
            'success' => false,
            'error' => 'Server error: ' . $e->getMessage()
        ], 500);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $user = authenticate();
        requireAdmin($user);
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['name'])) {
            jsonResponse(['success' => false, 'error' => 'Tag name is required'], 400);
        }
        
        $database = new Database();
        $db = $database->getConnection();
        
        $name = $input['name'];
        $color = $input['color'] ?? '#007bff';
        
        $query = "INSERT INTO tags (name, color) VALUES (?, ?)";
        $stmt = $db->prepare($query);
        
        $stmt->execute([$name, $color]);
        $tag_id = $db->lastInsertId();
        
        $query = "SELECT * FROM tags WHERE id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$tag_id]);
        $tag = $stmt->fetch(PDO::FETCH_ASSOC);
        
        jsonResponse([
            'success' => true,
            'message' => 'Tag created successfully',
            'data' => [
                'tag' => $tag
            ]
        ], 201);
        
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Duplicate entry
            jsonResponse(['success' => false, 'error' => 'Tag already exists'], 400);
        } else {
            error_log("Admin tags create error: " . $e->getMessage());
            jsonResponse(['success' => false, 'error' => 'Database error'], 500);
        }
    } catch (Exception $e) {
        error_log("Admin tags create error: " . $e->getMessage());
        jsonResponse(['success' => false, 'error' => 'Server error'], 500);
    }
    
} else {
    jsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}
?>