document.addEventListener("DOMContentLoaded", function () {
    const POLL_INTERVAL = 1000;
    let pollIntervalId;
    let isSearching = false;
    let isDotMenuOpen = false;

    const nav2 = document.querySelector(".nav2");
    if (nav2) {
        nav2.classList.toggle("selected");
    }

    var main_container = "dot";
    var triple_dot = "triple-dot";

    function createTableRow(beneficiary) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${beneficiary.first_name} ${beneficiary.middle_name || ''} ${beneficiary.last_name}</td>
            <td>${beneficiary.gender}</td>
            <td>${beneficiary.street} ${beneficiary.barangay} ${beneficiary.city} ${beneficiary.province}</td>
            <td>${beneficiary.phone}</td>
            <td>${beneficiary.age}</td>
            <td>${beneficiary.note}</td>
            <td>${beneficiary.senior_citizen}</td>
            <td>${beneficiary.pwd}</td>
            <td class="menu-row">
                <img class="${main_container}" src="../icon/triple-dot.svg" alt="">
                <div class="${triple_dot}">
                    <div class="menu">
                        <button>Delete</button>
                        <button>Update</button>
                        <button>Generate ID</button>
                    </div>
                </div>
            </td>
        `;
        return row;
    }

    function attachDotEventListeners() {
        document.querySelectorAll(".dot").forEach(function (dot) {
            dot.addEventListener("click", function () {
                const tripleDotContainer = dot.closest("td").querySelector(".triple-dot");
                if (tripleDotContainer) {
                    tripleDotContainer.classList.toggle("visible");
                    if (tripleDotContainer.classList.contains("visible")) {
                        clearInterval(pollIntervalId);
                        isDotMenuOpen = true;
                    } else {
                        pollIntervalId = setInterval(fetchBeneficiaryUpdates, POLL_INTERVAL);
                        isDotMenuOpen = false;
                    }
                }
            });
        });
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

        attachDotEventListeners();
    }

    function fetchBeneficiaryUpdates() {
        if (!isSearching && !isDotMenuOpen) {
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
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
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
                attachDotEventListeners();
            })
            .catch(error => {
                console.error('Error during search:', error);
            })
            .finally(() => {
                loadingSpinner.style.display = 'none';
            });
    }, 300));

    // Function to handle pagination clicks
    function handlePagination(event) {
        event.preventDefault();
        const url = event.target.getAttribute('href');

        if (url) {
            // Fetch new data based on pagination link
            clearInterval(pollIntervalId);  // Stop the interval polling when manually fetching
            fetch(url + '&ajax=true')
                .then(response => response.json())
                .then(data => {
                    updateBeneficiaryTable(data);
                    updatePaginationControls(data.currentPage, data.totalPages, data.limit);
                })
                .catch(error => {
                    console.error('Error during pagination:', error);
                });
        }
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