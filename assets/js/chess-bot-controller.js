// Sound Effects
const sfxGameStart = new Audio('assets/chess-game-start.mp3');
const sfxMoveSelf = new Audio('assets/chess-move-self.mp3');
const sfxMoveOpponent = new Audio('assets/chess-move-opponent.mp3');
const sfxCapture = new Audio('assets/chess-capture.mp3');
const sfxCastle = new Audio('assets/chess-castle.mp3');
const sfxCheck = new Audio('assets/chess-move-check.mp3');
const sfxPromote = new Audio('assets/chess-promote.mp3');
const sfxIllegal = new Audio('assets/chess-illegal.mp3');
const sfxGameEnd = new Audio('assets/chess-game-end.mp3');

// Game State
const game = new Chess();
const GAME_TYPE = 'chess';
const WIN_SCORE = 2500;
let currentWinScore = WIN_SCORE;
const DRAW_SCORE = 100;
let board = null;
let botIsCalculating = false;
let isGameOverPlayed = false;
let isGameStarted = false; // NEW: Track if the game has officially started
let playerColor = 'w';
let promotionMoveData = null; // NEW: Store move data for promotion
let openingBook = {};

// Load Opening Book JSON
fetch('assets/fitran_opening_tree.json')
    .then(response => response.json())
    .then(data => {
        openingBook = data;
        console.log("Opening Book Loaded! Ready to play Fitran's theory.");
    })
    .catch(err => console.error("Failed to load Opening Book.", err));

// Helper: Play Sounds
function playMoveSound(moveObj, isBot) {
    if (game.in_checkmate() || game.in_draw() || isGameOverPlayed) return;
    if (moveObj.flags.includes('p')) {
        sfxPromote.currentTime = 0; sfxPromote.play().catch(e=>e);
        // Check also triggers on promotion, so we return to avoid double sound.
        return;
    }
    if (game.in_check()) { sfxCheck.currentTime = 0; sfxCheck.play().catch(e=>e); return; }
    
    if (moveObj.flags.includes('c') || moveObj.flags.includes('e')) {
        sfxCapture.currentTime = 0; sfxCapture.play().catch(e=>e);
    } else if (moveObj.flags.includes('k') || moveObj.flags.includes('q')) {
        sfxCastle.currentTime = 0; sfxCastle.play().catch(e=>e);
    } else {
        const audio = isBot ? sfxMoveOpponent : sfxMoveSelf;
        audio.currentTime = 0; audio.play().catch(e=>e);
    }
}

// UI: Move Log
function updateMoveLog() {
    const history = game.history();
    let logHTML = '';
    for (let i = 0; i < history.length; i += 2) {
        const moveNumber = (i / 2) + 1;
        const whiteMove = history[i];
        const blackMove = history[i + 1] ? history[i + 1] : '';
        logHTML += `<div><strong>${moveNumber}.</strong> ${whiteMove} ${blackMove}</div>`;
    }
    const logBox = document.getElementById('move-log');
    if (logBox) {
        logBox.innerHTML = logHTML;
        if (window.innerWidth <= 768) {
            logBox.scrollLeft = logBox.scrollWidth;
        } else {
            logBox.scrollTop = logBox.scrollHeight;
        }
    }
}

