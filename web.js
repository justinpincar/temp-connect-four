var async = require('async');
var express = require('express');
var path = require('path');

var App = {};
App.data = {};

var app = express();
App.app = app;

app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  if (process.env.NODE_ENV !== "production") {
    app.use(express.logger({
      format: 'dev'
    }));
  }

  app.use(express.favicon(__dirname + '/public/favicon.ico'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  if (process.env.NODE_ENV !== "production") {
    app.use(require('stylus').middleware(__dirname + '/public'));
  }
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

var routes = require('./routes')(App);
routes._bind();

app.listen(app.get('port'));
console.log("Server listening for HTTP on port " + app.get('port') + " in " + app.get('env') + " mode");

