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
    const nimActionBar = document.getElementById('nim-action-bar');
    // --- AUDIO ---
    const pickSound = new Audio('assets/match_stick_pick.MP3');
    const winSound = new Audio('assets/win.MP3');
    const loseSound = new Audio('assets/lose.MP3');
    const startGameSound = new Audio('assets/start_game.MP3');
    // --- GAME STATE ---
    let totalSticks = 0;
    let initialTotalSticks = 21; // Default starting sticks
    let isPlayerTurn = true;
    let playerStartedGame = true; // To track who started for record-keeping
    let isGameOver = false;
    let gameRecord = [];
    const GAME_TYPE = 'nim';
    const WIN_SCORE = 100;

    function renderSticksSequentially() {
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
            stick.classList.add('visible');
        }
    }

    async function animateStickRemoval(count) {
        const sticks = Array.from(sticksContainer.querySelectorAll('.nim-stick.visible:not(.removed)'));
        for (let i = 0; i < count; i++) {
            if (sticks.length > 0) {
                const stickToRemove = sticks.pop(); // Take from the end for simplicity

                if (pickSound) {
                    pickSound.currentTime = 0;
                    pickSound.play().catch(e => console.error("Audio play failed:", e));
                }

                stickToRemove.classList.add('removed');
                // Remove from DOM after animation
                stickToRemove.addEventListener('transitionend', () => {
                    stickToRemove.remove();
                }, { once: true });

                await new Promise(resolve => setTimeout(resolve, 150)); // Halved the delay for a faster feel
            }
        }
    }

    function startGame() {
        if (startGameSound) {
            startGameSound.play().catch(e => console.error("Audio play failed:", e));
        }

        initialTotalSticks = parseInt(initialSticksInput.value, 10);
        if (isNaN(initialTotalSticks) || initialTotalSticks < 21 || initialTotalSticks > 50) {
            alert('Please enter a number of sticks between 21 and 50.');
            return;
        }

        totalSticks = initialTotalSticks;
        isPlayerTurn = true; // Player always starts
        playerStartedGame = true;
        isGameOver = false;
        gameRecord = [`${initialTotalSticks}`];

        initialSetupSection.style.display = 'none';
        nimActionBar.style.display = 'flex';
        nimMessage.style.display = 'block';

        renderSticksSequentially();

        nimMessage.textContent = 'Your turn.';
        nimControls.querySelectorAll('button').forEach(btn => btn.disabled = false);
    }

    async function playerMove(sticksToRemove) {
        if (!isPlayerTurn || isGameOver || sticksToRemove > totalSticks || sticksToRemove <= 0) return;

        isPlayerTurn = false;
        nimControls.querySelectorAll('button').forEach(btn => btn.disabled = true);

        gameRecord.push(sticksToRemove);
        await animateStickRemoval(sticksToRemove);
        totalSticks -= sticksToRemove;

        if (totalSticks === 0) {
            endGame(false); // Player took the last stick, so player loses
            return;
        }

        nimMessage.textContent = 'Bot is thinking...';
        setTimeout(botMove, 800); // Faster bot thinking
    }

    async function botMove() {
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

        gameRecord.push(sticksToTake);
        nimMessage.textContent = `Bot takes ${sticksToTake} stick(s).`;
        await animateStickRemoval(sticksToTake);
        totalSticks -= sticksToTake;
        setTimeout(() => {
            if (totalSticks === 0) {
                endGame(true); // Bot took the last stick, so player wins
                return;
            }
            isPlayerTurn = true;
            nimMessage.textContent = `Your turn.`;
            nimControls.querySelectorAll('button').forEach(btn => btn.disabled = false);
        }, 400); // Faster turn transition
    }

    function formatGameRecord(recordArray) {
        if (!recordArray || recordArray.length < 1) return '';
        const initialSticks = recordArray[0];
        const moves = recordArray.slice(1);
        let formattedString = `${initialSticks}`;
        let turnCounter = 1;
        
        // The player always starts, so moves are in pairs of (player, bot).
        // This format numbers each turn pair. e.g., "21 1. 3 1 2. 2 2"
        for (let i = 0; i < moves.length; i += 2) {
            const playerMove = moves[i];
            const botMove = moves[i + 1] !== undefined ? ` ${moves[i + 1]}` : '';
            formattedString += ` ${turnCounter}. ${playerMove}${botMove}`;
            turnCounter++;
        }
        
        return formattedString;
    }

    async function saveMatchRecord(score) {
        const user = JSON.parse(localStorage.getItem('fitran_player'));
        if (!window.supabaseClient) {
            console.log('Supabase client not available. Match record not saved.');
            return;
        }

        const recordString = formatGameRecord(gameRecord);
        const matchData = {
            player_id: (user && user.id) ? user.id : null,
            game_type: GAME_TYPE,
            record: { moves: recordString },
            score_earned: score
        };

        try {
            const { error } = await window.supabaseClient
                .from('matches')
                .insert([matchData]);

            if (error) throw error;
            console.log('Match record saved successfully.');
        } catch (error) {
            console.error('Error saving match record:', error);
        }
    }

    async function endGame(playerWon) {
        isGameOver = true;
        nimActionBar.style.display = 'none';
        nimMessage.style.display = 'none';

        const score = playerWon ? WIN_SCORE : 0;
        await saveMatchRecord(score);

        // Show overlay after a delay
        setTimeout(() => {
            setupOverlay.style.display = 'flex';
            if (playerWon) {
                if (winSound) winSound.play().catch(e => console.error("Audio play failed:", e));
            } else {
                if (loseSound) loseSound.play().catch(e => console.error("Audio play failed:", e));
            }
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

        const gameTypesToUpdate = [gameType, 'all'];

        try {
            for (const type of gameTypesToUpdate) {
                // Call the new, atomic database function to handle the score update.
                const { error } = await window.supabaseClient.rpc('increment_score', {
                    player_id_in: user.id,
                    game_type_in: type,
                    score_in: score
                });
                if (error) throw error;
            }

            overlayMessage.textContent = `You win! Score of ${score} submitted.`;
            overlayMessage.style.color = '#4ade80';
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
        nimActionBar.style.display = 'none';
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