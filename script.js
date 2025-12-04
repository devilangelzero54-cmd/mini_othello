// v0.1: 6×6 盤面を描画して、初期配置だけ置く

const BOARD_SIZE = 6;
const CELL_EMPTY = 0;
const CELL_BLACK = 1;
const CELL_WHITE = 2;

let board = []; // [y][x] で管理
let isPlayerTurn = true; // とりあえずプレイヤー先手想定

// 盤面初期化（全部0 → 中央に4コマ）
function initBoard() {
  board = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(CELL_EMPTY)
  );

  const mid1 = BOARD_SIZE / 2 - 1; // 6 → 2
  const mid2 = BOARD_SIZE / 2; // 6 → 3

  // 標準オセロ配置
  board[mid1][mid1] = CELL_WHITE;
  board[mid2][mid2] = CELL_WHITE;
  board[mid1][mid2] = CELL_BLACK;
  board[mid2][mid1] = CELL_BLACK;
}

// 盤面の DOM を生成＆描画
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

      // クリックイベント（今はデバッグ用に座標を出すだけ）
      cellBtn.addEventListener("click", onCellClick);

      boardEl.appendChild(cellBtn);
    }
  }
}

// とりあえず今は「どこを押したか」だけログ
function onCellClick(e) {
  const btn = e.currentTarget;
  const x = Number(btn.dataset.x);
  const y = Number(btn.dataset.y);
  console.log("clicked:", x, y);
  // ここに「合法手チェック→石を置く→反転→ターン切替」を今後追加
}

// ルールオーバーレイの制御（最初は表示しておく前提）
function setupOverlays() {
  const ruleOverlay = document.getElementById("rule-overlay");
  const startButton = document.getElementById("start-button");
  const ruleButton = document.getElementById("rule-button");

  // 最初はルール表示ONのまま。閉じたらゲーム開始。
  startButton.addEventListener("click", () => {
    ruleOverlay.classList.add("hidden");
    // 将来ここで「ゲーム状態リセット」などを呼び出してもOK
  });

  // 右上の？ボタンで再表示
  ruleButton.addEventListener("click", () => {
    ruleOverlay.classList.remove("hidden");
  });
}

// フキダシの初期メッセージ
function setupBubble() {
  const bubbleText = document.getElementById("bubble-text");
  bubbleText.textContent = "君の番だよ♪";
}

// ページ読み込み完了時に初期化
document.addEventListener("DOMContentLoaded", () => {
  initBoard();
  renderBoard();
  setupOverlays();
  setupBubble();
});
