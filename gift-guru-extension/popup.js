// FULL CODE SNIPPET: popup.js (Injects content.js and listens)

// --- Configuration ---
const API_BASE_URL = 'http://localhost:5000/api'; // Your backend API URL

// --- DOM Elements ---
const messageArea = document.getElementById('message-area');
const saveGiftForm = document.getElementById('save-gift-form');
const setupPromptDiv = document.getElementById('setup-prompt');
// Input fields will be dynamically created/referenced below
const personSelect = document.getElementById('person-select');
const notesTextarea = document.getElementById('notes');
const saveButton = document.getElementById('save-button');
const openOptionsButtonInPrompt = document.getElementById('open-options-button');
const popupOptionsButton = document.getElementById('popup-options-button');
const websiteLinkPopup = document.getElementById('website-link-popup');

// Dynamically create or ensure input elements exist (more robust than assuming they are in HTML)
let ideaTextInput = document.getElementById('idea-text');
if (!ideaTextInput) {
    ideaTextInput = document.createElement('input');
    ideaTextInput.type = 'text';
    ideaTextInput.id = 'idea-text';
    ideaTextInput.required = true;
    ideaTextInput.placeholder = "Gift Idea Description (auto-filled)";
    // Add label dynamically too or assume one exists in HTML with 'for="idea-text"'
    const label = document.createElement('label');
    label.htmlFor = 'idea-text';
    label.textContent = 'Idea Description:*';
    label.style.display = 'block';
    label.style.marginBottom = '4px';
    label.style.fontWeight = 'bold';
    label.style.fontSize = '13px';

    const containerDiv = document.createElement('div');
    containerDiv.className = 'form-group'; // Use existing CSS class if available
    containerDiv.style.marginBottom = '12px';
    containerDiv.appendChild(label);
    containerDiv.appendChild(ideaTextInput);
    // Insert it before the person select dropdown's container
    if (personSelect.parentElement) {
         saveGiftForm.insertBefore(containerDiv, personSelect.parentElement);
    } else {
        saveGiftForm.insertBefore(containerDiv, notesTextarea); // Fallback insertion
    }
}

let urlTextInput = document.getElementById('idea-url');
if (!urlTextInput) {
    urlTextInput = document.createElement('input');
    urlTextInput.type = 'url';
    urlTextInput.id = 'idea-url';
    urlTextInput.readOnly = true;
    urlTextInput.placeholder = "URL (auto-filled)";
    // Add label dynamically too
     const label = document.createElement('label');
    label.htmlFor = 'idea-url';
    label.textContent = 'URL:';
     label.style.display = 'block';
    label.style.marginBottom = '4px';
    label.style.fontWeight = 'bold';
    label.style.fontSize = '13px';

    const containerDiv = document.createElement('div');
    containerDiv.className = 'form-group';
    containerDiv.style.marginBottom = '12px';
    containerDiv.appendChild(label);
    containerDiv.appendChild(urlTextInput);
    // Insert it after the idea text input container
    if(ideaTextInput.parentElement){
        ideaTextInput.parentElement.after(containerDiv);
    } else {
        saveGiftForm.insertBefore(containerDiv, personSelect.parentElement || notesTextarea); // Fallback
    }
}

// Style the dynamically added inputs (basic)
ideaTextInput.style.width = '100%'; ideaTextInput.style.padding = '8px'; ideaTextInput.style.boxSizing = 'border-box'; ideaTextInput.style.border = '1px solid #ccc';
urlTextInput.style.width = '100%'; urlTextInput.style.padding = '8px'; urlTextInput.style.boxSizing = 'border-box'; urlTextInput.style.backgroundColor = '#eee'; urlTextInput.style.border = '1px solid #ccc'; urlTextInput.style.cursor = 'not-allowed';


// --- Global Variables ---
let pageDataForSave = null; // Holds { title, url, imageUrl } extracted from content script
let apiKey = null;

// --- Helper Functions ---
function showMessage(message, type = 'loading') {
    messageArea.textContent = message;
    messageArea.className = `message ${type}`;
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
        const result = await chrome.storage.local.get(['apiKey']);
        if (result.apiKey) {
            apiKey = result.apiKey;
            return true;
        } else {
            apiKey = null;
            return false;
        }
    } catch (error) {
        console.error("GiftGuru: Error loading API key:", error);
        showMessage("Error loading configuration.", "error");
        return false;
    }
}

// 2. Inject Content Script
async function injectContentScript() {
    try {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id && tab.url && (tab.url.startsWith('http:') || tab.url.startsWith('https:'))) {
            console.log(`GiftGuru: Injecting content script into tab ${tab.id}`);
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
            console.log("GiftGuru: Injected content script successfully.");
            // Data will be sent back via the message listener below
            return true;
        } else {
            showMessage("Cannot run on this page (requires http/https).", "error");
            return false;
        }
    } catch (error) {
        console.error("GiftGuru: Error injecting script:", error);
        if (error.message.includes('Cannot access') || error.message.includes('extension context')) {
            showMessage("Cannot access content of this specific page (e.g., Chrome Web Store, internal pages).", "error");
        } else {
            showMessage("Error analyzing page content.", "error");
        }
        return false;
    }
}

