module.exports = function(App) {
  var exports = {
    connectFour: function(req, res, next) {
      return res.render('games/connect-four');
    },
    _bind: function() {
      App.app.get('/games/connect-four', exports.connectFour);
    }
  }
  return exports;
}

