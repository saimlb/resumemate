// Configuración de la API
const API_CONFIG = {
  // Detectar automáticamente si estamos en desarrollo o producción
  getApiUrl: function() {
    // Si estamos en localhost, usar localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000/api';
    }
    // Si estamos en Render, usar la URL de Render
    return 'https://resumemate-xrhk.onrender.com/api';
  }
};

// Exportar para usar en otros archivos
const API_URL = API_CONFIG.getApiUrl();