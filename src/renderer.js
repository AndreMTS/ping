document.addEventListener('DOMContentLoaded', () => {
    const targetInput = document.getElementById('target');
    const companyInput = document.getElementById('company');
    const durationInput = document.getElementById('duration');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const exportBtn = document.getElementById('exportBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const statusDiv = document.getElementById('status');
    const minPingSpan = document.getElementById('minPing');
    const maxPingSpan = document.getElementById('maxPing');
    const avgPingSpan = document.getElementById('avgPing');
    const successRateSpan = document.getElementById('successRate');

    let isRunning = false;

    startBtn.addEventListener('click', async () => {
        const target = targetInput.value.trim();
        const company = companyInput.value.trim();
        const duration = durationInput.value ? parseFloat(durationInput.value) : null;

        if (!target || !company) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const result = await window.electronAPI.startPing({ target, company, duration });
            if (result.status === 'started') {
                isRunning = true;
                updateUI();
                statusDiv.textContent = 'Status: Running';
                statusDiv.className = 'status running';
            }
        } catch (error) {
            alert('Failed to start ping test: ' + error.message);
        }
    });

    stopBtn.addEventListener('click', async () => {
        try {
            const result = await window.electronAPI.stopPing();
            if (result.status === 'stopped') {
                isRunning = false;
                updateUI();
                statusDiv.textContent = 'Status: Stopped';
                statusDiv.className = 'status stopped';
                updateMetrics(result.metrics);
            }
        } catch (error) {
            alert('Failed to stop ping test: ' + error.message);
        }
    });

    exportBtn.addEventListener('click', async () => {
        try {
            const result = await window.electronAPI.exportResults();
            if (result.status === 'exported') {
                alert(`Results exported to: ${result.path}`);
            } else {
                alert('No results to export');
            }
        } catch (error) {
            alert('Failed to export results: ' + error.message);
        }
    });

    settingsBtn.addEventListener('click', () => {
        window.electronAPI.navigateToSettings();
    });

    function updateUI() {
        startBtn.disabled = isRunning;
        stopBtn.disabled = !isRunning;
        exportBtn.disabled = !isRunning;
        targetInput.disabled = isRunning;
        companyInput.disabled = isRunning;
        durationInput.disabled = isRunning;
    }

    function updateMetrics(metrics) {
        if (!metrics) return;
        
        minPingSpan.textContent = metrics.min.toFixed(2);
        maxPingSpan.textContent = metrics.max.toFixed(2);
        avgPingSpan.textContent = metrics.avg.toFixed(2);
        successRateSpan.textContent = metrics.successRate.toFixed(2);
    }

    // Listen for ping updates
    window.electronAPI.onPingUpdate((data) => {
        updateMetrics(data.metrics);
    });
}); 