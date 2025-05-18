// FULL CODE SNIPPET: popup.js (Enhanced Setup Prompt & Content Script Logic)

// --- Configuration ---
const API_BASE_URL = 'http://localhost:5000/api'; // Your backend API URL
// IMPORTANT: When you deploy, change this to your live backend URL
// const API_BASE_URL = 'https://your-gift-guru-backend.onrender.com/api';

// --- DOM Elements ---
const messageArea = document.getElementById('message-area');
const saveGiftForm = document.getElementById('save-gift-form');
const setupPromptDiv = document.getElementById('setup-prompt');
const popupTitleH3 = document.getElementById('popup-title'); // For changing title

// Form elements within save-gift-form
const personSelect = document.getElementById('person-select');
const notesTextarea = document.getElementById('notes');
const saveButton = document.getElementById('save-button');

// Buttons for options
const openOptionsButtonMain = document.getElementById('open-options-button-main'); // In enhanced prompt
const popupOptionsButton = document.getElementById('popup-options-button'); // Persistent Gear button

// Link in the setup prompt
const websiteLinkPopup = document.getElementById('website-link-popup');

// Dynamically created/referenced input fields for idea text and URL
let ideaTextInput = document.getElementById('idea-text');
let urlTextInput = document.getElementById('idea-url');

// --- Global Variables ---
let pageDataForSave = null; // Holds { title, url, imageUrl } from content script
let apiKey = null;

// --- Helper Functions ---
function showMessage(message, type = 'loading') {
    if (messageArea) {
        messageArea.textContent = message;
        messageArea.className = `message ${type}`;
        messageArea.style.display = 'block';
    } else {
        console.warn("Message area not found in popup.html");
    }
}

function hideMessage() {
    if (messageArea) {
        messageArea.style.display = 'none';
        messageArea.textContent = '';
        messageArea.className = 'message';
    }
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
        console.error("GiftGuru Popup: Error loading API key:", error);
        showMessage("Error loading configuration.", "error");
        return false;
    }
}

// 2. Inject Content Script to get page data
async function injectContentScript() {
    try {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id && tab.url && (tab.url.startsWith('http:') || tab.url.startsWith('https:'))) {
            console.log(`GiftGuru Popup: Injecting content script into tab ${tab.id}`);
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
            console.log("GiftGuru Popup: Injected content script successfully.");
            return true; // Injection initiated, wait for message
        } else {
            showMessage("Cannot run on this page type (requires http/https).", "error");
            return false;
        }
    } catch (error) {
        console.error("GiftGuru Popup: Error injecting script:", error);
        if (error.message.includes('Cannot access') || error.message.includes('extension context')) {
            showMessage("Cannot access content of this specific page (e.g., Chrome Web Store, internal pages).", "error");
        } else {
            showMessage("Error analyzing page content. Try reloading the page.", "error");
        }
        return false;
    }
}

// 3. Fetch People List from API
async function fetchPeople() {
    if (!apiKey) {
        showMessage("API Key missing. Configure in options (⚙️).", "error");
        if(saveGiftForm) saveGiftForm.style.display = 'none';
        if(setupPromptDiv) setupPromptDiv.style.display = 'block';
        return false;
    }
    if (!personSelect) { // Safety check
        console.error("GiftGuru Popup: Person select dropdown not found.");
        showMessage("UI Error: Cannot load people.", "error");
        return false;
    }
    personSelect.disabled = true;
    personSelect.options[0].textContent = '-- Loading People --';
    personSelect.options[0].selected = true; // Ensure it's selected
    personSelect.options[0].disabled = true; // Keep placeholder disabled

    try {
        const response = await fetch(`${API_BASE_URL}/people`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (!response.ok) {
            if (response.status === 401) throw new Error(`Authentication failed (${response.status}). Is your API Key correct?`);
            throw new Error(data.message || `HTTP error! Status: ${response.status}`);
        }
        if (data.status === 'success' && data.data.people) {
            populatePeopleDropdown(data.data.people);
            if(saveGiftForm) saveGiftForm.style.display = 'block'; // Show form
            if(setupPromptDiv) setupPromptDiv.style.display = 'none'; // Hide prompt
            hideMessage(); // Clear "Analyzing page content..." or other messages
            return true;
        } else {
            throw new Error('API response error when fetching people.');
        }
    } catch (error) {
        console.error('GiftGuru Popup: Error fetching people:', error);
        showMessage(`Error fetching people: ${error.message}`, "error");
        personSelect.options[0].textContent = '-- Error Loading People --';
        if(saveGiftForm) saveGiftForm.style.display = 'none';
        return false;
    }
}

// 4. Populate Dropdown
function populatePeopleDropdown(people) {
    if (!personSelect) return;
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
        personSelect.disabled = false;
    } else {
        personSelect.options[0].textContent = '-- No people found --';
        personSelect.disabled = true;
        showMessage("No people found. Add people on the website first.", "loading"); // 'loading' style for info
    }
}

