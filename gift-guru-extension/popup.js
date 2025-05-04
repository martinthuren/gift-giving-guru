// FULL CODE SNIPPET: popup.js (with persistent options gear)

// --- Configuration ---
const API_BASE_URL = 'http://localhost:5000/api'; // Your backend API URL

// --- DOM Elements ---
const messageArea = document.getElementById('message-area');
const saveGiftForm = document.getElementById('save-gift-form');
const setupPromptDiv = document.getElementById('setup-prompt');
const pageTitleP = document.getElementById('page-title');
const pageUrlP = document.getElementById('page-url');
const personSelect = document.getElementById('person-select');
const notesTextarea = document.getElementById('notes');
const saveButton = document.getElementById('save-button');
const openOptionsButtonInPrompt = document.getElementById('open-options-button'); // Button inside prompt
const popupOptionsButton = document.getElementById('popup-options-button'); // Persistent Gear button
const websiteLinkPopup = document.getElementById('website-link-popup'); // Link in prompt

// --- Global Variables ---
let currentTabInfo = null;
let apiKey = null;

// --- Helper Functions ---
function showMessage(message, type = 'loading') {
    messageArea.textContent = message;
    messageArea.className = `message ${type}`; // Apply CSS class
    messageArea.style.display = 'block';
}

function hideMessage() {
    messageArea.style.display = 'none';
    messageArea.textContent = '';
    messageArea.className = 'message';
}

// --- Core Logic ---

// 1. Get API Key from Storage
async function loadApiKey() {
    try {
        // Use chrome.storage.local which persists
        const result = await chrome.storage.local.get(['apiKey']);
        if (result.apiKey) {
            apiKey = result.apiKey;
            return true;
        } else {
            apiKey = null; // Ensure apiKey is null if not found
            return false; // No key found
        }
    } catch (error) {
        console.error("Error loading API key:", error);
        showMessage("Error loading configuration.", "error");
        return false;
    }
}

// 2. Get Current Tab Info
async function loadCurrentTab() {
    try {
        // Needs "activeTab" permission in manifest.json
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        // Ensure it's a web page we can reasonably save
        if (tab && tab.url && (tab.url.startsWith('http:') || tab.url.startsWith('https:'))) {
             currentTabInfo = { title: tab.title || '(No Title)', url: tab.url }; // Use placeholder if no title
             pageTitleP.textContent = currentTabInfo.title;
             pageUrlP.textContent = currentTabInfo.url;
             return true;
        } else {
            showMessage("Cannot save this page type (requires http/https).", "error");
            return false; // Not a page we can likely save
        }
    } catch (error) {
        console.error("Error getting tab info:", error);
        showMessage("Error getting current page information.", "error");
        return false;
    }
}

