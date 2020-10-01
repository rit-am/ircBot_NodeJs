//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------

//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------
const irc = require("irc");
const util = require('util');
const NewsAPI = require('newsapi');
const sleep = require('system-sleep');
const iRCbotNick = "sweetie";
//var parser = require('xml2json');
const Eliza = require('eliza-as-promised');
//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------
const newsapi = new NewsAPI('get-ur-own-key');
const openweatherAPIkey = 'get-ur-own-key';
const DNSlookupAPIkey = 'get-ur-own-key';
const aqiAPIkey = 'get-ur-own-key';
//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------

//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------
//	channels: ["#cheers","#cyberspace","#india","#mirclife","#mirchat","#vietnamese"],
var iRCconfig = {
    userName: iRCbotNick,
    realName: iRCbotNick,
	channels: ["#u&i"],
	server: "irc.undernet.org",
	botName: iRCbotNick
};
var iRCbot = new irc.Client(iRCconfig.server, iRCconfig.botName, {
    userName: iRCconfig.userName,
    realName: iRCconfig.realName,
    channels: iRCconfig.channels
});
//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------

//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------

function funcEccElizaInitiate(varStringChannel, varStringNick) {
    var eliza = new Eliza();
    iRCbot.say(varStringChannel, varStringNick +", "+eliza.getInitial());
}
function funcEccElizaConverse(varStringChannel, varStringNick, varStringInputMessage) {
    var eliza = new Eliza();
    eliza.getResponse(varStringInputMessage)
        .then((response) => {
            if (response.reply) {
                //console.log('>> ' + response.reply);
                iRCbot.say(varStringChannel, varStringNick +", "+response.reply);
            }
            if (response.final) {
                //console.log('>> ' + response.final);
                iRCbot.say(varStringChannel, varStringNick +", "+response.reply);
                //process.exit(0);
            }
        });
}
function funcUserInfo(varStringUser,varStringNick) {
    var varHostName = "";
    iRCbot.whois(varStringNick, function(varUsr) {
        //console.log(varUsr.host);
        varHostName = varUsr.host;
        if(varHostName.indexOf("undernet")<0) {

            var varStringUrlDNSservice = "https://www.whoisxmlapi.com/whoisserver/DNSService?apiKey="+ DNSlookupAPIkey +"&domainName="+varHostName+"&type=A"+"&outputFormat=JSON";
            require('https').get(varStringUrlDNSservice, (res) => {
                res.setEncoding('utf8');
                res.on('data', function (body) {
                    //console.log(body);
                    var jsonParsed = JSON.parse(body);
                    var varIP = "127.0.0.1"
                    try {varIP = jsonParsed.DNSData.dnsRecords[0].address;} catch (e) {varIP = varHostName;}
                    var varStringUrlGeoIP = "https://ip-geolocation.whoisxmlapi.com/api/v1?apiKey="+DNSlookupAPIkey + "&ipAddress=" +varIP+"&outputFormat=JSON";
                
                    require('https').get(varStringUrlGeoIP, (res) => {
                        res.setEncoding('utf8');
                        res.on('data', function (body) {
                            var jsonParsed = JSON.parse(body);
                            iRCbot.notice(varStringUser,"User : "+varStringNick);
                            iRCbot.notice(varStringUser,jsonParsed.location.city+", "+jsonParsed.location.region+", "+jsonParsed.location.country);
                            iRCbot.notice(varStringUser,"Time Zone Offset : "+jsonParsed.location.timezone);
                            iRCbot.notice(varStringUser,"Lat : "+jsonParsed.location.lat+", Lng : "+jsonParsed.location.log);
                            iRCbot.notice(varStringUser,"ISP : "+jsonParsed.isp+", ConnType : "+jsonParsed.connectionType);
                            iRCbot.notice(varStringUser,"ASN - Name : "+jsonParsed.as.name+", Type : "+jsonParsed.as.type);
                            iRCbot.notice(varStringUser,"Proxy - Proxy : "+jsonParsed.proxy.proxy+", VPN : "+jsonParsed.proxy.vpn+", TOR : "+jsonParsed.proxy.tor);
                        })
                    }); 
                });
            }) 
        } else {
            iRCbot.notice(varStringUser,"Sorry : User is Cloaked on undernet");
        }
        
    })
}
function funcNumber(varStringChannel,varStringNumber,varStringType) {
    require('http').get('http://numbersapi.com/'+varStringNumber+"/"+varStringType, (res) => {
        res.setEncoding('utf8');
        res.on('data', function (body) {
            iRCbot.say(varStringChannel, body)
        });             
    });
}
function funcInsult(varStringChannel,varStringUser,varStringTarget) {
    
    var str = "";
    require('https').get('https://evilinsult.com/generate_insult.php?lang=en&type=json', (res) => {
        
        res.setEncoding('utf8');
        res.on('data', function (body) {
            var jsonParsed = JSON.parse(body);
            str = jsonParsed.insult;

            //console.log(str);

            if (varStringUser==="matir") {
                iRCbot.notice(varStringTarget,str)
            } else {
                iRCbot.notice(varStringUser,str)
            }

        });             
    });
}
function funcTrivia(varStringChannel) {
    var varQ = "";
    var varA = "";
    require('https').get('https://opentdb.com/api.php?amount=1', (res) => {
        res.setEncoding('utf8');
        res.on('data', function (body) {
            var jsonParsed = JSON.parse(body);
            varQ = jsonParsed.results[0].question;
            varQ=varQ.replace("\&","\ \&");
            varQ=varQ.replace("\&quot\;","\"");
            //iRCbot.say(varStringChannel, jsonParsed.results[0].question)            
            iRCbot.say(varStringChannel, varQ)       
            setTimeout(function() {
                iRCbot.say(varStringChannel, jsonParsed.results[0].correct_answer);
            }, 10000);
            
        }); 
    });
}
function funcJokes(varStringChannel) {
    require('https').get('https://official-joke-api.appspot.com/jokes/random', (res) => {
        res.setEncoding('utf8');
        res.on('data', function (body) {
            var jsonParsed = JSON.parse(body);
            iRCbot.say(varStringChannel, jsonParsed.setup);
            setTimeout(function() {
                iRCbot.say(varStringChannel, jsonParsed.punchline);
            }, 10000);
        });             
    });
}
function funcWeather(varStringChannel, varWloc) {
    let varLocLat = "";
    let varLocLon = "";
    require('http').get('http://api.openweathermap.org/data/2.5/weather?q='+varWloc+',&appid='+openweatherAPIkey, (res) => {
        res.setEncoding('utf8');
        res.on('data', function (body) {
            var jsonParsed = JSON.parse(body);
			var varWindDirection = "";
			//'http://api.openweathermap.org/data/2.5/weather?q=Kolkata&appid=3f0d91285af741cbe9041a986c254fa6
			try {var varLocation = jsonParsed.name;} catch (e) {varLocation = "NULL";}
            try {var varCountry = jsonParsed.sys.country;} catch (e) {varCountry = "NULL";}
            
            try {var varWCordLat = jsonParsed.coord.lat;} catch (e) {varWCordLat = "NULL";}
            try {var varWCordLon = jsonParsed.coord.lon;} catch (e) {varWCordLon = "NULL";}

            varLocLat = varWCordLat; varLocLon = varWCordLon;


			try {var varWeather = jsonParsed.weather[0].main;} catch (e) {varWeather = "NULL";}
			try {var varTemp = jsonParsed.main.temp;} catch (e) {varTemp = "NULL";}
			try {var varFeels_like = jsonParsed.main.feels_like;} catch (e) {varFeels_like = "NULL";}
			try {var varPreassure = jsonParsed.main.pressure;} catch (e) {varPreassure = "NULL";}
			try {var varHumidity = jsonParsed.main.humidity;} catch (e) {varHumidity = "NULL";}
			try {var varSpeed = jsonParsed.wind.speed;} catch (e) {varSpeed = "NULL";}
			try {var varDegree = jsonParsed.wind.deg;} catch (e) {varDegree = "NULL";}
			try {var VarClouds = jsonParsed.clouds.all;} catch (e) {VarClouds = "NULL";}

            
            if (varDegree >= 0  && varDegree <= 0.00) {varWindDirection = "N"}
                else if (varDegree <= 11.25) {varWindDirection = "NbE"}
                else if (varDegree <= 22.50) {varWindDirection = "NNE"}
                else if (varDegree <= 33.75) {varWindDirection = "NEbN"}
                else if (varDegree <= 45.00) {varWindDirection = "NE"}
                else if (varDegree <= 56.25) {varWindDirection = "NEbE"}
                else if (varDegree <= 67.50) {varWindDirection = "ENE"}
                else if (varDegree <= 78.75) {varWindDirection = "EbN"}
                else if (varDegree <= 90.00) {varWindDirection = "E"}
                else if (varDegree <= 101.25) {varWindDirection = "EbS"}
                else if (varDegree <= 112.50) {varWindDirection = "ESE"}
                else if (varDegree <= 123.75) {varWindDirection = "SEbE"}
                else if (varDegree <= 135.00) {varWindDirection = "SE"}
                else if (varDegree <= 146.25) {varWindDirection = "SEbS"}
                else if (varDegree <= 157.50) {varWindDirection = "SSE"}
                else if (varDegree <= 168.75) {varWindDirection = "SbE"}
                else if (varDegree <= 180.00) {varWindDirection = "S"}
                else if (varDegree <= 191.25) {varWindDirection = "SbW"}
                else if (varDegree <= 202.50) {varWindDirection = "SSW"}
                else if (varDegree <= 213.75) {varWindDirection = "SWbS"}
                else if (varDegree <= 225.00) {varWindDirection = "SW"}
                else if (varDegree <= 236.25) {varWindDirection = "SWbW"}
                else if (varDegree <= 247.50) {varWindDirection = "WSW"}
                else if (varDegree <= 258.75) {varWindDirection = "WbS"}
                else if (varDegree <= 270.00) {varWindDirection = "W"}
                else if (varDegree <= 281.25) {varWindDirection = "WbN"}
                else if (varDegree <= 292.50) {varWindDirection = "WNW"}
                else if (varDegree <= 303.75) {varWindDirection = "NWbW"}
                else if (varDegree <= 315.00) {varWindDirection = "NW"}
                else if (varDegree <= 326.25) {varWindDirection = "NWbN"}
                else if (varDegree <= 337.50) {varWindDirection = "NNW"}
                else if (varDegree <= 348.75) {varWindDirection = "NbW"}
                    else  {varWindDirection = "N"}

			
			
			var str = "";

			if (varWeather != "NULL") {
                str = " Weather @ " + 
                        " Coordinates |: " + "Lon - " + varWCordLon + " :|: Lat - " + varWCordLat + 
                        " :| " + varLocation + "," + varCountry + " - " + varWeather +
                        " | "+
                        "| Temp " + util.format('%i', (varTemp-273.15)) + " °C"+
                        ", Feels Like " + util.format('%i', (varFeels_like-273.15)) + " °C"+ 
                        ", Preassure " + util.format('%i', varPreassure) + " hPa" +
                        ", Humidity " + util.format('%i', varHumidity) + "%" +
                        ", Wind Speed " + util.format('%i', varSpeed)  + " m/s" +
                        ", Direction " + varWindDirection + 
                        " " + varDegree + "°"+
                        ", Clouds " + util.format('%i', VarClouds) + "%";


                        iRCbot.say(varStringChannel, str);

                        str = "";
                        // http://api.airvisual.com/v2/nearest_city?lat=22.57&lon=88.37&key=d26d685a-5a87-4732-9c7e-07508246777b
                        require('http').get('http://api.airvisual.com/v2/nearest_city?lat='+varLocLat+'&lon='+varLocLon+'&key='+aqiAPIkey, (res) => {
                            res.setEncoding('utf8');
                            res.on('data', function (body) {
                                
                                var jsonParsed = JSON.parse(body);
                                //console.log(jsonParsed.data.current.pollution.aqius)
            
                                //var varAQI = jsonParsed.data.current.pollution.aqius; 
            
                                try {var varAQI = jsonParsed.data.current.pollution.aqius; } catch (e) {varAQI = "NULL";}
            
            
                                if (jsonParsed.data.current.pollution.aqius >= 0 && jsonParsed.data.current.pollution.aqius <= 50){
                                    str = " AQI : " + jsonParsed.data.current.pollution.aqius + 
                                            "  -=- Air Pollution Level - Level " + "1" +
                                            "  -=- Air Pollution Categoty -  " + "Excellent" +
                                            "  -=- Health Implications -  " + "No health implications." +
                                            "  -=- Recommended Precautions -  " + "Everyone can continue their outdoor activities normally."
                                }
            
                                if (jsonParsed.data.current.pollution.aqius >= 51 && jsonParsed.data.current.pollution.aqius <= 100){
                                    str = " AQI : " + jsonParsed.data.current.pollution.aqius + 
                                            "  -=- Air Pollution Level - Level " + "2" +
                                            "  -=- Air Pollution Categoty -  " + "Good" +
                                            "  -=- Health Implications -  " + "Some pollutants may slightly affect very few hypersensitive individuals.	" +
                                            "  -=- Recommended Precautions -  " + "Only very few hypersensitive people should reduce outdoor activities."
                                }
            
                                if (jsonParsed.data.current.pollution.aqius >= 101 && jsonParsed.data.current.pollution.aqius <= 150){
                                    str = " AQI : " + jsonParsed.data.current.pollution.aqius + 
                                            "  -=- Air Pollution Level - Level " + "3" +
                                            "  -=- Air Pollution Categoty -  " + "Lightly Polluted" +
                                            "  -=- Health Implications -  " + "Healthy people may experience slight irritations and sensitive individuals will be slightly affected to a larger extent." +
                                            "  -=- Recommended Precautions -  " + "Children, seniors and individuals with respiratory or heart diseases should reduce sustained and high-intensity outdoor exercises."
                                }
            
                                if (jsonParsed.data.current.pollution.aqius >= 151 && jsonParsed.data.current.pollution.aqius <= 200){
                                    str = " AQI : " + jsonParsed.data.current.pollution.aqius + 
                                            "  -=- Air Pollution Level - Level " + "4" +
                                            "  -=- Air Pollution Categoty -  " + "	Moderately Polluted" +
                                            "  -=- Health Implications -  " + "Sensitive individuals will experience more serious conditions. The hearts and respiratory systems of healthy people may be affected." +
                                            "  -=- Recommended Precautions -  " + "Children, seniors and individuals with respiratory or heart diseases should avoid sustained and high-intensity outdoor exercises. General population should moderately reduce outdoor activities."
                                }
            
                                if (jsonParsed.data.current.pollution.aqius >= 201 && jsonParsed.data.current.pollution.aqius <= 300){
                                    str = " AQI : " + jsonParsed.data.current.pollution.aqius + 
                                            "  -=- Air Pollution Level - Level " + "5" +
                                            "  -=- Air Pollution Categoty -  " + "	Heavily Polluted" +
                                            "  -=- Health Implications -  " + "Healthy people will commonly show symptoms. People with respiratory or heart diseases will be significantly affected and will experience reduced endurance in activities." +
                                            "  -=- Recommended Precautions -  " + "Children, seniors and individuals with heart or lung diseases should stay indoors and avoid outdoor activities. General population should reduce outdoor activities."
                                }
            
                                if (jsonParsed.data.current.pollution.aqius > 200){
                                    str = " AQI : " + jsonParsed.data.current.pollution.aqius + 
                                            "  -=- Air Pollution Level - Level " + "6" +
                                            "  -=- Air Pollution Categoty -  " + "Severely Polluted" +
                                            "  -=- Health Implications -  " + "Healthy people will experience reduced endurance in activities and may also show noticeably strong symptoms. Other illnesses may be triggered in healthy people. Elders and the sick should remain indoors and avoid exercise. Healthy individuals should avoid outdoor activities." +
                                            "  -=- Recommended Precautions -  " + "Children, seniors and the sick should stay indoors and avoid physical exertion. General population should avoid outdoor activities."
                                }
            
                                iRCbot.say(varStringChannel, str);
            
            
            
                            })
                        });
			} else {
                str = "Location Not Found"
                iRCbot.say(varStringChannel, str);
			}
        });             
    });

}
function funcNewsAPI(varStringChannel,varStringCountry) {
	newsapi.v2.topHeadlines({
		//sources: 'bbc-news,the-verge',
		//q: 'bitcoin',
		//category: 'business',
		language: 'en',
		country: varStringCountry
		}).then(response => {
		var x = 0;
		do {
			var outTxt = ("NEWS Alert" + " :|: " + 
				response.articles[x].title + " :|: " + 
				response.articles[x].description + " :|: " + 
				"");
			iRCbot.say(varStringChannel, outTxt);
			}
			while (x++ < 4 /*response.articles.length -1*/);
	  });
	
}

