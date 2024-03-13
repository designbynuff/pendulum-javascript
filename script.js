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

    if (minute === 0) {
        timeWords = numberToWords(hour) + ' o\'clock';
    } else if (minute === 15) {
        timeWords = 'quarter past ' + numberToWords(hour);
    } else if (minute === 30) {
        timeWords = 'half past ' + numberToWords(hour);
    } else if (minute === 45) {
        timeWords = 'quarter to ' + numberToWords(hour + 1);
    } else if (minute < 30) {
        timeWords = numberToWords(minute) + ' past ' + numberToWords(hour);
    } else {
        timeWords = numberToWords(60 - minute) + ' to ' + numberToWords(hour + 1);
    }

    return timeWords;
}

// Translate the current time into words
const timeInWords = timeToWords(hour, minute);

// Output the time in words
console.log('It is ' + timeInWords);

// add the time in words to the div with the id "time"
document.getElementById('time').innerHTML = 'It is ' + timeInWords + '.';

