function init(){
    
    var xmlreq = new XMLHttpRequest();
    xmlreq.open("get", "/school/weatherdata");
    //xmlreq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xmlreq.send();

    xmlreq.onload=function(){
        if (this.status==200){
            var data= JSON.parse(this.responseText);
            console.log(data)
            update(data)
        }
    }
}

function update(weather){
    console.log(weather.weather)
    document.body.style.backgroundSize =window.innerWidth+"px "+window.innerHeight+"px"
    switch(weather.weather[0].description) {
        case "few clouds": document.body.style.backgroundImage = "url('/schoolimg/cloudy.jpg')";  break;
        case"clear"     : document.body.style.backgroundImage = "url('school/img/clear.jpg')"; break;

        default:
            break; 
    }
    //document.body.style.backgroundImage = "url('img_tree.png')";
}