document.addEventListener("DOMContentLoaded", function () {
    const POLL_INTERVAL = 1000;
    let pollIntervalId;
    let isSearching = false;
    let currentSearchQuery = "";

    var nav1 = document.querySelector(".nav1");
    if (nav1) {
        nav1.classList.toggle("selected");
    }

    function updateInventoryTable(data) {
        const tableBody = document.getElementById("inventoryTableBody");
        tableBody.innerHTML = "";

        if (data.getInventoryList.length > 0) {
            data.getInventoryList.forEach(list => {
                const row = document.createElement("tr");
                row.innerHTML = `
                  <td>${list.product_id}</td>
                  <td>${list.product_code}</td>
                  <td>${list.product_name}</td>
                  <td>${list.brand_name}</td>
                  <td>${list.supplier}</td>
                  <td>${list.dosage_form}</td>
                  <td>${list.dosage}</td>
                  <td>${list.reorder_level}</td>
                  <td>${list.batch_number}</td>
                  <td>${list.product_quantity}</td>
                  <td>${list.expiration}</td>
              `;
                tableBody.appendChild(row);
            });
        } else {
            const emptyRow = document.createElement("tr");
            emptyRow.innerHTML = '<td colspan="11">No list of Medicine</td>';
            tableBody.appendChild(emptyRow);
        }
    }

    function fetchInventoryUpdates() {
        if (!isSearching) {
            fetch('/pharmacy-inventory?ajax=true')
                .then(response => response.json())
                .then(data => {
                    updateInventoryTable(data);
                })
                .catch(error => {
                    console.error('Error fetching inventory updates:', error);
                });
        }
    }

    pollIntervalId = setInterval(fetchInventoryUpdates, POLL_INTERVAL);

    document.getElementById('searchInput').addEventListener('input', function (event) {
        event.preventDefault();

        const query = this.value;

        if (query.trim() !== "") {
            isSearching = true;
            clearInterval(pollIntervalId);
        } else {
            isSearching = false;
            pollIntervalId = setInterval(fetchInventoryUpdates, POLL_INTERVAL);
        }

        loadingSpinner.style.display = 'block';

        fetch(`/pharmacy-inventory/search?query=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                const tableBody = document.querySelector('#inventoryTableBody');
                tableBody.innerHTML = '';

                if (data.getInventoryList.length === 0) {
                    tableBody.innerHTML = `
                      <tr>
                          <td colspan="11">No matching records found</td>
                      </tr>`;
                } else {
                    data.getInventoryList.forEach(medicine => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                          <td>${medicine.product_id}</td>
                          <td>${medicine.product_code}</td>
                          <td>${medicine.product_name}</td>
                          <td>${medicine.brand_name}</td>
                          <td>${medicine.supplier}</td>
                          <td>${medicine.dosage_form}</td>
                          <td>${medicine.dosage}</td>
                          <td>${medicine.reorder_level}</td>
                          <td>${medicine.batch_number}</td>
                          <td>${medicine.product_quantity}</td>
                          <td>${medicine.expiration}</td>
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
                updateInventoryTable(data);
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
            paginationNav.innerHTML += `<a href="?page=${currentPage - 1}&limit=${limit}" aria-label="Previous Page">Previous</a>`;
        }

        if (currentPage < totalPages) {
            paginationNav.innerHTML += `<a href="?page=${currentPage + 1}&limit=${limit}" aria-label="Next Page">Next</a>`;
        }

        // Re-attach the event listeners after updating the pagination links
        attachPaginationListeners();
    }

    // Initial setup
    attachPaginationListeners();
});