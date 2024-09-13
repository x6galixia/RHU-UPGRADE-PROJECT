//-------AUTOMATIC CALCULATION OF AGE-------//
//we add a automation in calculation of age to
//make sure the age is always updated

function calculateAge(birthdateString) {
    const birthdate = new Date(birthdateString);
    const today = new Date();
  
    let age = today.getFullYear() - birthdate.getFullYear();
    const monthDifference = today.getMonth() - birthdate.getMonth();
    const dayDifference = today.getDate() - birthdate.getDate();
  
    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
      age--;
    }
    return age;
  }

  module.exports = {
    calculateAge
  }