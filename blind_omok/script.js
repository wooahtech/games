class BlindOmok {
  constructor() {
    this.board = Array(8)
      .fill()
      .map(() => Array(7).fill(null));
    this.currentPlayer = 1;
    this.gameEnded = false;
    this.timeLeft = 120;
    this.timer = null;
    this.moves = [];
    this.isAIMode = false;
    this.totalCells = 8 * 7;
    this.placedCells = 0;
    this.isReplaying = false;
    this.isPaused = false;
    this.replayInterval = null;
    this.currentMoveIndex = 0;

    this.setupModeSelection();

    // 초기에 메시지 영역에 공백 문자 설정
    document.getElementById("message").textContent = "\u00A0";
  }

  setupModeSelection() {
    const modeSelect = document.getElementById("modeSelect");
    const gameUI = document.getElementById("gameUI");

    document.getElementById("pvpMode").addEventListener("click", () => {
      this.isAIMode = false;
      modeSelect.classList.add("hidden");
      gameUI.classList.remove("hidden");
      this.initializeGame();
    });

    document.getElementById("aiMode").addEventListener("click", () => {
      this.isAIMode = true;
      modeSelect.classList.add("hidden");
      gameUI.classList.remove("hidden");
      this.initializeGame();
    });
  }

  initializeGame() {
    this.createBoard();
    this.setupEventListeners();
    this.startTimer();
  }

  createBoard() {
    const gameBoard = document.getElementById("gameBoard");
    gameBoard.innerHTML = "";

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 7; j++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.row = i;
        cell.dataset.col = j;
        gameBoard.appendChild(cell);
      }
    }
  }

  setupEventListeners() {
    document.getElementById("gameBoard").addEventListener("click", (e) => {
      const cell = e.target.closest(".cell");
      if (cell && !this.gameEnded) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        this.makeMove(row, col);
      }
    });

    document
      .getElementById("endGame")
      .addEventListener("click", () => this.endGame());

    document.getElementById("restartGame").addEventListener("click", () => {
      window.location.reload();
    });

    document.getElementById("replayGame").addEventListener("click", () => {
      if (!this.isReplaying) {
        this.startReplay();
      }
    });

    document.getElementById("pauseReplay").addEventListener("click", () => {
      this.toggleReplayPause();
    });
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateTimerDisplay();

      if (this.timeLeft <= 0) {
        // 시간 초과 시 턴만 변경
        this.timeLeft = 120;
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateCurrentPlayerDisplay();
        this.showMessage("시간 초과! 다음 플레이어의 차례입니다.");

        // AI 모드에서 백의 차례가 되면 AI 턴 시작
        if (this.isAIMode && this.currentPlayer === 2) {
          setTimeout(() => this.makeAIMove(), 1000);
        }
      }
    }, 1000);
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    document.getElementById("timer").textContent = `${minutes}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  makeMove(rowIndex, colIndex) {
    if (this.board[rowIndex][colIndex] !== null) {
      const stoneType = this.board[rowIndex][colIndex] === 1 ? "흑" : "백";
      this.showMessage(`${stoneType}돌이 놓여진 자리입니다.`);
      this.timeLeft = Math.max(0, this.timeLeft - 30);
      this.updateTimerDisplay();
      return;
    }

    if (this.placedCells >= this.totalCells) {
      this.showMessage("더이상 놓을 자리가 없어요");
      this.endGame();
      return;
    }

    const row = String.fromCharCode("A".charCodeAt(0) + rowIndex);
    const col = (colIndex + 1).toString();

    this.board[rowIndex][colIndex] = this.currentPlayer;
    this.moves.push({ row, col, player: this.currentPlayer });

    if (this.checkWin(rowIndex, colIndex)) {
      this.endGame(true);
      return;
    }

    this.timeLeft = 120;
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    this.updateCurrentPlayerDisplay();

    if (this.isAIMode && !this.gameEnded && this.currentPlayer === 2) {
      setTimeout(() => this.makeAIMove(), 1000);
    }
  }

  checkWin(row, col) {
    const directions = [
      [
        [0, 1],
        [0, -1],
      ], // 가로
      [
        [1, 0],
        [-1, 0],
      ], // 세로
      [
        [1, 1],
        [-1, -1],
      ], // 대각선 ↘↖
      [
        [1, -1],
        [-1, 1],
      ], // 대각선 ↙↗
    ];

    return directions.some((dir) => {
      let count = 1;
      dir.forEach(([dx, dy]) => {
        let r = row + dx;
        let c = col + dy;
        while (
          r >= 0 &&
          r < 8 &&
          c >= 0 &&
          c < 7 &&
          this.board[r][c] === this.currentPlayer
        ) {
          count++;
          r += dx;
          c += dy;
        }
      });
      return count >= 5;
    });
  }

  isDoubleThree(row, col) {
    this.board[row][col] = this.currentPlayer;

    const directions = [
      [
        [0, 1],
        [0, -1],
      ], // 가로
      [
        [1, 0],
        [-1, 0],
      ], // 세로
      [
        [1, 1],
        [-1, -1],
      ], // 대각선 ↘↖
      [
        [1, -1],
        [-1, 1],
      ], // 대각선 ↙↗
    ];

    let threeCount = 0;

    directions.forEach((dir) => {
      let count = 1;
      let openEnds = 0;

      dir.forEach(([dx, dy]) => {
        let r = row + dx;
        let c = col + dy;
        let tempCount = 0;

        while (
          r >= 0 &&
          r < 8 &&
          c >= 0 &&
          c < 7 &&
          this.board[r][c] === this.currentPlayer
        ) {
          tempCount++;
          r += dx;
          c += dy;
        }

        if (r >= 0 && r < 8 && c >= 0 && c < 7 && this.board[r][c] === null) {
          openEnds++;
        }

        count += tempCount;
      });

      if (count === 3 && openEnds === 2) {
        threeCount++;
      }
    });

    this.board[row][col] = null;

    return threeCount >= 2;
  }

  showMessage(message, duration = 3000) {
    const messageElement = document.getElementById("message");
    messageElement.textContent = message;
    setTimeout(() => {
      messageElement.textContent = "\u00A0"; // 공백 문자(&nbsp;) 사용
    }, duration);
  }

  updateCurrentPlayerDisplay() {
    const playerText =
      this.currentPlayer === 1
        ? "User1 (흑)"
        : this.isAIMode
        ? "AI (백)"
        : "User2 (백)";
    const playerInfo = document.getElementById("playerInfo");
    const currentPlayer = document.getElementById("currentPlayer");

    // 텍스트 정렬 변경
    playerInfo.className =
      this.currentPlayer === 1
        ? "text-lg font-semibold text-left"
        : "text-lg font-semibold text-right";

    currentPlayer.textContent = playerText;
  }

  endGame(isWin = false) {
    this.gameEnded = true;
    clearInterval(this.timer);

    // 모든 돌 표시
    this.moves.forEach((move) => {
      const rowIndex = move.row.charCodeAt(0) - "A".charCodeAt(0);
      const colIndex = parseInt(move.col) - 1;
      const cell = document.querySelector(
        `[data-row="${rowIndex}"][data-col="${colIndex}"]`
      );

      if (move.player === 1) {
        cell.innerHTML = '<div class="black-stone"></div>';
      } else {
        cell.innerHTML = '<div class="white-stone"></div>';
      }
    });

    // 게임 포기 버튼 숨기기
    document.getElementById("endGame").classList.add("hidden");
    // 다시 하기 버튼과 리플레이 버튼 표시
    document.getElementById("restartGame").classList.remove("hidden");
    document.getElementById("replayGame").classList.remove("hidden");
    document.getElementById("pauseReplay").classList.add("hidden");

    // 각 플레이어의 수 개수 계산
    const blackMoves = this.moves.filter((move) => move.player === 1).length;
    const whiteMoves = this.moves.filter((move) => move.player === 2).length;

    if (isWin) {
      const winner =
        this.currentPlayer === 1
          ? "User1 (흑)"
          : this.isAIMode
          ? "AI (백)"
          : "User2 (백)";
      this.showMessage(
        `게임 종료! ${winner}가 승리했습니다!\n` +
          `User1(흑): ${blackMoves}수, ${
            this.isAIMode ? "AI" : "User2"
          }(백): ${whiteMoves}수`
      );
    } else {
      this.showMessage(
        `게임이 종료되었습니다.\n` +
          `User1(흑): ${blackMoves}수, ${
            this.isAIMode ? "AI" : "User2"
          }(백): ${whiteMoves}수`
      );
    }
  }

  makeAIMove() {
    const bestMove = this.findBestMove();
    if (bestMove) {
      // 이미 돌이 놓여있는지 확인
      if (this.board[bestMove.row][bestMove.col] !== null) {
        console.log(
          "AI가 이미 돌이 놓인 자리에 두려고 했습니다. 다시 시도합니다."
        );
        setTimeout(() => this.makeAIMove(), 500);
        return;
      }

      // 33 금수 확인
      if (this.isDoubleThree(bestMove.row, bestMove.col)) {
        console.log("AI가 33 금수에 두려고 했습니다. 다시 시도합니다.");
        setTimeout(() => this.makeAIMove(), 500);
        return;
      }

      const row = String.fromCharCode("A".charCodeAt(0) + bestMove.row);
      const col = bestMove.col + 1;

      // AI의 수를 화면에 표시
      const cell = document.querySelector(
        `[data-row="${bestMove.row}"][data-col="${bestMove.col}"]`
      );
      cell.innerHTML = '<div class="white-stone"></div>';

      this.showMessage(`AI가 ${row}${col}에 돌을 놓았습니다.`, 2000);

      // 2초 후에 AI의 돌을 숨김
      setTimeout(() => {
        if (!this.gameEnded) {
          cell.innerHTML = "";
        }
      }, 2000);

      this.makeMove(bestMove.row, bestMove.col);
    }
  }

  findBestMove() {
    // 즉시 승리 가능한 수 확인
    const winningMove = this.findWinningMove(2);
    if (winningMove && !this.isDoubleThree(winningMove.row, winningMove.col)) {
      return winningMove;
    }

    // 상대방의 즉시 승리 저지
    const blockingMove = this.findWinningMove(1);
    if (
      blockingMove &&
      !this.isDoubleThree(blockingMove.row, blockingMove.col)
    ) {
      return blockingMove;
    }

    // 미니맥스 알고리즘으로 최적의 수 탐색
    const depth = 3;
    const { move } = this.minimax(depth, -Infinity, Infinity, true);

    // 유효한 수가 없으면 빈 자리 중 하나를 선택
    if (!move) {
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 7; j++) {
          if (this.board[i][j] === null && !this.isDoubleThree(i, j)) {
            return { row: i, col: j };
          }
        }
      }
    }

    return move;
  }

  minimax(depth, alpha, beta, isMaximizing) {
    // 종료 조건
    if (depth === 0) {
      return { score: this.evaluateBoard() };
    }

    if (isMaximizing) {
      let bestScore = -Infinity;
      let bestMove = null;

      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 7; j++) {
          if (this.board[i][j] === null) {
            this.board[i][j] = 2; // AI의 수
            const score = this.minimax(depth - 1, alpha, beta, false).score;
            this.board[i][j] = null;

            if (score > bestScore) {
              bestScore = score;
              bestMove = { row: i, col: j };
            }
            alpha = Math.max(alpha, bestScore);
            if (beta <= alpha) break; // 알파-베타 가지치기
          }
        }
      }
      return { score: bestScore, move: bestMove };
    } else {
      let bestScore = Infinity;
      let bestMove = null;

      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 7; j++) {
          if (this.board[i][j] === null) {
            this.board[i][j] = 1; // 플레이어의 수
            const score = this.minimax(depth - 1, alpha, beta, true).score;
            this.board[i][j] = null;

            if (score < bestScore) {
              bestScore = score;
              bestMove = { row: i, col: j };
            }
            beta = Math.min(beta, bestScore);
            if (beta <= alpha) break; // 알파-베타 가지치기
          }
        }
      }
      return { score: bestScore, move: bestMove };
    }
  }

  evaluateBoard() {
    let score = 0;
    const patterns = {
      AI: {
        FIVE: 100000, // 승리
        OPEN_FOUR: 15000, // 열린 4
        FOUR: 10000, // 4
        OPEN_THREE: 3000, // 열린 3
        THREE: 1000, // 3
        OPEN_TWO: 300, // 열린 2
        TWO: 100, // 2
      },
      PLAYER: {
        FIVE: -100000,
        OPEN_FOUR: -15000,
        FOUR: -10000,
        OPEN_THREE: -3000,
        THREE: -1000,
        OPEN_TWO: -300,
        TWO: -100,
      },
    };

    // 모든 방향에 대해 패턴 검사
    const directions = [
      [
        [0, 1],
        [0, -1],
      ], // 가로
      [
        [1, 0],
        [-1, 0],
      ], // 세로
      [
        [1, 1],
        [-1, -1],
      ], // 대각선 ↘↖
      [
        [1, -1],
        [-1, 1],
      ], // 대각선 ↙↗
    ];

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 7; j++) {
        if (this.board[i][j] !== null) {
          const player = this.board[i][j];
          const patternScores = player === 2 ? patterns.AI : patterns.PLAYER;

          directions.forEach((dir) => {
            const pattern = this.getPattern(i, j, dir);
            score += this.evaluatePattern(pattern, patternScores);
          });
        }
      }
    }

    // 중앙 선호도 추가
    const centerPreference = 10;
    const centerCol = 3;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 7; j++) {
        if (this.board[i][j] === 2) {
          // AI의 돌
          score += centerPreference * (4 - Math.abs(j - centerCol));
        }
      }
    }

    return score;
  }

  getPattern(row, col, direction) {
    const pattern = [];
    const player = this.board[row][col];
    let count = 1;
    let openEnds = 0;

    direction.forEach(([dx, dy]) => {
      let r = row + dx;
      let c = col + dy;
      let tempCount = 0;

      while (r >= 0 && r < 8 && c >= 0 && c < 7) {
        if (this.board[r][c] === player) {
          tempCount++;
          r += dx;
          c += dy;
        } else if (this.board[r][c] === null) {
          openEnds++;
          break;
        } else {
          break;
        }
      }
      count += tempCount;
    });

    return { count, openEnds };
  }

  evaluatePattern(pattern, scores) {
    const { count, openEnds } = pattern;

    if (count >= 5) return scores.FIVE;
    if (count === 4) {
      if (openEnds === 2) return scores.OPEN_FOUR;
      if (openEnds === 1) return scores.FOUR;
    }
    if (count === 3) {
      if (openEnds === 2) return scores.OPEN_THREE;
      if (openEnds === 1) return scores.THREE;
    }
    if (count === 2) {
      if (openEnds === 2) return scores.OPEN_TWO;
      if (openEnds === 1) return scores.TWO;
    }
    return 0;
  }

  findWinningMove(player) {
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 7; j++) {
        if (this.board[i][j] === null) {
          this.board[i][j] = player;
          if (this.checkWin(i, j)) {
            return { row: i, col: j };
          }
          this.board[i][j] = null;
        }
      }
    }
    return null;
  }

  startReplay() {
    if (this.moves.length === 0) return;

    this.isReplaying = true;
    this.isPaused = false;
    this.currentMoveIndex = 0;

    // 보드 초기화
    const cells = document.querySelectorAll(".cell");
    cells.forEach((cell) => (cell.innerHTML = ""));

    // 리플레이 버튼 숨기고 일시정지 버튼 표시
    document.getElementById("replayGame").classList.add("hidden");
    document.getElementById("pauseReplay").classList.remove("hidden");

    this.playNextMove();
  }

  playNextMove() {
    if (this.isPaused) return;

    if (this.currentMoveIndex >= this.moves.length) {
      this.endReplay();
      return;
    }

    const move = this.moves[this.currentMoveIndex];
    const rowIndex = move.row.charCodeAt(0) - "A".charCodeAt(0);
    const colIndex = parseInt(move.col) - 1;
    const cell = document.querySelector(
      `[data-row="${rowIndex}"][data-col="${colIndex}"]`
    );

    if (move.player === 1) {
      cell.innerHTML = '<div class="black-stone"></div>';
      this.showMessage(`User1(흑): ${move.row}${move.col}`, 900);
    } else {
      cell.innerHTML = '<div class="white-stone"></div>';
      this.showMessage(
        `${this.isAIMode ? "AI" : "User2"}(백): ${move.row}${move.col}`,
        900
      );
    }

    this.currentMoveIndex++;
    this.replayInterval = setTimeout(() => this.playNextMove(), 1000);
  }

  toggleReplayPause() {
    const pauseButton = document.getElementById("pauseReplay");

    if (this.isPaused) {
      // 재생 시작
      this.isPaused = false;
      pauseButton.textContent = "일시정지";
      this.playNextMove();
    } else {
      // 일시정지
      this.isPaused = true;
      pauseButton.textContent = "재생";
      if (this.replayInterval) {
        clearTimeout(this.replayInterval);
      }
    }
  }

  endReplay() {
    this.isReplaying = false;
    this.isPaused = false;
    this.currentMoveIndex = 0;
    if (this.replayInterval) {
      clearTimeout(this.replayInterval);
    }

    // 버튼 상태 초기화
    document.getElementById("replayGame").classList.remove("hidden");
    document.getElementById("pauseReplay").classList.add("hidden");
    document.getElementById("pauseReplay").textContent = "일시정지";
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new BlindOmok();
});
