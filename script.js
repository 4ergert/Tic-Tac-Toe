let gameBoard = [
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null
];

let currentPlayer = 'X';
let gameOver = false;
let winner = null;

function init() {
  render();
  document.getElementById('newGameBtn').addEventListener('click', resetGame);
}

// a function to render the game board in a 3x3 grid
function render() {
  let board = document.getElementById('board');
  board.innerHTML = '';
  let table = document.createElement('table');
  
  for (let row = 0; row < 3; row++) {
    let tr = document.createElement('tr');
    for (let col = 0; col < 3; col++) {
      let td = document.createElement('td');
      let index = row * 3 + col;
      if (gameBoard[index]) {
        td.textContent = gameBoard[index];
      }
      // Add click handler to each cell
      td.addEventListener('click', function() {
        handleCellClick(index);
      });
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  board.appendChild(table);
  
  // Update player indicators
  const playerXIndicator = document.getElementById('playerXIndicator');
  const playerOIndicator = document.getElementById('playerOIndicator');
  const statusMessage = document.getElementById('statusMessage');
  
  if (gameOver) {
    if (winner) {
      statusMessage.textContent = `${winner} has won!`;
      playerXIndicator.classList.remove('active');
      playerOIndicator.classList.remove('active');
    } else {
      statusMessage.textContent = "It's a Draw!";
      playerXIndicator.classList.remove('active');
      playerOIndicator.classList.remove('active');
    }
  } else {
    statusMessage.textContent = '';
    if (currentPlayer === 'X') {
      playerXIndicator.classList.add('active');
      playerOIndicator.classList.remove('active');
    } else {
      playerXIndicator.classList.remove('active');
      playerOIndicator.classList.add('active');
    }
  }
}

function handleCellClick(index) {
  // Only allow click if cell is empty and game is not over
  if (gameBoard[index] === null && !gameOver) {
    gameBoard[index] = currentPlayer;
    
    // Check for winner
    if (checkWinner()) {
      winner = currentPlayer;
      gameOver = true;
    } else if (checkDraw()) {
      gameOver = true;
    } else {
      // Switch player
  gameOver = false;
  winner = null;
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    }
    render();
  }
}

function checkWinner() {
  const winCombinations = [
    // Horizontal
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    // Vertical
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    // Diagonal
    [0, 4, 8],
    [2, 4, 6]
  ];
  
  for (let combination of winCombinations) {
    const [a, b, c] = combination;
    if (gameBoard[a] && gameBoard[a] === gameBoard[b] && gameBoard[a] === gameBoard[c]) {
      return true;
    }
  }
  return false;
}

function checkDraw() {
  return gameBoard.every(cell => cell !== null);
}

function resetGame() {
  gameBoard = [null, null, null, null, null, null, null, null, null];
  currentPlayer = 'X';
  gameOver = false;
  winner = null;
  document.getElementById('statusMessage').textContent = '';
  render();
}