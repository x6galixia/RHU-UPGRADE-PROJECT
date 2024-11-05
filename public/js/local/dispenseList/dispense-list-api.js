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

    const mymy = (async () => {
        const transac = await fetchTransactionId();
        console.log('Transaction ID:', transac);
    })();

    function fetchDispenseDetails(patientPrescriptionId) {
        // Fetch detailed data for the clicked dispense row
        fetch(`/pharmacy-dispense/${patientPrescriptionId}`)
          .then(response => response.json())
          .then(data => {
            console.log('Fetched Dispense Details:', data);  // Optionally log the detailed data
          })
          .catch(error => {
            console.error('Error fetching dispense details:', error);
          });
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
    
        for (const [index, prescription] of prescriptions.entries()) {
            try {
                const transactionId = await fetchTransactionId();
                const row = document.createElement('tr');
  
                row.innerHTML = `
                    <td>
                        ${transactionId}
                        <input type="hidden" name="medicines[${index}][product_id]" value="${prescription.product_id || 'N/A'}">
                    </td>
                    <td>
                        ${prescription.medicine || 'N/A'}
                        <input type="hidden" name="medicines[${index}][product_details]" value="${prescription.medicine || 'N/A'}">
                    </td>
                    <td>
                        ${prescription.quantity || 'N/A'}
                        <input type="hidden" name="medicines[${index}][quantity]" value="${prescription.quantity || 'N/A'}">
                    </td>
                    <td>
                        ${getCurrentDate()}
                    </td>
                    <!-- Hidden batch number -->
                    <input type="hidden" name="medicines[${index}][batch_number]" value="${prescription.batch_number || 'N/A'}">   
                `;
    
                medicineTableBody.appendChild(row);
            } catch (error) {
                console.error('Failed to fetch transaction ID:', error);
            }
        }
    }

    function createTableRow(dispense) {  
        const row = document.createElement('tr');
        row.onclick = async () => {
            console.log(`Row clicked for ${dispense.first_name} ${dispense.last_name}`);
            fetchDispenseDetails(dispense.patient_id);
            //hidden in the modal
            document.getElementById('patient_prescription_id').value = dispense.patient_prescription_id;
            document.getElementById('beneficiary_id').value = parseInt(dispense.patient_id, 10);
            document.getElementById('date_issued').value = getCurrentDate();
            const transac = await fetchTransactionId();
            document.getElementById('transaction_number').value = transac;

            // Fill the modal with patient info
            document.getElementById('dispense_name').value = `${dispense.first_name} ${dispense.middle_name || ''} ${dispense.last_name}`;
            document.getElementById('dispense_receiver').value = dispense.reciever || 'N/A';
            document.getElementById('dispense_relationship').value = dispense.relationship_with_patient || 'N/A';

            // Check if there are prescriptions
            if (dispense.prescription && dispense.prescription.length > 0) {
                document.getElementById("dispense_doctor").value = dispense.prescription[0]?.doctor_name || 'N/A';
                document.getElementById("dispense_diagnosis").value = dispense.prescription[0]?.diagnosis || 'N/A';
                document.getElementById("dispense_findings").value = dispense.prescription[0]?.findings || 'N/A';
                createMedicineTableRows(dispense.prescription);
            } else {
                document.getElementById("dispense_doctor").value = 'N/A';
                document.getElementById("dispense_diagnosis").value = 'N/A';
                document.getElementById("dispense_findings").value = 'N/A';
            }

            // Toggle visibility of the modal and overlay
            document.getElementById('dispense-med').classList.toggle('visible');
            document.querySelector('.overlay').classList.toggle('visible');
        };

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
        console.log("Fetched dispense data:", data);
    
        if (data.getDispenseList && data.getDispenseList.length > 0) {
            data.getDispenseList.forEach(list => {
                console.log("Adding row for:", list); // Log each list item
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
            fetch('/pharmacy-dispense-request?ajax=true')
                .then(response => response.json())
                .then(data => {
                    updateDispenseTable(data);
                })
                .catch(error => {
                    console.error('Error fetching dispense updates:', error);
                });
        }
    }

    // Debounce function
    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    document.getElementById('searchInput').addEventListener('input', debounce(function (event) {
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
    },300));

    function handlePagination(event) {
        event.preventDefault();
        const url = new URL(event.target.href);
        const params = new URLSearchParams(url.search);
        
        // Only update the query if the current search query exists
        if (currentSearchQuery) {
            params.set('query', currentSearchQuery);
        }
        
        params.set('ajax', 'true'); // Ensure this is set for AJAX requests
        const page = parseInt(params.get('page')) || 1; // Read page from URL
        const limit = parseInt(params.get('limit')) || 10; // Read limit from URL
        
        clearInterval(pollIntervalId); // Stop polling when handling pagination
        fetch(`/pharmacy-dispense-request?${params.toString()}`)
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

    attachPaginationListeners();
});