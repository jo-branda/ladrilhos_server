class Party {
  constructor(id, p1, p2, onPartyEnd) {
    this.id = id;
    this.p1 = p1;
    this.p2 = p2;
    this.onPartyEnd = onPartyEnd;
    this.board = {};
    this.maxRounds = 5;
    this.round = 0;
    this.canPlay = false;

    this.containsUserById = this.containsUserById.bind(this);

    this.broadcastBoardState();
    this.broadCastPlayersPoints();
    this.broadCastRound();
    this.broadCastTurns(p1.myTurn, p2.myTurn);
    this.canPlay = true;

    this.setUpEvents();
  }

  broadCastPlayersPoints() {
    this.p1.socket.broadcast.emit("points", { points: this.p2.points });
    this.p2.socket.broadcast.emit("points", { points: this.p1.points });
  }
  broadCastRound() {
    this.p1.socket.broadcast.emit("round", { round: this.round });
    this.p2.socket.broadcast.emit("round", { round: this.round });
  }

  broadCastTurns(turnP1, turnP2) {
    if (this.canPlay) {
      if (turnP2 === false && this.p2.myTurn === true) {
        this.round += 1;
      }

      if (this.round >= this.maxRounds) {
        // enviar winner
        this.broadCastEndGame();
        this.closeConnections();
        //this.onPartyEnd();
        return;
      }
    }

    this.p1.myTurn = turnP1;
    this.p2.myTurn = turnP2;

    this.p1.socket.broadcast.emit("turn", { myTurn: turnP2 });
    this.p2.socket.broadcast.emit("turn", { myTurn: turnP1 });
    console.log("player1: " + this.p1.myTurn + " player2: " + this.p2.myTurn);
    this.broadCastRound();
  }

  broadCastEndGame() {
    //calc player that won the game
    if (this.p1.points > this.p2.points) {
      this.p2.socket.broadcast.emit("game_over", {
        winner: true,
        reason: ``
      });
      this.p1.socket.broadcast.emit("game_over", {
        winner: false,
        reason: ``
      });
    } else if (this.p1.points < this.p2.points) {
      this.p2.socket.broadcast.emit("game_over", {
        winner: false,
        reason: ``
      });
      this.p1.socket.broadcast.emit("game_over", {
        winner: true,
        reason: ``
      });
    } else {
      this.p1.socket.broadcast.emit("game_over", {
        winner: false,
        reason: `Empate`
      });
      this.p2.socket.broadcast.emit("game_over", {
        winner: false,
        reason: `Empate`
      });
    }
  }

  setUpEvents() {
    this.p1.socket.on("place_tile", ({ x, y, tileType }) => {
      // if (!this.p1.myTurn) return;

      this.addTile({ x, y, tileType });
      this.p1.points += 5;
      this.broadCastPlayersPoints();
    });

    this.p1.socket.on("passa_vez", () => {
      if (!this.p1.myTurn) return;

      this.broadCastTurns(false, true);
    });

    this.p2.socket.on("place_tile", ({ x, y, tileType }) => {
      // if (!this.p2.myTurn) return;

      this.addTile({ x, y, tileType });
      this.p2.points += 5;
      this.broadCastPlayersPoints();
    });

    this.p2.socket.on("passa_vez", () => {
      if (!this.p2.myTurn) return;

      this.broadCastTurns(true, false);
    });
  }

  closeConnections() {
    this.p1.socket.disconnect();
    this.p2.socket.disconnect();
  }

  addTile({ x, y, tileType }) {
    this.board[tileType] = { x, y, tileType };
    this.broadcastBoardState();
    console.log(this.board);
  }

  broadcastBoardState() {
    this.p1.socket.broadcast.emit("board_state", { ...this.board });
    this.p2.socket.broadcast.emit("board_state", { ...this.board });
  }

  containsUserById(id) {
    return this.p1.id === id || this.p2.id === id;
  }

  getPlayerById(id) {
    if (this.p1.id === id) return this.p1;
    if (this.p2.id === id) return this.p2;

    return null;
  }

  endFromDisconnect(id) {
    if (this.p1.id === id) {
      this.p1.socket.broadcast.emit("game_over", {
        winner: true,
        reason: `O outro jogador disconectou-se.`
      });
    } else if (this.p2.id === id) {
      this.p2.socket.broadcast.emit("game_over", {
        winner: true,
        reason: `O outro jogador disconectou-se.`
      });
    }
  }
}

module.exports = { Party };
