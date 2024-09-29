document.addEventListener("DOMContentLoaded", function () {
    const POLL_INTERVAL = 1000;
    let pollIntervalId;
    let isSearching = false;
    let isDotMenuOpen = false;
    let currentSearchQuery = "";

    pollIntervalId = setInterval(fetchBeneficiaryUpdates, POLL_INTERVAL);
    fetchBeneficiaryUpdates();

    const loadingSpinner = document.getElementById('loadingSpinner');
    var main_container = "dot";
    var triple_dot = "triple-dot";

    const nav2 = document.querySelector(".nav2");
    if (nav2) {
        nav2.classList.toggle("selected");
    }

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
                        <button class="delete-button" data-id="${beneficiary.beneficiary_id}">Delete</button>
                        <button id="update-id" onclick="popUp_three_dot(this)">Update</button>
                        <button id="generate-id" onclick="popUp_three_dot(this)">Generate ID</button>
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
            document.addEventListener("click", function (event) {
                // Check if the click was outside the dot container
                if (!dot.contains(event.target)) {
                    const tripleDotContainer = dot.closest("td").querySelector(".triple-dot");
                    if (tripleDotContainer && tripleDotContainer.classList.contains("visible")) {
                        tripleDotContainer.classList.remove("visible");
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
                    console.Error('Error fetching beneficiary updates:', error);
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
                updateBeneficiaryTable(data);
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

        attachPaginationListeners();
    }

    const update_beneficiary = document.getElementById("update-beneficiary");
    const overlay = document.querySelector(".overlay");

    window.popUp_three_dot = function (button) {
        const action = button.textContent.trim();
        const beneficiaryId = button.closest('.menu').querySelector('.delete-button').getAttribute('data-id');
    
        if (action === 'Update' && beneficiaryId) {
            fetch(`/pharmacy-records/beneficiary/${beneficiaryId}`)
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(beneficiaryData => {
                    document.getElementById('beneficiary_id').value = beneficiaryData.beneficiary_id || '';
                    document.getElementById('last_name').value = beneficiaryData.last_name || '';
                    document.getElementById('first_name').value = beneficiaryData.first_name || '';
                    document.getElementById('middle_name').value = beneficiaryData.middle_name || '';
                    document.getElementById('gender').value = beneficiaryData.gender || '';
                    document.getElementById('birthdate').value = beneficiaryData.birthdate.split('T')[0] || '';
                    document.getElementById('phone').value = beneficiaryData.phone || '';
                    document.getElementById('processed_date').value = beneficiaryData.processed_date.split('T')[0] || '';
                    document.getElementById('occupation').value = beneficiaryData.occupation || '';
                    document.getElementById('street').value = beneficiaryData.street || '';
                    document.getElementById('barangay').value = beneficiaryData.barangay || '';
                    document.getElementById('city').value = beneficiaryData.city || '';
                    document.getElementById('province').value = beneficiaryData.province || '';
                    document.getElementById('senior_citizen').value = beneficiaryData.senior_citizen || '';
                    document.getElementById('pwd').value = beneficiaryData.pwd || '';
                    document.getElementById('note').value = beneficiaryData.note || '';
                    document.getElementById('existing_picture').value = beneficiaryData.picture || '';

                    const pictureElement = document.getElementById('pictureDisplay'); 
                    if (pictureElement) {
                        const picturePath = (beneficiaryData.picture && beneficiaryData.picture !== '0')
                            ? `/uploads/beneficiary-img/${beneficiaryData.picture}`
                            : '/icon/upload-img-default.svg';
                        pictureElement.src = picturePath;
                    } else {
                        console.error('Image element not found');
                    } 

                    const fileInput = document.getElementById('picture');
                    if (fileInput) {
                        fileInput.value = '';
                    }

                    update_beneficiary.classList.add("visible");
                    overlay.classList.add("visible");
                })
                .catch(error => {
                    console.error('Error fetching beneficiary data:', error);
                    alert('Failed to fetch beneficiary data. Please try again.');
                });
        }
    };    

    document.getElementById('beneficiaryTableBody').addEventListener('click', function (event) {
        if (event.target.classList.contains('delete-button')) {
            const confirmDeleteButton = document.getElementById('confirm-delete');
            const cancelDeleteButton = document.getElementById('cancel-delete');
            const pop_up_Delete = document.getElementById('delete-beneficiary');
            const beneficiaryId = event.target.getAttribute('data-id');

            pop_up_Delete.classList.add("visible");

            confirmDeleteButton.onclick = () => {
                deleteBeneficiary(beneficiaryId);
                pop_up_Delete.classList.remove("visible");
            };

            cancelDeleteButton.onclick = () => {
                pop_up_Delete.classList.remove("visible");
            };
        }
    });

    async function deleteBeneficiary(beneficiaryId) {
        console.log('Sending DELETE request for ID:', beneficiaryId);
        try {
            const response = await fetch(`/pharmacy-records/delete/${beneficiaryId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete beneficiary');
            }

            alert('Beneficiary deleted successfully.');
            fetchBeneficiaryUpdates();
        } catch (error) {
            console.error('Error deleting beneficiary:', error);
            alert('An error occurred while trying to delete the beneficiary. Please try again.');
        }
    }

    // Initial setup
    attachPaginationListeners();
});