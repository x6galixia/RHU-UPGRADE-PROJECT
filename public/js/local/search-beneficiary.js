document.getElementById('searchInput').addEventListener('input', function() {
    const query = this.value;

    if (query.length > 0) {
      fetch(`/pharmacy-records/search?query=${query}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.querySelector('#beneficiaryTableBody');
            tableBody.innerHTML = '';
          
            if (data.getBeneficiaryList.length === 0) {
              tableBody.innerHTML = `
                <tr>
                  <td colspan="8">No matching records found</td>
                </tr>`;
            } else {
              data.getBeneficiaryList.forEach(beneficiary => {
                const row = document.createElement('tr');
                row.innerHTML = `
                  <td>${beneficiary.first_name} ${beneficiary.middle_name || ''} ${beneficiary.last_name}</td>
                  <td>${beneficiary.gender}</td>
                  <td>${beneficiary.address}</td>
                  <td>${beneficiary.phone}</td>
                  <td>${beneficiary.age}</td>
                  <td>${beneficiary.note}</td>
                  <td>${beneficiary.senior_citizen}</td>
                  <td>${beneficiary.pwd}</td>
                `;
                tableBody.appendChild(row);
              });
            }
          })          
        .catch(error => {
          console.error('Error:', error);
        });
    }
  });