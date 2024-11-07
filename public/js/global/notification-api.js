
document.addEventListener("DOMContentLoaded", function () {

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
                      ${list.product_quantity}, ${list.product_name}, ${list.product_code}
                      </p>
                    </div>
                  </div>
                  `;
        });
        data.expiredNotif.forEach(list => {
          child += `
                  <div class="notif-separate">
                    <div class="notif-center">
                      <img class="icon-p" src="/icon/warning.svg" alt="">
                    </div>
                    <div class="notifContext">
                      <p class="p-head">
                        Medicine Expiring Soon
                      </p>
                      <p class="p-body">
                      ${list.expiration}, ${list.product_name}, ${list.product_code}
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

  }

});
