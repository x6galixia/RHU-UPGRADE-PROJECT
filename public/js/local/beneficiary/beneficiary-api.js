document.addEventListener("DOMContentLoaded", function() {
    const POLL_INTERVAL = 1000;
    let pollIntervalId;
    let isSearching = false;
  
    const nav2 = document.querySelector(".nav2");
    if (nav2) {
      nav2.classList.toggle("selected");
    }
  
    function createTableRow(beneficiary) {
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
      return row;
    }
  
    function updateBeneficiaryTable(data) {
      const tableBody = document.getElementById("beneficiaryTableBody");
      tableBody.innerHTML = "";
  
      if (data.getBeneficiaryList && data.getBeneficiaryList.length > 0) {
        data.getBeneficiaryList.forEach(list => {
          const row = createTableRow(list);
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
            alert('Failed to fetch beneficiary updates. Please try again later.');
          });
      }
    }
  
    pollIntervalId = setInterval(fetchBeneficiaryUpdates, POLL_INTERVAL);
    fetchBeneficiaryUpdates();
  
    const loadingSpinner = document.getElementById('loadingSpinner');
  
    function debounce(func, wait) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }
  
    document.getElementById('searchInput').addEventListener('input', debounce(function(event) {
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
              const row = createTableRow(beneficiary);
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
    }, 300));
  });  