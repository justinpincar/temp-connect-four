module.exports = function(App) {
  var exports = {
    root: function(req, res) {
      return res.render('index');
    },
    test: require('./routes/test')(App),
    _bind: function() {
      App.app.get('/', exports.root);

      exports.test._bind();

      App.app.get('*', function(req, res){
        res.status(404);
        return res.render('error/404');
      });
    }
  };
  return exports;
}

