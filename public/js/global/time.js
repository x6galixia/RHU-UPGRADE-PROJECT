const WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

    function zeroPadding(num, length) {
        return num.toString().padStart(length, '0');
    }

    function updateTime() {
        var now = new Date();
        var hours = now.getHours();
        var minutes = now.getMinutes();
        var seconds = now.getSeconds();

        // Convert to 12-hour format
        var period = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // If hour is 0, change it to 12

        document.getElementById("time").innerText =
            zeroPadding(hours, 2) + ":" +
            zeroPadding(minutes, 2) + ":" +
            zeroPadding(seconds, 2) + " " + period;

        document.getElementById("date").innerText =
        zeroPadding(now.getMonth() + 1, 2) + "/" +
        zeroPadding(now.getDate(), 2) + "/" +
            now.getFullYear() + " - " +
           
            WEEK[now.getDay()];
    }

    // Update time every second
    setInterval(updateTime, 1000);

    updateTime();