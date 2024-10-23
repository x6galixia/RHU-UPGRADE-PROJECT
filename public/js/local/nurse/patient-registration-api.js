document.getElementById('recently-admitted').addEventListener('click', function () {
  const rhuId = document.getElementById('rhu-select').value;
  loadPage(1, rhuId);
  document.getElementById('recently-admitted-table').style.display = 'block';
});

document.getElementById('rhu-select').addEventListener('change', function () {
  const rhuId = this.value;
  loadPage(1, rhuId);
});

function loadPage(page, rhuId) {
  fetch(`/nurse/patient-registration/recently-added?page=${page}&rhu_id=${rhuId}&ajax=true`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      console.log(data);
      const tbody = document.getElementById('patient-list');
      tbody.innerHTML = '';

      if (data.getPatientList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center">No patients found.</td></tr>`;
        document.getElementById('previous-page').style.display = 'none';
        document.getElementById('next-page').style.display = 'none';
        return;
      }

      data.getPatientList.forEach(patient => {
        const row = `<tr>
            <td>${patient.first_name} ${patient.last_name}</td>
            <td>${patient.check_date}</td>
            <td>${patient.nurse}</td> <!-- Nurse column -->
            <td class="menu-row">
              <img class="dot" src="../icon/triple-dot.svg" alt="">
              <div class="triple-dot">
                <div class="menu" data-id="${patient.patient_id}">
                  <button id="delete-id" onclick="popUp_three_dot(this)">Delete</button>
                  <button id="update-id" onclick="popUp_three_dot(this)">Update</button>
                </div>
              </div>
            </td>
          </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
      });

      const previousPageButton = document.getElementById('previous-page');
      const nextPageButton = document.getElementById('next-page');

      previousPageButton.style.display = data.currentPage > 1 ? 'inline-block' : 'none';
      previousPageButton.onclick = () => loadPage(data.currentPage - 1, rhuId);

      nextPageButton.style.display = data.currentPage < data.totalPages ? 'inline-block' : 'none';
      nextPageButton.onclick = () => loadPage(data.currentPage + 1, rhuId);
    })
    .catch(error => console.error('Error fetching page:', error));
}


document.querySelector('.close_popUp').addEventListener('click', function () {
  document.getElementById('recently-admitted-table').style.display = 'none';
});