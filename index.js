var apn           = require('apn'),
    request       = require('request'),
    events        = require('events'),
    Client        = require('mariasql'),
    c = new Client({
        host     : 'stirhack.ccgjwgngik5x.eu-west-1.rds.amazonaws.com',
        user     : 'stirhack',
        password : 'stirhack',
        db       : 'stirhack'
    }),
    prep          = c.prepare('INSERT INTO `log` (`id`, `timestamp`, `data`) VALUES (:id, :timestamp, :data)'),
    options       = { },
    token         = "",
    apiToken      = "",
    apnConnection = new apn.Connection(options),
    myDevice      = new apn.Device(token),
    note          = new apn.Notification(),
    eventEmitter  = new events.EventEmitter(),
    counter       = 0,
    result        = undefined,
    triggered     = false,
    apiList       = undefined,
    start = function() {
        apiList = undefined;
        result = {
            timestamp : Math.floor(Date.now() / 1000),
            data      : []
        };
        request('http://dogfish.tech/api/apis/', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var data = JSON.parse(body).data;
                apiList = data;
                request("http://dogfish.tech/api/login?user=untitled1&password=111", function(error, response, body) {
                    apiToken = JSON.parse(body).data.token;

                    for(var i = apiList.length - 1; i >= 0; i--) {
                        var api = apiList[i],
                            url = 'http://dogfish.tech/api/'+ api.endpoint +'/' + api.params;

                            if (api.access === "auth") {
                                url += "&auth=111";
                            }
                            if (api.access === "token") {
                                url += "&token=" + apiToken;
                            }
                        (function(api, url) {
                            request(url, function(error, response, body) {
                                var statusCode = response.statusCode,
                                    alive      = false,
                                    obj        = {};
                                obj.name = api.name;
                                if (statusCode === (200 || 201)) {
                                    try {
                                        statusCode = JSON.parse(body).headers.response_code;
                                    } catch(e) {
                                        console.log(e);
                                    }
                                }
                                if (statusCode === (200 || 201)) {
                                    alive = true;
                                }
                                obj.alive = alive;
                                obj.code = statusCode;
                                result.data.push(obj);
                                counter++;
                                eventEmitter.emit('requested');
                            });
                        })(api, url);
                    };
                });

            } else {
                Console.log("FAILED!");
            }
        });
    };
eventEmitter.on("requested", function() {
    if (counter === apiList.length) {
        var failCounter = 0,
            failArray   = [];
        console.log(result);
        for (var i = result.data.length - 1; i >= 0; i--) {
            if (result.data[i].alive === false) {
                failCounter++;
                failArray.push(result.data[i]);
            }
        }
        result.data = JSON.stringify(result.data);
        c.query(prep({
            id: result.id,
            timestamp: result.timestamp,
            data: result.data
        }), function(err, rows) {
            if (err) {
                throw err;
            }
            console.dir(rows);
        });
        if (failCounter && triggered === false) {
            triggered = true;
            if (failCounter < 5) {
                for (var i = failArray.length - 1; i >= 0; i--) {
                    var fail = failArray[i];
                    console.log(fail);
                    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                    note.badge = failCounter;
                    note.alert = fail.name + " is down";
                    note.payload = {'messageFrom': 'Caroline'};

                    apnConnection.pushNotification(note, myDevice);
                }
            } else {
                var word = failCounter > 1 ? "API's are" : "API is";
                note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                note.badge = failCounter;
                note.alert = failCounter + " API's are down";
                note.payload = {'messageFrom': 'Caroline'};

                apnConnection.pushNotification(note, myDevice);
            }
        }
        if (!failCounter && triggered === true) {
            triggered = false;
            note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
            note.badge = 0;
            note.alert = "Normal service has been restored";
            note.payload = {'messageFrom': 'Caroline'};

            apnConnection.pushNotification(note, myDevice);
        }
        counter = 0;
        eventEmitter.emit('completed');
    }
});
eventEmitter.on("completed", function() {
    setTimeout(function() { start(); }, 10000);
});
start();
