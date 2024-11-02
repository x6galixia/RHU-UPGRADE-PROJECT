function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

//admin
const createUser = document.getElementById("create-user");

// inventory
const restock = document.getElementById("restock-med");
const transfer = document.getElementById("transfer-med");
const add = document.getElementById("add-med");
const confirm_transfer = document.getElementById("confirm-transfer");
const confirm_restock = document.getElementById("confirm-restock");
const confirm_add_med = document.getElementById("confirm-add-med");

//beneficiary-records
const add_beneficiary = document.getElementById("add-beneficiary");
const update_beneficiary = document.getElementById("update-beneficiary");
const delete_beneficiary = document.getElementById("delete-beneficiary");
const ID = document.getElementById("id");


//dispense
const dispense = document.getElementById("dispense-med");
const reject_dispense = document.getElementById("reject_dispense");
const submit_dispense = document.getElementById("submit_dispense");

//nurse
const recently_admitted = document.getElementById("recently-admitted-table");
const recently_admittedMed = document.getElementById("recently-admitted-table-med");
const confirm_patient_registration = document.getElementById("confirm_patient_registration");

//med tech
const lab_result = document.getElementById("lab-res");


//doctor dashboard id
const vital = document.getElementById('vital');
const reqLab = document.getElementById('reqLab');
const diagnosis = document.getElementById('diagnosis');
const findings = document.getElementById('findings');
const labResult = document.getElementById('labResult');
const prescribed = document.getElementById('prescribed');


const overlay = document.querySelector(".overlay");

