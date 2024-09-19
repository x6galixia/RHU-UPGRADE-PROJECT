document.addEventListener("DOMContentLoaded", function() {
  const POLL_INTERVAL = 1000;
  let pollIntervalId;
  let isSearching = false;

  function updateInventoryTable(data) {
      const tableBody = document.getElementById("inventoryTableBody");
      tableBody.innerHTML = "";

      if (data.getInventoryList.length > 0) {
          data.getInventoryList.forEach(list => {
              const row = document.createElement("tr");
              row.innerHTML = `
                  <td>${list.product_id}</td>
                  <td>${list.product_code}</td>
                  <td>${list.product_name}</td>
                  <td>${list.brand_name}</td>
                  <td>${list.supplier}</td>
                  <td>${list.dosage_form}</td>
                  <td>${list.dosage}</td>
                  <td>${list.reorder_level}</td>
                  <td>${list.batch_number}</td>
                  <td>${list.product_quantity}</td>
                  <td>${list.expiration}</td>
              `;
              tableBody.appendChild(row);
          });
      } else {
          const emptyRow = document.createElement("tr");
          emptyRow.innerHTML = '<td colspan="11">No list of Medicine</td>';
          tableBody.appendChild(emptyRow);
      }
  }

  function fetchInventoryUpdates() {
      if (!isSearching) {
          fetch('/pharmacy-inventory?ajax=true')
              .then(response => response.json())
              .then(data => {
                  updateInventoryTable(data);
              })
              .catch(error => {
                  console.error('Error fetching inventory updates:', error);
              });
      }
  }

  pollIntervalId = setInterval(fetchInventoryUpdates, POLL_INTERVAL);

  document.getElementById('searchInput').addEventListener('input', function(event) {
      event.preventDefault();

      const query = this.value;

      if (query.trim() !== "") {
          isSearching = true;
          clearInterval(pollIntervalId);
      } else {
          isSearching = false;
          pollIntervalId = setInterval(fetchInventoryUpdates, POLL_INTERVAL);
      }

      loadingSpinner.style.display = 'block';

      fetch(`/pharmacy-inventory/search?query=${encodeURIComponent(query)}`)
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
              console.error('Error during search:', error);
          })
          .finally(() => {
              loadingSpinner.style.display = 'none';
          });
  });
});