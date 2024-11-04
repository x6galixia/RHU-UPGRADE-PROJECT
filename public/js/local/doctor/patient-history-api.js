document.addEventListener('DOMContentLoaded', () => {
  const patientId = document.getElementById('patient-id').value;
  fetchPatientHistory(patientId);
});

async function fetchPatientHistory(patientId) {
  try {
    const response = await fetch(`/doctor/patient-histories/${patientId}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    displayPatientHistory(data);
  } catch (error) {
    console.error("Error fetching patient history:", error);
  }
}

async function fetchPatientHistory1(patientId, date) {
  console.log(date, patientId);
  try {
    const response = await fetch(`/patient-history/${patientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ date })
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    displayPatientHistory(data);
  } catch (error) {
    console.error("Error fetching patient history:", error);
  }
}


function displayPatientHistory(data) {
  const birthdate = new Date(data.patientHistory.birthdate).toISOString().split('T')[0];
  console.log("Date fetch from database: ", data.patientHistory.birthdate);
  console.log("Date converted: ", birthdate);
  document.getElementById('name').value = `${data.patientHistory.first_name} ${data.patientHistory.middle_name} ${data.patientHistory.last_name}`;
  document.getElementById('phil_no').value = `${data.patientHistory.philhealth_no}`;
  document.getElementById('suffix').value = `${data.patientHistory.suffix}`;
  document.getElementById('phone').value = `${data.patientHistory.phone}`;
  document.getElementById('birthdate').value = birthdate;
  document.getElementById('email').value = `${data.patientHistory.email}`;
  document.getElementById('gender').value = `${data.patientHistory.gender}`;
  document.getElementById('occupation').value = `${data.patientHistory.occupation}`;
  document.getElementById('guardian').value = `${data.patientHistory.guardian}`;
  document.getElementById('address').value = `${data.patientHistory.house_no} ${data.patientHistory.street} ${data.patientHistory.barangay} ${data.patientHistory.city} ${data.patientHistory.province} `;

  //ital signs
  document.getElementById('height').value = `${data.patientHistory.height}`;
  document.getElementById('weight').value = `${data.patientHistory.weight}`;
  document.getElementById('temperature').value = `${data.patientHistory.temperature}`;
  document.getElementById('systolic').value = `${data.patientHistory.systolic}`;
  document.getElementById('diastolic').value = `${data.patientHistory.diastolic}`;
  document.getElementById('heart_rate').value = `${data.patientHistory.heart_rate}`;
  document.getElementById('respiratory_rate').value = `${data.patientHistory.respiratory_rate}`;
  document.getElementById('bmi').value = `${data.patientHistory.bmi}`;
  document.getElementById('comment').value = `${data.patientHistory.comment}`;

  // laboratories
  const categories = data.patientHistory.categories || '';
  const categoriesIn = (categories === 'null' || categories === undefined) ? '' : categories;
  const services = data.patientHistory.services || '';
  const servicesIn = (services === 'null' || services === undefined) ? '' : services;

  // prescribe
  const medicines = data.patientHistory.medicines || '';
  const medicineIn = (medicines === 'null' || medicines === undefined) ? '' : medicines;
  const quantity = data.patientHistory.quantity || '';
  const quantityIn = (quantity === 'null' || quantity === undefined) ? '' : quantity;
  const instruction = data.patientHistory.instruction || '';
  const instructionIn = (instruction === 'null' || instruction === undefined) ? '' : instruction;

  //lab result
  const labResultsData = data.patientHistory.lab_results;
  const labResults = labResultsData ? labResultsData.split(', ') : [];
  const displayedImage = document.getElementById("displayedImage");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  let currentImageIndex = 0;

  function updateDisplayedImage() {
    if (labResults.length > 0) {
      displayedImage.src = `/uploads/lab-results/${labResults[currentImageIndex]}`;
      displayedImage.alt = "Lab result image";
      displayedImage.style.display = "block";
      prevBtn.style.display = "inline-block";
      nextBtn.style.display = "inline-block";
    } else {
      displayedImage.src = "";
      displayedImage.alt = "No lab results available";
      displayedImage.style.display = "none";
      prevBtn.style.display = "none";
      nextBtn.style.display = "none";

      const noResultsMessage = document.createElement("p");
      noResultsMessage.id = "no-results-message";
      noResultsMessage.innerText = "No lab results available";
      displayedImage.parentNode.insertBefore(noResultsMessage, displayedImage.nextSibling);
    }
  }

  updateDisplayedImage();

  prevBtn.addEventListener("click", () => {
    if (labResults.length > 0) {
      currentImageIndex = (currentImageIndex - 1 + labResults.length) % labResults.length;
      updateDisplayedImage();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (labResults.length > 0) {
      currentImageIndex = (currentImageIndex + 1) % labResults.length;
      updateDisplayedImage();
    }
  });

  // CATEGORIES
document.getElementById('dataList').innerHTML = '';

if (categoriesIn && servicesIn) {
  const categoriesArray = categoriesIn.split(',');
  const serviceArray = servicesIn.split(',');

  const rowCount = Math.max(categoriesArray.length, serviceArray.length);

  for (let i = 0; i < rowCount; i++) {
    const row = document.createElement('tr');

    const categoryCell = document.createElement('td');
    categoryCell.textContent = categoriesArray[i] ? categoriesArray[i].trim() : "-- no data --";
    row.appendChild(categoryCell);

    const serviceCell = document.createElement('td');
    serviceCell.textContent = serviceArray[i] ? serviceArray[i].trim() : "-- no data --";
    row.appendChild(serviceCell);

    
    document.getElementById('dataList').appendChild(row);
  }
} else {
  const row = document.createElement('tr');
  const noDataCell = document.createElement('td');
  noDataCell.colSpan = 2; 
  noDataCell.textContent = "-- no data found --";
  row.appendChild(noDataCell);
  document.getElementById('dataList').appendChild(row);
}

  // Clear any existing rows in the table body
document.getElementById('prescriptionList').innerHTML = '';

// Check if there is data in medicine, quantity, and instruction
if (medicineIn && quantityIn && instructionIn) {
  const medicineArray = medicineIn.split(',');
  const quantityArray = quantityIn.split(',');
  const instructionArray = instructionIn.split(',');

  // Determine the number of rows to create based on the maximum length
  const rowCount = Math.max(medicineArray.length, quantityArray.length, instructionArray.length);

  for (let i = 0; i < rowCount; i++) {
    // Create a new table row
    const row = document.createElement('tr');

    // Create and populate the medicine cell
    const medicineCell = document.createElement('td');
    medicineCell.textContent = medicineArray[i] ? medicineArray[i].trim() : "-- no data --";
    row.appendChild(medicineCell);

    // Create and populate the quantity cell
    const quantityCell = document.createElement('td');
    quantityCell.textContent = quantityArray[i] ? quantityArray[i].trim() : "-- no data --";
    row.appendChild(quantityCell);

    // Create and populate the instruction cell
    const instructionCell = document.createElement('td');
    instructionCell.textContent = instructionArray[i] ? instructionArray[i].trim() : "-- no data --";
    row.appendChild(instructionCell);

    // Append the row to the table body
    document.getElementById('prescriptionList').appendChild(row);
  }
} else {
  // If no data is available, display a single row indicating "no data found"
  const row = document.createElement('tr');
  const noDataCell = document.createElement('td');
  noDataCell.colSpan = 3; // Span across all columns
  noDataCell.textContent = "-- no data found --";
  row.appendChild(noDataCell);
  document.getElementById('prescriptionList').appendChild(row);
}


  // Handle grouped history
  const historyContainer = document.getElementById('date-container');
  historyContainer.innerHTML = '';

  const sortedYears = Object.keys(data.groupedHistory).sort((a, b) => b - a);

  for (const year of sortedYears) {
    const yearElement = document.createElement('h3');
    yearElement.innerText = year;
    historyContainer.appendChild(yearElement);

    data.groupedHistory[year].forEach(date => {
      const dateObj = new Date(date);
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      const formattedDate = dateObj.toLocaleDateString('en-US', options);

      const dateElement = document.createElement('p');
      dateElement.innerText = formattedDate;

      dateElement.onclick = () => {
        fetchPatientHistory1(data.patientId, formattedDate);
      };
      historyContainer.appendChild(dateElement);
    });
  }

}


