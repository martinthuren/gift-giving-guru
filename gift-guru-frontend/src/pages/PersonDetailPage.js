// FULL CODE SNIPPET: src/pages/PersonDetailPage.js (Complete with MUI & All Features)

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
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

// Import MUI Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LinkIcon from '@mui/icons-material/Link';
import HistoryIcon from '@mui/icons-material/History'; // Icon for history section

function PersonDetailPage() {
    const { id: personId } = useParams();
    const navigate = useNavigate();

    // State for data
    const [person, setPerson] = useState(null);
    const [giftIdeas, setGiftIdeas] = useState([]);
    const [history, setHistory] = useState([]); // State for gift history

    // Loading states
    const [isLoadingPerson, setIsLoadingPerson] = useState(true);
    const [isLoadingIdeas, setIsLoadingIdeas] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true); // Loading for history

    // Error states
    const [error, setError] = useState(''); // General page/fetch error
    const [addError, setAddError] = useState(''); // Add Idea form error
    const [editError, setEditError] = useState(''); // Edit Idea modal error
    const [logError, setLogError] = useState(''); // Log History modal error
    const [historyError, setHistoryError] = useState(''); // History fetch/delete error

    // State for Add Gift Idea Form
    const [newIdeaText, setNewIdeaText] = useState('');
    const [newIdeaUrl, setNewIdeaUrl] = useState('');
    const [newIdeaNotes, setNewIdeaNotes] = useState('');
    const [isAddingIdea, setIsAddingIdea] = useState(false);

    // State for Edit Gift Idea Dialog
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingIdea, setEditingIdea] = useState(null);
    const [editIdeaText, setEditIdeaText] = useState('');
    const [editIdeaUrl, setEditIdeaUrl] = useState('');
    const [editIdeaNotes, setEditIdeaNotes] = useState('');
    const [isUpdatingIdea, setIsUpdatingIdea] = useState(false);

    // State for Log Past Gift Dialog
    const [isLogGiftModalOpen, setIsLogGiftModalOpen] = useState(false);
    const [logGiftDesc, setLogGiftDesc] = useState('');
    const [logGiftEvent, setLogGiftEvent] = useState('');
    const [logGiftDate, setLogGiftDate] = useState(new Date().toISOString().split('T')[0]);
    const [logGiftNotes, setLogGiftNotes] = useState('');
    const [logGiftCost, setLogGiftCost] = useState('');
    const [isLoggingGift, setIsLoggingGift] = useState(false);


    // --- Fetching Data ---
    const fetchPersonDetails = useCallback(async () => {
        setIsLoadingPerson(true); setError(''); setHistoryError(''); setAddError(''); setEditError(''); setLogError('');
        try {
            const response = await axios.get(`/people/${personId}`);
            setPerson(response.data.data.person);
        } catch (err) {
            const msg = err.response?.data?.message || 'Error loading person details.';
            if (err.response?.status === 404) setError('Person not found.');
            else if (err.response?.status === 401) { setError('Auth error.'); navigate('/login'); }
            else setError(msg);
        } finally { setIsLoadingPerson(false); }
    }, [personId, navigate]);

    const fetchGiftIdeas = useCallback(async () => {
        setIsLoadingIdeas(true);
        try {
            const response = await axios.get(`/gift-ideas?person=${personId}`);
            setGiftIdeas(response.data.data.giftIdeas);
        } catch (err) {
            console.error('Fetch gift ideas error:', err);
            setGiftIdeas([]); // Clear ideas on error
            if (err.response?.status === 401) { setError('Auth error.'); navigate('/login'); }
            // Don't necessarily set main error, maybe specific idea error?
        } finally { setIsLoadingIdeas(false); }
    }, [personId, navigate]);

    const fetchHistory = useCallback(async () => {
        setIsLoadingHistory(true); setHistoryError('');
        try {
            const response = await axios.get(`/history?person=${personId}`);
            setHistory(response.data.data.history);
        } catch (err) {
            const msg = err.response?.data?.message || 'Error loading gift history.';
            if (err.response?.status === 401) { setError('Auth error.'); navigate('/login'); }
            else setHistoryError(msg);
            console.error('Fetch history error:', err);
            setHistory([]); // Clear history on error
        } finally { setIsLoadingHistory(false); }
    }, [personId, navigate]);

    useEffect(() => {
        fetchPersonDetails();
        fetchGiftIdeas();
        fetchHistory();
    }, [fetchPersonDetails, fetchGiftIdeas, fetchHistory]); // Depend on the memoized functions


    // --- Action Handlers ---
    const handleAddGiftIdea = async (e) => { /* ... same as before ... */
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

    const handleDeleteGiftIdea = async (ideaId, ideaText) => { /* ... same as before ... */
         if (!window.confirm(`Delete idea: "${ideaText}"?`)) return;
        setError(''); setAddError(''); setEditError(''); setLogError(''); setHistoryError('');
        try {
            await axios.delete(`/gift-ideas/${ideaId}`);
            setGiftIdeas(prevIdeas => prevIdeas.filter(idea => idea._id !== ideaId));
        } catch (err) {
            const msg = err.response?.data?.message || 'Error deleting gift idea.';
            if (err.response?.status === 401) {setError('Auth error.'); navigate('/login');}
            else setError(msg);
            console.error('Delete gift idea error:', err);
        }
    };

    // --- Edit Gift Idea Modal Handlers ---
    const openEditModal = (ideaToEdit) => { /* ... same as before ... */
        setEditingIdea(ideaToEdit);
        setEditIdeaText(ideaToEdit.idea || '');
        setEditIdeaUrl(ideaToEdit.url || '');
        setEditIdeaNotes(ideaToEdit.notes || '');
        setEditError('');
        setIsEditModalOpen(true);
     };
    const closeEditModal = () => { /* ... same as before ... */
        setIsEditModalOpen(false);
        setEditingIdea(null);
     };
    const handleUpdateGiftIdea = async (e) => { /* ... same as before ... */
        e.preventDefault();
        if (!editingIdea) return;
        if (!editIdeaText.trim()) { setEditError('Idea description is required.'); return; }
        setIsUpdatingIdea(true); setEditError(''); setError('');
        const updatedData = { idea: editIdeaText, url: editIdeaUrl, notes: editIdeaNotes };
        try {
            const response = await axios.patch(`/gift-ideas/${editingIdea._id}`, updatedData);
            if (response.data.status === 'success') {
                fetchGiftIdeas(); // Refetch list
                closeEditModal();
            } else { setEditError(response.data.message || 'Failed to update gift idea.'); }
        } catch (err) {
            const msg = err.response?.data?.message || 'Error updating gift idea.';
            if (err.response?.status === 401) {setError('Auth error.'); navigate('/login'); closeEditModal(); }
            else setEditError(msg);
            console.error('Update gift idea error:', err);
        } finally { setIsUpdatingIdea(false); }
     };

     // --- Log Past Gift Modal Handlers ---
     const openLogGiftModal = () => { /* ... same as before ... */
        setLogGiftDesc(''); setLogGiftEvent(''); setLogGiftDate(new Date().toISOString().split('T')[0]);
        setLogGiftNotes(''); setLogGiftCost(''); setLogError('');
        setIsLogGiftModalOpen(true);
     };
    const closeLogGiftModal = () => { /* ... same as before ... */
        setIsLogGiftModalOpen(false);
     };
    const handleLogGiftSubmit = async (e) => { /* ... same as before ... */
        e.preventDefault();
        if (!logGiftDesc.trim()) { setLogError('Gift description is required.'); return; }
        const costValue = logGiftCost.trim() === '' ? undefined : parseFloat(logGiftCost);
        if (logGiftCost.trim() !== '' && (isNaN(costValue) || costValue < 0)) { setLogError('Cost must be a valid positive number or empty.'); return; }
        setIsLoggingGift(true); setLogError(''); setError('');
        const historyData = { person: personId, giftDescription: logGiftDesc.trim(), event: logGiftEvent.trim() || undefined, dateGiven: logGiftDate, notes: logGiftNotes.trim() || undefined, cost: costValue, };
        try {
            const response = await axios.post('/history', historyData);
            if (response.data.status === 'success') { fetchHistory(); closeLogGiftModal(); }
            else { setLogError(response.data.message || 'Failed to log gift.'); }
        } catch (err) {
            const msg = err.response?.data?.message || 'Error logging gift history.';
            if (err.response?.status === 401) { setError('Auth error.'); navigate('/login'); closeLogGiftModal(); }
            else setLogError(msg);
            console.error('Log gift error:', err);
        } finally { setIsLoggingGift(false); }
     };

     // --- Delete History Handler ---
     const handleDeleteHistory = async (recordId) => {
        if (!window.confirm("Delete this history record?")) return;
        setError(''); setHistoryError(''); // Clear errors
        try {
            await axios.delete(`/history/${recordId}`);
            setHistory(prev => prev.filter(rec => rec._id !== recordId)); // Update UI
        } catch (err) {
             const msg = err.response?.data?.message || 'Error deleting history record.';
             if (err.response?.status === 401) {setError('Auth error.'); navigate('/login');}
             else setHistoryError(msg); // Show history-specific error
             console.error('Delete history error:', err);
        }
    };


    // --- Render Logic ---
    if (isLoadingPerson) {
        return <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}><CircularProgress /></Container>;
    }

    if (error && !person) { // If fetching person failed entirely
        return <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}><Alert severity="error">{error}</Alert></Container>;
    }

    if (!person) {
        return <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>Person not found.</Container>;
    }

    // Main Render
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>

            {/* --- Person Details Section --- */}
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ mb: { xs: 2, sm: 0} }}> {/* Add bottom margin on small screens */}
                        <Typography variant="h4" component="h1" gutterBottom>{person.name}</Typography>
                        {person.relationship && <Typography variant="subtitle1" color="text.secondary" gutterBottom>Relationship: {person.relationship}</Typography>}
                        {person.birthday && <Typography variant="body1" color="text.secondary" gutterBottom>Birthday: {new Date(person.birthday).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</Typography>}
                        {person.interests && person.interests.length > 0 && (
                            <Typography variant="body1" color="text.secondary">Interests: {person.interests.join(', ')}</Typography>
                        )}
                    </Box>
                    {/* Action Buttons */}
                    <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}> {/* Prevent shrinking */}
                        <IconButton component={RouterLink} to={`/people/${person._id}/edit`} title="Edit Person Details"> <EditIcon /> </IconButton>
                        <IconButton component={RouterLink} to="/people" title="Back to People List"> <ArrowBackIcon /> </IconButton>
                    </Stack>
                 </Box>
            </Paper>

             {/* --- General Page Error Display --- */}
             {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* --- Add Gift Idea Section --- */}
            <Paper elevation={1} sx={{ p: 2, mb: 4 }}>
                 <Typography variant="h6" component="h2" gutterBottom>Add a new gift idea</Typography>
                 {addError && <Alert severity="error" sx={{ mb: 2 }}>{addError}</Alert>}
                 <Box component="form" onSubmit={handleAddGiftIdea} noValidate>
                     <Stack spacing={2}>
                         <TextField label="Idea Description" variant="outlined" size="small" required fullWidth id="new-idea-text" value={newIdeaText} onChange={(e) => setNewIdeaText(e.target.value)} disabled={isAddingIdea} />
                         <TextField label="URL (Optional)" variant="outlined" size="small" type="url" fullWidth id="new-idea-url" value={newIdeaUrl} onChange={(e) => setNewIdeaUrl(e.target.value)} disabled={isAddingIdea} />
                         <TextField label="Notes (Optional)" variant="outlined" size="small" multiline rows={2} fullWidth id="new-idea-notes" value={newIdeaNotes} onChange={(e) => setNewIdeaNotes(e.target.value)} disabled={isAddingIdea} />
                         <Box sx={{ textAlign: 'right' }}>
                             <Button type="submit" variant="contained" disabled={isAddingIdea} startIcon={isAddingIdea ? <CircularProgress size={20} color="inherit" /> : <AddCircleOutlineIcon />}> Add Idea </Button>
                         </Box>
                    </Stack>
                 </Box>
            </Paper>

            {/* --- Gift Ideas List Section --- */}
            <Typography variant="h5" component="h2" gutterBottom>Gift Ideas</Typography>
            <Paper elevation={1} sx={{mb: 4}}> {/* Contain list in paper */}
                {isLoadingIdeas ? ( <Box sx={{ textAlign: 'center', p: 3 }}><CircularProgress /></Box> )
                : giftIdeas.length === 0 ? ( <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>No gift ideas saved yet.</Typography> )
                : (
                    <List disablePadding>
                        {giftIdeas.map((idea, index) => (
                            <React.Fragment key={idea._id}>
                                <ListItem alignItems="flex-start" secondaryAction={
                                        <Stack direction="row" spacing={0.5}>
                                            <IconButton size="small" edge="end" title="Edit Idea" onClick={() => openEditModal(idea)}> <EditIcon fontSize="small" /> </IconButton>
                                            <IconButton size="small" edge="end" title="Delete Idea" onClick={() => handleDeleteGiftIdea(idea._id, idea.idea)} sx={{ color: 'error.light' }}> <DeleteIcon fontSize="small"/> </IconButton>
                                        </Stack>
                                    } sx={{ py: 1.5 }} >
<ListItemText
    primary={idea.idea}
    secondary={ // Content starts here
        <Stack spacing={0.5} sx={{ mt: 0.5 }}> {/* Stack renders a div */}
            {idea.url && (
                <Link href={idea.url} target="_blank" rel="noopener noreferrer" variant="body2" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                    <LinkIcon fontSize="inherit" sx={{ mr: 0.5 }} /> View Link
                </Link>
            )}
            {idea.notes && <Typography variant="body2" color="text.secondary">Notes: {idea.notes}</Typography>}
        </Stack>
    } // Content ends here
    // ADD THIS PROP to prevent secondary content being wrapped in <p>
    secondaryTypographyProps={{ component: 'div' }}
/>
                                </ListItem>
                                {index < giftIdeas.length - 1 && <Divider component="li" variant="inset" />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Paper>

            {/* --- Gift History Section --- */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 1 }}>
                 <Typography variant="h5" component="h2"><HistoryIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} fontSize="large"/>Gift History</Typography>
                 <Button variant="outlined" size="small" startIcon={<AddCircleOutlineIcon />} onClick={openLogGiftModal}> Log Past Gift </Button>
            </Box>
            <Paper elevation={1} sx={{ p: { xs: 1, sm: 2 } }}>
                 {isLoadingHistory ? ( <Box sx={{ textAlign: 'center', p: 2 }}><CircularProgress size={30} /></Box> )
                 : historyError ? ( <Alert severity="warning" sx={{ m: 1 }}>{historyError}</Alert> )
                 : history.length === 0 ? ( <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>No past gifts logged for {person.name}.</Typography> )
                 : (
                     <List dense disablePadding>
                         {history.map((record, index) => (
                             <React.Fragment key={record._id}>
                                 <ListItem alignItems="flex-start" secondaryAction={
                                        <IconButton size="small" edge="end" title="Delete History Record" onClick={() => handleDeleteHistory(record._id)} sx={{ color: 'error.light' }}>
                                             <DeleteIcon fontSize="inherit"/>
                                         </IconButton>
                                     }>
                                     <ListItemText
                                         primary={record.giftDescription}
                                         secondary={
                                             <>
                                                 <Typography component="span" variant="body2" color="text.primary">
                                                      {record.event ? `${record.event} - ` : ''}
                                                      {new Date(record.dateGiven).toLocaleDateString()}
                                                      {typeof record.cost === 'number' && ` ($${record.cost.toFixed(2)})`} {/* Show cost inline */}
                                                 </Typography>
                                                 {record.notes && ( <Typography component="span" variant="caption" display="block" sx={{ mt: 0.5, color: 'text.secondary' }}> Notes: {record.notes} </Typography> )}
                                             </>
                                         }
                                     />
                                 </ListItem>
                                 {index < history.length - 1 && <Divider component="li" variant="middle" />}
                             </React.Fragment>
                         ))}
                     </List>
                 )}
            </Paper>

            {/* --- Edit Gift Idea Dialog (Modal) --- */}
            <Dialog open={isEditModalOpen} onClose={closeEditModal} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Gift Idea</DialogTitle>
                 <Box component="form" onSubmit={handleUpdateGiftIdea}> {/* Form for modal */}
                    <DialogContent>
                        {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <TextField autoFocus margin="dense" id="edit-idea-text" label="Idea Description" type="text" fullWidth variant="outlined" required value={editIdeaText} onChange={(e) => setEditIdeaText(e.target.value)} disabled={isUpdatingIdea} />
                            <TextField margin="dense" id="edit-idea-url" label="URL (Optional)" type="url" fullWidth variant="outlined" value={editIdeaUrl} onChange={(e) => setEditIdeaUrl(e.target.value)} disabled={isUpdatingIdea} />
                            <TextField margin="dense" id="edit-idea-notes" label="Notes (Optional)" type="text" fullWidth variant="outlined" multiline rows={3} value={editIdeaNotes} onChange={(e) => setEditIdeaNotes(e.target.value)} disabled={isUpdatingIdea} />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: '16px 24px' }}>
                        <Button onClick={closeEditModal} disabled={isUpdatingIdea}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={isUpdatingIdea} sx={{ position: 'relative' }}> {isUpdatingIdea ? <CircularProgress size={24} sx={{color: 'white', position: 'absolute'}} /> : 'Save Changes'} </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* --- Add Gift History Dialog (Modal) --- */}
            <Dialog open={isLogGiftModalOpen} onClose={closeLogGiftModal} maxWidth="sm" fullWidth>
                <DialogTitle>Log a Past Gift for {person?.name}</DialogTitle>
                <Box component="form" onSubmit={handleLogGiftSubmit}>
                    <DialogContent>
                        {logError && <Alert severity="error" sx={{ mb: 2 }}>{logError}</Alert>}
                        <Stack spacing={2} sx={{ pt: 1 }}>
                             <TextField autoFocus required margin="dense" id="log-gift-desc" label="Gift Description" type="text" fullWidth variant="outlined" value={logGiftDesc} onChange={(e) => setLogGiftDesc(e.target.value)} disabled={isLoggingGift} />
                             <TextField margin="dense" id="log-gift-event" label="Event/Occasion (Optional)" type="text" fullWidth variant="outlined" value={logGiftEvent} onChange={(e) => setLogGiftEvent(e.target.value)} disabled={isLoggingGift} placeholder="e.g., Birthday 2023"/>
                             <TextField margin="dense" required id="log-gift-date" label="Date Given" type="date" fullWidth variant="outlined" value={logGiftDate} onChange={(e) => setLogGiftDate(e.target.value)} InputLabelProps={{ shrink: true }} disabled={isLoggingGift} />
                             <TextField margin="dense" id="log-gift-cost" label="Cost (Optional)" type="number" fullWidth variant="outlined" value={logGiftCost} onChange={(e) => setLogGiftCost(e.target.value)} InputProps={{ startAdornment: '$' }} inputProps={{ step: "0.01", min: "0" }} disabled={isLoggingGift} />
                             <TextField margin="dense" id="log-gift-notes" label="Notes (Optional)" type="text" fullWidth variant="outlined" multiline rows={3} value={logGiftNotes} onChange={(e) => setLogGiftNotes(e.target.value)} disabled={isLoggingGift} />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: '16px 24px' }}>
                        <Button onClick={closeLogGiftModal} disabled={isLoggingGift}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={isLoggingGift} sx={{ position: 'relative' }}> {isLoggingGift ? <CircularProgress size={24} sx={{color: 'white', position: 'absolute'}} /> : 'Save to History'} </Button>
                    </DialogActions>
                 </Box>
            </Dialog>

        </Container> // End main Container
    );
}

export default PersonDetailPage;