// driverEarnings.js
// ...

async function updateEarnings() {
  try {
    const driverId = 1; // Yahan par aapko actual driverId dalni hogi.
    const interval = document.getElementById("intervalSelect").value;
    const currency = document.getElementById("currencySelect").value;

    const response = await fetch(
      `http://localhost:3000/api/v1/drivers/${driverId}/earnings?interval=${interval}&currency=${currency}`
    );
    if (!response.ok) throw new Error("Error fetching earnings");

    const data = await response.json();
    // Aapko yahan par data ko display karne ka logic likhna hoga, maan lo aapko table mein display karna hai toh:
    displayEarningsTable(data);
  } catch (error) {
    console.error("Error updating earnings:", error);
    // Handle errors gracefully, maan lo user ko koi error message dikhana ho toh:
    // displayErrorMessage(error.message);
  }
}
function displayEarningsTable(data) {
  console.log(data); // log the data to confirm the structure.

  const table = document.getElementById("earningsTable");

  // Clear existing rows if any.
  while (table.rows.length > 1) table.deleteRow(1);

  // Insert new row
  const row = table.insertRow(-1);
  const cell1 = row.insertCell(0);
  const cell2 = row.insertCell(1);

  // Check if earnings exist, if not, display 0 or some placeholder.
  cell1.textContent = data.earnings ? data.earnings.toFixed(2) : "0.00";
  cell2.textContent = data.currency || "N/A"; // If currency is also undefined, it will display 'N/A'
}

// Call updateEarnings when the page loads to display the initial data
document.addEventListener("DOMContentLoaded", function () {
  updateEarnings();
});
