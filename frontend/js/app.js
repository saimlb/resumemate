document.addEventListener('DOMContentLoaded', () => {
    if (isAuthenticated()) {
        redirectToDashboard();
        return;
    }

    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const getStartedBtn = document.getElementById('getStartedBtn');
    const freePlanBtn = document.getElementById('freePlanBtn');
    const proPlanBtn = document.getElementById('proPlanBtn');
    const premiumPlanBtn = document.getElementById('premiumPlanBtn');

    function openModal(modal) {
        modal.style.display = 'block';
    }

    function closeModal(modal) {
        modal.style.display = 'none';
    }

    window.addEventListener('click', (e) => {
        if (e.target === loginModal) closeModal(loginModal);
        if (e.target === registerModal) closeModal(registerModal);
    });

    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            const modal = closeBtn.closest('.modal');
            if (modal) closeModal(modal);
        });
    });

    loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(loginModal);
    });

    registerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(registerModal);
    });

    document.getElementById('switchToLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(registerModal);
        openModal(loginModal);
    });

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;

        if (!name || !email || !password) {
            showToast('Por favor, completa todos los campos.', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('La contraseña debe tener al menos 6 caracteres.', 'error');
            return;
        }

        try {
            showToast('Registrando usuario...', 'info');
            await register(name, email, password);
            showToast('¡Registro exitoso! Bienvenido a ResumeMate.', 'success');
            setTimeout(redirectToDashboard, 1000);
        } catch (error) {
            showToast(error.message || 'Error al registrar usuario.', 'error');
        }
    });

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            showToast('Por favor, completa todos los campos.', 'error');
            return;
        }

        try {
            showToast('Iniciando sesión...', 'info');
            await login(email, password);
            showToast('¡Bienvenido de vuelta!', 'success');
            setTimeout(redirectToDashboard, 1000);
        } catch (error) {
            showToast(error.message || 'Error al iniciar sesión.', 'error');
        }
    });

    getStartedBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(registerModal);
    });

    freePlanBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(registerModal);
    });

    proPlanBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('💳 DEMO: Selecciona el plan Pro por 19€/mes (pago simulado). Regístrate primero.', 'warning');
        openModal(registerModal);
    });

    premiumPlanBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('💳 DEMO: Selecciona el plan Premium por 59€/mes (pago simulado). Regístrate primero.', 'warning');
        openModal(registerModal);
    });
});