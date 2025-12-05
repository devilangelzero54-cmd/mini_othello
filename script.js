// v0.4: 6×6 盤面 + 合法手チェック + ひっくり返し + パス + リザルト + 弱めAI

const BOARD_SIZE = 6;
const CELL_EMPTY = 0;
const CELL_BLACK = 1; // プレイヤー
const CELL_WHITE = 2; // AI

// 8方向
const DIRECTIONS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

let board = []; // board[y][x]
let currentPlayer = CELL_BLACK;
let gameEnded = false;
let isPlayerTurn = true; // 黒＝プレイヤーの番かどうか

// AI用のかんたん評価マップ（角が強い）
const POSITION_SCORE = [
  [4, -1, 2, 2, -1, 4],
  [-1, -2, 1, 1, -2, -1],
  [2, 1, 1, 1, 1, 2],
  [2, 1, 1, 1, 1, 2],
  [-1, -2, 1, 1, -2, -1],
  [4, -1, 2, 2, -1, 4],
];

// ===== ユーティリティ =====

function inBounds(x, y) {
  return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

function getOpponent(player) {
  return player === CELL_BLACK ? CELL_WHITE : CELL_BLACK;
}

function countStones() {
  let black = 0;
  let white = 0;
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[y][x] === CELL_BLACK) black++;
      else if (board[y][x] === CELL_WHITE) white++;
    }
  }
  return { black, white };
}

function setBubble(text) {
  const bubbleText = document.getElementById("bubble-text");
  bubbleText.textContent = text;
}

// ===== 盤面初期化 =====

function initBoard() {
  board = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(CELL_EMPTY)
  );

  const mid1 = BOARD_SIZE / 2 - 1; // 2
  const mid2 = BOARD_SIZE / 2;     // 3

  board[mid1][mid1] = CELL_WHITE;
  board[mid2][mid2] = CELL_WHITE;
  board[mid1][mid2] = CELL_BLACK;
  board[mid2][mid1] = CELL_BLACK;

  currentPlayer = CELL_BLACK;
  gameEnded = false;
  isPlayerTurn = true;
}

// ===== 合法手チェック =====

function getFlipsForMove(x, y, player) {
  if (!inBounds(x, y)) return [];
  if (board[y][x] !== CELL_EMPTY) return [];

  const opponent = getOpponent(player);
  const allFlips = [];

  for (const [dx, dy] of DIRECTIONS) {
    let cx = x + dx;
    let cy = y + dy;
    const flipsInThisDir = [];

    while (inBounds(cx, cy) && board[cy][cx] === opponent) {
      flipsInThisDir.push([cx, cy]);
      cx += dx;
      cy += dy;
    }

    if (
      flipsInThisDir.length > 0 &&
      inBounds(cx, cy) &&
      board[cy][cx] === player
    ) {
      allFlips.push(...flipsInThisDir);
    }
  }

  return allFlips;
}

function canPlace(x, y, player) {
  return getFlipsForMove(x, y, player).length > 0;
}

function hasAnyValidMove(player) {
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (canPlace(x, y, player)) return true;
    }
  }
  return false;
}

function getValidMoves(player) {
  const moves = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (canPlace(x, y, player)) moves.push([x, y]);
    }
  }
  return moves;
}

// ===== 石を置く =====

function placeStone(x, y, player) {
  const flips = getFlipsForMove(x, y, player);
  if (flips.length === 0) return false;

  board[y][x] = player;
  for (const [fx, fy] of flips) {
    board[fy][fx] = player;
  }
  return true;
}

// ===== 盤面描画 =====

function renderBoard() {
  const boardEl = document.getElementById("board");
  boardEl.innerHTML = "";

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const cellBtn = document.createElement("button");
      cellBtn.className = "cell";
      cellBtn.dataset.x = x;
      cellBtn.dataset.y = y;

      const value = board[y][x];
      if (value === CELL_BLACK || value === CELL_WHITE) {
        const img = document.createElement("img");
        img.src =
          value === CELL_BLACK
            ? "images/black.png"
            : "images/white.png";
        img.alt = value === CELL_BLACK ? "黒石" : "白石";
        cellBtn.appendChild(img);
      }

      cellBtn.addEventListener("click", onCellClick);
      boardEl.appendChild(cellBtn);
    }
  }
}

// ===== ターン管理・パス・終了 =====

function updateBubbleForTurn() {
  if (gameEnded) return;

  if (currentPlayer === CELL_BLACK) {
    setBubble("君の番だよ♪");
  } else {
    setBubble("AIの番だよ♪");
  }
}

