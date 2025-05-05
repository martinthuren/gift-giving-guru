// FULL CODE SNIPPET: src/pages/PersonDetailPage.js (Using MUI)

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Import MUI Components
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link'; // MUI Link
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper'; // Use Paper for sections
import Stack from '@mui/material/Stack'; // Useful for spacing elements

// MUI Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LinkIcon from '@mui/icons-material/Link'; // For URL link

// MUI Dialog (Modal) Components
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
// import DialogContentText from '@mui/material/DialogContentText'; // If needed for descriptions
import DialogTitle from '@mui/material/DialogTitle';


function PersonDetailPage() {
    const { id: personId } = useParams();
    const navigate = useNavigate();

    // State for data
    const [person, setPerson] = useState(null);
    const [giftIdeas, setGiftIdeas] = useState([]);
    const [isLoadingPerson, setIsLoadingPerson] = useState(true);
    const [isLoadingIdeas, setIsLoadingIdeas] = useState(true);
    const [error, setError] = useState(''); // General page/fetch error
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [history, setHistory] = useState([]);
    const [historyError, setHistoryError] = useState(''); // Initialize history error state


    // State for Add Gift Idea Form
    const [newIdeaText, setNewIdeaText] = useState('');
    const [newIdeaUrl, setNewIdeaUrl] = useState('');
    const [newIdeaNotes, setNewIdeaNotes] = useState('');
    const [isAddingIdea, setIsAddingIdea] = useState(false);
    const [addError, setAddError] = useState(''); // Error specific to adding

    // State for Edit Gift Idea Dialog (Modal)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingIdea, setEditingIdea] = useState(null);
    const [editIdeaText, setEditIdeaText] = useState('');
    const [editIdeaUrl, setEditIdeaUrl] = useState('');
    const [editIdeaNotes, setEditIdeaNotes] = useState('');
    const [isUpdatingIdea, setIsUpdatingIdea] = useState(false);
    const [editError, setEditError] = useState(''); // Error specific to editing


    // --- Fetching Data ---
    const fetchPersonDetails = useCallback(async () => {/* ... keep existing logic ... */
        setIsLoadingPerson(true); setError('');
        try {
            const response = await axios.get(`/people/${personId}`);
            if (response.data.status === 'success') setPerson(response.data.data.person);
            else setError('Failed to load person details.');
        } catch (err) {
            const msg = err.response?.data?.message || 'Error loading person details.';
            if (err.response?.status === 404) setError('Person not found.');
            else if (err.response?.status === 401) {setError('Auth error.'); navigate('/login');}
            else setError(msg);
            console.error('Fetch person error:', err);
        } finally { setIsLoadingPerson(false); }
    }, [personId, navigate]);

    const fetchGiftIdeas = useCallback(async () => {/* ... keep existing logic ... */
        setIsLoadingIdeas(true); // Don't clear main error here
        try {
            const response = await axios.get(`/gift-ideas?person=${personId}`);
            if (response.data.status === 'success') setGiftIdeas(response.data.data.giftIdeas);
            else setGiftIdeas([]); // Set empty if fetch fails but person loaded
        } catch (err) {
            const msg = err.response?.data?.message || 'Error loading gift ideas.';
            if (err.response?.status === 401) {setError('Auth error.'); navigate('/login');}
            else console.error('Fetch gift ideas error:', err); // Log idea error, don't overwrite main error
            setGiftIdeas([]); // Set empty on error
        } finally { setIsLoadingIdeas(false); }
    }, [personId, navigate]);

    useEffect(() => {
        fetchPersonDetails();
        fetchGiftIdeas();
    }, [fetchPersonDetails, fetchGiftIdeas]);
    
    // Add alongside fetchPersonDetails, fetchGiftIdeas
const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    setHistoryError(''); // Clear specific history error on new fetch
    try {
        const response = await axios.get(`/history?person=${personId}`);
        if (response.data.status === 'success') {
            setHistory(response.data.data.history);
        } else {
             // Don't set general 'error', maybe just log or use historyError
             console.error('Failed to load history (API success false)');
             setHistoryError('Could not load gift history.');
        }
    } catch (err) {
        const msg = err.response?.data?.message || 'Error loading gift history.';
        if (err.response?.status === 401) {setError('Auth error.'); navigate('/login');} // General auth error
        else setHistoryError(msg); // Set specific history error
        console.error('Fetch history error:', err);
        setHistory([]); // Clear history on error
    } finally {
        setIsLoadingHistory(false);
    }
}, [personId, navigate]); // Dependencies

