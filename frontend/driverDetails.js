document.addEventListener("DOMContentLoaded", function () {
  fetchDriverDetails();
});

function fetchDriverDetails() {
  const driverId = 1; // replace with actual driverId
  fetch(`http://localhost:3000/api/v1/drivers/${driverId}`)
    .then((response) => response.json())
    .then((data) => {
      const driver = data.driver;
      document.getElementById("name").textContent = driver.name;
      document.getElementById("address").textContent = driver.address;
      document.getElementById("make").textContent = driver.vehicle.make;
      document.getElementById("model").textContent = driver.vehicle.model;

      // Other fields...

      const reviewList = document.getElementById("reviews");
      data.reviews.forEach((review) => {
        const li = document.createElement("li");
        li.className = "list-group-item";
        li.textContent = `${review.rating}/5 - ${review.comment || ""}`; // Assuming review has rating and comment
        reviewList.appendChild(li);
      });
    })
    .catch((err) => console.error("Error fetching driver details:", err));
}
