// Quantum Tic-Tac-Toe Game Logic
class QuantumTicTacToe {
    constructor() {
        this.board = Array(9).fill(null);
        this.currentPlayer = 1;
        this.selectedCard = null;
        this.probabilityDeck = [];
        this.gameOver = false;
        this.quantumCount = 0;
        this.collapsedCount = 0;
        this.gameMode = null; // 'pvp' or 'pvc'
        this.aiStrategy = null; // Will be set randomly: 'aggressive', 'defensive', 'balanced', 'random'
        this.aiThinking = false;
        this.isCollapsing = false; // Prevent multiple collapses per turn
        this.currentTutorialStep = 1; // Tutorial navigation
        
        this.initializeGame();
        this.setupEventListeners();
        this.showIntroModal();
    }

    initializeGame() {
        this.generateProbabilityDeck();
        this.renderProbabilityDeck();
        this.updateStats();
    }

    setupEventListeners() {
        // Board cell clicks - support both touch and mouse events
        document.querySelectorAll('.cell').forEach((cell, index) => {
            // Touch events for mobile (faster response)
            cell.addEventListener('touchend', (e) => {
                e.preventDefault(); // Prevent mouse events from firing
                this.handleCellClick(index);
            });
            
            // Mouse events for desktop
            cell.addEventListener('click', () => this.handleCellClick(index));
        });

        // Probability card clicks - support both touch and mouse events
        const probabilityDeck = document.getElementById('probability-deck');
        
        // Touch events for mobile (faster response)
        probabilityDeck.addEventListener('touchstart', (e) => {
            // Don't prevent default to allow click events
            const target = e.target.closest('.probability-card');
            if (target) {
                e.preventDefault(); // Prevent double-tap zoom
                this.selectProbabilityCard(target);
            }
        });
        
        // Mouse events for desktop
        probabilityDeck.addEventListener('click', (e) => {
            const target = e.target.closest('.probability-card');
            if (target) {
                this.selectProbabilityCard(target);
            }
        });

        // Control buttons
        document.getElementById('reset-game').addEventListener('click', () => this.resetGame());
        document.getElementById('show-help').addEventListener('click', () => this.showHelpModal());
        document.getElementById('play-again').addEventListener('click', () => this.resetGame());
        
        // Intro screen buttons
        document.getElementById('show-tutorial').addEventListener('click', () => this.showTutorial());
        document.getElementById('skip-tutorial').addEventListener('click', () => this.showModeSelect());
        
        // Tutorial navigation
        document.getElementById('prev-step').addEventListener('click', () => this.changeTutorialStep(-1));
        document.getElementById('next-step').addEventListener('click', () => this.changeTutorialStep(1));
        document.getElementById('back-from-tutorial').addEventListener('click', () => this.closeTutorial());
        document.getElementById('start-after-tutorial').addEventListener('click', () => this.showModeSelect());
        
        // Tutorial dots navigation
        document.querySelectorAll('.dot').forEach(dot => {
            dot.addEventListener('click', () => {
                const step = parseInt(dot.dataset.step);
                this.goToTutorialStep(step);
            });
        });
        
        // Mode selection buttons
        document.getElementById('mode-vs-player').addEventListener('click', () => this.startGame('pvp'));
        document.getElementById('mode-vs-computer').addEventListener('click', () => this.startGame('pvc'));

        // Modal close handlers
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.full-page').style.display = 'none';
            });
        });

        // Click outside modal to close (disabled for full-page screens)
        // Full-page screens require explicit navigation via buttons
    }

    generateProbabilityDeck() {
        this.probabilityDeck = [];
        
        // Weighted probability pairs - favor 50-70% range
        const probabilityPairs = [
            // Common (50-70% range) - higher weight
            { pair: [70, 30], weight: 3 },
            { pair: [60, 40], weight: 4 },
            { pair: [55, 45], weight: 4 },
            { pair: [50, 50], weight: 5 },
            { pair: [45, 55], weight: 4 },
            { pair: [40, 60], weight: 4 },
            { pair: [30, 70], weight: 3 },
            
            // Less common (extreme values) - lower weight
            { pair: [90, 10], weight: 1 },
            { pair: [80, 20], weight: 1 },
            { pair: [20, 80], weight: 1 },
            { pair: [10, 90], weight: 1 }
        ];

        // Create weighted pool
        const weightedPool = [];
        probabilityPairs.forEach(item => {
            for (let i = 0; i < item.weight; i++) {
                weightedPool.push(item.pair);
            }
        });

        // Generate exactly 3 random cards using weighted selection
        const selectedPairs = [];
        const poolCopy = [...weightedPool];
        
        for (let i = 0; i < 3; i++) {
            const randomIndex = Math.floor(Math.random() * poolCopy.length);
            selectedPairs.push(poolCopy[randomIndex]);
            poolCopy.splice(randomIndex, 1); // Remove to avoid duplicates
        }
        
        selectedPairs.forEach((pair, i) => {
            this.probabilityDeck.push({
                xProbability: pair[0],
                oProbability: pair[1],
                id: `card-${i}-${Date.now()}`
            });
        });
    }

    renderProbabilityDeck() {
        const deckElement = document.getElementById('probability-deck');
        deckElement.innerHTML = '';

        this.probabilityDeck.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'probability-card';
            cardElement.dataset.cardId = card.id;
            cardElement.innerHTML = `
                <div class="card-probabilities">
                    <div class="x-prob">${card.xProbability}% X</div>
                    <div class="o-prob">${card.oProbability}% O</div>
                </div>
            `;
            deckElement.appendChild(cardElement);
        });
    }

    selectProbabilityCard(cardElement) {
        // Don't allow card selection during AI turn
        if (this.gameMode === 'pvc' && this.currentPlayer === 2) return;
        if (this.aiThinking) return;
        
        const cardId = cardElement.dataset.cardId;
        
        // If clicking the same card, deselect it
        if (this.selectedCard && this.selectedCard.id === cardId) {
            this.selectedCard = null;
            cardElement.classList.remove('selected');
            return;
        }
        
        // If a different card is selected, switch to the new one
        if (this.selectedCard) {
            // Remove selection from previous card
            document.querySelectorAll('.probability-card').forEach(card => {
                card.classList.remove('selected');
            });
        }
        
        // Select new card
        cardElement.classList.add('selected');
        this.selectedCard = this.probabilityDeck.find(card => card.id === cardId);
    }

    handleCellClick(index) {
        if (this.gameOver || this.aiThinking || this.isCollapsing) return;
        
        // In PvC mode, only allow player 1 to click
        if (this.gameMode === 'pvc' && this.currentPlayer === 2) return;

        const cell = this.board[index];

        // If cell is empty and we have a selected card, place quantum piece
        if (!cell && this.selectedCard) {
            this.placeQuantumPiece(index);
        }
        // If cell contains a quantum piece, collapse it
        else if (cell && cell.type === 'quantum') {
            this.collapseQuantumPiece(index);
        }
    }

    placeQuantumPiece(index) {
        const quantumPiece = {
            type: 'quantum',
            xProbability: this.selectedCard.xProbability,
            oProbability: this.selectedCard.oProbability,
            player: this.currentPlayer
        };

        this.board[index] = quantumPiece;
        this.renderQuantumPiece(index, quantumPiece);
        
        // Clear selection and generate new deck
        this.selectedCard = null;
        
        // Remove selected class from all cards
        document.querySelectorAll('.probability-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        this.generateProbabilityDeck();
        this.renderProbabilityDeck();
        
        // Update stats
        this.quantumCount++;
        this.updateStats();
        
        // Check for tie (board full)
        if (this.checkTieGame()) {
            this.handleTieGame();
            return;
        }
        
        // Switch player
        this.switchPlayer();
    }

    collapseQuantumPiece(index) {
        const quantumPiece = this.board[index];
        if (!quantumPiece || quantumPiece.type !== 'quantum') return;

        // Prevent multiple collapses
        this.isCollapsing = true;

        // Clear any selected card
        this.selectedCard = null;
        document.querySelectorAll('.probability-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Start the dramatic collapse animation
        this.startCollapseAnimation(index, quantumPiece);
    }

    startCollapseAnimation(index, quantumPiece) {
        const cellElement = document.querySelectorAll('.cell')[index];
        
        // Fade out the quantum piece first
        cellElement.style.transition = 'opacity 0.3s ease-out';
        cellElement.style.opacity = '0.3';
        
        setTimeout(() => {
            // Create the dramatic spinning sphere
            const sphereElement = document.createElement('div');
            sphereElement.className = 'collapse-sphere';
            
            // Clear cell and add sphere
            cellElement.innerHTML = '';
            cellElement.appendChild(sphereElement);
            cellElement.style.opacity = '1';
            
            // After sphere animation completes (2s), reveal the result
            setTimeout(() => {
                this.revealCollapsedResult(index, quantumPiece);
            }, 1800); // Reveal just before animation ends
        }, 300); // Wait for quantum piece fade
    }

    revealCollapsedResult(index, quantumPiece) {
        // Determine collapsed state based on probability
        const random = Math.random() * 100;
        const isX = random < quantumPiece.xProbability;
        
        const collapsedPiece = {
            type: 'collapsed',
            value: isX ? 'X' : 'O',
            player: quantumPiece.player
        };

        this.board[index] = collapsedPiece;
        this.renderCollapsedPiece(index, collapsedPiece);
        
        // Update stats
        this.quantumCount--;
        this.collapsedCount++;
        this.updateStats();
        
        // Check for win condition after animation completes
        setTimeout(() => {
            // Allow next action after collapse completes
            this.isCollapsing = false;
            
            if (this.checkWinCondition()) {
                this.handleGameWin();
                return;
            }
            
            // Check for tie game
            if (this.checkTieGame()) {
                this.handleTieGame();
                return;
            }
            
            // Switch player
            this.switchPlayer();
        }, 500); // Small delay after reveal
    }

    renderQuantumPiece(index, quantumPiece) {
        const cellElement = document.querySelectorAll('.cell')[index];
        
        cellElement.innerHTML = `
            <div class="quantum-container">
                <div class="probability-bars">
                    <div class="prob-bar x-bar" style="width: ${quantumPiece.xProbability}%"></div>
                    <div class="prob-bar o-bar" style="width: ${quantumPiece.oProbability}%"></div>
                </div>
                <div class="quantum-symbols">
                    <span class="quantum-x">✗</span>
                    <span class="quantum-divider">/</span>
                    <span class="quantum-o">◯</span>
                </div>
                <div class="quantum-probability">
                    <div class="x-prob">${quantumPiece.xProbability}%</div>
                    <div class="o-prob">${quantumPiece.oProbability}%</div>
                </div>
            </div>
        `;
        cellElement.classList.add('occupied');
    }

    renderCollapsedPiece(index, collapsedPiece) {
        const cellElement = document.querySelectorAll('.cell')[index];
        const symbol = collapsedPiece.value === 'X' ? '✗' : '◯';
        const className = collapsedPiece.value === 'X' ? 'collapsed-x' : 'collapsed-o';
        
        cellElement.innerHTML = `<span class="${className} collapse-reveal">${symbol}</span>`;
        cellElement.classList.add('occupied', 'collapsed');
        
        // Reset opacity
        cellElement.style.opacity = '1';
        cellElement.style.transition = '';
    }


    checkWinCondition() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        for (let pattern of winPatterns) {
            const [a, b, c] = pattern;
            const cellA = this.board[a];
            const cellB = this.board[b];
            const cellC = this.board[c];

            // Check if all three cells have collapsed pieces of the same value
            if (cellA && cellB && cellC &&
                cellA.type === 'collapsed' && 
                cellB.type === 'collapsed' && 
                cellC.type === 'collapsed' &&
                cellA.value === cellB.value && 
                cellB.value === cellC.value) {
                
                this.winningPattern = pattern;
                this.winner = cellA.value;
                return true;
            }
        }
        return false;
    }

    handleGameWin() {
        this.gameOver = true;
        
        // Highlight winning line
        this.highlightWinningLine();
        
        // Show win modal
        setTimeout(() => {
            const winModal = document.getElementById('win-modal');
            const winTitle = document.getElementById('win-title');
            const winMessage = document.getElementById('win-message');
            
            // Determine winner text
            let winnerText = this.winner;
            let messageText = '';
            
            if (this.gameMode === 'pvc') {
                if (this.winner === 'X') {
                    winnerText = '🎉 You Win! 🎉';
                    messageText = `Amazing! You achieved quantum victory by collapsing three ${this.winner}'s in a row! The wave function has been observed and reality has been determined!`;
                } else {
                    winnerText = '🤖 Computer Wins! 🤖';
                    messageText = `The AI achieved quantum victory with its ${this.aiStrategy} strategy! Try again to beat the computer!`;
                }
            } else {
                winnerText = `🎉 ${this.winner} Wins! 🎉`;
                messageText = `Congratulations! Player ${this.winner === 'X' ? '1' : '2'} achieved quantum victory by collapsing three ${this.winner}'s in a row! The wave function has been observed and reality has been determined!`;
            }
            
            winTitle.textContent = winnerText;
            winMessage.textContent = messageText;
            
            winModal.style.display = 'block';
        }, 1000);
    }

    highlightWinningLine() {
        if (!this.winningPattern) return;

        const board = document.getElementById('board');
        const cells = document.querySelectorAll('.cell');
        
        // Calculate line position and orientation
        const [a, b, c] = this.winningPattern;
        const cellA = cells[a].getBoundingClientRect();
        const cellC = cells[c].getBoundingClientRect();
        const boardRect = board.getBoundingClientRect();
        
        const line = document.createElement('div');
        line.className = 'winning-line';
        
        // Calculate line dimensions and position
        const centerA = {
            x: cellA.left + cellA.width / 2 - boardRect.left,
            y: cellA.top + cellA.height / 2 - boardRect.top
        };
        
        const centerC = {
            x: cellC.left + cellC.width / 2 - boardRect.left,
            y: cellC.top + cellC.height / 2 - boardRect.top
        };
        
        const length = Math.sqrt(Math.pow(centerC.x - centerA.x, 2) + Math.pow(centerC.y - centerA.y, 2));
        const angle = Math.atan2(centerC.y - centerA.y, centerC.x - centerA.x) * 180 / Math.PI;
        
        line.style.width = length + 'px';
        line.style.left = centerA.x + 'px';
        line.style.top = centerA.y + 'px';
        line.style.transform = `rotate(${angle}deg)`;
        line.style.transformOrigin = '0 50%';
        
        board.style.position = 'relative';
        board.appendChild(line);
    }

    checkTieGame() {
        // Check if all cells are filled (either collapsed or quantum)
        const allCellsFilled = this.board.every(cell => cell !== null);
        
        // If all cells are filled and no one has won, it's a tie
        return allCellsFilled && !this.checkWinCondition();
    }

    handleTieGame() {
        this.gameOver = true;
        
        // Show tie modal
        setTimeout(() => {
            const winModal = document.getElementById('win-modal');
            const winTitle = document.getElementById('win-title');
            const winMessage = document.getElementById('win-message');
            
            winTitle.textContent = '🤝 It\'s a Tie! 🤝';
            winMessage.textContent = 'The quantum realm has reached equilibrium! All possibilities have been explored, but no clear winner emerged. The wave functions remain in perfect balance!';
            
            winModal.style.display = 'block';
        }, 1000);
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        const playerText = this.gameMode === 'pvc' && this.currentPlayer === 2 ? 'Computer' : `Player ${this.currentPlayer}`;
        document.getElementById('current-player').textContent = playerText;
        
        // If it's computer's turn, make AI move after a short delay
        if (this.gameMode === 'pvc' && this.currentPlayer === 2 && !this.gameOver) {
            this.aiThinking = true;
            setTimeout(() => {
                this.makeAIMove();
                this.aiThinking = false;
            }, 800); // 800ms delay for natural feel
        }
    }

    updateStats() {
        document.getElementById('quantum-count').textContent = this.quantumCount;
        document.getElementById('collapsed-count').textContent = this.collapsedCount;
    }


    // AI Logic - Different strategies
    makeAIMove() {
        if (this.gameOver) return;
        
        // Randomly select a card if none selected
        if (!this.selectedCard && this.probabilityDeck.length > 0) {
            const randomCardIndex = Math.floor(Math.random() * this.probabilityDeck.length);
            this.selectedCard = this.probabilityDeck[randomCardIndex];
            
            // Visually select the card
            const cardElements = document.querySelectorAll('.probability-card');
            cardElements.forEach(card => card.classList.remove('selected'));
            if (cardElements[randomCardIndex]) {
                cardElements[randomCardIndex].classList.add('selected');
            }
        }
        
        // Decide action based on strategy
        const action = this.aiDecideAction();
        
        if (action.type === 'place' && this.selectedCard) {
            this.placeQuantumPiece(action.index);
        } else if (action.type === 'collapse') {
            this.collapseQuantumPiece(action.index);
        }
    }
    
    aiDecideAction() {
        // Choose between placing a piece or collapsing one
        const quantumPieces = [];
        const emptySpaces = [];
        
        this.board.forEach((cell, index) => {
            if (!cell) {
                emptySpaces.push(index);
            } else if (cell.type === 'quantum') {
                quantumPieces.push(index);
            }
        });
        
        // Strategy-based decision
        switch (this.aiStrategy) {
            case 'aggressive':
                return this.aiAggressiveStrategy(emptySpaces, quantumPieces);
            case 'defensive':
                return this.aiDefensiveStrategy(emptySpaces, quantumPieces);
            case 'balanced':
                return this.aiBalancedStrategy(emptySpaces, quantumPieces);
            case 'random':
            default:
                return this.aiRandomStrategy(emptySpaces, quantumPieces);
        }
    }
    
    aiAggressiveStrategy(emptySpaces, quantumPieces) {
        // First check if we can win by collapsing a quantum piece
        const winningCollapse = this.findWinningCollapseMove();
        if (winningCollapse !== null) {
            return { type: 'collapse', index: winningCollapse };
        }
        
        // Check if we can win by placing a piece
        const winningPlace = this.findWinningPlaceMove();
        if (winningPlace !== null && emptySpaces.includes(winningPlace)) {
            return { type: 'place', index: winningPlace };
        }
        
        // Block player from winning
        const blockingMove = this.findBlockingMove();
        if (blockingMove !== null) {
            const blockCollapse = this.findBlockingCollapseMove();
            if (blockCollapse !== null) {
                return { type: 'collapse', index: blockCollapse };
            }
            if (emptySpaces.includes(blockingMove)) {
                return { type: 'place', index: blockingMove };
            }
        }
        
        // Build winning opportunities by placing strategically
        const setupMove = this.findSetupMove(emptySpaces);
        if (setupMove !== null) {
            return { type: 'place', index: setupMove };
        }
        
        // Collapse quantum pieces if we have many
        if (quantumPieces.length > 3) {
            const bestCollapse = this.findBestCollapseMove(quantumPieces);
            return { type: 'collapse', index: bestCollapse };
        }
        
        // Place strategically (center, corners, then edges)
        const strategicMoves = [4, 0, 2, 6, 8, 1, 3, 5, 7];
        for (let move of strategicMoves) {
            if (emptySpaces.includes(move)) {
                return { type: 'place', index: move };
            }
        }
        
        // Fallback: collapse a quantum piece if available
        if (quantumPieces.length > 0) {
            return { type: 'collapse', index: quantumPieces[0] };
        }
        
        return { type: 'place', index: emptySpaces[0] || 4 };
    }
    
    aiDefensiveStrategy(emptySpaces, quantumPieces) {
        // First check if we can win
        const winningCollapse = this.findWinningCollapseMove();
        if (winningCollapse !== null) {
            return { type: 'collapse', index: winningCollapse };
        }
        
        const winningPlace = this.findWinningPlaceMove();
        if (winningPlace !== null && emptySpaces.includes(winningPlace)) {
            return { type: 'place', index: winningPlace };
        }
        
        // Prioritize blocking opponent's collapse wins
        const blockCollapse = this.findBlockingCollapseMove();
        if (blockCollapse !== null) {
            return { type: 'collapse', index: blockCollapse };
        }
        
        // Block opponent's placement wins
        const blockingMove = this.findBlockingMove();
        if (blockingMove !== null && emptySpaces.includes(blockingMove)) {
            return { type: 'place', index: blockingMove };
        }
        
        // Collapse pieces to secure positions
        if (quantumPieces.length > 3) {
            const bestCollapse = this.findBestCollapseMove(quantumPieces);
            return { type: 'collapse', index: bestCollapse };
        }
        
        // Place defensively (center first, then strategic spots)
        const defensiveMoves = [4, 0, 2, 6, 8];
        for (let move of defensiveMoves) {
            if (emptySpaces.includes(move)) {
                return { type: 'place', index: move };
            }
        }
        
        if (emptySpaces.length > 0) {
            return { type: 'place', index: emptySpaces[0] };
        }
        
        return { type: 'collapse', index: quantumPieces[0] || 4 };
    }
    
    aiBalancedStrategy(emptySpaces, quantumPieces) {
        // Check for immediate winning opportunities
        const winningCollapse = this.findWinningCollapseMove();
        if (winningCollapse !== null) {
            return { type: 'collapse', index: winningCollapse };
        }
        
        const winningPlace = this.findWinningPlaceMove();
        if (winningPlace !== null && emptySpaces.includes(winningPlace)) {
            return { type: 'place', index: winningPlace };
        }
        
        // Block opponent's winning moves
        const blockCollapse = this.findBlockingCollapseMove();
        if (blockCollapse !== null && Math.random() < 0.8) {
            return { type: 'collapse', index: blockCollapse };
        }
        
        const blockingMove = this.findBlockingMove();
        if (blockingMove !== null && emptySpaces.includes(blockingMove) && Math.random() < 0.8) {
            return { type: 'place', index: blockingMove };
        }
        
        // Balance between placing and collapsing
        if (quantumPieces.length > 2 && Math.random() < 0.4) {
            const bestCollapse = this.findBestCollapseMove(quantumPieces);
            return { type: 'collapse', index: bestCollapse };
        }
        
        // Strategic placement
        if (emptySpaces.length > 0) {
            const setupMove = this.findSetupMove(emptySpaces);
            if (setupMove !== null) {
                return { type: 'place', index: setupMove };
            }
            
            const strategicMoves = [4, 0, 2, 6, 8];
            for (let move of strategicMoves) {
                if (emptySpaces.includes(move)) {
                    return { type: 'place', index: move };
                }
            }
            return { type: 'place', index: emptySpaces[0] };
        }
        
        return { type: 'collapse', index: quantumPieces[0] || 4 };
    }
    
    aiRandomStrategy(emptySpaces, quantumPieces) {
        // Completely random but valid moves
        const canPlace = emptySpaces.length > 0 && this.selectedCard;
        const canCollapse = quantumPieces.length > 0;
        
        if (canPlace && canCollapse) {
            // 50/50 chance
            if (Math.random() < 0.5) {
                return { type: 'place', index: emptySpaces[Math.floor(Math.random() * emptySpaces.length)] };
            } else {
                return { type: 'collapse', index: quantumPieces[Math.floor(Math.random() * quantumPieces.length)] };
            }
        } else if (canPlace) {
            return { type: 'place', index: emptySpaces[Math.floor(Math.random() * emptySpaces.length)] };
        } else if (canCollapse) {
            return { type: 'collapse', index: quantumPieces[Math.floor(Math.random() * quantumPieces.length)] };
        }
        
        return { type: 'place', index: 4 }; // Fallback to center
    }
    
    // Find if AI can win by placing a new piece
    findWinningPlaceMove() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];
        
        for (let pattern of winPatterns) {
            const values = pattern.map(i => this.board[i]);
            const emptyIndex = values.findIndex(v => v === null);
            
            if (emptyIndex !== -1) {
                const collapsedOCount = values.filter(v => v && v.type === 'collapsed' && v.value === 'O').length;
                if (collapsedOCount === 2) {
                    return pattern[emptyIndex];
                }
            }
        }
        
        return null;
    }
    
    // Find if AI can win by collapsing a quantum piece
    findWinningCollapseMove() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        
        for (let pattern of winPatterns) {
            const values = pattern.map((i) => ({ index: i, cell: this.board[i] }));
            const collapsedOCount = values.filter(v => v.cell && v.cell.type === 'collapsed' && v.cell.value === 'O').length;
            
            // If we have 2 collapsed Os, check if we have a quantum piece that could become O
            if (collapsedOCount === 2) {
                for (let v of values) {
                    if (v.cell && v.cell.type === 'quantum' && v.cell.player === 2) {
                        // This quantum piece could become O and win
                        return v.index;
                    }
                }
            }
        }
        
        return null;
    }
    
    // Find if need to block player by placing
    findBlockingMove() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        
        for (let pattern of winPatterns) {
            const values = pattern.map(i => this.board[i]);
            const emptyIndex = values.findIndex(v => v === null);
            
            if (emptyIndex !== -1) {
                const collapsedXCount = values.filter(v => v && v.type === 'collapsed' && v.value === 'X').length;
                if (collapsedXCount === 2) {
                    return pattern[emptyIndex];
                }
            }
        }
        
        return null;
    }
    
    // Find if need to collapse our quantum piece to block player
    findBlockingCollapseMove() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        
        for (let pattern of winPatterns) {
            const values = pattern.map((i) => ({ index: i, cell: this.board[i] }));
            const collapsedXCount = values.filter(v => v.cell && v.cell.type === 'collapsed' && v.cell.value === 'X').length;
            
            // If player has 2 collapsed Xs, we need to block with our quantum piece
            if (collapsedXCount === 2) {
                for (let v of values) {
                    if (v.cell && v.cell.type === 'quantum' && v.cell.player === 2) {
                        // Collapse our quantum piece to block (it might become O)
                        return v.index;
                    }
                }
            }
        }
        
        return null;
    }
    
    // Find strategic setup moves (positions that create multiple winning opportunities)
    findSetupMove(emptySpaces) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        
        // Find moves that participate in multiple winning patterns with our pieces
        const moveScores = {};
        
        for (let pattern of winPatterns) {
            const values = pattern.map(i => this.board[i]);
            const hasOpponent = values.some(v => v && v.type === 'collapsed' && v.value === 'X');
            
            // Only consider patterns without opponent's collapsed pieces
            if (!hasOpponent) {
                const ourPieces = values.filter(v => v && (v.player === 2 || (v.type === 'collapsed' && v.value === 'O'))).length;
                
                // If we have pieces in this pattern, score empty spots
                if (ourPieces > 0) {
                    pattern.forEach(i => {
                        if (!this.board[i] && emptySpaces.includes(i)) {
                            moveScores[i] = (moveScores[i] || 0) + ourPieces;
                        }
                    });
                }
            }
        }
        
        // Return the highest scoring move
        let bestMove = null;
        let bestScore = 0;
        for (let move in moveScores) {
            if (moveScores[move] > bestScore) {
                bestScore = moveScores[move];
                bestMove = parseInt(move);
            }
        }
        
        return bestMove;
    }
    
    // Find the best quantum piece to collapse (prefer pieces in winning patterns)
    findBestCollapseMove(quantumPieces) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        
        // Score each quantum piece based on its strategic value
        const pieceScores = {};
        
        quantumPieces.forEach(index => {
            let score = 0;
            
            // Check how many winning patterns this piece is part of
            winPatterns.forEach(pattern => {
                if (pattern.includes(index)) {
                    const values = pattern.map(i => this.board[i]);
                    const ourCollapsed = values.filter(v => v && v.type === 'collapsed' && v.value === 'O').length;
                    const oppCollapsed = values.filter(v => v && v.type === 'collapsed' && v.value === 'X').length;
                    
                    // Higher score if we have collapsed pieces in this pattern
                    if (ourCollapsed > 0 && oppCollapsed === 0) {
                        score += ourCollapsed * 2;
                    }
                    // Lower score if opponent has pieces
                    if (oppCollapsed > 0) {
                        score -= 1;
                    }
                }
            });
            
            // Prefer center and corners
            if (index === 4) score += 1; // Center
            if ([0, 2, 6, 8].includes(index)) score += 0.5; // Corners
            
            pieceScores[index] = score;
        });
        
        // Return the highest scoring piece
        let bestPiece = quantumPieces[0];
        let bestScore = pieceScores[bestPiece] || 0;
        
        for (let piece of quantumPieces) {
            if (pieceScores[piece] > bestScore) {
                bestScore = pieceScores[piece];
                bestPiece = piece;
            }
        }
        
        return bestPiece;
    }

    showModeSelect() {
        document.getElementById('intro-modal').style.display = 'none';
        document.getElementById('tutorial-modal').style.display = 'none';
        document.getElementById('mode-select-modal').style.display = 'block';
    }

    showTutorial() {
        document.getElementById('intro-modal').style.display = 'none';
        document.getElementById('tutorial-modal').style.display = 'block';
        this.currentTutorialStep = 1;
        this.updateTutorialStep();
    }

    closeTutorial() {
        document.getElementById('tutorial-modal').style.display = 'none';
        document.getElementById('intro-modal').style.display = 'block';
        this.currentTutorialStep = 1;
        this.updateTutorialStep();
    }

    changeTutorialStep(direction) {
        const newStep = this.currentTutorialStep + direction;
        if (newStep >= 1 && newStep <= 4) {
            this.currentTutorialStep = newStep;
            this.updateTutorialStep();
        } else if (newStep > 4) {
            // Done button clicked - go to mode selection
            this.showModeSelect();
        }
    }

    goToTutorialStep(step) {
        this.currentTutorialStep = step;
        this.updateTutorialStep();
    }

    updateTutorialStep() {
        // Update step visibility
        document.querySelectorAll('.tutorial-step').forEach(stepEl => {
            const stepNum = parseInt(stepEl.dataset.step);
            if (stepNum === this.currentTutorialStep) {
                stepEl.classList.add('active');
            } else {
                stepEl.classList.remove('active');
            }
        });

        // Update dots
        document.querySelectorAll('.dot').forEach(dot => {
            const dotStep = parseInt(dot.dataset.step);
            if (dotStep === this.currentTutorialStep) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });

        // Update button states
        const prevBtn = document.getElementById('prev-step');
        const nextBtn = document.getElementById('next-step');
        
        prevBtn.disabled = this.currentTutorialStep === 1;
        // Don't disable next button on step 4 - let it act as "Done"
        nextBtn.disabled = false;

        // Update button text
        if (this.currentTutorialStep === 4) {
            nextBtn.textContent = 'Done ✓';
        } else {
            nextBtn.textContent = 'Next →';
        }
    }

    startGame(mode) {
        this.gameMode = mode;
        
        // If playing against computer, randomly choose AI strategy
        if (mode === 'pvc') {
            const strategies = ['aggressive', 'defensive', 'balanced', 'random'];
            this.aiStrategy = strategies[Math.floor(Math.random() * strategies.length)];
            console.log(`AI Strategy: ${this.aiStrategy}`);
        }
        
        document.getElementById('mode-select-modal').style.display = 'none';
        
        // Update player display if computer
        if (mode === 'pvc') {
            document.getElementById('current-player').textContent = 'Player 1';
        }
    }

    resetGame() {
        // Reset game state
        this.board = Array(9).fill(null);
        this.currentPlayer = 1;
        this.selectedCard = null;
        this.gameOver = false;
        this.quantumCount = 0;
        this.collapsedCount = 0;
        this.winningPattern = null;
        this.winner = null;
        this.aiThinking = false;
        this.isCollapsing = false;

        // Clear board display
        document.querySelectorAll('.cell').forEach(cell => {
            cell.innerHTML = '';
            cell.classList.remove('occupied', 'collapsed');
        });

        // Remove winning line if it exists
        const existingLine = document.querySelector('.winning-line');
        if (existingLine) {
            existingLine.remove();
        }

        // Reset stats and deck
        this.updateStats();
        const playerText = this.gameMode === 'pvc' ? 'Player 1' : 'Player 1';
        document.getElementById('current-player').textContent = playerText;
        this.generateProbabilityDeck();
        this.renderProbabilityDeck();

        // Hide modals and return to mode select
        document.getElementById('win-modal').style.display = 'none';
        document.getElementById('help-modal').style.display = 'none';
        
        // Re-select AI strategy if playing against computer
        if (this.gameMode === 'pvc') {
            const strategies = ['aggressive', 'defensive', 'balanced', 'random'];
            this.aiStrategy = strategies[Math.floor(Math.random() * strategies.length)];
            console.log(`New AI Strategy: ${this.aiStrategy}`);
        }
    }

    showIntroModal() {
        document.getElementById('intro-modal').style.display = 'block';
    }

    hideIntroModal() {
        document.getElementById('intro-modal').style.display = 'none';
    }

    showHelpModal() {
        document.getElementById('help-modal').style.display = 'block';
    }
}


// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new QuantumTicTacToe();
    
    // Add some fun quantum facts
    const quantumFacts = [
        "In quantum mechanics, particles can be in multiple states simultaneously until observed!",
        "Wave function collapse is what happens when we measure a quantum system!",
        "Superposition is the quantum principle that allows our pieces to be both X and O!",
        "Real quantum computers use these principles to solve complex problems!",
        "Schrödinger's cat is a famous thought experiment about quantum superposition!"
    ];
    
    // Show random quantum facts periodically
    let factIndex = 0;
    setInterval(() => {
        if (!game.gameOver && Math.random() < 0.1) { // 10% chance every interval
            console.log(`🌟 Quantum Fact: ${quantumFacts[factIndex]}`);
            factIndex = (factIndex + 1) % quantumFacts.length;
        }
    }, 10000); // Every 10 seconds
});
