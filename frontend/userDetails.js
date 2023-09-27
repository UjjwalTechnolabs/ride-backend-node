document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = 1;

  if (!userId) {
    return alert("Invalid User ID");
  }

  fetch(`http://localhost:3000/api/v1/users/${userId}`)
    .then((response) => {
      if (!response.ok) throw new Error("User not found");
      return response.json();
    })
    .then((user) => {
      const userDetails = document.getElementById("userDetails");
      userDetails.innerHTML = `
                <h2>${user.first_name} ${user.last_name}</h2>
                <p>Email: ${user.email}</p>
                <p>Phone Number: ${user.phoneNumber}</p>
                <p>Status: ${user.is_email_verified ? "Active" : "Inactive"}</p>
                <!-- More details as needed -->
            `;
    })
    .catch((err) => console.error("Error fetching user details:", err));
});
