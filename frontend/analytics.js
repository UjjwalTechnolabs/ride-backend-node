// app.js
document.addEventListener("DOMContentLoaded", function () {
  fetch("http://localhost:3000/api/v1/analytics/1/CHANGE_CURRENCY")
    .then((response) => response.json())
    .then((data) => {
      renderGraph(data.graphData);
      renderTable(data.summary);
    })
    .catch((err) => console.error("Error fetching event data:", err));
});

function renderGraph(graphData) {
  const ctx = document.getElementById("graphContainer").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: graphData.map((data) => data.eventType),
      datasets: [
        {
          label: "Event Count",
          data: graphData.map((data) => data.eventCount),
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

function renderTable(summary) {
  const tbody = document.getElementById("eventDataBody");
  summary.forEach((eventData) => {
    const tr = document.createElement("tr");

    // Prettifying JSON and using <pre> for maintaining format
    const prettyEventData = `<pre>${JSON.stringify(eventData, null, 2)}</pre>`;

    tr.innerHTML = `<td>${eventData.eventType || "N/A"}</td>
                      <td>${prettyEventData}</td>`;
    tbody.appendChild(tr);
  });
}
