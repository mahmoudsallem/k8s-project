// Signup form handler
document.getElementById('signupForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;

    // Validate inputs
    if (!username || !email || !password || !confirmPassword) {
        alert('Please fill in all fields');
        return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        document.getElementById('confirmPassword').focus();
        return;
    }

    // Check password length
    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }

    // Check terms accepted
    if (!terms) {
        alert('Please accept the Terms and Conditions');
        return;
    }

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating account...';
    submitBtn.disabled = true;

    // Send signup request to backend
    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,  // Using username for the backend
            password: password
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Account created successfully! User ID: ' + data.user_id + '\n\nRedirecting to login...');
                // Store user info
                localStorage.setItem('userId', data.user_id);
                localStorage.setItem('username', username);
                // Redirect to login page
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                alert('Signup failed: ' + data.message);
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

// Real-time password match validation
document.getElementById('confirmPassword').addEventListener('input', function () {
    const password = document.getElementById('password').value;
    const confirmPassword = this.value;

    if (confirmPassword && password !== confirmPassword) {
        this.style.borderColor = '#e74c3c';
    } else {
        this.style.borderColor = '';
    }
});

// Add enter key support
document.getElementById('confirmPassword').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        document.getElementById('signupForm').dispatchEvent(new Event('submit'));
    }
});
