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

var Email = "";
var name = "";

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

                if (rows[user].email == userName && rows[user].password == password){
                    
                    //Grabs the email and name to be used in other pages, may add more here later
                    Email = rows[user].email;
                    name = rows[user].first_name;

                    //Determines if user is an admin and if the admin page should load instead
                    if(rows[user].isAdmin == 1){
                        return res.redirect('/adminHomePage');
                    };
                    //if they're not an admin, the user page loads instead
                    return res.redirect('/userHomePage');
                };
            };
            //If the for loop does not find the user, it'll redirect to the login error page
            if(notValid){
                return res.redirect('/loginError');
            };
        });
        connection.releaseConnection(connect);
    });
});

app.post('/addUser', function(req, res){
    var firstName = req.body.fName;
    var lastName = req.body.lName;
    var newEmail = req.body.email;
    var password = req.body.password;
    var ID = req.body.AUID;
    var department = req.body.departments;
    var AUemail = newEmail.slice(-11);
    var AuroraEdu = "@aurora.edu";
    var emailVerify = AuroraEdu.localeCompare(AUemail);
    var values = [
        [ID, firstName, lastName, newEmail, password, 0, department, 0]
    ];

    console.log(emailVerify);

    if(emailVerify != 0){
        return res.redirect('/newUserError');
    };


    connection.getConnection(function(err, connect) {
        if (err) throw err;
        connection.query(`INSERT INTO users (aurora_ID, first_name, last_name, email, password, participant_status, department, isAdmin) VALUES ?`, [values], function (err, rows, fields) {
            if (err) throw err;
        });


        connection.releaseConnection(connect);
    });
    res.redirect('/login');
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

app.get('/newUser', function(req, res){
    res.render('newUser')
});

app.get('/newUserError', function(req,res){
    res.render('newUserError')
});
app.get('/editInfo', function(req,res){
    res.render('editInfo')
});
app.get('/editUsers', function(req,res){
    res.render('editUsers')
});
app.get('/participationStatusPage', function(req,res){
    res.render('participationStatusPage')
});
app.get('/reportsPage', function(req,res){
    res.render('reportsPage')
});

app.listen(3000);