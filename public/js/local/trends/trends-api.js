(async function() {
    async function getTrendsAgeDemographics() {
      try {
        const response = await fetch("/pharmacy/trends/age-demographics");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();  // Extract the JSON data
        console.log("Age Demographics: ", data);  // Log the actual data
  
        // Prepare labels and data for the chart
        const ageGroups = data.map(row => row.age_group); // Extract age groups
        const counts = data.map(row => row.beneficiary_count); // Extract beneficiary counts
  
        updateChart(ageGroups, counts);
        
        // Update the actual counts in the HTML
        document.getElementById('zeroToFourteen').innerHTML = `<strong>${counts[0] || 0}</strong>`;
        document.getElementById('fifteenToSixtyFour').innerHTML = `<strong>${counts[1] || 0}</strong>`;
        document.getElementById('sixtyFivePlus').innerHTML = `<strong>${counts[2] || 0}</strong>`;
        
      } catch (error) {
        console.error("Error fetching trends data:", error);
      }
    }
  
    function updateChart(ageGroups, counts) {
      new Chart(
        document.getElementById('ageDemographics'),
        {
          type: 'bar',
          data: {
            labels: ageGroups,  // Age groups as x-axis labels
            datasets: [
              {
                label: 'Beneficiary Count',  // Count of beneficiaries in each age group
                data: counts,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
              }
            ]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        }
      );
    }
  
    // Load the age demographics when the page is ready
    document.addEventListener('DOMContentLoaded', () => {
      getTrendsAgeDemographics();
    });
  })();

  (async function() {
    async function getTopDiagnoses() {
      try {
        const response = await fetch("/pharmacy/trends/diagnosis/top");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json(); // Extract the JSON data
        console.log("Top Diagnoses: ", data); // Log the actual data
  
        // Update the chart with the fetched data
        const labels = data.map(row => row.diagnosis);
        const counts = data.map(row => row.diagnosis_count);
  
        new Chart(
          document.getElementById('nonCommunicableDisease'),
          {
            type: 'bar',
            data: {
              labels: labels,
              datasets: [
                {
                  label: 'Disease',
                  data: counts,
                  backgroundColor: 'rgba(75, 192, 192, 0.6)',
                  borderColor: 'rgba(75, 192, 192, 1)',
                  borderWidth: 1
                }
              ]
            },
            options: {
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }
          }
        );
      } catch (error) {
        console.error("Error fetching top diagnoses:", error);
      }
    }
  
    // Load the top diagnoses when the page is ready
    document.addEventListener('DOMContentLoaded', () => {
      getTopDiagnoses();
    });
  })();

(async function() {
  async function getTrendsGrowthMonthly() {
    try {
      const response = await fetch("/pharmacy/trends/growth/monthly");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();  // Extract the JSON data
      console.log("Growth Monthly: ", data);  // Log the actual data

      // Extract month names and counts from the data
      const months = data.map(row => {
        const monthNumber = row.month; // Extract month number (1-12)
        const year = row.year;           // Extract year
        // Convert month number to month name
        const monthName = new Date(year, monthNumber - 1).toLocaleString('default', { month: 'long' });
        return monthName + ' ' + year;  // e.g., "January 2021"
      });

      const prescriptionsFilled = data.map(row => row.total_quantity); // Total prescriptions filled
      const totalTransactions = data.map(row => row.total_transactions); // Total transactions

      document.getElementById('prescriptions-filled1').innerText = prescriptionsFilled;
      document.getElementById('transactions1').innerText = totalTransactions;

      updateChart(months, prescriptionsFilled, totalTransactions);
    } catch (error) {
      console.error("Error fetching trends data:", error);
    }
  }

  function updateChart(months, prescriptionsFilled, totalTransactions) {
    new Chart(
      document.getElementById('totalAvailment'),
      {
        type: 'bar',
        data: {
          labels: months,  // Months and years as x-axis labels
          datasets: [
            {
              label: 'Prescriptions Filled',  // Total prescriptions filled
              data: prescriptionsFilled,
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            },
            {
              label: 'Transactions',  // Total transactions
              data: totalTransactions,
              backgroundColor: 'rgba(81, 77, 118, 1)',
              borderColor: 'rgba(81, 77, 118, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      }
    );
  }

  // Load the monthly growth trends when the page is ready
  document.addEventListener('DOMContentLoaded', () => {
    getTrendsGrowthMonthly();
  });
})();

//growth Yearly
(async function() {
  // Fetch yearly growth data from the API
  async function getTrendsGrowthYearly() {
    try {
      const response = await fetch("/pharmacy/trends/growth/yearly");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();  // Parse the JSON data
      console.log("Growth Yearly: ", data);

      // Extract years, prescriptions filled (total_quantity), and transactions
      const years = data.map(row => row.year);
      const prescriptionsFilled = data.map(row => row.total_quantity);
      const totalTransactions = data.map(row => row.total_transactions);

      document.getElementById('prescriptions-filled').innerText = prescriptionsFilled;
      document.getElementById('transactions').innerText = totalTransactions;


      updateChart(years, prescriptionsFilled, totalTransactions);
    } catch (error) {
      console.error("Error fetching trends data:", error);
    }
  }

  // Function to update the chart with the fetched data
  function updateChart(years, prescriptionsFilled, totalTransactions) {
    new Chart(
      document.getElementById('ourGrowth'),
      {
        type: 'bar',
        data: {
          labels: years,  // Years as x-axis labels
          datasets: [
            {
              label: 'Prescriptions Filled',  // Total prescriptions filled (total_quantity)
              data: prescriptionsFilled,
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            },
            {
              label: 'Transactions',  // Total transactions
              data: totalTransactions,
              backgroundColor: 'rgba(81, 77, 118, 1)',
              borderColor: 'rgba(81, 77, 118, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      }
    );
  }

  // Load the growth trends when the page is ready
  document.addEventListener('DOMContentLoaded', () => {
    getTrendsGrowthYearly();
  });
})();


(async function() {
    async function getMostPrescribedDrugs() {
      try {
        const response = await fetch("/pharmacy/trends/most-prescribe-drugs");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json(); // Extract the JSON data
        console.log("Most Prescribed Drugs: ", data); // Log the actual data
  
        // Update the table with the fetched data
        const tbody = document.getElementById('mostPrescribedDrugsBody');
        tbody.innerHTML = ''; // Clear existing rows
  
        data.forEach(drug => {
          const row = document.createElement('tr');
          const categoryCell = document.createElement('td');
          const countCell = document.createElement('td');
  
          categoryCell.textContent = drug.therapeutic_category; // Set therapeutic category
          countCell.textContent = drug.total_beneficiaries; // Set number of patients
  
          row.appendChild(categoryCell);
          row.appendChild(countCell);
          tbody.appendChild(row); // Append the row to the tbody
        });
  
      } catch (error) {
        console.error("Error fetching most prescribed drugs:", error);
      }
    }
  
    // Load the most prescribed drugs when the page is ready
    document.addEventListener('DOMContentLoaded', () => {
      getMostPrescribedDrugs();
    });
  })();