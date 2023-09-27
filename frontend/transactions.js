document.addEventListener("DOMContentLoaded", () => {
  const currencySelect = document.getElementById("currencySelect");
  const transactionTableBody = document.getElementById("transactionTableBody");
  const analyticsChart = document.getElementById("analyticsChart");

  function fetchTransactions(currency) {
    // Example API endpoint. Please replace with your actual endpoint.
    fetch(`http:localhost:3000/api/v1/transactions/1?currency=${currency}`)
      .then((response) => response.json())
      .then((data) => {
        transactionTableBody.innerHTML = ""; // Clear existing transactions
        data.transactions.forEach((transaction) => {
          const row = document.createElement("tr");
          row.innerHTML = `<td>${transaction.id}</td><td>${transaction.amount}</td><td>${transaction.currencyCode}</td>`;
          transactionTableBody.appendChild(row);
        });

        // Example data for chart
        const chartData = {
          labels: data.transactions.map((transaction) => transaction.id),
          datasets: [
            {
              label: "Transaction Amounts",
              data: data.transactions.map((transaction) => transaction.amount),
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
            },
          ],
        };

        // Initialize or update the chart
        if (window.myChart) {
          window.myChart.data = chartData;
          window.myChart.update();
        } else {
          window.myChart = new Chart(analyticsChart, {
            type: "bar",
            data: chartData,
            options: { scales: { yAxes: [{ ticks: { beginAtZero: true } }] } },
          });
        }
      })
      .catch((error) => console.error("Error fetching transactions:", error));
  }

  currencySelect.addEventListener("change", () =>
    fetchTransactions(currencySelect.value)
  );

  // Fetch transactions on page load with default currency
  fetchTransactions(currencySelect.value);
});
