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
  
    function updateInventoryTable(data) {
      const tableBody = document.getElementById("inventoryTableBody");
      let rows = '';
  
      if (data.getInventoryList.length > 0) {
        data.getInventoryList.forEach(list => {
          rows += `
            <tr>
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
            </tr>`;
        });
      } else {
        rows = '<tr><td colspan="11">No list of Medicine</td></tr>';
      }
      tableBody.innerHTML = rows; // Batch DOM update
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