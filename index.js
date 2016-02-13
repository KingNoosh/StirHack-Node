Object.prototype.hasOwnValue = function(val) {
    for(var prop in this) {
        if(this.hasOwnProperty(prop) && this[prop] === val) {
            return true;
        }
    }
    return false;
};

var apn           = require('apn'),
    request       = require('request'),
    events        = require('events'),
    options       = { },
    token         = "",
    apnConnection = new apn.Connection(options),
    myDevice      = new apn.Device(token),
    note          = new apn.Notification(),
    eventEmitter  = new events.EventEmitter(),
    counter       = 0,
    result        = {
        timestamp : Math.floor(Date.now() / 1000),
        data      : []
    },
    start = function() {
        var apiList = undefined;
        request('http://dogfish.tech/api/apis/', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var data = JSON.parse(body).data;
                apiList = data;

                eventEmitter.on("requested", function() {
                    if (counter === apiList.length) {
                        console.log(result);
                        var failCounter = 0;
                        for (var i = result.data.length - 1; i >= 0; i--) {
                            if (result.data[i].alive === false) { failCounter++ }
                        }
                        // if (failCounter) {
                        //     var word = failCounter > 1 ? "API's" : "API";
                        //     note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                        //     note.badge = failCounter;
                        //     note.alert = failCounter + " " + word + " are down";
                        //     note.payload = {'messageFrom': 'Caroline'};

                        //     apnConnection.pushNotification(note, myDevice);
                        // }
                        eventEmitter.emit('completed');
                    }
                });

                for(var i = apiList.length - 1; i >= 0; i--) {
                    var api = apiList[i];
                    (function(api) {
                        request('http://dogfish.tech/api/'+ api.endpoint +'/' + api.params, function(error, response, body) {
                            var statusCode = response.statusCode,
                                alive      = false,
                                obj        = {};
                            obj.name = api.name;
                            if (statusCode === (200 || 201)) {
                                statusCode = JSON.parse(body).headers.response_code;
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
                    })(api);
                };
            } else {
                Console.log("FAILED!");
            }
        });
    };

eventEmitter.on("completed", function() {
    console.log("Triggered");
    setTimeout(start, 300000);
});
start();
