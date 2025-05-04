// FULL CODE SNIPPET: src/pages/AddPersonPage.js (Using MUI)

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link as RouterLink } from 'react-router-dom'; // Use RouterLink

// Import MUI Components
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link'; // MUI Link
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // Optional: Back icon

function AddPersonPage() {
    // Form state
    const [name, setName] = useState('');
    const [relationship, setRelationship] = useState('');
    const [birthday, setBirthday] = useState(''); // Store as string 'YYYY-MM-DD'
    const [interests, setInterests] = useState(''); // Comma-separated string

    // Control state
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const interestsArray = interests.split(',')
                                   .map(item => item.trim()) // Trim whitespace
                                   .filter(item => item !== ''); // Remove empty items

        const personData = { name, relationship, interests: interestsArray };
        // Only include birthday if it's been set (and is a valid date string for the input)
        if (birthday) {
            personData.birthday = birthday;
        }

        try {
            const response = await axios.post('/people', personData);
            if (response.data.status === 'success') {
                navigate('/people'); // Redirect to list on success
            } else {
                setError(response.data.message || 'Failed to add person.');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'An error occurred while adding the person.';
             if (err.response?.status === 401) {
                 setError('Authentication error. Please log in again.');
                 navigate('/login');
             } else {
                 setError(message);
             }
            console.error('Add person error:', err.response?.data || err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="sm" sx={{ mt: 4, mb: 4 }}> {/* sm = small/medium width */}
             <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                 {/* Back Button */}
                 <IconButton component={RouterLink} to="/people" sx={{ mr: 1 }} aria-label="Back to People List">
                    <ArrowBackIcon />
                 </IconButton>
                 {/* Page Title */}
                <Typography component="h1" variant="h5">
                    Add New Person
                </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Form using Box */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                    label="Name"
                    variant="outlined" // Standard MUI input style
                    margin="normal" // Consistent spacing
                    required // HTML5 required attribute
                    fullWidth // Take full container width
                    id="name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    autoFocus // Focus this field first
                />
                <TextField
                    label="Relationship"
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    id="relationship"
                    name="relationship"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    disabled={isLoading}
                />
                <TextField
                    label="Birthday"
                    type="date" // Use browser's date picker
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    id="birthday"
                    name="birthday"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    disabled={isLoading}
                    InputLabelProps={{
                      shrink: true, // Ensure label doesn't overlap date input
                    }}
                />
                 <TextField
                    label="Interests/Likes (comma-separated)"
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    id="interests"
                    name="interests"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    disabled={isLoading}
                    placeholder="e.g., hiking, sci-fi books, coffee"
                />

                {/* Action Buttons Container */}
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}> {/* Align buttons right, add gap */}
                    <Button
                        variant="text" // Less emphasis for Cancel
                        component={RouterLink}
                        to="/people" // Link back to the list page
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained" // Primary action style
                        color="primary" // Use theme primary color
                        disabled={isLoading}
                        sx={{ position: 'relative' }} // Needed for spinner positioning
                    >
                       {/* Show spinner inside button when loading */}
                       {isLoading ? <CircularProgress size={24} sx={{color: 'white', position: 'absolute'}} /> : 'Add Person'}
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}

export default AddPersonPage;