// 5. Handle Form Submission (Save Gift Idea)
async function handleSaveGift(event) {
    event.preventDefault();
    if (!personSelect || !notesTextarea || !ideaTextInput || !urlTextInput || !saveButton) {
        console.error("GiftGuru Popup: Form element missing for save.");
        showMessage("UI Error. Please reload extension.", "error");
        return;
    }

    const selectedPersonId = personSelect.value;
    const notes = notesTextarea.value.trim();
    const ideaText = ideaTextInput.value.trim();

    if (!selectedPersonId) { showMessage("Please select a person.", "error"); return; }
    if (!ideaText) { showMessage("Idea description cannot be empty.", "error"); return; }
    if (!pageDataForSave || !pageDataForSave.url) { showMessage("Error: Page URL not available.", "error"); return; }
    if (!apiKey) { showMessage("Error: API Key is missing. Configure in options (⚙️).", "error"); return; }

    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    showMessage("Saving gift idea...", "loading");

    const giftData = {
        person: selectedPersonId,
        idea: ideaText,
        url: pageDataForSave.url,
        notes: notes,
        imageUrl: pageDataForSave.imageUrl || undefined
    };

    try {
        const response = await fetch(`${API_BASE_URL}/gift-ideas`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
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
            personSelect.value = ''; // Reset dropdown
            // ideaTextInput.value = pageDataForSave?.title || ''; // Optionally reset idea text
            setTimeout(hideMessage, 3000);
            // setTimeout(() => window.close(), 2000); // Optional: Close popup
        } else {
             throw new Error(responseData.message || 'Failed to save gift idea.');
        }
    } catch (error) {
        console.error('GiftGuru Popup: Error saving gift idea:', error);
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

// --- Function to Create and Insert Inputs if they don't exist in HTML ---
function ensureFormInputs() {
    if (!document.getElementById('idea-text')) {
        ideaTextInput = document.createElement('input');
        ideaTextInput.type = 'text';
        ideaTextInput.id = 'idea-text';
        ideaTextInput.required = true;
        ideaTextInput.placeholder = "Gift Idea Description (auto-filled)";
        const labelIdea = document.createElement('label');
        labelIdea.htmlFor = 'idea-text'; labelIdea.textContent = 'Idea Description:*';
        const containerIdea = document.createElement('div'); containerIdea.className = 'form-group';
        containerIdea.appendChild(labelIdea); containerIdea.appendChild(ideaTextInput);
        if (personSelect && personSelect.parentElement) saveGiftForm.insertBefore(containerIdea, personSelect.parentElement);
        else if (notesTextarea) saveGiftForm.insertBefore(containerIdea, notesTextarea);

        ideaTextInput.style.width = '100%'; ideaTextInput.style.padding = '8px'; ideaTextInput.style.boxSizing = 'border-box'; ideaTextInput.style.border = '1px solid #ccc'; ideaTextInput.style.marginBottom = '6px';
        labelIdea.style.display = 'block'; labelIdea.style.marginBottom = '4px'; labelIdea.style.fontWeight = 'bold'; labelIdea.style.fontSize = '13px';
        containerIdea.style.marginBottom = '12px';

    } else {
        ideaTextInput = document.getElementById('idea-text');
    }

    if (!document.getElementById('idea-url')) {
        urlTextInput = document.createElement('input');
        urlTextInput.type = 'url';
        urlTextInput.id = 'idea-url';
        urlTextInput.readOnly = true;
        urlTextInput.placeholder = "URL (auto-filled)";
        const labelUrl = document.createElement('label');
        labelUrl.htmlFor = 'idea-url'; labelUrl.textContent = 'URL:';
        const containerUrl = document.createElement('div'); containerUrl.className = 'form-group';
        containerUrl.appendChild(labelUrl); containerUrl.appendChild(urlTextInput);
        if (ideaTextInput && ideaTextInput.parentElement) ideaTextInput.parentElement.after(containerUrl);
        else if (personSelect && personSelect.parentElement) saveGiftForm.insertBefore(containerUrl, personSelect.parentElement);
        else if (notesTextarea) saveGiftForm.insertBefore(containerUrl, notesTextarea);

        urlTextInput.style.width = '100%'; urlTextInput.style.padding = '8px'; urlTextInput.style.boxSizing = 'border-box'; urlTextInput.style.backgroundColor = '#eee'; urlTextInput.style.border = '1px solid #ccc'; urlTextInput.style.cursor = 'not-allowed';
        labelUrl.style.display = 'block'; labelUrl.style.marginBottom = '4px'; labelUrl.style.fontWeight = 'bold'; labelUrl.style.fontSize = '13px';
        containerUrl.style.marginBottom = '12px';
    } else {
        urlTextInput = document.getElementById('idea-url');
    }
}


// --- Listener for Messages from Content Script ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("GiftGuru Popup: Received message from content script -", message.type);
    if (message.type === 'GIFTGURU_PAGE_DATA') {
        pageDataForSave = message.payload;

        if (ideaTextInput) ideaTextInput.value = pageDataForSave.title || '';
        if (urlTextInput) urlTextInput.value = pageDataForSave.url || '';

        // Message received, now proceed to fetch people if API key is loaded
        if (apiKey) {
             fetchPeople(); // This will show the form or errors related to people fetching
        } else {
             // This scenario means API key was missing, then content script ran (which is unlikely)
             // Or API key loaded after content script message (also unlikely)
             // Default to showing setup prompt if API key still not available
             hideMessage();
             if (popupTitleH3) popupTitleH3.textContent = "Welcome!";
             if (setupPromptDiv) setupPromptDiv.style.display = 'block';
             if (saveGiftForm) saveGiftForm.style.display = 'none';
        }
    }
    // return true; // To indicate async response, not needed here
});


// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    // Ensure form inputs are present/created before trying to use them
    if(saveGiftForm) ensureFormInputs();

    showMessage("Initializing...", "loading");
    if(saveGiftForm) saveGiftForm.style.display = 'none';
    if(setupPromptDiv) setupPromptDiv.style.display = 'none';

    // Update website link in the prompt
    const webSettingsUrl = 'http://localhost:3000/settings'; // Change to deployed URL later
    if (websiteLinkPopup) websiteLinkPopup.href = webSettingsUrl;

    const keyLoaded = await loadApiKey();

    if (!keyLoaded) {
        hideMessage();
        if (popupTitleH3) popupTitleH3.textContent = "Welcome!";
        if (setupPromptDiv) setupPromptDiv.style.display = 'block';
        if (saveGiftForm) saveGiftForm.style.display = 'none';
    } else {
        if (popupTitleH3) popupTitleH3.textContent = "Save Gift Idea";
        if (setupPromptDiv) setupPromptDiv.style.display = 'none';
        showMessage("Analyzing page content...", "loading");
        const injected = await injectContentScript();
        if (!injected) {
            if(saveGiftForm) saveGiftForm.style.display = 'none';
            // Message already shown by injectContentScript
        }
        // Do NOT call fetchPeople() here directly. Wait for message from content script.
    }
});

// --- Event Listeners ---
if (saveGiftForm) saveGiftForm.addEventListener('submit', handleSaveGift);
if (openOptionsButtonMain) openOptionsButtonMain.addEventListener('click', openOptionsPage);
if (popupOptionsButton) popupOptionsButton.addEventListener('click', openOptionsPage);