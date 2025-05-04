// FULL CODE SNIPPET: background.js (Basic Reminder Example)
const API_BASE_URL = 'http://localhost:5000/api'; // Your backend API URL
const REMINDER_ALARM_NAME = 'giftGuruReminderCheck';

async function fetchUpcomingEvents(apiKey) {
    if (!apiKey) return null; // Need API key

    try {
        // Create a dedicated API endpoint for upcoming events
        const response = await fetch(`${API_BASE_URL}/events/upcoming?limit=5`, { // Example: /api/events/upcoming
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`Upcoming events fetch failed: ${response.status}`);
            return null;
        }
        const data = await response.json();
        return data.data.events; // Adjust based on your actual API response structure
    } catch (error) {
        console.error('Error fetching upcoming events:', error);
        return null;
    }
}

async function showNotifications() {
    console.log("Checking for upcoming events...");
     const { apiKey } = await chrome.storage.local.get(['apiKey']);
     if (!apiKey) {
         console.log("API Key not set, skipping reminders.");
         return;
     }

    const upcomingEvents = await fetchUpcomingEvents(apiKey);

    if (upcomingEvents && upcomingEvents.length > 0) {
        upcomingEvents.forEach(event => {
             // Customize notification based on your event data structure
             const notificationId = `gift-reminder-${event.personId}-${event.date}`; // Unique ID
            const eventDate = new Date(event.date).toLocaleDateString();
            chrome.notifications.create(notificationId, {
                type: 'basic',
                iconUrl: 'icons/icon128.png', // Use your icon
                title: `Upcoming Event: ${event.type || 'Birthday/Anniversary'}!`, // e.g., Birthday
                message: `${event.personName}'s ${event.type || 'event'} is on ${eventDate}. Any gift ideas?`,
                priority: 1 // Range from -2 to 2
                // buttons: [ { title: 'View Ideas' } ] // Optional buttons
            });
        });
    } else {
         console.log("No upcoming events found or error fetching.");
    }
}

// --- Alarm Listener ---
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === REMINDER_ALARM_NAME) {
        await showNotifications();
    }
});

// --- Extension Startup / Install ---
chrome.runtime.onStartup.addListener(() => {
    console.log("Extension startup: Setting up alarm.");
     // Check/create alarm on browser startup
    chrome.alarms.get(REMINDER_ALARM_NAME, (alarm) => {
        if (!alarm) {
            // Create alarm to check roughly daily (1440 minutes)
            // Use shorter period for testing (e.g., 1 minute)
            chrome.alarms.create(REMINDER_ALARM_NAME, { periodInMinutes: 1440 });
             console.log("Reminder alarm created.");
        }
    });
    // Optional: Run check immediately on startup too
    // showNotifications();
});

 chrome.runtime.onInstalled.addListener(() => {
     console.log("Extension installed/updated: Setting up alarm.");
     // Check/create alarm on install/update
    chrome.alarms.create(REMINDER_ALARM_NAME, { periodInMinutes: 1440 });
      console.log("Reminder alarm created.");
     // Optional: Run check immediately on install too
     // showNotifications();
 });

// --- Optional: Handle notification button clicks ---
// chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
//     if (notificationId.startsWith('gift-reminder-') && buttonIndex === 0) {
//         // Extract personId or relevant info from notificationId
//         // Open the website page for that person's gift ideas
//         // chrome.tabs.create({ url: 'YOUR_WEBSITE_URL/people/PERSON_ID' });
//     }
// });

console.log("Gift Guru background service worker started.");