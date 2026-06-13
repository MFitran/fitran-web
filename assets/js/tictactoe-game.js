document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const boardElement = document.getElementById('tictactoe-board');
    const messageElement = document.getElementById('tictactoe-message');
    const restartBtn = document.getElementById('tictactoe-restart-btn');
    const overlay = document.getElementById('tictactoe-game-over-overlay');
    const overlayTitle = document.getElementById('tictactoe-overlay-title');
    const overlayMessage = document.getElementById('tictactoe-overlay-message');
    const playAgainBtn = document.getElementById('tictactoe-play-again-btn');

    // --- AUDIO ---
    const playerMoveSound = new Audio('assets/draw_x.mp3');
    const botMoveSound = new Audio('assets/draw_circle.mp3');
    const winSound = new Audio('assets/win.mp3');
    const loseSound = new Audio('assets/lose.mp3');
    const tieSound = new Audio('assets/tie.mp3');

    // --- GAME STATE ---
    const PLAYER = 'X';
    const BOT = 'O';
    let board = ['', '', '', '', '', '', '', '', ''];
    let isPlayerTurn = true;
    let isGameOver = false;
    const GAME_TYPE = 'tictactoe';
    const WIN_SCORE = 100; // Lower score for a quicker game
    let gameRecord = [];

    const winningCombinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]  // Diagonals
    ];

    // --- GAME LOGIC ---
    function startGame() {
        board = ['', '', '', '', '', '', '', '', ''];
        isGameOver = false;
        isPlayerTurn = Math.random() < 0.5; // Randomize who goes first
        gameRecord = [];
        boardElement.innerHTML = '';
        overlay.style.display = 'none';
        boardElement.style.pointerEvents = 'auto'; // Ensure board is clickable on new game

        // Create cells
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.classList.add('tictactoe-cell');
            cell.dataset.index = i;
            cell.addEventListener('click', handleCellClick);
            boardElement.appendChild(cell);
        }
        
        if (isPlayerTurn) {
            messageElement.textContent = 'You start. Your turn (X).';
        } else {
            messageElement.textContent = "Bot starts. Bot's turn (O).";
            boardElement.style.pointerEvents = 'none'; // Disable board during bot's turn
            setTimeout(botMove, 1000);
        }
    }

    function handleCellClick(e) {
        if (isGameOver || !isPlayerTurn) return;
        const index = e.target.dataset.index;

        if (board[index] === '') {
            playerMove(index);
        }
    }

    function playerMove(index) {
        board[index] = PLAYER;
        gameRecord.push({ player: 'P', index });
        drawMark(index, PLAYER);
        if (playerMoveSound) playerMoveSound.play();

        const winningLine = checkWin(PLAYER);
        if (winningLine) {
            endGame(true, winningLine);
            return;
        }
        if (checkDraw()) {
            endGame(null); // It's a draw
            return;
        }

        isPlayerTurn = false;
        messageElement.textContent = "Bot's turn (O)";
        boardElement.style.pointerEvents = 'none'; // Disable board during bot's turn
        setTimeout(botMove, 1000); // Slightly longer delay for bot
    }

    function botMove() {
        if (isGameOver) return;

        let move = findBestMove();
        board[move] = BOT;
        gameRecord.push({ player: 'B', index: move });
        drawMark(move, BOT);
        if (botMoveSound) botMoveSound.play();

        const winningLine = checkWin(BOT);
        if (winningLine) {
            endGame(false, winningLine);
            return;
        }
        if (checkDraw()) {
            endGame(null); // It's a draw
            return;
        }

        isPlayerTurn = true;
        messageElement.textContent = 'Your turn (X)';
        boardElement.style.pointerEvents = 'auto'; // Re-enable board for player
    }

    function findBestMove() {
        // 1. Check if bot can win
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = BOT;
                if (checkWin(BOT, true)) {
                    board[i] = ''; // Reset test move
                    return i;
                }
                board[i] = '';
            }
        }

        // 2. Check if player can win and block
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = PLAYER;
                if (checkWin(PLAYER, true)) {
                    board[i] = ''; // Reset test move
                    return i;
                }
                board[i] = '';
            }
        }

        // 3. Take center if available
        if (board[4] === '') return 4;

        // 4. Take a random corner
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(i => board[i] === '');
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }

        // 5. Take a random side
        const sides = [1, 3, 5, 7];
        const availableSides = sides.filter(i => board[i] === '');
        if (availableSides.length > 0) {
            return availableSides[Math.floor(Math.random() * availableSides.length)];
        }
        
        // Fallback (should not be reached in a normal game)
        return board.findIndex(cell => cell === '');
    }

    function checkWin(player, isTesting = false) {
        for (const combination of winningCombinations) {
            const [a, b, c] = combination;
            if (board[a] === player && board[a] === board[b] && board[a] === board[c]) {
                // Highlight winning cells only if it's a real win
                if (!isTesting && !isGameOver) {
                    document.querySelector(`[data-index='${a}']`).classList.add('win');
                    document.querySelector(`[data-index='${b}']`).classList.add('win');
                    document.querySelector(`[data-index='${c}']`).classList.add('win');
                }
                return combination;
            }
        }
        return null;
    }

    function checkDraw() {
        return !board.includes('');
    }

    function drawMark(index, player) {
        const cell = boardElement.querySelector(`[data-index='${index}']`);
        if (!cell || cell.innerHTML !== '') return; // Don't draw if already marked

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');

        if (player === PLAYER) { // 'X'
            const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line1.setAttribute('x1', '30'); line1.setAttribute('y1', '30');
            line1.setAttribute('x2', '70'); line1.setAttribute('y2', '70');
            line1.classList.add('x-line', 'x-line1');

            const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line2.setAttribute('x1', '70'); line2.setAttribute('y1', '30');
            line2.setAttribute('x2', '30'); line2.setAttribute('y2', '70');
            line2.classList.add('x-line', 'x-line2');

            svg.appendChild(line1);
            svg.appendChild(line2);
        } else { // 'O'
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '50');
            circle.setAttribute('cy', '50');
            circle.setAttribute('r', '22');
            circle.classList.add('o-circle');
            svg.appendChild(circle);
        }
        cell.appendChild(svg);
    }

    function drawWinningLine(combination) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('tictactoe-winning-line-svg');
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.classList.add('tictactoe-winning-line');

        const positions = {
            // [x1, y1, x2, y2]
            '012': [40, 50, 260, 50],   // Row 1
            '345': [40, 150, 260, 150], // Row 2
            '678': [40, 250, 260, 250], // Row 3
            '036': [50, 40, 50, 260],   // Col 1
            '147': [150, 40, 150, 260], // Col 2
            '258': [250, 40, 250, 260], // Col 3
            '048': [40, 40, 260, 260],  // Diag 1
            '246': [260, 40, 40, 260]   // Diag 2
        };

        const comboStr = combination.join('');
        const coords = positions[comboStr];

        if (coords) {
            line.setAttribute('x1', coords[0]);
            line.setAttribute('y1', coords[1]);
            // Set the end point immediately for the dasharray animation
            line.setAttribute('x2', coords[2]);
            line.setAttribute('y2', coords[3]);
            
            svg.appendChild(line);
            boardElement.appendChild(svg);
        }
    }

    async function endGame(playerWon, winningLine = null) {
        isGameOver = true;
        
        if (winningLine) {
            drawWinningLine(winningLine);
        }

        const showPopup = async () => {
            let score = 0;
            if (playerWon === true) {
                score = WIN_SCORE;
                overlayTitle.textContent = 'You Win!';
                overlayMessage.textContent = 'Congratulations!';
                overlayMessage.style.color = '#4ade80';
                await submitScore(GAME_TYPE, score);
            } else if (playerWon === false) {
                overlayTitle.textContent = 'You Lose!';
                overlayMessage.textContent = 'The bot was too smart this time.';
                overlayMessage.style.color = '#ff6b6b';
            } else {
                overlayTitle.textContent = 'It\'s a Draw!';
                overlayMessage.textContent = 'A well-fought match!';
                overlayMessage.style.color = '#A0A0A0';
            }

            await saveMatchRecord(score);

            overlay.style.display = 'flex';
            if (playerWon === true) {
                if (winSound) winSound.play().catch(e => console.error("Audio play failed:", e));
            } else if (playerWon === false) {
                if (loseSound) loseSound.play().catch(e => console.error("Audio play failed:", e));
            } else {
                if (tieSound) tieSound.play().catch(e => console.error("Audio play failed:", e));
            }
        };

        if (winningLine) {
            setTimeout(showPopup, 600); // Delay to show line animation
        } else {
            showPopup(); // Show immediately for draws
        }
    }

    function formatGameRecord(recordArray) {
        return recordArray.map(move => `${move.player}${move.index}`).join(' ');
    }

    async function saveMatchRecord(score) {
        const user = JSON.parse(localStorage.getItem('fitran_player'));
        if (!window.supabaseClient) return;

        const recordString = formatGameRecord(gameRecord);
        const matchData = {
            player_id: (user && user.id) ? user.id : null,
            game_type: GAME_TYPE,
            record: { moves: recordString },
            score_earned: score
        };

        try {
            const { error } = await window.supabaseClient.from('matches').insert([matchData]);
            if (error) throw error;
            console.log('Tic Tac Toe match record saved.');
        } catch (error) {
            console.error('Error saving match record:', error);
        }
    }

    async function submitScore(gameType, score) {
        const user = JSON.parse(localStorage.getItem('fitran_player'));
        if (!user || !user.id || !window.supabaseClient) {
            overlayMessage.textContent = `You win! Score of ${score} not submitted. Please log in to save your score.`;
            overlayMessage.style.color = '#ffcc00';
            return;
        }

        try {
            for (const type of [gameType, 'all']) {
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

    // --- EVENT LISTENERS ---
    restartBtn.addEventListener('click', startGame);
    playAgainBtn.addEventListener('click', startGame);

    // --- INITIAL LOAD ---
    startGame();
});