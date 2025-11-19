class ApiClient {
    constructor() {
        this.baseUrl = '';
        this.token = localStorage.getItem('authToken');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    removeToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    async request(endpoint, options = {}) {
        if (!endpoint.startsWith('/api')) {
            endpoint = '/api' + endpoint;
        }
        
        const url = this.baseUrl + endpoint;
        const config = {
            contentType: 'application/json',
            dataType: 'json',
            ...options
        };

        if (this.token) {
            config.headers = {
                'Authorization': `Bearer ${this.token}`
            };
        }

        if (config.data && typeof config.data === 'object') {
            config.data = JSON.stringify(config.data);
        }

        try {
            const response = await $.ajax(url, config);
            return response;
        } catch (error) {
            console.error('API request failed:', error);
            const errorMessage = error.responseJSON?.error || 
                               error.responseJSON?.message || 
                               error.statusText || 
                               'Request failed';
            throw new Error(errorMessage);
        }
    }

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    post(endpoint, data) {
        return this.request(endpoint, { 
            method: 'POST',
            data: data
        });
    }

    put(endpoint, data) {
        return this.request(endpoint, { 
            method: 'PUT',
            data: data
        });
    }

    delete(endpoint, data) {
        return this.request(endpoint, { 
            method: 'DELETE',
            data: data
        });
    }
}

const api = new ApiClient();

const utils = {
    escapeHtml(unsafe) {
        return $('<div>').text(unsafe).html();
    },

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    },

    showError(message) {
        alert('Error: ' + message);
    },

    showSuccess(message) {
        alert('Success: ' + message);
    }
};