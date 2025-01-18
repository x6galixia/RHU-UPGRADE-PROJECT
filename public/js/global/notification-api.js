
document.addEventListener("DOMContentLoaded", function () {

  function formatDate(dateString) {
    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", options);
  }

  const user_type = document.getElementById("user_fcking_type").value;

  if (user_type == "Doctor") {
    function labResultAvailable(data) {
      if (data.labResultAvailable && data.totalItems && data.totalItems > 0) {
        document.querySelector(".newNotifContainer").classList.toggle("newNotif");
        document.getElementById("TotalNumberOfNotification").style.display = "flex";
        document.getElementById("TotalNumberOfNotification").innerText = data.totalItems;
      }
      updateNotificationContainer(data);
    }

    function notifications() {
      fetch('/doctor/notification?ajax=true')
        .then(response => response.json())
        .then(data => {
          labResultAvailable(data);
          console.log(data);
        })
        .catch(error => {
          console.error('Error fetching inventory updates:', error);
        });
    }

    function updateNotificationContainer(data) {
      const notifContainer = document.querySelector(".notifContainer");
      let child = '';

      if (data.totalItems > 0) {
        data.labResultAvailable.forEach(list => {
          child += `
                  <div class="notif-separate">
                    <div class="notif-center">
                      <img class="icon-p" src="/icon/result.svg" alt="">
                    </div>
                    <div class="notifContext">
                      <p class="p-head">
                       New Laboratory result
                      </p>
                      <p class="p-body">
                      ${list.rhu_name}: ${list.full_name} from ${list.medtech_full_name}
                      </p>
                    </div>
                  </div>
                  `;
        });
      } else {
        child = `<div class="notif-separate">
                    <div class="notifContext">
                      <p>No new notification.</p>
                    </div>
                  </div>`;
        document.getElementById("TotalNumberOfNotification").style.display = "none";
      }
      notifContainer.innerHTML = child;
    }
    notifications();

  } else if (user_type == "Nurse") {


  } else if (user_type == "Med Tech") {


  } else if (user_type == "Pharmacist") {

    function getNotificationForQuantity(data) {
      if (data.quantityNotif && data.expiredNotif && data.totalOfNewNotif > 0) {
        document.querySelector(".newNotifContainer").classList.toggle("newNotif");
        document.getElementById("TotalNumberOfNotification").style.display = "flex";
        document.getElementById("TotalNumberOfNotification").innerText = data.totalOfNewNotif;
      }
      updateNotificationContainer(data);
    }
    
    function notifications() {
      fetch('/pharmacy/notification?ajax=true')
        .then(response => response.json())
        .then(data => {
          getNotificationForQuantity(data);
          console.log(data);
        })
        .catch(error => {
          console.error('Error fetching inventory updates:', error);
        });
    }
    
    function updateNotificationContainer(data) {
      const notifContainer = document.querySelector(".notifContainer");
      let child = '';
    
      if (data.totalOfNewNotif > 0) {
        // Handle critical stock level notifications
        data.quantityNotif.forEach(list => {
          child += `
            <div class="notif-separate">
              <div class="notif-center">
                <img class="icon-p" src="/icon/critical.svg" alt="">
              </div>
              <div class="notifContext">
                <p class="p-head">
                  Critical stock level
                </p>
                <p class="p-body">
                  Quantity: ${list.product_quantity} Medicine: ${list.product_name} Product code: ${list.product_code}
                </p>
              </div>
            </div>
          `;
        });
    
        // Handle expired and soon-to-expire notifications
        data.expiredNotif.forEach(list => {
          const isExpired = list.status === 'expired';
          const notificationType = isExpired ? 'Medicine Expired' : 'Medicine Expiring Soon';
          const iconSrc = isExpired ? '/icon/expired.svg' : '/icon/cale.svg';
    
          child += `
            <div class="notif-separate">
              <div class="notif-center">
                <img class="icon-p" src="${iconSrc}" alt="">
              </div>
              <div class="notifContext">
                <p class="p-head">
                  ${notificationType}
                </p>
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
    
    notifications();

  }

});
