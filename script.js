// On load
window.addEventListener('load', function () {

    // Declare some global variables
    let lat;
    let long;
    let city;
    let sunrise;
    let sunset;
    let moonphase;

    // Get the user's location

    const successCallback = (position) => {
        console.log(position);
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

    // turn hour in to 12 hour format
    if (hour > 12) {
        hour = hour % 12;
        console.log(hour);
    }


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

    // Translate the current time into words
    const timeInWords = timeToWords(hour, minute);

    console.log(timeInWords);


    // add the time in words to the div with the id "time"
    document.getElementById('time').innerHTML = 'It is ' + timeInWords + '.';

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

});

function getDetails() {
    // Set lat and long from geolocation
    lat = position.coords.latitude;
    long = position.coords.longitude;

    // Set innerHTML for the various details
    document.getElementById('city').innerHTML = city;
    document.getElementById('latlong').innerHTML = lat + ', ' + long;
    document.getElementById('date').innerHTML = date;

    // set "digitaltime", innerHTML to time in the format hh:mm:ss
    document.getElementById('digitaltime').innerHTML = time;


    // set "sunrise" and "sunset" innerHTML to sunrise and sunset
    document.getElementById('sunrise').innerHTML = sunrise;
    document.getElementById('sunset').innerHTML = sunset;

    // set "moonphase" innerHTML to moonphase
    document.getElementById('moonphase').innerHTML = moonphase;

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
    document.getElementById("pic1").src = "img/icon_moon_" + phase + ".svg"


    // city, long/lat, date, time, sunrise, sunset and moon phase
}