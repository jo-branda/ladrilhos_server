class Player {
  constructor(id, socket) {
    this.id = id;
    this.socket = socket;
    this.points = 0;
    this.myTurn = false;
  }
}

module.exports = { Player };