function popUp_button(button) {
  var buttonId = button.id;
  var select = button.value;

  //inventory
  if (buttonId === "restock") {
    restock.classList.toggle("visible");
  } else if (buttonId === "transfer") {
    transfer.classList.toggle("visible");
  } else if (buttonId === "add") {
    add.classList.toggle("visible");
  } else if (buttonId === "transfer_form") {
    confirm_transfer.classList.toggle("visible");
  } else if (buttonId === "restock_form") {
    confirm_restock.classList.toggle("visible");
  } else if (buttonId === "add_med_form") {
    confirm_add_med.classList.toggle("visible");
  }

  //beneficiary-records
  else if (buttonId === "add-beneficiary-button") {
    add_beneficiary.classList.toggle("visible");
  }
  else if (buttonId === "generate-id") {
    ID.classList.toggle("visible");
  }
  else if (buttonId === "update-id") {
    update_beneficiary.classList.toggle("visible");
  }

  //doctor - vital signs
  else if (select === "1") {
    vital.classList.toggle('visible');

    const selectedOption = button.options[button.selectedIndex];

    if (selectedOption) {
      const checkDate = selectedOption.getAttribute('data-check-date');
      const birthDate = selectedOption.getAttribute('data-birthdate');

      document.getElementById('vi_full_name').value = selectedOption.getAttribute('data-full-name') || '';
      document.getElementById('vi_check_date').value = formatDate(checkDate);
      document.getElementById('vi_age').value = selectedOption.getAttribute('data-age');
      document.getElementById('vi_gender').value = selectedOption.getAttribute('data-gender') || '';
      document.getElementById('vi_birthdate').value = formatDate(birthDate);
      document.getElementById('vi_occupation').value = selectedOption.getAttribute('data-occupation') || '';
      document.getElementById('vi_guardian').value = selectedOption.getAttribute('data-guardian') || '';
      document.getElementById('vi_systolic').value = selectedOption.getAttribute('data-systolic') || '';
      document.getElementById('vi_diastolic').value = selectedOption.getAttribute('data-diastolic') || '';
      document.getElementById('vi_heart_rate').value = selectedOption.getAttribute('data-heart-rate') || '';
      document.getElementById('vi_height').value = selectedOption.getAttribute('data-height') || '';
      document.getElementById('vi_weight').value = selectedOption.getAttribute('data-weight') || '';
      document.getElementById('vi_bmi').value = selectedOption.getAttribute('data-bmi') || '';
      document.getElementById('vi_temperature').value = selectedOption.getAttribute('data-temperature') || '';
      document.getElementById('vi_respiratory_rate').value = selectedOption.getAttribute('data-respiratory-rate') || '';
      document.getElementById('vi_comment').value = selectedOption.getAttribute('data-comment') || '';
    }
  }

  //doctor - request laboratory
  else if (select === "2") {
    reqLab.classList.toggle('visible');

    const selectedOption = button.options[button.selectedIndex];
    console.log(selectedOption);

    if (selectedOption) {
      const checkDate = selectedOption.getAttribute('data-check-date');
      const birthDate = selectedOption.getAttribute('data-birthdate');

      document.getElementById('req_patient_id').value = selectedOption.getAttribute('data-patient-id');
      document.getElementById('req_full_name').value = selectedOption.getAttribute('data-full-name') || '';
      document.getElementById('req_check_date').value = formatDate(checkDate);
      document.getElementById('req_age').value = selectedOption.getAttribute('data-age');
      document.getElementById('req_gender').value = selectedOption.getAttribute('data-gender') || '';
      document.getElementById('req_birthdate').value = formatDate(birthDate);
      document.getElementById('req_occupation').value = selectedOption.getAttribute('data-occupation') || '';
      document.getElementById('req_guardian').value = selectedOption.getAttribute('data-guardian') || '';

      document.getElementById("pl-name").innerText = `Name: ${selectedOption.getAttribute('data-full-name')}`;
      document.getElementById("pl-age").innerText = `Age: ${selectedOption.getAttribute('data-age')}`;
      document.getElementById("pl-gender").innerText = `Gender: ${selectedOption.getAttribute('data-gender')}`;
      document.getElementById("pl-check-date").innerText = `Date: ${formatDate(checkDate)}`;
      document.getElementById("pl-address").innerText = `Address: ${selectedOption.getAttribute('data-address')}`;
      document.getElementById("pl-birthdate").innerText = `Birthdate: ${formatDate(birthDate)}`;
      document.getElementById("pl-occupation").innerText = `Occupation: ${selectedOption.getAttribute('data-occupation')}`;
      document.getElementById("pl-guardian").innerText = `Guardian: ${selectedOption.getAttribute('data-guardian')}`;

      const services = selectedOption.getAttribute('data-services') || ''; // Get services, default to empty string
      const servicesValue = (services === 'null' || services === undefined) ? '' : services;

      const categories = selectedOption.getAttribute('data-categories') || ''; // Get services, default to empty string
      const categoriesValue = (categories === 'null' || categories === undefined) ? '' : categories;

      // Clear existing list content
      document.getElementById('serviceList').innerHTML = '';

      if (servicesValue) {
        const serviceArray = servicesValue.split(','); // Split services by comma
        serviceArray.forEach(service => {
          const li = document.createElement('li');
          li.textContent = service.trim(); // Trim to remove extra spaces
          document.getElementById('serviceList').appendChild(li);
        });
      } else {
        const p = document.createElement('p');
        p.textContent = "-- no recent lab req. --"; // Trim to remove extra spaces
        document.getElementById('serviceList').appendChild(p);
      }

      document.getElementById('category-list').innerHTML = '';
      document.getElementById('service-list').innerHTML = '';

      if (servicesValue) {
        const serviceArray = servicesValue.split(','); // Split services by comma
        serviceArray.forEach(service => {
          const li = document.createElement('li');
          li.textContent = service.trim(); // Trim to remove extra spaces
          document.getElementById('service-list').appendChild(li);
        });
      } else {
        const p = document.createElement('p');
        p.textContent = "-- no recent services --"; // Message for no services
        document.getElementById('service-list').appendChild(p);
      }
    
      // Handle categories
      if (categoriesValue) {
        const categoryArray = categoriesValue.split(','); // Split categories by comma
        categoryArray.forEach(category => {
          const li = document.createElement('li');
          li.textContent = category.trim(); // Trim to remove extra spaces
          document.getElementById('category-list').appendChild(li);
        });
      } else {
        const p = document.createElement('p');
        p.textContent = "-- no recent categories --"; // Message for no categories
        document.getElementById('category-list').appendChild(p);
      }

    }
  }

  //doctor - diagnoses
  else if (select === "3") {
    diagnosis.classList.toggle('visible');

    const submitButton = document.getElementById('submitButton');
    const diagnosisTextarea = document.getElementById('dia_diagnosis');
    const selectedOption = button.options[button.selectedIndex];

    if (selectedOption) {
      const checkDate = selectedOption.getAttribute('data-check-date');
      const birthDate = selectedOption.getAttribute('data-birthdate');

      document.getElementById('dia_patient_id').value = selectedOption.getAttribute('data-patient-id');
      document.getElementById('dia_full_name').value = selectedOption.getAttribute('data-full-name') || '';
      document.getElementById('dia_check_date').value = formatDate(checkDate);
      document.getElementById('dia_age').value = selectedOption.getAttribute('data-age');
      document.getElementById('dia_gender').value = selectedOption.getAttribute('data-gender') || '';
      document.getElementById('dia_birthdate').value = formatDate(birthDate);
      document.getElementById('dia_occupation').value = selectedOption.getAttribute('data-occupation') || '';
      document.getElementById('dia_guardian').value = selectedOption.getAttribute('data-guardian') || '';
      document.getElementById('dia_diagnosis').value = selectedOption.getAttribute('data-diagnosis') || '';
    }
    if (diagnosisTextarea.value.trim() !== '') {
      submitButton.textContent = 'Update';
    } else {
      submitButton.textContent = 'Submit';
    }
  }

  //doctor - findings
  else if (select === "4") {
    findings.classList.toggle('visible');

    const submitButtons = document.getElementById('submitButtons');
    const findingsTextarea = document.getElementById('fin_findings');
    const selectedOption = button.options[button.selectedIndex];

    if (selectedOption) {
      const checkDate = selectedOption.getAttribute('data-check-date');
      const birthDate = selectedOption.getAttribute('data-birthdate');

      document.getElementById('fin_patient_id').value = selectedOption.getAttribute('data-patient-id');
      document.getElementById('fin_full_name').value = selectedOption.getAttribute('data-full-name') || '';
      document.getElementById('fin_check_date').value = formatDate(checkDate);
      document.getElementById('fin_age').value = selectedOption.getAttribute('data-age');
      document.getElementById('fin_gender').value = selectedOption.getAttribute('data-gender') || '';
      document.getElementById('fin_birthdate').value = formatDate(birthDate);
      document.getElementById('fin_occupation').value = selectedOption.getAttribute('data-occupation') || '';
      document.getElementById('fin_guardian').value = selectedOption.getAttribute('data-guardian') || '';
      document.getElementById('fin_findings').value = selectedOption.getAttribute('data-findings');
    }
    if (findingsTextarea.value.trim() !== '') {
      submitButtons.textContent = 'Update';
    } else {
      submitButtons.textContent = 'Submit';
    }
  }

  //doctor - labresult
  else if (select === "5") {
    labResult.classList.toggle('visible');

    const selectedOption = button.options[button.selectedIndex];

    if (selectedOption) {
      const checkDate = selectedOption.getAttribute('data-check-date');
      const birthDate = selectedOption.getAttribute('data-birthdate');

      document.getElementById('res_full_name').value = selectedOption.getAttribute('data-full-name') || '';
      document.getElementById('res_check_date').value = formatDate(checkDate);
      document.getElementById('res_age').value = selectedOption.getAttribute('data-age');
      document.getElementById('res_gender').value = selectedOption.getAttribute('data-gender') || '';
      document.getElementById('res_birthdate').value = formatDate(birthDate);
      document.getElementById('res_occupation').value = selectedOption.getAttribute('data-occupation') || '';
      document.getElementById('res_guardian').value = selectedOption.getAttribute('data-guardian') || '';

      // Retrieve labResults containing the filenames of the lab result images
      const labResultsData = selectedOption.getAttribute('data-lab-result');
      const labResults = labResultsData ? labResultsData.split(', ') : []; // Split by comma and space
      const displayedImage = document.getElementById("displayedImage");
      const prevBtn = document.getElementById("prev-btn");
      const nextBtn = document.getElementById("next-btn");

      let currentImageIndex = 0;
      console.log(selectedOption);
      console.log(selectedOption.getAttribute('data-lab-result'));
      console.log(labResults);
      console.log(labResults[currentImageIndex]);

      // Function to update the displayed image
      function updateDisplayedImage() {
        if (labResults.length > 0) {
          displayedImage.src = `/uploads/lab-results/${labResults[currentImageIndex]}`;
        } else {
          displayedImage.src = "";
          displayedImage.alt = "No lab results available";
          // displayedImage.src = `/uploads/lab-results/lab_result-1729784855673-202915123.jpg`;
        }
      }

      // Initial setup to display the first image
      updateDisplayedImage();

      // Event listener for 'Previous' button
      prevBtn.addEventListener("click", () => {
        if (labResults.length > 0) {
          currentImageIndex = (currentImageIndex - 1 + labResults.length) % labResults.length; // Cycle back if at the start
          updateDisplayedImage();
        }
      });

      // Event listener for 'Next' button
      nextBtn.addEventListener("click", () => {
        if (labResults.length > 0) {
          currentImageIndex = (currentImageIndex + 1) % labResults.length; // Cycle to beginning if at the end
          updateDisplayedImage();
        }
      });
    }
  }

  //doctor - prescribe

else if (select === "6") {
  prescribed.classList.toggle('visible');

  const selectedOption = button.options[button.selectedIndex];

  if (selectedOption) {
      // Set patient information
      const checkDate = selectedOption.getAttribute('data-check-date');
      const birthDate = selectedOption.getAttribute('data-birthdate');

      document.getElementById('pres_patient_id').value = selectedOption.getAttribute('data-patient-id');
      document.getElementById('pres_full_name').value = selectedOption.getAttribute('data-full-name') || '';
      document.getElementById('pres_check_date').value = formatDate(checkDate);
      document.getElementById('pres_age').value = selectedOption.getAttribute('data-age');
      document.getElementById('pres_gender').value = selectedOption.getAttribute('data-gender') || '';
      document.getElementById('pres_birthdate').value = formatDate(birthDate);
      document.getElementById('pres_occupation').value = selectedOption.getAttribute('data-occupation') || '';
      document.getElementById('pres_guardian').value = selectedOption.getAttribute('data-guardian') || '';

      // Print details
      document.getElementById("prnt-diag-fin").innerText = `${selectedOption.getAttribute('data-conclusion')}`;
      document.getElementById("prnt-name").innerText = `Name: ${selectedOption.getAttribute('data-full-name')}`;
      document.getElementById("prnt-age").innerText = `Age: ${selectedOption.getAttribute('data-age')}`;
      document.getElementById("prnt-gender").innerText = `Gender: ${selectedOption.getAttribute('data-gender')}`;
      document.getElementById("prnt-check-date").innerText = `Date: ${formatDate(checkDate)}`;
      document.getElementById("prnt-address").innerText = `Address: ${selectedOption.getAttribute('data-address')}`;
      document.getElementById("prnt-birthdate").innerText = `Birthdate: ${formatDate(birthDate)}`;
      document.getElementById("prnt-occupation").innerText = `Occupation: ${selectedOption.getAttribute('data-occupation')}`;
      document.getElementById("prnt-guardian").innerText = `Guardian: ${selectedOption.getAttribute('data-guardian')}`;
  }

  // Fetch medicine, quantities, and instructions
  const medicine = selectedOption.getAttribute('data-medicine') || '';
  const quantity = selectedOption.getAttribute('data-quantities') || '';
  const instruction = selectedOption.getAttribute('data-instructions') || '';

  // Clear existing list content
  document.getElementById('medicineList').innerHTML = '';
  document.getElementById('list-med').innerHTML = '';

  // Prepare lists for displaying medicines, quantities, and instructions
  if (medicine) {
      const medicineArray = medicine.split(',').map(med => med.trim());
      const quantitiesArray = quantity.split(',').map(qty => qty.trim());
      const instructionsArray = instruction.split(',').map(instr => instr.trim());

      // Create a Set to avoid duplicates
      const uniqueEntries = new Set();
      
      // Combine data into a single array of objects
      const combinedList = medicineArray.map((med, index) => {
          const qty = quantitiesArray[index] || '';
          const instr = instructionsArray[index] || '';
          const entry = `${med} #${qty} | ${instr}`;
          if (!uniqueEntries.has(entry) && med) {
              uniqueEntries.add(entry);
              return { med, qty, instr };
          }
          return null; // Filter out duplicates
      }).filter(entry => entry !== null); // Remove null entries

      // Display in medicineList first
      combinedList.forEach(item => {
          const list = document.createElement('li');
          list.textContent = item.med; // Just the medicine for medicineList
          document.getElementById('medicineList').appendChild(list);
      });

      // Then display in list-med with quantities and instructions
      combinedList.forEach((item, index) => {
          const pMedicine = document.createElement('p');
          pMedicine.className = 'b-p';
          pMedicine.innerHTML = `${index + 1}. ${item.med} <span>#${item.qty}</span>`;
          
          const pSig = document.createElement('p');
          pSig.textContent = item.instr;

          document.getElementById('list-med').appendChild(pMedicine);
          document.getElementById('list-med').appendChild(pSig);
      });
  } else {
      const p = document.createElement('p');
      p.textContent = "-- no recent prescribed medicine. --";
      document.getElementById('medicineList').appendChild(p);
      document.getElementById('list-med').appendChild(p.cloneNode(true)); // Display the same message in list-med
  }
}

  // dispense
  else if (buttonId === "reject_dispense_button") {
    reject_dispense.classList.toggle("visible");

    const form = document.getElementById('dispense-delete-request');
    form.action = "/pharmacy/reject-dispense";
  }
  else if (buttonId === "submit_dispense_button") {
    submit_dispense.classList.toggle("visible");
  }
  else if (buttonId === "dispense") {
    dispense.classList.toggle("visible");
  }

  //admin - user
  else if (buttonId === "create-user-btn") {
    createUser.classList.toggle("visible");
  }

  //nurse
  else if (buttonId == "recently-admitted") {
    recently_admitted.classList.toggle("visible");
  }
  //nurse
  else if (buttonId == "register_patient") {
    confirm_patient_registration.classList.toggle("visible");

    const form = document.getElementById('form-admit-yes-or-no');
    if (button.innerText === "Update") {
        form.action = "/nurse/update-patient-details";
    } else {
        form.action = "/nurse/admit-patient";
    }

  }

  else if (buttonId == "recentlyAddedMed") {
    recently_admittedMed.classList.toggle("visible");
    // alert("fuck");
  }

  //med tech
  else if (buttonId == "lab-result") {
    lab_result.classList.toggle("visible");

    const checkDate = button.getAttribute('data-check-date');
    const birthDate = button.getAttribute('data-birthdate');
    const categories = button.getAttribute('data-categories');
    const services = button.getAttribute('data-services');

    document.getElementById('lab_patient_id').value = button.getAttribute('data-patient-id');
    document.getElementById('lab_full_name').value = button.getAttribute('data-full-name') || '';
    document.getElementById('lab_check_date').value = formatDate(checkDate);
    document.getElementById('lab_age').value = button.getAttribute('data-age');
    document.getElementById('lab_gender').value = button.getAttribute('data-gender') || '';
    document.getElementById('lab_birthdate').value = formatDate(birthDate);
    document.getElementById('lab_occupation').value = button.getAttribute('data-occupation') || '';
    document.getElementById('lab_guardian').value = button.getAttribute('data-guardian') || '';

    const categoryServiceTableBody = document.getElementById('categoryServiceTableBody');
    categoryServiceTableBody.innerHTML = '';

    if (categories && services) {
      const categoryArray = categories.split(',');
      const serviceArray = services.split(',');

      const rowCount = Math.max(categoryArray.length, serviceArray.length);

      for (let i = 0; i < rowCount; i++) {
        const category = categoryArray[i] ? categoryArray[i].trim() : '';
        const service = serviceArray[i] ? serviceArray[i].trim() : '';

        const row = document.createElement('tr');
        row.innerHTML = `
              <td>${service}</td>
              <td>${category}</td>
          `;
        categoryServiceTableBody.appendChild(row);
      }
    }


  }

  overlay.classList.add("visible");
}

// close pop-up
document.querySelectorAll(".close_popUp").forEach(function (closeBtn) {
  closeBtn.addEventListener("click", function () {
    var pop_up = closeBtn.closest(".pop-up");
    if (pop_up) {
      pop_up.classList.remove("visible");
      overlay.classList.remove("visible");
    }
  });
});

// close pop-up
document.querySelectorAll(".close_popUp1").forEach(function (closeBtn) {
  closeBtn.addEventListener("click", function () {
    var pop_up = closeBtn.closest(".pop-up-confirm");
    if (pop_up) {
      pop_up.classList.remove("visible");
      overlay.classList.remove("visible");
    }
  });
});

//close pop-up 2
document.querySelectorAll(".close_confirm").forEach(function (closeBtn) {
  closeBtn.addEventListener("click", function () {
    var pop_up_confirm = closeBtn.closest(".pop-up-confirm");
    if (pop_up_confirm) {
      pop_up_confirm.classList.remove("visible");
    }
  });
});
