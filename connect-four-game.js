var semaphore = require('semaphore');
var gameSemaphore = semaphore(1);

MAX_PLAYERS = 2;
ROWS = 6;
COLUMNS = 7;

STATES = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  DELAY: 'delay',
  ENDED: 'ended'
};

var state = STATES.WAITING;

var action = {
  player: null,
  timer: null
};

var winner = null;

var lastPlayerToLead = null;
var players = [];

var board = null;
var newBoard = function() {
  var board = []
  for (var i=0; i<COLUMNS; i++) {
    var column = [];
    for (var j=0; j<ROWS; j++) {
      column.push(null);
    }
    board.push(column);
  }
  return board;
};

var startGame = function() {
  winner = null;
  board = newBoard();
  var leader;
  if (lastPlayerToLead == players[0]) {
    leader = players[1];
  } else if (lastPlayerToLead == players[1]) {
    leader = players[0];
  } else {
    leader = players[Math.floor(Math.random() * players.length)];
  }
  lastPlayerToLead = leader;
  action.player = leader;
  state = STATES.ACTIVE;
};

var checkForEndedGame = function() {
  var numMovesRemaining = 0;
  for (var i=0; i<COLUMNS; i++) {
    for (var j=0; j<ROWS; j++) {
      console.log("check " + i + ", " + j);
      var spot = board[i][j];
      if (!spot) {
        numMovesRemaining++;
        continue;
      }

      if(checkWin(spot, i, j)) {
        state = STATES.ENDED;
        winner = spot;
        action.player = null;
        action.timer = null;
      }
    }
  }

  if ((numMovesRemaining == 0) && (state == STATES.ACTIVE)) {
    state = STATES.ENDED;
    winner = null;
  }
};

var checkWin = function(spot, x, y) {
  return (checkWinLeft(spot, x, y) ||
          checkWinRight(spot, x, y) ||
          checkWinUp(spot, x, y) ||
          checkWinDown(spot, x, y) ||
          checkWinUpLeft(spot, x, y) ||
          checkWinUpRight(spot, x, y) ||
          checkWinDownLeft(spot, x, y) ||
          checkWinDownRight(spot, x, y));
};

var checkWinLeft = function(spot, x, y) {
  if (x < 3) {
    return false;
  }
  for (var i=1; i<4; i++) {
    var newSpot = board[x - i][y];
    if (newSpot != spot) {
      return false;
    }
  }
  return true;
};
var checkWinRight = function(spot, x, y) {
  if (x > 3) {
    return false;
  }
  for (var i=1; i<4; i++) {
    var newSpot = board[x + i][y];
    if (newSpot != spot) {
      return false;
    }
  }
  return true;
};
var checkWinUp = function(spot, x, y) {
  if (y > 2) {
    return false;
  }
  for (var i=1; i<4; i++) {
    var newSpot = board[x][y + i];
    if (newSpot != spot) {
      return false;
    }
  }
  return true;
};
var checkWinDown = function(spot, x, y) {
  if (y < 3) {
    return false;
  }
  for (var i=1; i<4; i++) {
    var newSpot = board[x][y - i];
    if (newSpot != spot) {
      return false;
    }
  }
  return true;
};
var checkWinUpLeft = function(spot, x, y) {
  if ((x < 3) || (y > 2)) {
    return false;
  }
  for (var i=1; i<4; i++) {
    var newSpot = board[x - i][y + i];
    if (newSpot != spot) {
      return false;
    }
  }
  return true;
};
var checkWinUpRight = function(spot, x, y) {
  if ((x > 3) || (y > 2)) {
    return false;
  }
  for (var i=1; i<4; i++) {
    var newSpot = board[x + i][y + i];
    if (newSpot != spot) {
      return false;
    }
  }
  return true;
};
var checkWinDownLeft = function(spot, x, y) {
  if ((x < 3) || (y < 3)) {
    return false;
  }
  for (var i=1; i<4; i++) {
    var newSpot = board[x - i][y - i];
    if (newSpot != spot) {
      return false;
    }
  }
  return true;
};
var checkWinDownRight = function(spot, x, y) {
  if ((x > 3) || (y < 3)) {
    return false;
  }
  for (var i=1; i<4; i++) {
    var newSpot = board[x + i][y - i];
    if (newSpot != spot) {
      return false;
    }
  }
  return true;
};

module.exports = function() {
  return {
    join: function(player, callback) {
      gameSemaphore.take(function() {
        if (!player) {
          gameSemaphore.leave();
          return callback(new Error('No player passed to join'));
        }

        if (players.indexOf(player) != -1) {
          gameSemaphore.leave();
          return callback(new Error('Player (' + player + ') has already joined the game'));
        }

        if (players.length > (MAX_PLAYERS - 1)) {
          gameSemaphore.leave();
          return callback(new Error('This game only supports ' + MAX_PLAYERS + ' players'));
        }

        players.push(player);

        if (players.length == MAX_PLAYERS) {
          startGame();
        }

        gameSemaphore.leave();
        return callback();
      });
    },
    leave: function(player, callback) {
      gameSemaphore.take(function() {
        if (!player) {
          gameSemaphore.leave();
          return callback(new Error('No player passed to leave'));
        }

        var playerIndex = players.indexOf(player);
        if (playerIndex == -1) {
          gameSemaphore.leave();
          return callback(new Error('Player (' + player + ') not found in game'));
        }

        players.slice(playerIndex, 1);

        gameSemaphore.leave();
        return callback();
      });
    },
    play: function(player, column, callback) {
      gameSemaphore.take(function() {
        if (state != STATES.ACTIVE) {
          gameSemaphore.leave();
          return callback(new Error('Game is not active'));
        }

        if (!player) {
          gameSemaphore.leave();
          return callback(new Error('No player passed to play'));
        }

        var playerIndex = players.indexOf(player);
        if (playerIndex == -1) {
          gameSemaphore.leave();
          return callback(new Error('Player (' + player + ') not found in game'));
        }

        if (action.player != player) {
          gameSemaphore.leave();
          return callback(new Error('Player (' + player + ') trying to move out of turn'));
        }

        if (column == null) {
          gameSemaphore.leave();
          return callback(new Error('No column passed to play'));
        }

        if ((column < 0) || (column >= COLUMNS)) {
          gameSemaphore.leave();
          return callback(new Error('Column (' + column + ') out of range'));
        }

        var moveSuccess = false;
        var boardColumn = board[column];
        for (var i=0; i<ROWS; i++) {
          var boardSpot = boardColumn[i];
          if (!boardSpot) {
            boardColumn[i] = player;
            moveSuccess = true;
            break;
          }
        }

        if (!moveSuccess) {
          gameSemaphore.leave();
          return callback(new Error('Can not move in column (' + column + ')'));
        }

        checkForEndedGame();

        if (state == STATES.ACTIVE) {
          action.player = players[(playerIndex + 1) % players.length];
        }

        gameSemaphore.leave();
        return callback();
      });
    },
    reset: function(callback) {
      gameSemaphore.take(function() {
        if (players.length == MAX_PLAYERS) {
          startGame();
        }
        gameSemaphore.leave();
        return callback();
      });
    },
    toJson: function() {
      return {
        players: players,
        board: board,
        action: action,
        state: state,
        winner: winner
      };
    }
  }
};

