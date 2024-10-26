document.addEventListener("DOMContentLoaded", function () {
  const POLL_INTERVAL = 1000;
  let pollIntervalId;
  let isSearching = false;
  let isDotMenuOpen = false;
  let currentSearchQuery = "";

  pollIntervalId = setInterval(fetchBeneficiaryUpdates, POLL_INTERVAL);
  fetchBeneficiaryUpdates();

  const loadingSpinner = document.getElementById('loadingSpinner');
  function createTableRow(dispense) {
    const row = document.createElement('tr');

    row.innerHTML = `
          <td>${dispense.first_name} ${dispense.middle_name || ''} ${dispense.last_name}</td>
          <td>${dispense.gender}</td>
          <td>${dispense.street} ${dispense.barangay} ${dispense.city} ${dispense.province}</td>
          <td>${dispense.medicine}</td>
          <td>${dispense.quantity}</td>
          <td>${dispense.doctor}</td>
          <td>${dispense.diagnosis}</td>
      `;
    return row;
  }

  function updateDispenseTable(data) {
    const tableBody = document.getElementById("dispenseTableBody");
    tableBody.innerHTML = "";

    if (data.getDispenseList && data.getDispenseList.length > 0) {
      data.getDispenseList.forEach(list => {
        const row = createTableRow(list);
        tableBody.appendChild(row);
      });
    } else {
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML = '<td colspan="8">No list of Beneficiary</td>';
      tableBody.appendChild(emptyRow);
    }

    attachDotEventListeners();
  }

  function fetchDispenseUpdates() {
    if (!isSearching && !isDotMenuOpen) {
      fetch('/pharmacy-records?ajax=true')
        .then(response => response.json())
        .then(data => {
          updateDispenseTable(data);
        })
        .catch(error => {
          console.Error('Error fetching beneficiary updates:', error);
        });
    }
  }

})