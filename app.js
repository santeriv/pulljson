
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , jquery = require('./routes/jquery')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hbs');
  app.use(express.logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.methodOverride());
  app.use(express.cookieParser('apifythyself'));
  app.use(express.cookieSession({
	key: 'apify.session'
  }));
  app.use(app.router);
  app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/jquery', jquery.fetch);
app.get('/snapshot', jquery.snapshot);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
