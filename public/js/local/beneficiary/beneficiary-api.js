document.addEventListener("DOMContentLoaded", function () {
    const POLL_INTERVAL = 3000;
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

    function formatDate(dateString) {
        const options = {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        };
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", options);
      }

      function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }
    

    async function fetchTransactions(beneficiaryId) {
        const response = await fetch(`/pharmacy-records/beneficiary-index-form/${beneficiaryId}`);
        const transactions = await response.json();
        fillTransactionTable(transactions);
    }    

    function fillTransactionTable(transactions) {
        const tableBody = document.querySelector("tbody[beneficiaryIndexTable]");
        tableBody.innerHTML = "";
    
        if (transactions.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="8">No transactions available</td>';
            tableBody.appendChild(emptyRow);
            return;
        }
    
        transactions.forEach(transaction => {
            const row = document.createElement('tr');
    
            row.innerHTML = `
                <td>${transaction.transaction_number}</td>
                <td>${transaction.product_details}</td>    
                <td>${transaction.quantity}</td>
                <td>${transaction.batch_number}</td>
                <td>${formatDate(transaction.date_issued)}</td>        
                <td>${transaction.doctor}</td>             
                <td>${transaction.reciever}</td>          
                <td>${transaction.relationship_beneficiary}</td>
            `;
    
            tableBody.appendChild(row);
        });
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
                    <div class="menu" data-id="${beneficiary.beneficiary_id}">
                        <button id="delete-id" onclick="popUp_three_dot(this)">Delete</button>
                        <button id="update-id" onclick="popUp_three_dot(this)">Update</button>
                        <button id="generate-id" onclick="popUp_three_dot(this)">Generate ID</button>
                    </div>
                </div>
            </td>
        `;

        const cells = Array.from(row.children).slice(0, -1); // Exclude the last `td`
        cells.forEach(cell => {
            cell.onclick = async () => {
                await fetchTransactions(beneficiary.beneficiary_id);
                console.log(`Row clicked for ${beneficiary.first_name} ${beneficiary.last_name}`);

                document.getElementById('ben_name').value = `${beneficiary.first_name} ${beneficiary.middle_name || ''} ${beneficiary.last_name}`;
                document.getElementById('ben_age').value = `${beneficiary.age}`;
                document.getElementById('ben_address').value = `${beneficiary.barangay} ${beneficiary.city || ''} ${beneficiary.province}`;
                document.getElementById('ben_number').value = `${beneficiary.phone}`;
                document.getElementById('ben_senior').value = `${beneficiary.senior_citizen}`;
                document.getElementById('ben_pwd').value = `${beneficiary.pwd}`;
                document.getElementById('ben_gender').value = `${beneficiary.gender}`;

                const pictureElement = document.getElementById('ben_profile');
                if (pictureElement) {
                    const picturePath = (beneficiary.picture && beneficiary.picture !== '0')
                        ? `/uploads/beneficiary-img/${beneficiary.picture}`
                        : (beneficiary.gender === "Male"
                            ? "/icon/upload-img-default.svg"
                            : "/icon/upload-img-default-woman.svg");
                    pictureElement.src = picturePath;
                }

                document.getElementById('beneficiary-index').classList.toggle('visible');
                document.querySelector('.overlay').classList.toggle('visible');
            };
        });

        return row;
    }


    window.popUp_index = function popUp_index(id) {
        console.log(id);
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
    }, 500));    

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
            paginationNav.innerHTML += `<a class="prev" href="?page=${currentPage - 1}&limit=${limit}" aria-label="Previous Page">Previous</a>`;
        }

        if (currentPage < totalPages) {
            paginationNav.innerHTML += `<a class="next" href="?page=${currentPage + 1}&limit=${limit}" aria-label="Next Page">Next</a>`;
        }

        // Re-attach the event listeners after updating the pagination links
        attachPaginationListeners();
    }

    const update_beneficiary = document.getElementById("update-beneficiary");
    const overlay = document.querySelector(".overlay");

    window.popUp_three_dot = function (button) {
        const action = button.textContent.trim();
        const beneficiaryId = button.closest('.triple-dot').querySelector('.menu').getAttribute('data-id');

        if (action === 'Delete' && beneficiaryId) {

            const confirmDeleteButton = document.getElementById('confirm-delete');
            const cancelDeleteButton = document.getElementById('cancel-delete');
            const pop_up_Delete = document.getElementById('delete-beneficiary');

            pop_up_Delete.classList.add("visible");
            overlay.classList.add("visible");

            confirmDeleteButton.addEventListener('click', function () {
                deleteBeneficiary(beneficiaryId);
                pop_up_Delete.classList.remove("visible");
                overlay.classList.remove("visible");
            })
            cancelDeleteButton.addEventListener('click', function () {
                pop_up_Delete.classList.remove("visible");
                overlay.classList.remove("visible");
            })
        }
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

                    var picture;
                    if (beneficiaryData.gender === "Male") {
                        picture = "/icon/upload-img-default.svg";
                    } else {
                        picture = "/icon/upload-img-default-woman.svg";
                    }


                    const pictureElement = document.getElementById('pictureDisplay');
                    if (pictureElement) {
                        const picturePath = (beneficiaryData.picture && beneficiaryData.picture !== '0') ? `/uploads/beneficiary-img/${beneficiaryData.picture}` : picture;
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
        if (action === 'Generate ID' && beneficiaryId) {
            const id_card = document.getElementById("id");
            id_card.classList.add("visible");

            fetch(`/pharmacy-records/beneficiary/${beneficiaryId}`)
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(beneficiaryData => {
                    console.log(beneficiaryData.beneficiary_id);
                    var full_name = beneficiaryData.last_name + ", " + beneficiaryData.first_name + " " + beneficiaryData.middle_name;
                    var address = beneficiaryData.street + " " + beneficiaryData.barangay + " " + beneficiaryData.city + " " + beneficiaryData.province;
                    var status;
                    var phone;

                    if (!beneficiaryData.phone || isNaN(beneficiaryData.phone) || beneficiaryData.phone.length < 11) {
                        phone = "None";
                    } else {
                        phone = beneficiaryData.phone;
                    }

                    if (beneficiaryData.senior_citizen === "Yes") {
                        status = "Senior Citizen";
                    } else if (beneficiaryData.pwd === "Yes") {
                        status = "PWD";
                    } else {
                        status = "";
                    }

                    document.getElementById("beneficiary-name").innerText = full_name;
                    document.getElementById("beneficiary-status").innerText = status;
                    document.getElementById("beneficiary-address").innerText = address;
                    document.getElementById("beneficiary-phone").innerText = phone;


                    var picture;
                    if (beneficiaryData.gender === "Male") {
                        picture = "/icon/upload-img-default.svg";
                    } else {
                        picture = "/icon/upload-img-default-woman.svg";
                    }


                    const pictureElement = document.getElementById('beneficiary-picture');
                    if (pictureElement) {
                        const picturePath = (beneficiaryData.picture && beneficiaryData.picture !== '0') ? `/uploads/beneficiary-img/${beneficiaryData.picture}` : picture;
                        pictureElement.src = picturePath;
                    } else {
                        console.error('Image element not found');
                    }

                    const fileInput = document.getElementById('picture');
                    if (fileInput) {
                        fileInput.value = '';
                    }


                    async function generateQRCode() {
                        const json = `${beneficiaryData.beneficiary_id}`;

                        const secretKey = "KimGalicia"; // Use a strong secret key for encryption
                        const encryptedData = encryptData(json, secretKey); // Encrypt the JSON data
                        console.log("Encrypted Data:", encryptedData);

                        // Now proceed with the QR code generation
                        const qr = qrcode(0, 'L');
                        qr.addData(encryptedData); // Add encrypted data to QR code
                        qr.make();

                        const size = 4;
                        document.getElementById('qrcode').innerHTML = qr.createImgTag(size, size);
                        const decryptedData = decryptData(encryptedData, secretKey);

                        // Log the decrypted data to the console
                        console.log("Decrypted Data:", decryptedData);
                    }

                    generateQRCode();

                })
                .catch(error => {
                    console.error('Error fetching beneficiary data:', error);
                    alert('Failed to fetch beneficiary data. Please try again.');
                });
        }
    };

    function encryptData(data, secretKey) {
        return CryptoJS.AES.encrypt(data, secretKey).toString();
    }

    // Decrypt function
    function decryptData(cipherText, secretKey) {
        const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    }


    function deleteBeneficiary(beneficiaryId) {
        console.log('Sending DELETE request for ID:', beneficiaryId);
        fetch(`/pharmacy-records/delete/${beneficiaryId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                if (response.ok) {
                    fetchBeneficiaryUpdates();
                    location.reload();
                }
                fetchBeneficiaryUpdates();
                location.reload();
            })
            .catch(error => {
                console.error('Error deleting beneficiary:', error);
                location.reload();
            });
    }

    // Initial setup
    attachPaginationListeners();
});