function printingReqReseta(containerID) {
    console.log("containerID:", containerID);
    var reseta = document.getElementById("resetaPrint");
    var reqLab = document.getElementById("labReqPrint");

    if (containerID === "labReqPrint") {
        console.log('pres')
        reqLab.classList.add("show");
        reseta.classList.remove("show");
    } else if (containerID === "resetaPrint") {
        console.log('labreq');


        reseta.classList.add("show");
        reqLab.classList.remove("show");
    }
    window.print();
}

const fullScreenImage = document.getElementById('fullScreenImage');
const imageModal = document.getElementById('imageModal');
const closeModal = document.getElementById('closeModal');

displayedImage.addEventListener('click', function () {
    fullScreenImage.src = displayedImage.src;
    imageModal.style.display = 'flex';
});

closeModal.addEventListener('click', function () {
    imageModal.style.display = 'none';
});

imageModal.addEventListener('click', function (event) {
    if (event.target === imageModal) {
        imageModal.style.display = 'none';
    }
});

document.getElementById('medicine').addEventListener('input', function () {
    const query = this.value;
    if (query.length > 0) {
        fetch(`/doctor-dashboard/prescribe/search?query=${query}`)
            .then(response => response.json())
            .then(data => {
                const suggestions = document.getElementById('suggestions');
                suggestions.innerHTML = '';
                document.querySelector('.suggestionContainer').style.display = 'none';
                data.forEach(item => {
                    const suggestionDiv = document.createElement('div');
                    suggestionDiv.classList.add('suggestion');
                    suggestionDiv.textContent = `${item.product_name} - ${item.dosage} QTY: ${item.product_quantity} BTCH: ${item.batch_number}`;
                    suggestionDiv.addEventListener('click', function () {
                        document.getElementById('medicine').value = item.product_name + " " + item.dosage;
                        suggestions.innerHTML = '';
                        document.querySelector('.suggestionContainer').style.display = 'none';
                        document.getElementById('product_id').value = item.product_id;
                        document.getElementById('batch_number').value = item.batch_number;
                        console.log(item);
                    });
                    document.querySelector('.suggestionContainer').style.display = 'block';
                    suggestions.appendChild(suggestionDiv);
                });
            })
            .catch(error => console.error('Error:', error));
    } else {
        document.getElementById('suggestions').innerHTML = '';
        document.querySelector('.suggestionContainer').style.display = 'none';
    }
});
document.addEventListener('click', function (event) {
    const suggestionContainer = document.querySelector('.suggestionContainer');
    const medicineInput = document.getElementById('medicine');

    if (!suggestionContainer.contains(event.target) && event.target !== medicineInput) {
        suggestionContainer.style.display = 'none';
    }
});