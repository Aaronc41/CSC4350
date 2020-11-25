var express = require('express');
var app = express();

//connect to our database
var mysql = require('mysql')
var connection = mysql.createPool({
  connectionLimit: 10,
  host: '45.55.136.114',
  port: '3306',
  user: 'CatalinaDB_F2200',
  password: 'cataDB1',
  database: 'CatalinaDB_F2200'
})

const bodyParser = require('body-parser');
app.use( bodyParser.urlencoded({ extended:true }));

app.set('view engine', 'pug');

app.use(express.static('public'));

//Load login page
app.get('/login', function(req, res){
    res.render( 'loginPage')
});

//Authenticate the user and see if they are admin or not
app.post('/authenticate', function(req, res){
    var userName = req.body.email;
    var password = req.body.password;
    var notValid = true;

    connection.getConnection(function(err, connect) {
        if (err) throw err;
        connection.query('SELECT * FROM users', function (err, rows, fields) {
            if (err) throw err;

            //Goes through all users and finds the right one
            for(var user in rows){
                console.log(rows[user].email + ' ' + rows[user].password);
                if (rows[user].email == userName && rows[user].password == password){
                    //Determines if user is an admin and if the admin page should load instead
                    console.log("found user");
                    if(rows[user].isAdmin == 1){
                        return res.redirect('/adminHomePage');
                    };
                    //if they're not an admin, the user page loads instead
                    return res.redirect('/userHomePage');
                };
            };
            if(notValid){
                return res.redirect('/loginError');
            };
        });
        connection.releaseConnection(connect);
    });
});

app.get('/loginError', function(req, res){
    res.render('loginError')
});

app.get('/userHomePage', function(req, res){
    res.render('userHomePage')
});

app.get('/adminHomePage', function(req, res){
    res.render('adminHomePage')
});

app.listen(3000);