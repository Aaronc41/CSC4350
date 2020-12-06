var express = require('express');
var nodemailer = require('nodemailer');
var app = express();
var usersArray = [];

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

//Set up mailing
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'lunchforfour@gmail.com',
      pass: 'aurora23!'
    }
  });

var currentDate = new Date().getDate();
var Email = "";
var name = "";

const bodyParser = require('body-parser');
app.use( bodyParser.urlencoded({ extended:true }));

app.set('view engine', 'pug');

app.use(express.static('public'));

//Monthly check for participants to email (DO NOT UNCOMMENT, YOU COULD SEND ACCIDENTAL EMAILS TO PEOPLE)
/*
if(currentDate == 1){
    emailMonthly();
}
*/


//Load login page
app.get('/login', function(req, res){
    res.render( 'loginPage')
});

//Authenticate the user and see if they are admin or not
app.post('/authenticate', function(req, res){
    authenticateUser(req, res);
});

//Adds user from sign up page
app.post('/addUser', function(req, res){
    addUser(req, res);
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
app.get('/userEditInfo', function(req,res){
    res.render('userEditInfo')
});
app.get('/adminEditUsers', function(req,res){
    res.render('adminEditUsers')
});
app.get('/reportsPage', function(req,res){
    res.render('reportsPage')
});
app.get('/participationPage', function(req,res){
    res.render('participationPage')
});

app.listen(3000);

//All functions go here
//Checks for active participants and emails them at the 1st of every month
function emailMonthly(){

    connection.getConnection(function(err, connect) {
        if (err) throw err;
        connection.query('SELECT * FROM users', function (err, rows, fields) {
            if (err) throw err;

            var mailOptions = {
                from: 'lunchforfour@gmail.com',
                to: rows[user].email,
                subject: 'Monthly Reminder from Lunch For Four',
                text: 'We are reminding you that you have a meeting sometime this month. Please log in to check times and if you need to suspend. Thank you for using Lunch For Four!'
              };

            for(var user in rows){
                if(rows[user].participant_status == 1){
                    transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                          console.log(error);
                        } else {
                          console.log('Email sent: ' + info.response);
                        }
                    });
                }
            }
        });
    connection.releaseConnection(connect);
    });
}

//Code for adding a user to the DB from the sign up page
function addUser(req, res){
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
}

//Code for authenticating user
function authenticateUser(req, res){
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
}

//code for creating groups 
function createGroup(req, res){
    
    connection.getConnection(function(err, connect) {
        if(err) throw err;
        connection.query('SELECT * FROM users', function (err, rows, fields) {
            if (err) throw err;

            for (var users in rows) {
                usersArray.push(rows[users].email)
                
            }

            var length = usersArray.length();
            var totalMeetings =  Math.ceil(length/5);
        
            for (var i = 0; i < totalMeetings; i++) {
                connection.query('INSERT INTO meetings(meeting_id, didMeet) VALUES(0, 1)', function (err, rows, fields) {
                    if (err) throw err;
                    
                })
            }
    })
    
}