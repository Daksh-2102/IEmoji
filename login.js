document.addEventListener('DOMContentLoaded', () => {
  // --- Site-wide Dark Mode Toggle Sync ---
  const siteThemeToggle = document.getElementById("siteThemeToggle");
  if (siteThemeToggle) {
    const savedTheme = localStorage.getItem("siteTheme");
    
    if (savedTheme === "dark") {
      document.body.classList.add("dark-theme");
      siteThemeToggle.textContent = "☀️";
    } else if (savedTheme === "light") {
      document.body.classList.remove("dark-theme");
      siteThemeToggle.textContent = "🌙";
    } else {
      // Auto-detect OS preferences
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add("dark-theme");
        siteThemeToggle.textContent = "☀️";
      }
    }
    
    // Live OS theme preference listener
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem("siteTheme")) {
          if (e.matches) {
            document.body.classList.add("dark-theme");
            siteThemeToggle.textContent = "☀️";
          } else {
            document.body.classList.remove("dark-theme");
            siteThemeToggle.textContent = "🌙";
          }
        }
      });
    }
    
    // Click event for theme toggle
    siteThemeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-theme");
      const isDark = document.body.classList.contains("dark-theme");
      siteThemeToggle.textContent = isDark ? "☀️" : "🌙";
      localStorage.setItem("siteTheme", isDark ? "dark" : "light");
    });
  }

  // --- Auth Checks ---
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('userData');
  const loginForm = document.getElementById('loginForm');
  const cardContent = document.querySelector('.login-card');

  if (token && user) {
    // User is already logged in, show logged in card with option to logout
    const parsedUser = JSON.parse(user);
    cardContent.innerHTML = `
      <div class="login-header">
        <h1 class="login-title">Already Signed In</h1>
        <p class="login-subtitle">You are logged in as <strong>${escapeHTML(parsedUser.email)}</strong></p>
      </div>
      <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 24px;">
        <button id="goToHomeBtn" class="btn-auth" style="background-color: var(--bg-gray); color: var(--text-dark); border: 1px solid var(--border-light);">Go to Home</button>
        <button id="logoutBtn" class="btn-auth" style="background-color: #ff3b30; color: #ffffff;">Sign Out</button>
      </div>
    `;

    document.getElementById('goToHomeBtn').addEventListener('click', () => {
      window.location.href = 'index.html';
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      window.location.reload();
    });
    return;
  }

  // Helper to escape HTML and prevent XSS
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // --- Login Form Validation and Handler ---
  if (loginForm) {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const submitBtn = document.getElementById('submitBtn');

    // Email validation regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const validateForm = () => {
      let isValid = true;

      // Clear errors
      emailError.textContent = '';
      passwordError.textContent = '';
      emailInput.classList.remove('invalid');
      passwordInput.classList.remove('invalid');

      // Email field checks
      const emailValue = emailInput.value.trim();
      if (!emailValue) {
        emailError.textContent = 'Email address is required.';
        emailInput.classList.add('invalid');
        isValid = false;
      } else if (!emailRegex.test(emailValue)) {
        emailError.textContent = 'Please enter a valid email address (e.g. name@domain.com).';
        emailInput.classList.add('invalid');
        isValid = false;
      }

      // Password field checks
      const passwordValue = passwordInput.value;
      if (!passwordValue) {
        passwordError.textContent = 'Password is required.';
        passwordInput.classList.add('invalid');
        isValid = false;
      } else if (passwordValue.length < 6) {
        passwordError.textContent = 'Password must be at least 6 characters long.';
        passwordInput.classList.add('invalid');
        isValid = false;
      }

      return isValid;
    };

    // Attach real-time validation checks on blur/input
    emailInput.addEventListener('input', () => {
      if (emailInput.value.trim() && emailRegex.test(emailInput.value.trim())) {
        emailError.textContent = '';
        emailInput.classList.remove('invalid');
      }
    });

    passwordInput.addEventListener('input', () => {
      if (passwordInput.value.length >= 6) {
        passwordError.textContent = '';
        passwordInput.classList.remove('invalid');
      }
    });

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!validateForm()) return;

      // Disable inputs and show loading state
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';
      emailInput.disabled = true;
      passwordInput.disabled = true;

      const emailValue = emailInput.value.trim();
      const passwordValue = passwordInput.value;

      try {
        // Simulate remote server response latency (800ms)
        await new Promise(resolve => setTimeout(resolve, 800));

        // Test failure trigger
        if (emailValue.toLowerCase() === 'error@example.com') {
          throw new Error('Invalid email or password combination.');
        }

        // Mock auth response payload
        const mockAuthResponse = {
          token: 'mock-session-jwt-token-abcdef123456',
          user: {
            email: emailValue,
            name: emailValue.split('@')[0],
            role: 'user'
          }
        };

        // Persist token and data
        localStorage.setItem('authToken', mockAuthResponse.token);
        localStorage.setItem('userData', JSON.stringify(mockAuthResponse.user));

        // Redirect to homepage
        window.location.href = 'index.html';

      } catch (err) {
        // Display validation/network error summary
        alert(err.message || 'An error occurred during verification.');
      } finally {
        // Restore input usability on fail
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
        emailInput.disabled = false;
        passwordInput.disabled = false;
      }
    });
  }
});
