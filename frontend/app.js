// Simple login form handler
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.querySelector('input[name="remember"]').checked;

    // Validate inputs
    if (!username || !password) {
        alert('Please fill in all fields');
        return;
    }

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;

    // Send login request to backend
    // Use relative path - works with Ingress routing
    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Login successful! User ID: ' + data.user_id);
                // Store user info if remember me is checked
                if (rememberMe) {
                    localStorage.setItem('userId', data.user_id);
                    localStorage.setItem('username', username);
                }
                // Optionally redirect to dashboard
                // window.location.href = '/dashboard';
            } else {
                alert('Login failed: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error connecting to server: ' + error.message);
        })
        .finally(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
});

// Handle forgot password link
document.querySelector('.forgot-password').addEventListener('click', function (e) {
    e.preventDefault();
    alert('Forgot password functionality - Coming soon!');
});

// Signup link navigation is handled by HTML href attribute (signup.html)

// Add enter key support for password field
document.getElementById('password').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        document.getElementById('loginForm').dispatchEvent(new Event('submit'));
    }
});
