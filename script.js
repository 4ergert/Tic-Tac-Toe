// Sicherstellen, dass init nach DOM-Load ausgeführt wird
window.addEventListener('DOMContentLoaded', () => {
  if (typeof init === 'function') init();
});


// Fraktal-Parameter und Hilfsfunktionen GLOBAL deklarieren
let firstClickDone = false;
let currentZoom = 1.5;
let fractalParams = {
  maxIter: 64,
  zoom: 1.5,
  offsetX: -0.7,
  offsetY: 0,
  colorOffset: 0
};
let morphing = false;

function drawFractal(params) {
  let canvas = document.getElementById('fractal-bg');
  if (!canvas) {
    console.error('Canvas not found!');
    return;
  }
  console.log('drawFractal called', params);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const maxIter = params.maxIter;
  const zoom = params.zoom;
  const offsetX = params.offsetX;
  const offsetY = params.offsetY;
  const colorOffset = params.colorOffset;
  const image = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let zx = (x - w / 2) / (0.5 * zoom * w) + offsetX;
      let zy = (y - h / 2) / (0.5 * zoom * h) + offsetY;
      let i = 0;
      let cx = zx;
      let cy = zy;
      while (zx * zx + zy * zy < 4 && i < maxIter) {
        let tmp = zx * zx - zy * zy + cx;
        zy = 2 * zx * zy + cy;
        zx = tmp;
        i++;
      }
      let pixel = (y * w + x) * 4;
      let hue = (i * 360 / maxIter + colorOffset) % 360;
      let sat = 100;
      let light = i < maxIter ? 50 : 0;
      let rgb = hslToRgb(hue / 360, sat / 100, light / 100);
      image.data[pixel] = rgb[0];
      image.data[pixel + 1] = rgb[1];
      image.data[pixel + 2] = rgb[2];
      image.data[pixel + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
}
function randomFractalParams(zoomIn = false) {
  console.log('randomFractalParams called', zoomIn, fractalParams);

  if (zoomIn && fractalParams) {
    const canvas = document.getElementById('fractal-bg');
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const image = ctx.getImageData(0, 0, w, h);
    let bestLilaScore = 0;
    let bestX = w / 2, bestY = h / 2;
    let maxLight = 0;
    let brightX = w / 2, brightY = h / 2;
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const i = (y * w + x) * 4;
        const rC = image.data[i], gC = image.data[i+1], bC = image.data[i+2];
        // RGB zu HSL
        const mx = Math.max(rC, gC, bC), mn = Math.min(rC, gC, bC);
        let hsl_h = 0, hsl_s = 0, hsl_l = (mx + mn) / 2 / 255;
        if (mx !== mn) {
          const d = (mx - mn) / 255;
          hsl_s = hsl_l > 0.5 ? d / (2 - mx/255 - mn/255) : d / (mx/255 + mn/255);
          switch(mx){
            case rC: hsl_h = (gC-bC)/(mx-mn); break;
            case gC: hsl_h = 2 + (bC-rC)/(mx-mn); break;
            case bC: hsl_h = 4 + (rC-gC)/(mx-mn); break;
          }
          hsl_h = ((hsl_h*60)+360)%360;
        }
        // Lila: Hue ca. 240-320°, Sättigung und Helligkeit ab 0.12
        let lilaScore = 0;
        if (hsl_h >= 240 && hsl_h <= 320 && hsl_s > 0.12 && hsl_l > 0.12) {
          lilaScore = hsl_s * hsl_l;
          if (lilaScore > bestLilaScore) {
            bestLilaScore = lilaScore;
            bestX = x;
            bestY = y;
          }
        }
        // Helles Pixel merken (für Fallback)
        const light = (rC + gC + bC) / (3 * 255);
        if (light > maxLight) {
          maxLight = light;
          brightX = x;
          brightY = y;
        }
      }
    }
    // Zentriere auf bestes lila Pixel, sonst auf hellstes Pixel, aber nie auf ein schwarzes Pixel
    let px, py, light;
    const minLightForCenter = 0.08; // Schwelle, ab der ein Pixel als "nicht schwarz" gilt
    function getLight(x, y) {
      const i = (Math.floor(y) * w + Math.floor(x)) * 4;
      return (image.data[i] + image.data[i+1] + image.data[i+2]) / (3 * 255);
    }
    if (bestLilaScore > 0.15) {
      px = bestX;
      py = bestY;
    } else {
      px = brightX;
      py = brightY;
    }
    light = getLight(px, py);
    // Falls Zielpixel zu dunkel, suche in der Umgebung das hellste Pixel
    if (light < minLightForCenter) {
      let found = false;
      let bestLocalLight = 0;
      let bestLocalX = px, bestLocalY = py;
      const radius = 20;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          let nx = px + dx;
          let ny = py + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            let l = getLight(nx, ny);
            if (l > bestLocalLight && l > minLightForCenter) {
              bestLocalLight = l;
              bestLocalX = nx;
              bestLocalY = ny;
              found = true;
            }
          }
        }
      }
      if (found) {
        px = bestLocalX;
        py = bestLocalY;
      }
    }
    // Berechne Fraktal-Koordinaten dieses Pixels (vor dem Zoom)
    const oldZoom = fractalParams.zoom;
    const oldOffsetX = fractalParams.offsetX;
    const oldOffsetY = fractalParams.offsetY;
    const fractalX = (px - w / 2) / (0.5 * oldZoom * w) + oldOffsetX;
    const fractalY = (py - h / 2) / (0.5 * oldZoom * h) + oldOffsetY;
    // Zoom erhöhen
    currentZoom = oldZoom * (1.7 + Math.random() * 0.5);
    // Berechne neues Offset so, dass fractalX/fractalY nach dem Zoom im Zentrum liegt
    const newOffsetX = fractalX - (0 - w / 2) / (0.5 * currentZoom * w);
    const newOffsetY = fractalY - (0 - h / 2) / (0.5 * currentZoom * h);
    return {
      maxIter: 32 + Math.floor(Math.random() * 32),
      zoom: currentZoom,
      offsetX: newOffsetX,
      offsetY: newOffsetY,
      colorOffset: Math.random() * 360
    };
  }
}

