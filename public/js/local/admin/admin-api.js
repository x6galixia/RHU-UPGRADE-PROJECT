async function fetchData() {
    const response = await fetch('/api/users');
    const data = await response.json();
    const dataTable = document.getElementById('data-table');

    data.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
      <td>${user.user_type}</td>
      <td>${user.firstname} ${user.middle_name} ${user.surname}</td>
    `;
        dataTable.appendChild(row);
    });
}

window.onload = fetchData;

document.addEventListener("DOMContentLoaded", function () {
    var nav2 = document.querySelector(".nav2");
    if (nav2) {
        nav2.classList.toggle("selected");
    }
});

document.getElementById("submission-form").addEventListener("submit", function (event) {
    const password = document.querySelector('input[name="password"]').value;
    const confirmPassword = document.querySelector('input[name="confirm_password"]').value;

    if (password !== confirmPassword) {
        event.preventDefault();
        alert("Passwords do not match!");
    }
});