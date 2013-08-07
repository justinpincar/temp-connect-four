var io = require('socket.io-client')
var socket = io.connect('http://localhost:3001');

var idStr = process.env.ID_STR;
var alias = idStr;

var tryMove = function(data) {
  var action = data.action;
  if (!action) {
    return;
  }

  var actionPlayer = action.player;
  if (!action.player) {
    return;
  }

  if (actionPlayer.idStr == idStr) {
    socket.emit('action', {
      action: 'play',
      column: Math.floor(Math.random() * 7)
    });
  }
};

socket.on('connect', function() {
  socket.on('setState', tryMove);
  socket.on('setGame', tryMove);

  socket.emit("identify", {
    alias: alias,
    idStr: idStr
  });
  setTimeout(function() {
    socket.emit("action", {
      action: "sit"
    });
  }, 1000);
});

