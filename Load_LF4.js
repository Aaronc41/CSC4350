var express = require('express');
var nodemailer = require('nodemailer');
var app = express();
//use middleware to serve static files
app.use(express.static('public'));

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

console.log("Connected");

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
var isLeader = false;
var meetingTable = '';
var userTable = '';
var successfulMeetings = 0;
var unsuccessfulMeetings = 0;
var pendingMeetings = 0;
var groups = [];
var allUsers = [];
var meetingIDs = [];



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

//On the 15th of each month, it will create new meetings
if(currentDate == 15){
    resetLeaders();
    createGroups();
}

//Grabs the meeting and user tables from the DB for reporting
getMeetingsTable();

getUsersTable();


//Load login page
app.get('/login', function(req, res){
    Email = '';
    isLeader = false;
    res.render('loginPage');
});

//Authenticate the user and see if they are admin or not
app.post('/authenticate', function(req, res){
    authenticateUser(req, res);
});

app.post('/changeParticipationStatus', function(req, res){
    changeParticipationStatus(req, res);
   // changeParticipationNotes(req, res);
});
//app.post('/changeParticipationNotes', function(req, res){
 //   changeParticipationNotes(req, res);
//});


//Adds user from sign up page
app.post('/addUser', function(req, res){
    addUser(req, res);
});
app.post('/editUser', function(req, res){
    editUser(req, res);
});

app.post('/adminEditUser', function(req, res){
    adminEditUser(req, res);
});

app.get('/loginError', function(req, res){
    res.render('loginError')
});

app.get('/userHomePage', function(req, res){
    if(isLeader){
        var leaderTab = '<a class="list-group-item list-group-item-action bg-light" href="/leaderPage">Leadership</a>';
    }
    res.render('userHomePage', {leaderTab});
});

app.get('/adminHomePage', function(req, res){
    if(isLeader){
        var leaderTab = '<a class="list-group-item list-group-item-action bg-light" href="/leaderPage">Leadership</a>';
    }
    res.render('adminHomePage', {leaderTab});
});

app.get('/leaderPage', function(req,res){
    res.render('leaderPage');
})

app.get('/newUser', function(req, res){
    res.render('newUser')
});

app.get('/newUserError', function(req,res){
    res.render('newUserError')
});
app.get('/error', function(req,res){
    res.render('error')
});

app.get('/userEditInfo', function(req,res){
    res.render('userEditInfo')
});
app.get('/adminEditUsers', function(req,res){
    res.render('adminEditUsers')
});
app.get('/landing', function(req,res){
    res.render('landing')
});
app.get('/adminAddUsers', function(req,res){
    res.render('adminAddUsers')
});

app.get('/reportsMeetingPage', function(req,res){
    res.render('reportsMeetingPage', {meetingTable, unsuccessfulMeetings, successfulMeetings, pendingMeetings})
});

app.get('/reportsUserPage', function(req,res){
    res.render('reportsUserPage', {userTable})
});

app.get('/participationPage', function(req,res){
    res.render('participationPage')
});

