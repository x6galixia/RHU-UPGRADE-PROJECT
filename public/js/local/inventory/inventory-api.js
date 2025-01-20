document.addEventListener("DOMContentLoaded", function () {
    const POLL_INTERVAL = 300;
    let pollIntervalId;
    let isSearching = false;
    let currentSearchQuery = "";
    const loadingSpinner = document.getElementById('loadingSpinner'); // Assuming you have a loading spinner element
  
    const nav1 = document.querySelector(".nav1");
    if (nav1) {
      nav1.classList.toggle("selected");
    }
  
  
  
    function fetchInventoryUpdates() {
      if (!isSearching) {
        fetch(`/pharmacy-inventory?ajax=true&query=${encodeURIComponent(currentSearchQuery)}`)
          .then(response => response.json())
          .then(data => {
            updateInventoryTable(data);
            updatePaginationControls(data.currentPage, data.totalPages, data.limit, currentSearchQuery);
          })
          .catch(error => {
            console.error('Error fetching inventory updates:', error);
          });
      }
    }
  
    pollIntervalId = setInterval(fetchInventoryUpdates, POLL_INTERVAL);
  
    // Debounce function
    function debounce(func, delay) {
      let timeout;
      return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
      };
    }
  
    document.getElementById('searchInput').addEventListener('input', debounce(function (event) {
      event.preventDefault();
  
      const query = this.value.trim();
      currentSearchQuery = query;
  
      if (query !== "") {
        isSearching = true;
        clearInterval(pollIntervalId);
      } else {
        isSearching = false;
        pollIntervalId = setInterval(fetchInventoryUpdates, POLL_INTERVAL);
      }
  
      loadingSpinner.style.display = 'block';
  
      fetch(`/pharmacy-inventory?ajax=true&query=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
          updateInventoryTable(data);
          updatePaginationControls(data.currentPage, data.totalPages, data.limit, query);
        })
        .catch(error => {
          console.error('Error during search:', error);
        })
        .finally(() => {
          loadingSpinner.style.display = 'none';
        });
    }, 300)); // 300 ms delay for debounce
  
    // Function to handle pagination clicks
    function handlePagination(event) {
      event.preventDefault();
      const url = new URL(event.target.href);
      const params = new URLSearchParams(url.search);
  
      // Add search query to the pagination URL if a search is active
      if (currentSearchQuery) {
        params.set('query', currentSearchQuery);
      }
      params.set('ajax', 'true');
  
      // Fetch new data based on pagination link
      clearInterval(pollIntervalId);  // Stop the interval polling when manually fetching
      fetch(url.pathname + '?' + params.toString())
        .then(response => response.json())
        .then(data => {
          updateInventoryTable(data);
          updatePaginationControls(data.currentPage, data.totalPages, data.limit, currentSearchQuery);
        })
        .catch(error => {
          console.error('Error during pagination:', error);
        });
    }
  
    // Function to update pagination controls
    function updatePaginationControls(currentPage, totalPages, limit, query = '') {
      const paginationNav = document.getElementById('paginationNav');
      paginationNav.innerHTML = '';
  
      if (currentPage > 1) {
        paginationNav.innerHTML += `<a href="?page=${currentPage - 1}&limit=${limit}&query=${encodeURIComponent(query)}" aria-label="Previous Page">Previous</a>`;
      }
  
      if (currentPage < totalPages) {
        paginationNav.innerHTML += `<a href="?page=${currentPage + 1}&limit=${limit}&query=${encodeURIComponent(query)}" aria-label="Next Page">Next</a>`;
      }
  
      // Re-attach the event listeners after updating the pagination links
      attachPaginationListeners();
    }
  
    // Attach event listeners to pagination links
    function attachPaginationListeners() {
      document.querySelectorAll('nav[aria-label="Page navigation"] a').forEach(link => {
        link.addEventListener('click', handlePagination);
      });
    }
  
    // Initial setup
    attachPaginationListeners();
  });

  function attachDotEventListeners() {
    document.querySelectorAll(".dot").forEach(function (dot) {
        dot.addEventListener("click", function () {
            const tripleDotContainer = dot.closest("td").querySelector(".triple-dot");
            if (tripleDotContainer) {
                // Close all other open menus
                document.querySelectorAll(".triple-dot.visible").forEach(menu => {
                    if (menu !== tripleDotContainer) {
                        menu.classList.remove("visible");
                    }
                });

                tripleDotContainer.classList.toggle("visible");
                if (tripleDotContainer.classList.contains("visible")) {
                    clearInterval(pollIntervalId);
                    isDotMenuOpen = true;
                } else {
                    pollIntervalId = setInterval(fetchBeneficiaryUpdates, POLL_INTERVAL);
                    isDotMenuOpen = false;
                }
            }
        });
    });

    document.addEventListener("click", function (event) {
        // Check if the click was outside any dot container
        if (!event.target.closest(".dot")) {
            document.querySelectorAll(".triple-dot.visible").forEach(menu => {
                menu.classList.remove("visible");
                pollIntervalId = setInterval(fetchBeneficiaryUpdates, POLL_INTERVAL);
                isDotMenuOpen = false;
            });
        }
    });
}

function updateInventoryTable(data) {
  const tableBody = document.getElementById("inventoryTableBody");
  let rows = '';

  if (data.getInventoryList && data.getInventoryList.length > 0) {
      const currentDate = new Date(); // Get the current date
      const nearToExpireDate = new Date();
      nearToExpireDate.setMonth(currentDate.getMonth() + 3); // Set to 3 months from now

      data.getInventoryList.forEach(list => {
          const expirationDate = new Date(list.expiration); // Convert expiration date to Date object
          let rowClass = "";
          let quantityIcon = ""; // Icon for the product quantity column
          let expirationIcon = ""; // Icon for the expiration column
          let quantityTooltip = ""; // Tooltip for product quantity column
          let expirationTooltip = ""; // Tooltip for expiration column

          const daysToExpire = Math.ceil((expirationDate - currentDate) / (1000 * 60 * 60 * 24)); // Calculate days to expire

          // Critical stock condition
          if (list.product_quantity <= 500) {
              rowClass = "critical-stock";
              quantityIcon = "!"; 
              quantityTooltip = "This product is in critical stock.";
          }

          // Near-to-expire condition
          if (expirationDate <= nearToExpireDate && expirationDate > currentDate) {
              rowClass = "near-to-expire";
              expirationIcon = "!"; 
              expirationTooltip = `This product will expire in ${daysToExpire} days.`;
          }

          // Expired condition
          if (expirationDate <= currentDate) {
              rowClass = "expired";
              expirationIcon = "!"; 
              expirationTooltip = `This product expired ${Math.abs(daysToExpire)} days ago.`;
          }

          // Out-of-stock condition
          if (list.product_quantity === 0) {
              rowClass = "out-of-stock";
              quantityIcon = "!";
              quantityTooltip = "This product is out of stock.";
          }

          // Build the table row
          rows += `
              <tr class="${rowClass}">
                  <td>${list.product_id}</td>
                  <td>${list.product_code}</td>
                  <td>${list.product_name}</td>
                  <td>${list.brand_name}</td>
                  <td>${list.supplier}</td>
                  <td>${list.dosage_form}</td>
                  <td>${list.dosage}</td>
                  <td>${list.reorder_level}</td>
                  <td>${list.batch_number}</td>
                  <td>
                      <div style="display:flex; align-items:center; justify-content:center; position:relative">
                          ${list.product_quantity}
                          ${quantityIcon ? `<div class="icon-container" data-tooltip="${quantityTooltip}"><span class="icon">${quantityIcon}</span></div>` : ''}
                      </div>
                  </td>
                  <td style="min-width: 200px;">
                      <div style="display:flex; align-items:center; justify-content:center; position:relative">
                          ${list.expiration}
                          ${expirationIcon ? `<div class="icon-container" data-tooltip="${expirationTooltip}"><span class="icon">${expirationIcon}</span></div>` : ''}
                      </div>
                  </td>
                  <td class="menu-row">
                    <img class="dot" src="../icon/triple-dot.svg" alt="">
                    <div class="triple-dot">
                        <div class="menu" data-id="${list.product_id}">
                            <button id="delete-id" onclick="popUp_three_dot(this)">Delete</button>
                            <button id="update-id" onclick="popUp_three_dot(this)">Update</button>
                            <button id="generate-id" onclick="popUp_three_dot(this)">Generate ID</button>
                        </div>
                    </div>
                  </td>
                  </tr>`;
      });
                  // <td>

                  //     <img src="/img/local/pencil.png" style="height: 20px; margin: 5px;" onclick="updateInventoryItem('${list.product_id}')">
                  //     <img src="/img/local/recycle-bin.png" style="height: 20px; margin: 5px;" onclick="deleteInventoryItem('${list.product_id}')">
                  // </td>
  } else {
      // If no data is available, show a message
      rows = '<tr><td colspan="12">No list of Medicine</td></tr>';
  }

  tableBody.innerHTML = rows; // Batch DOM update
  attachDotEventListeners();
}

  function deleteInventoryItem(itemId) {
    console.log('Sending DELETE request for ID:', itemId);

    fetch(`/pharmacy-inventory/delete-item/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
      },
    })
        .then(response => {
          if (response.ok) {
            fetchInventoryUpdates();
            location.reload();
            console.log('Sending DELETE request for ID:', itemId);
          }
          fetchInventoryUpdates();
                location.reload();
                console.log('Sending DELETE request for ID:', itemId);
      })
      .catch(error => {
          console.error('Error deleting beneficiary:', error);
          location.reload();
          console.log('Sending DELETE request for ID:', itemId);
      });
}