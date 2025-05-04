// FULL CODE SNIPPET: popup.js
const API_BASE_URL = 'http://localhost:5000/api'; // Your backend API URL

// --- DOM Elements ---
const loadingStateDiv = document.getElementById('loading-state');
const errorStateDiv = document.getElementById('error-state');
const successStateDiv = document.getElementById('success-state');
const loginPromptDiv = document.getElementById('login-prompt');
const saveGiftForm = document.getElementById('save-gift-form');
const ideaTitleInput = document.getElementById('idea-title');
const ideaUrlInput = document.getElementById('idea-url');
const personSelect = document.getElementById('person-select');
const loadingPeopleDiv = document.getElementById('loading-people');
const notesInput = document.getElementById('notes');
const saveButton = document.getElementById('save-button');
const openOptionsLink = document.getElementById('open-options');


// --- Helper Functions ---
function showElement(el) { el.style.display = 'block'; }
function hideElement(el) { el.style.display = 'none'; }

function displayError(message) {
    errorStateDiv.textContent = message;
    showElement(errorStateDiv);
    hideElement(successStateDiv); // Hide success if error occurs
}
 function displaySuccess(message) {
     successStateDiv.textContent = message;
     showElement(successStateDiv);
     hideElement(errorStateDiv); // Hide error if success occurs
     setTimeout(() => hideElement(successStateDiv), 3000); // Hide after 3 seconds
 }


// --- Main Logic ---

// 1. Get API Key from storage
async function getApiKey() {
    const result = await chrome.storage.local.get(['apiKey']);
    return result.apiKey;
}

// 2. Get Current Tab Info
async function getCurrentTabInfo() {
    try {
         // Needs "activeTab" permission in manifest
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url && (tab.url.startsWith('http:') || tab.url.startsWith('https:'))) {
             return { title: tab.title || 'No Title', url: tab.url };
        } else {
            return null; // Not a web page we can likely save
        }
    } catch (error) {
        console.error("Error getting tab info:", error);
        displayError("Could not get current tab information.");
        return null;
    }
}

// 3. Fetch People from API
async function fetchPeople(apiKey) {
    hideElement(errorStateDiv);
    showElement(loadingPeopleDiv);
    personSelect.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/people`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
             if (response.status === 401) {
                throw new Error('Authentication failed. Is your API Key correct?');
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'success' && data.data.people) {
            populatePeopleDropdown(data.data.people);
        } else {
             throw new Error('Failed to parse people data from API.');
        }

    } catch (error) {
        console.error('Error fetching people:', error);
        displayError(`Error fetching people: ${error.message}`);
         hideElement(saveGiftForm); // Hide form if people can't load
    } finally {
         hideElement(loadingPeopleDiv);
         personSelect.disabled = false;
    }
}

// 4. Populate People Dropdown
function populatePeopleDropdown(people) {
     // Clear existing options except the placeholder
    personSelect.length = 1; // Keep only the "-- Select Person --" option

    if (people && people.length > 0) {
         people.forEach(person => {
             const option = document.createElement('option');
             option.value = person._id; // Use MongoDB ObjectId as value
             option.textContent = person.name;
             personSelect.appendChild(option);
         });
         showElement(saveGiftForm); // Show the form now that people are loaded
     } else {
        displayError("No people found. Please add people on the website first.");
        hideElement(saveGiftForm);
     }
}

// 5. Handle Form Submission
async function handleFormSubmit(event, apiKey, tabInfo) {
    event.preventDefault(); // Prevent default form submission
    hideElement(errorStateDiv);
    hideElement(successStateDiv);
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    const selectedPersonId = personSelect.value;
    const notes = notesInput.value.trim();

    if (!selectedPersonId) {
        displayError("Please select a person.");
        saveButton.disabled = false;
         saveButton.textContent = 'Save Idea';
        return;
    }

    const giftData = {
        person: selectedPersonId, // Backend expects 'person' field with the ID
        idea: tabInfo.title,
        url: tabInfo.url,
        notes: notes,
         // You could add imageUrl or price if you extract them via content script
    };

    try {
        const response = await fetch(`${API_BASE_URL}/gift-ideas`, { // Use the main gift ideas endpoint
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(giftData)
        });

         const responseData = await response.json(); // Try parsing JSON regardless of status for error messages

        if (!response.ok) {
             const errorMessage = responseData.message || `HTTP error! Status: ${response.status}`;
            throw new Error(errorMessage);
        }

        if (responseData.status === 'success') {
            displaySuccess("Gift idea saved successfully!");
             // Optionally clear the form or close the popup
             notesInput.value = ''; // Clear notes
             personSelect.value = ''; // Reset dropdown
             // window.close(); // Close popup after success
        } else {
             throw new Error(responseData.message || 'Failed to save gift idea.');
        }

    } catch (error) {
        console.error('Error saving gift idea:', error);
        displayError(`Error saving: ${error.message}`);
    } finally {
        saveButton.disabled = false;
         saveButton.textContent = 'Save Idea';
    }
}

 // 6. Open Options Page
 if (openOptionsLink) {
     openOptionsLink.addEventListener('click', (e) => {
         e.preventDefault();
         if (chrome.runtime.openOptionsPage) {
             chrome.runtime.openOptionsPage();
         } else {
             // Fallback for older versions or if options page isn't defined correctly
             window.open(chrome.runtime.getURL('options.html'));
         }
     });
 }

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    hideElement(saveGiftForm);
    hideElement(errorStateDiv);
    hideElement(loginPromptDiv);
     showElement(loadingStateDiv); // Show initial loading message

    const apiKey = await getApiKey();

    if (!apiKey) {
         hideElement(loadingStateDiv);
         showElement(loginPromptDiv); // Prompt user to enter API key
         return; // Stop execution if no API key
    }

    const tabInfo = await getCurrentTabInfo();

    if (tabInfo) {
        ideaTitleInput.value = tabInfo.title;
        ideaUrlInput.value = tabInfo.url;
         hideElement(loadingStateDiv); // Hide loading message
        await fetchPeople(apiKey); // Fetch people only if tab info is valid and API key exists

         // Add submit listener only after setup is complete
         saveGiftForm.addEventListener('submit', (e) => handleFormSubmit(e, apiKey, tabInfo));

    } else {
         hideElement(loadingStateDiv);
         displayError("Cannot save this page. Ensure it's a valid http/https URL.");
    }
});