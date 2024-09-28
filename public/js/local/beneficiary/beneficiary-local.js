const container = document.getElementById("surubadan");
      const masubad = document.getElementById("masubad");
      const containerWidth = parseFloat(window.getComputedStyle(container).width);
      const newWidth = containerWidth - 107.33;
      masubad.style.width = newWidth + "px";

      document.querySelector('.upload-section').addEventListener('click', function() {
          document.querySelector('.beneficiary-upload-image').click();
      });

      document.querySelector('.beneficiary-upload-image').addEventListener('change', function(event) {
          const file = event.target.files[0];
          if (file) {
              document.getElementById("upload-image-text").innerHTML = "Change Image";
              const reader = new FileReader();
              reader.onload = function(e) {
                  document.querySelector('.upload-section img').src = e.target.result;
              }
              reader.readAsDataURL(file);
          }
      });

      function Generate(first_name, last_name, middle_name, phone, street, province) {
          first_name = first_name || "N/A";
          last_name = last_name || "N/A";
          middle_name = middle_name || "N/A";
          phone = phone || "N/A";
          street = street || "N/A";
          province = province || "N/A";

          console.log("First name: " + first_name);
          console.log("Last name: " + last_name);
          console.log("Middle name: " + middle_name);
          console.log("Phone: " + phone);
          console.log("Street: " + street);
          console.log("Province: " + province);
      }
