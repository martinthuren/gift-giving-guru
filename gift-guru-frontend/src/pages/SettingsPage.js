// FULL CODE SNIPPET: src/pages/SettingsPage.js (Using MUI)

import React, { useState } from 'react';
import axios from 'axios'; // Ensure axios is configured
import { useNavigate } from 'react-router-dom';

// Import MUI Components
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField'; // To display the key (read-only)
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper'; // For containing the API key section
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy'; // Copy icon
import VpnKeyIcon from '@mui/icons-material/VpnKey'; // Key generation icon

function SettingsPage() {
    const [apiKey, setApiKey] = useState(''); // To display the generated key
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState(''); // To display success/copy message
    const navigate = useNavigate();

    const handleGenerateKey = async () => {
        setIsLoading(true);
        setError('');
        setMessage('');
        setApiKey(''); // Clear previous key display

        try {
            const response = await axios.post('/users/me/api-key');

            if (response.data.status === 'success' && response.data.apiKey) {
                setApiKey(response.data.apiKey);
                // Use a more concise success message, copy feedback will be separate
                setMessage('New API Key generated below. Copy it now!');
            } else {
                setError(response.data.message || 'Failed to generate API Key.');
            }
        } catch (err) {
             const errMsg = err.response?.data?.message || 'An error occurred while generating the API key.';
             if (err.response?.status === 401) {
                 setError('Authentication error. Please log in again.');
                 navigate('/login');
             } else {
                 setError(errMsg);
             }
             console.error('Generate API key error:', err.response?.data || err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Copy to clipboard function
    const copyToClipboard = () => {
        if (apiKey) {
            navigator.clipboard.writeText(apiKey)
                .then(() => {
                    setMessage('API Key copied to clipboard!'); // Overwrite previous message
                    // Optional: Clear message after a few seconds
                    setTimeout(() => {
                         // Only clear if it's still the 'copied' message
                         if (message === 'API Key copied to clipboard!') {
                            setMessage('');
                         }
                    }, 3000);
                })
                .catch(err => {
                    console.error('Failed to copy API key: ', err);
                    setError('Failed to copy key automatically. Please select and copy manually.');
                });
        }
    };

    return (
        <Container component="main" maxWidth="md" sx={{ mt: 4, mb: 4 }}> {/* Medium width */}
            <Typography component="h1" variant="h4" gutterBottom>
                Settings
            </Typography>

            {/* API Key Section using Paper for elevation/containment */}
            <Paper elevation={2} sx={{ p: 3, mt: 3 }}> {/* Padding and margin top */}
                <Typography component="h2" variant="h6" gutterBottom>
                    Chrome Extension API Key
                </Typography>
                <Typography variant="body1" paragraph> {/* paragraph adds bottom margin */}
                    Generate an API key to connect the Gift Giving Guru Chrome Extension.
                    This allows the extension to save gift ideas directly to your account.
                </Typography>

                {/* Button aligned to the start */}
                 <Box sx={{ mt: 2, mb: 2 }}>
                    <Button
                        variant="contained"
                        onClick={handleGenerateKey}
                        disabled={isLoading}
                        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <VpnKeyIcon />}
                        sx={{ position: 'relative' }} // For spinner positioning if needed
                    >
                        {isLoading ? 'Generating...' : 'Generate / Regenerate API Key'}
                    </Button>
                </Box>

                {/* Display Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Display Success/Info Message Alert */}
                {message && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        {message}
                    </Alert>
                )}

                {/* Display Generated Key if available */}
                {apiKey && (
                    <Box sx={{ mt: 2 }}>
                         <Typography variant="body2" sx={{ mb: 1 }}>
                            Your API Key (copy and paste into the extension's options page):
                         </Typography>
                         {/* Use TextField for easy selection/copy, make it read-only */}
                         <TextField
                            fullWidth
                            variant="outlined"
                            value={apiKey}
                            id="api-key-display"
                            InputProps={{ // Add copy button inside the text field
                                readOnly: true,
                                endAdornment: (
                                    <IconButton
                                        aria-label="copy api key"
                                        onClick={copyToClipboard}
                                        edge="end"
                                        title="Copy to Clipboard"
                                    >
                                        <ContentCopyIcon />
                                    </IconButton>
                                ),
                            }}
                            // Use monospace font for key visibility
                            sx={{'.MuiInputBase-input': { fontFamily: 'monospace', fontSize: '0.9em' } }}
                        />
                    </Box>
                )}

                <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
                     Treat this key like a password. If you regenerate the key, the old one will stop working.
                </Typography>
            </Paper>

            {/* Placeholder for other settings sections */}
            {/* <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
                <Typography component="h2" variant="h6" gutterBottom>
                    Other Settings
                </Typography>
                <Typography variant="body1">
                    (Future settings like profile updates, etc.)
                </Typography>
            </Paper> */}

        </Container>
    );
}

export default SettingsPage;