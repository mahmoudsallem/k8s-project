import Utils from './utils.js';

document.getElementById('signupForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;

    if (!username || !email || !password || !confirmPassword) {
        Utils.showAlert('Please fill in all fields', 'warning');
        return;
    }

    if (password !== confirmPassword) {
        Utils.showAlert('Passwords do not match!', 'error');
        document.getElementById('confirmPassword').focus();
        return;
    }

    if (password.length < 6) {
        Utils.showAlert('Password must be at least 6 characters long', 'warning');
        return;
    }

    if (!terms) {
        Utils.showAlert('Please accept the Terms and Conditions', 'warning');
        return;
    }

    const loader = Utils.setLoading(e.target.querySelector('button[type="submit"]'), 'Creating account...');

    try {
        const data = await Utils.apiFetch('/api/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (data.success) {
            Utils.showAlert('Account created successfully!\nRedirecting to login...', 'success');
            localStorage.setItem('userId', data.user_id);
            localStorage.setItem('username', username);

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            Utils.showAlert('Signup failed: ' + data.message, 'error');
        }
    } catch (error) {
        Utils.showAlert('Connection error: ' + error.message, 'error');
    } finally {
        loader.restore();
    }
});

// Real-time password match validation
document.getElementById('confirmPassword').addEventListener('input', function () {
    const password = document.getElementById('password').value;
    const confirmPassword = this.value;

    if (confirmPassword && password !== confirmPassword) {
        this.style.borderColor = 'var(--error)';
    } else {
        this.style.borderColor = '';
    }
});

document.getElementById('confirmPassword').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('signupForm').dispatchEvent(new Event('submit'));
    }
});
