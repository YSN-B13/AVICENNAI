document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    const queryInput = document.getElementById('query');
    const searchBtn = document.getElementById('search-btn');
    const loadingOverlay = document.getElementById('loading-overlay');

    window.sendQuery = async function() {
        const query = queryInput.value.trim();
        if (!query) return;

        // Show loading state
        loadingOverlay.style.display = 'flex';
        loadingOverlay.style.opacity = '0';
        loadingOverlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => loadingOverlay.style.opacity = '1', 10);

        try {
            const response = await fetch('/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            if (response.ok) {
                // Success - reload page to show results
                window.location.reload();
            } else {
                console.error('Query failed');
                loadingOverlay.style.opacity = '0';
                setTimeout(() => loadingOverlay.style.display = 'none', 300);
                alert('Une erreur est survenue lors de la communication avec l\'agent.');
            }
        } catch (error) {
            console.error('Error:', error);
            loadingOverlay.style.display = 'none';
            alert('Erreur de connexion au serveur.');
        }
    };

    if (searchBtn) {
        searchBtn.addEventListener('click', sendQuery);
    }

    if (queryInput) {
        queryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendQuery();
        });
    }

    // Animate progress bars on load
    setTimeout(() => {
        document.querySelectorAll('.prob-bar-fill').forEach(bar => {
            const width = bar.getAttribute('data-width');
            bar.style.width = width + '%';
        });
    }, 100);

    // Theme toggle logic (sync with local storage)
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.classList.contains('dark');
            if (isDark) {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
                localStorage.setItem('theme', 'light');
            } else {
                document.documentElement.classList.remove('light');
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            }
            updateIcons();
        });
    }

    function updateIcons() {
        if (window.lucide) {
            window.lucide.createIcons();
        }
        const isDark = document.documentElement.classList.contains('dark');
        const sunIcon = document.querySelector('.sun-icon');
        const moonIcon = document.querySelector('.moon-icon');
        
        if (isDark) {
            sunIcon?.classList.add('hidden');
            moonIcon?.classList.remove('hidden');
        } else {
            sunIcon?.classList.remove('hidden');
            moonIcon?.classList.add('hidden');
        }
    }

    // Initial icon state
    updateIcons();
});
