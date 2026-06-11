// --- SUPABASE CONFIGURATION ---
// Supabase credentials are now loaded from config.js

// Initialize Supabase Client
window.supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);

// --- LEADERBOARD STATE ---
let currentPage = 0;
const ITEMS_PER_PAGE = 5;
let currentSearch = '';
let currentGameFilter = 'all';

// --- DOM ELEMENTS ---
const leaderboardList = document.getElementById('leaderboard-list');
const searchInput = document.getElementById('leaderboard-search-input');
const gameFilter = document.getElementById('leaderboard-game-filter');
const gameTitle = document.getElementById('leaderboard-game-title');
const prevBtn = document.getElementById('leaderboard-prev-btn');
const nextBtn = document.getElementById('leaderboard-next-btn');

// --- FETCH DATA ---
async function fetchLeaderboard() {
    // Show loading state
    leaderboardList.innerHTML = '<li><span class="lb-name" style="color: #666;">Loading...</span></li>';

    try {
        let query = window.supabaseClient
            .from('leaderboard') // TODO: Make sure your table is named 'leaderboard'
            .select('*', { count: 'exact' });
        
        // Filter by game if not 'all'
        if (currentGameFilter !== 'all') {
            query = query.eq('game_name', currentGameFilter);
        }

        // Search by player name
        if (currentSearch) {
            query = query.ilike('player_name', `%${currentSearch}%`);
        }

        // Pagination & Ordering (highest score first)
        const from = currentPage * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        query = query.order('score', { ascending: false })
                     .range(from, to);

        const { data, error, count } = await query;

        if (error) {
            throw error;
        }

        renderLeaderboard(data);
        updatePaginationButtons(count);

    } catch (error) {
        console.error('Error fetching leaderboard:', error.message);
        leaderboardList.innerHTML = `<li><span class="lb-name" style="color: #ff6b6b;">Error loading data.</span></li>`;
    }
}

// --- RENDER DATA ---
function renderLeaderboard(data) {
    leaderboardList.innerHTML = ''; // Clear current list

    if (!data || data.length === 0) {
        leaderboardList.innerHTML = '<li><span class="lb-name" style="color: #666;">No players found.</span></li>';
        return;
    }

    data.forEach((entry, index) => {
        const li = document.createElement('li');
        
        const rank = currentPage * ITEMS_PER_PAGE + index + 1;
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'lb-name';
        nameSpan.textContent = `${rank}. ${entry.player_name}`;

        const scoreSpan = document.createElement('span');
        scoreSpan.className = 'lb-score';
        scoreSpan.textContent = `${entry.score.toLocaleString()} pts`;

        li.appendChild(nameSpan);
        li.appendChild(scoreSpan);
        
        leaderboardList.appendChild(li);
    });
}

// --- PAGINATION & EVENT HANDLERS ---
function updatePaginationButtons(totalCount) {
    prevBtn.disabled = currentPage === 0;
    
    // Disable next button if we've reached the end
    const hasMore = (currentPage + 1) * ITEMS_PER_PAGE < totalCount;
    nextBtn.disabled = !hasMore;
}

prevBtn.addEventListener('click', () => {
    if (currentPage > 0) {
        currentPage--;
        fetchLeaderboard();
    }
});

nextBtn.addEventListener('click', () => {
    currentPage++;
    fetchLeaderboard();
});

searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    currentPage = 0; // Reset to first page on search
    fetchLeaderboard();
});

gameFilter.addEventListener('change', (e) => {
    currentGameFilter = e.target.value;
    gameTitle.textContent = e.target.options[e.target.selectedIndex].text + ' Scores';
    currentPage = 0; // Reset to first page on filter
    fetchLeaderboard();
});

// --- INITIAL LOAD ---
document.addEventListener('DOMContentLoaded', () => {
    // Check if the keys are placeholders
    if (typeof SUPABASE_CONFIG === 'undefined' || !SUPABASE_CONFIG.URL) {
        leaderboardList.innerHTML = '<li><span class="lb-name" style="color: #ffcc00; font-size: 14px;">Supabase not configured. Check config.js</span></li>';
        return;
    }
    
    fetchLeaderboard();
});
