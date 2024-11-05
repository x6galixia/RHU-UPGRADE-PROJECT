getTrendsMostPrescribeDrugs();
getTrendsAgeDemographics();
getTrendsGrowthYearly();
getTrendsGrowthMonthly();

// Growth Monthly Data
async function getTrendsGrowthMonthly() {
    try {
        const response = await fetch("/pharmacy/trends/growth/monthly");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();  // Extract the JSON data
        console.log(data);  // Now you can log the actual data
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
        console.log(data);  // Now you can log the actual data
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
        console.log(data);  // Now you can log the actual data
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
        console.log(data);  // Now you can log the actual data
    } catch (error) {
        console.error("Error fetching trends data:", error);
    }
}