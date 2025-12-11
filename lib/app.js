var app = angular.module("downloadHubApp", ["ngRoute"]);

app.config(function($routeProvider) {
    $routeProvider
        .when("/home", {
            templateUrl: "page/home.html",
            controller: "HomeCtrl"
        })
       .when("/game/:appId", {
    templateUrl: "page/game.html",
     controller: "DownloadCtrl"
})

        .otherwise({
            redirectTo: "/home"
        });
});


//*----------------------------------- contents -----------------------------*//



app.run(function($rootScope) {
    $rootScope.$on('$viewContentLoaded', function() {
        initDeathZoneApp(); // now appsGrid exists
    });
});


function initDeathZoneApp() {
    const loadingSkeleton = document.getElementById('loadingSkeleton');
    const appContainer = document.getElementById('app');
    const appsGrid = document.getElementById('appsGrid');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    const sortSelect = document.getElementById('sortSelect');
    const tagFilters = document.querySelectorAll('.tag-filter');
    const resetFiltersBtn = document.getElementById('resetFilters');
    const loadMoreBtn = document.getElementById('loadMore');
    const adminToggleBtn = document.getElementById('adminToggle');
    const adminPanel = document.getElementById('adminPanel');
    const closeAdminBtn = document.getElementById('closeAdmin');
    const adminOverlay = document.getElementById('adminOverlay');
    const adminTabs = document.querySelectorAll('.admin-tab');
    const addModForm = document.getElementById('addModForm');
    const resetFormBtn = document.getElementById('resetForm');
    const detailModal = document.getElementById('detailModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const closeModalBtn = document.getElementById('closeModal');
    const totalVisitsElement = document.getElementById('totalVisits');
    const adminTotalVisitsElement = document.getElementById('adminTotalVisits');
    const totalModsCountElement = document.getElementById('totalModsCount');
    const totalDownloadsElement = document.getElementById('totalDownloads');
    const topModsList = document.getElementById('topModsList');
    const recentModsList = document.getElementById('recentModsList');
    const resultsCountElement = document.getElementById('resultsCount');
    const emptyState = document.getElementById('emptyState');
    const resultsInfo = document.getElementById('resultsInfo');

    let appsData = [];
    let filteredApps = [];
    let displayedApps = [];
    let currentPage = 1;
    const appsPerPage = 8;
    let currentFilterTag = 'all';
    let currentSearchQuery = '';
    let currentSort = 'newest';
    let visitCounts = {};
    let downloadCounts = {};
    initApp();

    function initApp() {
        loadAppsData();
        
        loadAnalyticsData();
        
        setupEventListeners();
        

        setTimeout(() => {
            loadingSkeleton.style.display = 'none';
            appContainer.style.opacity = '1';
        }, 800);
    }

async function loadAppsData() {
    try {
        const response = await fetch("assets/apks.json");
        if (!response.ok) throw new Error('Failed to load apks.json');

        const defaultApps = await response.json();
        const adminMods = JSON.parse(localStorage.getItem('deathzone_admin_mods')) || [];
        appsData = [...defaultApps, ...adminMods];

        appsData.forEach(app => {
            if (!visitCounts[app.id]) visitCounts[app.id] = app.visits || 0;
            if (!downloadCounts[app.id]) downloadCounts[app.id] = app.downloads || 0;
        });

        saveAnalyticsData();
        filterAndDisplayApps();
        updateAnalyticsDisplays();
    } catch (err) {
        document.getElementById('appRoot').innerHTML = '<p class="error">Failed to load apps data.</p>';
    }
}




    function loadAnalyticsData() {
        const savedVisitCounts = localStorage.getItem('deathzone_visit_counts');
        const savedDownloadCounts = localStorage.getItem('deathzone_download_counts');
        
        if (savedVisitCounts) {
            visitCounts = JSON.parse(savedVisitCounts);
        }
        
        if (savedDownloadCounts) {
            downloadCounts = JSON.parse(savedDownloadCounts);
        }
    }

    function saveAnalyticsData() {
        localStorage.setItem('deathzone_visit_counts', JSON.stringify(visitCounts));
        localStorage.setItem('deathzone_download_counts', JSON.stringify(downloadCounts));
    }


    function setupEventListeners() {
        searchInput.addEventListener('input', handleSearch);
        clearSearchBtn.addEventListener('click', clearSearch);
        sortSelect.addEventListener('change', handleSortChange);
        
        tagFilters.forEach(filter => {
            filter.addEventListener('click', handleTagFilter);
        });
        resetFiltersBtn.addEventListener('click', resetFilters);
        loadMoreBtn.addEventListener('click', loadMoreApps);
        adminToggleBtn.addEventListener('click', openAdminPanel);
        closeAdminBtn.addEventListener('click', closeAdminPanel);
        adminOverlay.addEventListener('click', closeAdminPanel);
        adminTabs.forEach(tab => {
            tab.addEventListener('click', handleAdminTabClick);
        });
        
        addModForm.addEventListener('submit', handleAddModForm);
        resetFormBtn.addEventListener('click', resetAddModForm);
        modalOverlay.addEventListener('click', closeDetailModal);
        closeModalBtn.addEventListener('click', closeDetailModal);
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }

    function handleSearch() {
        currentSearchQuery = searchInput.value.trim().toLowerCase();
        currentPage = 1;
        filterAndDisplayApps();
        clearSearchBtn.style.display = currentSearchQuery ? 'block' : 'none';
    }

    function clearSearch() {
        searchInput.value = '';
        currentSearchQuery = '';
        currentPage = 1;
        filterAndDisplayApps();
        clearSearchBtn.style.display = 'none';
    }

    function handleSortChange() {
        currentSort = sortSelect.value;
        currentPage = 1;
        filterAndDisplayApps();
    }

    function handleTagFilter(e) {
        const tag = e.target.dataset.tag;
        
        tagFilters.forEach(filter => {
            filter.classList.remove('active');
        });
        e.target.classList.add('active');
        
        currentFilterTag = tag;
        currentPage = 1;
        filterAndDisplayApps();
    }

    function resetFilters() {
        searchInput.value = '';
        currentSearchQuery = '';
    
        sortSelect.value = 'newest';
        currentSort = 'newest';
    
        tagFilters.forEach(filter => {
            filter.classList.remove('active');
            if (filter.dataset.tag === 'all') {
                filter.classList.add('active');
            }
        });
        currentFilterTag = 'all';
        
        currentPage = 1;
        
        filterAndDisplayApps();
        clearSearchBtn.style.display = 'none';
    }

    function filterAndDisplayApps() {
        filteredApps = appsData.filter(app => {
            const matchesSearch = currentSearchQuery === '' || 
                app.name.toLowerCase().includes(currentSearchQuery) ||
                app.tagline.toLowerCase().includes(currentSearchQuery) ||
                app.tags.some(tag => tag.toLowerCase().includes(currentSearchQuery));
            const matchesTag = currentFilterTag === 'all' || 
                app.tags.includes(currentFilterTag);
            
            return matchesSearch && matchesTag;
        });
        
        sortApps(filteredApps);

        updateResultsCount();
        
        displayedApps = [];
        
        appsGrid.innerHTML = '';
        
        loadMoreApps();
        
        if (filteredApps.length === 0) {
            emptyState.style.display = 'block';
            loadMoreBtn.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            loadMoreBtn.style.display = 'block';
        }
    }

    function sortApps(apps) {
        switch(currentSort) {
            case 'newest':
                apps.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
                break;
            case 'popular':
                apps.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
                break;
            case 'visits':
                apps.sort((a, b) => (visitCounts[b.id] || 0) - (visitCounts[a.id] || 0));
                break;
            case 'size':
                apps.sort((a, b) => a.size - b.size);
                break;
        }
    }

    function loadMoreApps() {
        const startIndex = (currentPage - 1) * appsPerPage;
        const endIndex = startIndex + appsPerPage;
        const appsToDisplay = filteredApps.slice(startIndex, endIndex);
        displayedApps = [...displayedApps, ...appsToDisplay];
        
        renderApps(appsToDisplay);

        currentPage++;

        if (endIndex >= filteredApps.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }
    }

    function renderApps(apps) {
        apps.forEach(app => {
            const appCard = createAppCard(app);
            appsGrid.appendChild(appCard);
        });
    }


function createAppCard(app) {
    const card = document.createElement('div');
    card.className = 'app-card';
    card.setAttribute('data-id', app.id);
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View details for ${app.name}`);

    const tagsHtml = app.tags.map(tag => 
        `<span class="card-tag">${tag}</span>`
    ).join('');

    const visitCount = visitCounts[app.id] || app.visits || 0;

    card.innerHTML = `
        <div class="card-header">
            <img src="${app.imageUrl}" alt="${app.name}" class="card-image" loading="lazy">
            <div class="card-badge">
                <i class="fas fa-download"></i>
                <span>${formatNumber(app.downloads || 0)}</span>
            </div>
        </div>
        <div class="card-body">
            <h3 class="card-title">${app.name}</h3>
            <p class="card-tagline">${app.tagline}</p>
            <div class="card-meta">
                <div class="meta-item">
                    <span class="meta-label">Version</span>
                    <span class="meta-value">${app.version}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Size</span>
                    <span class="meta-value">${app.size} MB</span>
                </div>
            </div>
            <div class="card-tags">
                ${tagsHtml}
            </div>
            <div class="card-footer">
                <div class="card-visits">
                    <i class="fas fa-eye"></i>
                    <span>${formatNumber(visitCount)} views</span>
                </div>
                <button class="view-btn" data-id="${app.id}" aria-label="View ${app.name} details">
                    View Details
                </button>
            </div>
        </div>
    `;

    const viewBtn = card.querySelector('.view-btn');
    viewBtn.addEventListener('click', () => {
        window.location.href = `#!/game/${app.id}`;
    });

    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            window.location.href = `#!/game/${app.id}`;
        }
    });

    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-10px)';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
    });

    return card;
}







    /************************************************** */

   





    function closeDetailModal() {
        detailModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    function openAdminPanel() {
        adminPanel.style.display = 'block';
        document.body.style.overflow = 'hidden';
        updateAdminAnalytics();
    }

    function closeAdminPanel() {
        adminPanel.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    function handleAdminTabClick(e) {
        const tabId = e.target.dataset.tab;
        adminTabs.forEach(tab => {
            tab.classList.remove('active');
        });
        e.target.classList.add('active');

        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabId}Tab`).classList.add('active');
    }

    function handleAddModForm(e) {
        e.preventDefault();
        const modName = document.getElementById('modName').value;
        const modVersion = document.getElementById('modVersion').value;
        const modSize = parseInt(document.getElementById('modSize').value);
        const modDownloadUrl = document.getElementById('modDownloadUrl').value;
        const modImageUrl = document.getElementById('modImageUrl').value;
        const modTagline = document.getElementById('modTagline').value;
        const modDescription = document.getElementById('modDescription').value;
        const modFeatures = document.getElementById('modFeatures').value.split(',').map(f => f.trim());
        const modTags = document.getElementById('modTags').value.split(',').map(t => t.trim());
        const modReleaseNotes = document.getElementById('modReleaseNotes').value;
        const modScreenshots = document.getElementById('modScreenshots').value.split(',').map(s => s.trim()).filter(s => s);
        const modJson = document.getElementById('modJson').value;
        const modId = 'apk-' + Date.now();
        const newMod = {
            id: modId,
            name: modName,
            tagline: modTagline,
            version: modVersion,
            size: modSize,
            downloads: 0,
            visits: 0,
            tags: modTags,
            features: modFeatures,
            description: modDescription,
            releaseNotes: modReleaseNotes || `Initial release of ${modName} v${modVersion}`,
            imageUrl: modImageUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
            screenshots: modScreenshots.length > 0 ? modScreenshots : [
                'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
            ],
            downloadUrl: modDownloadUrl,
            addedDate: new Date().toISOString().split('T')[0]
        };
        if (modJson) {
            try {
                const metadata = JSON.parse(modJson);
                newMod.metadata = metadata;
            } catch (e) {
                console.error('Invalid JSON metadata:', e);
            }
        }

        appsData.unshift(newMod);
        
        visitCounts[modId] = 0;
        downloadCounts[modId] = 0;
        saveAnalyticsData();
        
        const adminMods = JSON.parse(localStorage.getItem('deathzone_admin_mods')) || [];
        adminMods.unshift(newMod);
        localStorage.setItem('deathzone_admin_mods', JSON.stringify(adminMods));

        const formFeedback = document.getElementById('formFeedback');
        formFeedback.textContent = `"${modName}" has been added successfully!`;
        formFeedback.className = 'form-feedback success';
        

        resetAddModForm();
        
        updateAnalyticsDisplays();
        
        updateAdminAnalytics();
        
        currentPage = 1;
        filterAndDisplayApps();
        

        setTimeout(() => {
            formFeedback.style.display = 'none';
        }, 3000);
    }

    function resetAddModForm() {
        addModForm.reset();
        const formFeedback = document.getElementById('formFeedback');
        formFeedback.textContent = '';
        formFeedback.className = 'form-feedback';
        formFeedback.style.display = 'none';
    }

    function updateResultsCount() {
        resultsCountElement.textContent = filteredApps.length;
        
        if (filteredApps.length === 0) {
            resultsInfo.style.opacity = '0.5';
        } else {
            resultsInfo.style.opacity = '1';
        }
    }

    function updateTotalVisits() {
        const totalVisits = Object.values(visitCounts).reduce((sum, count) => sum + count, 0);
        totalVisitsElement.textContent = formatNumber(totalVisits);
    }

    function updateAnalyticsDisplays() {
        updateTotalVisits();
        updateAdminAnalytics();
    }

    function updateAdminAnalytics() {
        totalModsCountElement.textContent = appsData.length;
        const totalVisits = Object.values(visitCounts).reduce((sum, count) => sum + count, 0);
        adminTotalVisitsElement.textContent = formatNumber(totalVisits);
        const totalDownloads = Object.values(downloadCounts).reduce((sum, count) => sum + count, 0);
        totalDownloadsElement.textContent = formatNumber(totalDownloads);
        

        updateTopModsList();
        updateRecentModsList();
    }

    function updateTopModsList() {
        const topMods = [...appsData]
            .sort((a, b) => (visitCounts[b.id] || 0) - (visitCounts[a.id] || 0))
            .slice(0, 3);
        
        const topModsHtml = topMods.map((mod, index) => `
            <div class="top-mod-item">
                <div class="mod-rank">#${index + 1}</div>
                <div class="mod-info">
                    <h5>${mod.name}</h5>
                    <div class="mod-stats">
                        <span><i class="fas fa-eye"></i> ${formatNumber(visitCounts[mod.id] || 0)}</span>
                        <span><i class="fas fa-download"></i> ${formatNumber(downloadCounts[mod.id] || 0)}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        topModsList.innerHTML = topModsHtml;
    }

    function updateRecentModsList() {
        const recentMods = [...appsData]
            .sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate))
            .slice(0, 3);
        

        const recentModsHtml = recentMods.map(mod => `
            <div class="recent-mod-item">
                <div class="mod-info">
                    <h5>${mod.name}</h5>
                    <div class="mod-stats">
                        <span>v${mod.version}</span>
                        <span>${mod.size} MB</span>
                        <span>${formatDate(mod.addedDate)}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        recentModsList.innerHTML = recentModsHtml;
    }

    function handleKeyboardShortcuts(e) {
        if (e.key === 'Escape') {
            if (detailModal.style.display === 'block') {
                closeDetailModal();
            }
            if (adminPanel.style.display === 'block') {
                closeAdminPanel();
            }
        }
        
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            e.preventDefault();
            openAdminPanel();
        }
    }

    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    updateTotalVisits();
}



document.addEventListener('click', function(e) {
    const downloadBtn = e.target.closest('#animatedDownloadBtn');
    if (downloadBtn) {
        e.preventDefault();
        handleDownload({ currentTarget: downloadBtn });
    }

    const shareBtn = e.target.closest('.share-btn');
    if (shareBtn) {
        e.preventDefault();
        handleShare({ currentTarget: shareBtn });
    }
});








app.controller("HomeCtrl", function($scope, $location, $http) {
    $scope.apps = [];
    $http.get("assets/apks.json").then(function(res) {
        $scope.apps = res.data;
    });

    $scope.goToDownload = function(appId) {
        $location.path("/game/" + appId);
    };
});




var visitCounts = JSON.parse(localStorage.getItem("visitCounts") || "{}");
var downloadCounts = JSON.parse(localStorage.getItem("downloadCounts") || "{}");

function saveAnalyticsData() {
    localStorage.setItem("visitCounts", JSON.stringify(visitCounts));
    localStorage.setItem("downloadCounts", JSON.stringify(downloadCounts));
}

function formatNumber(n) {
    return n >= 1000 ? (n / 1000).toFixed(1) + "K" : n;
}
var detailModal = null;

function initModal() {
    detailModal = document.getElementById("detailModal");
}







app.controller("DownloadCtrl", function ($scope, $routeParams, $timeout, $http) {
    $scope.app = null;

    $http.get("assets/apks.json").then(function (res) {
        const appsData = res.data;
        const appId = $routeParams.appId;
        $scope.app = appsData.find(a => a.id === appId);

        if (!$scope.app) return alert("App not found!");

        $timeout(function () {
            initModal();
            openDetailModal($scope.app.id, appsData);
        }, 100);
    }, function (err) {
        console.error("Failed to load apps JSON", err);
    });
});

function openDetailModal(appId, appsData) {
    const app = appsData.find(a => a.id === appId);
    if (!app) return alert("App not found!");
    visitCounts[appId] = (visitCounts[appId] || 0) + 1;
    saveAnalyticsData();
    const cardSpan = document.querySelector(`.app-card[data-id="${appId}"] .card-visits span`);
    if (cardSpan) cardSpan.textContent = formatNumber(visitCounts[appId]) + " views";

    if (!detailModal) return console.error("detailModal not ready");
    const modalBody = detailModal.querySelector(".modal-body");
    if (!modalBody) return console.error("modal-body not found");

    const featuresHtml = app.features.map(f => `
        <div class="modal-feature">
            <i class="fas fa-check-circle feature-icon"></i>
            <span>${f}</span>
        </div>
    `).join("");

    const screenshotsHtml = app.screenshots.map((s, i) => `
        <img src="${s}" alt="${app.name} screenshot ${i+1}" class="screenshot" loading="lazy">
    `).join("");

    const totalDownloads = (downloadCounts[appId] || 0) + (app.downloads || 0);

    modalBody.innerHTML = `
        <img src="${app.imageUrl}" alt="${app.name}" class="modal-cover">
        <div class="modal-header">
            <div class="modal-title-section">
                <h2>${app.name}</h2>
                <div class="modal-badges">
                    <div class="modal-badge highlight"><i class="fas fa-star"></i> <span>Authorized Build</span></div>
                    <div class="modal-badge"><i class="fas fa-code-branch"></i> <span>v${app.version}</span></div>
                    <div class="modal-badge"><i class="fas fa-weight-hanging"></i> <span>${app.size} MB</span></div>
                </div>
            </div>
        </div>
        <div class="modal-description"><p>${app.description}</p></div>
        <h3 class="modal-section-title"><i class="fas fa-cogs"></i> Mod Features</h3>
        <div class="modal-features">${featuresHtml}</div>
        <h3 class="modal-section-title"><i class="fas fa-clipboard-list"></i> Release Notes</h3>
        <div class="modal-release-notes">
            <h4>Version ${app.version}</h4>
            <p style="white-space: pre-line;">${app.releaseNotes}</p>
        </div>
        <h3 class="modal-section-title"><i class="fas fa-images"></i> Screenshots</h3>
        <div class="screenshots-carousel">
            <div class="screenshots-container">${screenshotsHtml}</div>
        </div>
        <div class="modal-download-section">
            <div class="download-header">
                <div class="download-count"><i class="fas fa-download"></i> <span>${formatNumber(totalDownloads)} downloads</span></div>
                <div class="download-count"><i class="fas fa-eye"></i> <span>${formatNumber(visitCounts[appId])} views</span></div>
            </div>
            <button class="download-btn" id="downloadBtn" data-id="${appId}" data-url="${app.downloadUrl}">
                <div class="download-progress"></div>
                <span class="download-text"><i class="fas fa-download"></i> Download Authorized Build</span>
            </button>
            <p class="download-note"><i class="fas fa-info-circle"></i> Provided by developer / open-source. File will download directly.</p>
            <div class="download-share">
                <button class="share-btn"><i class="fab fa-twitter"></i></button>
                <button class="share-btn"><i class="fab fa-facebook-f"></i></button>
                <button class="share-btn"><i class="fas fa-link"></i></button>
            </div>
        </div>
    `;

    detailModal.style.display = "block";
    document.body.style.overflow = "hidden";

    const btn = document.getElementById("downloadBtn");
    if (btn) {
        btn.onclick = null;
        btn.addEventListener("click", handleDownload);
    }

    modalBody.querySelectorAll(".share-btn").forEach(b => {
        b.onclick = null;
        b.addEventListener("click", handleShare);
    });

    detailModal.onclick = function (e) {
        if (e.target === detailModal) closeDetailModal();
    };
}


function handleDownload(e) {
    const btn = e.currentTarget;
    const url = btn.dataset.url;
    const appId = btn.dataset.id;

    btn.disabled = true;
    const bar = btn.querySelector(".download-progress");
    let w = 0;

    const int = setInterval(() => {
        w += Math.random() * 25;
        if (w >= 100) {
            clearInterval(int);
            w = 100;
            downloadCounts[appId] = (downloadCounts[appId] || 0) + 1;
            saveAnalyticsData();
            const a = document.createElement("a");
            a.href = url;
            a.download = "";
            document.body.appendChild(a);
            a.click();
            a.remove();

            // Toast
            const toast = document.createElement("div");
            toast.innerHTML = `<div style="position:fixed;bottom:20px;right:20px;background:#00f3ff;color:#000;padding:14px 28px;border-radius:50px;font-weight:bold;z-index:10000;animation:slideIn 0.4s;">
                Preparing authorized build...
            </div>`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);

            // Success text
            setTimeout(() => {
                btn.querySelector(".download-text").innerHTML = "Download Complete!";
                setTimeout(() => {
                    btn.disabled = false;
                    bar.style.width = "0%";
                    btn.querySelector(".download-text").innerHTML = "Download Authorized Build";
                }, 2000);
            }, 600);
        }
        bar.style.width = w + "%";
    }, 100);
}


function handleShare(e) {
    const btn = e.currentTarget;
    btn.style.background = "rgba(0,243,255,0.3)";
    setTimeout(() => btn.style.background = "", 300);

    if (btn.querySelector("i").classList.contains("fa-link")) {
        navigator.clipboard.writeText(location.href).then(() => {
            const orig = btn.innerHTML;
            btn.innerHTML = "";
            setTimeout(() => btn.innerHTML = orig, 2000);
        });
    }
}


function closeDetailModal() {
    if (detailModal) {
        detailModal.style.display = "none";
        document.body.style.overflow = "auto";
    }
}

//*----------------------------------- contents -----------------------------*//

app.controller("MainController", function($scope) {
    console.log("AngularJS SPA Running...");
});




