(function () {
    document.addEventListener('DOMContentLoaded', function () {
        const sidebar = document.getElementById('dashboard-sidebar');
        if (!sidebar) return;

        // 1. Inject Desktop Toggle Button
        const toggleBtnHTML = `
        <button id="dashboard-sidebar-toggle" class="dashboard-sidebar-toggle" aria-label="Toggle navigation panel">
            <span class="dashboard-sidebar-toggle__arrow">&#8249;</span>
        </button>`;
        sidebar.insertAdjacentHTML('afterend', toggleBtnHTML);

        // 2. Inject Mobile Overlay backdrop
        const overlayHTML = `<div id="dashboard-sidebar-overlay" class="dashboard-sidebar-overlay"></div>`;
        document.body.insertAdjacentHTML('beforeend', overlayHTML);

        // 3. Inject Hamburger button into .hotkeys-placeholder
        const hotkeys = document.querySelector('.hotkeys-placeholder');
        const hamburger = document.createElement('div');
        hamburger.id = 'dashboard-sidebar-hamburger';
        hamburger.className = 'sidebar-hamburger hotkey-circle';
        hamburger.setAttribute('aria-label', 'Open navigation panel');
        hamburger.innerHTML = '<img src="assets/menu_icon.png" alt="Menu" style="width: 14px; height: 14px;">';
        if (hotkeys) {
            hotkeys.appendChild(hamburger);
        }

        const toggleBtn = document.getElementById('dashboard-sidebar-toggle');
        const overlay = document.getElementById('dashboard-sidebar-overlay');

        const isMobile = () => window.matchMedia('(orientation: portrait)').matches;

        // --- Desktop: collapse / expand with localStorage ---
        function applyDesktopState(closed) {
            if (closed) {
                sidebar.classList.remove('dashboard-sidebar--open');
                document.body.classList.add('dashboard-sidebar-closed');
            } else {
                sidebar.classList.add('dashboard-sidebar--open');
                document.body.classList.remove('dashboard-sidebar-closed');
            }
        }

        if (!isMobile()) {
            applyDesktopState(localStorage.getItem('gamesSidebarClosed') === '1');
        } else {
            // On mobile, start open so the user knows it exists, then collapse after 2 seconds
            sidebar.classList.add('dashboard-sidebar--open');
            overlay.classList.add('visible');
            setTimeout(() => {
                sidebar.classList.remove('dashboard-sidebar--open');
                overlay.classList.remove('visible');
                document.body.style.overflow = '';
            }, 2000);
        }

        toggleBtn.addEventListener('click', function () {
            const nowClosed = !document.body.classList.contains('dashboard-sidebar-closed');
            applyDesktopState(nowClosed);
            localStorage.setItem('gamesSidebarClosed', nowClosed ? '1' : '0');
        });

        // --- Mobile: overlay open / close ---
        function openMobileSidebar() {
            sidebar.classList.add('dashboard-sidebar--open');
            overlay.classList.add('visible');
            document.body.style.overflow = 'hidden';
        }

        function closeMobileSidebar() {
            sidebar.classList.remove('dashboard-sidebar--open');
            overlay.classList.remove('visible');
            document.body.style.overflow = '';
        }

        hamburger.addEventListener('click', function (e) {
            e.stopPropagation();
            if (sidebar.classList.contains('dashboard-sidebar--open')) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        });

        overlay.addEventListener('click', closeMobileSidebar);

        // Close when clicking anywhere outside
        document.addEventListener('click', function (event) {
            if (overlay && overlay.classList.contains('visible')) {
                if (!sidebar.contains(event.target) && !hamburger.contains(event.target)) {
                    closeMobileSidebar();
                }
            }
        });

        // Handle Resize
        window.addEventListener('resize', function () {
            if (!isMobile()) {
                overlay.classList.remove('visible');
                document.body.style.overflow = '';
                applyDesktopState(localStorage.getItem('gamesSidebarClosed') === '1');
            } else {
                sidebar.classList.remove('dashboard-sidebar--open');
                document.body.classList.remove('dashboard-sidebar-closed');
            }
        });
    });
})();
