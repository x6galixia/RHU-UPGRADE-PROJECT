const loadingSpinner = document.getElementById('loadingSpinner');
document.getElementById('searchInput').addEventListener('input', function() {
    const query = this.value;

    if (query.length > 0) {
      fetch(`/pharmacy-inventory/search?query=${query}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.querySelector('#inventoryTableBody');
            tableBody.innerHTML = '';
          
            if (data.getInventoryList.length === 0) {
              tableBody.innerHTML = `
                <tr>
                  <td colspan="11">No matching records found</td>
                </tr>`;
            } else {
              data.getInventoryList.forEach(medicine => {
                const row = document.createElement('tr');
                row.innerHTML = `
                  <td>${medicine.product_id}</td>
                  <td>${medicine.product_code}</td>
                  <td>${medicine.product_name}</td>
                  <td>${medicine.brand_name}</td>
                  <td>${medicine.supplier}</td>
                  <td>${medicine.dosage_form}</td>
                  <td>${medicine.dosage}</td>
                  <td>${medicine.reorder_level}</td>
                  <td>${medicine.batch_number}</td>
                  <td>${medicine.product_quantity}</td>
                  <td>${medicine.expiration}</td>
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