/**
 * CodeLearnn YouTube Tracker — Popup Script
 * Handles login, status display, and logout.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const loginView = document.getElementById('login-view');
  const statusView = document.getElementById('status-view');
  const loginForm = document.getElementById('login-form');
  const loginBtn = document.getElementById('login-btn');
  const errorMsg = document.getElementById('error-msg');
  const logoutBtn = document.getElementById('logout-btn');

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const apiUrlInput = document.getElementById('api-url');

  const userName = document.getElementById('user-name');
  const userEmail = document.getElementById('user-email');
  const pendingCount = document.getElementById('pending-count');
  const dashboardLink = document.getElementById('dashboard-link');

  // Check current status
  const status = await sendMessage({ type: 'GET_STATUS' });

  if (status.isLoggedIn) {
    showStatusView(status);
  } else {
    showLoginView(status);
  }

  // ─── Login ───

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.style.display = 'none';
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in…';

    const result = await sendMessage({
      type: 'LOGIN',
      data: {
        email: emailInput.value.trim(),
        password: passwordInput.value,
        apiUrl: apiUrlInput.value.trim(),
      },
    });

    if (result.success) {
      const newStatus = await sendMessage({ type: 'GET_STATUS' });
      showStatusView(newStatus);
    } else {
      errorMsg.textContent = result.message || 'Login failed';
      errorMsg.style.display = 'block';
      loginBtn.disabled = false;
      loginBtn.textContent = 'Sign In';
    }
  });

  // ─── Logout ───

  logoutBtn.addEventListener('click', async () => {
    await sendMessage({ type: 'LOGOUT' });
    showLoginView({ apiUrl: apiUrlInput.value });
  });

  // ─── View Helpers ───

  function showLoginView(status) {
    loginView.style.display = 'flex';
    statusView.style.display = 'none';
    if (status?.apiUrl) {
      apiUrlInput.value = status.apiUrl;
    }
  }

  function showStatusView(status) {
    loginView.style.display = 'none';
    statusView.style.display = 'flex';

    if (status.user) {
      userName.textContent = status.user.name || '—';
      userEmail.textContent = status.user.email || '—';
    }
    pendingCount.textContent = status.pendingVideos || 0;

    // Update dashboard link based on API URL
    const apiUrl = status.apiUrl || 'http://localhost:5000/api';
    // Derive frontend URL from API URL (remove /api and change port if needed)
    const frontendBase = apiUrl.replace('/api', '').replace(':5000', ':5173');
    dashboardLink.href = `${frontendBase}/youtube-tracker`;
  }

  function sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        resolve(response || {});
      });
    });
  }
});