//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------


//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------
// Listen for raw

//iRCbot.addListener("raw", function(message) {console.log("Action >> " + "RAW" + ": "+  'data: ', message);});

//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------


//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------

// Listen for Kicks
iRCbot.addListener("kick", function(channel, nick, by, reason) {
    console.log("Action >> " + "KICK" + ": " + channel + " : "+ nick + " : " + by + " : "+ reason);
    if(nick === iRCbotNick) {sleep(5000);iRCbot.join(channel)}
});

// Listen for Errors
iRCbot.addListener('error', function(message) {
    console.log('error: ', message);
});

// Listen for joins
iRCbot.addListener("join", function(channel, nick) {
    console.log("Action >> " + "JOIN" + ": " + channel + " : "+ nick + " : ");
    iRCbot.notice(nick,"Hi! "+nick+ ", Welcome to "+channel+". Type !h for options!");
    funcEccElizaInitiate(channel,nick);

});

// Listen for any message, say to him/her in the room
iRCbot.addListener("message", function(from, to, text, message) {
	
    console.log("Action >> " + "Public Text" + ": " + to + " : "+ from + " : " + text);

    var varChannel = to;
    var varUser = from;
    var varTarget = from;
	
	if (text.indexOf("!w") === 0) {
        var varLocation = "Kolkata"
        var res = text.split(" ");
        if (res.length > 0) {varLocation = res[1]}
		funcWeather(varChannel,varLocation);
	}
	if (text.indexOf("!news") === 0) {
        var varCountry = "in";

        var res = text.split(" ");
        if (res.length > 1) {varCountry = res[1]}
		funcNewsAPI(varChannel,varCountry);
    }
    if (text.indexOf("!u") === 0) {
        var res = text.split(" ");
		funcUserInfo(varUser,res[1]);
    }
    if (text.indexOf("!j") === 0) {
		funcJokes(varChannel);
	}
    if (text.indexOf("!q") === 0) {
		funcTrivia(varChannel);
    }
    if (text.indexOf("!i") === 0) {

        var res = text.split(" ");
        console.log(res.length+"\n")
        if (res.length === 2) {varTarget = res[1]}
		funcInsult(varChannel,varUser,varTarget);
    }
    if (text.indexOf("!x") === 0) {
        var varNumber = "0";
        var varType = "trivia";
        var res = text.split(" ");
        if (res.length === 3) {varType=res[2];varNumber=res[1]}
        if (res.length === 2) {varNumber=res[1]}
        if (res.length === 1) {varNumber="random"}
		funcNumber(varChannel,varNumber,varType);
    }
    if (text.indexOf("!h") === 0) {
        iRCbot.notice(varUser,"!q Quiz");
        iRCbot.notice(varUser,"!j Jokes");
        iRCbot.notice(varUser,"!i Insult Yourself");
        iRCbot.notice(varUser,"!w weather <usage : !w location/city name>");
        iRCbot.notice(varUser,"!x Number Facts <usage : !n #number [type:trivia/math/date/year]>");
        iRCbot.notice(varUser,"!news NEWS");
    }
    
    if (text.indexOf(iRCbotNick)>-1) {
        funcEccElizaConverse(to,from,text);
    }

});

//--------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------
