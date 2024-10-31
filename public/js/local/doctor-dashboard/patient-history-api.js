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

function displayPatientHistory(data) {
  document.getElementById('name').value = `${data.patientHistory.first_name} ${data.patientHistory.middle_name} ${data.patientHistory.last_name}`;
  document.getElementById('phil_no').value = `${data.patientHistory.philhealth_no}`;
  document.getElementById('suffix').value = `${data.patientHistory.suffix}`;
  document.getElementById('phone').value = `${data.patientHistory.phone}`;
  document.getElementById('birthdate').value = `${data.patientHistory.birthdate}`;
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

  // CATEGORIES
  document.getElementById('categoryList').innerHTML = '';
  if (categoriesIn) {
    const categoriesArray = categoriesIn.split(',');
    categoriesArray.forEach(category => {
      console.log(categoriesArray);
      const lis = document.createElement('li');
      lis.textContent = category.trim();
      document.getElementById('categoryList').appendChild(lis);
    });
  } else {
    const p = document.createElement('p');
    p.textContent = "-- no data found. --";
    document.getElementById('categoryList').appendChild(p);
  }

  // services
  document.getElementById('serviceList').innerHTML = '';
  if (servicesIn) {
    const serviceArray = servicesIn.split(',');
    serviceArray.forEach(service => {
      console.log(serviceArray);
      const lis = document.createElement('li');
      lis.textContent = service.trim();
      document.getElementById('serviceList').appendChild(lis);
    });
  } else {
    const p = document.createElement('p');
    p.textContent = "-- no data found. --";
    document.getElementById('serviceList').appendChild(p);
  }

  // medicine
  document.getElementById('medicineList').innerHTML = '';
  if (medicineIn) {
    const medicineArray = medicineIn.split(',');
    medicineArray.forEach(medicine => {
      console.log(medicineArray);
      const lis = document.createElement('li');
      lis.textContent = medicine.trim();
      document.getElementById('medicineList').appendChild(lis);
    });
  } else {
    const p = document.createElement('p');
    p.textContent = "-- no data found. --";
    document.getElementById('medicineList').appendChild(p);
  }

  // quantity
  document.getElementById('quantityList').innerHTML = '';
  if (quantityIn) {
    const quantityArray = quantityIn.split(',');
    quantityArray.forEach(quantity => {
      console.log(quantityArray);
      const lis = document.createElement('li');
      lis.textContent = quantity.trim();
      document.getElementById('quantityList').appendChild(lis);
    });
  } else {
    const p = document.createElement('p');
    p.textContent = "-- no data found. --";
    document.getElementById('quantityList').appendChild(p);
  }

  // quantity
  document.getElementById('instructionList').innerHTML = '';
  if (instructionIn) {
    const instructionArray = instructionIn.split(',');
    instructionArray.forEach(instruction => {
      console.log(instructionArray);
      const lis = document.createElement('li');
      lis.textContent = instruction.trim();
      document.getElementById('instructionList').appendChild(lis);
    });
  } else {
    const p = document.createElement('p');
    p.textContent = "-- no data found. --";
    document.getElementById('instructionList').appendChild(p);
  }

  // Handle grouped history
  const historyContainer = document.getElementById('date-container');
  historyContainer.innerHTML = '';

  for (const year in data.groupedHistory) {
    const yearElement = document.createElement('h3');
    yearElement.innerText = year;
    historyContainer.appendChild(yearElement);

    data.groupedHistory[year].forEach(date => {
      const dateObj = new Date(date);
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      const formattedDate = dateObj.toLocaleDateString('en-US', options);

      const dateElement = document.createElement('p');
      dateElement.innerText = formattedDate;
      historyContainer.appendChild(dateElement);
    });
  }
}
