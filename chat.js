	


		var currentchat="general";
		var chakvisable= true;
		//var acountoptionsvisible = false;
		//var loginvisable = false;
		//var ussing  = "${ user.username    }";
		//var isguest='${user.isguest}';
		
		var chat;
		var chatedc;
		
	    var	count =11;
		var previousheight;
		var scroleposition;
		
		///////////start chat
		function  toggleuserchats(inn){
			if(inn==true){
				document.getElementById("userchats").style.display = "inline";
			}
			else{
				document.getElementById("userchats").style.display = "none";
			}
			
			
		}
		
		
		document.onload = function(){

			//post();
			//getusechats();
		}
		
		function togglechat(){
			
			if(chakvisable){
				document.getElementById("chatwindow").style.width = "0px";
				document.getElementById("showchatbutt").style.visibility ="visible";
				document.getElementById("featuredgames").style.marginRight="0px";
				chakvisable=false;
			}
			else{
				document.getElementById("chatwindow").style.width = "300px";
				document.getElementById("showchatbutt").style.visibility ="collapse";
				document.getElementById("featuredgames").style.marginRight="300px";
				chakvisable=true;
			}
			
			
		}
		
		
		function post(){
			console.log("iohvn")
			 var urlEncodedData = "";
			var urlEncodedDataPairs = [];
			var text = document.getElementById("chattextarea").value;
			var chatedc;
			document.getElementById("chattextarea").value='';
			
			urlEncodedDataPairs.push(encodeURIComponent("chatinputtext") + '=' + encodeURIComponent(text));
			urlEncodedDataPairs.push(encodeURIComponent("numberofpost") + '=' + encodeURIComponent(count));
			urlEncodedDataPairs.push(encodeURIComponent("getmoreposts") + '=' + encodeURIComponent(false));
			urlEncodedDataPairs.push(encodeURIComponent("isasync") + '=' + encodeURIComponent(true));
			urlEncodedDataPairs.push(encodeURIComponent("chatname") + '=' + encodeURIComponent(currentchat));
			
			 urlEncodedData = urlEncodedDataPairs.join('&').replace(/%20/g, '+');
			 
			 
			 
			 var xmlreq = new XMLHttpRequest();
			 xmlreq.open("post", "index");
				xmlreq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
				xmlreq.send(urlEncodedData);
			 
			 
				xmlreq.onreadystatechange = function() {
			        if (this.readyState == 4 && this.status == 200) {
			        	chatedc= JSON.parse(this.responseText);
			        	refreshchat(chatedc);
			        	
			       }
			    };

		}
		
		function get(){
			var xmlreq = new XMLHttpRequest(); 
			//xmlreq.open('get','index'+ encodeURIComponent(ussing),true);
			xmlreq.send();
			
			xmlreq.onload=function(){
				if (this.status==200){
					
				
				}
			}
			refreshchat(null);
			 
			
		}
		
		function refreshchat(chats){
			
			previousheight=document.getElementById('chattext').scrollHeight;
			scroleposition =previousheight-document.getElementById('chattext').scrollTop;
			//scroleposition =window.pageYOffset;
			//chat=${chatposts};
			
			//console.log(scroleposition);
			
			if(chats!=null){
				chat=chats;
				//console.log(chat);
			}
			
		
		//	console.log("${ user.username    }");
		
			  count = Object.keys(chat).length;
			  //console.log(count);
			
			
			
			var previousposts = document.getElementById('chattext').innerHTML;
			document.getElementById("chattext").innerHTML = "";
			var toAdd = document.createDocumentFragment();
			
			var neHr = document.createElement('hr');
			var newbutt = document.createElement('button');
			newbutt.innerHTML="show more posts";
			newbutt.id="morepostsbutt";
			 toAdd.appendChild(newbutt);
			 toAdd.appendChild(neHr);
			
			
			
			
			for(var i=0; i < chat.length; i++){
			   var newDiv = document.createElement('p');
			   var newHr = document.createElement('hr');
			   var newP = document.createElement('p');
			   var time= new Date();
			   var now = time.getTime();

			   
			   var posttext=chat[i].post;
			   //console.log(posttext);
			   var username=chat[i].user;
			   newP.id=chat[i].usid;
			   username+=" ";
			   var posttime=chat[i].mit;
			   now-=posttime;
			   if(now<60000){
				   now=now/1000
				   now= Math.floor(now);
				   username+=now;
				   username+=" seconds agao"  
			   }
			   else if(now<3600000){
				   now=now/60000
				   now= Math.floor(now);
				   username+=now;
				   username+=" minutes agao"
			   }
			   else if(now<86400000){
				   now=now/3600000
				   now= Math.floor(now);
				   username+=now;
				   username+=" hours agao"
			   }
			   else if(now<(86400000*365)) {
				   now=now/86400000;
				   now= Math.floor(now);
				   username+=now;
				   username+=" days agao"
			   }
			   else {
				   now=now/(86400000*365)
				   now= Math.floor(now);
				   username+=now;
				   username+=" years agao"  
			   }
			
			   //newDiv.id = 'r'+i;
			   newDiv.className = 'chatentry';
			   newP.className='chatheader';
			   if(chat[i].guest){
				   newP.onclick = function() { 
					   otheruseroptions(event, true ,this.id,true);
				   };
			   }
			   else{
				   newP.onclick = function() { 
					   otheruseroptions(event, true ,this.id,false);
				   };
			   }
			   
			   newDiv.innerHTML = posttext;
			   newP.innerHTML = username;
			   toAdd.appendChild(newP);
			   toAdd.appendChild(newDiv);
			   toAdd.appendChild(newHr);
			}
			//toAdd.appendChild(previousposts);
			document.getElementById("chattext").appendChild(toAdd);
			//document.getElementById("chattext").appendChild(previousposts);
			
			
			var element = document.getElementById("chattext");
			var currentscroleheight=document.getElementById('chattext').scrollHeight;
			if(currentscroleheight-previousheight>100)
				element.scrollTo(0, currentscroleheight-previousheight);
			else{
				element.scrollTo(0, currentscroleheight-scroleposition);
				//element.scrollTo(0, scroleposition);
			}
			//element.scrollTop = element.scrollHeight;
			document.getElementById("morepostsbutt").onclick = function(){
				console.log("sup");
				
				var urlEncodedData = "";
				var urlEncodedDataPairs = [];
				
				
				
				urlEncodedDataPairs.push(encodeURIComponent("numberofpost") + '=' + encodeURIComponent(count));
				urlEncodedDataPairs.push(encodeURIComponent("getmoreposts") + '=' + encodeURIComponent(true));
				urlEncodedDataPairs.push(encodeURIComponent("isasync") + '=' + encodeURIComponent(true));
				urlEncodedDataPairs.push(encodeURIComponent("chatname") + '=' + encodeURIComponent(currentchat));
				
				 urlEncodedData = urlEncodedDataPairs.join('&').replace(/%20/g, '+');
				
				
				var xmlreq = new XMLHttpRequest();
				xmlreq.open("post", "index");
				xmlreq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
				xmlreq.send(urlEncodedData);
					
				xmlreq.onload=function(){
					if (this.status==200){
						//console.log(this.response);
						chatedc= JSON.parse(this.responseText);
						console.log(chatedc)
						refreshchat(chatedc);
					}
				}
				
			};
		}
		
		function newchat(thisbut, chatname){
			currentchat=chatname;
			var chattabs = document.getElementsByClassName("swithchchatactive");
		    for (i = 0; i < chattabs.length; i++) {
		    	chattabs[i].className = chattabs[i].className="swithchchat";
		    	console.log(i);
		    }
		    //document.getElementById(chatname).style.display = "block";
		    thisbut.currentTarget.className += "active";
		    
		    var urlEncodedData = "";
			var urlEncodedDataPairs = [];
			var text = document.getElementById("chattextarea").value;
			var chatedc;
			document.getElementById("chattextarea").value='';
			
			//urlEncodedDataPairs.push(encodeURIComponent("numberofpost") + '=' + encodeURIComponent(count));
			urlEncodedDataPairs.push(encodeURIComponent("getmoreposts") + '=' + encodeURIComponent(false));
			urlEncodedDataPairs.push(encodeURIComponent("isasync") + '=' + encodeURIComponent(true));
			urlEncodedDataPairs.push(encodeURIComponent("chatname") + '=' + encodeURIComponent(currentchat));
			
			 urlEncodedData = urlEncodedDataPairs.join('&').replace(/%20/g, '+');
			 
			 
			 
			 var xmlreq = new XMLHttpRequest();
			 xmlreq.open("post", "index");
				xmlreq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
				xmlreq.send(urlEncodedData);
			 
			 
				xmlreq.onreadystatechange = function() {
			        if (this.readyState == 4 && this.status == 200) {
			        	chatedc= JSON.parse(this.responseText);
						console.log(chatedc);
			        	refreshchat(chatedc);
			        	document.getElementById("chattext").scrollTo(0, document.getElementById('chattext').scrollHeight);
			        	
			       }
			    };

			console.log(chatname);
		}
		
		
		function getusechats(){
			var urlEncodedData = "";
			var urlEncodedDataPairs = [];

			urlEncodedDataPairs.push(encodeURIComponent("isasync") + '=' + encodeURIComponent(true));
			urlEncodedDataPairs.push(encodeURIComponent("getchatnames") + '=' + encodeURIComponent(true));
			
			 urlEncodedData = urlEncodedDataPairs.join('&').replace(/%20/g, '+');
			
			
			var xmlreq = new XMLHttpRequest();
			xmlreq.open("post", "index");
			xmlreq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			xmlreq.send(urlEncodedData);
				
			xmlreq.onload=function(){
				if (this.status==200){
					//console.log(this.response);
					chatedc= JSON.parse(this.responseText);
					console.log(chatedc)
					makeusechats(chatedc);
				}
			}
			
			
			
		}
		
		function makeusechats(chatnames){
		
			document.getElementById("userchats").innerHTML = "";
			var toAdd = document.createDocumentFragment();
			
			
			var newbutt = document.createElement('button');
			   newbutt.id='swithcuserchat';
			   newbutt.className = 'swithchchat';
			   newbutt.setAttribute("onclick","javascript:newchat(event,'general');");
			   newbutt.innerHTML="gen";
			   toAdd.appendChild(newbutt);
			
			   newbutt = document.createElement('button');
			   newbutt.id='swithcuserchat';
			   newbutt.className = 'swithchchat';
			   newbutt.setAttribute("onclick","javascript:newwuserchat(true);");
			   newbutt.innerHTML="create/add chat";
			   toAdd.appendChild(newbutt);
			
			   
			   if(chatnames!=null){
					for(var i=0; i < chatnames.length; i++){

			  			var newbutt = document.createElement('button');
			   			newbutt.id='swithcuserchat';
			   			newbutt.className = 'swithchchat';
			   			var chatnammm=chatnames[i];
			   			//newbutt.onclick="newchat(event,'general') ";
			   			newbutt.onclick = function() { 
			   				newchat(event, this.innerHTML);
			   	        };
			   
			   
			   			newbutt.innerHTML=chatnammm;
			   
			   			toAdd.appendChild(newbutt);
					}
			   }
			//toAdd.appendChild(previousposts);
			document.getElementById("userchats").appendChild(toAdd);
			
		}
		getusechats();
		function newwuserchat(make){
			if(make==true){
				document.getElementById("newchatoverlay").style.visibility ="visible";
				document.getElementById("newchatwindow").style.visibility ="visible";
			}
			else{
				document.getElementById("newchatoverlay").style.visibility ="hidden";
				document.getElementById("newchatwindow").style.visibility ="hidden";
				//document.getElementById("pass").value="";
			}
			
		}
		function createuserchat(add){
			var urlEncodedData = "";
			var urlEncodedDataPairs = [];
			var text = document.getElementById("inputchatname").value;
			document.getElementById("inputchatname").value='';
			if(add==true){
				urlEncodedDataPairs.push(encodeURIComponent("addusertochat") + '=' + encodeURIComponent(true));
			}
		
				urlEncodedDataPairs.push(encodeURIComponent("inputchatname") + '=' + encodeURIComponent(text));
		
			urlEncodedDataPairs.push(encodeURIComponent("isasync") + '=' + encodeURIComponent(true));
			urlEncodedDataPairs.push(encodeURIComponent("getchatnames") + '=' + encodeURIComponent(true));
			
			
			
			 urlEncodedData = urlEncodedDataPairs.join('&').replace(/%20/g, '+');
			
			
			var xmlreq = new XMLHttpRequest();
			xmlreq.open("post", "index");
			xmlreq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			xmlreq.send(urlEncodedData);
				
			xmlreq.onload=function(){
				if (this.status==200){
					var resp=this.responseText;
					//console.log(this.response);
					try {
						chatedc= JSON.parse(resp);
						console.log(chatedc)
						makeusechats(chatedc);
					}
					catch(err) {
						window.alert(resp);
					}
					
				}
			}

		}
		
		
		function otheruseroptions(event,make,id,isguest){//make= boolean
			//console.log(id);
			//console.log(event.pageY);
			var ypos=event.pageY;
			ypos-=window.pageYOffset;
			//console.log(ypos);
			if(make==true){
				document.getElementById("chatuseroptionsoverlay").style.visibility ="visible";
				document.getElementById("chatuseropt").style.visibility ="visible";
				document.getElementById("chatuseropt").style.top=ypos+"px";
				document.getElementById("pmid").value=id;
				//console.log(document.getElementById("pmid").value);pmbutton
				if(isguest==true){
					document.getElementById("pmbutton").style.display ="none";
				}
				else{
					document.getElementById("pmbutton").style.display ="block";
				}
			}
			else{
				document.getElementById("chatuseroptionsoverlay").style.visibility ="hidden";
				document.getElementById("chatuseropt").style.visibility ="hidden";
				document.getElementById("pmid").value=-1;
				//document.getElementById("pass").value="";
			}
			
			
		}
		
		function addtoblacklist(){
			
			var urlEncodedData = "";
			var urlEncodedDataPairs = [];

			
			urlEncodedDataPairs.push(encodeURIComponent("toblock") + '=' + encodeURIComponent(document.getElementById("pmid").value));
			urlEncodedDataPairs.push(encodeURIComponent("chatname") + '=' + encodeURIComponent(currentchat));
			
			 urlEncodedData = urlEncodedDataPairs.join('&').replace(/%20/g, '+');
			
			
			var xmlreq = new XMLHttpRequest();
			xmlreq.open("post", "chat_async");
			xmlreq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			xmlreq.send(urlEncodedData);
				
			xmlreq.onload=function(){
				if (this.status==200){
					//console.log(this.response);
					chatedc= JSON.parse(this.responseText);
					console.log(chatedc)
					refreshchat(chatedc);
				}
			}
			otheruseroptions(event, false, -1,true);
			
			
			
			
		}
		//var myVar = setInterval(updatechat, 100);
		//this.interval = setInterval(updatechat,1000);
		console.log(this.interval);
		function updatechat(){
			try{
				gettotalunreadpm();
			}
			catch(e){
				
			}
			
			var urlEncodedData = "";
			var urlEncodedDataPairs = [];

			urlEncodedDataPairs.push(encodeURIComponent("numberofpost") + '=' + encodeURIComponent(count));
			urlEncodedDataPairs.push(encodeURIComponent("lastposttim") + '=' + encodeURIComponent(chat[chat.length-1].mit));
			urlEncodedDataPairs.push(encodeURIComponent("chatname") + '=' + encodeURIComponent(currentchat));
			
			 urlEncodedData = urlEncodedDataPairs.join('&').replace(/%20/g, '+');
			
			
			var xmlreq = new XMLHttpRequest();
			xmlreq.open("post", "chat_async");
			xmlreq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			xmlreq.send(urlEncodedData);
				
			xmlreq.onload=function(){
				if (this.status==200){
					//console.log(this.response);
					try{
						chatedc= JSON.parse(this.responseText);
						//refreshchat(chatedc);
					}
					catch(e){
						//
						//refreshchat();
					}
				
				}
			}
		}
		
		//setInterval(refreshchat(null),1);
		
		///////////end chat  