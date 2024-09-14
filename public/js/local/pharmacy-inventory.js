const restock = document.getElementById("restock-med");
    const transfer = document.getElementById("transfer-med");
    const add = document.getElementById("add-med");
    const confirm_transfer = document.getElementById("confirm-transfer");
    const confirm_restock = document.getElementById("confirm-restock");
    const confirm_add_med = document.getElementById("confirm-add-med");
    const overlay = document.querySelector(".overlay");

    function popUp_button(button) {
      var buttonId = button.id;
      if (buttonId === "restock"){
        restock.classList.toggle("visible");
      } else if (buttonId === "transfer"){
        transfer.classList.toggle("visible");
      } else if (buttonId === "add"){
        add.classList.toggle("visible");
      } else if (buttonId === "transfer_form"){
        confirm_transfer.classList.toggle("visible");
      } else if (buttonId === "restock_form"){
        confirm_restock.classList.toggle("visible");
      } else if (buttonId === "add_med_form"){
        confirm_add_med.classList.toggle("visible");
      }
      overlay.classList.add("visible");
    }
    document.querySelectorAll(".close_popUp").forEach(function(closeBtn) {
      closeBtn.addEventListener("click", function() {
        var pop_up = closeBtn.closest(".pop-up"); 
        if (pop_up) {
          pop_up.classList.remove("visible"); 
          overlay.classList.remove("visible");
        }
      });
    });
    document.querySelectorAll(".close_confirm").forEach(function(closeBtn) {
      closeBtn.addEventListener("click", function() {
        var pop_up_confirm = closeBtn.closest(".pop-up-confirm"); 
        if (pop_up_confirm) {
          pop_up_confirm.classList.remove("visible"); 
        }
      });
    });