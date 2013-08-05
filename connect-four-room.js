var path = require('path');

var winston = require('winston');
var logger = new (winston.Logger)({
  transports: [ new winston.transports.Console({
    colorize: true
  }),
  new (winston.transports.File)({
    filename: 'logs/connect-four.log',
    json: false,
    colorize: false
  })]
});

var App = {};
App.data = {};
App.data.sockets = {};
App.logger = logger;
App.Models = {};

var io = require('socket.io').listen(3001);
App.io = io;

Array.prototype.indexOfObject = function (property, value) {
  for (var i=0; i<this.length; i++) {
    if (this[i][property] === value) {
      return i;
    }
  }
  return -1;
};

var visitors = [];

var ConnectFourGame = require('./connect-four-game');
var game = new ConnectFourGame();

var getRoom = function() {
  return {
    visitors: visitors,
    game: game.toJson()
  };
};

App.io.sockets.on('connection', function (socket) {
  socket.data = {};
  socket.on('joinRoom', function(data) {
    var idStr = socket.data.idStr = data.idStr;
    if (!idStr) {
      return;
    }

    var visitorIndex = visitors.indexOf(idStr);
    if (visitorIndex == -1) {
      visitors.push(idStr);
    }
    sendRoom();
  });
  socket.on('action', function(data) {
    handleAction(socket, data);
  });
  socket.on('nextGame', function(data) {
    handleAction(null, {action: "continue"});
  });
  socket.on('refreshRoom', function(data) {
    sendRoomToSocket(socket);
  });
  socket.on('disconnect', function () {
    var idStr = socket.data.idStr;
    if (!idStr) {
      return;
    }

    var visitorIndex = visitors.indexOf(idStr)
    if (visitorIndex != -1) {
      visitors.splice(visitorIndex, 1);
    }

    // TODO: Handle player disconnect

    sendRoom();
  });
});

var sendRoom = function() {
  App.io.sockets.emit("setRoom", getRoom());
};

var sendRoomToSocket = function(socket) {
  socket.emit("setRoom", getRoom());
};

var sendError = function(socket, data, error) {
  if (!socket) {
    return;
  }

  data = data || {};
  data.serverError = error;
  socket.emit('serverError', data);
  return;
};

var handleAction = function(socket, data) {
  logger.info("handleAction", data);
  data = data || {};
  var action = data.action;

  var callback = function(err) {
    if (err) {
      sendError(socket, data, err.message);
    }
    sendRoom();
  };

  if (!action) {
    return callback(new Error("No action sent"));
  }

  var player = socket.data.idStr;
  if (!player) {
    return callback(new Error("No player attached to socket"));
  }

  switch(action) {
    case "sit":
      game.join(player, callback);
    return;
    case "stand":
      game.leave(player, callback);
    return;
    case "play":
      game.play(player, data.column, callback);
    return;
    default:
      callback(new Error("Invalid action"));
    return;
  }
};

