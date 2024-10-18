document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('newUserCheck').addEventListener('change', function() {
      const button = document.querySelector('.generateID');
      if (this.checked) {
          button.style.display = 'flex';
      } else {
          button.style.display = 'none';
      }
  });

  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('ousiderPicture');

  uploadArea.addEventListener('click', function() {
      fileInput.click(); 
  });


  document.getElementById("generateIdButton").addEventListener('click', function(){
      document.getElementById("generate-id").style.display = 'block';
      document.querySelector(".overlay").style.display = 'block';


      //outsider info
      const name = document.getElementById('firstname').value + " " + 
                  document.getElementById('middlename').value + " " + 
                  document.getElementById('lastname').value + " " + 
                  document.getElementById('suffix').value;
      const outsiderID = document.getElementById("outsiderID").value;

      document.getElementById('beneficiary-name').innerHTML = name;
      document.getElementById('beneficiary-address').innerHTML = document.getElementById('address').value;
      document.getElementById('beneficiary-phone').innerHTML = document.getElementById('phone').value;

      //outsider picture
      const fileInput = document.getElementById('ousiderPicture');
      const beneficiaryPicture = document.getElementById('beneficiary-picture');

      if (fileInput.files.length > 0) {
          const reader = new FileReader();
          reader.onload = function(e) {
              beneficiaryPicture.src = e.target.result;
          };
          reader.readAsDataURL(fileInput.files[0]);
      }

      //outsider QR
      async function generateQRCode() {
          const json = `{ "outsider_id": "${outsiderID}" }`;
          
          const secretKey = "KimGalicia";
          const encryptedData = encryptData(json, secretKey);
          console.log("Encrypted Data:", encryptedData);
          
          const qr = qrcode(0, 'L');
          qr.addData(encryptedData);
          qr.make();
          
          const size = 4;
          document.getElementById('qrcode').innerHTML = qr.createImgTag(size, size);
          const decryptedData = decryptData(encryptedData, secretKey);

          console.log("Decrypted Data:", decryptedData);
      }
          
      generateQRCode();    



      document.querySelector(".close_popUp").addEventListener('click', function(){
          document.getElementById("generate-id").style.display = 'none';
          document.querySelector(".overlay").style.display = 'none';
      });

      function encryptData(data, secretKey) {
          return CryptoJS.AES.encrypt(data, secretKey).toString();
      }
      
      // Decrypt function
      function decryptData(cipherText, secretKey) {
          const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
          return bytes.toString(CryptoJS.enc.Utf8);
      }
  });

    document.querySelectorAll(".dot").forEach(function (dot) {
        dot.addEventListener("click", function () {
            const tripleDotContainer = dot.closest("td").querySelector(".triple-dot");
            if (tripleDotContainer) {
                tripleDotContainer.classList.toggle("visible");
                // if (tripleDotContainer.classList.contains("visible")) {
                //     clearInterval(pollIntervalId);
                //     isDotMenuOpen = true;
                // } else {
                //     pollIntervalId = setInterval(fetchBeneficiaryUpdates, POLL_INTERVAL);
                //     isDotMenuOpen = false;
                // }
                console.log(tripleDotContainer);
            }
        });
        
        document.addEventListener("click", function(event) {
            // Check if the click was outside the dot container
            if (!dot.contains(event.target)) {
                const tripleDotContainer = dot.closest("td").querySelector(".triple-dot");
                if (tripleDotContainer && tripleDotContainer.classList.contains("visible")) {
                    tripleDotContainer.classList.remove("visible");
                    // pollIntervalId = setInterval(fetchBeneficiaryUpdates, POLL_INTERVAL);
                    // isDotMenuOpen = false;
                    console.log("triple dot closed");
                }
            }
        });
    });


    // qr scanning
    const qrInputField = document.getElementById('qrInput');
    
    let scanning = false;
    
    document.addEventListener('keydown', function (event) {
        if (event.key.length === 1) {
            scanning = true;
            qrInputField.focus();
        }
    });
    
    qrInputField.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            const scannedData = event.target.value;
    
            fetch('/nurse/scannedQR', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ qrCode: scannedData })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Success:', data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    
            event.target.value = '';
        }
    });
    
    qrInputField.focus();
    
    qrInputField.addEventListener('focus', () => {
        scanning = false;
    });
});