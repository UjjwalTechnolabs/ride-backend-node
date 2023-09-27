let map;
let marker;

function initMap() {
  const initialPosition = { lat: 28.6139, lng: 77.209 }; // Default Position (Delhi for example)
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: initialPosition,
  });

  marker = new google.maps.Marker({
    position: initialPosition,
    map: map,
  });
}

const socket = io.connect("http://localhost:3000");
socket.on("driverLocationUpdated", (data) => {
  console.log("Driver Location Updated:", data);
  const newPosition = new google.maps.LatLng(data.latitude, data.longitude);
  marker.setPosition(newPosition);
  map.panTo(newPosition);
});
