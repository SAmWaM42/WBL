
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const app = express();
const port = 5000;
const cron = require('node-cron');
const fs = require('fs');
const path = './meetings.json';
const { refreshState, getState } = require("./update")
const testingId = "user-123456";


const allRooms = Array.from({ length: 10 }, (_, i) => ({
    name: `Room${i + 1}`,
    isBooked: false,
    currentMeetingId: null,
    lastUpdated: null,
    softLock: [],
    x: (i % 5) * 100,
    y: Math.floor(i / 5) * 50,
}));
var tData = null;


//deal with refreshing the internal meeting data set
async function init() {
    await refreshState();
    updateRoomStates();
}

init();
async function updateRoomStates() {
    tData = getState()
    const now = new Date();
    allRooms.forEach(room => {
        room.isBooked = false;
        room.currentMeetingId = null;
        room.lastUpdated = now;
    })
    tData.forEach(meeting => {
        if (meeting.isCancelled) return;

        const start = new Date(meeting.start.dateTime);
        const end = new Date(meeting.end.dateTime);
        const roomName = meeting.location.displayName.replace(/\s+/g, '');

        const room = allRooms.find(r => r.name === roomName);

        if (room && now >= start && now < end) {
            console.log("some room matches")
            room.isBooked = true;
            room.currentMeetingId = meeting.id;
        }
    });
}

app.use(cors({ origin: 'http://localhost:3000', credentials: true })); // Allow CORS for frontend
app.use(express.json());


app.use(session({
    secret: 'a_very_secret_key_that_you_should_change', // replace later
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 2
    }
}));


// Endpoints
// to fetch by date
// to fetch by room
// i need to define the room data for the modelling(get this by route)
// post route to create the meeting once all is right
// api write to update the original teams database and maybe email them after we will see


