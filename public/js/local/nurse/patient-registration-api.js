document.getElementById('recently-admitted').addEventListener('click', function () {
  const rhuId = document.getElementById('rhu-select').value;
  loadPage(1, rhuId);
  document.getElementById('recently-admitted-table').style.display = 'block';
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
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      console.log(data);
      const tbody = document.getElementById('patient-list');
      tbody.innerHTML = '';
      var main_container = "dot";
      var triple_dot = "triple-dot";

      if (data.getPatientList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center">No patients found.</td></tr>`;
        document.getElementById('previous-page').style.display = 'none';
        document.getElementById('next-page').style.display = 'none';
        return;
      }

      data.getPatientList.forEach(patient => {
        const row = `<tr>
            <td>${patient.first_name} ${patient.last_name}</td>
            <td>${patient.check_date}</td>
            <td>${patient.nurse}</td> <!-- Nurse column -->
            <td class="menu-row">
                <img class="${main_container}" src="../icon/triple-dot.svg" alt="">
                <div class="${triple_dot}">
                    <div class="menu" data-id="${patient.patient_id}">
                        <button id="delete-id" onclick="popUp_three_dot(this)">Delete</button>
                        <button id="update-id" onclick="popUp_three_dot(this)">Update</button>
                    </div>
                </div>
            </td>
          </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
      });
      attachDotEventListeners();

      const previousPageButton = document.getElementById('previous-page');
      const nextPageButton = document.getElementById('next-page');

      previousPageButton.style.display = data.currentPage > 1 ? 'inline-block' : 'none';
      previousPageButton.onclick = () => loadPage(data.currentPage - 1, rhuId);

      nextPageButton.style.display = data.currentPage < data.totalPages ? 'inline-block' : 'none';
      nextPageButton.onclick = () => loadPage(data.currentPage + 1, rhuId);
    })
    .catch(error => console.error('Error fetching page:', error));
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
  // if (action === 'Update' && beneficiaryId) {
  //   fetch(`/pharmacy-records/beneficiary/${beneficiaryId}`)
  //     .then(response => {
  //       if (!response.ok) throw new Error('Network response was not ok');
  //       return response.json();
  //     })
  //     .then(beneficiaryData => {
  //       document.getElementById('beneficiary_id').value = beneficiaryData.beneficiary_id || '';
  //       document.getElementById('last_name').value = beneficiaryData.last_name || '';
  //       document.getElementById('first_name').value = beneficiaryData.first_name || '';
  //       document.getElementById('middle_name').value = beneficiaryData.middle_name || '';
  //       document.getElementById('gender').value = beneficiaryData.gender || '';
  //       document.getElementById('birthdate').value = beneficiaryData.birthdate.split('T')[0] || '';
  //       document.getElementById('phone').value = beneficiaryData.phone || '';
  //       document.getElementById('processed_date').value = beneficiaryData.processed_date.split('T')[0] || '';
  //       document.getElementById('occupation').value = beneficiaryData.occupation || '';
  //       document.getElementById('street').value = beneficiaryData.street || '';
  //       document.getElementById('barangay').value = beneficiaryData.barangay || '';
  //       document.getElementById('city').value = beneficiaryData.city || '';
  //       document.getElementById('province').value = beneficiaryData.province || '';
  //       document.getElementById('senior_citizen').value = beneficiaryData.senior_citizen || '';
  //       document.getElementById('pwd').value = beneficiaryData.pwd || '';
  //       document.getElementById('note').value = beneficiaryData.note || '';
  //       document.getElementById('existing_picture').value = beneficiaryData.picture || '';

  //       var picture;
  //       if (beneficiaryData.gender === "Male") {
  //         picture = "/icon/upload-img-default.svg";
  //       } else {
  //         picture = "/icon/upload-img-default-woman.svg";
  //       }


  //       const pictureElement = document.getElementById('pictureDisplay');
  //       if (pictureElement) {
  //         const picturePath = (beneficiaryData.picture && beneficiaryData.picture !== '0') ? `/uploads/beneficiary-img/${beneficiaryData.picture}` : picture;
  //         pictureElement.src = picturePath;
  //       } else {
  //         console.error('Image element not found');
  //       }

  //       const fileInput = document.getElementById('picture');
  //       if (fileInput) {
  //         fileInput.value = '';
  //       }

  //       update_beneficiary.classList.add("visible");
  //       overlay.classList.add("visible");
  //     })
  //     .catch(error => {
  //       console.error('Error fetching beneficiary data:', error);
  //       alert('Failed to fetch beneficiary data. Please try again.');
  //     });
  // }
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
      const secretKey = "KimGalicia";

      // Decrypt function
      function decryptData(cipherText, secretKey) {
        const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
        return bytes.toString(CryptoJS.enc.Utf8);
      }

      const decryptedData = decryptData(scannedData, secretKey);

      console.log(document.getElementById("qrOutput").value);
      console.log(decryptedData);

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