// UI: Material Tracker
function updateMaterial() {
    const pieceValues = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9 };
    const symbols = {
        'w': { 'p': '♙', 'n': '♘', 'b': '♗', 'r': '♖', 'q': '♕' },
        'b': { 'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛' }
    };
    
    const startingCounts = { 'p': 8, 'n': 2, 'b': 2, 'r': 2, 'q': 1 };
    let whiteCurrent = { 'p': 0, 'n': 0, 'b': 0, 'r': 0, 'q': 0 };
    let blackCurrent = { 'p': 0, 'n': 0, 'b': 0, 'r': 0, 'q': 0 };

    let whiteScore = 0; let blackScore = 0;
    
    const boardState = game.board();
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = boardState[r][c];
            if (piece) {
                if (piece.color === 'w') {
                    whiteScore += pieceValues[piece.type];
                    whiteCurrent[piece.type]++;
                } else {
                    blackScore += pieceValues[piece.type];
                    blackCurrent[piece.type]++;
                }
            }
        }
    }

    let blackCapturedStr = '';
    for (let type of ['q', 'r', 'b', 'n', 'p']) {
        let missing = Math.max(0, startingCounts[type] - whiteCurrent[type]);
        for (let i = 0; i < missing; i++) blackCapturedStr += symbols['w'][type];
    }
    
    let whiteCapturedStr = '';
    for (let type of ['q', 'r', 'b', 'n', 'p']) {
        let missing = Math.max(0, startingCounts[type] - blackCurrent[type]);
        for (let i = 0; i < missing; i++) whiteCapturedStr += symbols['b'][type];
    }

    const topDiv = document.getElementById('top-material');
    const bottomDiv = document.getElementById('bottom-material');

    if (topDiv && bottomDiv) {
        const whiteTheme = { bg: '#606060', color: '#111', advColor: '#16a34a' };
        const blackTheme = { bg: '#303030', color: '#E0E0E0', advColor: '#4ade80' };
        
        const diff = whiteScore - blackScore;
        const wAdv = diff > 0 ? ` <span style="color: ${whiteTheme.advColor}; font-weight: bold; margin-left: 8px;">+${diff}</span>` : '';
        const bAdv = diff < 0 ? ` <span style="color: ${blackTheme.advColor}; font-weight: bold; margin-left: 8px;">+${Math.abs(diff)}</span>` : '';

        if (playerColor === 'w') {
            topDiv.innerHTML = blackCapturedStr + bAdv;
            topDiv.style.backgroundColor = blackTheme.bg;
            topDiv.style.color = blackTheme.color;
            
            bottomDiv.innerHTML = whiteCapturedStr + wAdv;
            bottomDiv.style.backgroundColor = whiteTheme.bg;
            bottomDiv.style.color = whiteTheme.color;
        } else {
            topDiv.innerHTML = whiteCapturedStr + wAdv;
            topDiv.style.backgroundColor = whiteTheme.bg;
            topDiv.style.color = whiteTheme.color;
            
            bottomDiv.innerHTML = blackCapturedStr + bAdv;
            bottomDiv.style.backgroundColor = blackTheme.bg;
            bottomDiv.style.color = blackTheme.color;
        }
    }
}

// NEW: Save match to Supabase
async function saveMatchAndScore(playerWon, isDraw = false) {
    const user = JSON.parse(localStorage.getItem('fitran_player'));
    const client = await window.getSupabaseClient();

    const score = isDraw ? DRAW_SCORE : (playerWon ? currentWinScore : 0);
    const statusEl = document.getElementById('status');
    if (!statusEl) return;

    // 1. Save the match record
    const matchData = {
        player_id: (user && user.id) ? user.id : null,
        game_type: GAME_TYPE,
        record: { pgn: game.pgn({ max_width: 5, newline_char: ' ' }) },
        score_earned: score
    };

    if (client) {
        try {
            const { error } = await client.from('matches').insert([matchData]);
            if (error) throw error;
            console.log('Chess match record saved successfully.');
        } catch (error) {
            console.error('Error saving chess match record:', error);
        }
    } else {
        console.log('Supabase client not available. Match record not saved.');
    }

    // 2. Update the leaderboard score if a user is logged in
    if (!user || !user.id) {
        if (playerWon || isDraw) statusEl.innerHTML += ` <span style="color: #A0A0A0;">(Log in to save score)</span>`;
        return;
    }

    if (score > 0 && client) {
        if (statusEl) statusEl.innerHTML += ' <span id="score-status">(Submitting score...)</span>';
        try {
            for (const type of [GAME_TYPE, 'all']) {
                const { error } = await client.rpc('increment_score', {
                    player_id_in: user.id,
                    game_type_in: type,
                    score_in: score
                });
                if (error) throw error;
            }
            console.log(`Score of ${score} submitted for ${user.user_metadata.username}`);
            const scoreStatusEl = document.getElementById('score-status');
            if (scoreStatusEl) {
                scoreStatusEl.textContent = `(Score: +${score})`;
                if (isDraw) {
                    scoreStatusEl.style.color = '#ffcc00';
                } else {
                    scoreStatusEl.style.color = '#4ade80';
                }
            }
        } catch (error) {
            console.error('Error submitting score:', error);
            const scoreStatusEl = document.getElementById('score-status');
            if (scoreStatusEl) {
                scoreStatusEl.textContent = '(Error submitting score)';
                scoreStatusEl.style.color = '#ff6b6b';
            }
        }
    } else {
        // If score is 0 (loss) and logged in, the main message color is already set by updateStatus.
        // No score status to append in this case.
        // The message will remain the loss message set by updateStatus.
    }
}