// Modify the main useEffect
useEffect(() => {
    fetchPersonDetails();
    fetchGiftIdeas();
    fetchHistory(); // <-- ADD THIS CALL
}, [fetchPersonDetails, fetchGiftIdeas, fetchHistory]); // <-- ADD DEPENDENCY


    // --- Action Handlers ---
    const handleAddGiftIdea = async (e) => {
        e.preventDefault();
        if (!newIdeaText.trim()) { setAddError('Idea description is required.'); return; }
        setIsAddingIdea(true); setAddError(''); setError('');

        try {
            const response = await axios.post('/gift-ideas', {person: personId, idea: newIdeaText, url: newIdeaUrl, notes: newIdeaNotes});
            if (response.data.status === 'success') {
                fetchGiftIdeas(); // Refetch ideas list
                setNewIdeaText(''); setNewIdeaUrl(''); setNewIdeaNotes(''); // Clear form
            } else { setAddError(response.data.message || 'Failed to add idea.'); }
        } catch (err) {
             const msg = err.response?.data?.message || 'Error adding gift idea.';
             if (err.response?.status === 401) {setError('Auth error.'); navigate('/login');}
             else setAddError(msg);
             console.error('Add gift idea error:', err);
        } finally { setIsAddingIdea(false); }
    };

    const handleDeleteGiftIdea = async (ideaId, ideaText) => {
        if (!window.confirm(`Delete idea: "${ideaText}"?`)) return;
        setError(''); setAddError(''); setEditError(''); // Clear errors
        // Optional: Add specific loading state for the item being deleted
        try {
            await axios.delete(`/gift-ideas/${ideaId}`);
            setGiftIdeas(prevIdeas => prevIdeas.filter(idea => idea._id !== ideaId)); // Update UI immediately
        } catch (err) {
            const msg = err.response?.data?.message || 'Error deleting gift idea.';
            if (err.response?.status === 401) {setError('Auth error.'); navigate('/login');}
            else setError(msg); // Show general error
            console.error('Delete gift idea error:', err);
        }
    };

    // --- Edit Modal Handlers ---
    const openEditModal = (ideaToEdit) => {
        setEditingIdea(ideaToEdit);
        setEditIdeaText(ideaToEdit.idea || '');
        setEditIdeaUrl(ideaToEdit.url || '');
        setEditIdeaNotes(ideaToEdit.notes || '');
        setEditError(''); // Clear modal error
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingIdea(null);
        // Don't clear fields immediately, looks abrupt
    };

    const handleUpdateGiftIdea = async (e) => {
        e.preventDefault();
        if (!editingIdea) return;
        if (!editIdeaText.trim()) { setEditError('Idea description is required.'); return; }
        setIsUpdatingIdea(true); setEditError(''); setError('');

        const updatedData = { idea: editIdeaText, url: editIdeaUrl, notes: editIdeaNotes };

        try {
            const response = await axios.patch(`/gift-ideas/${editingIdea._id}`, updatedData);
            if (response.data.status === 'success') {
                fetchGiftIdeas(); // Refetch list to show update
                closeEditModal();
            } else { setEditError(response.data.message || 'Failed to update gift idea.'); }
        } catch (err) {
            const msg = err.response?.data?.message || 'Error updating gift idea.';
            if (err.response?.status === 401) {setError('Auth error.'); navigate('/login'); closeEditModal(); }
            else setEditError(msg);
            console.error('Update gift idea error:', err);
        } finally { setIsUpdatingIdea(false); }
    };


    // --- Render Logic ---
    if (isLoadingPerson) {
        return <Container maxWidth="md" sx={{ mt: 4, mb: 4, textAlign: 'center' }}><CircularProgress /></Container>;
    }

    if (error && !person) { // If fetching person failed entirely
        return <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}><Alert severity="error">{error}</Alert></Container>;
    }

    if (!person) { return <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>Person not found.</Container>; }

    // Main render
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}> {/* Use larger container if needed */}

            {/* --- Person Details Section --- */}
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                        <Typography variant="h4" component="h1" gutterBottom>{person.name}</Typography>
                        {person.relationship && <Typography variant="subtitle1" color="text.secondary" gutterBottom>Relationship: {person.relationship}</Typography>}
                        {person.birthday && <Typography variant="body1" color="text.secondary" gutterBottom>Birthday: {new Date(person.birthday).toLocaleDateString()}</Typography>}
                        {person.interests && person.interests.length > 0 && (
                            <Typography variant="body1" color="text.secondary">Interests: {person.interests.join(', ')}</Typography>
                        )}
                    </Box>
                    <Box>
                        <IconButton component={RouterLink} to={`/people/${person._id}/edit`} title="Edit Person Details">
                            <EditIcon />
                        </IconButton>
                         <IconButton component={RouterLink} to="/people" title="Back to People List" sx={{ ml: 1 }}>
                            <ArrowBackIcon />
                        </IconButton>
                    </Box>
                 </Box>
            </Paper>

             {/* Display general page errors here (e.g., delete failed) */}
             {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* --- Add Gift Idea Section --- */}
            <Paper elevation={1} sx={{ p: 2, mb: 4 }}>
                 <Typography variant="h6" component="h2" gutterBottom>Add New Gift Idea</Typography>
                 {addError && <Alert severity="error" sx={{ mb: 2 }}>{addError}</Alert>}
                 <Box component="form" onSubmit={handleAddGiftIdea} noValidate>
                     <Stack spacing={2}> {/* Stack organizes elements vertically with spacing */}
                         <TextField
                             label="Idea Description"
                             variant="outlined"
                             size="small" // Smaller inputs for this form
                             required
                             fullWidth
                             id="new-idea-text"
                             value={newIdeaText}
                             onChange={(e) => setNewIdeaText(e.target.value)}
                             disabled={isAddingIdea}
                         />
                         <TextField
                             label="URL (Optional)"
                             variant="outlined"
                             size="small"
                             type="url"
                             fullWidth
                             id="new-idea-url"
                             value={newIdeaUrl}
                             onChange={(e) => setNewIdeaUrl(e.target.value)}
                             disabled={isAddingIdea}
                         />
                          <TextField
                             label="Notes (Optional)"
                             variant="outlined"
                             size="small"
                             multiline
                             rows={2}
                             fullWidth
                             id="new-idea-notes"
                             value={newIdeaNotes}
                             onChange={(e) => setNewIdeaNotes(e.target.value)}
                             disabled={isAddingIdea}
                         />
                         <Box sx={{ textAlign: 'right' }}>
                             <Button
                                 type="submit"
                                 variant="contained"
                                 disabled={isAddingIdea}
                                 startIcon={isAddingIdea ? <CircularProgress size={20} color="inherit" /> : <AddCircleOutlineIcon />}
                             >
                                 Add Idea
                             </Button>
                         </Box>
                    </Stack>
                 </Box>
            </Paper>

            {/* --- Gift Ideas List Section --- */}
            <Typography variant="h5" component="h2" gutterBottom>Gift Ideas for {person.name}</Typography>
            {isLoadingIdeas ? (
                <Box sx={{ textAlign: 'center', p: 3 }}><CircularProgress /></Box>
            ) : giftIdeas.length === 0 ? (
                <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>No gift ideas saved yet.</Typography>
            ) : (
                <List disablePadding> {/* disablePadding removes default list padding */}
                    {giftIdeas.map((idea, index) => (
                        <React.Fragment key={idea._id}>
                            <ListItem
                                alignItems="flex-start" // Align items to top if text wraps
                                secondaryAction={
                                    <Stack direction="row" spacing={0.5}> {/* Stack buttons horizontally */}
                                         <IconButton size="small" edge="end" aria-label="edit" title="Edit Idea" onClick={() => openEditModal(idea)}>
                                            <EditIcon fontSize="small" />
                                         </IconButton>
                                         <IconButton size="small" edge="end" aria-label="delete" title="Delete Idea" onClick={() => handleDeleteGiftIdea(idea._id, idea.idea)} sx={{ color: 'error.light' }}>
                                            <DeleteIcon fontSize="small"/>
                                         </IconButton>
                                    </Stack>
                                }
                                sx={{ py: 2 }} // Add vertical padding
                            >
                                <ListItemText
                                    primary={idea.idea}
                                    secondary={
                                        <Stack spacing={0.5} sx={{ mt: 0.5 }}> {/* Stack secondary info */}
                                            {idea.url && (
                                                <Link href={idea.url} target="_blank" rel="noopener noreferrer" variant="body2" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                                     <LinkIcon fontSize="inherit" sx={{ mr: 0.5 }} /> View Link
                                                 </Link>
                                            )}
                                            {idea.notes && <Typography variant="body2" color="text.secondary">Notes: {idea.notes}</Typography>}
                                        </Stack>
                                    }
                                />
                            </ListItem>
                            {index < giftIdeas.length - 1 && <Divider component="li" variant="inset" />} {/* Inset divider */}
                        </React.Fragment>
                    ))}
                </List>
            )}

              {/* --- Gift History Section --- */}
              <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
                Gift History
            </Typography>
            <Paper elevation={1} sx={{ p: { xs: 1, sm: 2 } }}> {/* Add padding */}
                 {isLoadingHistory ? (
                     <Box sx={{ textAlign: 'center', p: 2 }}><CircularProgress size={30} /></Box>
                 ) : historyError ? (
                     <Alert severity="warning" sx={{ m: 1 }}>{historyError}</Alert> // Use warning for non-critical
                 ) : history.length === 0 ? (
                     <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                         No past gifts logged for {person.name}.
                     </Typography>
                 ) : (
                     <List dense disablePadding> {/* dense makes list items smaller */}
                         {history.map((record, index) => (
                             <React.Fragment key={record._id}>
                                 <ListItem alignItems="flex-start">
                                     <ListItemText
                                         primary={record.giftDescription}
                                         secondary={
                                             <>
                                                 <Typography component="span" variant="body2" color="text.primary">
                                                      {record.event ? `${record.event} - ` : ''}
                                                      {new Date(record.dateGiven).toLocaleDateString()}
                                                 </Typography>
                                                 {record.notes && (
                                                     <Typography component="span" variant="caption" display="block" sx={{ mt: 0.5, color: 'text.secondary' }}>
                                                         Notes: {record.notes}
                                                     </Typography>
                                                 )}
                                                 {/* Optional: Delete button */}
                                                 {/* <IconButton size="small" edge="end" sx={{position: 'absolute', right: 16, top: 10}} onClick={() => handleDeleteHistory(record._id)}> <DeleteIcon fontSize="small"/> </IconButton> */}
                                             </>
                                         }
                                     />
                                      {/* Optional: Display cost */}
                                      {typeof record.cost === 'number' && (
                                            <Typography variant="body2" sx={{ml: 2, minWidth: '50px', textAlign: 'right'}}>${record.cost.toFixed(2)}</Typography>
                                      )}
                                 </ListItem>
                                 {index < history.length - 1 && <Divider component="li" variant="middle" />}
                             </React.Fragment>
                         ))}
                     </List>
                 )}
                 {/* Add Button/Form to manually log history later if desired */}
                 {/* <Box sx={{mt: 2, textAlign: 'right'}}> <Button size="small">Log Past Gift</Button> </Box> */}
            </Paper>


            {/* --- Edit Gift Idea Dialog (Modal) --- */}
            <Dialog open={isEditModalOpen} onClose={closeEditModal} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Gift Idea</DialogTitle>
                <DialogContent>
                    {/* Display Error specific to the modal update */}
                    {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
                    {/* Form inside the Dialog */}
                     <Stack spacing={2} sx={{ pt: 1 }}> {/* Add padding top and spacing */}
                         <TextField
                             autoFocus // Focus first field in modal
                             margin="dense"
                             id="edit-idea-text"
                             label="Idea Description"
                             type="text"
                             fullWidth
                             variant="outlined"
                             required
                             value={editIdeaText}
                             onChange={(e) => setEditIdeaText(e.target.value)}
                             disabled={isUpdatingIdea}
                         />
                         <TextField
                             margin="dense"
                             id="edit-idea-url"
                             label="URL (Optional)"
                             type="url"
                             fullWidth
                             variant="outlined"
                             value={editIdeaUrl}
                             onChange={(e) => setEditIdeaUrl(e.target.value)}
                             disabled={isUpdatingIdea}
                         />
                         <TextField
                             margin="dense"
                             id="edit-idea-notes"
                             label="Notes (Optional)"
                             type="text"
                             fullWidth
                             variant="outlined"
                             multiline
                             rows={3}
                             value={editIdeaNotes}
                             onChange={(e) => setEditIdeaNotes(e.target.value)}
                             disabled={isUpdatingIdea}
                         />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: '16px 24px' }}> {/* Add padding */}
                    <Button onClick={closeEditModal} disabled={isUpdatingIdea}>Cancel</Button>
                    <Button
                        onClick={handleUpdateGiftIdea} // Use specific handler for update
                        variant="contained"
                        disabled={isUpdatingIdea}
                        sx={{ position: 'relative' }}
                    >
                         {isUpdatingIdea ? <CircularProgress size={24} sx={{color: 'white', position: 'absolute'}} /> : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
}

export default PersonDetailPage;