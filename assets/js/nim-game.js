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
        nimControls.style.display = 'flex';
        nimMessage.style.display = 'block';

        renderSticksSequentially();

        nimMessage.textContent = 'Your turn.';
        nimMessage.style.color = ''; // Reset color to default
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

    async function saveMatchAndScore(playerWon) {
        const user = JSON.parse(localStorage.getItem('fitran_player'));
        const client = await window.getSupabaseClient();
        const score = playerWon ? WIN_SCORE : 0;
        const statusEl = nimMessage;
        if (!statusEl) return;
        statusEl.style.color = ''; // Reset color

        if (client) {
            // 1. Save the match record
            const recordString = formatGameRecord(gameRecord);
            const matchData = {
                player_id: (user && user.id) ? user.id : null,
                game_type: GAME_TYPE,
                record: { moves: recordString },
                score_earned: score
            };
            try {
                const { error } = await client.from('matches').insert([matchData]);
                if (error) throw error;
                console.log('Match record saved successfully.');
            } catch (error) {
                console.error('Error saving match record:', error);
            }
        } else {
            console.log('Supabase client not available. Match record not saved.');
        }

        // 2. Update the leaderboard score and UI
        if (playerWon) { // WIN
            if (user && user.id && client) {
                statusEl.innerHTML = `You Win! <span id="nim-score-status" style="color: #A0A0A0;">(Submitting score...)</span>`;
                statusEl.style.color = '#4ade80'; // Greyish green
                try {
                    for (const type of [GAME_TYPE, 'all']) {
                        const { error } = await client.rpc('increment_score', {
                            player_id_in: user.id,
                            game_type_in: type,
                            score_in: WIN_SCORE
                        });
                        if (error) throw error;
                    }
                    console.log(`Score of ${WIN_SCORE} submitted for ${user.user_metadata.username}`);
                    const scoreStatusEl = document.getElementById('nim-score-status');
                    if (scoreStatusEl) {
                        scoreStatusEl.textContent = ` (Score: +${WIN_SCORE})`;
                        scoreStatusEl.style.color = '#4ade80';
                    }
                } catch (error) {
                    console.error('Error submitting score:', error);
                    const scoreStatusEl = document.getElementById('nim-score-status');
                    if (scoreStatusEl) {
                        scoreStatusEl.textContent = ' (Error submitting score)';
                        scoreStatusEl.style.color = '#ff6b6b';
                    }
                }
            } else { // Win, but not logged in or no client
                statusEl.innerHTML = `You win! <span style="color: #A0A0A0;">(Log in to track your progress)</span>`;
                statusEl.style.color = '#f5a623'; // Greyish orange
            }
        } else { // LOSS
            statusEl.textContent = 'You Lose. You took the last stick.';
            statusEl.style.color = '#ff6b6b'; // Greyish red
        }
    }

    async function endGame(playerWon) {
        isGameOver = true;
        nimControls.style.display = 'none';
        nimMessage.style.display = 'block'; // Keep message area visible

        await saveMatchAndScore(playerWon);

        // Play sound
        const sound = playerWon ? winSound : loseSound;
        if (sound) sound.play().catch(e => console.error("Audio play failed:", e));
    }

    function resetGame() {
        setupOverlay.style.display = 'none';
        setupOverlay.classList.remove('show', 'hide');
        initialSetupSection.style.display = 'flex';
        sticksContainer.innerHTML = '';
        nimMessage.style.display = 'none';
        nimActionBar.style.display = 'none';
    }

    // --- EVENT LISTENERS ---
    startGameBtn.addEventListener('click', startGame);
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