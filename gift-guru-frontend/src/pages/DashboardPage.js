// FULL CODE SNIPPET: src/pages/DashboardPage.js (Using MUI)

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // Ensure axios is configured
import { Link as RouterLink, useNavigate } from 'react-router-dom';

// Import MUI Components
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper'; // Use Paper for the section
import Link from '@mui/material/Link'; // MUI Link for consistency
import EventIcon from '@mui/icons-material/Event'; // Icon for the section header

function DashboardPage() {
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Fetch upcoming events - using useCallback
    const fetchUpcoming = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await axios.get('/events/upcoming');
            if (response.data.status === 'success') {
                setUpcomingEvents(response.data.data.events);
            } else {
                setError('Failed to fetch upcoming events.');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Error loading upcoming events.';
            if (err.response?.status === 401) {
                 setError('Authentication error.');
                 navigate('/login');
            } else {
                 setError(message);
            }
            console.error('Fetch upcoming events error:', err.response?.data || err.message);
        } finally {
            setIsLoading(false);
        }
    }, [navigate]); // Add navigate as dependency

    useEffect(() => {
        fetchUpcoming();
    }, [fetchUpcoming]); // Depend on memoized function

    // Helper function to format "days remaining" text
    const formatDaysRemaining = (days) => {
        if (days === 0) return 'Today!';
        if (days === 1) return 'Tomorrow';
        return `In ${days} days`;
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Dashboard
            </Typography>

            {/* Upcoming Events Section */}
            <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mt: 3 }}> {/* Padding responsive */}
                 <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EventIcon color="primary" sx={{ mr: 1 }} /> {/* Icon */}
                    <Typography variant="h6" component="h2">
                        Upcoming Birthdays (Next 30 Days)
                    </Typography>
                 </Box>

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : upcomingEvents.length === 0 ? (
                    <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>
                        No birthdays coming up in the next 30 days. Have you added people and their birthdays?
                    </Typography>
                ) : (
                    <List disablePadding> {/* Remove default padding */}
                        {upcomingEvents.map((event, index) => (
                            <React.Fragment key={event.personId}>
                                <ListItem sx={{ py: 1.5 }}> {/* Add vertical padding */}
                                    <ListItemText
                                        primary={
                                            <Link component={RouterLink} to={`/people/${event.personId}`} sx={{ fontWeight: 'medium' }}>
                                                {event.name}
                                                {event.relationship && <Typography component="span" variant="body2" color="text.secondary"> ({event.relationship})</Typography>}
                                            </Link>
                                        }
                                        secondary={
                                             <Typography component="span" variant="body2" sx={{ display: 'block', mt: 0.5 }}> {/* Use block for spacing */}
                                                 <Typography component="span" sx={{ color: 'success.main', fontWeight: 'bold' }}> {/* Use theme success color */}
                                                     {formatDaysRemaining(event.daysRemaining)}
                                                 </Typography>
                                                  {' on '}
                                                 {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </Typography>
                                        }
                                    />
                                </ListItem>
                                {index < upcomingEvents.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Paper>

            {/* --- Placeholder for other potential Dashboard Widgets --- */}
            {/*
            <Paper elevation={1} sx={{ p: 3, mt: 4 }}>
                 <Typography variant="h6" component="h2" gutterBottom>
                    Recent Activity (Example)
                 </Typography>
                 <Typography variant="body2" color="text.secondary">
                    (You could add recently added people or gift ideas here later.)
                 </Typography>
            </Paper>
            */}

        </Container>
    );
}

export default DashboardPage;