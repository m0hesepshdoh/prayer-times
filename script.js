// Update clock in real-time
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dayStr = now.toLocaleDateString('en-US', { weekday: 'long' });

    document.querySelector('.clock').textContent = timeStr;
    document.querySelector('.day-display').textContent = dayStr;

    // Update date information
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    document.querySelector('.gregorian').textContent = now.toLocaleDateString('en-US', options);
}

// Initial call
updateClock();

// Update every second
setInterval(updateClock, 1000);