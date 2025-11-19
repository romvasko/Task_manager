<?php
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $user = authenticate();
        requireAdmin($user);
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['id']) || !isset($input['name'])) {
            jsonResponse(['success' => false, 'error' => 'Tag ID and name are required'], 400);
        }
        
        $database = new Database();
        $db = $database->getConnection();
        
        $id = $input['id'];
        $name = $input['name'];
        $color = $input['color'] ?? '#007bff';
        
        $query = "UPDATE tags SET name = ?, color = ? WHERE id = ?";
        $stmt = $db->prepare($query);
        
        $stmt->execute([$name, $color, $id]);
        
        if ($stmt->rowCount() > 0) {
            jsonResponse([
                'success' => true,
                'message' => 'Tag updated successfully'
            ]);
        } else {
            jsonResponse(['success' => false, 'error' => 'Tag not found'], 404);
        }
        
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            jsonResponse(['success' => false, 'error' => 'Tag name already exists'], 400);
        } else {
            error_log("Admin tags update error: " . $e->getMessage());
            jsonResponse(['success' => false, 'error' => 'Database error'], 500);
        }
    } catch (Exception $e) {
        error_log("Admin tags update error: " . $e->getMessage());
        jsonResponse(['success' => false, 'error' => 'Server error'], 500);
    }
    
} else {
    jsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}
?>