// our grown line graph

(async function() {
  const   prescriptionsFilled1 = [
    { year: 2021, count: 10 },
    { year: 2022, count: 20 },
    { year: 2023, count: 15 }
  ];

  const transactions1 = [
    { year: 2021, count: 5 },
    { year: 2022, count: 1 },
    { year: 2023, count: 9 },
  ];

  new Chart(
    document.getElementById('ourGrowth'),
    {
      type: 'bar',
      data: {
        labels: prescriptionsFilled1.map(row => row.year),
        datasets: [
          {
            label: 'Prescriptions Filled',
            data: prescriptionsFilled1.map(row => row.count),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          },
          {
            label: 'Transactions',
            data: transactions1.map(row => row.count),
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
})();




// total availment

(async function() {
    const   prescriptionsFilled2 = [
        { month: 'January', count: 10 },
        { month: 'February', count: 15 },
        { month: 'March', count: 20 },
        { month: 'April', count: 15 },
        { month: 'May', count: 1 },
        { month: 'June', count: 5 },
        { month: 'July', count: 18 },
        { month: 'August', count: 19 },
        { month: 'September', count: 3 },
        { month: 'October', count: 19 },
        { month: 'November', count: 20 },
        { month: 'December', count: 1 }
    ];
  
    const transactions2 = [
        { month: 'January 2021', count: 4 },
        { month: 'February 2021', count: 1 },
        { month: 'March 2021', count: 10 },
        { month: 'April 2021', count: 20 },
        { month: 'May 2021', count: 19 },
        { month: 'June 2021', count: 14 },
        { month: 'July 2021', count: 8 },
        { month: 'August 2021', count: 1 },
        { month: 'September 2021', count: 0 },
        { month: 'October 2021', count: 5 },
        { month: 'November 2021', count: 7 },
        { month: 'December 2021', count: 7 }
    ];
  
    new Chart(
      document.getElementById('totalAvailment'),
      {
        type: 'bar',
        data: {
          labels: prescriptionsFilled2.map(row => row.month),
          datasets: [
            {
              label: 'Prescriptions Filled',
              data: prescriptionsFilled2.map(row => row.count),
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            },
            {
              label: 'Transactions',
              data: transactions2.map(row => row.count),
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
  })();




//   age demographics

(async function() {

    const   age = [
        { age: '0-14 years old', count: 190 },
        { age: '15-64 years old', count: 50 },
        { age: '65+ years old', count: 100 },
    ];
    new Chart(
      document.getElementById('ageDemographics'),
      {
        type: 'bar',
        data: {
          labels: age.map(row => row.age),
          datasets: [
            {
              label: 'Age',
              data: age.map(row => row.count),
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




//   NON-COMMUNICABLE DISEASE

(async function() {

    const   sakit = [
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






