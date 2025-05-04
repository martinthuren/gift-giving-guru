// FULL CODE SNIPPET: options.js

const apiKeyInput = document.getElementById('api-key');
const saveButton = document.getElementById('save-button');
const statusDiv = document.getElementById('status');
const websiteLink = document.getElementById('website-link'); // To set dynamically later if needed

// Function to display status messages
function showStatus(message, isSuccess = true) {
    statusDiv.textContent = message;
    statusDiv.className = isSuccess ? 'success' : 'error';
    statusDiv.style.display = 'block';

    // Optional: Hide message after a few seconds
    setTimeout(() => {
        // Only hide if the message hasn't changed in the meantime
        if (statusDiv.textContent === message) {
            statusDiv.style.display = 'none';
            statusDiv.textContent = '';
            statusDiv.className = '';
        }
    }, 3000); // Hide after 3 seconds
}

// Function to save the API Key
function saveOptions() {
    const apiKey = apiKeyInput.value.trim(); // Get trimmed value from input

    if (!apiKey) {
        showStatus("API Key cannot be empty.", false);
        return;
    }

    // Use chrome.storage.local (persists across browser sessions)
    chrome.storage.local.set({
        apiKey: apiKey // Save the key
    }, () => {
        // Check for errors during save
        if (chrome.runtime.lastError) {
            console.error('Error saving API key:', chrome.runtime.lastError);
            showStatus(`Error saving key: ${chrome.runtime.lastError.message}`, false);
        } else {
            console.log('API Key saved successfully.');
            showStatus("API Key Saved!", true);
            // Optional: Mask the input again after saving if needed
            // apiKeyInput.value = '**********'; // Or just clear it
            // apiKeyInput.value = '';
        }
    });
}

// Function to restore options (load saved key when page opens)
function restoreOptions() {
    chrome.storage.local.get(['apiKey'], (result) => {
        if (chrome.runtime.lastError) {
            console.error('Error retrieving API key:', chrome.runtime.lastError);
            showStatus(`Error loading key: ${chrome.runtime.lastError.message}`, false);
            return;
        }
        if (result.apiKey) {
            // Pre-fill the input (masked as type="password")
            // Users usually don't need to see the full key here again,
            // just know that *something* is saved.
            apiKeyInput.value = result.apiKey; // Or use placeholder like '**********'
            console.log('API Key loaded.');
        } else {
             console.log('No API Key found in storage.');
        }
        // TODO: If your website URL is dynamic, you could potentially fetch it
        // from storage too if saved elsewhere, or hardcode it for now.
        // Example: websiteLink.href = 'http://localhost:3000/settings';
    });
}

// Add event listeners
document.addEventListener('DOMContentLoaded', restoreOptions); // Load saved options when page content is ready
saveButton.addEventListener('click', saveOptions); // Save options when button is clicked