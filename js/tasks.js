let tasks = [];
let statuses = [];

$(document).ready(function() {
    console.log('Tasks page loaded');
    loadTasks();
    setupEventHandlers();
});

function setupEventHandlers() {
    $('#filterForm').on('submit', function(e) {
        e.preventDefault();
        loadTasks();
    });

    $('#createTaskForm').on('submit', function(e) {
        e.preventDefault();
        createTask();
    });

    $('#resetFilters').on('click', function() {
        $('#filterForm')[0].reset();
        loadTasks();
    });

    $('#createTaskBtn').on('click', function() {
        $('#createTaskModal').show();
    });

    $('.close, .modal').on('click', function(e) {
        if (e.target === this) {
            $('#createTaskModal').hide();
        }
    });

    $('#closeModal').on('click', function() {
        $('#createTaskModal').hide();
    });
}

function loadTasks() {
    console.log('Loading tasks...');
    
    const formData = $('#filterForm').serialize();
    console.log('Request URL:', '/tasks/index.php?' + formData);
    
    api.get('/tasks/index.php?' + formData)
        .then(function(response) {
            console.log('API Response:', response);
            
            if (response.success && response.data) {
                tasks = response.data.tasks || [];
                statuses = response.data.statuses || [];
                renderTasks(tasks);
                updateFilters(response.data.filters);
                console.log('Tasks loaded successfully:', tasks.length);
            } else {
                throw new Error(response.error || 'Invalid response format');
            }
        })
        .catch(function(error) {
            console.error('Error loading tasks:', error);
            $('#tasksTable tbody').html('<tr><td colspan="7" style="color: red; text-align: center;">Error: ' + error.message + '</td></tr>');
        });
}

function renderTasks(tasks) {
    const $tbody = $('#tasksTable tbody');
    console.log('Rendering tasks:', tasks);
    
    if (!tasks || tasks.length === 0) {
        $tbody.html('<tr><td colspan="7" style="text-align: center;">No tasks found. <a href="#" onclick="$(\'#createTaskModal\').show()">Create your first task!</a></td></tr>');
        return;
    }

    let html = '';
    tasks.forEach(function(task) {
        console.log('Task data:', task);
        
        let adminCommentsHtml = '';
        if (task.admin_comments && task.admin_comments.length > 0) {
            adminCommentsHtml = `<div style="margin-top: 5px; font-size: 12px; color: #666;">
                <strong>Admin comments:</strong> ${task.admin_comments.length}
            </div>`;
        }
        
        html += `
            <tr>
                <td>${task.id}</td>
                <td>
                    <strong>${escapeHtml(task.title || 'No title')}</strong>
                    ${adminCommentsHtml}
                </td>
                <td>${escapeHtml(task.description || 'No description')}</td>
                <td>
                    <select onchange="updateTaskStatus(${task.id}, this.value)">
                        ${getStatusOptions(task.status_id)}
                    </select>
                </td>
                <td>${formatDate(task.created_at)}</td>
                <td>${formatDate(task.updated_at)}</td>
                <td>
                    <button class="btn-view" onclick="viewTask(${task.id})">View</button>
                </td>
            </tr>
        `;
    });
    
    $tbody.html(html);
    console.log('Tasks rendered successfully');
}

function getStatusOptions(currentStatusId) {
    if (!statuses || statuses.length === 0) {
        return `
            <option value="1" ${currentStatusId == 1 ? 'selected' : ''}>ToDo</option>
            <option value="2" ${currentStatusId == 2 ? 'selected' : ''}>InProgress</option>
            <option value="3" ${currentStatusId == 3 ? 'selected' : ''}>Ready For Review</option>
            <option value="4" ${currentStatusId == 4 ? 'selected' : ''}>Done</option>
        `;
    }
    
    let options = '';
    statuses.forEach(function(status) {
        const selected = status.id == currentStatusId ? 'selected' : '';
        options += `<option value="${status.id}" ${selected}>${status.status_name}</option>`;
    });
    return options;
}

