getTrendsData();

async function getTrendsData() {
    try {
        const response = await fetch("/pharmacy/trends/get-data");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();  // Extract the JSON data
        console.log(data);  // Now you can log the actual data
    } catch (error) {
        console.error("Error fetching trends data:", error);
    }
}