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

// Add these variables to track Khutbah information
let currentKhutbahData = null;
let lastKhutbahData = null;

// DOM elements
const timeElement = document.querySelector('.time');
const dayDisplayElement = document.querySelector('.day-display');
const gregorianDateElement = document.querySelector('.gregorian');
const hijriDateElement = document.querySelector('.hijri');

// Prayer time elements
const prayerTimeElements = {
    fajr: {
        begins: document.getElementById('fajr-begins'),
        jamaat: document.getElementById('fajr-jamaat')
    },
    dhuhr: {
        begins: document.getElementById('dhuhr-begins'),
        jamaat: document.getElementById('dhuhr-jamaat')
    },
    asr: {
        begins: document.getElementById('asr-begins'),
        jamaat: document.getElementById('asr-jamaat')
    },
    maghrib: {
        begins: document.getElementById('maghrib-begins'),
        jamaat: document.getElementById('maghrib-jamaat')
    },
    isha: {
        begins: document.getElementById('isha-begins'),
        jamaat: document.getElementById('isha-jamaat')
    }
};

// Khutbah elements
const khutbahCard = document.getElementById('khutbah-card');
const khutbahTitle = document.getElementById('khutbah-title');
const khutbahSummary = document.getElementById('khutbah-summary');
const khutbahSpeaker = document.getElementById('khutbah-speaker');

// QR code elements
const qrcodeCard = document.getElementById('qrcode-card');
const qrcodeImage = document.getElementById('qrcode-image');
const qrcodeDescription = document.getElementById('qrcode-description');

// News elements
const newsItems = document.querySelectorAll('.news-item');

// Additional prayers container
const additionalPrayersSection = document.getElementById('additional-prayers-section');

// Update clock function
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // The hour '0' should be '12'
    hours = hours.toString().padStart(2, '0');

    timeElement.textContent = `${hours}:${minutes}:${seconds} ${ampm}`;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    dayDisplayElement.textContent = days[now.getDay()];

    // Update date
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    gregorianDateElement.textContent = now.toLocaleDateString('en-US', options);
}