function morphFractal(toParams, duration = 1200) {
    console.log('morphFractal called', toParams, duration);
  if (morphing) return;
  morphing = true;
  const fromParams = fractalParams || randomFractalParams();
  const start = performance.now();
  function lerp(a, b, t) { return a + (b - a) * t; }
  function animate(now) {
    let t = Math.min(1, (now - start) / duration);
    // ECHTER Fraktal-Zoom: Interpoliere Zoom und Offset, rendere Fraktal in jedem Frame
    let current = {
      maxIter: Math.round(lerp(fromParams.maxIter, toParams.maxIter, t)),
      zoom: lerp(fromParams.zoom, toParams.zoom, t),
      offsetX: lerp(fromParams.offsetX, toParams.offsetX, t),
      offsetY: lerp(fromParams.offsetY, toParams.offsetY, t),
      colorOffset: lerp(fromParams.colorOffset, toParams.colorOffset, t)
    };
    drawFractal(current);
    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      fractalParams = toParams;
      morphing = false;
    }
  }
  requestAnimationFrame(animate);
}

function hslToRgb(h, s, l) {
  let r, g, b;
  if (s == 0) {
    r = g = b = l; // grau
  } else {
    const hue2rgb = function(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

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
    console.log('init called');
  render();
  document.getElementById('newGameBtn').addEventListener('click', resetGame);
  // Fraktal-Hintergrund initial mit festen Startwerten zeichnen
  drawFractal(fractalParams);
  // Simuliere 11 Kachel-Klicks (wie bei User-Interaktion)
  let morphCount = 0;
  function autoMorph() {
    if (morphCount < 5) {
      const newParams = randomFractalParams(true);
      morphFractal(newParams, 1200);
      morphCount++;
      // Warte bis morphing fertig ist, dann nächster Schritt
      const waitMorph = () => {
        if (!morphing) {
          setTimeout(autoMorph, 50);
        } else {
          setTimeout(waitMorph, 30);
        }
      };
      waitMorph();
    }
  }
  setTimeout(autoMorph, 100);
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
        if (!firstClickDone) {
          firstClickDone = true;
        } else {
          // morphFractal nutzt immer den aktuellen Zustand als Ausgangspunkt
          const newParams = randomFractalParams(true);
          morphFractal(newParams, 1200);
        }
      });



function drawFractal(params) {
  const canvas = document.getElementById('fractal-bg');
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const maxIter = params.maxIter;
  const zoom = params.zoom;
  const offsetX = params.offsetX;
  const offsetY = params.offsetY;
  const colorOffset = params.colorOffset;
  const image = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let zx = (x - w / 2) / (0.5 * zoom * w) + offsetX;
      let zy = (y - h / 2) / (0.5 * zoom * h) + offsetY;
      let i = 0;
      let cx = zx;
      let cy = zy;
      while (zx * zx + zy * zy < 4 && i < maxIter) {
        let tmp = zx * zx - zy * zy + cx;
        zy = 2 * zx * zy + cy;
        zx = tmp;
        i++;
      }
      let pixel = (y * w + x) * 4;
      let hue = (i * 360 / maxIter + colorOffset) % 360;
      let sat = 100;
      let light = i < maxIter ? 50 : 0;
      let rgb = hslToRgb(hue / 360, sat / 100, light / 100);
      image.data[pixel] = rgb[0];
      image.data[pixel + 1] = rgb[1];
      image.data[pixel + 2] = rgb[2];
      image.data[pixel + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
}

      function morphFractal(toParams, duration = 1200) {
        if (morphing) return;
        morphing = true;
        const fromParams = fractalParams || randomFractalParams();
        const start = performance.now();
        function lerp(a, b, t) { return a + (b - a) * t; }
        function animate(now) {
          let t = Math.min(1, (now - start) / duration);
          let current = {
            maxIter: Math.round(lerp(fromParams.maxIter, toParams.maxIter, t)),
            zoom: lerp(fromParams.zoom, toParams.zoom, t),
            offsetX: lerp(fromParams.offsetX, toParams.offsetX, t),
            offsetY: lerp(fromParams.offsetY, toParams.offsetY, t),
            colorOffset: lerp(fromParams.colorOffset, toParams.colorOffset, t)
          };
          drawFractal(current);
          if (t < 1) {
            requestAnimationFrame(animate);
          } else {
            fractalParams = toParams;
            morphing = false;
          }
        }
        requestAnimationFrame(animate);
      }

      // Hilfsfunktion: HSL zu RGB
      function hslToRgb(h, s, l) {
        let r, g, b;
        if (s == 0) {
          r = g = b = l; // grau
        } else {
          const hue2rgb = function(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
          };
          let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          let p = 2 * l - q;
          r = hue2rgb(p, q, h + 1/3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1/3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
      }

      // Fraktal bei Fenstergröße neu zeichnen
      window.addEventListener('resize', () => {
        if (fractalParams) drawFractal(fractalParams);
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