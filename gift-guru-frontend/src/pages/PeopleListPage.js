// FULL CODE SNIPPET: src/pages/PeopleListPage.js (Using MUI)

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // Ensure axios is configured in App.js
import { Link as RouterLink, useNavigate } from 'react-router-dom'; // Use RouterLink for react-router navigation

// Import MUI Components
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link'; // MUI Link component for consistent styling

// Import MUI Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function PeopleListPage() {
    const [people, setPeople] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate(); // For programmatic navigation if needed (e.g., on auth error)

    // Function to fetch people - using useCallback for potential optimization
    const fetchPeople = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            // Auth header should be set globally in App.js's axios config
            const response = await axios.get('/people');
            if (response.data.status === 'success') {
                setPeople(response.data.data.people);
            } else {
                // Handle cases where API returns success=false but status 200
                setError('Failed to fetch people list.');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'An error occurred while fetching people.';
            if (err.response?.status === 401) {
                // Handle unauthorized access (e.g., token expired)
                setError('Authentication failed. Please log in again.');
                // Redirect to login after a short delay?
                // setTimeout(() => navigate('/login'), 1500);
            } else {
                setError(message); // Display other errors
            }
            console.error('Fetch people error:', err.response?.data || err.message);
        } finally {
            setIsLoading(false);
        }
    }, [navigate]); // Add navigate to dependency array if used inside fetchPeople

    // Fetch people when the component mounts
    useEffect(() => {
        fetchPeople();
    }, [fetchPeople]); // Depend on the memoized fetchPeople function


    // --- Delete Handler ---
    const handleDelete = async (personId, personName) => {
        // Confirmation dialog
        if (!window.confirm(`Are you sure you want to delete ${personName}? This cannot be undone.`)) {
            return;
        }

        setError(''); // Clear previous errors before attempting delete
        // Optional: Indicate loading state for deletion if needed
        // setIsLoadingDelete(true);

        try {
            await axios.delete(`/people/${personId}`);
            // Refresh the list after successful deletion by filtering the state
            setPeople(prevPeople => prevPeople.filter(p => p._id !== personId));
            // Alternative: Refetch the whole list (ensures absolute consistency but slower UI)
            // fetchPeople();
        } catch (err) {
            const message = err.response?.data?.message || 'An error occurred while deleting the person.';
            if (err.response?.status === 401) {
                 setError('Authentication failed. Please log in again.');
                 // setTimeout(() => navigate('/login'), 1500);
            } else {
                setError(message); // Show delete error to user
            }
            console.error('Delete person error:', err.response?.data || err.message);
        } finally {
            // setIsLoadingDelete(false);
        }
    };


    // --- Render Logic ---

    return (
        // Use MUI Container for max-width and centered content with padding
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}> {/* mt/mb = margin top/bottom */}

            {/* Header Row with Title and Add Button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}> {/* mb = margin bottom */}
                <Typography variant="h4" component="h1">
                    Your People
                </Typography>
                <Button
                    variant="contained" // Use contained style for primary action
                    color="primary" // Use theme's primary color
                    startIcon={<AddIcon />} // Add '+' icon before text
                    component={RouterLink} // Use RouterLink for client-side navigation
                    to="/people/add" // Link to the Add Person page
                >
                    Add Person
                </Button>
            </Box>

            {/* Display Error Alert if there's an error */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Display Loading Indicator */}
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            ) :
            // Display Message if No People Found
            people.length === 0 ? (
                <Typography variant="body1" sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
                    You haven't added anyone yet. Click the button above to add someone!
                </Typography>
            ) : (
            // Display the List of People
                <List sx={{
                    bgcolor: 'background.paper', // Use theme's paper background color
                    borderRadius: 2, // Slightly more rounded corners
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)' // Subtle shadow
                }}>
                    {people.map((person, index) => (
                        // Use React.Fragment to avoid unnecessary divs and allow adding Divider
                        <React.Fragment key={person._id}>
                            <ListItem
                                // secondaryAction places content (like buttons) on the right side
                                secondaryAction={
                                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}> {/* Hide actions on extra-small screens? Optional */}
                                        <IconButton
                                            edge="end" // Align button to the end edge
                                            aria-label="edit"
                                            title={`Edit ${person.name}`}
                                            component={RouterLink} // Navigate on click
                                            to={`/people/${person._id}/edit`} // Link to edit page
                                            sx={{ mr: 0.5 }} // Adjust margin if needed
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            edge="end"
                                            aria-label="delete"
                                            title={`Delete ${person.name}`}
                                            onClick={() => handleDelete(person._id, person.name)}
                                            sx={{ color: 'error.main' }} // Use theme's error color for delete icon
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                }
                            >
                                {/* Main list item content */}
                                <ListItemText
                                    primary={
                                        // Use MUI Link wrapping RouterLink for consistent style and navigation
                                         <Link component={RouterLink} to={`/people/${person._id}`} sx={{ fontWeight: 'medium', color: 'text.primary', '&:hover': { color: 'primary.main'} }}>
                                             {person.name}
                                         </Link>
                                    }
                                    secondary={
                                        <>
                                            {/* Display relationship and birthday if they exist */}
                                            {person.relationship ? `${person.relationship}` : ''}
                                            {person.birthday ? `${person.relationship ? ' - ' : ''}Birthday: ${new Date(person.birthday).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}
                                        </>
                                    }
                                    // Add sx prop for custom styling if needed
                                    // sx={{ pr: { xs: 0, sm: '80px'} }} // Add padding right on small screens if actions overlap?
                                />
                            </ListItem>
                            {/* Add a Divider between list items, but not after the last one */}
                            {index < people.length - 1 && <Divider component="li" variant="middle" />}
                        </React.Fragment>
                    ))}
                </List>
            )}
        </Container>
    );
}

export default PeopleListPage;