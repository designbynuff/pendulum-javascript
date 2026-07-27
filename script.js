// Import lunarphase-js
// import { Hemisphere, Moon } from "lunarphase-js";
import { Moon } from "./node_modules/lunarphase-js/dist/index.es.js";

// Default lat/long for NYC—used as fallback if user doesn't allow location access
const defaultLat = 40.7128;
const defaultLong = -74.0060;

// On load
window.addEventListener('load', function () {
    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('location-consent').classList.remove('hidden');

    // event listeners for consent buttons
    document.getElementById('use-location').addEventListener('click', function () {
        // get the user's location
        navigator.geolocation.getCurrentPosition(
            successCallback,
            errorCallback,
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
    document.getElementById('use-default').addEventListener('click', function () {
        startApp(defaultLat, defaultLong);  // Call startApp() with default coordinates
    });

});
// Declare some global variables
// let lat;
// let long;
let city;
let date;
let numHour;
let numMinute;
let numSecond;
// Sun position times
let sunriseTime, sunsetTime, dawnTime, duskTime, solarNoonTime, solarMidnightTime, nextSunriseTime;

// let moonphase;
let position;

const skyPhases = {
    dawn: ['hsla(213, 67%, 30%, 1)', 'hsla(207, 79%, 46%, 1)'],
    sunrise: ['hsla(255, 100%, 93%, 1)', 'hsla(202, 100%, 86%, 1)'],
    solarNoon: ['hsla(193, 100%, 77%, 1)', 'hsla(197, 90%, 87%, 1)'],
    sunset: ['hsla(208, 100%, 90%, 1)', 'hsla(351, 100%, 72%, 1)'],
    dusk: ['hsla(242, 62%, 60%, 1)', 'hsla(255, 90%, 75%, 1)'],
    solarMidnight: ['hsla(251, 99%, 17%, 1)', 'hsla(216, 100%, 29%, 1)']
};

// If user allows location access, use their location
const successCallback = (pos) => {
    console.log('Geolocation success:', pos);
    const lat = pos.coords.latitude;
    const long = pos.coords.longitude;
    console.log('Using coordinates:', lat, long);
    startApp(lat, long);
};

// If user denies location or error occurs, use default
const errorCallback = (error) => {
    console.log('Geolocation error:', error);
    if (error.code === 2) {
        console.log('Location unavailable - using default location (NYC)');
        // You could show a message to the user here
    }
    console.log('Using default coordinates:', defaultLat, defaultLong);
    startApp(defaultLat, defaultLong);
};

function formatCoordinate(value) {
    return Number(value).toFixed(3);
}

function displayCoordinates(lat, long) {
    document.getElementById('latlong').textContent = formatCoordinate(lat) + ', ' + formatCoordinate(long);
}

function parseHsla(value) {
    const match = value.match(/hsla\(\s*([0-9.]+)\s*,\s*([0-9.]+)%\s*,\s*([0-9.]+)%\s*,\s*([0-9.]+)\s*\)/i);
    if (!match) return null;

    return {
        h: Number(match[1]),
        s: Number(match[2]),
        l: Number(match[3]),
        a: Number(match[4])
    };
}

function interpolateNumber(start, end, amount) {
    return start + (end - start) * amount;
}

function interpolateHsla(colorA, colorB, amount) {
    const start = parseHsla(colorA);
    const end = parseHsla(colorB);

    if (!start || !end) return colorA;

    const hue = start.h + ((end.h - start.h + 540) % 360 - 180) * amount;
    const saturation = interpolateNumber(start.s, end.s, amount);
    const lightness = interpolateNumber(start.l, end.l, amount);
    const alpha = interpolateNumber(start.a, end.a, amount);

    return `hsla(${hue.toFixed(2)}, ${saturation.toFixed(2)}%, ${lightness.toFixed(2)}%, ${alpha.toFixed(2)})`;
}

function updateSkyGradient(now = new Date()) {
    if (!dawnTime || !sunriseTime || !solarNoonTime || !sunsetTime || !duskTime) return;

    const midnightStart = new Date(now);
    midnightStart.setHours(0, 0, 0, 0);

    const nextMidnight = new Date(midnightStart);
    nextMidnight.setDate(nextMidnight.getDate() + 1);

    const phasePoints = [
        { date: midnightStart, colors: skyPhases.solarMidnight },
        { date: dawnTime, colors: skyPhases.dawn },
        { date: sunriseTime, colors: skyPhases.sunrise },
        { date: solarNoonTime, colors: skyPhases.solarNoon },
        { date: sunsetTime, colors: skyPhases.sunset },
        { date: duskTime, colors: skyPhases.dusk },
        { date: nextMidnight, colors: skyPhases.solarMidnight }
    ];

    if (solarMidnightTime) {
        const insertIndex = phasePoints.findIndex((point) => point.date > solarMidnightTime);
        if (insertIndex === -1) {
            phasePoints.splice(phasePoints.length - 1, 0, { date: solarMidnightTime, colors: skyPhases.solarMidnight });
        } else {
            phasePoints.splice(insertIndex, 0, { date: solarMidnightTime, colors: skyPhases.solarMidnight });
        }
    }

    for (let index = 0; index < phasePoints.length - 1; index += 1) {
        const current = phasePoints[index];
        const next = phasePoints[index + 1];

        if (now >= current.date && now <= next.date) {
            const duration = next.date - current.date;
            const elapsed = now - current.date;
            const amount = duration > 0 ? Math.min(1, Math.max(0, elapsed / duration)) : 0;
            const topColor = interpolateHsla(current.colors[0], next.colors[0], amount);
            const bottomColor = interpolateHsla(current.colors[1], next.colors[1], amount);
            const gradient = `linear-gradient(135deg, ${topColor}, ${bottomColor})`;

            // Calculate average lightness for text contrast
            const bottomLightness = parseHsla(bottomColor)?.l ?? 0;
            const topLightness = parseHsla(topColor)?.l ?? 0;
            const averageLightness = (bottomLightness + topLightness) / 2;

            // Set text color based on average lightness
            const textColor = averageLightness > 60 ? '#1b1c21' : '#bfd0fc';
            const iconFilter = textColor === '#1b1c21'
                ? 'brightness(0) saturate(100%)'
                : 'brightness(0) saturate(100%) invert(1)';

            document.documentElement.style.setProperty('--bg-gradient', gradient);
            document.documentElement.style.setProperty('--text-color', textColor);
            document.documentElement.style.setProperty('--icon-filter', iconFilter);
            document.body.style.background = gradient;
            document.body.style.transition = 'background 0.8s ease, color 0.8s ease';
            document.body.style.color = textColor;
            document.querySelectorAll('a').forEach((link) => {
                link.style.color = textColor;
                link.style.borderBottomColor = textColor;
            });
            break;
        }
    }
}

// Start the app
function startApp(lat, long) {
    // Hide consent UI and show main content
    document.getElementById('location-consent').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');

    displayCoordinates(lat, long);

    // Now run your main logic with the chosen coordinates
    setDateAndTime();
    getSunriseSunset(lat, long);
    getMoonPhase(lat, long);
    getCity(lat, long);
    startClock();
}

function startClock() {
    let now = new Date();
    let hour = now.getHours();
    let minute = now.getMinutes();

    if (hour > 12) {
        hour = hour % 12;
    }
    if (hour === 0) {
        hour = 12;
    }

    document.getElementById('time').innerHTML = 'It is ' + timeToWords(hour, minute) + '.';

    setInterval(function () {
        let currentTime = new Date();
        let hour = currentTime.getHours();
        let minute = currentTime.getMinutes();
        let second = currentTime.getSeconds();

        if (second < 10) {
            second = '0' + second;
        }

        let displayHour = hour;
        if (hour > 12) {
            displayHour = hour % 12;
        }
        if (displayHour === 0) {
            displayHour = 12;
        }

        document.getElementById('digitaltime').innerHTML = displayHour + ':' +
            (minute < 10 ? '0' + minute : minute) + ':' + second;

        if (hour > 12) {
            hour = hour % 12;
        }
        if (hour === 0) {
            hour = 12;
        }
        const timeInWords = timeToWords(hour, minute);
        document.getElementById('time').innerHTML = 'It is ' + timeInWords + '.';
    }, 1000);
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

function latLong(latValue = position?.coords?.latitude, longValue = position?.coords?.longitude) {
    // Set lat and long from geolocation
    console.log("setting latitude and longitude");
    console.log(latValue, longValue);

    displayCoordinates(latValue, longValue);
}

// Get city name from lat and long
function getCity(lat, long) {
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
    const currentTime = new Date();
    numHour = currentTime.getHours();
    numMinute = currentTime.getMinutes();
    numSecond = currentTime.getSeconds();
    if (numSecond < 10) {
        numSecond = '0' + numSecond;
    }

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
    document.getElementById('digitaltime').innerHTML = numHour + ':' + numMinute + ':' + numSecond + ' ' + timeZone;

}

// Get sunrise and sunset times
function parseSunTime(timeStr, date = new Date()) {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes, seconds] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    const result = new Date(date);
    result.setHours(hours, minutes, seconds || 0, 0);
    return result;
}

function calculateSolarMidnight(sunsetMoment, nextSunriseMoment) {
    return new Date((sunsetMoment.getTime() + nextSunriseMoment.getTime()) / 2);
}

function formatTimeLabel(timeValue) {
    return timeValue.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

function getSunriseSunset(lat, long) {
    console.log("getting sunrise and sunset times");
    fetch(`https://api.sunrisesunset.io/json?lat=${lat}&lng=${long}`)
        .then(response => response.json())
        .then(data => {
            if (data.status !== 'OK') return;

            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            sunriseTime = parseSunTime(data.results.sunrise, today);
            sunsetTime = parseSunTime(data.results.sunset, today);
            dawnTime = parseSunTime(data.results.dawn, today);
            duskTime = parseSunTime(data.results.dusk, today);
            solarNoonTime = parseSunTime(data.results.solar_noon, today);

            document.getElementById('sunrise').innerHTML = formatTimeLabel(sunriseTime);
            document.getElementById('sunset').innerHTML = formatTimeLabel(sunsetTime);

            fetch(`https://api.sunrisesunset.io/json?lat=${lat}&lng=${long}&date=tomorrow`)
                .then(response => response.json())
                .then(tomorrowData => {
                    if (tomorrowData.status !== 'OK') return;

                    nextSunriseTime = parseSunTime(tomorrowData.results.sunrise, tomorrow);
                    solarMidnightTime = calculateSolarMidnight(sunsetTime, nextSunriseTime);

                    updateSkyGradient();
                    console.log(sunriseTime, sunsetTime, dawnTime, duskTime, solarNoonTime, solarMidnightTime, nextSunriseTime);
                });
        })
        .catch(err => console.error('Sunrise/sunset fetch failed:', err));
}

// Get moon phase with lunarphase-js (phase is date-based; lat used for icon flip only)
function getMoonPhase(lat) {
    const phaseName = Moon.lunarPhase();
    const displayName = phaseName === 'New' || phaseName === 'Full'
        ? phaseName + ' Moon'
        : phaseName;

    document.getElementById('moon-phase').innerHTML = displayName;

    const phaseMap = {
        'New': 'new',
        'Waxing Crescent': 'waxingcrescent',
        'First Quarter': 'firstquarter',
        'Waxing Gibbous': 'waxinggibbous',
        'Full': 'full',
        'Waning Gibbous': 'waninggibbous',
        'Last Quarter': 'thirdquarter',
        'Waning Crescent': 'waningcrescent',
    };

    const moonIcon = document.getElementById('moon-icon');
    const phase = phaseMap[phaseName];
    if (phase) {
        moonIcon.src = 'img/icon_moon_' + phase + '.svg';
    }

    // Southern hemisphere: mirror icon horizontally (lit side appears on opposite side)
    moonIcon.classList.toggle('flipped', lat < 0);
}

// NOT WORKING, NEED API OR NEW CALCULATION CODE Calculate moon phase based on daten
// function calculateMoonPhase() {
//     let year = currentTime.getFullYear();
//     let month = currentTime.getMonth() + 1;
//     let day = currentTime.getDate();
//     let c, e, jd;
//     if (month < 3) {
//         year--;
//         month += 12;
//     }
//     month += 1;
//     c = 365.25 * year;
//     e = 30.6 * month;
//     jd = c + e + day - 694039.09;
//     jd /= 29.5305882;
//     jd = parseInt(jd);
//     jd = jd % 8;
//     return jd;
// }

// // Turn moon phase number into a string
// function getMoonPhaseName(phase) {
//     let moonPhase;
//     switch (phase) {
//         case 0:
//             moonPhase = 'New Moon';
//             break;
//         case 1:
//             moonPhase = 'Waxing Crescent';
//             break;
//         case 2:
//             moonPhase = 'First Quarter';
//             break;
//         case 3:
//             moonPhase = 'Waxing Gibbous';
//             break;
//         case 4:
//             moonPhase = 'Full Moon';
//             break;
//         case 5:
//             moonPhase = 'Waning Gibbous';
//             break;
//         case 6:
//             moonPhase = 'Last Quarter';
//             break;
//         case 7:
//             moonPhase = 'Waning Crescent';
//             break;
//     }
//     return moonPhase;
// }

// // Get moon phase
// function getMoonPhase() {
//     console.log("getting moon phase");
//     // fetch('https://moon-phase.p.rapidapi.com/basic?lat=' + lat + '&lon=' + long,)
//     //     .then(response => response.json())
//     //     .then(data => {
//     //         console.log(data);
//     //         moonphase = data.phase_name;
//     //     });
//     moonphase = (getMoonPhaseName(calculateMoonPhase()));
//     console.log(moonphase);

//     document.getElementById('moon-phase').innerHTML = moonphase;

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
//     document.getElementById("moon-icon").src = "img/icon_moon_" + phase + ".svg";
// }

