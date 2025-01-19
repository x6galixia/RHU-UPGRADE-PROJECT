


function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

document.getElementById('recently-admitted').addEventListener('click', function () {
  const rhuId = document.getElementById('rhu-select').value;
  loadPage(1, rhuId);
  document.getElementById('recently-admitted-table').classList.add("visible");
  overlay.classList.add("visible");
});

document.getElementById('rhu-select').addEventListener('change', function () {
  const rhuId = this.value;
  loadPage(1, rhuId);
});

function loadPage(page, rhuId) {
  fetch(`/nurse/patient-registration/recently-added?page=${page}&rhu_id=${rhuId}&ajax=true`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      console.log('Response Data:', data);
      console.log('Patient List:', data.getPatientList);
      const tbody = document.getElementById('patient-list');
      tbody.innerHTML = ''; // Clear previous rows

      // Handle case when no patients are found
      if (data.getPatientList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center">No patients found.</td></tr>`;
        document.getElementById('previous-page').style.display = 'none';
        document.getElementById('next-page').style.display = 'none';
        return;
      }

      // Populate the table with patient data
      data.getPatientList.forEach(patient => {
        const row = `
          <tr>
            <td>${patient.first_name} ${patient.last_name}</td>
            <td>${patient.check_date || 'N/A'}</td>
            <td>${patient.nurse_name}</td>
            <td class="menu-row"><button id="update-id"
            data-id="${patient.patient_id}"
            data-rhu-id="${patient.rhu_id}"
            data-last-name="${patient.last_name}"
            data-first-name="${patient.first_name}"
            data-middle-name="${patient.middle_name}"
            data-suffix="${patient.suffix}"
            data-phone="${patient.phone}"
            data-gender="${patient.gender}"
            data-birthdate="${patient.birthdate}"
            data-address="${patient.house_no} ,  ${patient.street} ,  ${patient.barangay} ,  ${patient.town} ,  ${patient.province}"
            data-occupation="${patient.occupation}"
            data-email="${patient.email}"
            data-philhealth-no="${patient.philhealth_no}"
            data-guardian="${patient.guardian}"
            data-nurse-id="${patient.nurse_id}"
            data-age="${patient.age}"
            data-check-date="${patient.check_date}"
            data-height="${patient.height}"
            data-weight="${patient.weight}"
            data-systolic="${patient.systolic}"
            data-diastolic="${patient.diastolic}"
            data-temperature="${patient.temperature}"
            data-heart-rate="${patient.heart_rate}"
            data-respiratory-rate="${patient.respiratory_rate}"
            data-bmi="${patient.bmi}"
            data-comment="${patient.comment}" onClick="fillUpdate(this)">Update</button>
            </td>
          </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
      });
      attachDotEventListeners();

      // Update pagination controls
      const previousPageButton = document.getElementById('previous-page');
      const nextPageButton = document.getElementById('next-page');

      previousPageButton.style.display = data.currentPage > 1 ? 'inline-block' : 'none';
      previousPageButton.onclick = () => loadPage(data.currentPage - 1, rhuId);

      nextPageButton.style.display = data.currentPage < data.totalPages ? 'inline-block' : 'none';
      nextPageButton.onclick = () => loadPage(data.currentPage + 1, rhuId);
    })
    .catch(error => console.error('Error fetching page:', error));
}

function fillUpdate(button) {
  var buttonId = button.id;
  if (buttonId === "update-id") {

    console.log("clicked");
    const checkDate = button.getAttribute('data-check-date');
    const birthDate = button.getAttribute('data-birthdate');

    document.getElementById('qrOutput').value = button.getAttribute('data-id') || '';
    document.getElementById('lastname').value = button.getAttribute('data-age');
    document.getElementById('firstname').value = button.getAttribute('data-first-name');
    document.getElementById('middlename').value = button.getAttribute('data-middle-name') || '';
    document.getElementById('suffix').value = button.getAttribute('data-suffix') || '';
    document.getElementById('address').value = button.getAttribute('data-address') || '';
    document.getElementById('birthdate').value = formatDate(birthDate);
    document.getElementById('email').value = button.getAttribute('data-email') || '';
    document.getElementById('gender').value = button.getAttribute('data-gender') || '';
    document.getElementById('guardian').value = button.getAttribute('data-guardian') || '';
    document.getElementById('current-date').value = formatDate(checkDate);
    document.getElementById('phone').value = button.getAttribute('data-phone') || '';
    document.getElementById('philhealth_no').value = button.getAttribute('data-philhealth-no') || '';
    document.getElementById('occupation').value = button.getAttribute('data-occupation') || '';
    document.getElementById('height').value = button.getAttribute('data-height') || '';
    document.getElementById('weight').value = button.getAttribute('data-weight');
    document.getElementById('bmi').value = button.getAttribute('data-bmi') || '';
    document.getElementById('temperature').value = button.getAttribute('data-temperature') || '';
    document.getElementById('respiratory_rate').value = button.getAttribute('data-respiratory-rate') || '';
    document.getElementById('pulse_rate').value = button.getAttribute('data-respiratory-rate') || '';
    document.getElementById('comment').value = button.getAttribute('data-comment') || '';
    document.getElementById('systolic').value = button.getAttribute('data-systolic') || '';
    document.getElementById('diastolic').value = button.getAttribute('data-diastolic') || '';
    document.getElementById('pulse_rate').value = button.getAttribute('data-heart-rate') || '';

    document.getElementById('recently-admitted-table').classList.remove("visible");
    overlay.classList.toggle("visible");

    document.getElementById("register_patient").innerText = "Update";
    document.querySelector('#confirm_patient_registration h2').innerText = 'Are you sure you want update this patient?';
  }

}

function attachDotEventListeners() {
  document.querySelectorAll(".dot").forEach(function (dot) {
    dot.addEventListener("click", function (event) {
      event.stopPropagation();
      const tripleDotContainer = dot.closest("td").querySelector(".triple-dot");

      document.querySelectorAll(".triple-dot.visible").forEach(openMenu => {
        if (openMenu !== tripleDotContainer) {
          openMenu.classList.remove("visible");
        }
      });

      tripleDotContainer.classList.toggle("visible");
    });
  });

  document.addEventListener("click", function (event) {
    document.querySelectorAll(".triple-dot.visible").forEach(openMenu => {
      openMenu.classList.remove("visible");
    });
  });
}

window.popUp_three_dot = function (button) {
  const action = button.textContent.trim();
  const patient_id = button.closest('.triple-dot').querySelector('.menu').getAttribute('data-id');
  console.log(patient_id);
  if (action === 'Delete' && patient_id) {

    const confirmDeleteButton = document.getElementById('confirm-delete');
    const cancelDeleteButton = document.getElementById('cancel-delete');
    const pop_up_Delete = document.getElementById('delete-patient-recently-admitted');

    pop_up_Delete.classList.add("visible");

    confirmDeleteButton.addEventListener('click', function () {
      deletePatient(patient_id);
      pop_up_Delete.classList.remove("visible");

    })
    cancelDeleteButton.addEventListener('click', function () {
      pop_up_Delete.classList.remove("visible");
    })
  }
};

function deletePatient(patientId) {
  console.log(`Sending DELETE request to: /nurse/patient-registration/delete/${patientId}`);
  console.log('Sending DELETE request for ID:', patientId);
  if (!patientId) {
    alert('Invalid patient ID');
    return;
  }
  fetch(`/nurse/patient-registration/delete/${patientId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to delete patient recently admitted');
      }
      alert("Patient in recently admitted deleted.")
      const rhuId = document.getElementById('rhu-select').value;
      loadPage(1, rhuId);
    })
    .catch(error => {
      console.error('Error deleting patient recently admitted:', error);

      alert('An error occurred while trying to delete the recently admitted: ' + error.message);
    });
}

document.querySelector('.close_popUp').addEventListener('click', function () {
  document.getElementById('recently-admitted-table').style.display = 'none';
  overlay.classList.toggle("visible");
});

function closeeeee() {
  console.log();
  document.getElementById("generate-id").style.display = 'none';
  document.querySelector(".overlay").style.display = 'none';
}

// compute BMI
function computeBMI() {
  const height = parseFloat(document.getElementById('height').value);
  const weight = parseFloat(document.getElementById('weight').value);
  if (height && weight) {
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    document.getElementById('bmi').value = bmi.toFixed(2);
  } else {
    document.getElementById('bmi').value = '';
  }
}

function validateInputs() {
  const height = parseFloat(document.getElementById('height').value);
  const weight = parseFloat(document.getElementById('weight').value);
  const systolic = parseFloat(document.getElementById('systolic').value);
  const diastolic = parseFloat(document.getElementById('diastolic').value);
  const respiratoryRate = parseFloat(document.getElementById('respiratory_rate').value);
  const pulseRate = parseFloat(document.getElementById('pulse_rate').value);

  if (height > 195) {
    alert('Height cannot exceed 195 cm');
    return false;
  }
  if (weight > 400) {
    alert('Weight cannot exceed 400 kg');
    return false;
  }
  if (systolic > 250) {
    alert('Systolic BP cannot exceed 250');
    return false;
  }
  if (diastolic > 150) {
    alert('Diastolic BP cannot exceed 150');
    return false;
  }
  if (respiratoryRate > 60) {
    alert('Respiratory rate cannot exceed 60 breaths per minute');
    return false;
  }
  if (pulseRate > 200) {
    alert('Pulse rate cannot exceed 200 beats per minute');
    return false;
  }

  return true;
}

document.getElementById('scanSwitch').addEventListener('change', function () {
  const qrInputField = document.getElementById('qrInput');
  let scanning = false;

  if (this.checked) {
    console.log("Scanning started");

    // Enable scanning and focus the QR input field
    document.addEventListener('keydown', handleKeyDown);
    qrInputField.addEventListener('keypress', handleKeyPress);
    qrInputField.focus(); // Focus on the QR input field when scanning is enabled
  } else {
    console.log("Scanning stopped");

    // Disable scanning and remove focus from the QR input field
    document.removeEventListener('keydown', handleKeyDown);
    qrInputField.removeEventListener('keypress', handleKeyPress);
    qrInputField.blur(); // Remove focus from the QR input field
  }

  // Function to handle keydown event
  function handleKeyDown(event) {
    // Only focus the input if scanning is active and a character key was pressed
    if (scanning === false && event.key.length === 1) {
      scanning = true;
      qrInputField.focus();
    }
  }

  // Function to handle keypress event when 'Enter' is pressed
  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      const scannedData = event.target.value;
      const secretKey = "CG3 Tech";

      // Decrypt function
      function decryptData(cipherText, secretKey) {
        const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
        return bytes.toString(CryptoJS.enc.Utf8);
      }

      const decryptedData = decryptData(scannedData, secretKey);

      // Set scanned data to the QR output field
      document.getElementById("qrOutput").value = decryptedData;

      // Send the scanned QR code data to the server
      fetch(`/nurse/fetchScannedData?qrCode=${decryptedData}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
          }
          return response.json();
        })
        .then(data => {
          console.log('Success:', data);
          populateFormFields(data); // Call function to populate fields
        })
        .catch((error) => {
          console.error('Error:', error);
        });

      // Clear the input after scanning
      event.target.value = '';
    }
  }


});

function populateFormFields(data) {
  document.getElementById("lastname").value = data.last_name || '';
  document.getElementById("firstname").value = data.first_name || '';
  document.getElementById("middlename").value = data.middle_name || '';
  document.getElementById("address").value = data.street + ', ' + 'None, ' + data.barangay + ', ' + data.city + ', ' + data.province || '';
  document.getElementById("birthdate").value = new Date(data.birthdate)
    .toISOString()
    .split("T")[0] || '';
  document.getElementById("gender").value = data.gender || '';
  document.getElementById("phone").value = data.phone || '';
  document.getElementById("occupation").value = data.occupation || '';
}

function printContainer(containerId) {
  var container = document.getElementById(containerId);

  var printWindow = window.open('', '', 'height=600,width=800');
  printWindow.document.write('<html><head><title>Print</title>');
  printWindow.document.write('<link rel="stylesheet" href="../css/global/general.css">');
  printWindow.document.write('<link rel="stylesheet" href="../css/local/id.css">');

  printWindow.document.write('</head><body>');
  printWindow.document.write(container.innerHTML);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.print();
}