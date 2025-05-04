// FULL CODE SNIPPET: src/pages/PeopleListPage.js (Functional)
import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Ensure axios is configured in App.js
import { Link, useNavigate } from 'react-router-dom'; // Use Link for navigation

function PeopleListPage() {
    const [people, setPeople] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate(); // For programmatic navigation if needed

    // Function to fetch people
    const fetchPeople = async () => {
        setIsLoading(true);
        setError('');
        try {
            // Auth header should be set globally in App.js
            const response = await axios.get('/people');
            if (response.data.status === 'success') {
                setPeople(response.data.data.people);
            } else {
                setError('Failed to fetch people.');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'An error occurred while fetching people.';
            if (err.response?.status === 401) {
                setError('Authentication failed. Please log in again.');
                // Optionally redirect to login: navigate('/login');
            } else {
                setError(message);
            }
            console.error('Fetch people error:', err.response?.data || err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch people when the component mounts
    useEffect(() => {
        fetchPeople();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array means run once on mount


    // --- Delete Handler ---
     const handleDelete = async (personId, personName) => {
         // Confirmation dialog
         if (!window.confirm(`Are you sure you want to delete ${personName}? This cannot be undone.`)) {
             return;
         }

         setError(''); // Clear previous errors
         try {
             await axios.delete(`/people/${personId}`);
             // Refresh the list after successful deletion
             // Option 1: Filter state directly (faster UI)
             setPeople(prevPeople => prevPeople.filter(p => p._id !== personId));
             // Option 2: Refetch from server (ensures consistency)
             // fetchPeople();
         } catch (err) {
              const message = err.response?.data?.message || 'An error occurred while deleting the person.';
              setError(message); // Show error to user
              console.error('Delete person error:', err.response?.data || err.message);
         }
     };


    // --- Render Logic ---
    if (isLoading) {
        return <div>Loading people...</div>;
    }

    return (
        <div>
            <h2>Your People</h2>

            {/* Display error message if any */}
            {error && <div style={{ color: 'red', marginBottom: '15px', border: '1px solid red', padding: '8px' }}>Error: {error}</div>}


             <Link to="/people/add" style={{ marginBottom: '15px', display: 'inline-block', padding: '8px 12px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
                 + Add New Person
             </Link>

            {people.length === 0 && !isLoading ? ( // Check isLoading again here
                <p>You haven't added anyone yet. Click the button above to add someone!</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {people.map((person) => (
                        <li key={person._id} style={{ marginBottom: '15px', border: '1px solid #eee', padding: '10px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <strong style={{ fontSize: '1.1em' }}>
                                    {/* Link to detail page (we'll build this later) */}
                                    <Link to={`/people/${person._id}`}>{person.name}</Link>
                                </strong>
                                <br />
                                {person.relationship && <span style={{ color: '#555', fontSize: '0.9em' }}>{person.relationship}</span>}
                                {person.birthday && <span style={{ color: '#555', fontSize: '0.9em', marginLeft: '10px' }}> - Birthday: {new Date(person.birthday).toLocaleDateString()}</span>}
                            </div>
                            <div>
                                 {/* Add Edit Link later */}
                                 <Link
    to={`/people/${person._id}/edit`} // Link to the edit route
    style={{ marginRight: '10px', color: '#ffc107', /* other styles */ }}
    title={`Edit ${person.name}`}></Link>   <button
                                     onClick={() => handleDelete(person._id, person.name)}
                                     style={{ color: '#dc3545', background: 'none', border: '1px solid #dc3545', padding: '4px 8px', cursor: 'pointer', borderRadius: '4px', marginLeft: '10px' }}
                                     title={`Delete ${person.name}`}
                                 >
                                     Delete
                                 </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default PeopleListPage;