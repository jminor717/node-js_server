const express = require('express')
const port = 3000
express.Router.call()
const app = express()

 
//var os = require("os");
//var hostname = os.hostname();


const school = require('./school/school.js')

app.listen(port, function() {
  console.log("Listening on " + port);
});

/* serves main page */
app.get("/", function(req, res) {
  console.log('static file request : ' + JSON.stringify(req.params));
   res.sendfile('index.htm')
});

 app.post("/user/add", function(req, res) { 
 /* some server side logic */
 console.log("/user/add");
 res.send("OK");
 });

/* serves all the static files */
app.get(/^(.+)$/, function(req, res){ 
    //res.json()
    console.log(req.params[0]);
    if(req.params[0].indexOf("/school")==0){
        
        school.handleGetRequest(req, res)
        
    }else{
        switch(req.params[0]) {
            case "/index":  index(req, res); break; 
            case "/mygame": game(req, res); break;  

            default:
            console.log('static file request : ' + JSON.stringify(req.params));
            res.sendFile( __dirname + req.params[0]);
            break; 
            // code block
        }
    }
    

    
});


app.post("/school/weatherdata", function(req, res) { 
    /* some server side logic */
    console.log("/user/add");
    res.send("OK");
    });


function game(req, res){
  console.log('static file request : ' + "/mygame/misc_controls_pointerlock.html");
  res.sendfile( __dirname + "/mygame/misc_controls_pointerlock.html");
}

function index(req, res){
  console.log("index");
  res.json([{name:"dsa"},{val:"ians"}])
}

app.post('/userasyinc', (req, res) => {
  res.json([{name:"dsa"},{val:"ians"}])
  res.end();
})
//(JSON.stringify