app.get('/confirmationParticipation', function(req,res){
    res.render('confirmationParticipation');
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
        return res.redirect('/login');
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
// Edit user
function editUser(req, res){
    var firstName = req.body.fName;
    var useremail = Email;
    var lastName = req.body.lName;
    var editThis = req.body.toEdit;
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
        return res.redirect('/error');
    };


    connection.getConnection(function(err, connect) {
        if (err) throw err;
        var query = 'UPDATE users SET aurora_ID = ?, first_name = ?, last_name = ?, email = ?, department = ?, password = ? WHERE email = ?';
        connection.query(query,[ID, firstName, lastName, useremail, department, password, useremail], function (err,result, rows, fields) {
            if (err) throw err;
        });

        connection.releaseConnection(connect);

    });
    res.redirect('/userHomePage');
}


//searching and editing a user
function adminEditUser(req, res){
    var firstName = req.body.fName;
    var useremail = req.body.editthisemail;
    var lastName = req.body.lName;
    var editThis = req.body.toEdit;
    var newEmail = req.body.email;
    var password = req.body.password;
    var ID = req.body.AUID;
    var department = req.body.departments;
    

    connection.getConnection(function(err, connect) {
        if (err) throw err;
        var query = 'UPDATE users SET aurora_ID = ?, first_name = ?, last_name = ?, email = ?, department = ?, password = ? WHERE email = ?';
        connection.query(query,[ID, firstName, lastName, useremail, department, password, editThis], function (err,result, rows, fields) {
            if (err) throw err;
        });

        connection.releaseConnection(connect);

    });
    res.redirect('/landing');
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

                    if(rows[user].isLeader == 1){
                        isLeader = true;
                    }

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

function getMeetingsTable(){
    connection.getConnection(function(err, con){
        if(err) throw err;
          console.log('connected to meetings');
        connection.query('select * from meetings', function(err, res, cols){
          if(err) throw err;
    
          console.log('going through meetings now');
          for(var i=0; i<res.length; i++){
            meetingTable +='<tr><td>'+ res[i].meeting_Id +'</td><td>'+ res[i].meeting_location +'</td><td>'+ res[i].meeting_date +'</td>'
            meetingTable +='<td>'+ res[i].leader +'</td><td>'+ res[i].comments +'</td></tr>';

            if(res[i].didMeet == 0)
            {
                unsuccessfulMeetings += 1;
            }
            else if(res[i].didMeet == 2)
            {
                successfulMeetings += 1;
            }
            else
            {
                pendingMeetings += 1;
            }

          }
          connection.releaseConnection(con);
          
          meetingTable ='<table border="1" class="meetingTable"><tr><th>Meeting Number</th><th>Meeting Location</th><th>Meeting Date</th><th>Leader</th><th>Comments</th></tr>'+ meetingTable +'</table>';
        });
    });
}

function getUsersTable(){
    connection.getConnection(function(err, con){
        if(err) throw err;
          console.log('connected to users');
        connection.query('select * from users', function(err, res, cols){
          if(err) throw err;
    
          console.log('going through users now');
          for(var i=0; i<res.length; i++){
            userTable +='<tr><td>'+ res[i].aurora_ID +'</td><td>'+ res[i].first_name + ' ' + res[i].last_name +'</td><td>'+ res[i].email +'</td>'
            userTable +='<td>'+ res[i].department +'</td></tr>';
          }
          connection.releaseConnection(con);
    
          userTable ='<table border="1" class="userTable"><tr><th>Aurora ID</th><th>Name</th><th>Email</th><th>Department</th></tr>'+ userTable +'</table>';
        });
    });
}

function changeParticipationStatus(req, res){
    //need to add code to connect to DB and table
    var userName = Email;
    var p_status = req.body.status;
    //var p_comments = req.body.comments
    //console.log(p_status);
    //console.log(p_comments);
    connection.getConnection(function(err, connect) {
        if (err) throw err;
        connection.query('SELECT * FROM users', function (err, rows, fields) {
            if (err) throw err;

            //console.log(p_status);
            //console.log(userName);
            if(p_status == '0'){
                //Goes through all users and finds the right one
                for(var user in rows){

                    if (rows[user].email == userName){
                    
                        //Checks if it is for the current user logged in
                        connection.query('UPDATE users SET participant_status = ' + '0' + ' WHERE email = "' + userName + '"', function(err, result){
                                res.redirect('/confirmationParticipation');
                        });
                        

                    //if they're not an admin, the user page loads instead
                    };
                };
            }
            else if(p_status == '1'){
                for(var user in rows){
                    if (rows[user].email == userName){
                        console.log("Changing status")

                        connection.query('UPDATE users SET participant_status = ' + '1' + ' WHERE email = "' + userName + '"', function(err, result){
                            return res.redirect('/confirmationParticipation');
                        });
                    };
                }
            }   
        });
        connection.releaseConnection(connect);
    });
}

/*function changeParticipationNotes(req, res){
    //need to add code to connect to DB and table
    var userName = Email;
    var p_comments = req.body.comments
    var runnable = true;
    console.log("In function");
    console.log(userName);
    connection.getConnection(function(err, connect) {
        if (err) throw err;
        connection.query('SELECT * FROM users', function (err, rows, fields) {
            if (err) throw err;

            //console.log(p_status);
            console.log(userName);
            if(runnable = true){
                //Goes through all users and finds the right one
                for(var user in rows){

                    if (rows[user].email == userName){
                    
                        connection.query('UPDATE users SET partNotes = '+ p_comments +' WHERE email="'+userName+'"', function(err, result){
                            console.log("worked");
                            console.log(p_comments);
                            console.log(Email);
                            console.log('Rows affected:');
                            //return res.redirect('/confirmationParticipation');
                            });
                    };
                };
            }
        });
        connection.releaseConnection(connect);
    });
}*/

//Create groups on the 15th of each month
function createGroups() {
    connection.getConnection(function(err, con){
        if(err) throw err;

        //Clears out meetings from last month
        connection.query('DELETE FROM meetings;');

        //Grabs all users and sets them into an array for sorting and randomization
        connection.query('select * from users;', function(err, rows, cols){
            if(err) throw err;
            for(var users in rows){
                allUsers.push(rows[users].email);
            }

            //Randomizes here
            shuffle(allUsers);

            //Finds total number of meetings for the month by finding out how many users are available,
            //then dividing them by the max group size (5 in this case). It then rounds up to the nearest
            //number, which should always give us the proper total number of meetings for each month 
            var userCount = allUsers.length;
            var totalMeetings = Math.ceil(userCount/5);

            //Creates the meetings
            for(var i = 0; i < totalMeetings; i++){
                connection.query('INSERT INTO meetings(meeting_Id, didMeet) VALUES (0, 1);');
            }   

            //Divides up all users into seperate arrays where the max size is the total number of meetings
            while(allUsers.length > 0){
                groups.push(allUsers.splice(0, totalMeetings));
            }

            //Grabs all the new meeting IDs that were just created and throws them into an array
            connection.query('SELECT * FROM meetings', function(err, rows, cols){
                if(err) throw err;
                for(var meets in rows){
                    meetingIDs.push(rows[meets].meeting_Id);
                }

                //Use a nested for loop to go through each of the seperated arrays. Assigns all the users
                //from the first array into participant1, then assigns all from the second array into
                //participant2 etc. until the whole table is properly populated and no group is below or
                //above the required amount of members
                for(var i = 0; i < groups.length; i++){
                    for(var j = 0; j < groups[i].length; j++){
                        var participant = groups[i][j];
                        var participantNumber = i + 1;
                        connection.query('UPDATE meetings SET participant' + participantNumber + ' = "' + participant + '" WHERE meeting_Id=' + meetingIDs[j] +';');
                    }
                }

                //Finds the leader for each meeting randomly
                connection.query('SELECT * FROM meetings', function(err, rows, cols){
                    if(err) throw err;
                    for(var meets in rows){
                        var leaderAssign = [];
                        leaderAssign.push(rows[meets].participant1);
                        leaderAssign.push(rows[meets].participant2);
                        leaderAssign.push(rows[meets].participant3);
                        if(rows[meets].participant4 != null){
                            leaderAssign.push(rows[meets].participant4);
                        }
                        if(rows[meets].participant5 != null){
                            leaderAssign.push(rows[meets].participant5);
                        }
                        var leader = leaderAssign[Math.floor(Math.random() * leaderAssign.length)];

                        connection.query('UPDATE meetings SET leader = "' + leader + '" WHERE participant1 = "' + leaderAssign[0] + '";');
                        connection.query('UPDATE users SET isLeader = 1 WHERE email = "' + leader + '";');
                    }
                })
            })
        });
    });
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
  }

  function resetLeaders(){
      connection.getConnection(function(err, con){
          if(err) throw err;
        connection.query('SELECT * FROM users', function(err, rows, cols){
            if(err) throw err;
            
            for(var user in rows){
                var Email = rows[user].email;
                connection.query('UPDATE users SET isLeader = 0 WHERE email = "' + Email + '";');
            }

        });
        connection.releaseConnection(con);
      });
      
  }