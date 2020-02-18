const io = require("socket.io")(process.env.PORT || 4321);
const v4 = require("uuid/v4");

const { Player } = require("./Player");
const { Party } = require("./Party");

let playersToJoin = {};
const parties = {};

io.on("connection", socket => {
  const pid = v4();
  playersToJoin[pid] = new Player(pid, socket);

  console.log("enter new player", playersToJoin);

  if (Object.keys(playersToJoin).length === 2) {
    const partyId = v4();
    const [idP1, idP2] = Object.keys(playersToJoin);
    const p1 = playersToJoin[idP1];
    p1.myTurn = true;
    const p2 = playersToJoin[idP2];
    p2.myTurn = false;

    parties[partyId] = new Party(partyId, p1, p2, partyId => {
      parties[partyId].p1 = null;
      parties[partyId].p2 = null;
      delete parties[partyId];
    });
    playersToJoin = {};
  }

  console.log("new party", parties);

  socket.on("disconnect", () => {
    if (
      Object.keys(playersToJoin).length > 0 &&
      Object.values(playersToJoin).find(p => p.id === pid)
    ) {
      delete playersToJoin[pid];
      console.log("disconnect player", playersToJoin);
      return;
    }

    if (
      Object.keys(parties).length > 0 &&
      Object.values(parties).find(party => party.containsUserById(pid))
    ) {
      const party = Object.values(parties).find(party =>
        party.containsUserById(pid)
      );
      party.endFromDisconnect(pid);
      delete parties[party.id];
      console.log("disconnect player party", parties);
      console.log("disconnect player players", playersToJoin);
    }
  });
});
