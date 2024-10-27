document.addEventListener("DOMContentLoaded", function () {
  const POLL_INTERVAL = 1000;
  let pollIntervalId;
  let isSearching = false;
  let isDotMenuOpen = false;
  let currentSearchQuery = "";

  pollIntervalId = setInterval(fetchDispenseUpdates, POLL_INTERVAL);
  fetchDispenseUpdates();

  console.log(fetchDispenseUpdates);

  const loadingSpinner = document.getElementById('loadingSpinner');
  function createTableRow(dispense) {
    const row = document.createElement('tr');
    row.onclick = () => {
      console.log(`Row clicked for ${dispense.first_name} ${dispense.last_name}`);

      // Toggle visibility of the modal and overlay
      document.getElementById('dispense-med').classList.toggle('visible');
      document.querySelector('.overlay').classList.toggle('visible');

      // Set text for each element
      document.getElementById("dispense_name").value = `${dispense.first_name} ${dispense.middle_name || ''} ${dispense.last_name}`;
      document.getElementById("dispense_doctor").value = dispense.prescription[0]?.doctor_name || 'N/A';
      document.getElementById("dispense_diagnosis").value = dispense.prescription[0]?.diagnosis || 'N/A';
      document.getElementById("dispense_receiver").value = dispense.reciever || 'N/A';
      document.getElementById("dispense_relationship").value = dispense.relationship_with_patient || 'N/A';
    };

    row.innerHTML = `
      <td>${dispense.first_name} ${dispense.middle_name || ''} ${dispense.last_name}</td>
      <td>${dispense.gender}</td>
      <td>${dispense.street} ${dispense.barangay} ${dispense.city} ${dispense.province}</td>
      ${dispense.prescription.map(item => `
        <td>${item.medicine || 'N/A'}</td>
        <td>${item.quantity || 'N/A'}</td>
        <td>${item.doctor_name || 'N/A'}</td>
        <td>${item.diagnosis || 'N/A'}</td>
      `).join('')}
    `;

    return row;
  }

  


  function updateDispenseTable(data) {
    const tableBody = document.getElementById("dispenseTableBody");
    tableBody.innerHTML = "";
    console.log(data);



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

  }

  function fetchDispenseUpdates() {
    if (!isSearching && !isDotMenuOpen) {
      fetch('/pharmacy-dispense?ajax=true')
        .then(response => response.json())
        .then(data => {
          updateDispenseTable(data);
          console.log(data);
        })
        .catch(error => {
          console.Error('Error fetching dispense updates:', error);
        });
    }
  }

  document.getElementById('searchInput').addEventListener('input', function (event) {
    event.preventDefault();
    const query = this.value;
    if (query.trim() !== "") {
      isSearching = true;
      clearInterval(pollIntervalId);
    } else {
      isSearching = false;
      pollIntervalId = setInterval(fetchDispenseUpdates, POLL_INTERVAL);
    }

    loadingSpinner.style.display = 'block';

    fetch(`/pharmacy-dispense/search?query=${encodeURIComponent(query)}`)
      .then(response => response.json())
      .then(data => {
        console.log(data);
        const tableBody = document.querySelector('#dispenseTableBody');
        tableBody.innerHTML = '';

        if (data.getDispenseList.length === 0) {
          tableBody.innerHTML = `
            <tr>
              <td colspan="8">No matching records found</td>
            </tr>`;
        } else {
          data.getDispenseList.forEach(dispense => {
            const row = createTableRow(dispense);
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


  // Function to handle pagination clicks
  function handlePagination(event) {
    event.preventDefault();
    const url = new URL(event.target.href);
    const params = new URLSearchParams(url.search);
    // Add search query to the pagination URL if a search is active
    if (currentSearchQuery) {
      params.set('query', currentSearchQuery);
    }
    params.set('ajax', 'true');

    // Fetch new data based on pagination link
    clearInterval(pollIntervalId);  // Stop the interval polling when manually fetching
    fetch(url.pathname + '?' + params.toString())
      .then(response => response.json())
      .then(data => {
        updateDispenseTable(data);
        updatePaginationControls(data.currentPage, data.totalPages, data.limit);
      })
      .catch(error => {
        console.error('Error during pagination:', error);
      });
  }

  // Attach event listeners to pagination links
  function attachPaginationListeners() {
    document.querySelectorAll('nav[aria-label="Page navigation"] a').forEach(link => {
      link.addEventListener('click', handlePagination);
    });
  }

  // Function to update pagination controls
  function updatePaginationControls(currentPage, totalPages, limit) {
    const paginationNav = document.getElementById('paginationNav');
    paginationNav.innerHTML = '';

    if (currentPage > 1) {
      paginationNav.innerHTML += `<a class="prev" href="?page=${currentPage - 1}&limit=${limit}" aria-label="Previous Page">Previous</a>`;
    }

    if (currentPage < totalPages) {
      paginationNav.innerHTML += `<a class="next" href="?page=${currentPage + 1}&limit=${limit}" aria-label="Next Page">Next</a>`;
    }

    attachPaginationListeners();
  }

  attachPaginationListeners();
})