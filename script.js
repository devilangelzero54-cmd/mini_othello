// v0.3: 6×6 盤面 + 合法手チェック + ひっくり返し + パス + リザルト

const BOARD_SIZE = 6;
const CELL_EMPTY = 0;
const CELL_BLACK = 1; // プレイヤー（仮）
const CELL_WHITE = 2; // 相手（仮）

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

// ===== ユーティリティ =====

function inBounds(x, y) {
  return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

function getOpponent(player) {
  return player === CELL_BLACK ? CELL_WHITE : CELL_BLACK;
}

// 石数カウント
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

// ===== 盤面初期化 =====

function initBoard() {
  board = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(CELL_EMPTY)
  );

  const mid1 = BOARD_SIZE / 2 - 1; // 2
  const mid2 = BOARD_SIZE / 2; // 3

  board[mid1][mid1] = CELL_WHITE;
  board[mid2][mid2] = CELL_WHITE;
  board[mid1][mid2] = CELL_BLACK;
  board[mid2][mid1] = CELL_BLACK;

  currentPlayer = CELL_BLACK;
  gameEnded = false;
}

// ===== 合法手チェック =====

// (x, y) に player が打ったとき、ひっくり返る座標リスト
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

// 打てるかどうか
function canPlace(x, y, player) {
  return getFlipsForMove(x, y, player).length > 0;
}

// player に合法手がひとつでもあるか
function hasAnyValidMove(player) {
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (canPlace(x, y, player)) return true;
    }
  }
  return false;
}

// ===== 石を置いてひっくり返す =====

function placeStone(x, y, player) {
  const flips = getFlipsForMove(x, y, player);
  if (flips.length === 0) {
    return false; // 置けない
  }

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

// ===== ターン後の処理（パス & 終了判定） =====

function handleAfterMove() {
  // まず currentPlayer に合法手があるか確認
  if (hasAnyValidMove(currentPlayer)) {
    updateBubbleText();
    return;
  }

  const opponent = getOpponent(currentPlayer);

  // 相手には合法手がある → パス
  if (hasAnyValidMove(opponent)) {
    const bubbleText = document.getElementById("bubble-text");
    bubbleText.textContent = "打てるマスがないからパスだよ…";
    currentPlayer = opponent;
    // すぐ通常表示に戻す
    setTimeout(updateBubbleText, 900);
    return;
  }

  // どちらも打てない → ゲーム終了
  endGame();
}

// ===== クリック時 =====

function onCellClick(e) {
  if (gameEnded) return;

  const btn = e.currentTarget;
  const x = Number(btn.dataset.x);
  const y = Number(btn.dataset.y);

  const success = placeStone(x, y, currentPlayer);
  if (!success) {
    // 置けないマス
    // console.log("そこには置けないよ:", x, y);
    return;
  }

  // ターン交代
  currentPlayer = getOpponent(currentPlayer);
  renderBoard();
  handleAfterMove();
}

// ===== フキダシ・オーバーレイ =====

function updateBubbleText() {
  const bubbleText = document.getElementById("bubble-text");
  bubbleText.textContent =
    currentPlayer === CELL_BLACK
      ? "黒の番だよ♪"
      : "白の番だよ♪";
}

function setupBubble() {
  updateBubbleText();
}

// ルールオーバーレイ
function setupRuleOverlay() {
  const ruleOverlay = document.getElementById("rule-overlay");
  const startButton = document.getElementById("start-button");
  const ruleButton = document.getElementById("rule-button");

  startButton.addEventListener("click", () => {
    ruleOverlay.classList.add("hidden");
  });

  ruleButton.addEventListener("click", () => {
    ruleOverlay.classList.remove("hidden");
  });
}

// リザルト表示
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

// リザルトオーバーレイのボタン
function setupResultOverlay() {
  const overlay = document.getElementById("result-overlay");
  const retryButton = document.getElementById("retry-button");

  retryButton.addEventListener("click", () => {
    overlay.classList.add("hidden");
    initBoard();
    renderBoard();
    updateBubbleText();
  });
}

// ===== 初期化 =====

document.addEventListener("DOMContentLoaded", () => {
  initBoard();
  renderBoard();
  setupRuleOverlay();
  setupResultOverlay();
  setupBubble();
});
