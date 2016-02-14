var apn           = require('apn'),
    options       = { },
    token         = "44550d080f45da43639a147506121ed224b2c26ee0bd5848a8b6ce3fb29b5973",
    apnConnection = new apn.Connection(options),
    myDevice      = new apn.Device(token),
    failCounter   = 3,
    failArray     = [
        {
            name: "Countries",
            alive: false,
            code: 401
        },
        {
            name: "Youtube",
            alive: false,
            code: 500
        },
        {
            name: "Twitter",
            alive: false,
            code: 404
        }
    ],
    fixed          = function() {
        var note = new apn.Notification();
        note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
        note.badge = 0;
        note.alert = "Normal service has been restored";
        note.payload = {'messageFrom': 'Caroline'};

        apnConnection.pushNotification(note, myDevice);
    },
    broken         = function() {
        for (var i = failArray.length - 1; i >= 0; i--) {
            var fail = failArray[i],
                note = new apn.Notification();
            console.log(fail);
            note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
            note.badge = failCounter;
            note.alert = fail.name + " is down";
            console.log(fail.name);
            note.payload = {'messageFrom': 'Caroline'};

            apnConnection.pushNotification(note, myDevice);
        }

    },
    manyBroken      = function() {
        var note = new apn.Notification();
        note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
        note.badge = 5;
        note.alert = 5 + " API's are down";
        note.payload = {'messageFrom': 'Caroline'};

        apnConnection.pushNotification(note, myDevice);
    };

fixed();
