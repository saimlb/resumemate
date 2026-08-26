let selectedFile = null;
let analysisResult = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!isAuthenticated()) {
        redirectToLogin();
        return;
    }

    try {
        const user = await getUserProfile();
        document.getElementById('userName2').textContent = user.name;
        document.getElementById('userEmail2').textContent = user.email;
        document.getElementById('creditsCount2').textContent = user.credits;
    } catch (error) {
        showToast('Error al cargar datos del usuario.', 'error');
    }

    document.getElementById('logoutBtn2').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    uploadBtn.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary)';
        uploadArea.style.background = '#f1f5f9';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--border)';
        uploadArea.style.background = 'transparent';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--border)';
        uploadArea.style.background = 'transparent';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    removeFileBtn.addEventListener('click', () => {
        selectedFile = null;
        fileInput.value = '';
        fileInfo.style.display = 'none';
        uploadArea.style.display = 'block';
        document.getElementById('resultsSection').style.display = 'none';
    });

    analyzeBtn.addEventListener('click', async () => {
        if (!selectedFile) {
            showToast('Selecciona un archivo primero.', 'error');
            return;
        }
        await analyzeFile();
    });

    downloadBtn.addEventListener('click', async () => {
        if (!analysisResult || !analysisResult.optimizedPath) {
            showToast('No hay resultados para descargar.', 'error');
            return;
        }
        
        try {
            const token = getToken();
            const response = await fetch(`${window.location.origin}${analysisResult.optimizedPath}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al descargar el archivo');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cv_optimizado_ats.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showToast('¡CV optimizado descargado!', 'success');
        } catch (error) {
            showToast('Error al descargar: ' + error.message, 'error');
        }
    });

    document.getElementById('historyLink2')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/dashboard';
    });
});

function handleFileSelect(file) {
    if (file.type !== 'application/pdf') {
        showToast('Solo se permiten archivos PDF.', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showToast('El archivo supera el límite de 5MB.', 'error');
        return;
    }

    selectedFile = file;
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = (file.size / 1024).toFixed(0) + ' KB';
    document.getElementById('fileInfo').style.display = 'flex';
    document.getElementById('uploadArea').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    showToast(`✅ Archivo seleccionado: ${file.name}`, 'success');
}

async function analyzeFile() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';

    try {
        const result = await analyzeResume(selectedFile);
        analysisResult = result;
        displayResults(result);
        const user = await getUserProfile();
        document.getElementById('creditsCount2').textContent = user.credits;
        showToast(`✅ Análisis completado! Puntuación: ${result.score}/100`, 'success');
    } catch (error) {
        showToast('Error al analizar el CV: ' + error.message, 'error');
        if (error.message.includes('créditos')) {
            showToast('⚠️ Créditos insuficientes. Por favor, compra más créditos.', 'warning');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
        }
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

function displayResults(result) {
    const section = document.getElementById('resultsSection');
    section.style.display = 'block';

    const scoreEl = document.getElementById('scoreValue');
    scoreEl.textContent = result.score;
    
    if (result.score >= 80) {
        scoreEl.style.color = '#22c55e';
    } else if (result.score >= 60) {
        scoreEl.style.color = '#f59e0b';
    } else {
        scoreEl.style.color = '#ef4444';
    }

    const issuesList = document.getElementById('issuesList');
    if (result.issues && result.issues.length > 0) {
        issuesList.innerHTML = result.issues.map(issue => `<li>${issue}</li>`).join('');
    } else {
        issuesList.innerHTML = '<li style="border-left-color: #22c55e; background: #f0fdf4;">✅ ¡No se detectaron problemas importantes!</li>';
    }

    const suggestionsList = document.getElementById('suggestionsList');
    if (result.suggestions && result.suggestions.length > 0) {
        suggestionsList.innerHTML = result.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('');
    } else {
        suggestionsList.innerHTML = '<li style="border-left-color: #22c55e; background: #f0fdf4;">✅ ¡Tu CV ya está muy optimizado!</li>';
    }

    const detailsContainer = document.getElementById('detailsContainer');
    if (result.details) {
        const details = result.details;
        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">';
        
        html += `<div style="background: white; padding: 12px; border-radius: 8px;">
            <strong>Palabras totales</strong><br>
            <span style="font-size: 1.2rem;">${details.wordCount || 0}</span>
        </div>`;
        
        html += `<div style="background: white; padding: 12px; border-radius: 8px;">
            <strong>Hard Skills detectadas</strong><br>
            <span style="font-size: 1.2rem;">${details.hardSkills ? details.hardSkills.length : 0}</span>
        </div>`;
        
        html += `<div style="background: white; padding: 12px; border-radius: 8px;">
            <strong>Soft Skills detectadas</strong><br>
            <span style="font-size: 1.2rem;">${details.softSkills ? details.softSkills.length : 0}</span>
        </div>`;
        
        html += `<div style="background: white; padding: 12px; border-radius: 8px;">
            <strong>Sección Experiencia</strong><br>
            <span style="font-size: 1.2rem;">${details.sections && details.sections.experience ? '✅' : '❌'}</span>
        </div>`;
        
        html += `</div>`;
        
        if (details.hardSkills && details.hardSkills.length > 0) {
            html += `<div style="margin-top: 12px; background: white; padding: 12px; border-radius: 8px;">
                <strong>Hard Skills encontradas:</strong><br>
                <span style="font-size: 0.9rem; color: var(--text-light);">${details.hardSkills.slice(0, 10).join(', ')}${details.hardSkills.length > 10 ? '...' : ''}</span>
            </div>`;
        }
        
        detailsContainer.innerHTML = html;
    }
}