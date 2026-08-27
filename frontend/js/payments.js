// Configuración de Paddle
const PADDLE_CLIENT_TOKEN = window.PADDLE_CLIENT_TOKEN || '';

// Función para comprar créditos con Paddle
async function purchaseCreditsWithPaddle(plan) {
    try {
        showToast('🔄 Procesando pago...', 'info');
        
        // Obtener la URL de checkout del backend
        const response = await apiCall('/payments/create-checkout', {
            method: 'POST',
            body: JSON.stringify({ plan })
        });
        
        if (response.url) {
            // Redirigir al checkout de Paddle
            window.location.href = response.url;
        } else {
            throw new Error('No se pudo crear la sesión de pago');
        }
    } catch (error) {
        console.error('Error al procesar pago:', error);
        showToast('Error al procesar el pago: ' + error.message, 'error');
    }
}

// Función para verificar el estado del pago al volver
function checkPaymentStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
        showToast('✅ ¡Pago completado! Tus créditos han sido añadidos.', 'success');
        // Recargar los créditos en el dashboard
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 3000);
    } else if (paymentStatus === 'canceled') {
        showToast('❌ Pago cancelado. Puedes intentarlo nuevamente.', 'warning');
    }
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    checkPaymentStatus();
});