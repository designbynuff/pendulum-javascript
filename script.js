// On load
window.addEventListener('load', function () {

    // Declare some global variables
    let lat;
    let long;
    let city;
    let date;
    let numHour;
    let numMinute;
    let numSecond;
    let sunrise;
    let sunset;
    let moonphase;
    let position;

    // Get the user's location

    const successCallback = (pos) => {
        position = pos; // set global position variable
        console.log(position);
        latLong(); // Call function to set lat and long
        getCity(); // Call function to get city name
    };

    const errorCallback = (error) => {
        console.log(error);
    };

    navigator.geolocation.getCurrentPosition(successCallback, errorCallback);


    // Get the current time
    let currentTime = new Date();

    // Get the hour and minute components of the current time
    let hour = currentTime.getHours();
    let minute = currentTime.getMinutes();
    numHour = hour;
    numMinute = minute;
    numSecond = currentTime.getSeconds();

    // make seconds always two digits
    if (numSecond < 10) {
        numSecond = '0' + numSecond;
    }

    // turn hour in to 12 hour format
    if (hour > 12) {
        hour = hour % 12;
        console.log(hour);
    }


    // Translate the current time into words
    const timeInWords = timeToWords(hour, minute);

    console.log(timeInWords);

    // add the time in words to the div with the id "time"
    document.getElementById('time').innerHTML = 'It is ' + timeInWords + '.';

    setDateAndTime(); // Call function to set date and time
    getSunriseSunset(); // Call function to get sunrise and sunset times
    getMoonPhase(); // Call function to get moon phase

    // Automatically update the time every second
    // setInterval(function () {
    //     let currentTime = new Date();
    //     let hour = currentTime.getHours();
    //     let minute = currentTime.getMinutes();
    //     if (hour > 12) {
    //         hour = hour % 12;
    //     }
    //     const timeInWords = timeToWords(hour, minute);
    //     document.getElementById('time').innerHTML = 'It is ' + timeInWords + '.';
    // }, 1000);


    // Function to convert a number to words
    function numberToWords(number) {
        const units = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
        const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];

        if (number === 0) {
            return 'o\'clock';
        } else if (number < 20) {
            return units[number];
        } else {
            const tensDigit = Math.floor(number / 10);
            const unitsDigit = number % 10;
            return tens[tensDigit] + '-' + units[unitsDigit];
        }
    }

    // Function to convert the time to words
    function timeToWords(hour, minute) {
        let timeWords = '';

        // Noon and midnight
        if (hour === 12 && minute === 0) {
            timeWords = 'Noon';
        } else if (hour === 0 && minute === 0) {
            timeWords = 'Midnight';
        }

        // On the hour, quarters and halves
        else if (minute === 0) {
            timeWords = numberToWords(hour) + ' o\'clock';
        } else if (minute === 15) {
            timeWords = 'quarter past ' + numberToWords(hour);
        } else if (minute === 30) {
            timeWords = 'half past ' + numberToWords(hour);
        } else if (minute === 45) {
            timeWords = 'quarter to ' + numberToWords(hour + 1);
        }

        // Everything else
        else if (minute < 30) {
            timeWords = numberToWords(minute) + ' past ' + numberToWords(hour);
        } else {
            timeWords = numberToWords(60 - minute) + ' to ' + numberToWords(hour + 1);
        }

        return timeWords;
    }

    function latLong() {
        // Set lat and long from geolocation
        console.log("setting latitude and longitude");
        lat = position.coords.latitude;
        long = position.coords.longitude;
        console.log(lat, long);
        document.getElementById('latlong').innerHTML = lat + ', ' + long;
    }

    // Get city name from lat and long
    function getCity() {
        console.log("setting city name");
        fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + lat + '&longitude=' + long + '&localityLanguage=en')
            .then(response => response.json())
            .then(data => {
                city = data.city;
                console.log(city);
                document.getElementById('city').innerHTML = city;
            });
    }

    // Set date and time
    function setDateAndTime() {

        console.log("setting date and time");

        // Get the current date
        const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let dayOfWeek = weekdays[currentTime.getDay()];
        let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let month = months[currentTime.getMonth()];
        let dayOfMonth = currentTime.getDate();
        let year = currentTime.getFullYear();
        date = dayOfWeek + ', ' + month + ' ' + dayOfMonth + ', ' + year;
        console.log(date);
        document.getElementById('date').innerHTML = date;

        let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        console.log(timeZone);


        // Set time HTML to HH:MM:SS
        document.getElementById('digitaltime').innerHTML = numHour + ':' + numMinute + ':' + numSecond; + ' ' + timeZone;

    }

    // Get sunrise and sunset times
    function getSunriseSunset() {
        console.log("getting sunrise and sunset times");
        fetch('https://api.sunrise-sunset.org/json?lat=' + lat + '&lng=' + long + '&formatted=0')
            .then(response => response.json())
            .then(data => {
                sunrise = data.results.sunrise;
                sunset = data.results.sunset;
                console.log(sunrise, sunset);

                // Format sunrise and sunset times
                sunrise = sunrise.slice(11, 16);
                sunset = sunset.slice(11, 16);


                document.getElementById('sunrise').innerHTML = sunrise;
                document.getElementById('sunset').innerHTML = sunset;
            });
    }

    // NOT WORKING, NEED API OR NEW CALCULATION CODE Calculate moon phase based on date
    function calculateMoonPhase() {
        let year = currentTime.getFullYear();
        let month = currentTime.getMonth() + 1;
        let day = currentTime.getDate();
        let c, e, jd;
        if (month < 3) {
            year--;
            month += 12;
        }
        month += 1;
        c = 365.25 * year;
        e = 30.6 * month;
        jd = c + e + day - 694039.09;
        jd /= 29.5305882;
        jd = parseInt(jd);
        jd = jd % 8;
        return jd;
    }

    // Turn moon phase number into a string
    function getMoonPhaseName(phase) {
        let moonPhase;
        switch (phase) {
            case 0:
                moonPhase = 'New Moon';
                break;
            case 1:
                moonPhase = 'Waxing Crescent';
                break;
            case 2:
                moonPhase = 'First Quarter';
                break;
            case 3:
                moonPhase = 'Waxing Gibbous';
                break;
            case 4:
                moonPhase = 'Full Moon';
                break;
            case 5:
                moonPhase = 'Waning Gibbous';
                break;
            case 6:
                moonPhase = 'Last Quarter';
                break;
            case 7:
                moonPhase = 'Waning Crescent';
                break;
        }
        return moonPhase;
    }

    // Get moon phase
    function getMoonPhase() {
        console.log("getting moon phase");
        // fetch('https://moon-phase.p.rapidapi.com/basic?lat=' + lat + '&lon=' + long,)
        //     .then(response => response.json())
        //     .then(data => {
        //         console.log(data);
        //         moonphase = data.phase_name;
        //     });
        moonphase = (getMoonPhaseName(calculateMoonPhase()));
        console.log(moonphase);

        document.getElementById('moon-phase').innerHTML = moonphase;

        // set phase variable based on what moonphase is
        let phase;
        switch (moonphase) {
            case 'New Moon':
                phase = 'new';
                break;
            case 'Waxing Crescent':
                phase = 'waxingcrescent';
                break;
            case 'First Quarter':
                phase = 'firstquarter';
                break;
            case 'Waxing Gibbous':
                phase = 'waxinggibbous';
                break;
            case 'Full Moon':
                phase = 'full';
                break;
            case 'Waning Gibbous':
                phase = 'waninggibbous';
                break;
            case 'Last Quarter':
                phase = 'thirdquarter';
                break;
            case 'Waning Crescent':
                phase = 'waningcrescent';
                break;
        }

        // set image source path for #moon-icon
        document.getElementById("moon-icon").src = "img/icon_moon_" + phase + ".svg";
    }

    // function getDetails() {
    //     // Set innerHTML for the various details
    //     document.getElementById('city').innerHTML = city;
    //     document.getElementById('date').innerHTML = date;

    //     // set "digitaltime", innerHTML to time in the format hh:mm:ss
    //     document.getElementById('digitaltime').innerHTML = time;


    //     // set "sunrise" and "sunset" innerHTML to sunrise and sunset
    //     document.getElementById('sunrise').innerHTML = sunrise;
    //     document.getElementById('sunset').innerHTML = sunset;

    //     // set "moonphase" innerHTML to moonphase
    //     document.getElementById('moonphase').innerHTML = moonphase;

    //     // set phase variable based on what moonphase is
    //     let phase;
    //     switch (moonphase) {
    //         case 'New Moon':
    //             phase = 'new';
    //             break;
    //         case 'Waxing Crescent':
    //             phase = 'waxingcrescent';
    //             break;
    //         case 'First Quarter':
    //             phase = 'firstquarter';
    //             break;
    //         case 'Waxing Gibbous':
    //             phase = 'waxinggibbous';
    //             break;
    //         case 'Full Moon':
    //             phase = 'full';
    //             break;
    //         case 'Waning Gibbous':
    //             phase = 'waninggibbous';
    //             break;
    //         case 'Last Quarter':
    //             phase = 'thirdquarter';
    //             break;
    //         case 'Waning Crescent':
    //             phase = 'waningcrescent';
    //             break;
    //     }

    //     // set image source path for #moon-icon
    //     document.getElementById("pic1").src = "img/icon_moon_" + phase + ".svg"


    //     // city, long/lat, date, time, sunrise, sunset and moon phase
    // }
});

