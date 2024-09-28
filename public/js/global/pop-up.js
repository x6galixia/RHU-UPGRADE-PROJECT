    //admin
    const createUser = document.getElementById("create-user");
    
    // inventory
    const restock = document.getElementById("restock-med");
    const transfer = document.getElementById("transfer-med");
    const add = document.getElementById("add-med");
    const confirm_transfer = document.getElementById("confirm-transfer");
    const confirm_restock = document.getElementById("confirm-restock");
    const confirm_add_med = document.getElementById("confirm-add-med");

    //beneficiary-records
    const add_beneficiary = document.getElementById("add-beneficiary");
    const update_beneficiary = document.getElementById("update-beneficiary");
    const delete_beneficiary = document.getElementById("delete-beneficiary");
    const ID = document.getElementById("id");

    //dispense
    const dispense = document.getElementById("dispense-med");
    const reject_dispense = document.getElementById("reject_dispense");
    const submit_dispense = document.getElementById("submit_dispense");


    const overlay = document.querySelector(".overlay");

    function popUp_button(button) {
      var buttonId = button.id;

      //inventory
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

      //beneficiary-records
      else if (buttonId === "add-beneficiary-button"){
        add_beneficiary.classList.toggle("visible");
      }
      else if (buttonId === "generate-id"){
        ID.classList.toggle("visible");
      }
      else if (buttonId === "update-id"){
        update_beneficiary.classList.toggle("visible");
      }
      else if (buttonId === "delete-id"){
        delete_beneficiary.classList.toggle("visible");
      }

      // dispense
      else if (buttonId === "reject_dispense_button"){
        reject_dispense.classList.toggle("visible");
      }
      else if (buttonId === "submit_dispense_button"){
        submit_dispense.classList.toggle("visible");
      }
      else if (buttonId === "dispense"){
        dispense.classList.toggle("visible");
      }

      //admin - user
      else if (buttonId === "create-user-btn"){
        createUser.classList.toggle("visible");
      }
      overlay.classList.add("visible");
    }
    

    // close pop-up
    document.querySelectorAll(".close_popUp").forEach(function(closeBtn) {
      closeBtn.addEventListener("click", function() {
        var pop_up = closeBtn.closest(".pop-up"); 
        if (pop_up) {
          pop_up.classList.remove("visible"); 
          overlay.classList.remove("visible");
        }
      });
    });

    // close pop-up
    document.querySelectorAll(".close_popUp1").forEach(function(closeBtn) {
      closeBtn.addEventListener("click", function() {
        var pop_up = closeBtn.closest(".pop-up-confirm"); 
        if (pop_up) {
          pop_up.classList.remove("visible"); 
          overlay.classList.remove("visible");
        }
      });
    });

    //close pop-up 2
    document.querySelectorAll(".close_confirm").forEach(function(closeBtn) {
      closeBtn.addEventListener("click", function() {
        var pop_up_confirm = closeBtn.closest(".pop-up-confirm"); 
        if (pop_up_confirm) {
          pop_up_confirm.classList.remove("visible"); 
        }
      });
    });
