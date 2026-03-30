const API_URL = '/api';

// Check API health on load
window.addEventListener('DOMContentLoaded', async () => {
    const statusEl = document.getElementById('apiStatus');
    try {
        const res = await fetch(`${API_URL}/health`);
        if (res.ok) {
            statusEl.textContent = 'Online';
            statusEl.className = 'status-dot online';
        } else {
            throw new Error('API unreachable');
        }
    } catch (err) {
        statusEl.textContent = 'Offline';
        statusEl.className = 'status-dot offline';
        console.error('Health check failed:', err);
    }
});

async function shortenUrl() {
    const input = document.getElementById('urlInput').value.trim();
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');
    const shortLink = document.getElementById('shortUrlLink');
    const btn = document.getElementById('shortenBtn');

    // Reset UI
    resultDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');

    if (!input) {
        showError('Please enter a URL');
        return;
    }

    try {
        btn.textContent = 'Shortening...';
        btn.disabled = true;

        const res = await fetch(`${API_URL}/shorten`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: input })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.detail || 'Failed to shorten URL');

        // Display result
        const fullUrl = window.location.origin + data.short_url;
        shortLink.href = fullUrl;
        shortLink.textContent = fullUrl;
        
        // Setup direct redirect listener since Nginx might not rewrite properly yet
        shortLink.onclick = async (e) => {
            e.preventDefault();
            const fetchRes = await fetch(`${API_URL}${data.short_url.replace('/r/', '/r/')}`);
            const fetchData = await fetchRes.json();
            if (fetchData.url) window.location.href = fetchData.url;
        };

        resultDiv.classList.remove('hidden');
        document.getElementById('urlInput').value = '';

    } catch (err) {
        showError(err.message);
    } finally {
        btn.textContent = 'Shorten';
        btn.disabled = false;
    }
}

function showError(msg) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = msg;
    errorDiv.classList.remove('hidden');
}

function copyToClipboard() {
    const link = document.getElementById('shortUrlLink').textContent;
    navigator.clipboard.writeText(link)
        .then(() => alert('Copied to clipboard!'))
        .catch(err => console.error('Failed to copy', err));
}

// Allow Enter key to trigger shorten
document.getElementById('urlInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') shortenUrl();
});
