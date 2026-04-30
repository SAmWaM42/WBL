
import { useState, useEffect } from 'react'
import { drawRoom } from './Components/office';
import { useRef } from 'react'
require("./Components/office")
//single page renderred no routing so all request handled in this page to just update content
function App() {
  const serverUrl = "http://localhost:5000/";
  const dataUrl = `${serverUrl}get-availability`;
  const [viewDate, setViewDate] = useState(new Date(Date.now()));
  const [roomData, setRoomData] = useState(null);
  const [timePeriod, setTimePeriod] = useState({ start: new Date(Date.now()), end: new Date(Date.now() + 1 * 1000 * 60 * 60) })
  const [errors, setErrors] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [specificRoomData, setSpecificRoomData] = useState(null)
  const [showSpecificRoom, setShowSpecificRoom] = useState(false);
  const [showCompletionForm, setShowCompletionForm] = useState(false)
  const [meetingName, setMeetingName] = useState("");
  const [description, setDescription] = useState("");
  const [meetingType, setMeetingType] = useState("in-person");

  const lRoom = useRef(null)
  const rooms = useRef({})
  const stage = useRef(null);
  const layer = useRef(null);
  const testingId = "user-123456";

  useEffect(() => {
    async function update() {
      const dateStr = viewDate.toISOString().toLocaleString().split("T")[0];
      const response = await fetch(`${dataUrl}?date=${encodeURIComponent(dateStr)}`);
      const data = await response.json();
      console.log(dateStr)
      setRoomData(data.roomVals); // roomData will trigger canvas draw
    }
    update()

  }, [viewDate])
  
  useEffect(() => {
    if (!roomData) return; // wait for data
    if (layer.current && rooms.current) return; // already instantiated

    try {
      const data = drawRoom("rooms", roomData, setSelectedRoom);
      rooms.current = data["rooms"];
      layer.current = data["layer"];
      stage.current = data["stage"];
      console.log("set the canvas")
    } catch (e) {
      var newErrors = errors;
      newErrors.push(e)
      setErrors(newErrors)
    }


  }, [roomData])


  useEffect(() => {

    if (!roomData || !layer.current || !rooms.current) return;

    const dateStr = viewDate.toISOString().split("T")[0];
    var sTime = new Date(timePeriod.start)
    var eTime = new Date(timePeriod.end)
    if (roomData == null || roomData == undefined) return;
    Object.entries(roomData).forEach(([roomName, events]) => {

      let color = "green";
      for (const event of events) {
        //data inconsistency problem;

        const start = new Date(event.start);
        const end = new Date(event.end);

        if (end > sTime && start < eTime) {
          if (event.status === "booked") {
            color = "red";
            break;
          }
          if (event.status === "isBusy") {
            color = "orange";
          }
        }
      }
      const rect = rooms.current[roomName];
      if (rect) rect.fill(color);

    });

    layer.current.draw();
  }, [viewDate, timePeriod, roomData])
  useEffect(() => {
    if (lRoom.current === null) {
      lRoom.current = selectedRoom
      setShowSpecificRoom(prev => !prev);
    }
    else {
      if (selectedRoom.name === lRoom.current.name) {

        setShowSpecificRoom(prev => !prev);
      }
      else {
        setShowSpecificRoom(true)
        lRoom.current = selectedRoom
      }

    }


  }, [selectedRoom])
  useEffect(() => {
    if (roomData === null || roomData === undefined) return;
    if (showSpecificRoom) {
      setSpecificRoomData(roomData[selectedRoom.name])
    }
    else {
      setSpecificRoomData(null)
    }

  }, [showSpecificRoom])


  async function toggleCompletionForm() {
    var toUse = !showCompletionForm;
    setShowCompletionForm(prev => !prev);
    if (toUse) {
      console.log(timePeriod.start)
      try {
        const response = await fetch(`${serverUrl}reserve-meet-time?roomName=${encodeURI(`${selectedRoom.name}`)}&start=${encodeURI(`${timePeriod.start.toISOString()}`)}&end=${encodeURI(`${timePeriod.end.toISOString()}`)}&userId=${encodeURI(testingId)}`)
        const data = await response.json()
        if (!response.ok) {
          throw (new Error(data.message))

        }

      } catch (e) {

        alert(e.message);
        setShowCompletionForm(prev => !prev);

      }
    } else {
      fetch(`${serverUrl}free-room?roomName=${encodeURI(`${selectedRoom.name}`)}&userId=${encodeURI(testingId)}`)
    }
    //need to add data here to reserve and release with the routes i have in the backend
  }
  function updateViewDate() {
    var date = `${document.getElementsByName("date")[0].value}`;
    var sTime = document.getElementsByName("start")[0].value
    var eTime = document.getElementsByName("end")[0].value
    if (date !== null && date !== '') {

      setViewDate(new Date(date));
    }
    const startTime = sTime || timePeriod.start;
    const endTime = eTime || timePeriod.end;

    // Combine date + time properly
    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);

    setTimePeriod({ start: startDateTime, end: endDateTime });
  }

  async function submitReservation() {
    const fData = {
      roomName: selectedRoom.name,
      meetingName,
      description,
      meetingType,
      start: timePeriod.start,
      end: timePeriod.start,
      userId:testingId
    };
    try {
      const response = await fetch(`${serverUrl}set-meeting`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fData) })
      const data = await response.json()
      if (!response.ok) {
        throw (new Error(data.message))

      }

    } catch (e) {

      alert(e.message);
      setShowCompletionForm(prev => !prev);

    }

    setShowCompletionForm(false);
  }
  const styles = {
    appContainer: {
      display: "flex",
      height: "100vh",
      background: "#f4f6f8",
      fontFamily: "Arial, sans-serif"
    },

    canvasWrapper: {
      flex: 2,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#e9ecef"
    },

    canvasContainer: {
      width: "800px",
      height: "600px",
      border: "2px solid #333",
      background: "white"
    },

    controlPanel: {
      flex: 1,
      padding: "20px",
      overflowY: "auto",
      background: "#ffffff",
      borderLeft: "1px solid #ccc"
    },

    card: {
      background: "#fafafa",
      padding: "15px",
      marginBottom: "20px",
      borderRadius: "8px",
      boxShadow: "0 2px 5px rgba(0,0,0,0.08)",
      display: "flex",
      flexDirection: "column",
      gap: "10px"
    },

    eventRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "6px 0",
      borderBottom: "1px solid #eee"
    }
  };

  return (
    <div style={styles.appContainer}>

      {/* LEFT SIDE — Canvas */}
      <div style={styles.canvasWrapper}>
        <div id="rooms" style={styles.canvasContainer}></div>
      </div>

      {/* RIGHT SIDE — Control Panel */}
      <div style={styles.controlPanel}>

        <h2>Room Availability</h2>

        {/* Date + Time Search */}
        <div style={styles.card}>
          <h3>Search by Date</h3>

          <input type="date" name="date" />
          <input type="time" name="start" />
          <input type="time" name="end" />

          <button onClick={updateViewDate}>
            Update View
          </button>
        </div>

        {/* Selected Room */}
        {selectedRoom && (
          <div style={styles.card}>
            <h3>Selected Room</h3>
            <p><strong>{selectedRoom.name}</strong></p>

            <button onClick={toggleCompletionForm}>
              {showCompletionForm ? "Cancel Reservation" : "Reserve Room"}
            </button>


            {showCompletionForm && (
              <div style={{
                marginTop: "15px",
                padding: "10px",
                borderTop: "1px solid #ddd",
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}>
                <h4>Meeting Details</h4>

                <input
                  type="text"
                  placeholder="Meeting Name"
                  value={meetingName}
                  onChange={(e) => setMeetingName(e.target.value)}
                />

                <textarea
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />

                <select
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value)}
                >
                  <option value="in-person">In-Person</option>
                  <option value="online">Online</option>
                </select>

                <button onClick={submitReservation}>
                  Confirm Reservation
                </button>
              </div>
            )}
          </div>
        )}


        {showSpecificRoom && specificRoomData && (
          <div style={styles.card}>
            <h3>Room Schedule</h3>

            {specificRoomData.length === 0 || specificRoomData == undefined && (
              <p>No bookings for this date</p>
            )}

            {specificRoomData.map((event, index) => (
              <div key={index} style={styles.eventRow}>
                <span>
                  {new Date(event.start).toLocaleTimeString()} -
                  {new Date(event.end).toLocaleTimeString()}
                </span>

                <span style={{
                  color:
                    event.status === "booked"
                      ? "red"
                      : event.status === "isBusy"
                        ? "orange"
                        : "green"
                }}>
                  {event.status}
                </span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );




}
//create a contextWrapper for validation and major fetches
//create a router but to be honset i think this is going to be a single page application

export default App

//ok i can simplify this so that the time specifies the limit by which all reserved rooms are shown
//i need to modify the endpoints to account for this
//maybe store the data for the attempted meeting as a session variable


//time formatting problem the start date and end sate are not correct