// Logic: Read JSON Book with Weighted Randomness
function getBookMove(fen) {
    const parts = fen.split(' ');
    const baseFen = parts.slice(0, 4).join(' '); 
    let options = openingBook[baseFen];

    // Fallback: If exact FEN not found, try replacing en passant square with '-'
    if (!options || options.length === 0) {
        const altFen = parts.slice(0, 3).join(' ') + ' -';
        options = openingBook[altFen];
    }

    if (!options || options.length === 0) return null;

    // 1. Raise the weights to a higher power to overwhelmingly favor the top move
    const exponent = 5;
    let totalAdjustedWeight = 0;
    const adjustedOptions = options.map(opt => {
        const adjustedWeight = Math.pow(opt.weight, exponent);
        totalAdjustedWeight += adjustedWeight;
        return { ...opt, adjustedWeight };
    });

    let randomNum = Math.random() * (totalAdjustedWeight + 1);

    for (const option of adjustedOptions) {
        if (randomNum < option.adjustedWeight) return option.move;
        randomNum -= option.adjustedWeight;
    }
    
    // Revert to stockfish
    return null;
}

// Logic: Stockfish Fallback
// Logic: Stockfish Fallback (Native Engine Skill Level Throttling)
function getStockfishMove(fen) {
    return new Promise((resolve) => {
        const workerCode = "importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');";
        const sfBlob = new Blob([workerCode], { type: 'application/javascript' });
        const instanceEngine = new Worker(URL.createObjectURL(sfBlob));

        instanceEngine.postMessage('uci');

        const engineMessageHandler = function(event) {
            const line = event.data;

            if (line === 'readyok') {
                // --- DYNAMIC ENDGAME CHECK ---
                // Count remaining pieces using the FEN string
                const pieces = fen.split(' ')[0];
                const totalPieces = (pieces.match(/[a-zA-Z]/g) || []).length;

                // If it's a KQ vs K endgame (3 pieces total: 2 Kings + 1 Queen)
                const isKQEndgame = totalPieces <= 8;

                if (isKQEndgame) {
                    // Let Stockfish play perfectly to finish the game and avoid stalemates
                    instanceEngine.postMessage('setoption name Skill Level value 20');
                    instanceEngine.postMessage('position fen ' + fen);
                    instanceEngine.postMessage('go depth 15'); // Higher depth to see the checkmate
                } else {
                    // Your default throttled settings for casual play
                    instanceEngine.postMessage('setoption name Skill Level value 7');
                    instanceEngine.postMessage('setoption name Skill Level Maximum Error value 300');
                    instanceEngine.postMessage('setoption name Skill Level Probability value 200');
                    instanceEngine.postMessage('position fen ' + fen);
                    instanceEngine.postMessage('go depth 5');
                }
            }

            if (line && line.indexOf('bestmove') > -1) {
                const match = line.match(/^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/);
                instanceEngine.removeEventListener('message', engineMessageHandler);
                instanceEngine.terminate(); 
                resolve(match ? match[1] : null);
            }
        };

        instanceEngine.addEventListener('message', engineMessageHandler);
        instanceEngine.postMessage('isready');
    });
}

