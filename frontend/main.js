const socket = io.connect("http://localhost:3000"); // Replace with your server's port number

const statusMessage = document.getElementById("statusMessage");
const requestRideButton = document.getElementById("requestRide");

// Assuming the rideId is static or generated in some way for the example
const rideId = "sample_ride_id"; // Replace with your logic if needed

socket.on("ride-update", (data) => {
  statusMessage.textContent = data.message || "Status updated!";
  if (data.status) {
    statusMessage.textContent += ` (Status: ${data.status})`;
  }
  if (data.driver) {
    statusMessage.textContent += ` (Driver ID: ${data.driver.id})`;
  }
});

requestRideButton.addEventListener("click", () => {
  // Trigger ride request (This is just a placeholder, you might have other logic or API calls here)
  statusMessage.textContent = "Ride requested. Awaiting driver...";
  socket.emit("joinRoom", rideId);
});
