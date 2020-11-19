var express = require('express');
var app = express();
app.set('view engine', 'pug');

app.use(express.static('public'));

app.get('/', function(req, res){
    res.render( 'homePage')
});

app.get('/testHomePage', function(req, res){
    res.render('testHomePage')
});

const bodyParser = require('body-parser');
app.use( bodyParser.urlencoded({ extended:true }));

app.listen(3000);