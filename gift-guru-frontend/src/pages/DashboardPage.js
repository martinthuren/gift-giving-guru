// FULL CODE SNIPPET: src/pages/DashboardPage.js (Functional)

import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Ensure axios is configured
import { Link, useNavigate } from 'react-router-dom';

function DashboardPage() {
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUpcoming = async () => {
            setIsLoading(true);
            setError('');
            try {
                // Auth header should be set globally in App.js
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
                     navigate('/login'); // Redirect if not authorized
                } else {
                     setError(message);
                }
                console.error('Fetch upcoming events error:', err.response?.data || err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUpcoming();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only on mount

    // Helper function to format "days remaining" text
    const formatDaysRemaining = (days) => {
        if (days === 0) return 'Today!';
        if (days === 1) return 'Tomorrow';
        return `In ${days} days`;
    };

    return (
        <div>
            <h2>Dashboard</h2>

            <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
                <h3>Upcoming Birthdays (Next 30 Days)</h3>

                {isLoading ? (
                    <p>Loading upcoming events...</p>
                ) : error ? (
                    <p style={{ color: 'red' }}>Error: {error}</p>
                ) : upcomingEvents.length === 0 ? (
                    <p>No birthdays coming up in the next 30 days.</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {upcomingEvents.map(event => (
                            <li key={event.personId} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                                <Link to={`/people/${event.personId}`} style={{ fontWeight: 'bold', textDecoration: 'none', color: '#007bff' }}>
                                    {event.name}
                                </Link>
                                {event.relationship && <span style={{ color: '#6c757d' }}> ({event.relationship})</span>}
                                <br />
                                <span style={{ color: 'green', fontWeight: 'bold' }}>{formatDaysRemaining(event.daysRemaining)}</span>
                                <span style={{ marginLeft: '10px', color: '#555' }}>({new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* You can add other dashboard sections here later */}
            {/* e.g., Quick Add Person, Recently Added Ideas, etc. */}

        </div>
    );
}

export default DashboardPage;