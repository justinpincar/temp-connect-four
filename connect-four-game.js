var prototypes = require('./prototypes');

var semaphore = require('semaphore');

MAX_PLAYERS = 2;
ROWS = 6;
COLUMNS = 7;
SECONDS_PER_TURN = 10;
DELAY_MS = 500;

STATES = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  DELAY: 'delay',
  ENDED: 'ended'
};

var ConnectFourGame = function(notifyUsers, notifyUser) {
  var gameSemaphore = semaphore(1);
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
    resetAndStartActionTimer();
    state = STATES.ACTIVE;
  };

  var endGame = function(tmpWinner) {
    clearInterval(actionTimerInterval);
    state = STATES.ENDED;
    winner = tmpWinner;
    action.player = null;
    action.timer = null;
    notifyUsers(toJson());
  };

  var checkForEndedGame = function() {
    var numMovesRemaining = 0;
    for (var i=0; i<COLUMNS; i++) {
      for (var j=0; j<ROWS; j++) {
        var spot = board[i][j];
        if (!spot) {
          numMovesRemaining++;
          continue;
        }

        if(checkWin(spot, i, j)) {
          endGame(spot);
          return;
        }
      }
    }

    if ((numMovesRemaining == 0) && (state == STATES.ACTIVE)) {
      endGame(null);
      return;
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

  var toJson = function() {
    return {
      players: players,
      board: board,
      action: action,
      state: state,
      winner: winner
    };
  };

  var delay = function(fn) {
    oldAction = action;
    oldState = state;

    action = null;
    state = STATES.DELAY;
    fn();

    setTimeout(function() {
      action = oldAction;
      state = oldState;
      fn();
    }, DELAY_MS);
  };

  var timeout = function() {
    gameSemaphore.take(function() {
      if (!action || !action.timer || (action.timer >= 0)) {
        console.log("Timout triggered, ignoring");
        gameSemaphore.leave();
        return;
      }

      clearInterval(actionTimerInterval);

      var player = action.player;
      var playerIndex = players.indexOfObject('idStr', player.idStr);
      var winner = players[(playerIndex + 1) % players.length];

      endGame(winner);
      gameSemaphore.leave();
    });
  };

  var actionTimerInterval = null;
  var actionTimerIntervalFn = function() {
    if (!action) {
      return;
    }

    action.timer = action.timer - 1;
    if (action.timer < 0) {
      timeout();
    } else {
      notifyUsers(toJson());
    }
  };

  var resetAndStartActionTimer = function() {
    action.timer = SECONDS_PER_TURN;
    actionTimerInterval = setInterval(actionTimerIntervalFn, 1000);
  };

  return {
    join: function(player, callback) {
      gameSemaphore.take(function() {
        if (!player) {
          gameSemaphore.leave();
          return callback(new Error('No player passed to join'));
        }

        if (players.indexOfObject('idStr', player.idStr) != -1) {
          gameSemaphore.leave();
          return callback(new Error('Player (' + player.idStr + ') has already joined the game'));
        }

        if (players.length > (MAX_PLAYERS - 1)) {
          gameSemaphore.leave();
          return callback(new Error('This game only supports ' + MAX_PLAYERS + ' players'));
        }

        players.push(player);

        if (players.length == MAX_PLAYERS) {
          startGame();
        }

        notifyUsers(toJson());
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

        var playerIndex = players.indexOfObject('idStr', player.idStr);
        if (playerIndex == -1) {
          gameSemaphore.leave();
          return callback(new Error('Player (' + player.idStr + ') not found in game'));
        }

        players.slice(playerIndex, 1);

        notifyUsers(toJson());
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

        var playerIndex = players.indexOfObject('idStr', player.idStr);
        if (playerIndex == -1) {
          gameSemaphore.leave();
          return callback(new Error('Player (' + player.idStr + ') not found in game'));
        }

        if (action.player != player) {
          gameSemaphore.leave();
          return callback(new Error('Player (' + player.idStr + ') trying to move out of turn'));
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
            boardColumn[i] = player.idStr;
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
          action.timer = SECONDS_PER_TURN;
        }

        delay(function() { notifyUsers(toJson()) });
        gameSemaphore.leave();
        return callback();
      });
    },
    reset: function(callback) {
      gameSemaphore.take(function() {
        if (players.length == MAX_PLAYERS) {
          startGame();
        }
        notifyUsers(toJson());
        gameSemaphore.leave();
        return callback();
      });
    },
    toJson: toJson
  }
};

module.exports = ConnectFourGame;

