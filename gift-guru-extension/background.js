// FULL CODE SNIPPET: background.js (Reminders/Notifications)

// --- Configuration ---
const API_BASE_URL = 'http://localhost:5000/api'; // Your backend API URL
const ALARM_NAME = 'giftGuruCheckAlarm';
// Check once a day. REMEMBER TO CHANGE THIS FROM 1 FOR PRODUCTION!
const CHECK_INTERVAL_MINUTES = 1; // Set to 1 for testing, use 1440 for daily in production

// --- Helper: Fetch API Key ---
async function getApiKey() {
    try {
        const result = await chrome.storage.local.get(['apiKey']);
        return result.apiKey || null;
    } catch (error) {
        console.error("GiftGuru BG: Error getting API key:", error);
        return null;
    }
}

// --- Helper: Fetch Upcoming Events ---
async function fetchUpcomingEvents(apiKey) {
    if (!apiKey) {
        console.log("GiftGuru BG: No API Key, skipping event fetch.");
        return null;
    }
    console.log("GiftGuru BG: Fetching upcoming events...");
    try {
        // Ensure this endpoint matches your backend route
        const response = await fetch(`${API_BASE_URL}/events/upcoming`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
             if (response.status === 401) console.error("GiftGuru BG: Authentication failed fetching events (Invalid API Key?).");
             else console.error(`GiftGuru BG: HTTP error fetching events: ${response.status}`);
            return null; // Return null on error
        }
        const data = await response.json();
        // Check the structure matches what your API actually returns
        if (data.status === 'success' && data.data && Array.isArray(data.data.events)) {
             console.log(`GiftGuru BG: Found ${data.data.events.length} upcoming events.`);
             return data.data.events;
        } else {
             console.error("GiftGuru BG: Unexpected API response format for events:", data);
             return null; // Return null if format is wrong
        }
    } catch (error) {
        console.error('GiftGuru BG: Network or other error fetching upcoming events:', error);
        return null; // Return null on error
    }
}

// --- Helper: Show Notifications ---
async function showNotifications() {
    const apiKey = await getApiKey();
    if (!apiKey) return; // Don't proceed without key

    const upcomingEvents = await fetchUpcomingEvents(apiKey);

    // Ensure upcomingEvents is an array before trying to iterate
    if (upcomingEvents && Array.isArray(upcomingEvents) && upcomingEvents.length > 0) {
        upcomingEvents.forEach(event => {
            // Validate expected event properties
            if (!event || !event.name || typeof event.daysRemaining === 'undefined' || !event.date || !event.personId) {
                 console.warn("GiftGuru BG: Skipping event due to missing properties:", event);
                 return; // Skip this event if data is incomplete
            }

            const days = event.daysRemaining;
            let message = '';
            // Construct the message based on days remaining
            if (days === 0) message = `It's ${event.name}'s Birthday Today! 🎉`;
            else if (days === 1) message = `${event.name}'s Birthday is Tomorrow!`;
            else message = `${event.name}'s Birthday is in ${days} days (${new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}).`;

            message += " Don't forget a gift!"; // Append call to action

            // Create a unique ID for the notification to prevent duplicates or allow updates/clearing
            const notificationId = `gift-guru-reminder-${event.personId}-${event.date}`;

            // Create the notification using Chrome API
// Inside showNotifications loop in background.js
chrome.notifications.create(notificationId, {
    type: 'basic', // Keep type basic
    iconUrl: 'icons/icon128.png', // Make SURE this icon file exists and is valid
    title: 'Gift Guru Test', // Use a simple title
    message: `Test notification for ${event.name}`, // Use a simple message
    priority: 0 // Use default priority
    // Remove buttons for now if you had them
});
             console.log(`GiftGuru BG: Showing notification for ${event.name}`);
        });
    } else {
        console.log("GiftGuru BG: No upcoming events to notify about or fetch failed.");
    }
}

// --- Alarm Listener ---
// Listens for the alarm set previously
chrome.alarms.onAlarm.addListener(async (alarm) => {
    console.log("GiftGuru BG: Alarm triggered -", alarm.name);
    // Check if it's the correct alarm
    if (alarm.name === ALARM_NAME) {
        console.log("GiftGuru BG: Running scheduled check via alarm...");
        await showNotifications(); // Call the function to check and notify
    }
});

// --- Extension Lifecycle Events ---

// On Install or Update: Set up the alarm. This ensures the alarm is set initially
// and also resets it if the extension is updated.
chrome.runtime.onInstalled.addListener((details) => {
    console.log(`GiftGuru BG: onInstalled event triggered (reason: ${details.reason}). Setting up alarm.`);
    // Create the alarm to run periodically
    chrome.alarms.create(ALARM_NAME, {
        // delayInMinutes: 1, // Optional: Delay the very first run after install/update
        periodInMinutes: CHECK_INTERVAL_MINUTES // Use the configured interval
    });
    // Optional: Run check immediately on install/update for immediate feedback/testing
    // setTimeout(showNotifications, 2000); // Run after a short delay
});

// On Browser Startup: Ensure the alarm exists. Sometimes alarms can be cleared.
chrome.runtime.onStartup.addListener(() => {
     console.log("GiftGuru BG: onStartup event triggered. Checking alarm status.");
     // Get the alarm to see if it exists
     chrome.alarms.get(ALARM_NAME, (alarm) => {
        if (!alarm) {
             console.log("GiftGuru BG: Alarm not found on startup, creating it.");
             // If alarm doesn't exist, create it again
             chrome.alarms.create(ALARM_NAME, { periodInMinutes: CHECK_INTERVAL_MINUTES });
        } else {
             console.log("GiftGuru BG: Alarm already exists.");
        }
     });
     // Optional: Run check shortly after startup, e.g., after 1 minute
     // setTimeout(showNotifications, 60 * 1000);
});


// --- Optional: Notification Click/Button Listener ---
// Uncomment and modify if you add buttons to your notifications
/*
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    console.log(`GiftGuru BG: Notification button clicked: ${notificationId}, Index: ${buttonIndex}`);
    // Example: Open person detail page if first button ('View Person') is clicked
    if (notificationId.startsWith('gift-guru-reminder-') && buttonIndex === 0) {
        const parts = notificationId.split('-'); // Simple split assuming format is consistent
        const personId = parts[parts.length - 2]; // Get ID from ID structure
        if (personId) {
             // Construct the URL to your web application's person detail page
             // IMPORTANT: Replace localhost:3000 with your DEPLOYED frontend URL eventually
             const personUrl = `http://localhost:3000/people/${personId}`;
             chrome.tabs.create({ url: personUrl }); // Open URL in a new tab
        } else {
             console.error("GiftGuru BG: Could not extract personId from notificationId:", notificationId);
        }
    }
    // Automatically clear the notification after a button is clicked
    chrome.notifications.clear(notificationId);
});

// Optional: Handle clicks on the main body of the notification (not a button)
chrome.notifications.onClicked.addListener((notificationId) => {
     console.log(`GiftGuru BG: Notification clicked: ${notificationId}`);
     // Example: Open the dashboard page
     // const dashboardUrl = `http://localhost:3000/dashboard`; // Replace with deployed URL
     // chrome.tabs.create({ url: dashboardUrl });
     // Automatically clear the notification when clicked
     chrome.notifications.clear(notificationId);
});
*/

// Log confirmation that the service worker has started
console.log("GiftGuru Background Service Worker initialized.");