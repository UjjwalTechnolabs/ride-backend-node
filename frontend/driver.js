let currentPage = 1;
let totalPages = 1;

document.addEventListener("DOMContentLoaded", function () {
  fetchDriverList();
});

function fetchDriverList() {
  const status = document.getElementById("statusFilter").value;
  const sortBy = document.getElementById("sortBy").value;
  const order = document.getElementById("order").value;

  fetch(
    `http://localhost:3000/api/v1/drivers?status=${status}&sortBy=${sortBy}&order=${order}&page=${currentPage}&limit=1`
  )
    .then((response) => response.json())
    .then((data) => {
      renderDriverList(data.drivers);
      totalPages = data.totalPages;
      updatePagination();
    })
    .catch((err) => console.error("Error fetching driver list:", err));
}

function updatePagination() {
  document.getElementById("currentPage").textContent = currentPage;
  document.getElementById("totalPages").textContent = totalPages;
}

function nextPage() {
  if (currentPage < totalPages) {
    currentPage++;
    fetchDriverList();
  }
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    fetchDriverList();
  }
}
function renderDriverList(drivers) {
  const driverListContainer = document.getElementById("driverListContainer"); // The container where the driver list will be appended
  driverListContainer.innerHTML = ""; // Clearing any existing content

  drivers.forEach((driver) => {
    const driverItem = document.createElement("div");
    driverItem.className = "driver-item";

    const driverName = document.createElement("p");
    driverName.textContent = `Name: ${driver.name}`;
    driverItem.appendChild(driverName);

    // Similarly, create and append other driver details you want to display

    driverListContainer.appendChild(driverItem);
  });
}
