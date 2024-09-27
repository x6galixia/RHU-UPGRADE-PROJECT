document.addEventListener("DOMContentLoaded", function() {
    const POLL_INTERVAL = 1000;
    let pollIntervalId;
    let isSearching = false;
    const loadingSpinner = document.getElementById("loadingSpinner");

    function updatePatientsTable(data) {
        const tableBody = document.getElementById("patientsTableBody");
        tableBody.innerHTML = "";

        if (data.getPatientList && data.getPatientList.length > 0) {
            data.getPatientList.forEach(patient => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td> ${patient.rhu_name} </td>
                    <td> ${patient.first_name} ${patient.middle_name || ''} ${patient.last_name} ${patient.suffix}</td>
                    <td> ${patient.age} </td>
                    <td> ${patient.gender} </td>
                    <td> ${patient.house_no} ${patient.street} ${patient.barangay} ${patient.town} ${patient.province}</td>
                    <td> 
                        <select name="patientAction" class="patientActionDropdown">
                            <option value="">Vital Signs</option>
                            <option value="">Request Laboratory</option>
                            <option value="">Diagnosis</option>
                            <option value="">Findings</option>
                            <option value="">Laboratory Result</option>
                            <option value="">Prescribe</option>
                        </select> 
                    </td>
                    <td>
                         <img src="../icon/mata_ine.svg" alt="" />
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            const emptyRow = document.createElement("tr");
            emptyRow.innerHTML = '<td colspan="7">No list of Patients</td>';
            tableBody.appendChild(emptyRow);
        }
    }

    function fetchPatientsUpdates() {
        if (!isSearching) {
            fetch('/doctor-dashboard?ajax=true')
                .then(response => response.json())
                .then(data => {
                    updatePatientsTable(data);
                })
                .catch(error => {
                    console.error('Error fetching patients updates:', error);
                });
        }
    }

    pollIntervalId = setInterval(fetchPatientsUpdates, POLL_INTERVAL);
    fetchPatientsUpdates();

    document.getElementById('searchInput').addEventListener('input', function(event) {
        event.preventDefault();
        const query = this.value;

        if (query.trim() !== "") {
            isSearching = true;
            clearInterval(pollIntervalId);
        } else {
            isSearching = false;
            pollIntervalId = setInterval(fetchPatientsUpdates, POLL_INTERVAL);
        }

        loadingSpinner.style.display = 'block';

        fetch(`/doctor-dashboard/search?query=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                const tableBody = document.querySelector('#patientsTableBody');
                tableBody.innerHTML = '';

                if (data.getPatientList.length === 0) {
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="6">No matching records found</td>
                        </tr>`;
                } else {
                    data.getPatientList.forEach(patient => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${patient.first_name} ${patient.middle_name || ''} ${patient.last_name} ${patient.suffix}</td>
                            <td>${patient.age}</td>
                            <td>${patient.gender}</td>
                            <td>${patient.house_no} ${patient.street} ${patient.barangay} ${patient.town} ${patient.province}</td>
                            <td> 
                                <select name="patientAction" class="patientActionDropdown">
                                    <option value="">Vital Signs</option>
                                    <option value="">Request Laboratory</option>
                                    <option value="">Diagnosis</option>
                                    <option value="">Findings</option>
                                    <option value="">Laboratory Result</option>
                                    <option value="">Prescribe</option>
                                </select> 
                            </td>
                            <td>
                                <img src="../icon/mata_ine.svg" alt="" />
                            </td>
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

    document.addEventListener('focusin', function(event) {
        if (event.target && event.target.classList.contains('patientActionDropdown')) {
            clearInterval(pollIntervalId);
        }
    });

    document.addEventListener('focusout', function(event) {
        if (event.target && event.target.classList.contains('patientActionDropdown')) {
            pollIntervalId = setInterval(fetchPatientsUpdates, POLL_INTERVAL);
        }
    });
});