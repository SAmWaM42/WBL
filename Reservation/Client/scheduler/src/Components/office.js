import Konva from "konva";

function drawRoom(divName, data, selectedRoom) {
    var rooms = {};

    const stage = new Konva.Stage({
        container: divName, // id of container <div>
        width: document.getElementById('rooms').offsetWidth,
        height: document.getElementById('rooms').offsetHeight
    });

    const layer = new Konva.Layer();
    stage.add(layer);

        
  Object.entries(data).forEach(([roomName, events], pos) => {
  let color = "green";
  if (events.some(e => e.status === "booked")) color = "red";
  else if (events.some(e => e.status === "isBusy")) color = "orange";
  const rect = new Konva.Rect({
    x: (pos % 5) * 100,
    y: Math.floor(pos / 5) * 50,
    width: 100,
    height: 50,
    fill: color,
    shadowBlur: 10,
    cornerRadius: 10
  });

  rect.on("click", () => selectedRoom({ name: roomName, events }));

  rooms[roomName] = rect;
  layer.add(rect);
});

    stage.add(layer);
    return { "rooms": rooms, "layer": layer, "stage": stage };
}

export { drawRoom };