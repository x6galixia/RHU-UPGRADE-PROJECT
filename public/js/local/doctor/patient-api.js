document.addEventListener("DOMContentLoaded", function () {
    const POLL_INTERVAL = 3000;
    let pollIntervalId;
    let isSearching = false;
    let currentSearchQuery = "";

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
                        <select name="patientAction" class="patientActionDropdown" onchange="popUp_button(this)">
                            <option value="" selected disabled>Medical records</option>
                            <option value="1" 
                                data-patient-id="${patient.patient_id}"
                                data-full-name="${patient.first_name} ${patient.middle_name || ''} ${patient.last_name} ${patient.suffix}"
                                data-check-date="${patient.check_date}"
                                data-age="${patient.age}"
                                data-gender="${patient.gender}"
                                data-birthdate="${patient.birthdate}"
                                data-occupation="${patient.occupation}"
                                data-guardian="${patient.guardian}"
                                data-systolic="${patient.systolic}"
                                data-diastolic="${patient.diastolic}"
                                data-heart-rate="${patient.heart_rate}"
                                data-height="${patient.height}"
                                data-weight="${patient.weight}"
                                data-bmi="${patient.bmi}"
                                data-temperature="${patient.temperature}"
                                data-respiratory-rate="${patient.respiratory_rate}"
                                data-comment="${patient.comment}">Vital Signs</option>
                            <option value="2"
                                data-patient-id="${patient.patient_id}"
                                data-full-name="${patient.first_name} ${patient.middle_name || ''} ${patient.last_name} ${patient.suffix}"
                                data-check-date="${patient.check_date}"
                                data-age="${patient.age}"
                                data-gender="${patient.gender}"
                                data-birthdate="${patient.birthdate}"
                                data-occupation="${patient.occupation}"
                                data-guardian="${patient.guardian}"
                                data-services="${patient.services}"
                                data-categories="${patient.categories}"
                                data-address="${patient.house_no ? patient.house_no : ''} ${patient.street ? patient.street : ''} ${patient.barangay ? patient.barangay : ''} ${patient.city ? patient.city : ''} ${patient.province ? patient.province : ''}">Request Laboratory</option>
                            <option value="3"
                                data-patient-id="${patient.patient_id}"
                                data-full-name="${patient.first_name} ${patient.middle_name || ''} ${patient.last_name} ${patient.suffix}"
                                data-check-date="${patient.check_date}"
                                data-age="${patient.age}"
                                data-gender="${patient.gender}"
                                data-birthdate="${patient.birthdate}"
                                data-occupation="${patient.occupation}"
                                data-guardian="${patient.guardian}"
                                data-diagnosis="${patient.diagnosis}">Diagnosis</option>
                            <option value="4"
                                data-patient-id="${patient.patient_id}"
                                data-full-name="${patient.first_name} ${patient.middle_name || ''} ${patient.last_name} ${patient.suffix}"
                                data-check-date="${patient.check_date}"
                                data-age="${patient.age}"
                                data-gender="${patient.gender}"
                                data-birthdate="${patient.birthdate}"
                                data-occupation="${patient.occupation}"
                                data-guardian="${patient.guardian}"
                                data-findings="${patient.findings}">Findings</option>
                            <option value="5"
                                data-patient-id="${patient.patient_id}"
                                data-full-name="${patient.first_name} ${patient.middle_name || ''} ${patient.last_name} ${patient.suffix}"
                                data-check-date="${patient.check_date}"
                                data-age="${patient.age}"
                                data-gender="${patient.gender}"
                                data-birthdate="${patient.birthdate}"
                                data-occupation="${patient.occupation}"
                                data-guardian="${patient.guardian}"
                                data-lab-result="${patient.lab_results}">Laboratory Result</option>
                            <option value="6"
                                data-patient-id="${patient.patient_id}"
                                data-full-name="${patient.first_name} ${patient.middle_name || ''} ${patient.last_name} ${patient.suffix}"
                                data-check-date="${patient.check_date}"
                                data-age="${patient.age}"
                                data-gender="${patient.gender}"
                                data-birthdate="${patient.birthdate}"
                                data-occupation="${patient.occupation}"
                                data-medicine="${patient.medicines}"
                                data-guardian="${patient.guardian}"
                                data-address="${patient.house_no ? patient.house_no : ''} ${patient.street ? patient.street : ''} ${patient.barangay ? patient.barangay : ''} ${patient.city ? patient.city : ''} ${patient.province ? patient.province : ''}"
                                data-conclusion="${patient.diagnosis}; : ${patient.findings}"
                                data-instructions="${patient.instructions}"
                                data-quantities="${patient.quantities}">Prescribe</option>
                        </select> 
                    </td>
                    <td onclick="window.location.href='/doctor/patient-history/${patient.patient_id}'">
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
        const url = `/doctor-dashboard?ajax=true&search=${encodeURIComponent(currentSearchQuery)}`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                updatePatientsTable(data);
            })
            .catch(error => {
                console.error('Error fetching patients updates:', error);
            });
    }

    pollIntervalId = setInterval(fetchPatientsUpdates, POLL_INTERVAL);
    fetchPatientsUpdates();

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
        currentSearchQuery = this.value.trim();

        if (currentSearchQuery !== "") {
            isSearching = true;
            clearInterval(pollIntervalId);
        } else {
            isSearching = false;
            pollIntervalId = setInterval(fetchPatientsUpdates, POLL_INTERVAL);
        }

        loadingSpinner.style.display = 'block';
        fetchPatientsUpdates();
        loadingSpinner.style.display = 'none';
    }, 300));

    document.addEventListener('focusin', function (event) {
        if (event.target && event.target.classList.contains('patientActionDropdown')) {
            clearInterval(pollIntervalId);
        }
    });

    document.addEventListener('focusout', function (event) {
        if (event.target && event.target.classList.contains('patientActionDropdown')) {
            pollIntervalId = setInterval(fetchPatientsUpdates, POLL_INTERVAL);
        }
    });
});