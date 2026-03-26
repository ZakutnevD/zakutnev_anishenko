class MahjongGame {
    constructor() {
        this.boardSize = 4;
        this.board = [];
        this.selectedTile = null;
        this.pairsFound = 0;
        this.tilesLeft = 0;
        this.tileSymbols = ['🍎', '🍊', '🍒', '🍓', '🍉', '🍇', '🥝', '🍑', '🥭', '🍋', '🍈', '🍐', '🍍', '🥥', '🥑', '🍅'];
        
        this.init();
        this.bindEvents();
    }
    
    init() {
        this.createBoard();
        this.render();
    }
    
    createBoard() {
        const totalTiles = this.boardSize * this.boardSize;
        const pairCount = totalTiles / 2;
        
        let symbols = [];
        for (let i = 0; i < pairCount; i++) {
            const symbol = this.tileSymbols[i % this.tileSymbols.length];
            symbols.push(symbol, symbol);
        }
        
        symbols = this.shuffle(symbols);
        
        this.board = [];
        for (let i = 0; i < this.boardSize; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.boardSize; j++) {
                this.board[i][j] = {
                    symbol: symbols[i * this.boardSize + j],
                    removed: false
                };
            }
        }
        
        this.selectedTile = null;
        this.pairsFound = 0;
        this.updateStats();
    }
    
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    shuffleBoard() {
        const remainingTiles = [];
        const positions = [];
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (!this.board[i][j].removed) {
                    remainingTiles.push(this.board[i][j].symbol);
                    positions.push({row: i, col: j});
                }
            }
        }
        
        const shuffled = this.shuffle([...remainingTiles]);
        
        for (let k = 0; k < positions.length; k++) {
            const pos = positions[k];
            this.board[pos.row][pos.col].symbol = shuffled[k];
        }
        
        this.selectedTile = null;
        this.render();
        this.showMessage('Поле перемешано!', 'success');
    }
    
    // Проверяем, свободна ли фишка (крайняя)
    isEdgeFree(row, col) {
        if (this.board[row][col].removed) return false;
        
        // Проверяем слева
        let hasLeft = false;
        for (let i = col - 1; i >= 0; i--) {
            if (!this.board[row][i].removed) {
                hasLeft = true;
                break;
            }
        }
        
        // Проверяем справа
        let hasRight = false;
        for (let i = col + 1; i < this.boardSize; i++) {
            if (!this.board[row][i].removed) {
                hasRight = true;
                break;
            }
        }
        
        // Проверяем сверху
        let hasTop = false;
        for (let i = row - 1; i >= 0; i--) {
            if (!this.board[i][col].removed) {
                hasTop = true;
                break;
            }
        }
        
        // Проверяем снизу
        let hasBottom = false;
        for (let i = row + 1; i < this.boardSize; i++) {
            if (!this.board[i][col].removed) {
                hasBottom = true;
                break;
            }
        }
        
        // Фишка свободна, если нет соседей слева И справа ИЛИ нет соседей сверху И снизу
        const freeHorizontally = !hasLeft && !hasRight;
        const freeVertically = !hasTop && !hasBottom;
        
        return freeHorizontally || freeVertically;
    }
    
    // Проверяем, можно ли выбрать фишку (она либо свободна, либо у неё есть пара)
    isSelectable(row, col) {
        if (this.board[row][col].removed) return false;
        
        // Если фишка свободна по краям - можно выбрать
        if (this.isEdgeFree(row, col)) return true;
        
        // Если не свободна, проверяем, есть ли у неё пара, которую можно соединить
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (i === row && j === col) continue;
                if (this.board[i][j].removed) continue;
                
                if (this.board[row][col].symbol === this.board[i][j].symbol) {
                    if (this.canConnect(row, col, i, j)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    canConnect(row1, col1, row2, col2) {
        if (row1 === row2 && col1 === col2) return false;
        if (this.board[row1][col1].symbol !== this.board[row2][col2].symbol) return false;
        
        if (this.checkDirect(row1, col1, row2, col2)) return true;
        if (this.checkOneCorner(row1, col1, row2, col2)) return true;
        if (this.checkTwoCorners(row1, col1, row2, col2)) return true;
        
        return false;
    }
    
    checkDirect(row1, col1, row2, col2) {
        if (row1 === row2) {
            let minCol = Math.min(col1, col2);
            let maxCol = Math.max(col1, col2);
            for (let j = minCol + 1; j < maxCol; j++) {
                if (!this.board[row1][j].removed) return false;
            }
            return true;
        }
        
        if (col1 === col2) {
            let minRow = Math.min(row1, row2);
            let maxRow = Math.max(row1, row2);
            for (let i = minRow + 1; i < maxRow; i++) {
                if (!this.board[i][col1].removed) return false;
            }
            return true;
        }
        
        return false;
    }
    
    checkOneCorner(row1, col1, row2, col2) {
        // Проверяем угол в точке (row1, col2)
        if (this.board[row1][col2].removed && 
            this.checkDirect(row1, col1, row1, col2) && 
            this.checkDirect(row2, col2, row1, col2)) {
            return true;
        }
        
        // Проверяем угол в точке (row2, col1)
        if (this.board[row2][col1].removed && 
            this.checkDirect(row1, col1, row2, col1) && 
            this.checkDirect(row2, col2, row2, col1)) {
            return true;
        }
        
        return false;
    }
    
    checkTwoCorners(row1, col1, row2, col2) {
        // Проверяем по всем строкам
        for (let i = 0; i < this.boardSize; i++) {
            if (i !== row1 && i !== row2) {
                if (this.board[i][col1].removed && this.board[i][col2].removed &&
                    this.checkDirect(row1, col1, i, col1) &&
                    this.checkDirect(i, col1, i, col2) &&
                    this.checkDirect(row2, col2, i, col2)) {
                    return true;
                }
            }
        }
        
        // Проверяем по всем столбцам
        for (let j = 0; j < this.boardSize; j++) {
            if (j !== col1 && j !== col2) {
                if (this.board[row1][j].removed && this.board[row2][j].removed &&
                    this.checkDirect(row1, col1, row1, j) &&
                    this.checkDirect(row1, j, row2, j) &&
                    this.checkDirect(row2, col2, row2, j)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    removePair(row1, col1, row2, col2) {
        this.board[row1][col1].removed = true;
        this.board[row2][col2].removed = true;
        this.pairsFound++;
        this.updateStats();
        this.selectedTile = null;
        this.render();
        
        if (this.checkWin()) {
            this.showMessage('🎉 Поздравляю! Вы выиграли! 🎉', 'success');
        } else if (this.isGameStuck()) {
            this.showMessage('⚠️ Нет доступных ходов! Нажмите "Перемешать" ⚠️', 'error');
        }
    }
    
    checkWin() {
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (!this.board[i][j].removed) return false;
            }
        }
        return true;
    }
    
    isGameStuck() {
        const availablePairs = this.findAvailablePairs();
        return availablePairs.length === 0;
    }
    
    findAvailablePairs() {
        const pairs = [];
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j].removed) continue;
                
                for (let k = i; k < this.boardSize; k++) {
                    for (let l = (k === i ? j + 1 : 0); l < this.boardSize; l++) {
                        if (this.board[k][l].removed) continue;
                        
                        if (this.canConnect(i, j, k, l)) {
                            pairs.push([{row: i, col: j}, {row: k, col: l}]);
                        }
                    }
                }
            }
        }
        return pairs;
    }
    
    getHint() {
        const pairs = this.findAvailablePairs();
        if (pairs.length > 0) {
            const [tile1, tile2] = pairs[0];
            this.showMessage(`Подсказка: соедините фишки с символами ${this.board[tile1.row][tile1.col].symbol}`, 'success');
            
            const elements = document.querySelectorAll('.tile');
            const idx1 = tile1.row * this.boardSize + tile1.col;
            const idx2 = tile2.row * this.boardSize + tile2.col;
            
            if (elements[idx1]) elements[idx1].classList.add('hint');
            if (elements[idx2]) elements[idx2].classList.add('hint');
            
            setTimeout(() => {
                if (elements[idx1]) elements[idx1].classList.remove('hint');
                if (elements[idx2]) elements[idx2].classList.remove('hint');
            }, 2000);
        } else {
            this.showMessage('Нет доступных ходов! Нажмите "Перемешать"', 'error');
        }
    }
    
    updateStats() {
        let count = 0;
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (!this.board[i][j].removed) count++;
            }
        }
        this.tilesLeft = count;
        document.getElementById('tilesLeft').textContent = this.tilesLeft / 2;
        document.getElementById('pairsFound').textContent = this.pairsFound;
    }
    
    showMessage(msg, type) {
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = msg;
        messageDiv.className = `message ${type}`;
        setTimeout(() => {
            messageDiv.className = 'message';
            messageDiv.textContent = '';
        }, 3000);
    }
    
    handleTileClick(row, col) {
        if (this.board[row][col].removed) return;
        
        if (this.selectedTile === null) {
            // Проверяем, можно ли выбрать эту фишку
            if (this.isSelectable(row, col)) {
                this.selectedTile = {row, col};
                this.render();
            } else {
                this.showMessage('Эта фишка заблокирована!', 'error');
            }
        } else {
            const selected = this.selectedTile;
            
            if (selected.row === row && selected.col === col) {
                this.selectedTile = null;
                this.render();
                return;
            }
            
            if (this.canConnect(selected.row, selected.col, row, col)) {
                this.removePair(selected.row, selected.col, row, col);
            } else {
                this.showMessage('Нельзя соединить эти фишки!', 'error');
                this.selectedTile = null;
                this.render();
            }
        }
    }
    
    render() {
        const boardDiv = document.getElementById('board');
        const tileSize = this.boardSize <= 6 ? 70 : 55;
        boardDiv.style.gridTemplateColumns = `repeat(${this.boardSize}, minmax(50px, ${tileSize}px))`;
        
        boardDiv.innerHTML = '';
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const tile = this.board[i][j];
                const tileDiv = document.createElement('div');
                tileDiv.className = 'tile';
                
                if (tile.removed) {
                    tileDiv.classList.add('removed');
                } else {
                    tileDiv.textContent = tile.symbol;
                }
                
                if (this.selectedTile && this.selectedTile.row === i && this.selectedTile.col === j) {
                    tileDiv.classList.add('selected');
                }
                
                tileDiv.addEventListener('click', () => this.handleTileClick(i, j));
                boardDiv.appendChild(tileDiv);
            }
        }
    }
    
    bindEvents() {
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const size = parseInt(e.target.dataset.size);
                if (!isNaN(size) && size !== this.boardSize) {
                    this.boardSize = size;
                    document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    this.createBoard();
                    this.render();
                }
            });
        });
        
        const shuffleBtn = document.getElementById('shuffleBtn');
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => {
                this.shuffleBoard();
            });
        }
        
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.createBoard();
                this.render();
                this.showMessage('Новая игра начата!', 'success');
            });
        }
        
        const hintBtn = document.getElementById('hintBtn');
        if (hintBtn) {
            hintBtn.addEventListener('click', () => {
                this.getHint();
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MahjongGame();
});
