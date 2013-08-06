var prototypes = require('./prototypes');

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

var notifyUsers = function(data) {
  App.io.sockets.emit("setGame", data);
};

var notifyUser = function(player, data) {
  var socket = player.socket;
  socket.emit("setPlayer", data);
};

// TODO: Send visitors
var visitors = [];

var Player = function(alias, idStr, socket) {
  return {
    alias: alias,
    idStr: idStr,
    getSocket: function() {
      return socket;
    }
  };
};

var ConnectFourGame = require('./connect-four-game');
var game = new ConnectFourGame(notifyUsers, notifyUser);

var getState = function() {
  return {
    visitors: visitors,
    game: game.toJson()
  };
};

App.io.sockets.on('connection', function (socket) {
  socket.data = {};
  socket.on('identify', function(data) {
    var alias = data.alias;
    if (!alias) {
      return;
    }

    var idStr = data.idStr;
    if (!idStr) {
      return;
    }

    var player = new Player(alias, idStr, socket);
    socket.data.player = player;

    var visitorIndex = visitors.indexOf(idStr);
    if (visitorIndex == -1) {
      visitors.push(idStr);
    }
    sendState();
  });
  socket.on('action', function(data) {
    handleAction(socket, data);
  });
  socket.on('nextGame', function(data) {
    handleAction(socket, {action: "continue"});
  });
  socket.on('refreshState', function(data) {
    sendStateToSocket(socket); // TODO
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

    sendState();
  });
});

var sendState = function() {
  App.io.sockets.emit("setState", getState());
};

var sendStateToSocket = function(socket) {
  socket.emit("setState", getState());
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
  };

  if (!action) {
    return callback(new Error("No action sent"));
  }

  var player = socket.data.player;
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
    case "continue":
      game.reset(callback);
      return;
    default:
      callback(new Error("Invalid action"));
      return;
  }
};

