// FULL CODE SNIPPET: src/pages/AddPersonPage.js (Functional)
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // For redirection
import { Link } from 'react-router-dom'; // For cancel link
function AddPersonPage() {
    const [name, setName] = useState('');
    const [relationship, setRelationship] = useState('');
    const [birthday, setBirthday] = useState(''); // Store as string initially for input type="date"
    const [interests, setInterests] = useState(''); // Simple comma-separated string for now
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Prepare data for API (split interests string into an array)
        const interestsArray = interests.split(',')
                                   .map(item => item.trim()) // Trim whitespace
                                   .filter(item => item !== ''); // Remove empty items

        const personData = {
            name,
            relationship,
            interests: interestsArray,
        };
        // Only include birthday if it's been set
        if (birthday) {
            personData.birthday = birthday;
        }

        try {
            // POST request to the backend endpoint
            const response = await axios.post('/people', personData);

            if (response.data.status === 'success') {
                // Redirect to the people list page after successful creation
                navigate('/people');
            } else {
                setError(response.data.message || 'Failed to add person.');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'An error occurred while adding the person.';
             if (err.response?.status === 401) {
                 setError('Authentication error. Please log in again.');
                 navigate('/login'); // Redirect to login on auth error
             } else {
                 setError(message);
             }
            console.error('Add person error:', err.response?.data || err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h2>Add New Person</h2>

            {error && <div style={{ color: 'red', marginBottom: '15px', border: '1px solid red', padding: '8px' }}>Error: {error}</div>}

            <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
                <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="name" style={{ display: 'block', marginBottom: '3px' }}>Name:*</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isLoading}
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="relationship" style={{ display: 'block', marginBottom: '3px' }}>Relationship:</label>
                    <input
                        type="text"
                        id="relationship"
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value)}
                        disabled={isLoading}
                         style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="birthday" style={{ display: 'block', marginBottom: '3px' }}>Birthday:</label>
                    <input
                        type="date" // HTML5 date picker
                        id="birthday"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        disabled={isLoading}
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                 <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="interests" style={{ display: 'block', marginBottom: '3px' }}>Interests/Likes (comma-separated):</label>
                    <input
                        type="text"
                        id="interests"
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                        disabled={isLoading}
                        placeholder="e.g., hiking, sci-fi books, coffee"
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>

                <button type="submit" disabled={isLoading} style={{ padding: '10px 15px' }}>
                    {isLoading ? 'Adding...' : 'Add Person'}
                </button>
                 <Link to="/people" style={{ marginLeft: '15px', color: '#6c757d' }}>Cancel</Link>
            </form>
        </div>
    );
}

export default AddPersonPage;