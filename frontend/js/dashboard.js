// Configuración de Paddle
let paddleInitialized = false;

document.addEventListener('DOMContentLoaded', async () => {
    if (!isAuthenticated()) {
        redirectToLogin();
        return;
    }

    await loadDashboard();

    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    document.getElementById('buyCreditsBtn').addEventListener('click', () => {
        document.getElementById('buyCreditsModal').style.display = 'block';
    });

    document.getElementById('buyCreditsCard')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('buyCreditsModal').style.display = 'block';
    });

    document.querySelector('#buyCreditsModal .close').addEventListener('click', () => {
        document.getElementById('buyCreditsModal').style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('buyCreditsModal')) {
            document.getElementById('buyCreditsModal').style.display = 'none';
        }
    });

    // Botones de compra con Paddle
    document.querySelectorAll('.purchase-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const plan = btn.closest('.purchase-card').dataset.plan;
            await handlePurchase(plan);
        });
    });

    document.getElementById('historyLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        loadHistory();
    });

    // Verificar estado de pago al cargar la página
    checkPaymentStatus();

    // Inicializar Paddle si el token está disponible
    if (window.PADDLE_CLIENT_TOKEN && window.PADDLE_CLIENT_TOKEN !== '{{PADDLE_CLIENT_TOKEN}}') {
        try {
            Paddle.Environment.set('sandbox');
            Paddle.Initialize({
                token: window.PADDLE_CLIENT_TOKEN
            });
            paddleInitialized = true;
            console.log('✅ Paddle inicializado correctamente');
        } catch (error) {
            console.error('❌ Error al inicializar Paddle:', error);
        }
    } else {
        console.warn('⚠️ Token de Paddle no encontrado');
    }
});

async function loadDashboard() {
    try {
        const user = await getUserProfile();
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('creditsCount').textContent = user.credits;
        await loadHistory();
        await loadStats();
    } catch (error) {
        showToast('Error al cargar el dashboard.', 'error');
        console.error(error);
    }
}

async function loadHistory() {
    try {
        const history = await getHistory();
        const historyList = document.getElementById('historyList');
        
        if (!history || history.length === 0) {
            historyList.innerHTML = '<p class="empty-message">Aún no has realizado ningún análisis.</p>';
            return;
        }

        historyList.innerHTML = history.map(item => `
            <div class="history-item">
                <span class="file-name">📄 ${item.original_name}</span>
                <span class="score">${item.score}/100</span>
                <span class="date">${new Date(item.created_at).toLocaleDateString('es-ES')}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

async function loadStats() {
    try {
        const history = await getHistory();
        if (!history || history.length === 0) {
            document.getElementById('totalAnalyses').textContent = '0';
            document.getElementById('avgScore').textContent = '0';
            document.getElementById('bestScore').textContent = '0';
            document.getElementById('creditsUsed').textContent = '0';
            return;
        }

        const total = history.length;
        const scores = history.map(h => h.score);
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / total);
        const best = Math.max(...scores);
        
        const user = await getUserProfile();
        const initialCredits = user.plan === 'free' ? 2 : (user.plan === 'pro' ? 20 : 100);
        const creditsUsed = initialCredits - user.credits;

        document.getElementById('totalAnalyses').textContent = total;
        document.getElementById('avgScore').textContent = avg;
        document.getElementById('bestScore').textContent = best;
        document.getElementById('creditsUsed').textContent = creditsUsed > 0 ? creditsUsed : 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ============================================
// FUNCIONES DE PAGO CON PADDLE
// ============================================

async function handlePurchase(plan) {
    try {
        const planNames = {
            'pro': 'Plan Pro (20 créditos por 19€)',
            'premium': 'Plan Premium (100 créditos por 59€)'
        };

        showToast(`🔄 Procesando pago con Paddle para ${planNames[plan]}...`, 'info');
        
        // Llamar al backend para crear el checkout de Paddle
        const result = await apiCall('/payments/create-checkout', {
            method: 'POST',
            body: JSON.stringify({ plan })
        });
        
        console.log('✅ Respuesta del backend:', result);
        
        if (result && result.url) {
            // Redirigir al checkout de Paddle
            showToast('🔀 Redirigiendo a Paddle...', 'info');
            setTimeout(() => {
                window.location.href = result.url;
            }, 1000);
        } else {
            // Fallback: si el backend devuelve créditos directamente
            showToast('✅ Créditos añadidos correctamente', 'success');
            const user = await getUserProfile();
            document.getElementById('creditsCount').textContent = user.credits;
            document.getElementById('buyCreditsModal').style.display = 'none';
            await loadStats();
        }
    } catch (error) {
        console.error('❌ Error en handlePurchase:', error);
        showToast(error.message || 'Error al procesar la compra.', 'error');
    }
}

// Función para verificar el estado del pago al volver
function checkPaymentStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const paddleStatus = urlParams.get('paddle_status');
    
    if (paymentStatus === 'success' || paddleStatus === 'completed') {
        showToast('✅ ¡Pago completado! Tus créditos han sido añadidos.', 'success');
        setTimeout(async () => {
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            await loadDashboard();
        }, 3000);
    } else if (paymentStatus === 'canceled' || paddleStatus === 'canceled') {
        showToast('❌ Pago cancelado. Puedes intentarlo nuevamente.', 'warning');
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }
}

// Actualizar créditos periódicamente (cada 30 segundos)
setInterval(async () => {
    try {
        const user = await getUserProfile();
        document.getElementById('creditsCount').textContent = user.credits;
    } catch (error) {
        // Ignorar errores en background
    }
}, 30000);