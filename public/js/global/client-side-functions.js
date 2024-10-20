document.addEventListener("DOMContentLoaded", function () {
    function getCurrentDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    document.querySelectorAll(".current-date").forEach(function (element) {
        element.value = getCurrentDate();
    });


    document.getElementById('newUserCheck').addEventListener('change', function () {
        const button = document.querySelector('.generateID');
        console.log("asd");
        if (this.checked) {
            button.style.display = 'flex';

            const uploadArea = document.getElementById('uploadArea');
            const fileInput = document.getElementById('ousiderPicture');

            uploadArea.addEventListener('click', function () {
                fileInput.click();
            });
        } else {
            button.style.display = 'none';
        }
    });

    document.getElementById("generateIdButton").addEventListener('click', function () {
        document.getElementById("generate-id").style.display = 'block';
        document.querySelector(".overlay").style.display = 'block';


        //outsider info
        const name = document.getElementById('firstname').value + " " +
            document.getElementById('middlename').value + " " +
            document.getElementById('lastname').value + " " +
            document.getElementById('suffix').value;
        // const outsiderID = document.getElementById("outsiderID").value;

        console.log(name);
        console.log(document.getElementById('address').value);
        console.log(document.getElementById('phone').value);

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
        const patient_id = document.getElementById('qrOutput').value;
        async function generateQRCode() {
            const json = `${patient_id}`;

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


        function encryptData(data, secretKey) {
            return CryptoJS.AES.encrypt(data, secretKey).toString();
        }

        // Decrypt function
        function decryptData(cipherText, secretKey) {
            const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
            return bytes.toString(CryptoJS.enc.Utf8);
        }
    });


});


function yawa() {
    console.log("asdas");
    document.getElementById('submit_prompt').classList.toggle("visible1");
    document.getElementById('susOo').classList.toggle("visible");
}