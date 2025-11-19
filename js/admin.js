let currentPage = 'tasks';
let allTags = [];
let allStatuses = [];
let adminTasks = [];

$(document).ready(function() {
    console.log('Admin page loaded');
    checkAdminAuth();
    loadInitialData();
    setupEventHandlers();
});

function checkAdminAuth() {
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || userRole !== 'admin') {
        alert('Access denied. Admin privileges required.');
        window.location.href = 'login.html';
        return;
    }
}

function setupEventHandlers() {
    $('.nav-link').on('click', function(e) {
        e.preventDefault();
        const page = $(this).data('page');
        switchPage(page);
    });

    $('#taskFilterForm').on('submit', function(e) {
        e.preventDefault();
        loadTasks();
    });

    $('#resetFilters').on('click', function() {
        $('#taskFilterForm')[0].reset();
        loadTasks();
    });

    $('#tagForm').on('submit', function(e) {
        e.preventDefault();
        saveTag();
    });

    $('#cancelEdit').on('click', function() {
        resetTagForm();
    });

    $('#commentForm').on('submit', function(e) {
        e.preventDefault();
        addComment();
    });

    $('#taskUpdateForm').on('submit', function(e) {
        e.preventDefault();
        updateTask();
    });

    $('#logoutBtn').on('click', function() {
        api.removeToken();
        window.location.href = 'login.html';
    });

    $('.modal .close, .modal').on('click', function(e) {
        if (e.target === this || $(e.target).hasClass('close')) {
            $('#taskModal').hide();
        }
    });
}

function switchPage(page) {
    currentPage = page;
    $('.page').hide();
    $('.nav-link').removeClass('active');
    
    $(`#${page}Page`).show();
    $(`.nav-link[data-page="${page}"]`).addClass('active');
    
    switch(page) {
        case 'tasks':
            loadTasks();
            break;
        case 'tags':
            loadTags();
            break;
        case 'statuses':
            loadStatuses();
            break;
    }
}

function loadInitialData() {
    loadTasks();
    preloadTagsAndStatuses();
}

function preloadTagsAndStatuses() {
    api.get('/admin/tags/index.php')
        .then(function(response) {
            if (response.success && response.data) {
                allTags = response.data.tags || [];
                console.log('Preloaded tags:', allTags.length);
            }
        })
        .catch(function(error) {
            console.error('Error preloading tags:', error);
        });
    
    api.get('/admin/tasks/index.php?limit=1')
        .then(function(response) {
            if (response.success && response.data && response.data.filters) {
                allStatuses = response.data.filters.statuses || [];
                console.log('Preloaded statuses:', allStatuses.length);
            }
        })
        .catch(function(error) {
            console.error('Error preloading statuses:', error);
        });
}

function loadTasks() {
    console.log('Loading admin tasks...');
    
    const formData = $('#taskFilterForm').serialize();
    console.log('Admin request URL:', '/admin/tasks/index.php?' + formData);
    
    api.get('/admin/tasks/index.php?' + formData)
        .then(function(response) {
            console.log('Admin API Response:', response);
            
            if (response.success && response.data) {
                adminTasks = response.data.tasks || [];
                renderAdminTasks(adminTasks);
                updateAdminFilters(response.data.filters);
                console.log('Admin tasks loaded successfully:', adminTasks.length);
            } else {
                throw new Error(response.error || 'Invalid response format');
            }
        })
        .catch(function(error) {
            console.error('Error loading admin tasks:', error);
            $('#tasksTable tbody').html('<tr><td colspan="8" style="color: red; text-align: center;">Error: ' + error.message + '</td></tr>');
        });
}

