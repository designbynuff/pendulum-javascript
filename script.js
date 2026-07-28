// Import lunarphase-js through the package entrypoint.
import { Moon } from "lunarphase-js";
import moonNewIcon from './img/icon_moon_new.svg';
import moonWaxingCrescentIcon from './img/icon_moon_waxingcrescent.svg';
import moonFirstQuarterIcon from './img/icon_moon_firstquarter.svg';
import moonWaxingGibbousIcon from './img/icon_moon_waxinggibbous.svg';
import moonFullIcon from './img/icon_moon_full.svg';
import moonWaningGibbousIcon from './img/icon_moon_waninggibbous.svg';
import moonThirdQuarterIcon from './img/icon_moon_thirdquarter.svg';
import moonWaningCrescentIcon from './img/icon_moon_waningcrescent.svg';

// Default lat/long for NYC—used as fallback if user doesn't allow location access
const defaultLat = 40.7128;
const defaultLong = -74.0060;

// On load
window.addEventListener('load', function () {
    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('location-consent').classList.remove('hidden');

    const gradientToggle = document.getElementById('gradient-toggle');
    if (gradientToggle) {
        gradientToggle.addEventListener('click', function () {
            setGradientMode(!gradientEnabled);
        });
    }

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
let gradientEnabled = true;

const skyPhases = {
    dawn: ['oklch(39.82% 0.1068 255.38 / 1)', 'oklch(57.89% 0.1535 249.79 / 1)'],
    sunrise: ['oklch(90.47% 0.0477 284.11 / 1)', 'oklch(90.85% 0.095 83.77 / 1)'],
    solarNoon: ['oklch(87.32% 0.0955 217.8 / 1)', 'oklch(91.58% 0.0493 224.4 / 1)'],
    sunset: ['oklch(91.24% 0.0453 245.26 / 1)', 'oklch(72.35% 0.1746 13.54 / 1)'],
    dusk: ['oklch(53.73% 0.1904 279.24 / 1)', 'oklch(69.63% 0.1651 293.25 / 1)'],
    solarMidnight: ['oklch(21.85% 0.1382 274.16 / 1)', 'oklch(38.52% 0.1566 259.93 / 1)']
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

function setGradientMode(enabled, now = new Date()) {
    gradientEnabled = enabled;

    const toggleButton = document.getElementById('gradient-toggle');
    if (toggleButton) {
        toggleButton.textContent = enabled ? 'Plain Mode' : 'Sky Mode';
        toggleButton.setAttribute('aria-pressed', String(enabled));
    }

    if (!enabled) {
        document.documentElement.style.setProperty('--text-color', '#bfd0fc');
        document.body.style.background = 'var(--nuff-dark)';
        document.body.style.color = '#bfd0fc';
        document.body.style.transition = 'background 0.8s ease, color 0.8s ease';
        document.querySelectorAll('a').forEach((link) => {
            link.style.color = '#bfd0fc';
            link.style.borderBottomColor = '#bfd0fc';
        });
        return;
    }

    updateSkyGradient(now);
}

function parseOklch(value) {
    const match = value.match(/oklch\(\s*([0-9.]+)(%)?\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+))?\s*\)/i);
    if (!match) return null;

    let lightness = Number(match[1]);
    if (match[2]) {
        lightness = lightness / 100;
    }

    return {
        l: lightness,
        c: Number(match[3]),
        h: Number(match[4]),
        a: Number(match[5] ?? 1)
    };
}

function interpolateNumber(start, end, amount) {
    return start + (end - start) * amount;
}

function interpolateOklch(colorA, colorB, amount) {
    const start = parseOklch(colorA);
    const end = parseOklch(colorB);

    if (!start || !end) return colorA;

    const lightness = interpolateNumber(start.l, end.l, amount);
    const chroma = interpolateNumber(start.c, end.c, amount);
    const hue = start.h + ((end.h - start.h + 540) % 360 - 180) * amount;
    const alpha = interpolateNumber(start.a, end.a, amount);

    return `oklch(${lightness.toFixed(3)} ${chroma.toFixed(3)} ${hue.toFixed(2)} / ${alpha.toFixed(2)})`;
}

function updateSkyGradient(now = new Date()) {
    if (!gradientEnabled) return;
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
            const topColor = interpolateOklch(current.colors[0], next.colors[0], amount);
            const bottomColor = interpolateOklch(current.colors[1], next.colors[1], amount);
            const gradient = `linear-gradient(135deg, ${topColor}, ${bottomColor})`;

            // Calculate average lightness for text contrast
            const bottomLightness = parseOklch(bottomColor)?.l ?? 0;
            const topLightness = parseOklch(topColor)?.l ?? 0;
            const averageLightness = (bottomLightness + topLightness) / 2;

            // Set text colour based on average lightness
            const textColor = averageLightness > 0.6 ? '#1b1c21' : '#bfd0fc';

            document.documentElement.style.setProperty('--bg-gradient', gradient);
            document.documentElement.style.setProperty('--text-color', textColor);
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

        if (gradientEnabled) {
            updateSkyGradient(new Date());
        }
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
        'New': moonNewIcon,
        'Waxing Crescent': moonWaxingCrescentIcon,
        'First Quarter': moonFirstQuarterIcon,
        'Waxing Gibbous': moonWaxingGibbousIcon,
        'Full': moonFullIcon,
        'Waning Gibbous': moonWaningGibbousIcon,
        'Last Quarter': moonThirdQuarterIcon,
        'Waning Crescent': moonWaningCrescentIcon,
    };

    const moonIcon = document.getElementById('moon-icon');
    const phaseIcon = phaseMap[phaseName];
    if (phaseIcon) {
        moonIcon.src = phaseIcon;
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

