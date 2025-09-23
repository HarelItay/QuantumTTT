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
            cell.addEventListener('touchstart', (e) => {
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
            e.preventDefault(); // Prevent mouse events from firing
            if (e.target.classList.contains('probability-card')) {
                this.selectProbabilityCard(e.target);
            }
        });
        
        // Mouse events for desktop
        probabilityDeck.addEventListener('click', (e) => {
            if (e.target.classList.contains('probability-card')) {
                this.selectProbabilityCard(e.target);
            }
        });

        // Control buttons
        document.getElementById('reset-game').addEventListener('click', () => this.resetGame());
        document.getElementById('refresh-deck').addEventListener('click', () => this.refreshProbabilityDeck());
        document.getElementById('show-help').addEventListener('click', () => this.showHelpModal());
        document.getElementById('start-game').addEventListener('click', () => this.hideIntroModal());
        document.getElementById('play-again').addEventListener('click', () => this.resetGame());

        // Modal close handlers
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    generateProbabilityDeck() {
        this.probabilityDeck = [];
        const probabilityPairs = [
            [90, 10], [80, 20], [70, 30], [60, 40], [55, 45],
            [50, 50], [45, 55], [40, 60], [30, 70], [20, 80], [10, 90]
        ];

        // Generate exactly 3 random cards
        const shuffledPairs = [...probabilityPairs].sort(() => Math.random() - 0.5);
        for (let i = 0; i < 3; i++) {
            this.probabilityDeck.push({
                xProbability: shuffledPairs[i][0],
                oProbability: shuffledPairs[i][1],
                id: `card-${i}-${Date.now()}`
            });
        }
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
        // Remove previous selection
        document.querySelectorAll('.probability-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Select new card
        cardElement.classList.add('selected');
        const cardId = cardElement.dataset.cardId;
        this.selectedCard = this.probabilityDeck.find(card => card.id === cardId);
    }

    handleCellClick(index) {
        if (this.gameOver) return;

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
        
        // Generate new deck of 3 cards automatically
        this.selectedCard = null;
        this.generateProbabilityDeck();
        this.renderProbabilityDeck();
        
        // Update stats
        this.quantumCount++;
        this.updateStats();
        
        // Switch player
        this.switchPlayer();
    }

    collapseQuantumPiece(index) {
        const quantumPiece = this.board[index];
        if (!quantumPiece || quantumPiece.type !== 'quantum') return;

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
        
        // Check for win condition
        if (this.checkWinCondition()) {
            this.handleGameWin();
            return;
        }
        
        // Switch player
        this.switchPlayer();
    }

    renderQuantumPiece(index, quantumPiece) {
        const cellElement = document.querySelectorAll('.cell')[index];
        cellElement.innerHTML = `
            <div class="quantum-piece" 
                 data-x-prob="${quantumPiece.xProbability}%" 
                 data-o-prob="${quantumPiece.oProbability}%">
                <div class="quantum-symbols">
                    <span class="quantum-x">✗</span>
                    <span class="quantum-o">◯</span>
                </div>
            </div>
        `;
        cellElement.classList.add('occupied');
    }

    renderCollapsedPiece(index, collapsedPiece) {
        const cellElement = document.querySelectorAll('.cell')[index];
        const symbol = collapsedPiece.value === 'X' ? '✗' : '◯';
        const className = collapsedPiece.value === 'X' ? 'collapsed-x' : 'collapsed-o';
        
        cellElement.innerHTML = `<span class="${className}">${symbol}</span>`;
        cellElement.classList.add('occupied', 'collapsed');
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
            
            winTitle.textContent = `🎉 ${this.winner} Wins! 🎉`;
            winMessage.textContent = `Congratulations! You achieved quantum victory by collapsing three ${this.winner}'s in a row! The wave function has been observed and reality has been determined!`;
            
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

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        document.getElementById('current-player').textContent = `Player ${this.currentPlayer}`;
    }

    updateStats() {
        document.getElementById('quantum-count').textContent = this.quantumCount;
        document.getElementById('collapsed-count').textContent = this.collapsedCount;
    }

    refreshProbabilityDeck() {
        this.generateProbabilityDeck();
        this.renderProbabilityDeck();
        this.selectedCard = null;
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
        document.getElementById('current-player').textContent = 'Player 1';
        this.generateProbabilityDeck();
        this.renderProbabilityDeck();

        // Hide modals
        document.getElementById('win-modal').style.display = 'none';
        document.getElementById('help-modal').style.display = 'none';
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