// 3. Fetch People List from API
async function fetchPeople() {
    if (!apiKey) {
        showMessage("API Key missing. Configure in options (⚙️).", "error");
        saveGiftForm.style.display = 'none';
        setupPromptDiv.style.display = 'block';
        return false;
    }
    personSelect.disabled = true;
    personSelect.options[0].textContent = '-- Loading People --';
    personSelect.options[0].selected = true;
    personSelect.options[0].disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/people`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (!response.ok) {
            if (response.status === 401) throw new Error(`Authentication failed (${response.status}). Invalid API Key?`);
            throw new Error(data.message || `HTTP error! Status: ${response.status}`);
        }
        if (data.status === 'success' && data.data.people) {
            populatePeopleDropdown(data.data.people);
            saveGiftForm.style.display = 'block'; // Show form only if people loaded
            hideMessage(); // Clear loading message
            return true;
        } else {
            throw new Error('API response error fetching people.');
        }
    } catch (error) {
        console.error('GiftGuru: Error fetching people:', error);
        showMessage(`Error fetching people: ${error.message}`, "error");
        personSelect.options[0].textContent = '-- Error Loading --';
        saveGiftForm.style.display = 'none'; // Hide form on error
        return false;
    }
}

// 4. Populate Dropdown
function populatePeopleDropdown(people) {
    personSelect.length = 1;
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
        personSelect.disabled = false;
    } else {
        personSelect.options[0].textContent = '-- No people found --';
        personSelect.disabled = true;
        showMessage("No people found. Add people on the website first.", "loading"); // Info style
    }
}

// 5. Handle Form Submission (Save Gift Idea)
async function handleSaveGift(event) {
    event.preventDefault();

    const selectedPersonId = personSelect.value;
    const notes = notesTextarea.value.trim();
    const ideaText = ideaTextInput.value.trim();

    // Validation checks
    if (!selectedPersonId) { showMessage("Please select a person.", "error"); return; }
    if (!ideaText) { showMessage("Idea description cannot be empty.", "error"); return; }
    if (!pageDataForSave || !pageDataForSave.url) { showMessage("Error: Page URL not available.", "error"); return; }
    if (!apiKey) { showMessage("Error: API Key is missing. Configure in options (⚙️).", "error"); return; }

    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    showMessage("Saving gift idea...", "loading");

    const giftData = {
        person: selectedPersonId,
        idea: ideaText, // Use text from the input field
        url: pageDataForSave.url,
        notes: notes,
        imageUrl: pageDataForSave.imageUrl || undefined // Include image URL if found, else undefined
    };

    try {
        const response = await fetch(`${API_BASE_URL}/gift-ideas`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(giftData)
        });
        const responseData = await response.json();

        if (!response.ok) {
            if (response.status === 401) throw new Error(`Auth failed (${response.status}). Invalid API Key?`);
            throw new Error(responseData.message || `HTTP error! Status: ${response.status}`);
        }
        if (responseData.status === 'success') {
            showMessage("Gift idea saved!", "success");
            notesTextarea.value = '';
            personSelect.value = ''; // Reset dropdown selection
            // Don't reset idea/url inputs, keep them for reference until popup closes
            setTimeout(hideMessage, 3000); // Hide success message after 3s
            // setTimeout(() => window.close(), 1500); // Optional: Close popup
        } else {
             throw new Error(responseData.message || 'Failed to save.');
        }
    } catch (error) {
        console.error('GiftGuru: Error saving gift idea:', error);
        showMessage(`Error saving: ${error.message}`, "error");
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = 'Save Idea';
    }
}

// 6. Open Options Page Handler
function openOptionsPage() {
    chrome.runtime.openOptionsPage();
}

// --- Listener for Messages from Content Script ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("GiftGuru Popup received message:", message);
    if (message.type === 'GIFTGURU_PAGE_DATA') {
        pageDataForSave = message.payload; // Store the data globally

        // Update the input fields
        ideaTextInput.value = pageDataForSave.title || '';
        urlTextInput.value = pageDataForSave.url || '';

        // Now that content script has run and sent data (or failed), fetch people
        if (apiKey) { // Ensure API key is loaded before fetching
             fetchPeople(); // This will handle showing the form or errors
        } else {
            // This case should be rare if initial check works, but handle anyway
             showMessage("API Key missing. Configure in options (⚙️).", "error");
             saveGiftForm.style.display = 'none';
             setupPromptDiv.style.display = 'block';
        }
    }
    // Indicate message was received (optional)
    // return true;
});


// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    showMessage("Initializing...", "loading");
    saveGiftForm.style.display = 'none';
    setupPromptDiv.style.display = 'none';

    // Remove static placeholders if they existed in HTML
    const oldTitleP = document.getElementById('page-title');
    const oldUrlP = document.getElementById('page-url');
    if (oldTitleP) oldTitleP.parentElement.remove();
    if (oldUrlP) oldUrlP.parentElement.remove();


    const keyLoaded = await loadApiKey();

    if (!keyLoaded) {
        showMessage("API Key not found. Please configure in options (⚙️).", "error");
        setupPromptDiv.style.display = 'block';
        saveGiftForm.style.display = 'none';
    } else {
        // Key found, inject content script to get page data.
        // The message listener above will handle the next step (fetchPeople).
         showMessage("Analyzing page content...", "loading");
        const injected = await injectContentScript();
        if (!injected) {
             // If injection failed, hide everything, message is already shown
             saveGiftForm.style.display = 'none';
             setupPromptDiv.style.display = 'none';
        }
        // Do NOT call fetchPeople here anymore
    }

    // Set website link dynamically if needed
    // const settingsUrl = 'http://localhost:3000/settings';
    // if (websiteLinkPopup) websiteLinkPopup.href = settingsUrl;
});

// --- Event Listeners ---
saveGiftForm.addEventListener('submit', handleSaveGift);
if (openOptionsButtonInPrompt) openOptionsButtonInPrompt.addEventListener('click', openOptionsPage);
if (popupOptionsButton) popupOptionsButton.addEventListener('click', openOptionsPage);