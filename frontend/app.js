let map;
let drawingManager;
let polygons = [];

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 8,
  });

  drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.POLYGON,
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: ["polygon"],
    },
  });
  drawingManager.setMap(map);

  google.maps.event.addListener(
    drawingManager,
    "polygoncomplete",
    function (polygon) {
      polygons.push(polygon);
    }
  );
}

document
  .getElementById("addLocationBtn")
  .addEventListener("click", function () {
    const address = document.getElementById("locationAddress").value;

    if (!address) {
      alert("Please enter a location address.");
      return;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: address }, function (results, status) {
      if (status === "OK") {
        map.setCenter(results[0].geometry.location);
      } else {
        alert("Geocode was not successful for the following reason: " + status);
      }
    });
  });
document.getElementById("resetBtn").addEventListener("click", function () {
  // Clear All Drawn Polygons
  polygons.forEach((polygon) => polygon.setMap(null));
  polygons = []; // Clear the polygons array

  // Clear Form Fields
  document.getElementById("locationForm").reset();
  document.getElementById("locationAddress").value = "";
});

document
  .getElementById("locationForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const locationName = document.getElementById("locationName").value;
    if (!locationName || !polygons.length) {
      alert("Please enter location name and draw a polygon on the map.");
      return;
    }

    // Replace with your API endpoint
    const apiEndpoint = "http://localhost:3000/api/v1/locations";

    // Making POST request to your API
    fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: locationName,
        geometry: {
          type: "Polygon",
          coordinates: polygons.map((polygon) =>
            polygon
              .getPath()
              .getArray()
              .map((coord) => [coord.lng(), coord.lat()])
          ),
        },
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        alert("Location Saved Successfully!");
        window.location.reload();
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Error Saving Location!");
      });
  });

// Initialize Map
initMap();