// AI Turn Execution
async function makeBotMove() {
    botIsCalculating = true;
    let chosenMoveString = null;
    
    chosenMoveString = getBookMove(game.fen());

    if (!chosenMoveString) {
        updateStatus("Bot is thinking...");
        console.log("Out of book! Switching to Stockfish.");
        chosenMoveString = await getStockfishMove(game.fen());
    }

    if (chosenMoveString) {
        const moveObj = game.move({
            from: chosenMoveString.substring(0, 2),
            to: chosenMoveString.substring(2, 4),
            promotion: chosenMoveString.length > 4 ? chosenMoveString[4] : 'q'
        });
        board.position(game.fen());
        if (moveObj) {
            playMoveSound(moveObj, true);
            updateMoveLog();
            updateMaterial();
        }
    }

    updateStatus();
    botIsCalculating = false;
}

// NEW: Show promotion dialog
function showPromotionDialog() {
    const overlay = document.getElementById('promotion-overlay');
    const choicesContainer = document.getElementById('promotion-choices');
    if (!overlay || !choicesContainer) return;

    choicesContainer.innerHTML = ''; // Clear previous choices
    const promotionPieces = ['q', 'r', 'b', 'n'];
    const pieceColor = game.turn();

    promotionPieces.forEach(pieceType => {
        const pieceFileName = `${pieceColor}${pieceType.toUpperCase()}`;
        const button = document.createElement('div');
        button.style.cursor = 'pointer';
        button.style.padding = '5px';
        button.style.borderRadius = '5px';
        button.style.transition = 'background-color 0.2s';
        button.innerHTML = `<img src="assets/kosal/${pieceFileName}.svg" data-piece="${pieceType}" style="width: 60px; height: 60px; display: block;">`;
        
        button.addEventListener('mouseenter', () => button.style.backgroundColor = '#333');
        button.addEventListener('mouseleave', () => button.style.backgroundColor = 'transparent');

        button.addEventListener('click', () => {
            completePromotion(pieceType);
        });
        choicesContainer.appendChild(button);
    });

    overlay.style.display = 'flex';
}

// NEW: Complete the promotion after user selection
function completePromotion(pieceType) {
    const overlay = document.getElementById('promotion-overlay');
    if (!overlay || !promotionMoveData) return;

    const move = game.move({
        from: promotionMoveData.from,
        to: promotionMoveData.to,
        promotion: pieceType
    });

    if (move) {
        if (!isGameStarted) startGameExplicitly();
        board.position(game.fen());
        playerMadeMove(move);
    }

    overlay.style.display = 'none';
    promotionMoveData = null;
}

// NEW: Shared function to process a successful player move
function playerMadeMove(move) {
    playMoveSound(move, false);
    updateMoveLog();
    updateMaterial();
    
    if (!game.game_over()) {
        updateStatus("Bot is thinking...");
        window.setTimeout(makeBotMove, 100);
    } else {
        updateStatus(); // Game is over, update status and save score
    }
}

