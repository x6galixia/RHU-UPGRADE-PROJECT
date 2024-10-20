const { func } = require("joi");
// import Base64 from 'crypto-js/enc-base64';

function closeeeee() {
    console.log();
    document.getElementById("generate-id").style.display = 'none';
    document.querySelector(".overlay").style.display = 'none';
}

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