// convert 24-hour time to 12-hour
function convertTo12HourFormat(time24) {
    if (!time24 || time24 === '-') return '-';

    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';

    h = h % 12;
    h = h ? h : 12; // The hour '0' should be '12'

    return `${h.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

// Update Hijri date based on stored data
function updateHijriDate(hijriData) {
    if (hijriData && hijriData.day && hijriData.month && hijriData.year) {
        hijriDateElement.textContent = `${hijriData.day} ${hijriData.month} ${hijriData.year}`;
    }
}

// Fetch data from Firestore
function fetchData() {
    db.collection("mosqueSettings").doc("currentSettings").get()
        .then(doc => {
            if (doc.exists) {
                const data = doc.data();

                // Update prayer times
                if (data.prayerTimes) {
                    for (const key in prayerTimeElements) {
                        if (data.prayerTimes[key]) {
                            if (prayerTimeElements[key].begins) {
                                // Convert to 12-hour format
                                prayerTimeElements[key].begins.textContent = convertTo12HourFormat(data.prayerTimes[key].begins);
                            }

                            // For prayers with Jamaat time
                            if (prayerTimeElements[key].jamaat && data.prayerTimes[key].jamaat) {
                                // Convert to 12-hour format
                                prayerTimeElements[key].jamaat.textContent = convertTo12HourFormat(data.prayerTimes[key].jamaat);
                            }
                        }
                    }
                }

                // Update hijri date
                if (data.hijriDate) {
                    updateHijriDate(data.hijriDate);
                }

                // Store Khutbah data for comparison
                if (data.khutbah) {
                    // Check if this is a new Khutbah entry
                    if (currentKhutbahData &&
                        (currentKhutbahData.title !== data.khutbah.title ||
                            currentKhutbahData.speaker !== data.khutbah.speaker)) {
                        lastKhutbahData = { ...currentKhutbahData };
                    }

                    currentKhutbahData = { ...data.khutbah };

                    // Update Khutbah display based on day and time
                    updateKhutbahDisplay(data.khutbah);
                }

                // Update khutbah info
                if (data.khutbah) {
                    if (data.khutbah.enabled) {
                        khutbahCard.classList.remove('hidden');
                        if (data.khutbah.title) khutbahTitle.textContent = data.khutbah.title;
                        if (data.khutbah.summary) khutbahSummary.textContent = data.khutbah.summary;
                        if (data.khutbah.speaker) khutbahSpeaker.textContent = data.khutbah.speaker;
                    } else {
                        khutbahCard.classList.add('hidden');
                    }
                }

                // Update news items
                if (data.news && data.news.enabled) {
                    document.querySelector('.news-card').classList.remove('hidden');

                    // Clear existing news items
                    const newsContent = document.querySelector('.news-content');
                    newsContent.innerHTML = '';

                    // Add news items from data
                    for (let i = 1; i <= 4; i++) {
                        if (data.news[`item${i}`]) {
                            const newsItem = document.createElement('div');
                            newsItem.className = 'news-item';
                            newsItem.textContent = data.news[`item${i}`];
                            newsContent.appendChild(newsItem);
                        }
                    }
                } else {
                    document.querySelector('.news-card').classList.add('hidden');
                }

                // Update additional prayers
                if (data.additionalPrayers && data.additionalPrayers.enabled && data.additionalPrayers.items) {
                    additionalPrayersSection.innerHTML = '';

                    data.additionalPrayers.items.forEach((prayer, index) => {
                        if (prayer.name && prayer.time) {
                            const prayerRow = document.createElement('div');
                            prayerRow.className = 'additional-prayer-row';

                            // Convert time to 12-hour format
                            const time12Hour = convertTo12HourFormat(prayer.time);

                            prayerRow.innerHTML = `
                                <div class="additional-prayer-name">
                                    <i class="fas fa-moon"></i>
                                    <span>${prayer.name}</span>
                                </div>
                                <div class="additional-prayer-time">${time12Hour}</div>
                            `;
                            additionalPrayersSection.appendChild(prayerRow);
                        }
                    });

                    // Show the section if we have items
                    if (additionalPrayersSection.children.length > 0) {
                        additionalPrayersSection.style.display = 'grid';
                    } else {
                        additionalPrayersSection.style.display = 'none';
                    }
                } else {
                    additionalPrayersSection.style.display = 'none';
                }

                // Update QR code info
                if (data.qrcode) {
                    if (data.qrcode.enabled) {
                        qrcodeCard.classList.remove('hidden');
                        if (data.qrcode.url) {
                            qrcodeImage.src = `https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=${encodeURIComponent(data.qrcode.url)}&choe=UTF-8`;
                        }
                        if (data.qrcode.description) qrcodeDescription.textContent = data.qrcode.description;
                    } else {
                        qrcodeCard.classList.add('hidden');
                    }
                }
            }
        })
        .catch(error => {
            console.error("Error fetching data:", error);
        });
}

// Function to determine and update Khutbah display
function updateKhutbahDisplay(khutbahData) {
    if (!khutbahData.enabled) {
        khutbahCard.classList.add('hidden');
        return;
    }

    const now = new Date();
    const today = now.getDay(); // 0 = Sunday, 5 = Friday
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Time in minutes

    // Get Dhuhr prayer time for comparison
    let dhuhrTime = null;
    if (prayerTimeElements.dhuhr.begins.textContent) {
        const [dhuhrHours, dhuhrMinutes] = prayerTimeElements.dhuhr.begins.textContent.split(':');
        dhuhrTime = parseInt(dhuhrHours) * 60 + parseInt(dhuhrMinutes);
    }

    // Get Jamaat time for comparison
    let jamaatTime = null;
    if (prayerTimeElements.dhuhr.jamaat.textContent &&
        prayerTimeElements.dhuhr.jamaat.textContent !== '-') {
        const [jamaatHours, jamaatMinutes] = prayerTimeElements.dhuhr.jamaat.textContent.split(':');
        jamaatTime = parseInt(jamaatHours) * 60 + parseInt(jamaatMinutes);
    }

    // Determine which Khutbah title to display
    let khutbahTitleText = "Next Jumu'ah Khutbah";

    if (today === 5) { // Friday
        if (dhuhrTime && jamaatTime) {
            if (currentTime >= dhuhrTime && currentTime < jamaatTime) {
                khutbahTitleText = "Now's Jumu'ah Khutbah";
            } else {
                khutbahTitleText = "Today's Jumu'ah Khutbah";
            }
        } else {
            khutbahTitleText = "Today's Jumu'ah Khutbah";
        }
    } else if (lastKhutbahData &&
        (khutbahData.title === lastKhutbahData.title &&
            khutbahData.speaker === lastKhutbahData.speaker)) {
        khutbahTitleText = "Last Jumu'ah Khutbah";
    }

    // Update the Khutbah title element
    const khutbahTitleElement = document.querySelector('.Khutbah-card h2');
    if (khutbahTitleElement) {
        khutbahTitleElement.innerHTML = `<i class="fas fa-microphone"></i>${khutbahTitleText}`;
    }

    // Update Khutbah content
    if (khutbahData.title) khutbahTitle.textContent = khutbahData.title;
    if (khutbahData.summary) khutbahSummary.textContent = khutbahData.summary;
    if (khutbahData.speaker) khutbahSpeaker.textContent = khutbahData.speaker;

    khutbahCard.classList.remove('hidden');
}

// Update the initialization to track Khutbah data
document.addEventListener('DOMContentLoaded', () => {
    // Start the clock
    updateClock();
    setInterval(updateClock, 1000);

    // Initialize Khutbah data
    currentKhutbahData = null;
    lastKhutbahData = null;

    // Fetch data from Firestore
    fetchData();

    // Set up real-time listener for data changes
    db.collection("mosqueSettings").doc("currentSettings")
        .onSnapshot(doc => {
            if (doc.exists) {
                fetchData();
            }
        });

    // Also update Khutbah display every minute to handle time-based changes
    setInterval(() => {
        if (currentKhutbahData) {
            updateKhutbahDisplay(currentKhutbahData);
        }
    }, 60000); // Update every minute
});