// FULL CODE SNIPPET: src/pages/EditPersonPage.js

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Import hooks

function EditPersonPage() {
    const { id: personId } = useParams(); // Get person ID from URL
    const navigate = useNavigate();

    // Form state - initialize potentially from fetched data
    const [name, setName] = useState('');
    const [relationship, setRelationship] = useState('');
    const [birthday, setBirthday] = useState(''); // Store as 'YYYY-MM-DD' for input type="date"
    const [interests, setInterests] = useState(''); // Store as comma-separated string for input
    const [originalPerson, setOriginalPerson] = useState(null); // To hold fetched data

    // Loading and error states
    const [isLoading, setIsLoading] = useState(true); // Loading existing data
    const [isSubmitting, setIsSubmitting] = useState(false); // Submitting update
    const [error, setError] = useState('');

    // Fetch existing person data
    const fetchPerson = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await axios.get(`/people/${personId}`);
            if (response.data.status === 'success') {
                const personData = response.data.data.person;
                setOriginalPerson(personData);
                // Populate form state
                setName(personData.name || '');
                setRelationship(personData.relationship || '');
                // Format date for input type="date" (YYYY-MM-DD)
                setBirthday(personData.birthday ? new Date(personData.birthday).toISOString().split('T')[0] : '');
                setInterests(personData.interests ? personData.interests.join(', ') : '');
            } else {
                setError('Failed to load person data.');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Error loading person data.';
            if (err.response?.status === 404) {
                setError('Person not found.');
            } else if (err.response?.status === 401) {
                setError('Authentication error.');
                navigate('/login');
            } else {
                setError(message);
            }
            console.error('Fetch person error:', err.response?.data || err.message);
        } finally {
            setIsLoading(false);
        }
    }, [personId, navigate]); // Depend on personId

    // Fetch data on component mount
    useEffect(() => {
        fetchPerson();
    }, [fetchPerson]); // Depend on the memoized fetch function

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const interestsArray = interests.split(',')
                                   .map(item => item.trim())
                                   .filter(item => item !== '');

        const updatedPersonData = {
            name,
            relationship,
            interests: interestsArray,
            // Only include birthday if it's set, otherwise backend might reject empty string
            ...(birthday && { birthday }),
        };

        try {
            // Send PATCH request to the backend
            const response = await axios.patch(`/people/${personId}`, updatedPersonData);

            if (response.data.status === 'success') {
                // Redirect back to the person detail page after successful update
                navigate(`/people/${personId}`);
            } else {
                setError(response.data.message || 'Failed to update person.');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'An error occurred while updating.';
            if (err.response?.status === 401) {
                setError('Authentication error.');
                navigate('/login');
            } else {
                setError(message);
            }
            console.error('Update person error:', err.response?.data || err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Logic ---
    if (isLoading) {
        return <div>Loading person data for editing...</div>;
    }

    if (error && !originalPerson) { // If initial fetch failed
        return <div style={{ color: 'red' }}>Error: {error}</div>;
    }

     if (!originalPerson) {
         // Should be caught by error handling, but as a fallback
         return <div>Person not found. <Link to="/people">Back to list</Link></div>;
     }

    return (
        <div>
            <h2>Edit Person: {originalPerson.name}</h2> {/* Show original name in title */}

            {error && <div style={{ color: 'red', marginBottom: '15px', border: '1px solid red', padding: '8px' }}>Error: {error}</div>}

            <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
                <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="edit-name" style={{ display: 'block', marginBottom: '3px' }}>Name:*</label>
                    <input
                        type="text"
                        id="edit-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isSubmitting}
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="edit-relationship" style={{ display: 'block', marginBottom: '3px' }}>Relationship:</label>
                    <input
                        type="text"
                        id="edit-relationship"
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value)}
                        disabled={isSubmitting}
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="edit-birthday" style={{ display: 'block', marginBottom: '3px' }}>Birthday:</label>
                    <input
                        type="date"
                        id="edit-birthday"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        disabled={isSubmitting}
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                 <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="edit-interests" style={{ display: 'block', marginBottom: '3px' }}>Interests/Likes (comma-separated):</label>
                    <input
                        type="text"
                        id="edit-interests"
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                        disabled={isSubmitting}
                        placeholder="e.g., hiking, sci-fi books, coffee"
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>

                <button type="submit" disabled={isSubmitting} style={{ padding: '10px 15px' }}>
                    {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                </button>
                 {/* Link back to the detail page */}
                 <Link to={`/people/${personId}`} style={{ marginLeft: '15px', color: '#6c757d' }}>Cancel</Link>
            </form>
        </div>
    );
}

export default EditPersonPage;