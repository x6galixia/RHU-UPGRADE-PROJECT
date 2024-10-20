const { func } = require("joi");
// import Base64 from 'crypto-js/enc-base64';

document.addEventListener('DOMContentLoaded', function () {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('ousiderPicture');

    uploadArea.addEventListener('click', function () {
        fileInput.click();
    });


    document.getElementById("generateIdButton").addEventListener('click', function () {
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
            reader.onload = function (e) {
                beneficiaryPicture.src = e.target.result;
            };
            reader.readAsDataURL(fileInput.files[0]);
        }

        //outsider QR
        async function generateQRCode() {
            const json = `${outsiderID}`;

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



        document.querySelector(".close_popUp").addEventListener('click', function () {
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

        document.addEventListener("click", function (event) {
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

});

// compute BMI
function computeBMI() {
    const height = parseFloat(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    if (height && weight) {
        const heightInMeters = height / 100;
        const bmi = weight / (heightInMeters * heightInMeters);
        document.getElementById('bmi').value = bmi.toFixed(2);
    } else {
        document.getElementById('bmi').value = '';
    }
}

function validateInputs() {
    const height = parseFloat(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const systolic = parseFloat(document.getElementById('systolic').value);
    const diastolic = parseFloat(document.getElementById('diastolic').value);
    const respiratoryRate = parseFloat(document.getElementById('respiratory_rate').value);
    const pulseRate = parseFloat(document.getElementById('pulse_rate').value);

    if (height > 195) {
        alert('Height cannot exceed 195 cm');
        return false;
    }
    if (weight > 400) {
        alert('Weight cannot exceed 400 kg');
        return false;
    }
    if (systolic > 250) {
        alert('Systolic BP cannot exceed 250');
        return false;
    }
    if (diastolic > 150) {
        alert('Diastolic BP cannot exceed 150');
        return false;
    }
    if (respiratoryRate > 60) {
        alert('Respiratory rate cannot exceed 60 breaths per minute');
        return false;
    }
    if (pulseRate > 200) {
        alert('Pulse rate cannot exceed 200 beats per minute');
        return false;
    }

    return true;
}


