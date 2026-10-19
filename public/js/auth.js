(function () {
    const PUBLIC_PAGES = ['/', '/login', '/register'];
    const path = window.location.pathname.replace(/\/+$/, '') || '/';

    function readUser() {
        try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) { return null; }
    }
    function tokenIsValid(token) {
        if (!token) return false;
        try {
            const p = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            return !p.exp || p.exp * 1000 > Date.now();
        } catch (e) { return false; }
    }
    function clearSession() {
        try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch (e) {}
    }
    function logout() { clearSession(); window.location.replace('/login'); }

    function guard() {
        const valid = tokenIsValid(localStorage.getItem('token'));
        const user = readUser();

        if (PUBLIC_PAGES.includes(path)) {
            if (valid && user && (path === '/login' || path === '/register')) {
                window.location.replace(user.role === 'admin' ? '/admin-dashboard' : '/dashboard');
            }
            return;
        }
        if (!valid || !user) { clearSession(); window.location.replace('/login'); return; }
        if (path === '/admin-dashboard' && user.role !== 'admin') window.location.replace('/dashboard');
    }

    // Any 401 from the server logs the user out cleanly
    const originalFetch = window.fetch.bind(window);
    window.fetch = async function (input, init) {
        const response = await originalFetch(input, init);
        const url = typeof input === 'string' ? input : (input && input.url) || '';
        if (response.status === 401 && url.indexOf('/api/auth/login') === -1 && !PUBLIC_PAGES.includes(path)) {
            clearSession();
            window.location.replace('/login');
        }
        return response;
    };

    function setupNav() {
        const user = readUser();
        const loggedIn = !!user && tokenIsValid(localStorage.getItem('token'));

        document.querySelectorAll('[data-user-name]').forEach(el => {
            el.textContent = user && user.name ? user.name : 'Student';
        });

        document.querySelectorAll('.nav-links').forEach(nav => {
            if (!loggedIn) return;
            let btn = nav.querySelector('#logoutBtn, .logout-link');
            if (!btn) {
                btn = document.createElement('a');
                btn.href = '#';
                btn.textContent = 'Log Out';
                nav.appendChild(btn);
            }
            btn.classList.add('logout-link');
            btn.addEventListener('click', e => { e.preventDefault(); logout(); });
        });

        const adminBtn = document.getElementById('logoutButton');
        if (adminBtn) adminBtn.addEventListener('click', e => { e.preventDefault(); logout(); });
    }

    window.addEventListener('pageshow', e => { if (e.persisted) guard(); });
    guard();
    document.addEventListener('DOMContentLoaded', setupNav);
})();