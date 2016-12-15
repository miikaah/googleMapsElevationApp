// Port for hosting
var PORT = 4000;

var express = require('express'),
    app = express(),
    router = express.Router();

app.use(router);
app.use(express.static(__dirname + '/app'));  // Route for a static folder
app.listen(PORT);
console.log('Serving on port: ' + PORT);

// Route that binds all routes to send the index.html
// Causes "DevTools failed to parse SourceMap" warning in Chrome
app.all('/*', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});



