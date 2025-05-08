document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticação
    if (!localStorage.getItem('authToken')) {
        // Redirecionar para a página de login
        window.location.href = '/login.html';
        return;
    }
    
    // Elementos da UI
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
    
    // API Base URL
    const API_URL = '/api';
    
    // Carregar sessões ao iniciar
    loadSessions();
    
    // Event listeners
    createSessionForm.addEventListener('submit', createSession);
    refreshButton.addEventListener('click', loadSessions);
    logoutButton.addEventListener('click', logout);
    
    // Função para fazer logout
    function logout() {
        localStorage.removeItem('authToken');
        window.location.href = '/login.html';
    }
    
    // Função para obter o token de autenticação
    function getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
    
    // Função para carregar todas as sessões
    async function loadSessions() {
        try {
            const response = await fetch(`${API_URL}/sessions`, {
                headers: getAuthHeaders()
            });
            
            // Verificar se o token expirou
            if (response.status === 401) {
                logout();
                return;
            }
            
            const data = await response.json();
            
            if (response.ok) {
                renderSessions(data.sessions);
            } else {
                showError('Erro ao carregar sessões: ' + data.error);
            }
        } catch (error) {
            showError('Erro ao conectar com o servidor: ' + error.message);
        }
    }
    
    // Função para criar uma nova sessão
    async function createSession(event) {
        event.preventDefault();
        
        const sessionId = document.getElementById('sessionId').value.trim();
        
        if (!sessionId) {
            showError('O ID da sessão é obrigatório');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/sessions`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ sessionId })
            });
            
            // Verificar se o token expirou
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
                showError('Erro ao criar sessão: ' + data.error);
            }
        } catch (error) {
            showError('Erro ao conectar com o servidor: ' + error.message);
        }
    }
    
    // Função para exibir o QR Code
    function showQRCode(sessionId) {
        // Resetar o modal
        qrCodeContainer.innerHTML = `
            <div class="spinner-border text-success" role="status">
                <span class="visually-hidden">Carregando...</span>
            </div>
            <p class="mt-2">Carregando código QR...</p>
        `;
        qrCodeContainer.classList.remove('d-none');
        qrCodeConnected.classList.add('d-none');
        
        // Mostrar o modal
        qrCodeModal.show();
        
        // Iniciar polling para obter o QR code
        const qrInterval = setInterval(async () => {
            try {
                const response = await fetch(`${API_URL}/sessions/${sessionId}/qr`, {
                    headers: getAuthHeaders()
                });
                
                // Verificar se o token expirou
                if (response.status === 401) {
                    clearInterval(qrInterval);
                    qrCodeModal.hide();
                    logout();
                    return;
                }
                
                const data = await response.json();
                
                if (response.ok && data.qrCode) {
                    console.log('QR code received from API');
                    // Limpar o container
                    qrCodeContainer.innerHTML = '';
                    
                    try {
                        // Gerar QR code como URL de dados
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
                                qrCodeContainer.innerHTML = `<p class="text-danger">Erro ao gerar QR code: ${error}</p>`;
                            } else {
                                console.log('QR code generated successfully');
                                const img = document.createElement('img');
                                img.src = url;
                                img.alt = 'WhatsApp QR Code';
                                img.className = 'qr-code-img';
                                qrCodeContainer.innerHTML = '';
                                qrCodeContainer.appendChild(img);
                                
                                // Adicionar instruções
                                const instructionsElement = document.createElement('p');
                                instructionsElement.classList.add('mt-3');
                                instructionsElement.innerHTML = `
                                    <strong>Instruções:</strong><br>
                                    1. Abra o WhatsApp no seu telefone<br>
                                    2. Toque em Menu ou Configurações e selecione WhatsApp Web<br>
                                    3. Aponte a câmera do seu telefone para este código QR
                                `;
                                qrCodeContainer.appendChild(instructionsElement);
                            }
                        });
                    } catch (error) {
                        console.error('Error generating QR code:', error);
                        qrCodeContainer.innerHTML = `<p class="text-danger">Erro ao gerar QR code: ${error}</p>`;
                    }
                } else if (response.status === 404) {
                    console.log('QR code not available, checking if session is connected');
                    // Verificar se a sessão está conectada
                    const sessionResponse = await fetch(`${API_URL}/sessions/${sessionId}`, {
                        headers: getAuthHeaders()
                    });
                    
                    // Verificar se o token expirou
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
                console.error('Erro ao obter QR code:', error);
            }
        }, 2000);
        
        // Limpar o intervalo quando o modal for fechado
        document.getElementById('qrCodeModal').addEventListener('hidden.bs.modal', () => {
            clearInterval(qrInterval);
        });
    }
    
    // Função para renderizar a lista de sessões
    function renderSessions(sessions) {
        if (!sessions || sessions.length === 0) {
            sessionsList.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-exclamation-circle"></i> Nenhuma sessão encontrada
                </div>
            `;
            return;
        }
        
        sessionsList.innerHTML = '';
        
        sessions.forEach(session => {
            // Verificar status da sessão
            fetch(`${API_URL}/sessions/${session.sessionId}`, {
                headers: getAuthHeaders()
            })
                .then(res => {
                    // Verificar se o token expirou
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
                        ? '<span class="badge bg-success status-badge">Conectado</span>' 
                        : '<span class="badge bg-danger status-badge">Desconectado</span>';
                    
                    const sessionElement = document.createElement('div');
                    sessionElement.className = `list-group-item session-item ${statusClass} d-flex justify-content-between align-items-center`;
                    sessionElement.innerHTML = `
                        <div>
                            <h6 class="mb-1">${session.sessionId}</h6>
                            <small class="text-muted">Criado em: ${new Date(session.createdAt).toLocaleString()}</small>
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
                    
                    // Adicionar event listeners
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
                    console.error('Erro ao verificar status da sessão:', error);
                });
        });
    }
    
    // Função para deletar uma sessão
    async function deleteSession(sessionId) {
        if (!confirm(`Tem certeza que deseja excluir a sessão "${sessionId}"?`)) {
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            // Verificar se o token expirou
            if (response.status === 401) {
                logout();
                return;
            }
            
            if (response.ok) {
                loadSessions();
            } else {
                const data = await response.json();
                showError('Erro ao excluir sessão: ' + data.error);
            }
        } catch (error) {
            showError('Erro ao conectar com o servidor: ' + error.message);
        }
    }
    
    // Função para exibir mensagens de erro
    function showError(message) {
        alert(message);
    }
    
    // Função para mostrar o gerenciador de webhooks
    function showWebhookManager(sessionId) {
        // Armazenar o ID da sessão
        webhookSessionId.textContent = sessionId;
        
        // Limpar formulário
        document.getElementById('webhook-url').value = '';
        document.querySelectorAll('.webhook-event').forEach(checkbox => {
            checkbox.checked = checkbox.id === 'event-messages-received';
        });
        
        // Carregar webhooks existentes
        loadWebhooks(sessionId);
        
        // Mostrar modal
        webhookModal.show();
    }
    
    // Função para carregar webhooks
    async function loadWebhooks(sessionId) {
        try {
            const response = await fetch(`${API_URL}/webhooks?sessionId=${sessionId}`, {
                headers: getAuthHeaders()
            });
            
            // Verificar se o token expirou
            if (response.status === 401) {
                webhookModal.hide();
                logout();
                return;
            }
            
            const data = await response.json();
            
            if (response.ok) {
                renderWebhooks(data.webhooks);
            } else {
                showError('Erro ao carregar webhooks: ' + data.error);
            }
        } catch (error) {
            showError('Erro ao conectar com o servidor: ' + error.message);
        }
    }
    
    // Função para renderizar webhooks
    function renderWebhooks(webhooks) {
        if (!webhooks || webhooks.length === 0) {
            webhooksList.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-exclamation-circle"></i> Nenhum webhook configurado
                </div>
            `;
            return;
        }
        
        webhooksList.innerHTML = '';
        
        webhooks.forEach(webhook => {
            const webhookElement = document.createElement('div');
            webhookElement.className = 'list-group-item webhook-item d-flex justify-content-between align-items-center';
            
            // Formatar eventos
            const eventBadges = webhook.events.map(event => {
                let badgeClass = 'bg-secondary';
                let eventName = event;
                
                if (event === 'messages.received') {
                    badgeClass = 'bg-primary';
                    eventName = 'Mensagens';
                } else if (event === 'connection.open') {
                    badgeClass = 'bg-success';
                    eventName = 'Conexão';
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
                    <small class="text-muted">Criado em: ${new Date(webhook.createdAt).toLocaleString()}</small>
                    <div class="mt-1">${eventBadges}</div>
                </div>
                <div class="webhook-actions">
                    <button class="btn btn-sm btn-outline-danger delete-webhook" data-webhook-id="${webhook.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
            
            // Adicionar event listener para excluir webhook
            const deleteButton = webhookElement.querySelector('.delete-webhook');
            deleteButton.addEventListener('click', () => {
                deleteWebhook(webhook.id);
            });
            
            webhooksList.appendChild(webhookElement);
        });
    }
    
    // Função para adicionar webhook
    async function addWebhook(event) {
        event.preventDefault();
        
        const sessionId = webhookSessionId.textContent;
        const url = document.getElementById('webhook-url').value.trim();
        
        // Obter eventos selecionados
        const events = [];
        document.querySelectorAll('.webhook-event:checked').forEach(checkbox => {
            events.push(checkbox.value);
        });
        
        if (!url) {
            showError('A URL do webhook é obrigatória');
            return;
        }
        
        if (events.length === 0) {
            showError('Selecione pelo menos um evento');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/webhooks`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ sessionId, url, events })
            });
            
            // Verificar se o token expirou
            if (response.status === 401) {
                webhookModal.hide();
                logout();
                return;
            }
            
            const data = await response.json();
            
            if (response.ok) {
                // Limpar formulário
                document.getElementById('webhook-url').value = '';
                document.querySelectorAll('.webhook-event').forEach(checkbox => {
                    checkbox.checked = checkbox.id === 'event-messages-received';
                });
                
                // Recarregar webhooks
                loadWebhooks(sessionId);
            } else {
                showError('Erro ao adicionar webhook: ' + data.error);
            }
        } catch (error) {
            showError('Erro ao conectar com o servidor: ' + error.message);
        }
    }
    
    // Função para excluir webhook
    async function deleteWebhook(webhookId) {
        if (!confirm('Tem certeza que deseja excluir este webhook?')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/webhooks/${webhookId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            // Verificar se o token expirou
            if (response.status === 401) {
                webhookModal.hide();
                logout();
                return;
            }
            
            if (response.ok) {
                // Recarregar webhooks
                loadWebhooks(webhookSessionId.textContent);
            } else {
                const data = await response.json();
                showError('Erro ao excluir webhook: ' + data.error);
            }
        } catch (error) {
            showError('Erro ao conectar com o servidor: ' + error.message);
        }
    }
    
    // Event listeners para webhooks
    addWebhookForm.addEventListener('submit', addWebhook);
    refreshWebhooksButton.addEventListener('click', () => {
        loadWebhooks(webhookSessionId.textContent);
    });
});
