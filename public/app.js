document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('authToken')) {
        window.location.href = '/login.html';
        return;
    }
    
    const createSessionForm = document.getElementById('create-session-form');
    const sessionsList = document.getElementById('sessions-list');
    const refreshButton = document.getElementById('refresh-sessions');
    const qrCodeModal = new bootstrap.Modal(document.getElementById('qrCodeModal'));
    const qrCodeContainer = document.getElementById('qrcode-container');
    const qrCodeConnected = document.getElementById('qrcode-connected');
    const logoutButton = document.getElementById('logout-button');
    const webhookModal = new bootstrap.Modal(document.getElementById('webhookModal'));
    const addWebhookForm = document.getElementById('add-webhook-form');
    const webhooksList = document.getElementById('webhooks-list');
    const refreshWebhooksButton = document.getElementById('refresh-webhooks');
    const webhookSessionId = document.getElementById('webhook-session-id');
    const usernameDisplay = document.getElementById('username');
    const validDateDisplay = document.getElementById('validDate');
    const myApiKeyDisplay = document.getElementById('myApiKey');
    
    const API_URL = '/api';
    
    loadSessions();
    
    createSessionForm.addEventListener('submit', createSession);
    refreshButton.addEventListener('click', loadSessions);
    logoutButton.addEventListener('click', logout);

    const validDate = new Date(localStorage.getItem('validDate'));
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const formattedDate = validDate.toLocaleString('id-ID', options).replace(',', '');

    usernameDisplay.textContent = "Hello, "+localStorage.getItem('username');
    validDateDisplay.textContent = "Valid Until : "+formattedDate;
    myApiKeyDisplay.value = localStorage.getItem('apiKey');
    
    function logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        localStorage.removeItem('validDate');
        localStorage.removeItem('apiKey');
        window.location.href = '/login.html';
    }
    
    function getAuthHeaders() {
        const apiKey = localStorage.getItem('apiKey');
        return {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };
    }
    
    async function loadSessions() {
        try {
            const response = await fetch(`${API_URL}/sessions`, {
                headers: getAuthHeaders()
            });
            
            if (response.status === 401) {
                logout();
                return;
            }
            
            const data = await response.json();
            
            if (response.ok) {
                renderSessions(data.sessions);
            } else {
                showError('Something was wrong while loading sessions ' + data.error);
            }
        } catch (error) {
            showError('Something was wrong with server: ' + error.message);
        }
    }
    
    async function createSession(event) {
        event.preventDefault();
        
        const sessionId = document.getElementById('sessionId').value.trim();
        
        if (!sessionId) {
            showError('Required session ID');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/sessions`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ sessionId })
            });
            
            if (response.status === 401) {
                logout();
                return;
            }
            
            const data = await response.json();
            
            if (response.ok) {
                document.getElementById('sessionId').value = '';
                loadSessions();
                showQRCode(sessionId);
            } else {
                showError('Somethins was wrong whloe creating a session: ' + data.error);
            }
        } catch (error) {
            showError('Something was wrong with server: ' + error.message);
        }
    }
    
    function showQRCode(sessionId) {
        qrCodeContainer.innerHTML = `
            <div class="spinner-border text-success" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading QR...</p>
        `;
        qrCodeContainer.classList.remove('d-none');
        qrCodeConnected.classList.add('d-none');
        
        qrCodeModal.show();
        
        const qrInterval = setInterval(async () => {
            try {
                const response = await fetch(`${API_URL}/sessions/${sessionId}/qr`, {
                    headers: getAuthHeaders()
                });
                
                if (response.status === 401) {
                    clearInterval(qrInterval);
                    qrCodeModal.hide();
                    logout();
                    return;
                }
                
                const data = await response.json();
                
                if (response.ok && data.qrCode) {
                    console.log('QR code received from API');
                    qrCodeContainer.innerHTML = '';
                    
                    try {
                        console.log('Generating QR code image');
                        QRCode.toDataURL(data.qrCode, { 
                            width: 256,
                            margin: 1,
                            color: {
                                dark: '#25D366',
                                light: '#FFFFFF'
                            }
                        }, function(error, url) {
                            if (error) {
                                console.error('Error generating QR code URL:', error);
                                qrCodeContainer.innerHTML = `<p class="text-danger">Error generating QR code: ${error}</p>`;
                            } else {
                                console.log('QR code generated successfully');
                                const img = document.createElement('img');
                                img.src = url;
                                img.alt = 'WhatsApp QR Code';
                                img.className = 'qr-code-img';
                                qrCodeContainer.innerHTML = '';
                                qrCodeContainer.appendChild(img);
                                
                                const instructionsElement = document.createElement('p');
                                instructionsElement.classList.add('mt-3');
                                instructionsElement.innerHTML = `
                                    <strong>Instruction:</strong><br>
                                    1. Open WhatsApp on your phone<br>
                                    2. Tap Menu or Settings and select WhatsApp Web<br>
                                    3. Point your phone's camera at this QR code
                                `;
                                qrCodeContainer.appendChild(instructionsElement);
                            }
                        });
                    } catch (error) {
                        console.error('Error generating QR code:', error);
                        qrCodeContainer.innerHTML = `<p class="text-danger">Error generating QR code: ${error}</p>`;
                    }
                } else if (response.status === 404) {
                    console.log('QR code not available, checking if session is connected');
                    const sessionResponse = await fetch(`${API_URL}/sessions/${sessionId}`, {
                        headers: getAuthHeaders()
                    });
                    
                    if (sessionResponse.status === 401) {
                        clearInterval(qrInterval);
                        qrCodeModal.hide();
                        logout();
                        return;
                    }
                    
                    const sessionData = await sessionResponse.json();
                    
                    if (sessionResponse.ok && sessionData.session.isConnected) {
                        clearInterval(qrInterval);
                        qrCodeContainer.classList.add('d-none');
                        qrCodeConnected.classList.remove('d-none');
                        loadSessions();
                    }
                }
            } catch (error) {
                console.error('Error retrieving QR code:', error);
            }
        }, 2000);
        
        document.getElementById('qrCodeModal').addEventListener('hidden.bs.modal', () => {
            clearInterval(qrInterval);
        });
    }
    
    function renderSessions(sessions) {
        if (!sessions || sessions.length === 0) {
            sessionsList.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-exclamation-circle"></i> No sessions found
                </div>
            `;
            return;
        }
        
        sessionsList.innerHTML = '';
        
        sessions.forEach(session => {
            fetch(`${API_URL}/sessions/${session.sessionId}`, {
                headers: getAuthHeaders()
            })
                .then(res => {
                    if (res.status === 401) {
                        logout();
                        return null;
                    }
                    return res.json();
                })
                .then(data => {
                    if (!data) return;
                    
                    const isConnected = data.session.isConnected;
                    const statusClass = isConnected ? 'connected' : 'disconnected';
                    const statusBadge = isConnected 
                        ? '<span class="badge bg-success status-badge">Connected</span>' 
                        : '<span class="badge bg-danger status-badge">Disconnected</span>';
                    
                    const sessionElement = document.createElement('div');
                    sessionElement.className = `list-group-item session-item ${statusClass} d-flex justify-content-between align-items-center`;
                    sessionElement.innerHTML = `
                        <div>
                            <h6 class="mb-1">${session.sessionId}</h6>
                            <small class="text-muted">Created At: ${new Date(session.createdAt).toLocaleString()}</small>
                            <div class="mt-1">${statusBadge}</div>
                        </div>
                        <div class="session-actions">
                            ${!isConnected ? `
                                <button class="btn btn-sm btn-outline-primary show-qr" data-session-id="${session.sessionId}">
                                    <i class="bi bi-qr-code"></i> QR Code
                                </button>
                            ` : ''}
                            <button class="btn btn-sm btn-outline-info manage-webhooks" data-session-id="${session.sessionId}">
                                <i class="bi bi-link-45deg"></i> Webhooks
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-session" data-session-id="${session.sessionId}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    `;
                    
                    const qrButton = sessionElement.querySelector('.show-qr');
                    if (qrButton) {
                        qrButton.addEventListener('click', () => {
                            showQRCode(session.sessionId);
                        });
                    }
                    
                    const webhookButton = sessionElement.querySelector('.manage-webhooks');
                    webhookButton.addEventListener('click', () => {
                        showWebhookManager(session.sessionId);
                    });
                    
                    const deleteButton = sessionElement.querySelector('.delete-session');
                    deleteButton.addEventListener('click', () => {
                        deleteSession(session.sessionId);
                    });
                    
                    sessionsList.appendChild(sessionElement);
                })
                .catch(error => {
                    console.error('Error checking session status:', error);
                });
        });
    }
    
    async function deleteSession(sessionId) {
        if (!confirm(`Are you sure you want to delete the session? "${sessionId}"?`)) {
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (response.status === 401) {
                logout();
                return;
            }
            
            if (response.ok) {
                loadSessions();
            } else {
                const data = await response.json();
                showError('Error deleting session: ' + data.error);
            }
        } catch (error) {
            showError('Error connecting to server: ' + error.message);
        }
    }
    
    function showError(message) {
        alert(message);
    }
    
    function showWebhookManager(sessionId) {
        webhookSessionId.textContent = sessionId;
        
        document.getElementById('webhook-url').value = '';
        document.querySelectorAll('.webhook-event').forEach(checkbox => {
            checkbox.checked = checkbox.id === 'event-messages-received';
        });
        
        loadWebhooks(sessionId);
        
        webhookModal.show();
    }
    
    async function loadWebhooks(sessionId) {
        try {
            const response = await fetch(`${API_URL}/webhooks?sessionId=${sessionId}`, {
                headers: getAuthHeaders()
            });
            
            if (response.status === 401) {
                webhookModal.hide();
                logout();
                return;
            }
            
            const data = await response.json();
            
            if (response.ok) {
                renderWebhooks(data.webhooks);
            } else {
                showError('Error loading webhooks: ' + data.error);
            }
        } catch (error) {
            showError('Error connecting to server: ' + error.message);
        }
    }
    
    function renderWebhooks(webhooks) {
        if (!webhooks || webhooks.length === 0) {
            webhooksList.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-exclamation-circle"></i> No webhook configured
                </div>
            `;
            return;
        }
        
        webhooksList.innerHTML = '';
        
        webhooks.forEach(webhook => {
            const webhookElement = document.createElement('div');
            webhookElement.className = 'list-group-item webhook-item d-flex justify-content-between align-items-center';
            
            const eventBadges = webhook.events.map(event => {
                let badgeClass = 'bg-secondary';
                let eventName = event;
                
                if (event === 'messages.received') {
                    badgeClass = 'bg-primary';
                    eventName = 'Messages';
                } else if (event === 'connection.open') {
                    badgeClass = 'bg-success';
                    eventName = 'Connection';
                } else if (event === 'connection.logout') {
                    badgeClass = 'bg-danger';
                    eventName = 'Logout';
                } else if (event === 'qr.update') {
                    badgeClass = 'bg-warning';
                    eventName = 'QR Code';
                }
                
                return `<span class="badge ${badgeClass} me-1">${eventName}</span>`;
            }).join('');
            
            webhookElement.innerHTML = `
                <div>
                    <h6 class="mb-1">${webhook.url}</h6>
                    <small class="text-muted">Created At: ${new Date(webhook.createdAt).toLocaleString()}</small>
                    <div class="mt-1">${eventBadges}</div>
                </div>
                <div class="webhook-actions">
                    <button class="btn btn-sm btn-outline-danger delete-webhook" data-webhook-id="${webhook.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
            
            const deleteButton = webhookElement.querySelector('.delete-webhook');
            deleteButton.addEventListener('click', () => {
                deleteWebhook(webhook.id);
            });
            
            webhooksList.appendChild(webhookElement);
        });
    }
    
    async function addWebhook(event) {
        event.preventDefault();
        
        const sessionId = webhookSessionId.textContent;
        const url = document.getElementById('webhook-url').value.trim();
        
        const events = [];
        document.querySelectorAll('.webhook-event:checked').forEach(checkbox => {
            events.push(checkbox.value);
        });
        
        if (!url) {
            showError('Webhook URL is required');
            return;
        }
        
        if (events.length === 0) {
            showError('Select at least one event');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/webhooks`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ sessionId, url, events })
            });
            
            if (response.status === 401) {
                webhookModal.hide();
                logout();
                return;
            }
            
            const data = await response.json();
            
            if (response.ok) {
                document.getElementById('webhook-url').value = '';
                document.querySelectorAll('.webhook-event').forEach(checkbox => {
                    checkbox.checked = checkbox.id === 'event-messages-received';
                });
                
                loadWebhooks(sessionId);
            } else {
                showError('Error adding webhook: ' + data.error);
            }
        } catch (error) {
            showError('Error connecting to server: ' + error.message);
        }
    }
    
    async function deleteWebhook(webhookId) {
        if (!confirm('Are you sure you want to delete this webhook??')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/webhooks/${webhookId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (response.status === 401) {
                webhookModal.hide();
                logout();
                return;
            }
            
            if (response.ok) {
                loadWebhooks(webhookSessionId.textContent);
            } else {
                const data = await response.json();
                showError('Erro ao excluir webhook: ' + data.error);
            }
        } catch (error) {
            showError('Erro ao conectar com o servidor: ' + error.message);
        }
    }
    
    addWebhookForm.addEventListener('submit', addWebhook);
    refreshWebhooksButton.addEventListener('click', () => {
        loadWebhooks(webhookSessionId.textContent);
    });
});