function renderAdminTasks(tasks) {
    const $tbody = $('#tasksTable tbody');
    console.log('Rendering admin tasks:', tasks);
    
    if (!tasks || tasks.length === 0) {
        $tbody.html('<tr><td colspan="8" style="text-align: center;">No tasks found</td></tr>');
        return;
    }

    let html = '';
    tasks.forEach(function(task) {
        console.log('Admin task data:', task);
        
        const priorityClass = `priority-${task.priority || 'medium'}`;
        const tagsHtml = task.tags ? task.tags.map(tag => 
            `<span class="tag" style="background: ${tag.color}; color: white; padding: 2px 8px; border-radius: 3px; margin: 2px; display: inline-block;">${tag.name}</span>`
        ).join('') : '';
        
        html += `
            <tr>
                <td>${task.id}</td>
                <td>${escapeHtml(task.title || 'No title')}</td>
                <td>${escapeHtml(task.author_name || 'Unknown')}</td>
                <td><span class="status-badge">${task.status_name || 'Unknown'}</span></td>
                <td><span class="tag ${priorityClass}">${task.priority || 'medium'}</span></td>
                <td>${tagsHtml}</td>
                <td>${formatDate(task.created_at)}</td>
                <td>
                    <button class="btn-view" onclick="viewAdminTask(${task.id})">View</button>
                </td>
            </tr>
        `;
    });
    
    $tbody.html(html);
    console.log('Admin tasks rendered successfully');
}

function updateAdminFilters(filters) {
    console.log('Updating admin filters:', filters);
    
    let statusOptions = '<option value="">All Statuses</option>';
    if (filters.statuses && filters.statuses.length > 0) {
        filters.statuses.forEach(function(status) {
            const selected = filters.current.status === status.status_name ? 'selected' : '';
            statusOptions += `<option value="${status.status_name}" ${selected}>${status.status_name}</option>`;
        });
    }
    $('#statusFilter').html(statusOptions);
    
    let tagOptions = '<option value="">All Tags</option>';
    if (filters.tags && filters.tags.length > 0) {
        filters.tags.forEach(function(tag) {
            const selected = filters.current.tag == tag.id ? 'selected' : '';
            tagOptions += `<option value="${tag.id}" ${selected}>${tag.name}</option>`;
        });
    }
    $('#tagFilter').html(tagOptions);
    
    if (filters.current.priority) $('#priorityFilter').val(filters.current.priority);
    if (filters.current.sort) $('#sortBy').val(filters.current.sort);
    if (filters.current.order) $('#sortOrder').val(filters.current.order);
}

function viewAdminTask(taskId) {
    console.log('Viewing admin task:', taskId);
    
    $('#taskModal').remove();
    $('body').append(`
        <div class="modal" id="taskModal" style="display: block;">
            <div class="modal-content">
                <div class="modal-body">
                    <p style="text-align: center;">Loading task details...</p>
                </div>
            </div>
        </div>
    `);
    
    api.get('/admin/tasks/view.php?id=' + taskId)
        .then(function(response) {
            console.log('Admin task view response:', response);
            
            if (response.success && response.data) {
                showAdminTaskModal(response.data);
            } else {
                throw new Error(response.error || 'Invalid response format');
            }
        })
        .catch(function(error) {
            console.error('Error loading admin task:', error);
            $('#taskModal').remove();
            alert('Error: Failed to load task: ' + error.message);
            
            const task = adminTasks.find(t => t.id == taskId);
            if (task) {
                showAdminTaskModal(task);
            }
        });
}