app.get('/', (req, res) => {

    res.json({ currentStatus: allRooms });
});
app.get('/get-availability', (req, res) => {
    //restructure this so that the room only  changes color if the softlock of the rime segment is present
    tData = getState();
    const { date } = req.query
    const response = {};
    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59`);
    try {
        allRooms.forEach(room => {
            if (response[room.name] === undefined) {

                response[room.name] = [];
            }
            if (room.softLock !== null && room.softLock !== undefined) {
                room.softLock.forEach(reserved => {
                    var eStart = new Date(reserved["start"]);
                    var eFin = new Date(reserved["end"]);
                    if (eFin >= dayStart && eStart <= dayEnd) {
                        response[room.name].push({
                            start: eStart,
                            end: eFin,
                            status: "isBusy"

                        })
                    }
                }
                )

            }

        })
        tData.forEach(meet => {
            if (meet.isCancelled) return;

            var eStart = new Date(meet["start"]["dateTime"]);
            var eFin = new Date(meet["end"]["dateTime"]);
            if (eFin >= dayStart && eStart <= dayEnd) {
                var rName = meet["location"]["displayName"].replaceAll(' ', '')
                response[rName].push({
                    start: eStart,
                    end: eFin,
                    status: "booked"

                });
            }
        }
        );
    } catch (e) {
        console.log(e)
        return res.status(500).json({ error: e })
    }

    return res.status(200).json({ roomVals: response });
});

app.get('/free-room', (req, res) => {
    try {
        const { roomName, userId } = req.query
        var rIndex = allRooms.findIndex(room => room.name === roomName)
        var index = allRooms[rIndex].softLock.findIndex(lock => lock.userId === userId);
        if (index !== -1) {
            allRooms[rIndex].softLock.splice(index);
        }

    } catch (e) {
        return res.status(500).json({ message: "failed to free room", error: e })
    }
    return res.status(200).json({ message: "freed" });
});
app.get('/reserve-meet-time', (req, res) => {

    const { roomName, start, end, userId } = req.query;
    var startDate = new Date(start);
    var endDate = new Date(end);

    var rIndex = allRooms.findIndex(room => room.name === roomName)

    allRooms[rIndex].softLock.forEach(reserved => {
        var eStart = reserved["start"];
        var eFin = reserved["end"];
        var eStartDate = new Date(eStart);
        var eEndDate = new Date(eFin);
        console.log({ startDate, endDate, eStartDate, eEndDate });
        if ((startDate <= eEndDate && endDate >= eStartDate)) {

            return res.status(400).json({ message: "current room and time is not free" })
        }

    })
    allRooms[rIndex].softLock.push({ start: startDate, end: endDate, expiresAt: (new Date(Date.now() + 2 * 60 * 1000)), userId: userId });
    console.log({ data: allRooms[rIndex].softLock })

    return res.status(200).json({ message: "successfully reserved" })

})
app.get('get-reserved', (req, res) => {
    const { userId } = req.query
    var response = []
    allRooms.forEach(room => {
        if (room.softLock !== undefined) {
            room.softLock.forEach(value => {
                if (value.userId === userId) {
                    response.push()
                }
            })
        }

    })

})
app.post('/set-meeting', (req, res) => {
    //restructure this to have all the form inputs i need
    tData = getState();
    var isOnline = false;
    const { start, end, roomName, userId, meetingName, description, meetingType } = req.body
    if (meetingType === "online") {
        isOnline = true;
    }
    tData.forEach(meet => {
        if (meet.isCancelled) return;
        var eStart = meet["start"]["dateTime"];
        var eFin = meet["end"]["dateTime"];
        var startDate = new Date(start);
        var eStartDate = new Date(eStart);
        var endDate = new Date(end);
        var eEndDate = new Date(eFin);
        if ((startDate <= eEndDate && endDate >= eStartDate)) {
            return res.status(400).json({ error: "Meeting overlaps with existing" })
        }

    }
    );
    try {
        var templateResponse = {
            "id": "demo-meeting-".concat(Math.random() % 10000),
            "subject": meetingName,
            "bodyPreview": description,
            "importance": "normal",
            "sensitivity": "normal",
            "isAllDay": false,
            "isCancelled": false,
            "showAs": "busy",
            "responseRequested": true,
            "webLink": "https://outlook.office.com/calendar/item/demo-meeting-1",
            "organizer": {
                "emailAddress": {
                    "name": "Demo Organizer",
                    "address": "organizer@example.com"
                }
            },
            "attendees": [
                {
                    "type": "required",
                    "status": {
                        "response": "accepted",
                        "time": "2026-02-24T08:30:00Z"
                    },
                    "emailAddress": {
                        "name": "Demo Attendee",
                        "address": "attendee@example.com"
                    }
                }
            ],
            "start": {
                "dateTime": new Date(start),
                "timeZone": "Africa/Nairobi"
            },
            "end": {
                "dateTime": new Date(end),
                "timeZone": "Africa/Nairobi"
            },
            "location": {
                "displayName": roomName,
                "locationType": "default",
                "uniqueIdType": "unknown"
            },
            "onlineMeeting": isOnline,
            "createdDateTime": new Date(Date.now()),
            "lastModifiedDateTime": "2026-02-24T07:15:00Z",
            "type": "singleInstance",
            "transactionId": "txn-demo-1",
            "categories": [],
            "reminderMinutesBeforeStart": 10,
            "isReminderOn": true,
            "body": {
                "contentType": "html",
                "content": "<p>This meeting is happening now</p>"
            }
        }


        let existingMeetings = [];

        if (fs.existsSync(path)) {
            existingMeetings = JSON.parse(fs.readFileSync(path, "utf-8"));
        }
        console.log(existingMeetings)
        existingMeetings.value.push(templateResponse);
        fs.writeFileSync(path, JSON.stringify(existingMeetings, null, 2));
        console.log("meeting test JSON written to", path);
        var rIndex = allRooms.findIndex(room => room.name === roomName);
        if (rIndex !== -1) {
            console.log(allRooms[rIndex])
            var index = allRooms[rIndex].softLock.findIndex(lock => lock.userId === userId);
            if (index !== -1) {
                allRooms[roomName].softLock.splice(index,1);
            }
        }

        return res.status(200).json({ message: "successfully added meeting" })
    } catch (e) {
        return res.status(500).json({ error: `issue adding to file ${e}` })
    }
    //make sure to remove specific softlocks after this 
    //need to replace with an api call
    //for now not sure what to do for this
    //but its possible.

    //final decision i will write to the json file for now 
    // so that it can update on clean up but will need to restructure for later api call


});
async function cleanupExpiredLocks() {
    try {
        if (allRooms !== null && allRooms !== undefined) {
            //console.log(allRooms)
            allRooms.forEach((room, rIndex) => {
                if (room.softLock != null && room.softLock !== undefined) {

                    room.softLock.forEach((softlock, index) => {
                        var now = new Date(Date.now())
                        if (now >= softlock.expiresAt) {
                            if (room.softLock !== undefined) {
                                allRooms[rIndex].softLock.splice(index);
                            }
                        }
                    })
                }

            });
        }
    } catch (e) {
        console.log(e);
    }

}


cron.schedule('*/1 * * * *', async () => {
    tData = await refreshState();
    await updateRoomStates();

});
cron.schedule('*/1 * * * *', async () => {
    await cleanupExpiredLocks();
    console.log("cleaned some rooms")
});




app.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);

});


//potential issues i can see
//overwtiting of the internal room state on update invalidating softlock
//issue with deciding when to free a room since i dont think the interaction exists: done fixed by scheduling a cron job
//remember to add the timeout to reset the softlock(remove it):done need to test it
//softlockStructure{start,end(timeperiods),userID,expiredAt}
//ask alice about the building schematics
//issue with user data need to check what exactly i need to store or do i request it all the time from the source (teams side)
//to note this usses cookies to identify session data hence settion req.session for a user will work.