function updateFilters(filters) {
    console.log('Updating filters:', filters);
    
    let statusOptions = '<option value="">All Statuses</option>';
    if (statuses && statuses.length > 0) {
        statuses.forEach(function(status) {
            const selected = filters.status === status.status_name ? 'selected' : '';
            statusOptions += `<option value="${status.status_name}" ${selected}>${status.status_name}</option>`;
        });
    }
    $('#statusFilter').html(statusOptions);
    
    if (filters.sort) $('#sortBy').val(filters.sort);
    if (filters.order) $('#sortOrder').val(filters.order);
}

function createTask() {
    const title = $('#taskTitle').val().trim();
    const description = $('#taskDescription').val().trim();

    if (!title) {
        alert('Error: Title is required');
        return;
    }

    const $btn = $('#createTaskForm button[type="submit"]');
    const originalText = $btn.text();
    $btn.prop('disabled', true).text('Creating...');

    api.post('/tasks/create.php', { title, description })
        .then(function(response) {
            console.log('Create task response:', response);
            
            // Обрабатываем оба формата ответа
            if (response.success === true) {
                // Новый формат: {success: true, data: {task: {...}}}
                $('#createTaskForm')[0].reset();
                $('#createTaskModal').hide();
                loadTasks();
                alert('Success: Task created successfully!');
            } else if (response.message && response.task) {
                // Старый формат: {message: "...", task: {...}}
                $('#createTaskForm')[0].reset();
                $('#createTaskModal').hide();
                loadTasks();
                alert('Success: Task created successfully!');
            } else {
                throw new Error(response.error || 'Invalid response format');
            }
        })
        .catch(function(error) {
            console.error('Error creating task:', error);
            alert('Error: Failed to create task: ' + error.message);
        })
        .finally(function() {
            $btn.prop('disabled', false).text('Create Task');
        });
}
function updateTaskStatus(taskId, statusId) {
    console.log('Updating task status:', taskId, statusId);
    
    api.put('/tasks/update.php', {
        task_id: taskId,
        status_id: statusId
    })
    .then(function(response) {
        console.log('Update status response:', response);
        if (response.success) {
            const task = tasks.find(t => t.id == taskId);
            if (task) {
                task.status_id = statusId;
                task.updated_at = new Date().toISOString();
            }
            alert('Success: Status updated successfully');
        } else {
            throw new Error(response.error);
        }
    })
    .catch(function(error) {
        console.error('Error updating status:', error);
        alert('Error: Failed to update status: ' + error.message);
        loadTasks();
    });
}

function viewTask(taskId) {
    console.log('Viewing task:', taskId);
    const task = tasks.find(t => t.id == taskId);
    if (task) {
        showTaskModal(task);
    } else {
        alert('Error: Task not found');
    }
}

function showTaskModal(task) {
    const modalHtml = `
        <div class="modal" id="taskViewModal" style="display: block;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Task Details</h3>
                    <span class="close" onclick="$('#taskViewModal').hide()">&times;</span>
                </div>
                <div class="modal-body">
                    <h4>${escapeHtml(task.title || 'No title')}</h4>
                    <p><strong>Description:</strong> ${escapeHtml(task.description || 'No description')}</p>
                    <p><strong>Status:</strong> ${task.status_name || 'Unknown'}</p>
                    <p><strong>Created:</strong> ${formatDate(task.created_at)}</p>
                    <p><strong>Last Updated:</strong> ${formatDate(task.updated_at)}</p>
                    
                    ${task.admin_comments && task.admin_comments.length > 0 ? `
                        <h4>Admin Comments (${task.admin_comments.length})</h4>
                        <div>
                            ${task.admin_comments.map(comment => `
                                <div style="background: #fff3cd; padding: 10px; margin: 5px 0; border-left: 4px solid #ffc107;">
                                    <strong>${escapeHtml(comment.username)}</strong>
                                    <small style="color: #666;"> (${formatDate(comment.created_at)})</small>
                                    <p style="margin: 5px 0 0 0;">${escapeHtml(comment.comment)}</p>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p>No admin comments yet.</p>'}
                </div>
                <div class="modal-footer">
                    <button onclick="$('#taskViewModal').hide()">Close</button>
                </div>
            </div>
        </div>
    `;
    
    $('#taskViewModal').remove();
    $('body').append(modalHtml);
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleString();
    } catch (e) {
        return dateString;
    }
}