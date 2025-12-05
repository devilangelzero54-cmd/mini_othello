// v0.2: 6×6 盤面 + 合法手チェック + ひっくり返しまで

const BOARD_SIZE = 6;
const CELL_EMPTY = 0;
const CELL_BLACK = 1; // 仮：先手
const CELL_WHITE = 2; // 仮：後手

// 8方向ベクトル
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
let currentPlayer = CELL_BLACK; // 今打つプレイヤー
let isPlayerTurn = true; // 後でAI導入するときに使う想定

// ユーティリティ
function inBounds(x, y) {
  return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

function getOpponent(player) {
  return player === CELL_BLACK ? CELL_WHITE : CELL_BLACK;
}

// 盤面初期化（全部0 → 中央に4コマ）
function initBoard() {
  board = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(CELL_EMPTY)
  );

  const mid1 = BOARD_SIZE / 2 - 1; // 6 → 2
  const mid2 = BOARD_SIZE / 2;     // 6 → 3

  // 標準オセロ配置
  board[mid1][mid1] = CELL_WHITE;
  board[mid2][mid2] = CELL_WHITE;
  board[mid1][mid2] = CELL_BLACK;
  board[mid2][mid1] = CELL_BLACK;
}

// ---------------------------
// ① 合法手チェック用ロジック
// ---------------------------

// (x, y) に player が打ったとき、ひっくり返る座標リストを返す。
// ひとつも返らなければ「そこには置けない」。
function getFlipsForMove(x, y, player) {
  if (!inBounds(x, y)) return [];
  if (board[y][x] !== CELL_EMPTY) return [];

  const opponent = getOpponent(player);
  const allFlips = [];

  for (const [dx, dy] of DIRECTIONS) {
    let cx = x + dx;
    let cy = y + dy;
    const flipsInThisDir = [];

    // まず相手の石が連続しているか見る
    while (inBounds(cx, cy) && board[cy][cx] === opponent) {
      flipsInThisDir.push([cx, cy]);
      cx += dx;
      cy += dy;
    }

    // 1つ以上相手の石を挟んで、自分の石で終わっているならOK
    if (
      flipsInThisDir.length > 0 &&
      inBounds(cx, cy) &&
      board[cy][cx] === player
    ) {
      // この方向でひっくり返る石を追加
      allFlips.push(...flipsInThisDir);
    }
  }

  return allFlips;
}

// (x, y) に打てるかどうかだけ知りたいとき
function canPlace(x, y, player) {
  const flips = getFlipsForMove(x, y, player);
  return flips.length > 0;
}

// ---------------------------
// ② 実際に石を置いてひっくり返す
// ---------------------------

function placeStone(x, y, player) {
  const flips = getFlipsForMove(x, y, player);
  if (flips.length === 0) {
    return false; // 不正手
  }

  // 自分の石を置く
  board[y][x] = player;

  // ひっくり返す
  for (const [fx, fy] of flips) {
    board[fy][fx] = player;
  }

  return true;
}

// ---------------------------
// ③ 盤面の DOM を生成＆描画
// ---------------------------

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

// ---------------------------
// クリック時の処理
// ---------------------------

function onCellClick(e) {
  const btn = e.currentTarget;
  const x = Number(btn.dataset.x);
  const y = Number(btn.dataset.y);

  // 今はとりあえず「2人対戦モード」想定でロジックだけ作る
  // 将来AI入れるときは「isPlayerTurn」と「currentPlayer」を使って分岐させる。

  const success = placeStone(x, y, currentPlayer);
  if (!success) {
    console.log("そこには置けないよ:", x, y);
    // TODO: 将来ここでフキダシに「そこは置けないよ〜」とか出してもよい
    return;
  }

  // 手が成立したらターン交代
  currentPlayer =
    currentPlayer === CELL_BLACK ? CELL_WHITE : CELL_BLACK;

  renderBoard();
  updateBubbleText();
}

// ---------------------------
// フキダシ・オーバーレイ周り
// ---------------------------

function setupOverlays() {
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

function updateBubbleText() {
  const bubbleText = document.getElementById("bubble-text");
  // v0.2 時点では「2人対戦モード」用の仮テキスト
  bubbleText.textContent =
    currentPlayer === CELL_BLACK
      ? "黒の番だよ♪"
      : "白の番だよ♪";
}

function setupBubble() {
  updateBubbleText();
}

// ---------------------------
// 初期化
// ---------------------------

document.addEventListener("DOMContentLoaded", () => {
  initBoard();
  renderBoard();
  setupOverlays();
  setupBubble();
});
