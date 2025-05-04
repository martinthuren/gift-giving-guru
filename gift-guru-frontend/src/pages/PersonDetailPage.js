// FULL CODE SNIPPET: src/pages/PersonDetailPage.js (With Edit Gift Idea Modal)

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// --- Optional: Create a separate Modal component later ---
// Example basic modal structure inline for now
const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                background: 'white', padding: '20px 30px', borderRadius: '5px',
                minWidth: '300px', maxWidth: '500px', position: 'relative'
             }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: '10px', right: '10px', background: 'none',
                    border: 'none', fontSize: '1.5em', cursor: 'pointer'
                }}>
                    × {/* Close button */}
                </button>
                {children}
            </div>
        </div>
    );
};
// --- End Basic Modal ---


function PersonDetailPage() {
    const { id: personId } = useParams();
    const navigate = useNavigate();

    const [person, setPerson] = useState(null);
    const [giftIdeas, setGiftIdeas] = useState([]);
    const [isLoadingPerson, setIsLoadingPerson] = useState(true);
    const [isLoadingIdeas, setIsLoadingIdeas] = useState(true);
    const [error, setError] = useState('');

    // --- Add Gift Idea Form State ---
    const [newIdeaText, setNewIdeaText] = useState('');
    const [newIdeaUrl, setNewIdeaUrl] = useState('');
    const [newIdeaNotes, setNewIdeaNotes] = useState('');
    const [isAddingIdea, setIsAddingIdea] = useState(false);

    // --- Edit Gift Idea Modal State ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingIdea, setEditingIdea] = useState(null); // Holds the idea object being edited
    const [editIdeaText, setEditIdeaText] = useState('');
    const [editIdeaUrl, setEditIdeaUrl] = useState('');
    const [editIdeaNotes, setEditIdeaNotes] = useState('');
    const [isUpdatingIdea, setIsUpdatingIdea] = useState(false);


    // --- Fetching Data (Keep existing useCallback functions) ---
    const fetchPersonDetails = useCallback(async () => {
        // ... (keep existing fetchPersonDetails code) ...
        setIsLoadingPerson(true);
        setError('');
        try {
            const response = await axios.get(`/people/${personId}`);
            if (response.data.status === 'success') {
                setPerson(response.data.data.person);
            } else {
                setError('Failed to load person details.');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Error loading person details.';
            if (err.response?.status === 404) setError('Person not found.');
            else if (err.response?.status === 401) {setError('Authentication error.'); navigate('/login');}
            else setError(message);
            console.error('Fetch person error:', err.response?.data || err.message);
        } finally {
            setIsLoadingPerson(false);
        }
    }, [personId, navigate]);

    const fetchGiftIdeas = useCallback(async () => {
        // ... (keep existing fetchGiftIdeas code) ...
        setIsLoadingIdeas(true);
        try {
            const response = await axios.get(`/gift-ideas?person=${personId}`);
            if (response.data.status === 'success') {
                setGiftIdeas(response.data.data.giftIdeas);
            } else {
                setError(prev => prev + ' Failed to load gift ideas.');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Error loading gift ideas.';
            if (err.response?.status === 401) {setError('Authentication error.'); navigate('/login');}
            else setError(prev => prev + ` ${message}`);
            console.error('Fetch gift ideas error:', err.response?.data || err.message);
        } finally {
            setIsLoadingIdeas(false);
        }
    }, [personId, navigate]);

    useEffect(() => {
        fetchPersonDetails();
        fetchGiftIdeas();
    }, [fetchPersonDetails, fetchGiftIdeas]);


    // --- Action Handlers (Keep existing handleAddGiftIdea, handleDeleteGiftIdea) ---
    const handleAddGiftIdea = async (e) => {
        // ... (keep existing handleAddGiftIdea code) ...
         e.preventDefault();
        if (!newIdeaText.trim()) { setError('Gift idea description cannot be empty.'); return; }
        setIsAddingIdea(true); setError('');
        try {
            const response = await axios.post('/gift-ideas', {person: personId, idea: newIdeaText, url: newIdeaUrl, notes: newIdeaNotes});
            if (response.data.status === 'success') { fetchGiftIdeas(); setNewIdeaText(''); setNewIdeaUrl(''); setNewIdeaNotes(''); }
            else { setError(response.data.message || 'Failed to add gift idea.'); }
        } catch (err) {
            const message = err.response?.data?.message || 'Error adding gift idea.';
            if (err.response?.status === 401) {setError('Authentication error.'); navigate('/login');}
            else { setError(message); }
            console.error('Add gift idea error:', err.response?.data || err.message);
        } finally { setIsAddingIdea(false); }
    };

    const handleDeleteGiftIdea = async (ideaId, ideaText) => {
        // ... (keep existing handleDeleteGiftIdea code) ...
         if (!window.confirm(`Are you sure you want to delete the idea: "${ideaText}"?`)) { return; }
        setError('');
        try {
            await axios.delete(`/gift-ideas/${ideaId}`);
            setGiftIdeas(prevIdeas => prevIdeas.filter(idea => idea._id !== ideaId));
        } catch (err) {
            const message = err.response?.data?.message || 'Error deleting gift idea.';
            if (err.response?.status === 401) {setError('Authentication error.'); navigate('/login');}
            else { setError(message); }
            console.error('Delete gift idea error:', err.response?.data || err.message);
        }
    };

    // --- Edit Modal Handlers ---
    const openEditModal = (ideaToEdit) => {
        setEditingIdea(ideaToEdit); // Store the whole idea object
        // Pre-fill form state for the modal
        setEditIdeaText(ideaToEdit.idea || '');
        setEditIdeaUrl(ideaToEdit.url || '');
        setEditIdeaNotes(ideaToEdit.notes || '');
        setError(''); // Clear errors when opening modal
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingIdea(null); // Clear the idea being edited
        // Optional: Clear edit form fields as well
        setEditIdeaText('');
        setEditIdeaUrl('');
        setEditIdeaNotes('');
    };

    const handleUpdateGiftIdea = async (e) => {
        e.preventDefault();
        if (!editingIdea) return; // Should not happen if modal is open correctly

        if (!editIdeaText.trim()) {
            setError('Gift idea description cannot be empty.'); // Show error inside modal?
            return;
        }
        setIsUpdatingIdea(true);
        setError('');

        const updatedData = {
            idea: editIdeaText,
            url: editIdeaUrl,
            notes: editIdeaNotes,
            // Add price, isPurchased etc. later if needed
        };

        try {
            const response = await axios.patch(`/gift-ideas/${editingIdea._id}`, updatedData);

            if (response.data.status === 'success') {
                // Update the list in the state or refetch
                // Option 1: Update state directly (more complex for nested state)
                setGiftIdeas(prevIdeas => prevIdeas.map(idea =>
                    idea._id === editingIdea._id ? response.data.data.giftIdea : idea
                ));
                // Option 2: Refetch (simpler)
                // fetchGiftIdeas();

                closeEditModal(); // Close modal on success
            } else {
                setError(response.data.message || 'Failed to update gift idea.'); // Show error in modal?
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Error updating gift idea.';
            if (err.response?.status === 401) {setError('Authentication error.'); navigate('/login');}
            else { setError(message); } // Show error in modal?
            console.error('Update gift idea error:', err.response?.data || err.message);
        } finally {
            setIsUpdatingIdea(false);
        }
    };


    // --- Render Logic (Keep existing parts) ---
    if (isLoadingPerson) { return <div>Loading person details...</div>; }
    if (error && !person) { return <div style={{ color: 'red' }}>Error: {error}</div>; }
    if (!person) { return <div>Person not found.</div>; }

    // Main render
    return (
        <div>
            {/* Person Details Section (Keep existing) */}
            <div style={{ marginBottom: '30px', paddingBottom: '15px', borderBottom: '1px solid #ccc' }}>
                 <h1>{person.name}</h1>
                 {person.relationship && <p><strong>Relationship:</strong> {person.relationship}</p>}
                 {person.birthday && <p><strong>Birthday:</strong> {new Date(person.birthday).toLocaleDateString()}</p>}
                 {person.interests && person.interests.length > 0 && (
                     <p><strong>Interests:</strong> {person.interests.join(', ')}</p>
                 )}
                 <Link to={`/people/${person._id}/edit`} style={{ marginLeft: '20px'}}>Edit Person Details</Link>
                 <br/>
                 <Link to="/people" style={{ color: '#6c757d', fontSize: '0.9em' }}>← Back to People List</Link>
            </div>

            {/* Display errors */}
            {error && !isEditModalOpen && <div style={{ color: 'red', marginBottom: '15px', border: '1px solid red', padding: '8px' }}>Error: {error}</div>}

            {/* Add Gift Idea Form Section (Keep existing) */}
            <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #eee', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                 <h3>Add New Gift Idea</h3>
                 <form onSubmit={handleAddGiftIdea}>
                      {/* Keep existing form inputs (newIdeaText, newIdeaUrl, newIdeaNotes) */}
                      <div style={{ marginBottom: '10px' }}>
                         <label htmlFor="new-idea-text" style={{ display: 'block', marginBottom: '3px' }}>Idea Description:*</label>
                         <input type="text" id="new-idea-text" value={newIdeaText} onChange={(e) => setNewIdeaText(e.target.value)} required disabled={isAddingIdea} style={{ width: '100%', padding: '8px' }} />
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                         <label htmlFor="new-idea-url" style={{ display: 'block', marginBottom: '3px' }}>URL (Optional):</label>
                         <input type="url" id="new-idea-url" placeholder="https://example.com/product" value={newIdeaUrl} onChange={(e) => setNewIdeaUrl(e.target.value)} disabled={isAddingIdea} style={{ width: '100%', padding: '8px' }} />
                      </div>
                      <div style={{ marginBottom: '15px' }}>
                         <label htmlFor="new-idea-notes" style={{ display: 'block', marginBottom: '3px' }}>Notes (Optional):</label>
                         <textarea id="new-idea-notes" rows="2" value={newIdeaNotes} onChange={(e) => setNewIdeaNotes(e.target.value)} disabled={isAddingIdea} style={{ width: '100%', padding: '8px' }} />
                      </div>
                      <button type="submit" disabled={isAddingIdea} style={{ padding: '10px 15px' }}> {isAddingIdea ? 'Adding Idea...' : '+ Add Idea'} </button>
                 </form>
            </div>

            {/* Display Gift Ideas Section */}
            <h2>Gift Ideas for {person.name}</h2>
            {isLoadingIdeas ? ( <p>Loading gift ideas...</p> ) :
             giftIdeas.length === 0 ? ( <p>No gift ideas saved for {person.name} yet.</p> ) :
             (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {giftIdeas.map((idea) => (
                        <li key={idea._id} style={{ marginBottom: '15px', border: '1px solid #eee', padding: '10px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            {/* Idea details (Keep existing) */}
                            <div>
                                 <strong style={{ fontSize: '1.1em' }}>{idea.idea}</strong>
                                 {idea.url && (<div style={{marginTop: '5px'}}><a href={idea.url} target="_blank" rel="noopener noreferrer" style={{fontSize: '0.9em', color: '#007bff'}}>View Link</a></div>)}
                                 {idea.notes && <p style={{ color: '#555', fontSize: '0.9em', marginTop: '5px', marginBottom: '0' }}>Notes: {idea.notes}</p>}
                            </div>
                            {/* Action Buttons */}
                            <div>
                                 {/* EDIT BUTTON - Calls openEditModal */}
                                 <button
                                     onClick={() => openEditModal(idea)} // Pass the idea to the handler
                                     style={{ color: '#ffc107', background: 'none', border: '1px solid #ffc107', padding: '4px 8px', cursor: 'pointer', borderRadius: '4px', fontSize: '0.9em' }}
                                     title={`Edit "${idea.idea}"`}
                                 >
                                     Edit
                                 </button>
                                 {/* Delete Button (Keep existing) */}
                                 <button
                                     onClick={() => handleDeleteGiftIdea(idea._id, idea.idea)}
                                     style={{ color: '#dc3545', background: 'none', border: '1px solid #dc3545', padding: '4px 8px', cursor: 'pointer', borderRadius: '4px', marginLeft: '10px', fontSize: '0.9em' }}
                                     title={`Delete "${idea.idea}"`}
                                 >
                                     Delete
                                 </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* Edit Gift Idea Modal */}
            <Modal isOpen={isEditModalOpen} onClose={closeEditModal}>
                 <h2>Edit Gift Idea</h2>
                 {/* Display Error specific to the modal update */}
                 {error && isEditModalOpen && <div style={{ color: 'red', marginBottom: '10px' }}>Error: {error}</div>}

                 <form onSubmit={handleUpdateGiftIdea}>
                     <div style={{ marginBottom: '10px' }}>
                        <label htmlFor="edit-idea-text" style={{ display: 'block', marginBottom: '3px' }}>Idea Description:*</label>
                        <input
                            type="text"
                            id="edit-idea-text"
                            value={editIdeaText}
                            onChange={(e) => setEditIdeaText(e.target.value)}
                            required
                            disabled={isUpdatingIdea}
                            style={{ width: '100%', padding: '8px' }}
                        />
                    </div>
                     <div style={{ marginBottom: '10px' }}>
                        <label htmlFor="edit-idea-url" style={{ display: 'block', marginBottom: '3px' }}>URL (Optional):</label>
                        <input
                            type="url"
                            id="edit-idea-url"
                            value={editIdeaUrl}
                            onChange={(e) => setEditIdeaUrl(e.target.value)}
                            disabled={isUpdatingIdea}
                            style={{ width: '100%', padding: '8px' }}
                        />
                    </div>
                     <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="edit-idea-notes" style={{ display: 'block', marginBottom: '3px' }}>Notes (Optional):</label>
                        <textarea
                            id="edit-idea-notes"
                            rows="3" // Slightly bigger maybe
                            value={editIdeaNotes}
                            onChange={(e) => setEditIdeaNotes(e.target.value)}
                            disabled={isUpdatingIdea}
                            style={{ width: '100%', padding: '8px' }}
                        />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                         <button type="button" onClick={closeEditModal} style={{ marginRight: '10px', background: '#6c757d', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px' }} disabled={isUpdatingIdea}>
                             Cancel
                         </button>
                         <button type="submit" disabled={isUpdatingIdea} style={{ padding: '8px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>
                            {isUpdatingIdea ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                 </form>
            </Modal>

        </div>
    );
}

export default PersonDetailPage;