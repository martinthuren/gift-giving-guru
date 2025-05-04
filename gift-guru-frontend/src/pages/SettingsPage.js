// FULL CODE SNIPPET: src/pages/SettingsPage.js

import React, { useState } from 'react';
import axios from 'axios'; // Ensure axios is configured
import { useNavigate } from 'react-router-dom';

function SettingsPage() {
    const [apiKey, setApiKey] = useState(''); // To display the generated key
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState(''); // To display success message
    const navigate = useNavigate();

    const handleGenerateKey = async () => {
        setIsLoading(true);
        setError('');
        setMessage('');
        setApiKey(''); // Clear previous key display

        try {
            // Send POST request to the backend endpoint
            // Auth token should be attached automatically by axios interceptor/defaults
            const response = await axios.post('/users/me/api-key');

            if (response.data.status === 'success' && response.data.apiKey) {
                setApiKey(response.data.apiKey);
                setMessage(response.data.message || 'API Key generated successfully! Copy it now.');
            } else {
                setError(response.data.message || 'Failed to generate API Key.');
            }
        } catch (err) {
             const errMsg = err.response?.data?.message || 'An error occurred while generating the API key.';
             if (err.response?.status === 401) {
                 setError('Authentication error. Please log in again.');
                 navigate('/login'); // Redirect if not logged in
             } else {
                 setError(errMsg);
             }
             console.error('Generate API key error:', err.response?.data || err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Simple copy to clipboard function
    const copyToClipboard = () => {
        if (apiKey) {
            navigator.clipboard.writeText(apiKey)
                .then(() => {
                    setMessage('API Key copied to clipboard!');
                    // Optional: Clear message after a few seconds
                    // setTimeout(() => setMessage('API Key generated successfully! Copy it now.'), 3000);
                })
                .catch(err => {
                    console.error('Failed to copy API key: ', err);
                    setError('Failed to copy key automatically. Please copy it manually.');
                });
        }
    };

    return (
        <div>
            <h2>Settings</h2>

            <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
                <h3>Chrome Extension API Key</h3>
                <p>Generate an API key to connect the Gift Giving Guru Chrome Extension to your account.</p>
                <p>This key allows the extension to save gift ideas directly to your profile.</p>

                <button onClick={handleGenerateKey} disabled={isLoading} style={{ padding: '10px 15px' }}>
                    {isLoading ? 'Generating...' : 'Generate/Regenerate API Key'}
                </button>

                {error && <div style={{ color: 'red', marginTop: '15px', border: '1px solid red', padding: '8px' }}>Error: {error}</div>}

                {message && <div style={{ color: 'green', marginTop: '15px', border: '1px solid green', padding: '8px' }}>{message}</div>}

                {apiKey && (
                    <div style={{ marginTop: '15px', background: '#f0f0f0', padding: '10px', borderRadius: '4px', fontFamily: 'monospace', position: 'relative' }}>
                       <p>Your API Key (copy this and paste it into the extension options):</p>
                       <strong style={{ wordBreak: 'break-all' }}>{apiKey}</strong>
                       <button
                           onClick={copyToClipboard}
                           style={{ position: 'absolute', top: '5px', right: '5px', cursor: 'pointer', background: '#eee', border: '1px solid #ccc', padding: '3px 6px' }}
                           title="Copy to Clipboard"
                        >
                            Copy
                        </button>
                    </div>
                )}
                 <p style={{marginTop: '10px', fontSize: '0.9em', color: '#666'}}>
                    Treat this key like a password. If you regenerate the key, the old one will stop working.
                </p>
            </div>

            {/* Add other settings sections here later */}

        </div>
    );
}

export default SettingsPage;