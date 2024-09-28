// For Add Beneficiary
document.querySelector('#add-beneficiary .upload-section').addEventListener('click', function() {
    console.log("Upload image - Add Beneficiary");
    document.querySelector('#add-beneficiary .beneficiary-upload-image').click();
});

document.querySelector('#add-beneficiary .beneficiary-upload-image').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        document.querySelector('#add-beneficiary #upload-image-text').innerHTML = "Change Image";
        const reader = new FileReader();
        reader.onload = function(e) {
            document.querySelector('#add-beneficiary .upload-section img').src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
});

// For Update Beneficiary
document.querySelector('#update-beneficiary .upload-section').addEventListener('click', function() {
    console.log("Upload image - Update Beneficiary");
    document.querySelector('#update-beneficiary .beneficiary-upload-image').click();
});

document.querySelector('#update-beneficiary .beneficiary-upload-image').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        document.querySelector('#update-beneficiary #upload-image-text').innerHTML = "Change Image";
        const reader = new FileReader();
        reader.onload = function(e) {
            document.querySelector('#update-beneficiary .upload-section img').src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
});