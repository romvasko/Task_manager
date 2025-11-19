$(document).ready(function() {
    const token = localStorage.getItem('authToken');
    const currentPage = window.location.pathname;
    
    if (token && (currentPage.includes('login.html') || currentPage.includes('register.html'))) {
        window.location.href = 'tasks.html';
    } else if (!token && currentPage.includes('tasks.html')) {
        window.location.href = 'login.html';
    }

$('#loginForm').on('submit', function(e) {
    e.preventDefault();
    const username = $('#username').val();
    const password = $('#password').val();

    if (!username || !password) {
        alert('Please fill in all fields');
        return;
    }

    const $btn = $(this).find('button');
    $btn.prop('disabled', true).text('Logging in...');

    api.post('/auth/login.php', { username, password })
        .then(function(response) {
            api.setToken(response.token);
            localStorage.setItem('userRole', response.user.role);
            
            if (response.user.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'tasks.html';
            }
        })
        .catch(function(error) {
            alert('Error: ' + error.message);
        })
        .finally(function() {
            $btn.prop('disabled', false).text('Login');
        });
});

    $('#registerForm').on('submit', function(e) {
        e.preventDefault();
        const username = $('#username').val();
        const password = $('#password').val();

        if (!username || !password) {
            utils.showMessage('Please fill in all fields', 'error');
            return;
        }

        const $btn = $(this).find('button');
        $btn.prop('disabled', true).text('Registering...');

        api.post('/auth/register.php', { username, password })
            .then(function() {
                utils.showMessage('Registration successful! Please login.');
                window.location.href = 'login.html';
            })
            .catch(function(error) {
                utils.showMessage(error.message, 'error');
            })
            .always(function() {
                $btn.prop('disabled', false).text('Register');
            });
    });

    $('#logoutBtn').on('click', function() {
        api.removeToken();
        window.location.href = 'login.html';
    });
});