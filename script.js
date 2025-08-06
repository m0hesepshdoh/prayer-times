// Firebase configuration
const firebaseConfig = {
    apiKey: 'AIzaSyA0wcgv_6dH14g37F6fdqXv1A97amw23_w',
    authDomain: 'birthdaymessagesapp.firebaseapp.com',
    projectId: 'birthdaymessagesapp',
    storageBucket: 'birthdaymessagesapp.firebasestorage.app',
    messagingSenderId: '220266164498',
    appId: '1:220266164498:web:2adcb2520b75f580cd83cb'
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM elements
const nextPrayerName = document.getElementById('next-prayer-name');
const nextPrayerTime = document.getElementById('next-prayer-time');
const lastUpdated = document.getElementById('last-updated');

// Prayer time elements
const prayerTimeElements = {
    fajr: document.getElementById('fajr-time'),
    sunrise: document.getElementById('sunrise-time'),
    dhuhr: document.getElementById('dhuhr-time'),
    asr: document.getElementById('asr-time'),
    maghrib: document.getElementById('maghrib-time'),
    isha: document.getElementById('isha-time')
};

// Prayer row elements
const prayerRows = {
    fajr: document.getElementById('fajr-row'),
    sunrise: document.getElementById('sunrise-row'),
    dhuhr: document.getElementById('dhuhr-row'),
    asr: document.getElementById('asr-row'),
    maghrib: document.getElementById('maghrib-row'),
    isha: document.getElementById('isha-row')
};

// Dhuhr label element
const dhuhrLabel = document.getElementById('dhuhr-label');

// Load prayer times when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadPrayerTimes();
    updateCurrentDate();
});

// Load from Firebase
function loadPrayerTimes() {
    db.collection("prayerTimes").doc("currentTimes").get()
        .then(doc => {
            if (doc.exists) {
                const data = doc.data();
                displayPrayerTimes(data);
            } else {
                console.log("No prayer times available.");
            }
        })
        .catch(error => {
            console.error("Error loading prayer times:", error);
        });
}

// Display prayer times in table
function displayPrayerTimes(times) {
    const now = new Date();
    let closestName = null;
    let closestTime = Infinity;

    // Check if today is Friday
    const isFriday = now.getDay() === 5;

    // Update Dhuhr label for Friday
    if (isFriday) {
        dhuhrLabel.textContent = "Jumu'ah";
        dhuhrLabel.classList.add('jumuah');
    } else {
        dhuhrLabel.textContent = "Dhuhr";
        dhuhrLabel.classList.remove('jumuah');
    }

    // Update prayer times
    Object.entries(times).forEach(([name, timeStr]) => {
        if (prayerTimeElements[name]) {
            prayerTimeElements[name].textContent = timeStr;

            // Calculate time difference
            const [hour, minute] = timeStr.split(":").map(Number);
            const time = new Date(now);
            time.setHours(hour, minute, 0, 0);
            const diff = time - now;

            // Remove active class from all rows
            prayerRows[name].classList.remove('active');

            // Find next prayer
            if (diff > 0 && diff < closestTime) {
                closestTime = diff;
                closestName = name;
            }
        }
    });

    // Highlight next prayer
    if (closestName && prayerRows[closestName]) {
        prayerRows[closestName].classList.add('active');

        const nextTime = new Date(now.getTime() + closestTime);
        const prayerName = closestName === 'dhuhr' && isFriday ? "Jumu'ah" : capitalize(closestName);
        nextPrayerName.textContent = prayerName;
        nextPrayerTime.textContent = nextTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
        nextPrayerName.textContent = "None";
        nextPrayerTime.textContent = "--:--";
    }

    // Update last updated timestamp
    const today = new Date();
    lastUpdated.textContent = `Last updated: ${today.toLocaleDateString()} ${today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

// Capitalize name
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Set current date
function updateCurrentDate() {
    const dateEl = document.getElementById("current-date");
    const hijriEl = document.getElementById("hijri-date");

    const now = new Date();
    dateEl.textContent = now.toDateString();

    // Dummy Hijri date (replace with actual API if needed)
    hijriEl.textContent = "Hijri date: 1 Muharram 1447H";
}