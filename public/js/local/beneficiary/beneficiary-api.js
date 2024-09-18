document.addEventListener("DOMContentLoaded", function() {
  const POLL_INTERVAL = 1000;
  let pollIntervalId;
  let isSearching = false;

    var nav2 = document.querySelector(".nav2");
    if (nav2) {
      nav2.classList.toggle("selected");
    }
  
  function updateBeneficiaryTable(data) {
      const tableBody = document.getElementById("beneficiaryTableBody");
      tableBody.innerHTML = "";

      if (data.getBeneficiaryList && data.getBeneficiaryList.length > 0) {
          data.getBeneficiaryList.forEach(list => {
              const row = document.createElement("tr");
              row.innerHTML = `
                  <td> ${list.first_name} ${list.middle_name || ''} ${list.last_name} </td>
                  <td> ${list.gender} </td>
                  <td> ${list.street} ${list.barangay} ${list.city} ${list.province} </td>
                  <td> ${list.phone} </td>
                  <td> ${list.age} </td>
                  <td> ${list.note} </td>
                  <td> ${list.senior_citizen} </td>
                  <td> ${list.pwd} </td>
              `;
              tableBody.appendChild(row);
          });
      } else {
          const emptyRow = document.createElement("tr");
          emptyRow.innerHTML = '<td colspan="8">No list of Beneficiary</td>';
          tableBody.appendChild(emptyRow);
      }
  }

  function fetchBeneficiaryUpdates() {
      if (!isSearching) {
          fetch('/pharmacy-records?ajax=true')
              .then(response => response.json())
              .then(data => {
                  updateBeneficiaryTable(data);
              })
              .catch(error => {
                  console.error('Error fetching beneficiary updates:', error);
              });
      }
  }

  pollIntervalId = setInterval(fetchBeneficiaryUpdates, POLL_INTERVAL);
  fetchBeneficiaryUpdates();

  document.getElementById('searchInput').addEventListener('input', function(event) {
      event.preventDefault();
      const query = this.value;

      if (query.trim() !== "") {
          isSearching = true;
          clearInterval(pollIntervalId);
      } else {
          isSearching = false;
          pollIntervalId = setInterval(fetchBeneficiaryUpdates, POLL_INTERVAL);
      }

      loadingSpinner.style.display = 'block';

      fetch(`/pharmacy-records/search?query=${encodeURIComponent(query)}`)
          .then(response => response.json())
          .then(data => {
              const tableBody = document.querySelector('#beneficiaryTableBody');
              tableBody.innerHTML = '';

              if (data.getBeneficiaryList.length === 0) {
                  tableBody.innerHTML = `
                      <tr>
                          <td colspan="8">No matching records found</td>
                      </tr>`;
              } else {
                  data.getBeneficiaryList.forEach(beneficiary => {
                      const row = document.createElement('tr');
                      row.innerHTML = `
                          <td>${beneficiary.first_name} ${beneficiary.middle_name || ''} ${beneficiary.last_name}</td>
                          <td>${beneficiary.gender}</td>
                          <td>${beneficiary.address}</td>
                          <td>${beneficiary.phone}</td>
                          <td>${beneficiary.age}</td>
                          <td>${beneficiary.note}</td>
                          <td>${beneficiary.senior_citizen}</td>
                          <td>${beneficiary.pwd}</td>
                      `;
                      tableBody.appendChild(row);
                  });
              }
          })
          .catch(error => {
              console.error('Error during search:', error);
          })
          .finally(() => {
              loadingSpinner.style.display = 'none';
          });
  });
});