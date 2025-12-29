import Utils from './utils.js';

document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.querySelector('input[name="remember"]').checked;

    if (!username || !password) {
        Utils.showAlert('Please fill in all fields', 'warning');
        return;
    }

    const loader = Utils.setLoading(e.target.querySelector('button[type="submit"]'), 'Signing in...');

    try {
        const data = await Utils.apiFetch('/api/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (data.success) {
            Utils.showAlert('Login successful! Welcome back.', 'success');

            if (rememberMe) {
                localStorage.setItem('userId', data.user_id);
                localStorage.setItem('username', username);
            }
            // window.location.href = '/dashboard';
        } else {
            Utils.showAlert('Login failed: ' + data.message, 'error');
        }
    } catch (error) {
        Utils.showAlert('Connection error: ' + error.message, 'error');
    } finally {
        loader.restore();
    }
});

document.querySelector('.forgot-password').addEventListener('click', (e) => {
    e.preventDefault();
    Utils.showAlert('Forgot password functionality is coming soon!', 'info');
});

document.getElementById('password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('loginForm').dispatchEvent(new Event('submit'));
    }
});