// 3. Fetch People List from API
async function fetchPeople() {
    if (!apiKey) {
         // This case is mostly handled by the initial check, but good failsafe
         showMessage("API Key not configured. Please set it in options (⚙️).", "error");
         saveGiftForm.style.display = 'none'; // Hide form
         setupPromptDiv.style.display = 'block'; // Show prompt
         return false; // Indicate failure
    }
    // Update dropdown state while loading
    personSelect.disabled = true;
    personSelect.options[0].textContent = '-- Loading People --';
    personSelect.options[0].selected = true;
    personSelect.options[0].disabled = true;


    try {
        const response = await fetch(`${API_BASE_URL}/people`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`, // Use the API Key
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error(`Authentication failed (${response.status}). Is API Key correct?`);
            }
            throw new Error(data.message || `HTTP error! Status: ${response.status}`);
        }

        if (data.status === 'success' && data.data.people) {
            populatePeopleDropdown(data.data.people);
            // If people loaded successfully, hide generic messages and show form
            hideMessage();
            saveGiftForm.style.display = 'block';
            setupPromptDiv.style.display = 'none'; // Ensure prompt is hidden
            return true; // Indicate success
        } else {
             throw new Error('API response error when fetching people.');
        }

    } catch (error) {
        console.error('Error fetching people:', error);
        showMessage(`Error fetching people: ${error.message}`, "error");
        personSelect.options[0].textContent = '-- Error Loading --';
        saveGiftForm.style.display = 'none'; // Hide form on error
        // Don't show setup prompt here, as the key might be valid but API is down etc.
        return false; // Indicate failure
    }
}

// 4. Populate Dropdown
function populatePeopleDropdown(people) {
    personSelect.length = 1; // Clear previous options but keep placeholder
    personSelect.options[0].textContent = '-- Select Person --';
    personSelect.options[0].value = '';
    personSelect.options[0].disabled = true;
    personSelect.options[0].selected = true;

    if (people && people.length > 0) {
         people.forEach(person => {
             const option = document.createElement('option');
             option.value = person._id;
             option.textContent = person.name;
             personSelect.appendChild(option);
         });
          personSelect.disabled = false; // Enable dropdown
     } else {
        personSelect.options[0].textContent = '-- No people found --';
        personSelect.disabled = true;
        // Show info message instead of error if list is just empty
        showMessage("No people found. Add people on the website first.", "loading"); // Use 'loading' style for info
     }
}

// 5. Handle Form Submission (Save Gift Idea)
async function handleSaveGift(event) {
    event.preventDefault();

    const selectedPersonId = personSelect.value;
    const notes = notesTextarea.value.trim();

    if (!selectedPersonId) { showMessage("Please select a person.", "error"); return; }
    if (!currentTabInfo) { showMessage("Error: Page info not loaded.", "error"); return; }
    if (!apiKey) { showMessage("Error: API Key is missing. Configure in options (⚙️).", "error"); return; }

    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    showMessage("Saving gift idea...", "loading");

    const giftData = {
        person: selectedPersonId,
        idea: currentTabInfo.title,
        url: currentTabInfo.url,
        notes: notes,
    };

    try {
        const response = await fetch(`${API_BASE_URL}/gift-ideas`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(giftData)
        });

        const responseData = await response.json();

        if (!response.ok) {
            if (response.status === 401) throw new Error(`Authentication failed (${response.status}). Invalid API Key?`);
            throw new Error(responseData.message || `HTTP error! Status: ${response.status}`);
        }

        if (responseData.status === 'success') {
            showMessage("Gift idea saved successfully!", "success");
            notesTextarea.value = '';
            personSelect.value = '';
            // Hide success message after a delay?
            setTimeout(hideMessage, 2500);
            // setTimeout(() => window.close(), 1500); // Optional: Close popup
        } else {
             throw new Error(responseData.message || 'Failed to save gift idea.');
        }

    } catch (error) {
        console.error('Error saving gift idea:', error);
        showMessage(`Error saving: ${error.message}`, "error");
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = 'Save Idea';
    }
}

// 6. Open Options Page Handler
function openOptionsPage() {
    // This Chrome API call opens the options page defined in manifest.json
    chrome.runtime.openOptionsPage();
}


// --- Initialization ---
// Runs when the popup HTML has loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Show loading message initially
    showMessage("Initializing...", "loading");
    saveGiftForm.style.display = 'none'; // Hide form until ready
    setupPromptDiv.style.display = 'none'; // Hide setup prompt initially

    const keyLoaded = await loadApiKey();

    if (!keyLoaded) {
        // API Key is missing, show setup prompt
        showMessage("API Key not found. Please configure in options (⚙️).", "error");
        setupPromptDiv.style.display = 'block'; // Show prompt
        saveGiftForm.style.display = 'none'; // Ensure form remains hidden
    } else {
        // API Key loaded, proceed to load tab info and people
        const tabLoaded = await loadCurrentTab();
        if (tabLoaded) {
            // Fetch people only if tab info loaded successfully
            // fetchPeople handles showing/hiding form and messages based on its success
            await fetchPeople();
        } else {
             // If tab info failed to load, hide the form and keep error message
             saveGiftForm.style.display = 'none';
             setupPromptDiv.style.display = 'none'; // Don't show setup prompt if tab load failed
        }
    }

    // Set website link dynamically (replace with your actual URL)
    const settingsUrl = 'http://localhost:3000/settings'; // Your website's settings page URL
    if (websiteLinkPopup) {
        websiteLinkPopup.href = settingsUrl;
    }
});

// --- Event Listeners ---
saveGiftForm.addEventListener('submit', handleSaveGift); // For saving the idea
if (openOptionsButtonInPrompt) { // Check existence for safety
    openOptionsButtonInPrompt.addEventListener('click', openOptionsPage); // Button inside prompt text
}
if (popupOptionsButton) { // Check existence for safety
    popupOptionsButton.addEventListener('click', openOptionsPage); // Persistent Gear button
}