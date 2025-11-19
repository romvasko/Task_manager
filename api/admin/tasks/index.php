<?php
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    
    try {
        $user = authenticate();
        
        $database = new Database();
        $db = $database->getConnection();
        
        $status_filter = $_GET['status'] ?? '';
        $priority_filter = $_GET['priority'] ?? '';
        $tag_filter = $_GET['tag'] ?? '';
        $sort_by = $_GET['sort'] ?? 'created_at';
        $sort_order = $_GET['order'] ?? 'DESC';
        
        $query = "SELECT t.*, ts.status_name, u.username as author_name 
                  FROM tasks t 
                  JOIN task_statuses ts ON t.status_id = ts.id 
                  JOIN users u ON t.user_id = u.id 
                  WHERE 1=1";
        
        $params = [];
        
        if (!empty($status_filter)) {
            $query .= " AND ts.status_name = ?";
            $params[] = $status_filter;
        }
        
        if (!empty($priority_filter)) {
            $query .= " AND t.priority = ?";
            $params[] = $priority_filter;
        }
        
        if (!empty($tag_filter)) {
            $query .= " AND t.id IN (SELECT task_id FROM task_tags WHERE tag_id = ?)";
            $params[] = $tag_filter;
        }
        
        $query .= " ORDER BY $sort_by $sort_order";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($tasks as &$task) {
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
        
        $tags_query = "SELECT * FROM tags";
        $tags_stmt = $db->query($tags_query);
        $tags = $tags_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $priorities = [
            ['value' => 'low', 'label' => 'Low'],
            ['value' => 'medium', 'label' => 'Medium'], 
            ['value' => 'high', 'label' => 'High']
        ];
        
        jsonResponse([
            'success' => true,
            'data' => [
                'tasks' => $tasks,
                'filters' => [
                    'statuses' => $statuses,
                    'tags' => $tags,
                    'priorities' => $priorities,
                    'current' => [
                        'status' => $status_filter,
                        'priority' => $priority_filter,
                        'tag' => $tag_filter,
                        'sort' => $sort_by,
                        'order' => $sort_order
                    ]
                ]
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Admin tasks error: " . $e->getMessage());
        jsonResponse([
            'success' => false,
            'error' => 'Server error: ' . $e->getMessage()
        ], 500);
    }
    
} else {
    jsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}
?>