var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser')
var path = require('path');

function startServer(config){
    app.use(express.static(path.join(__dirname, '../public')));    
    
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    
    var port = process.env.PORT || config.listenPort || 8080;
    app.use(express.static(config.publicDir));
    app.use(require('./middleware/configMiddleware')(config));
    app.use(require('./routes'));
    
    console.log('REST API is listening on port ' + port);
    return app.listen(port);
}

module.exports = {
    start: startServer
}