module.exports = function(App) {
  var exports = {
    asyncError: function(req, res, next) {
      setTimeout(function() {
        return next(new Error("This is an async test error."));
      }, 100);
    },
    error: function(req, res, next) {
      return next(new Error("This is a test error."));
    },
    error404: function(req, res, next) {
      return res.render('error/404');
    },
    error500: function(req, res, next) {
      return res.render('error/500');
    },
    healthcheck: function(req, res, next) {
      return res.send("OK");
    },
    styles: function(req, res, next) {
      return res.render('test/styles');
    },
    _bind: function() {
      App.app.get('/healthcheck', exports.healthcheck);
      App.app.get('/test/async-error', exports.asyncError);
      App.app.all('/test/error', exports.error);
      App.app.all('/test/styles', exports.styles);
      App.app.all('/test/404', exports.error404);
      App.app.all('/test/500', exports.error500);
    }
  }
  return exports;
}