function showAdminTaskModal(taskData) {
    console.log('Showing admin task modal with data:', taskData);
    
    const task = taskData.task || taskData;
    const availableStatuses = taskData.available_statuses || allStatuses || [];
    const availableTags = taskData.available_tags || allTags || [];
    
    allStatuses = availableStatuses;
    allTags = availableTags;
    
    let tagCheckboxes = '';
    if (availableTags && availableTags.length > 0) {
        availableTags.forEach(function(tag) {
            const isChecked = task.tags && task.tags.some(t => t.id == tag.id);
            const checked = isChecked ? 'checked' : '';
            tagCheckboxes += `
                <label style="display: inline-block; margin-right: 15px; margin-bottom: 10px;">
                    <input type="checkbox" name="tags" value="${tag.id}" ${checked}>
                    <span class="tag" style="background: ${tag.color}; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px;">
                        ${escapeHtml(tag.name)}
                    </span>
                </label>
                <br>
            `;
        });
    } else {
        tagCheckboxes = '<p>No tags available</p>';
    }
    
    let statusOptions = '';
    if (availableStatuses && availableStatuses.length > 0) {
        availableStatuses.forEach(function(status) {
            const selected = status.id == task.status_id ? 'selected' : '';
            statusOptions += `<option value="${status.id}" ${selected}>${escapeHtml(status.status_name)}</option>`;
        });
    } else {
        statusOptions = `
            <option value="1" ${task.status_id == 1 ? 'selected' : ''}>ToDo</option>
            <option value="2" ${task.status_id == 2 ? 'selected' : ''}>InProgress</option>
            <option value="3" ${task.status_id == 3 ? 'selected' : ''}>Ready For Review</option>
            <option value="4" ${task.status_id == 4 ? 'selected' : ''}>Done</option>
        `;
    }
    
    let currentTagsHtml = '';
    if (task.tags && task.tags.length > 0) {
        currentTagsHtml = task.tags.map(tag => 
            `<span class="tag" style="background: ${tag.color}; color: white; padding: 2px 8px; border-radius: 3px; margin: 2px; display: inline-block; font-size: 12px;">
                ${escapeHtml(tag.name)}
            </span>`
        ).join('');
    } else {
        currentTagsHtml = '<span style="color: #666;">No tags assigned</span>';
    }
    
    let commentsHtml = '';
    if (task.comments && task.comments.length > 0) {
        task.comments.forEach(function(comment) {
            const isAdmin = comment.role === 'admin' || comment.comment_type === 'admin';
            commentsHtml += `
                <div style="background: ${isAdmin ? '#fff3cd' : '#f8f9fa'}; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid ${isAdmin ? '#ffc107' : '#007bff'};">
                    <div style="font-weight: bold; color: #495057;">
                        ${escapeHtml(comment.username)}
                        ${isAdmin ? '<span style="background: #dc3545; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px; margin-left: 5px;">Admin</span>' : ''}
                    </div>
                    <div style="color: #6c757d; font-size: 12px;">${formatDate(comment.created_at)}</div>
                    <p style="margin-top: 8px; margin-bottom: 0;">${escapeHtml(comment.comment)}</p>
                </div>
            `;
        });
    } else {
        commentsHtml = '<p style="color: #666; font-style: italic;">No comments yet.</p>';
    }
    
    const modalHtml = `
        <div class="modal" id="taskModal" style="display: block;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Task Details - Admin View</h3>
                    <span class="close" onclick="$('#taskModal').hide()">&times;</span>
                </div>
                <div class="modal-body">
                    <!-- Basic Task Info -->
                    <div style="margin-bottom: 20px;">
                        <h4>${escapeHtml(task.title || 'No title')}</h4>
                        <p><strong>Author:</strong> ${escapeHtml(task.author_name || 'Unknown')}</p>
                        <p><strong>Description:</strong> ${escapeHtml(task.description || 'No description')}</p>
                        <p><strong>Current Status:</strong> ${task.status_name || 'Unknown'}</p>
                        <p><strong>Priority:</strong> 
                            <span class="tag priority-${task.priority || 'medium'}" style="padding: 2px 8px; border-radius: 3px; color: white;">
                                ${task.priority || 'medium'}
                            </span>
                        </p>
                        <p><strong>Current Tags:</strong> ${currentTagsHtml}</p>
                        <p><strong>Created:</strong> ${formatDate(task.created_at)}</p>
                        <p><strong>Last Updated:</strong> ${formatDate(task.updated_at)}</p>
                    </div>
                    
                    <hr>
                    
                    <!-- Comments Section -->
                    <div style="margin-bottom: 20px;">
                        <h4>Comments</h4>
                        <div id="taskComments">
                            ${commentsHtml}
                        </div>
                        
                        <h5 style="margin-top: 20px;">Add Comment</h5>
                        <form id="commentForm">
                            <input type="hidden" id="commentTaskId" value="${task.id}">
                            <textarea id="commentText" placeholder="Type your comment here..." style="width: 100%; height: 80px; padding: 10px; border: 1px solid #ddd; border-radius: 3px; margin-bottom: 10px;"></textarea>
                            <div>
                                <button type="submit" class="btn-primary">Add Comment</button>
                            </div>
                        </form>
                    </div>
                    
                    <hr>
                    
                    <!-- Update Task Section -->
                    <div>
                        <h4>Update Task</h4>
                        <form id="taskUpdateForm">
                            <input type="hidden" id="updateTaskId" value="${task.id}">
                            
                            <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Status:</label>
                                <select id="updateStatus" style="padding: 8px; border: 1px solid #ddd; border-radius: 3px; width: 200px;">
                                    ${statusOptions}
                                </select>
                            </div>
                            
                            <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Tags:</label>
                                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border: 1px solid #dee2e6;">
                                    <div id="tagSelection">
                                        ${tagCheckboxes}
                                    </div>
                                </div>
                                <small style="color: #666;">Select tags to assign to this task</small>
                            </div>
                            
                            <button type="submit" class="btn-success">Update Task</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('#taskModal').remove();
    $('body').append(modalHtml);
    
    $('#commentForm').off('submit').on('submit', function(e) {
        e.preventDefault();
        addComment();
    });
    
    $('#taskUpdateForm').off('submit').on('submit', function(e) {
        e.preventDefault();
        updateTask();
    });
}

function addComment() {
    const taskId = $('#commentTaskId').val();
    const comment = $('#commentText').val().trim();
    
    if (!comment) {
        alert('Error: Please enter a comment');
        return;
    }
    
    api.put('/admin/tasks/update.php', {
        task_id: taskId,
        comment: comment
    })
    .then(function(response) {
        console.log('Add comment response:', response);
        if (response.success) {
            $('#commentText').val('');
            viewAdminTask(taskId);
            alert('Success: Comment added successfully');
        } else {
            throw new Error(response.error);
        }
    })
    .catch(function(error) {
        console.error('Error adding comment:', error);
        alert('Error: Failed to add comment: ' + error.message);
    });
}

function updateTask() {
    const taskId = $('#updateTaskId').val();
    const statusId = $('#updateStatus').val();
    const selectedTags = [];
    
    $('#tagSelection input:checked').each(function() {
        selectedTags.push($(this).val());
    });
    
    api.put('/admin/tasks/update.php', {
        task_id: taskId,
        status_id: statusId,
        tags: selectedTags
    })
    .then(function(response) {
        console.log('Update task response:', response);
        if (response.success) {
            viewAdminTask(taskId); 
            loadTasks(); 
            alert('Success: Task updated successfully');
        } else {
            throw new Error(response.error);
        }
    })
    .catch(function(error) {
        console.error('Error updating task:', error);
        alert('Error: Failed to update task: ' + error.message);
    });
}

function loadTags() {
    console.log('Loading tags...');
    
    const $tbody = $('#tagsTable tbody');
    $tbody.html('<tr><td colspan="5">Loading tags...</td></tr>');
    
    api.get('/admin/tags/index.php')
        .then(function(response) {
            console.log('Tags response:', response);
            
            if (response.success && response.data) {
                renderTags(response.data.tags);
            } else {
                throw new Error(response.error || 'Invalid response format');
            }
        })
        .catch(function(error) {
            console.error('Error loading tags:', error);
            $tbody.html('<tr><td colspan="5" style="color: red; text-align: center;">Error: ' + error.message + '</td></tr>');
        });
}

function renderTags(tags) {
    const $tbody = $('#tagsTable tbody');
    console.log('Rendering tags:', tags);
    
    if (!tags || tags.length === 0) {
        $tbody.html('<tr><td colspan="5" style="text-align: center;">No tags found</td></tr>');
        return;
    }

    let html = '';
    tags.forEach(function(tag) {
        html += `
            <tr>
                <td>${tag.id}</td>
                <td>${escapeHtml(tag.name)}</td>
                <td>
                    <span class="tag" style="background: ${tag.color}; color: white; padding: 2px 8px; border-radius: 3px;">
                        ${tag.color}
                    </span>
                </td>
                <td>${formatDate(tag.created_at)}</td>
                <td>
                    <button class="btn-view" onclick="editTag(${tag.id}, '${escapeHtml(tag.name)}', '${tag.color}')">Edit</button>
                    <button class="btn-danger" onclick="deleteTag(${tag.id})" style="background: #dc3545; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer; margin-left: 5px;">Delete</button>
                </td>
            </tr>
        `;
    });
    
    $tbody.html(html);
}

function saveTag() {
    const tagId = $('#tagId').val();
    const name = $('#tagName').val().trim();
    const color = $('#tagColor').val();
    
    if (!name) {
        alert('Error: Tag name is required');
        return;
    }

    const $btn = $('#tagForm button[type="submit"]');
    const originalText = $btn.text();
    $btn.prop('disabled', true).text('Saving...');
    
    const data = { name, color };
    let promise;
    
    if (tagId) {
        data.id = tagId;
        promise = api.put('/admin/tags/update.php', data);
    } else {
        promise = api.post('/admin/tags/index.php', data);
    }
    
    promise
        .then(function(response) {
            console.log('Save tag response:', response);
            if (response.success) {
                resetTagForm();
                loadTags();
                alert('Success: Tag ' + (tagId ? 'updated' : 'created') + ' successfully');
            } else {
                throw new Error(response.error);
            }
        })
        .catch(function(error) {
            console.error('Error saving tag:', error);
            alert('Error: Failed to save tag: ' + error.message);
        })
        .finally(function() {
            $btn.prop('disabled', false).text(originalText);
        });
}

function deleteTag(id) {
    if (!confirm('Are you sure you want to delete this tag?')) {
        return;
    }
    
    api.delete('/admin/tags/delete.php', { id })
        .then(function(response) {
            console.log('Delete tag response:', response);
            if (response.success) {
                loadTags();
                alert('Success: Tag deleted successfully');
            } else {
                throw new Error(response.error);
            }
        })
        .catch(function(error) {
            console.error('Error deleting tag:', error);
            alert('Error: Failed to delete tag: ' + error.message);
        });
}

function editTag(id, name, color) {
    $('#tagId').val(id);
    $('#tagName').val(name);
    $('#tagColor').val(color);
    $('#tagForm button[type="submit"]').text('Update Tag');
    $('#cancelEdit').show();
}

function resetTagForm() {
    $('#tagForm')[0].reset();
    $('#tagId').val('');
    $('#tagColor').val('#007bff');
    $('#tagForm button[type="submit"]').text('Add Tag');
    $('#cancelEdit').hide();
}

function loadStatuses() {
    loadTasks();
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

function testAdminRendering() {
    const testTasks = [
        {
            id: 1,
            title: "Test Admin Task 1",
            author_name: "testuser",
            status_name: "ToDo",
            priority: "high",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            tags: [
                { id: 1, name: "tech issue", color: "#dc3545" }
            ]
        },
        {
            id: 2,
            title: "Test Admin Task 2", 
            author_name: "admin",
            status_name: "InProgress",
            priority: "medium",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            tags: []
        }
    ];
    
    console.log('Testing admin rendering with:', testTasks);
    renderAdminTasks(testTasks);
}

window.testAdminRendering = testAdminRendering;