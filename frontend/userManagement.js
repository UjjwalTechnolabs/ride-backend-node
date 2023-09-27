document.addEventListener("DOMContentLoaded", () => {
  fetch("http://localhost:3000/api/v1/users?currency=USD&lang=en") // adjust as needed
    .then((response) => response.json())
    .then((data) => {
      const userTbody = document.getElementById("userTbody");
      data.users.forEach((user) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.first_name}</td>
                    <td>${user.last_name}</td>
                    <td>${user.email}</td>
                    <td>${user.phoneNumber}</td>
                    <td>${user.address_line_1}, ${user.address_line_2}, ${
          user.city
        }, ${user.state}, ${user.postal_code}, ${user.country}</td>
                    <td>${user.is_active ? "Active" : "Inactive"}</td>
                    <!-- Additional Fields as Required -->
                `;
        userTbody.appendChild(tr);
      });
    })
    .catch((err) => console.error("Error fetching users:", err));
});
