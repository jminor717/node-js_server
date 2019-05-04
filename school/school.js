//export { handleRequest }; 
var Client = require('node-rest-client').Client;
var client = new Client();

// Writing...
var fs = require("fs");
var myJson = {
    key: "myvalue"
};



const weth = {
    "coord": { "lon": -76.73, "lat": 39.96 },
    "weather": [{ "id": 801, "main": "Clouds", "description": "few clouds", "icon": "02d" }],
    "base": "stations",
    "main": { "temp": 64.81, "pressure": 1023, "humidity": 55, "temp_min": 62.01, "temp_max": 66.99 },
    "visibility": 16093,
    "wind": { "speed": 8.05, "deg": 180 },
    "clouds": { "all": 20 },
    "dt": 1554653333,
    "sys": {
        "type": 1,
        "id": 6020,
        "message": 0.0084,
        "country": "US",
        "sunrise": 1554633693,
        "sunset": 1554680174
    },
    "id": 420032848,
    "name": "York", "cod": 200
}
var forc = require("../acufor.json");
var owo = require("../acunow.json");
var wet = { now: owo, forcast: forc }

module.exports = {
    handleGetRequest: function (req, res) {
        handleGetRequest(req, res);
    },
    handlepostRequest: function (req, res) {
        handlepostRequest(req, res);
    }
}

//module.exports.handleGetRequest = handleGetRequest;
//module.exports.handlepostRequest = handlepostRequest;

function handleGetRequest(req, res) {
    switch (req.params[0]) {
        case "/school/weatherdata": weather(req, res); break;
        case "/school": res.sendfile(__dirname + "/school.html"); break;

        default:
            //console.log('static file request : ' + JSON.stringify(req.params));
            res.sendFile(__dirname + req.params[0]);
            break;
        // code block
    }
}



function weather(req, res) {
    //res.json(wet);
    //return;
    var holo = {}
    try {
        //holo=fs.readFileSync("../cur.json");
        holo= fs.readFileSync("cur.json");
        holo=JSON.parse(holo, "utf8")
    }catch (err){
        console.log(err)
    }
    //console.log(holo)
    var zeroTwo = new Date()
    var ins = 0;
    var dat = {}
    //http://api.openweathermap.org/data/2.5/weather?zip=17401,us&APPID=5a8ffbe9705d8eac8a790c945c2ad46a
    if (expired(holo.now)) {
        client.get("http://dataservice.accuweather.com/currentconditions/v1/330294?apikey=gJAAT6UN4T6UeYf40egAUDDGHYpxwL8B&language=en-us&details=true", function (data, response) {
            console.log(data);
            dat["now"] = {};
            dat["now"] = data[0]; ins++;
            dat.now.experation = zeroTwo.getTime() + (45 * 60000);//set experation for 45 mins from now
            console.log(dat.now.experation)
            if (zeroTwo.getHours() > 22 || zeroTwo.getHours() < 8) {//if during off hours , extend exiration time
                dat.now.experation += (30 * 60000);
            }
            sed(dat, ins)
        });
    } else { ins++; dat["now"] = holo.now; sed(dat, ins); }

    //http://api.openweathermap.org/data/2.5/forecast?zip=17401,us&APPID=5a8ffbe9705d8eac8a790c945c2ad46a
    if (expired(holo.forcast)) {
        client.get("http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/330294?apikey=gJAAT6UN4T6UeYf40egAUDDGHYpxwL8B&language=en-us&details=true&metric=true", function (data, response) {
            console.log(data);
            dat["forcast"] = {}
            dat.forcast.arr = data; ins++;
            dat.forcast.experation = zeroTwo.getTime() + (420 * 60000);
            console.log(dat.forcast.experation)
            sed(dat, ins)
        });
    } else { ins++; dat["forcast"] = holo.forcast; sed(dat, ins); }

    function sed(datas, i) {
        if (i == 2) {
            //console.log(JSON.stringify(datas))
            //console.log(datas)
            //console.log(datas.now.experation)
            //console.log(datas.forcast.experation)
            fs.writeFile("cur.json", JSON.stringify(datas), "utf8", callback);
            res.json(datas);
        }
    }
    //*/
}


function expired(rei) {
    //console.log(new Date(rei.experation))
    //console.log(new Date())
    if (rei!=null){
        if ("experation" in rei) {
            var now = new Date().getTime()
            //console.log("here")
            if (rei.experation < now) {
                //console.log("herenpoew")
                return true
            } else return false
        } else throw "improperly formated object " + JSON.stringify(rei)
    }
}


function handlepostRequest(req, res) {

}



function callback() {//callback required for async file writes. maby do something?
    //console.log("reusnhoj")
}
