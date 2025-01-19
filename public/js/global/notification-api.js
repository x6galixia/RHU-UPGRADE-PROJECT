document.addEventListener("DOMContentLoaded", function () {
  function formatDate(dateString) {
    try {
      const options = {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      };
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", options);
    } catch (error) {
      console.error("Invalid date:", dateString, error);
      return "Invalid Date";
    }
  }

  const user_type = document.getElementById("user_fcking_type").value;

  if (user_type === "Doctor") {
    function labResultAvailable(data) {
      if (data.labResultAvailable && data.totalItems > 0) {
        document.querySelector(".newNotifContainer").classList.add("newNotif");
        document.getElementById("TotalNumberOfNotification").style.display = "flex";
        document.getElementById("TotalNumberOfNotification").innerText = data.totalItems;
      }
      updateNotificationContainer(data);
    }

    function updateNotificationContainer(data) {
      const notifContainer = document.querySelector(".notifContainer");
      let child = '';

      if (data.totalItems > 0) {
        data.labResultAvailable.forEach((list) => {
          child += `
            <div class="notif-separate">
              <div class="notif-center">
                <img class="icon-p" src="/icon/result.svg" alt="">
              </div>
              <div class="notifContext">
                <p class="p-head">New Laboratory result</p>
                <p class="p-body">${list.rhu_name}: ${list.full_name} from ${list.medtech_full_name}</p>
              </div>
            </div>
          `;
        });
      } else {
        child = `
          <div class="notif-separate">
            <div class="notifContext">
              <p>No new notification.</p>
            </div>
          </div>
        `;
        document.getElementById("TotalNumberOfNotification").style.display = "none";
      }

      notifContainer.innerHTML = child;
    }

    function notifications() {
      fetch('/doctor/notification?ajax=true')
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          return response.json();
        })
        .then((data) => {
          labResultAvailable(data);
          console.log(data);
        })
        .catch((error) => {
          console.error('Error fetching lab result notifications:', error);
        });
    }

    notifications();

  } else if (user_type === "Pharmacist") {
    function getNotificationForQuantity(data) {
      if (data.quantityNotif && data.expiredNotif && data.totalOfNewNotif > 0) {
        document.querySelector(".newNotifContainer").classList.add("newNotif");
        document.getElementById("TotalNumberOfNotification").style.display = "flex";
        document.getElementById("TotalNumberOfNotification").innerText = data.totalOfNewNotif;
      }
      updateNotificationContainer(data);
    }

    function updateNotificationContainer(data) {
      const notifContainer = document.querySelector(".notifContainer");
      let child = '';
    
      if (data.totalOfNewNotif > 0) {
        // Handle critical stock level and out of stock notifications
        data.quantityNotif.forEach((list) => {
          const isOutOfStock = list.stock_status === 'out_of_stock';
          const notificationType = isOutOfStock ? 'Out of Stock' : 'Critical stock level';
          const iconSrc = isOutOfStock ? '/icon/out_of_stock.svg' : '/icon/critical.svg';

          console.log("stock status: ", list.stock_status);
    
          child += `
            <div class="notif-separate">
              <div class="notif-center">
                <img class="icon-p" src="${iconSrc}" alt="">
              </div>
              <div class="notifContext">
                <p class="p-head">${notificationType}</p>
                <p class="p-body">
                  Quantity: ${list.product_quantity} Medicine: ${list.product_name} Product code: ${list.product_code}
                </p>
              </div>
            </div>
          `;
        });
    
        // Handle expired and soon-to-expire notifications
        data.expiredNotif.forEach((list) => {
          const isExpired = list.status === 'expired';
          const notificationType = isExpired ? 'Medicine Expired' : 'Medicine Expiring Soon';
          const iconSrc = isExpired ? '/icon/expired.svg' : '/icon/cale.svg';
    
          child += `
            <div class="notif-separate">
              <div class="notif-center">
                <img class="icon-p" src="${iconSrc}" alt="">
              </div>
              <div class="notifContext">
                <p class="p-head">${notificationType}</p>
                <p class="p-body">
                  Expiration date: ${formatDate(list.expiration)} Medicine: ${list.product_name} Product code: ${list.product_code}
                </p>
              </div>
            </div>
          `;
        });
      } else {
        // No notifications
        child = `
          <div class="notif-separate">
            <div class="notifContext">
              <p>No new notification.</p>
            </div>
          </div>
        `;
        document.getElementById("TotalNumberOfNotification").style.display = "none";
      }
    
      notifContainer.innerHTML = child;
    }
    
    function notifications() {
      fetch('/pharmacy/notification?ajax=true')
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          return response.json();
        })
        .then((data) => {
          getNotificationForQuantity(data);
          console.log(data);
        })
        .catch((error) => {
          console.error('Error fetching inventory updates:', error);
        });
    }

    notifications();
  }

  // Add similar blocks for Nurse and Med Tech if necessary.
});
