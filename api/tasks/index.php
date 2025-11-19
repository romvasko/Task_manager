<?php
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $user = authenticate();
    
    $database = new Database();
    $db = $database->getConnection();
    
    $status_filter = $_GET['status'] ?? '';
    $sort_by = $_GET['sort'] ?? 'created_at';
    $sort_order = $_GET['order'] ?? 'DESC';
    
    $allowed_sorts = ['created_at', 'updated_at', 'title'];
    if (!in_array($sort_by, $allowed_sorts)) {
        $sort_by = 'created_at';
    }
    $sort_order = strtoupper($sort_order) === 'ASC' ? 'ASC' : 'DESC';
    
    $query = "SELECT t.*, ts.status_name 
              FROM tasks t 
              JOIN task_statuses ts ON t.status_id = ts.id 
              WHERE t.user_id = :user_id";
    
    $params = ['user_id' => $user['id']];
    
    if (!empty($status_filter)) {
        $query .= " AND ts.status_name = :status";
        $params['status'] = $status_filter;
    }
    
    $query .= " ORDER BY $sort_by $sort_order";
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($tasks as &$task) {
        $comment_query = "SELECT tc.*, u.username 
                          FROM task_comments tc 
                          JOIN users u ON tc.user_id = u.id 
                          WHERE tc.task_id = ? AND tc.comment_type = 'admin'
                          ORDER BY tc.created_at ASC";
        $comment_stmt = $db->prepare($comment_query);
        $comment_stmt->execute([$task['id']]);
        $task['admin_comments'] = $comment_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $tag_query = "SELECT tg.* FROM tags tg 
                      JOIN task_tags tt ON tg.id = tt.tag_id 
                      WHERE tt.task_id = ?";
        $tag_stmt = $db->prepare($tag_query);
        $tag_stmt->execute([$task['id']]);
        $task['tags'] = $tag_stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    $status_query = "SELECT * FROM task_statuses";
    $status_stmt = $db->query($status_query);
    $statuses = $status_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    jsonResponse([
        'success' => true,
        'data' => [
            'tasks' => $tasks,
            'statuses' => $statuses,
            'filters' => [
                'status' => $status_filter,
                'sort' => $sort_by,
                'order' => $sort_order
            ]
        ]
    ]);
    
} else {
    jsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}
?>