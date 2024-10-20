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
        } else {
            button.style.display = 'none';
        }
    });

});


function yawa() {
    console.log("asdas");
    document.getElementById('submit_prompt').classList.toggle("visible1");
    document.getElementById('susOo').classList.toggle("visible");
}