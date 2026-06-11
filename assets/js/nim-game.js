document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const nimGameBox = document.querySelector('.nim-game-box');
    const setupOverlay = document.getElementById('nim-game-over-overlay');
    const overlayTitle = document.getElementById('nim-overlay-title');
    const overlayMessage = document.getElementById('nim-overlay-message');
    const initialSetupSection = document.getElementById('nim-initial-setup');
    const initialSticksInput = document.getElementById('nim-initial-sticks-input');
    const startGameBtn = document.getElementById('nim-start-game-btn');
    const playAgainBtn = document.getElementById('nim-play-again-btn');
    const restartBtn = document.getElementById('nim-restart-btn');

    const gameArea = document.getElementById('nim-game-area');
    const sticksContainer = document.getElementById('nim-sticks-container');
    const nimMessage = document.getElementById('nim-message');
    const nimControls = document.getElementById('nim-controls');
    // --- GAME STATE ---
    let totalSticks = 0;
    let initialTotalSticks = 21; // Default starting sticks
    let isPlayerTurn = true;
    let isGameOver = false;
    const GAME_TYPE = 'nim';
    const WIN_SCORE = 100;

    async function renderSticksSequentially() {
        sticksContainer.innerHTML = ''; // Clear previous sticks

        const containerRect = sticksContainer.getBoundingClientRect();
        const stickWidth = 50; // Based on CSS
        const stickHeight = 150; // Approximate height for random positioning

        const stickElements = [];

        for (let i = 0; i < totalSticks; i++) {
            const stick = document.createElement('img');
            stick.src = 'assets/match_stick.png';
            stick.className = 'nim-stick';

            // Random positioning within the container
            const randomX = Math.random() * (containerRect.width - stickWidth);
            const randomY = Math.random() * (containerRect.height - stickHeight);
            const randomRotation = Math.random() * 360; // Random rotation

            stick.style.left = `${randomX}px`;
            stick.style.top = `${randomY}px`;
            stick.style.transform = `rotate(${randomRotation}deg)`;

            sticksContainer.appendChild(stick);
            stickElements.push(stick);
        }

        // Appear one by one
        for (const stick of stickElements) {
            await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay between each stick
            stick.classList.add('visible');
        }
    }

    function animateStickRemoval(count) {
        const sticks = Array.from(sticksContainer.querySelectorAll('.nim-stick.visible:not(.removed)'));
        for (let i = 0; i < count; i++) {
            if (sticks.length > 0) {
                const stickToRemove = sticks.pop(); // Take from the end for simplicity
                stickToRemove.classList.add('removed');
                // Remove from DOM after animation
                stickToRemove.addEventListener('transitionend', () => {
                    stickToRemove.remove();
                }, { once: true });
            }
        }
    }

    function startGame() {
        initialTotalSticks = parseInt(initialSticksInput.value, 10);
        if (isNaN(initialTotalSticks) || initialTotalSticks < 5 || initialTotalSticks > 50) {
            alert('Please enter a number of sticks between 5 and 50.');
            return;
        }

        totalSticks = initialTotalSticks;
        isPlayerTurn = true;
        isGameOver = false;

        initialSetupSection.style.display = 'none';
        restartBtn.style.display = 'block';
        nimMessage.textContent = `Your turn, ${totalSticks} match sticks left.`;
        nimMessage.style.color = '#E0E0E0';
        nimMessage.style.display = 'block';
        nimControls.style.display = 'flex';
        nimControls.querySelectorAll('button').forEach(btn => btn.disabled = false);

        renderSticksSequentially();
    }

    function playerMove(sticksToRemove) {
        if (!isPlayerTurn || isGameOver || sticksToRemove > totalSticks || sticksToRemove <= 0) return;

        animateStickRemoval(sticksToRemove);
        totalSticks -= sticksToRemove;

        if (totalSticks === 0) {
            endGame(false); // Player took the last stick, so player loses
            return;
        }

        isPlayerTurn = false;
        nimMessage.textContent = 'Bot is thinking...';
        nimControls.querySelectorAll('button').forEach(btn => btn.disabled = true);
        setTimeout(botMove, 1500);
    }

    function botMove() {
        // Winning strategy: leave a number of sticks that is 1 mod 4
        const remainder = totalSticks % 4;
        let sticksToTake = 0;

        if (remainder === 1) {
            // If bot is left with 1, 5, 9, etc., it must make a random move
            sticksToTake = Math.floor(Math.random() * 3) + 1;
        } else if (remainder === 0) { // 4, 8, 12...
            sticksToTake = 3;
        } else { // 2, 3, 6, 7...
            sticksToTake = remainder - 1;
        }

        // Ensure the bot doesn't take more sticks than available
        sticksToTake = Math.min(sticksToTake, totalSticks, 3);
        if (sticksToTake === 0) sticksToTake = 1; // Failsafe if totalSticks is 1, 2, or 3

        nimMessage.textContent = `Bot takes ${sticksToTake} stick(s).`;
        animateStickRemoval(sticksToTake);
        totalSticks -= sticksToTake;
        setTimeout(() => {
            if (totalSticks === 0) {
                endGame(true); // Bot took the last stick, so player wins
                return;
            }
            isPlayerTurn = true;
            nimMessage.textContent = `Your turn, ${totalSticks} match sticks left.`;
            nimControls.querySelectorAll('button').forEach(btn => btn.disabled = false);
        }, 800);
    }

    async function endGame(playerWon) {
        isGameOver = true;
        nimControls.style.display = 'none';
        nimMessage.style.display = 'none';
        restartBtn.style.display = 'none';

        // Show overlay after a delay
        setTimeout(() => {
            setupOverlay.style.display = 'flex';
        }, 1000);
        if (playerWon) {
            overlayTitle.textContent = 'You Win!';
            overlayMessage.textContent = 'Submitting score...';
            overlayMessage.style.color = '#4ade80';
            await submitScore(GAME_TYPE, WIN_SCORE);
        } else {
            overlayTitle.textContent = 'You Lose!';
            overlayMessage.textContent = 'You took the last stick.';
            overlayMessage.style.color = '#ff6b6b';
        }
    }

    async function submitScore(gameType, score) {
        const user = JSON.parse(localStorage.getItem('fitran_player'));
        if (!user || !user.id || !window.supabaseClient) { // Check for supabaseClient
            overlayMessage.textContent = `You win! Score of ${score} not submitted. Please log in on the games page to save your score.`;
            overlayMessage.style.color = '#ffcc00';
            return;
        }

        try {
            const { error } = await window.supabaseClient.rpc('add_score', {
                p_player_id: user.id,
                p_game_type: gameType,
                p_score_earned: score
            });

            if (error) throw error;

            overlayMessage.textContent = `You win! Score of ${score} submitted.`;
            overlayMessage.style.color = '#4ade80';
            // Optionally, refresh the leaderboard
            // if (window.fetchLeaderboard) window.fetchLeaderboard();

        } catch (error) {
            console.error('Error submitting score:', error);
            overlayMessage.textContent = 'You win! But there was an error submitting your score.';
            overlayMessage.style.color = '#ffcc00';
        }
    }

    function resetGame() {
        setupOverlay.style.display = 'none';
        initialSetupSection.style.display = 'flex';
        sticksContainer.innerHTML = '';
        nimMessage.style.display = 'none';
        nimControls.style.display = 'none';
        restartBtn.style.display = 'none';
    }

    // --- EVENT LISTENERS ---
    startGameBtn.addEventListener('click', startGame);
    playAgainBtn.addEventListener('click', resetGame);
    restartBtn.addEventListener('click', resetGame);

    nimControls.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const move = parseInt(e.target.dataset.move, 10);
            playerMove(move);
        }
    });

    // Initial state on page load
    resetGame();
});