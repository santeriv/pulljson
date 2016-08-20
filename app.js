
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , jquery = require('./routes/jquery')
  , http = require('http')
  , https = require('https')
  , fs = require('fs')
  , path = require('path');

var httpPort = process.env.PORT || 3000;
var httpsPort = process.env.HTTPS_PORT || httpPort + 1;
var environment = process.env.NODE_ENV || 'development';
var app = express();

app.configure('production', function(){
  app.enable('trust proxy');//for https which is set to X-Forwarded-Proto request header by Heroku
});
app.configure(function(){
  app.set('port', httpPort);
  app.set('https port', httpsPort);
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
  app.use(require('express-bunyan-logger').errorLogger());
});
/*
app.configure('development', function(){
  app.use(express.errorHandler());
});
*/
app.get('/', routes.index);
app.get('/jquery', jquery.fetch);
app.get('/snapshot', jquery.snapshot);

if(environment === 'development') {
  http.createServer(app).listen(app.get('port'), function(){
    console.log("Http Express server listening on port " + app.get('port'));
  });
}

if(environment === 'production') {
  var certificate_authority = fs.readFileSync( path.join(__dirname, 'sslforfree/ca_bundle.crt') );
  var certificate = fs.readFileSync( path.join(__dirname, 'sslforfree/certificate.crt') );
  var sslPrivateKey = process.env.FREESSL_PRIVATE_KEY || '';
  var options = {ca: certificate_authority, cert: certificate, key: sslPrivateKey};
  https.createServer(options, app).listen(app.get('https port'), function(){
    console.log("Https Express server listening on port " + app.get('https port'));
  });
}
