//export { handleRequest }; 
var Client = require('node-rest-client').Client;
var client = new Client();

const weth ={   "coord":{"lon":-76.73,"lat":39.96},
                "weather":[{"id":801,"main":"Clouds","description":"few clouds","icon":"02d"}],
                "base":"stations",
                "main":{"temp":64.81,"pressure":1023,"humidity":55,"temp_min":62.01,"temp_max":66.99},
                "visibility":16093,
                "wind":{"speed":8.05,"deg":180},
                "clouds":{"all":20},
                "dt":1554653333,
                "sys":{ "type":1,
                        "id":6020,
                        "message":0.0084,
                        "country":"US",
                        "sunrise":1554633693,
                        "sunset":1554680174
                    },
                "id":420032848,
                "name":"York","cod":200
            }


module.exports.handleGetRequest = handleGetRequest;

function handleGetRequest(req, res){
    switch(req.params[0]) {
        case "/school/weatherdata": weather(req, res); break;
        case"/school": res.sendfile( __dirname + "/school.html");  break;

        default:
        console.log('static file request : ' + JSON.stringify(req.params));
        res.sendFile( __dirname + req.params[0]);
        break; 
        // code block
    }
}



function weather(req, res){
    // direct way
    //*
    //res.send("weather")
    res.json(weth);
    return;
    client.get("http://api.openweathermap.org/data/2.5/weather?zip=17401,us&units=imperial&APPID=5a8ffbe9705d8eac8a790c945c2ad46a", function (data, response) {
      // parsed response body as js object
      console.log(data);
      // raw response
      res.json(data);
    });
    //*/
  }