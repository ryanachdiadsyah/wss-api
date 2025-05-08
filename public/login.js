document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const loginButton = document.getElementById('login-button');
    const loginButtonText = document.getElementById('login-button-text');
    const loginSpinner = document.getElementById('login-spinner');
    
    // Check if user is already logged in
    if (localStorage.getItem('authToken')) {
        // Redirect to main page
        window.location.href = '/';
    }
    
    // Handle login form submission
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        // Get form data
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        // Show loading state
        loginButton.disabled = true;
        loginButtonText.classList.add('d-none');
        loginSpinner.classList.remove('d-none');
        loginError.classList.add('d-none');
        
        try {
            // Send login request
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store token in local storage
                localStorage.setItem('authToken', data.token);
                
                // Redirect to main page
                window.location.href = '/';
            } else {
                // Show error message
                loginError.textContent = data.error || 'Falha na autenticação';
                loginError.classList.remove('d-none');
                
                // Reset form
                document.getElementById('password').value = '';
            }
        } catch (error) {
            console.error('Login error:', error);
            loginError.textContent = 'Erro ao conectar com o servidor';
            loginError.classList.remove('d-none');
        } finally {
            // Reset button state
            loginButton.disabled = false;
            loginButtonText.classList.remove('d-none');
            loginSpinner.classList.add('d-none');
        }
    });
});
