document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const loginButton = document.getElementById('login-button');
    const loginButtonText = document.getElementById('login-button-text');
    const loginSpinner = document.getElementById('login-spinner');
    
    if (localStorage.getItem('authToken')) {
        window.location.href = '/';
    }
    
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        loginButton.disabled = true;
        loginButtonText.classList.add('d-none');
        loginSpinner.classList.remove('d-none');
        loginError.classList.add('d-none');
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('username', data.user.username);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('validDate', data.user.validDate);
                localStorage.setItem('apiKey', data.user.apiKey);
                localStorage.setItem('maxSession', data.user.maxSession);
                window.location.href = '/';
            } else {
                loginError.textContent = data.error || 'Authentication failed';
                loginError.classList.remove('d-none');
                
                document.getElementById('password').value = '';
            }
        } catch (error) {
            console.error('Login error:', error);
            loginError.textContent = 'Error connecting to server';
            loginError.classList.remove('d-none');
        } finally {
            loginButton.disabled = false;
            loginButtonText.classList.remove('d-none');
            loginSpinner.classList.add('d-none');
        }
    });
});
