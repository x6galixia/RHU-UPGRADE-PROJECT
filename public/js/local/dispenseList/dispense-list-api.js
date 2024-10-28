document.addEventListener("DOMContentLoaded", function () {
    const POLL_INTERVAL = 1000;
    let pollIntervalId;
    let isSearching = false;
    let isDotMenuOpen = false;
    let isModalOpen = false; // New flag for modal state
    let currentSearchQuery = "";

    pollIntervalId = setInterval(fetchDispenseUpdates, POLL_INTERVAL);
    fetchDispenseUpdates();

    const loadingSpinner = document.getElementById('loadingSpinner');

    function getCurrentDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    async function fetchTransactionId() {
        try {
            const response = await fetch('/pharmacy/generate-transaction-id/new-id');
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error fetching transaction ID:', errorData);
                console.error('Response status:', response.status);
                throw new Error('Failed to fetch transaction ID: ' + errorData.message || 'Unknown error');
            }
            const data = await response.json();
            return data.id;
        } catch (error) {
            console.error('Error fetching transaction ID:', error.message);
            return 'Error'; // Return a fallback value
        }
    }


    async function createMedicineTableRows(prescriptions) {
        const medicineTableBody = document.getElementById('medicineTableBody');
        medicineTableBody.innerHTML = ''; // Clear existing rows

        if (prescriptions.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="4">No prescriptions found</td>';
            medicineTableBody.appendChild(emptyRow);
            return;
        }

        for (const prescription of prescriptions) {
            try {
                const transactionId = await fetchTransactionId(); // Await the transaction ID
                const row = document.createElement('tr');
                row.innerHTML = `
              <td>${transactionId}</td>
              <td>${prescription.medicine || 'N/A'}</td>
              <td>${prescription.quantity || 'N/A'}</td>
              <td>${getCurrentDate()}</td>
          `;
                medicineTableBody.appendChild(row);
            } catch (error) {
                console.error('Failed to fetch transaction ID:', error);
                // Optionally handle this error in the UI
            }
        }
    }


    function createTableRow(dispense) {
        const row = document.createElement('tr');
        row.onclick = () => {
            console.log(`Row clicked for ${dispense.first_name} ${dispense.last_name}`);

            // Fill the modal with patient info
            document.getElementById('dispense_name').value = `${dispense.first_name} ${dispense.middle_name || ''} ${dispense.last_name}`;
            document.getElementById('dispense_receiver').value = dispense.reciever || 'N/A';
            document.getElementById('dispense_relationship').value = dispense.relationship_with_patient || 'N/A';

            // Check if there are prescriptions
            if (dispense.prescription && dispense.prescription.length > 0) {
                document.getElementById("dispense_doctor").value = dispense.prescription[0]?.doctor_name || 'N/A';
                document.getElementById("dispense_diagnosis").value = dispense.prescription[0]?.diagnosis || 'N/A';
                createMedicineTableRows(dispense.prescription);
            } else {
                document.getElementById("dispense_doctor").value = 'N/A';
                document.getElementById("dispense_diagnosis").value = 'N/A';
            }

            // Toggle visibility of the modal and overlay
            document.getElementById('dispense-med').classList.toggle('visible');
            document.querySelector('.overlay').classList.toggle('visible');
        };

        const dispenseTableBody = document.getElementById('dispenseTableBody');
        dispenseTableBody.innerHTML = '';

        row.innerHTML = `
          <td>${dispense.first_name} ${dispense.middle_name || ''} ${dispense.last_name}</td>
          <td>${dispense.gender}</td>
          <td>${dispense.street} ${dispense.barangay} ${dispense.city} ${dispense.province}</td>
          <td>${dispense.reciever}</td>
          <td>${dispense.relationship_with_patient}</td>
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
            emptyRow.innerHTML = '<td colspan="8">No dispense list</td>';
            tableBody.appendChild(emptyRow);
        }
    }

    function fetchDispenseUpdates() {
        if (!isSearching && !isDotMenuOpen && !isModalOpen) { // Check modal state
            fetch('/pharmacy-dispense?ajax=true')
                .then(response => response.json())
                .then(data => {
                    updateDispenseTable(data);
                    console.log(data);
                })
                .catch(error => {
                    console.error('Error fetching dispense updates:', error);
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

    function handlePagination(event) {
        event.preventDefault();
        const url = new URL(event.target.href);
        const params = new URLSearchParams(url.search);
        if (currentSearchQuery) {
            params.set('query', currentSearchQuery);
        }
        params.set('ajax', 'true');

        clearInterval(pollIntervalId);
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

    function attachPaginationListeners() {
        document.querySelectorAll('nav[aria-label="Page navigation"] a').forEach(link => {
            link.addEventListener('click', handlePagination);
        });
    }

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

    // // Update modal state on modal close
    // document.getElementById('dispense-med').addEventListener('click', function () {
    //     this.classList.remove('visible');
    //     document.querySelector('.overlay').classList.remove('visible');
    // });

    attachPaginationListeners();
});