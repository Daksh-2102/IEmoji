(function() {
  const currentPath = window.location.pathname;
  const isLoginPage = currentPath.endsWith('login.html');
  if (isLoginPage) return;

  const authToken = localStorage.getItem('authToken');
  if (!authToken) {
    const nextPath = currentPath + window.location.search + window.location.hash;
    const redirectUrl = `login.html?next=${encodeURIComponent(nextPath)}`;
    window.location.replace(redirectUrl);
  }
})();
