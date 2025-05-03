document.addEventListener('DOMContentLoaded', () => {
    const apiEndpointInput = document.getElementById('apiEndpoint');
    const logDirectoryInput = document.getElementById('logDirectory');
    const selectDirectoryBtn = document.getElementById('selectDirectoryBtn');
    const pingIntervalInput = document.getElementById('pingInterval');
    const maxLogFilesInput = document.getElementById('maxLogFiles');
    const saveBtn = document.getElementById('saveBtn');
    const backBtn = document.getElementById('backBtn');
    const statusDiv = document.getElementById('status');

    // Carrega as configurações atuais
    window.electronAPI.getConfig().then(config => {
        apiEndpointInput.value = config.apiEndpoint;
        logDirectoryInput.value = config.logDirectory;
        pingIntervalInput.value = config.defaultPingInterval;
        maxLogFilesInput.value = config.maxLogFiles;
    });

    selectDirectoryBtn.addEventListener('click', async () => {
        const selectedPath = await window.electronAPI.selectDirectory();
        if (selectedPath) {
            logDirectoryInput.value = selectedPath;
        }
    });

    saveBtn.addEventListener('click', async () => {
        const newConfig = {
            apiEndpoint: apiEndpointInput.value.trim(),
            logDirectory: logDirectoryInput.value.trim(),
            defaultPingInterval: parseInt(pingIntervalInput.value),
            maxLogFiles: parseInt(maxLogFilesInput.value)
        };

        try {
            await window.electronAPI.saveConfig(newConfig);
            showStatus('Configurações salvas com sucesso!', 'success');
        } catch (error) {
            showStatus('Erro ao salvar configurações: ' + error.message, 'error');
        }
    });

    backBtn.addEventListener('click', () => {
        window.electronAPI.navigateToMain();
    });

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
}); 