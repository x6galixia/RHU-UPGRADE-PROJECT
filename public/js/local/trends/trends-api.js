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

//   NON-COMMUNICABLE DISEASE
(async function () {

  const sakit = [
    { sakit: 'Anthlhyperllpidemia', count: 190 },
    { sakit: 'Anti-angina', count: 50 },
    { sakit: 'Antihypertension', count: 100 },
    { sakit: 'Antidiabetic', count: 100 },
  ];
  new Chart(
    document.getElementById('nonCommunicableDisease'),
    {
      type: 'bar',
      data: {
        labels: sakit.map(row => row.sakit),
        datasets: [
          {
            label: 'Disease',
            data: sakit.map(row => row.count),
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