// Board Events
function onDragStart(source, piece, position, orientation) {
    if (game.game_over() || botIsCalculating) return false;

    // Only allow player to move their own pieces on their turn
    if (game.turn() !== playerColor.charAt(0)) {
        return false;
    }
    
    if ((playerColor === 'w' && piece.search(/^b/) !== -1) || 
        (playerColor === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }

    // Clear any previous click-selection and highlights
    selectedSquare = null;
    removeSquareHighlights();
    
    // Highlight squares on drag
    highlightLegalMoves(source);
}

function onDrop(source, target) {
    // NEW: If game hasn't started yet, this is the player's first move
    if (!isGameStarted) startGameExplicitly();

    const legalMoves = game.moves({ square: source, verbose: true });
    const isLegalMove = legalMoves.some(move => move.to === target);

    if (!isLegalMove) {
        sfxIllegal.currentTime = 0; sfxIllegal.play().catch(e=>e);
        return 'snapback';
    }

    const piece = game.get(source);
    const isPromotion = piece && piece.type === 'p' &&
                        ((piece.color === 'w' && target.charAt(1) === '8') ||
                         (piece.color === 'b' && target.charAt(1) === '1'));

    if (isPromotion) {
        promotionMoveData = { from: source, to: target };
        showPromotionDialog();
        return 'snapback';
    }

    const move = game.move({ from: source, to: target });
    playerMadeMove(move);
}

function onSnapEnd() { 
    board.position(game.fen()); 
    removeSquareHighlights();
}

let selectedSquare = null;

function removeSquareHighlights() {
    $('#board [data-square]').removeClass('highlight-legal highlight-selected');
}

function highlightLegalMoves(square) {
    const moves = game.moves({
        square: square,
        verbose: true
    });

    if (moves.length === 0) return;

    // highlight the source square
    $(`#board [data-square="${square}"]`).addClass('highlight-selected');

    // Highlight legal destination squares
    for (let i = 0; i < moves.length; i++) {
        $(`#board [data-square="${moves[i].to}"]`).addClass('highlight-legal');
    }
}

function onSquareClick(square, piece) {
    // do nothing if it's not the player's turn or game is over
    if (game.game_over() || botIsCalculating || game.turn() !== playerColor.charAt(0)) {
        return;
    }

    // if a piece was already selected, try to move it
    if (selectedSquare) {
        const source = selectedSquare;
        const target = square;

        const legalMoves = game.moves({ square: source, verbose: true });
        const isLegalTarget = legalMoves.some(m => m.to === target);

        if (isLegalTarget) {
            const piece = game.get(source);
            const isPromotion = piece && piece.type === 'p' &&
                                ((piece.color === 'w' && target.charAt(1) === '8') ||
                                 (piece.color === 'b' && target.charAt(1) === '1'));

            if (isPromotion) {
                promotionMoveData = { from: source, to: target };
                showPromotionDialog();
            } else {
                const move = game.move({ from: source, to: target });
                if (move) {
                    if (!isGameStarted) startGameExplicitly();
                    board.position(game.fen());
                    playerMadeMove(move);
                }
            }
            removeSquareHighlights();
            selectedSquare = null;
            return;
        }
    }

    // if we are here, it's either a re-selection or a new selection
    removeSquareHighlights();

    if (piece && piece.startsWith(playerColor) && selectedSquare !== square) {
        selectedSquare = square;
        highlightLegalMoves(square);
    } else {
        selectedSquare = null;
    }
}

async function updateStatus(customMsg) {
    let statusText = '';
    const turn = game.turn();
    let turnColor = turn === 'b' ? 'Black' : 'White';
    const statusEl = document.getElementById('status');

    if (game.game_over()) {
        if (isGameOverPlayed) {
            // Game is over and we've already handled it. Just make sure the status text is correct.
            if (game.in_checkmate()) {
                const winner = turn === 'w' ? 'Black' : 'White';
                statusText = `${winner} wins by checkmate.`;
            } else { // All other game-over states are draws
                statusText = 'Game drawn';
            }
            statusEl.innerText = statusText;
            return; // Exit early
        }

        // --- First time handling game over ---
        isGameOverPlayed = true;
        sfxGameEnd.currentTime = 0; sfxGameEnd.play().catch(e=>e);

        if (game.in_checkmate()) {
            const winner = turn === 'w' ? 'Black' : 'White';
            statusText = `${winner} wins by checkmate.`;
            const playerIsWinner = winner.charAt(0).toLowerCase() === playerColor;
            statusEl.style.color = playerIsWinner ? '#4ade80' : 'red'; // Set main message color
            statusEl.innerText = statusText;
            await saveMatchAndScore(playerIsWinner, false);
        } else if (game.in_draw()) {
            statusText = 'Game drawn';
            if (game.in_stalemate()) {
                statusText += ' by stalemate.';
            } else if (game.in_threefold_repetition()) {
                statusText += ' by threefold repetition.';
            } else if (game.insufficient_material()) {
                statusText += ' by insufficient material.';
            } else {
                statusText += ' by 50-move rule.';
            }
            statusEl.style.color = '#ffcc00'; // Set main message color for draw
            statusEl.innerText = statusText;
            await saveMatchAndScore(false, true);
        }
    } else {
        statusText = customMsg || turnColor + ' to move';
        if (game.in_check()) statusText += ', ' + turnColor + ' is in check';
        statusEl.innerText = statusText;
        statusEl.style.color = ''; // Reset color
    }
}

// NEW: Function to explicitly start the game
function startGameExplicitly() {
    if (isGameStarted) return; // Prevent multiple starts

    isGameStarted = true;
    document.getElementById('color-select').style.display = 'none';
    document.getElementById('start-game-btn').style.display = 'none'; // Hide the new start button
    document.getElementById('undo-btn').style.display = 'inline-block';
    document.getElementById('restart-btn').style.display = 'inline-block';
    sfxGameStart.currentTime = 0; sfxGameStart.play().catch(e=>e);

    if (playerColor === 'b') {
        updateStatus("Bot is thinking...");
        window.setTimeout(makeBotMove, 250);
    } else {
        updateStatus('White to move'); // Player is white, their turn
    }
}

// --- UI State Management ---
function setupNewGame() {
    botIsCalculating = false;
    isGameOverPlayed = false;
    isGameStarted = false; // NEW: Reset game started flag
    promotionMoveData = null; // NEW: Clear any pending promotion
    currentWinScore = WIN_SCORE; // Reset potential score

    const restartBtn = document.getElementById('restart-btn');
    const colorSelect = document.getElementById('color-select');
    const startGameBtn = document.getElementById('start-game-btn'); // NEW: Get start button
    const undoBtn = document.getElementById('undo-btn');

    if (restartBtn) restartBtn.style.display = 'none';
    if (undoBtn) undoBtn.style.display = 'none';
    if (colorSelect) {
        colorSelect.style.display = 'inline-block';
        playerColor = colorSelect.value; // Update playerColor based on selection
        board.orientation(playerColor === 'b' ? 'black' : 'white'); // Orient board
    }

    // Always reset game state and board to initial
    game.reset();
    board.position('start');
    updateMoveLog();
    updateMaterial();
    if (startGameBtn) startGameBtn.style.display = 'inline-block'; // NEW: Show start button

    // NEW: Initial status message, bot does not move automatically now
    updateStatus('Select color.');
}

// Initialize
const config = {
    draggable: true, position: 'start',
    onDragStart: onDragStart, 
    onDrop: onDrop, 
    onSnapEnd: onSnapEnd,
    onSquareClick: onSquareClick,
    pieceTheme: 'assets/kosal/{piece}.svg'
};
board = Chessboard('board', config);

// Controls
const restartBtn = document.getElementById('restart-btn');
const colorSelect = document.getElementById('color-select');
const startGameBtn = document.getElementById('start-game-btn'); // NEW: Get start button
const undoBtn = document.getElementById('undo-btn');

if (colorSelect) {
    colorSelect.addEventListener('change', () => {
        if (!isGameStarted) { // NEW: Only allow color change if game hasn't started
            playerColor = colorSelect.value;
            board.orientation(playerColor === 'b' ? 'black' : 'white');
            updateMaterial();
            updateStatus(`Click Start or make a move.`); // NEW: Update status
        }
    });
}

if (restartBtn) {
    restartBtn.addEventListener('click', async () => {
        // If a game is in progress (started but not finished), save it as a loss (score 0).
        if (isGameStarted && !isGameOverPlayed) {
            console.log('Game restarted. Saving current game as abandoned.');
            await saveMatchAndScore(false, false); // Player did not win, it was not a draw.
        }
        setupNewGame();
    });
}

// NEW: Add event listener for the start game button
if (startGameBtn) {
    startGameBtn.addEventListener('click', startGameExplicitly);
}

// NEW: Add event listener for the undo button
if (undoBtn) {
    undoBtn.addEventListener('click', () => {
        // Guard clauses
        if (game.game_over() || botIsCalculating || !isGameStarted || game.history().length === 0) {
            return;
        }

        // It's always the player's turn when they can click this.
        // The last move was made by the bot.
        game.undo(); // Undo bot's move

        // If the history is not empty after undoing the bot's move,
        // it means the player also made a move in the last turn pair.
        if (game.history().length > 0) {
            game.undo(); // Undo player's move
        }

        // Apply score penalty
        currentWinScore = Math.max(100, currentWinScore - 100);
        console.log(`Undo used. New potential win score: ${currentWinScore}`);

        // Update UI
        board.position(game.fen());
        updateMoveLog();
        updateMaterial();
        updateStatus(); // This will set status to "Your turn"
    });
}

// Initial page load
setupNewGame();
