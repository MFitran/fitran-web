/**
 * updates-sidebar.js — Shared navigation sidebar for updates.html
 * Adapts the style and toggle structure of sidebar.js for in-page updates navigation.
 */
(function () {
    const SECTIONS = [
        {
            num: '01',
            title: 'Profile Summary',
            subtitle: 'Headline & Location',
            target: '#profile-header',
            tag: 'Profile'
        },
        {
            num: '02',
            title: 'About Me',
            subtitle: 'Personal Background',
            target: '#profile-about',
            tag: 'Bio'
        },
        {
            num: '03',
            title: 'Work Experience',
            subtitle: 'Employment History',
            target: '#profile-experience',
            tag: 'Work'
        },
        {
            num: '04',
            title: 'Projects & Work',
            subtitle: 'Key Highlights',
            target: '#profile-projects',
            tag: 'Work'
        },
        {
            num: '05',
            title: 'Certifications',
            subtitle: 'Credentials & Licences',
            target: '#profile-certifications',
            tag: 'Docs'
        },
        {
            num: '06',
            title: 'Skills & Tech',
            subtitle: 'Core Competencies',
            target: '#profile-skills',
            tag: 'Tech'
        },
        {
            num: '07',
            title: 'Languages',
            subtitle: 'Communication Skills',
            target: '#profile-languages',
            tag: 'Info'
        },
        {
            num: '08',
            title: 'All Updates',
            subtitle: 'LinkedIn Feed',
            target: '#all-updates',
            tag: 'Feed'
        }
    ];

    // ── CSS (Mirrors sidebar.js styles exactly) ──────────────────────────────────
    const css = `
        :root {
            --sidebar-w: 240px;
            --sidebar-rail: 0px;
            --sidebar-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .proj-sidebar {
            position: fixed;
            top: 70px;
            left: 0;
            bottom: 0;
            width: var(--sidebar-w);
            background: rgba(8, 8, 8, 0.97);
            border-right: 1px solid #181818;
            display: flex;
            flex-direction: column;
            z-index: 900;
            transition: width var(--sidebar-transition);
            overflow: hidden;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        .proj-sidebar:not(.proj-sidebar--open) {
            width: var(--sidebar-rail);
        }
        #page-wrap {
            transition: margin-left var(--sidebar-transition);
            margin-left: var(--sidebar-w);
            overflow-x: hidden;
        }
        body.sidebar-closed #page-wrap {
            margin-left: var(--sidebar-rail);
        }
        .sidebar-toggle {
            position: fixed;
            top: calc(70px + 18px);
            left: calc(var(--sidebar-w) - 16px);
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(
                to top,
                rgb(255, 0, 0), 
                rgb(0, 0, 255), 
                rgb(0, 255, 0), 
                rgb(255, 0, 0)
            );
            background-size: auto 200%;
            border: 1px solid #121212;
            color: #fff;
            font-size: 18px;
            line-height: 1;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 920;
            transition: transform 0.2s, left var(--sidebar-transition);
            animation: rgb-gradient-animation 8s linear infinite;
            will-change: background-position;
        }
        body.sidebar-closed .sidebar-toggle {
            left: 4px;
        }
        .sidebar-toggle:hover {
            transform: scale(1.15);
        }
        .sidebar-toggle__arrow {
            display: inline-block;
            transition: transform var(--sidebar-transition);
            transform: rotate(0deg);
        }
        body.sidebar-closed .sidebar-toggle__arrow {
            transform: rotate(180deg);
        }
        .sidebar-inner {
            padding: 18px 0 20px 0;
            display: flex;
            flex-direction: column;
            gap: 4px;
            overflow-y: auto;
            overflow-x: hidden;
            flex: 1;
        }
        .sidebar-inner::-webkit-scrollbar {
            width: 4px;
        }
        .sidebar-inner::-webkit-scrollbar-track {
            background: transparent;
        }
        .sidebar-inner::-webkit-scrollbar-thumb {
            background: #222;
            border-radius: 2px;
        }
        .sidebar-inner::-webkit-scrollbar-thumb:hover {
            background: #444;
        }
        .sidebar-label {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.12em;
            color: #444;
            text-transform: uppercase;
            padding: 0 20px 10px 20px;
            white-space: nowrap;
        }
        .sidebar-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 6px 16px;
            text-decoration: none;
            color: #666;
            cursor: pointer;
            transition: background 0.18s, color 0.18s;
            border-left: 3px solid transparent;
        }
        .sidebar-item:hover:not(.sidebar-item--soon) {
            background: rgba(255,255,255,0.04);
            color: #ccc;
        }
        .sidebar-item--active {
            color: #fff;
            border-left-color: #3366cc;
            background: rgba(51, 102, 204, 0.08);
        }
        .sidebar-item--active .sidebar-item__icon { color: #3366cc; }
        .sidebar-item__icon {
            font-size: 8px;
            margin-top: 5px;
            flex-shrink: 0;
            color: #444;
        }
        .sidebar-item__text {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
        }
        .sidebar-item__num {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.08em;
            color: #444;
        }
        .sidebar-item--active .sidebar-item__num { color: #3366cc; }
        .sidebar-item__name {
            font-size: 12px;
            font-weight: 500;
            line-height: 1.35;
            white-space: normal;
            word-break: break-word;
        }
        .sidebar-item__sub {
            font-size: 10px;
            color: #555;
            white-space: nowrap;
        }
        .sidebar-back {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 0 32px 12px 16px;
            padding: 0 16px;
            height: 36px;
            box-sizing: border-box;
            border-radius: 8px;
            border: 1px solid #ffffff;
            background: #E0E0E0;
            color: #000000;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-decoration: none;
            cursor: pointer;
            transition: background 0.18s, color 0.18s, border-color 0.18s, transform 0.1s ease;
            white-space: nowrap;
            flex-shrink: 0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        .sidebar-back:hover {
            background: #ffffff;
            color: #000000;
            border-color: #ffffff;
            transform: translateY(-1px);
        }
        .sidebar-back:active {
            transform: translateY(0);
        }
        .sidebar-back__arrow {
            font-size: 14px;
            line-height: 1;
        }
        @media (orientation: portrait) {
            /* Sidebar becomes a full-height overlay, hidden off-screen by default */
            .proj-sidebar {
                transform: translateX(-100%);
                width: var(--sidebar-w) !important;
                transition: transform var(--sidebar-transition);
                top: 0;
                z-index: 1100;
            }
            .proj-sidebar.proj-sidebar--open {
                transform: translateX(0);
            }
            /* No left margin push on mobile — sidebar overlays content */
            #page-wrap { margin-left: 0 !important; }
            /* Desktop toggle button hidden on mobile */
            .sidebar-toggle { display: none !important; }
            .sidebar-back { margin: 0 16px 12px 16px; }
            /* Dim overlay behind sidebar on mobile */
            .sidebar-overlay {
                display: block;
            }
            .sidebar-overlay.visible {
                opacity: 1;
                pointer-events: all;
            }
        }

        /* Dim backdrop */
        .sidebar-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.6);
            z-index: 1050;
            opacity: 0;
            pointer-events: none;
            transition: opacity var(--sidebar-transition);
        }
    `;

    // ── Inject CSS ────────────────────────────────────────────────────────────
    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    // ── Build sidebar HTML ────────────────────────────────────────────────────
    const items = SECTIONS.map(s => {
        const icon     = '&#9675;';
        const cls      = 'sidebar-item';

        return `
            <a href="${s.target}" data-target="${s.target.replace('#', '')}" class="${cls}">
                <span class="sidebar-item__icon">${icon}</span>
                <span class="sidebar-item__text">
                    <span class="sidebar-item__num">${s.num}</span>
                    <span class="sidebar-item__name">${s.title}</span>
                    <span class="sidebar-item__sub">${s.subtitle}</span>
                </span>
            </a>`;
    }).join('');

    const sidebarHTML = `
    <aside id="proj-sidebar" class="proj-sidebar proj-sidebar--open">
        <div class="sidebar-inner">
            <a href="index.html" class="sidebar-back">
                <span class="sidebar-back__arrow">&#8592;</span>
                Home
            </a>
            <div style="border-top: 1px solid #181818; margin: 0 0 12px 0;"></div>
            <p class="sidebar-label">On This Page</p>
            ${items}
        </div>
    </aside>
    <!-- Desktop toggle button -->
    <button id="sidebar-toggle" class="sidebar-toggle" aria-label="Toggle project panel">
        <span class="sidebar-toggle__arrow">&#8249;</span>
    </button>
    <!-- Mobile dim backdrop -->
    <div id="sidebar-overlay" class="sidebar-overlay"></div>`;

    // ── Helper math positions ──────────────────────────────────────────────────
    function getAbsoluteTop(el) {
        let top = 0;
        while (el) {
            top += el.offsetTop;
            el = el.offsetParent;
        }
        return top;
    }

    function updateActiveSidebarItem() {
        const scrollPos = window.scrollY + 150; // offset header and padding
        const sections = [
            { id: 'profile-header', el: document.getElementById('linkedin-profile-section') },
            { id: 'profile-about', el: document.getElementById('profile-about') },
            { id: 'profile-experience', el: document.getElementById('profile-experience') },
            { id: 'profile-projects', el: document.getElementById('profile-projects') },
            { id: 'profile-certifications', el: document.getElementById('profile-certifications') },
            { id: 'profile-skills', el: document.getElementById('profile-skills') },
            { id: 'profile-languages', el: document.getElementById('profile-languages') },
            { id: 'all-updates', el: document.getElementById('all-updates') }
        ].filter(item => item.el);

        let activeId = null;
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const top = getAbsoluteTop(section.el);
            if (scrollPos >= top) {
                activeId = section.id;
            }
        }

        if (activeId) {
            const sidebarItems = document.querySelectorAll('.proj-sidebar .sidebar-item');
            sidebarItems.forEach(item => {
                const target = item.getAttribute('data-target');
                const iconEl = item.querySelector('.sidebar-item__icon');
                if (target === activeId) {
                    item.classList.add('sidebar-item--active');
                    if (iconEl) iconEl.innerHTML = '&#9679;'; // filled circle
                } else {
                    item.classList.remove('sidebar-item--active');
                    if (iconEl) iconEl.innerHTML = '&#9675;'; // empty circle
                }
            });
        }
    }

    // ── Inject HTML & Event Bindings ──────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        const pageWrap = document.getElementById('page-wrap');
        if (pageWrap) {
            pageWrap.insertAdjacentHTML('beforebegin', sidebarHTML);
        } else {
            document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
        }

        const sidebar    = document.getElementById('proj-sidebar');
        const toggleBtn  = document.getElementById('sidebar-toggle');
        const overlay    = document.getElementById('sidebar-overlay');

        const hotkeys = document.querySelector('.hotkeys-placeholder');
        const hamburger = document.createElement('div');
        hamburger.id = 'sidebar-hamburger';
        hamburger.className = 'sidebar-hamburger hotkey-circle';
        hamburger.setAttribute('aria-label', 'Open navigation panel');
        hamburger.innerHTML = '<img src="assets/menu_icon.png" alt="Menu" style="width: 14px; height: 14px;">';
        if (hotkeys) hotkeys.appendChild(hamburger);

        const isMobile = () => window.matchMedia('(orientation: portrait)').matches;

        // ── Desktop: collapse / expand with localStorage ──────────────────────
        function applyDesktopState(closed) {
            if (closed) {
                sidebar.classList.remove('proj-sidebar--open');
                document.body.classList.add('sidebar-closed');
            } else {
                sidebar.classList.add('proj-sidebar--open');
                document.body.classList.remove('sidebar-closed');
            }
        }

        if (!isMobile()) {
            applyDesktopState(localStorage.getItem('sidebarClosed') === '1');
        } else {
            // On mobile, start open so the user knows it exists, then collapse after 2 seconds
            sidebar.classList.add('proj-sidebar--open');
            overlay.classList.add('visible');
            document.body.classList.add('sidebar-mobile-open');
            setTimeout(() => {
                sidebar.classList.remove('proj-sidebar--open');
                overlay.classList.remove('visible');
                document.body.classList.remove('sidebar-mobile-open');
                document.body.style.overflow = '';
            }, 2000);
        }

        toggleBtn.addEventListener('click', function () {
            const nowClosed = sidebar.classList.contains('proj-sidebar--open');
            applyDesktopState(nowClosed);
            localStorage.setItem('sidebarClosed', nowClosed ? '1' : '0');
        });

        // ── Mobile: overlay open / close ──────────────────────────────────────
        function openMobileSidebar() {
            sidebar.classList.add('proj-sidebar--open');
            overlay.classList.add('visible');
            document.body.classList.add('sidebar-mobile-open');
            document.body.style.overflow = 'hidden'; // prevent body scroll behind overlay
        }

        function closeMobileSidebar() {
            sidebar.classList.remove('proj-sidebar--open');
            overlay.classList.remove('visible');
            document.body.classList.remove('sidebar-mobile-open');
            document.body.style.overflow = '';
        }

        hamburger.addEventListener('click', function () {
            if (sidebar.classList.contains('proj-sidebar--open')) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        });

        // Tap backdrop to close
        overlay.addEventListener('click', closeMobileSidebar);

        // Close sidebar when clicking anywhere outside of it
        document.addEventListener('click', function (event) {
            if (overlay && overlay.classList.contains('visible')) {
                if (!sidebar.contains(event.target) && !hamburger.contains(event.target)) {
                    closeMobileSidebar();
                }
            }
        });

        // Re-evaluate on resize (e.g. rotation)
        window.addEventListener('resize', function () {
            if (!isMobile()) {
                // Restore desktop state
                overlay.classList.remove('visible');
                document.body.classList.remove('sidebar-mobile-open');
                document.body.style.overflow = '';
                applyDesktopState(localStorage.getItem('sidebarClosed') === '1');
            } else {
                // On mobile, ensure no left margin
                sidebar.classList.remove('proj-sidebar--open');
                document.body.classList.remove('sidebar-closed');
            }
        });

        // ── Smooth scrolling for items ───────────────────────────────────────
        document.querySelectorAll('.proj-sidebar .sidebar-item').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetSelector = this.getAttribute('href');
                const actualTarget = targetSelector === '#profile-header' ? '#linkedin-profile-section' : targetSelector;
                const targetEl = document.querySelector(actualTarget);

                if (targetEl) {
                    const targetTop = getAbsoluteTop(targetEl) - 95; // Subtract header height
                    window.scrollTo({
                        top: targetTop,
                        behavior: 'smooth'
                    });

                    // If mobile drawer is open, close it
                    if (isMobile()) {
                        closeMobileSidebar();
                    }
                }
            });
        });

        // ── Scrollspy initialization ─────────────────────────────────────────
        window.addEventListener('scroll', updateActiveSidebarItem);
        window.initUpdatesSidebarScrollspy = function () {
            updateActiveSidebarItem();
        };
    });
})();