// ターン開始時の処理（プレイヤー or AI）
function handleTurnStart() {
  if (gameEnded) return;

  // 現在のプレイヤーに合法手があるか？
  if (!hasAnyValidMove(currentPlayer)) {
    const opponent = getOpponent(currentPlayer);

    // 両者とも打てない → 終了
    if (!hasAnyValidMove(opponent)) {
      endGame();
      return;
    }

    // パス
    if (currentPlayer === CELL_BLACK) {
      setBubble("打てるマスがないからパスだよ…");
    } else {
      setBubble("AIは打てるマスがないみたい…パス！");
    }

    currentPlayer = opponent;
    isPlayerTurn = (currentPlayer === CELL_BLACK);

    setTimeout(() => {
      if (gameEnded) return;
      updateBubbleForTurn();
      if (!isPlayerTurn) {
        // AIのターンへ
        thinkAndMoveAI();
      }
    }, 900);

    return;
  }

  // 打てる手がある場合
  if (currentPlayer === CELL_BLACK) {
    isPlayerTurn = true;
    updateBubbleForTurn();
  } else {
    isPlayerTurn = false;
    // AIターン開始
    setBubble("AI考え中…");
    setTimeout(thinkAndMoveAI, 600);
  }
}

// ===== プレイヤークリック =====

function onCellClick(e) {
  if (gameEnded) return;
  if (!isPlayerTurn) return;
  if (currentPlayer !== CELL_BLACK) return;

  const btn = e.currentTarget;
  const x = Number(btn.dataset.x);
  const y = Number(btn.dataset.y);

  const success = placeStone(x, y, CELL_BLACK);
  if (!success) {
    // 置けないマスは無視
    return;
  }

  renderBoard();

  // プレイヤーの手が終わったのでAIへ
  currentPlayer = CELL_WHITE;
  handleTurnStart();
}

// ===== AIロジック（弱め） =====

function chooseAiMove(moves) {
  if (moves.length === 0) return null;

  let bestScore = -Infinity;
  let bestMoves = [];

  for (const [x, y] of moves) {
    const score = POSITION_SCORE[y][x] ?? 0;
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [[x, y]];
    } else if (score === bestScore) {
      bestMoves.push([x, y]);
    }
  }

  // 同点候補からランダム
  const idx = Math.floor(Math.random() * bestMoves.length);
  return bestMoves[idx];
}

function thinkAndMoveAI() {
  if (gameEnded) return;
  if (currentPlayer !== CELL_WHITE) return;

  const moves = getValidMoves(CELL_WHITE);
  if (moves.length === 0) {
    // 念のため。ここに来る前に handleTurnStart で処理されているはず
    handleTurnStart();
    return;
  }

  const move = chooseAiMove(moves);
  if (!move) {
    handleTurnStart();
    return;
  }

  const [x, y] = move;
  placeStone(x, y, CELL_WHITE);
  renderBoard();

  // プレイヤーにターンを戻す
  currentPlayer = CELL_BLACK;
  handleTurnStart();
}

// ===== オーバーレイ =====

function setupRuleOverlay() {
  const ruleOverlay = document.getElementById("rule-overlay");
  const startButton = document.getElementById("start-button");
  const ruleButton = document.getElementById("rule-button");

  startButton.addEventListener("click", () => {
    ruleOverlay.classList.add("hidden");
    // ゲーム開始時点でターン処理を発火
    handleTurnStart();
  });

  ruleButton.addEventListener("click", () => {
    ruleOverlay.classList.remove("hidden");
  });
}

function endGame() {
  gameEnded = true;

  const { black, white } = countStones();
  const overlay = document.getElementById("result-overlay");
  const charaImg = document.getElementById("result-chara");
  const textEl = document.getElementById("result-text");

  let msg = `黒 ${black} : 白 ${white}`;
  if (black > white) {
    charaImg.src = "images/chara_win.png";
    textEl.textContent = "WIN! " + msg;
  } else if (white > black) {
    charaImg.src = "images/chara_lose.png";
    textEl.textContent = "LOSE... " + msg;
  } else {
    charaImg.src = "images/chara_draw.png";
    textEl.textContent = "DRAW " + msg;
  }

  overlay.classList.remove("hidden");
}

function setupResultOverlay() {
  const overlay = document.getElementById("result-overlay");
  const retryButton = document.getElementById("retry-button");

  retryButton.addEventListener("click", () => {
    overlay.classList.add("hidden");
    initBoard();
    renderBoard();
    updateBubbleForTurn();
    handleTurnStart();
  });
}

// ===== 初期化 =====

document.addEventListener("DOMContentLoaded", () => {
  initBoard();
  renderBoard();
  setupRuleOverlay();
  setupResultOverlay();
  updateBubbleForTurn(); // 一応初期表示
});
