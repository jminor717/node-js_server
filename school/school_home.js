function init() {
    getweather()
}

function getweather(){
    var xmlreq = new XMLHttpRequest();
    xmlreq.open("get", "/school/weatherdata");
    xmlreq.send();
    xmlreq.onload = function () {
        if (this.status == 200) {
            var data = JSON.parse(this.responseText);
            console.log(data)
            update(data)
        }
    }
}

function update(weather) {
    document.getElementById("currentWeather").innerHTML=""
    document.getElementById("weatherForcast").innerHTML=""
    //document.getElementById("weather").innerHTML=JSON.stringify(weather)
    //console.log(weather)
    //document.body.style.backgroundSize =window.innerWidth+"px "+window.innerHeight+"px"
    //return; Rain  Light rain
    switch (weather.now.WeatherText) {
        case "Cloudy": document.getElementById("weather").style.backgroundImage = "url('/schoolimg/cloudy.jpg')"; //document.body.style.backgroundImage = "url('/schoolimg/cloudy.jpg')";  
            break;
        case "Clear": document.getElementById("weather").style.backgroundImage = "url('/schoolimg/clear.jpg')";     break;
        case "Rain": document.getElementById("weather").style.backgroundImage = "url('/schoolimg/rain.jpg')";     break;
        case "Light rain": document.getElementById("weather").style.backgroundImage = "url('/schoolimg/rain.jpg')";     break;
        case "Thunderstorm": document.getElementById("weather").style.backgroundImage = "url('/schoolimg/rain.jpg')";     break;
        default:
            break;
    }
    var toAdd = document.createDocumentFragment();
    document.getElementById("weather").style.width = window.innerWidth + "px";
    document.getElementById("weather").style.height = window.innerHeight + "px";
    document.getElementById("weatherBackground").style.width = window.innerWidth + "px";
    document.getElementById("weatherBackground").style.height = window.innerHeight + "px";
    //temp.class
    //temp.id=chat[i].usid;
    var temp = document.createElement('div');
    temp.className = 'location';
    temp.innerHTML = "york"
    toAdd.appendChild(temp)
    temp = document.createElement('div');
    temp.className = 'weather_descript';
    temp.innerHTML = weather.now.WeatherText;
    toAdd.appendChild(temp)
    temp = document.createElement('div');
    temp.className = 'temprit';
    temp.innerHTML = (weather.now.Temperature.Metric.Value).toFixed(2) + "°C";
    toAdd.appendChild(temp)
    temp = document.createElement('div');
    temp.className = 'temprit';
    temp.innerHTML = (weather.now.Temperature.Metric.Value + 273.15).toFixed(2) + "°K";
    toAdd.appendChild(temp)



    document.getElementById("currentWeather").appendChild(toAdd);


    toAdd = document.createDocumentFragment();

    var rain=false,snow=false,ice=false;
    //console.log(weather.forcast.arr.length)
    var d=new Date()
    //console.log(weather.forcast)
    weather.forcast.arr.forEach(function (element) {
        //console.log(new Date(element.EpochDateTime * 1000).toString());
        if(element.Rain.Value>0){rain=true;}
        else if (element.Snow.Value>0){snow=true;}
        else if (element.Ice.Value>0){ice=true;}
        //console.log(element.Rain.Value+" "+element.Snow.Value+" "+element.Ice.Value )
    });
    var total =8;
    for (var i = 0; i < total; i++) {
        if (i>=weather.forcast.arr.length-1){
            break;
        }
        var element = weather.forcast.arr[i];
        var timee=new Date(element.EpochDateTime* 1000)
        //console.log((d.getTime()))
        if(timee<d.getTime()){
            total++;
            continue;
        }
        container = document.createElement('div');
        //container.innerHTML = (element.Temperature.Value).toFixed(2) + "°C"
        container.className = 'forcastContainer';
        container.style.width=(window.innerWidth/9)+"px"
        //var timee=new Date((element.EpochDateTime)-(d.getTimezoneOffset())* 1000)
         //timee=(element.EpochDateTime)-(d.getTimezoneOffset())
         //(element.EpochDateTime* 1000)-(d.getTimezoneOffset()* 1000)

        //console.log(new Date(element.EpochDateTime *1000))
            temp = document.createElement('div');
            var str=timee.toDateString();
            temp.innerHTML = str.substring(0,str.length-5);
            container.appendChild(temp)

            temp = document.createElement('div');
            temp.innerHTML = timee.getHours()+":00";
            container.appendChild(temp)

            temp = document.createElement('div');
            temp.innerHTML = (element.Temperature.Value).toFixed(2) + "°C";
            container.appendChild(temp)

            temp = document.createElement('div');
            temp.innerHTML = (element.Wind.Speed.Value)+" "+ element.Wind.Speed.Unit+" "+element.Wind.Direction.English;
            container.appendChild(temp)



        if(rain){
            temp = document.createElement('div');
            temp.innerHTML = "Rain "+element.Rain.Value+" "+ element.Rain.Unit;
            container.appendChild(temp)
            temp = document.createElement('div');
            temp.innerHTML = "     "+element.RainProbability+"%";
            temp.style.textIndent="2em";
            container.appendChild(temp)
        }
        if(snow){
            temp = document.createElement('div');
            temp.innerHTML = "Snow "+element.Snow.Value+" "+ element.Snow.Unit;
            container.appendChild(temp)
            //SnowProbability
        }
        if(ice){
            temp = document.createElement('div');
            temp.innerHTML = "Ice "+element.Ice.Value+" "+ element.Ice.Unit;
            container.appendChild(temp)
            //IceProbability
        }

        toAdd.appendChild(container)
    }

    document.getElementById("weatherForcast").appendChild(toAdd);
    //document.getElementById("currentWeather").innerHTML += "<br>"+weather.main.temp+"°C";
    //document.body.style.backgroundImage = "url('img_tree.png')";
}

function refresh() {
    getweather()
    //document.getElementById("weather").style.backgroundImage = "url('/schoolimg/rain.jpg')"


}
function resh() {
    //console.log("oeruvns")
    //document.getElementById("weatherBackground").style.left=window.innerWidth+"px";

}

setInterval(refresh, 1770130);//update every 30 minutes

setInterval(resh, 6000);



/**
var style=document.createElement('style');
style.type='text/css';
if(style.styleSheet){
    style.styleSheet.cssText='your css styles';
}else{
    style.appendChild(document.createTextNode('your css styles'));
}
document.getElementsByTagName('head')[0].appendChild(style);
 */