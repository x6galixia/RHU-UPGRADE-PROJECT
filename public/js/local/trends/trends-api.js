getTrendsMostPrescribeDrugs();
getTrendsAgeDemographics();
getTrendsGrowthYearly();
getTrendsGrowthMonthly();
getTrendsNumberOfBeneficiaries();

// Growth Monthly Data
async function getTrendsGrowthMonthly() {
    try {
        const response = await fetch("/pharmacy/trends/growth/monthly");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();  // Extract the JSON data
        console.log("Growth Monthly: ",data);  // Now you can log the actual data
    } catch (error) {
        console.error("Error fetching trends data:", error);
    }
}

//growth Yearly
async function getTrendsGrowthYearly() {
    try {
        const response = await fetch("/pharmacy/trends/growth/yearly");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();  // Extract the JSON data
        console.log("Growth Yearly: ",data);  // Now you can log the actual data
    } catch (error) {
        console.error("Error fetching trends data:", error);
    }
}

//Age Demographics
async function getTrendsAgeDemographics() {
    try {
        const response = await fetch("/pharmacy/trends/age-demographics");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();  // Extract the JSON data
        console.log("Age Demographics: ",data);  // Now you can log the actual data
    } catch (error) {
        console.error("Error fetching trends data:", error);
    }
}

//Most Prescribe Drugs
async function getTrendsMostPrescribeDrugs() {
    try {
        const response = await fetch("/pharmacy/trends/most-prescribe-drugs");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();  // Extract the JSON data
        console.log("Most Prescribe Drugs: ",data);  // Now you can log the actual data
    } catch (error) {
        console.error("Error fetching trends data:", error);
    }
}

//Number of Beneficiaries
async function getTrendsNumberOfBeneficiaries() {
    try {
        const response = await fetch("/pharmacy/trends/number-of-beneficiaries");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();  // Extract the JSON data
        console.log("Number of beneficiaries: ",data);  // Now you can log the actual data
    } catch (error) {
        console.error("Error fetching trends data:", error);
    }
}