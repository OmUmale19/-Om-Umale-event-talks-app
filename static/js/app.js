document.addEventListener('DOMContentLoaded', () => {
    // State management
    let state = {
        allItems: [],
        filteredItems: [],
        currentCategory: 'all',
        searchQuery: '',
        activeTweetItem: null,
        theme: localStorage.getItem('bq_theme') || 'dark'
    };

    // DOM Elements
    const elements = {
        themeToggleBtn: document.getElementById('themeToggleBtn'),
        refreshBtn: document.getElementById('refreshBtn'),
        refreshSpinner: document.getElementById('refreshSpinner'),
        refreshBtnText: document.getElementById('refreshBtnText'),
        lastUpdatedText: document.getElementById('lastUpdatedText'),
        
        statTotal: document.getElementById('statTotal'),
        statFeatures: document.getElementById('statFeatures'),
        statChanged: document.getElementById('statChanged'),
        statDeprecated: document.getElementById('statDeprecated'),
        
        searchInput: document.getElementById('searchInput'),
        clearSearchBtn: document.getElementById('clearSearchBtn'),
        filterPills: document.getElementById('filterPills'),
        
        notesContainer: document.getElementById('notesContainer'),
        loadingSkeleton: document.getElementById('loadingSkeleton'),
        emptyState: document.getElementById('emptyState'),
        emptyStateMsg: document.getElementById('emptyStateMsg'),
        
        // Tweet Modal
        tweetModal: document.getElementById('tweetModal'),
        modalTitle: document.getElementById('modalTitle'),
        tweetTextArea: document.getElementById('tweetTextArea'),
        charCount: document.getElementById('charCount'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        cancelTweetBtn: document.getElementById('cancelTweetBtn'),
        postTweetBtn: document.getElementById('postTweetBtn'),
        addHashtagsBtn: document.getElementById('addHashtagsBtn'),
        addLinkBtn: document.getElementById('addLinkBtn'),
        shortenBtn: document.getElementById('shortenBtn'),
        
        // Toast
        toast: document.getElementById('toast'),
        toastMsg: document.getElementById('toastMsg')
    };

    // Initialize Theme
    function initTheme() {
        document.documentElement.setAttribute('data-theme', state.theme);
        updateThemeIcon();
    }

    function toggleTheme() {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('bq_theme', state.theme);
        document.documentElement.setAttribute('data-theme', state.theme);
        updateThemeIcon();
    }

    function updateThemeIcon() {
        const icon = elements.themeToggleBtn.querySelector('i');
        if (state.theme === 'dark') {
            icon.className = 'fa-solid fa-sun';
        } else {
            icon.className = 'fa-solid fa-moon';
        }
    }

    // Fetch Release Notes API
    async function fetchReleaseNotes(forceRefresh = false) {
        setLoadingState(true);

        try {
            const url = `/api/release-notes${forceRefresh ? '?force_refresh=true' : ''}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            const resData = await response.json();
            
            if (resData.status === 'success') {
                state.allItems = resData.data.all_items || [];
                elements.lastUpdatedText.textContent = `Updated: ${resData.fetched_at}`;
                updateStats();
                applyFilters();
                
                if (forceRefresh) {
                    showToast('Feed refreshed successfully!');
                }
            } else {
                throw new Error(resData.message || 'Failed to fetch release notes');
            }

        } catch (error) {
            console.error('Error fetching release notes:', error);
            showErrorState(error.message);
        } finally {
            setLoadingState(false);
        }
    }

    function setLoadingState(isLoading) {
        if (isLoading) {
            elements.refreshSpinner.classList.add('spinning');
            elements.refreshBtn.disabled = true;
            elements.refreshBtnText.textContent = 'Fetching...';
            elements.loadingSkeleton.classList.remove('hidden');
            elements.notesContainer.classList.add('hidden');
            elements.emptyState.classList.add('hidden');
        } else {
            elements.refreshSpinner.classList.remove('spinning');
            elements.refreshBtn.disabled = false;
            elements.refreshBtnText.textContent = 'Refresh Details';
            elements.loadingSkeleton.classList.add('hidden');
            elements.notesContainer.classList.remove('hidden');
        }
    }

    // Update Statistics Bar
    function updateStats() {
        const total = state.allItems.length;
        const features = state.allItems.filter(i => matchCategory(i.category, 'Feature')).length;
        const changed = state.allItems.filter(i => matchCategory(i.category, 'Changed')).length;
        const deprecated = state.allItems.filter(i => matchCategory(i.category, 'Deprecated')).length;

        animateCounter(elements.statTotal, total);
        animateCounter(elements.statFeatures, features);
        animateCounter(elements.statChanged, changed);
        animateCounter(elements.statDeprecated, deprecated);
    }

    function animateCounter(elem, target) {
        elem.textContent = target;
    }

    function matchCategory(cat, target) {
        if (!cat) return false;
        return cat.toLowerCase().includes(target.toLowerCase());
    }

    // Apply Filter & Search
    function applyFilters() {
        let items = [...state.allItems];

        // Filter by category
        if (state.currentCategory !== 'all') {
            items = items.filter(item => matchCategory(item.category, state.currentCategory));
        }

        // Filter by search query
        if (state.searchQuery.trim() !== '') {
            const query = state.searchQuery.toLowerCase();
            items = items.filter(item => 
                (item.title && item.title.toLowerCase().includes(query)) ||
                (item.summary && item.summary.toLowerCase().includes(query)) ||
                (item.date && item.date.toLowerCase().includes(query)) ||
                (item.category && item.category.toLowerCase().includes(query))
            );
        }

        state.filteredItems = items;
        renderNotesContainer();
    }

    // Render Cards
    function renderNotesContainer() {
        elements.notesContainer.innerHTML = '';

        if (state.filteredItems.length === 0) {
            elements.emptyState.classList.remove('hidden');
            elements.emptyStateMsg.textContent = state.searchQuery 
                ? `No release notes match "${state.searchQuery}"`
                : 'No release notes available for this category.';
            return;
        }

        elements.emptyState.classList.add('hidden');

        state.filteredItems.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'note-card';
            card.setAttribute('data-id', item.id);

            const catClass = getCategoryClass(item.category);

            card.innerHTML = `
                <div class="note-header">
                    <div class="note-badge-group">
                        <span class="badge ${catClass}">${item.category || 'General'}</span>
                        <span class="note-date"><i class="fa-regular fa-calendar-days"></i> ${item.date || ''}</span>
                    </div>
                </div>

                <h3 class="note-title">${escapeHtml(item.title)}</h3>

                <div class="note-body">
                    ${item.html ? item.html : `<p>${escapeHtml(item.summary)}</p>`}
                </div>

                <div class="note-actions">
                    <div class="action-btn-group">
                        <button class="btn-tweet-sm tweet-btn" data-index="${index}">
                            <i class="fa-brands fa-x-twitter"></i> Tweet Update
                        </button>
                        <button class="btn-ghost-sm copy-btn" data-index="${index}">
                            <i class="fa-regular fa-copy"></i> Copy
                        </button>
                    </div>
                    <a href="${item.link}" target="_blank" rel="noopener" class="btn-ghost-sm">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i> Docs
                    </a>
                </div>
            `;

            elements.notesContainer.appendChild(card);
        });

        // Attach event listeners to card buttons
        document.querySelectorAll('.tweet-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-index'));
                openTweetModal(state.filteredItems[idx]);
            });
        });

        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-index'));
                copyNoteSummary(state.filteredItems[idx]);
            });
        });
    }

    function getCategoryClass(cat) {
        if (!cat) return 'category-feature';
        const lower = cat.toLowerCase();
        if (lower.includes('feature')) return 'category-feature';
        if (lower.includes('changed') || lower.includes('change')) return 'category-changed';
        if (lower.includes('deprecated') || lower.includes('removal')) return 'category-deprecated';
        if (lower.includes('issue') || lower.includes('fix')) return 'category-issue';
        return 'category-feature';
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;');
    }

    // Tweet Modal Logic
    function openTweetModal(item) {
        state.activeTweetItem = item;
        
        let draftText = `🚀 BigQuery Update (${item.date || 'Latest'}):\n`;
        draftText += `[${item.category}] ${item.summary}\n\n`;
        draftText += `#BigQuery #GoogleCloud #DataEngineering\n`;
        draftText += `${item.link}`;

        // Truncate to 280 if necessary
        if (draftText.length > 280) {
            const allowedSummaryLen = 280 - (draftText.length - item.summary.length) - 5;
            const shortSummary = item.summary.substring(0, Math.max(20, allowedSummaryLen)) + '...';
            draftText = `🚀 BigQuery (${item.date}):\n[${item.category}] ${shortSummary}\n\n#BigQuery #GoogleCloud\n${item.link}`;
        }

        elements.tweetTextArea.value = draftText;
        updateCharCount();
        elements.tweetModal.classList.remove('hidden');
        elements.tweetTextArea.focus();
    }

    function closeTweetModal() {
        elements.tweetModal.classList.add('hidden');
        state.activeTweetItem = null;
    }

    function updateCharCount() {
        const len = elements.tweetTextArea.value.length;
        elements.charCount.textContent = `${len} / 280`;
        
        if (len > 280) {
            elements.charCount.style.color = '#ef4444';
            elements.postTweetBtn.disabled = true;
        } else {
            elements.charCount.style.color = 'var(--text-muted)';
            elements.postTweetBtn.disabled = false;
        }
    }

    function handlePostTweet() {
        const text = elements.tweetTextArea.value.trim();
        if (!text) return;

        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(tweetUrl, '_blank', 'width=600,height=400,resizable=yes');
        closeTweetModal();
        showToast('Opened Twitter / X Intent window!');
    }

    // Preset helper buttons inside modal
    elements.addHashtagsBtn.addEventListener('click', () => {
        if (!elements.tweetTextArea.value.includes('#BigQuery')) {
            elements.tweetTextArea.value += ' #BigQuery #GoogleCloud';
            updateCharCount();
        }
    });

    elements.addLinkBtn.addEventListener('click', () => {
        if (state.activeTweetItem && !elements.tweetTextArea.value.includes(state.activeTweetItem.link)) {
            elements.tweetTextArea.value += ` ${state.activeTweetItem.link}`;
            updateCharCount();
        }
    });

    elements.shortenBtn.addEventListener('click', () => {
        if (state.activeTweetItem) {
            const item = state.activeTweetItem;
            elements.tweetTextArea.value = `⚡ BigQuery Update: ${item.category} - ${item.title.substring(0, 80)}...\n\n#BigQuery ${item.link}`;
            updateCharCount();
        }
    });

    // Copy to Clipboard
    function copyNoteSummary(item) {
        const text = `${item.category} (${item.date}): ${item.summary}\nRead more: ${item.link}`;
        navigator.clipboard.writeText(text).then(() => {
            showToast('Summary copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy text:', err);
        });
    }

    // Toast Notification
    function showToast(message) {
        elements.toastMsg.textContent = message;
        elements.toast.classList.remove('hidden');
        setTimeout(() => {
            elements.toast.classList.add('hidden');
        }, 3000);
    }

    function showErrorState(msg) {
        elements.notesContainer.classList.add('hidden');
        elements.emptyState.classList.remove('hidden');
        elements.emptyStateMsg.textContent = `Error: ${msg}. Click Refresh Details to retry.`;
    }

    // Event Listeners
    elements.themeToggleBtn.addEventListener('click', toggleTheme);
    elements.refreshBtn.addEventListener('click', () => fetchReleaseNotes(true));
    
    // Search listeners
    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        if (state.searchQuery) {
            elements.clearSearchBtn.classList.remove('hidden');
        } else {
            elements.clearSearchBtn.classList.add('hidden');
        }
        applyFilters();
    });

    elements.clearSearchBtn.addEventListener('click', () => {
        elements.searchInput.value = '';
        state.searchQuery = '';
        elements.clearSearchBtn.classList.add('hidden');
        applyFilters();
    });

    // Filter pills
    elements.filterPills.addEventListener('click', (e) => {
        if (e.target.classList.contains('pill')) {
            document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
            e.target.classList.add('active');
            state.currentCategory = e.target.getAttribute('data-category');
            applyFilters();
        }
    });

    // Stat card clicks filter shortcut
    document.querySelectorAll('.stat-card').forEach(card => {
        card.addEventListener('click', () => {
            const cat = card.getAttribute('data-filter');
            const targetPill = document.querySelector(`.pill[data-category="${cat}"]`) || document.querySelector('.pill[data-category="all"]');
            if (targetPill) targetPill.click();
        });
    });

    // Modal listeners
    elements.closeModalBtn.addEventListener('click', closeTweetModal);
    elements.cancelTweetBtn.addEventListener('click', closeTweetModal);
    elements.postTweetBtn.addEventListener('click', handlePostTweet);
    elements.tweetTextArea.addEventListener('input', updateCharCount);

    elements.tweetModal.addEventListener('click', (e) => {
        if (e.target === elements.tweetModal) {
            closeTweetModal();
        }
    });

    // Initialize App
    initTheme();
    fetchReleaseNotes(false);
});
