function notifDropdown() {
    const dropdown = document.getElementById("notif-drop");
    if (dropdown.style.display === "none" || dropdown.style.display === "") {
      dropdown.style.display = "block";
    } else {
      dropdown.style.display = "none";
    }
  }
  
  // Hide the dropdown if clicked outside
  window.onclick = function(event) {
    if (!event.target.matches('.notif')) {
      const dropdown = document.getElementById("notif-drop");
      if (dropdown.style.display === "block") {
        dropdown.style.display = "none";
      }
    }
  }
  