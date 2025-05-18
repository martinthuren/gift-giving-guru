// FULL CODE SNIPPET: src/pages/EditPersonPage.js (Ensuring image URL is fetched and used)

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';

// Import MUI Components
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
// import Link from '@mui/material/Link'; // Not directly used for navigation here
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Avatar from '@mui/material/Avatar';
import PhotoCamera from '@mui/icons-material/PhotoCamera';

function EditPersonPage() {
    const { id: personId } = useParams();
    const navigate = useNavigate();

    // Form state
    const [name, setName] = useState('');
    const [relationship, setRelationship] = useState('');
    const [birthday, setBirthday] = useState('');
    const [interests, setInterests] = useState('');
    const [currentImageUrl, setCurrentImageUrl] = useState(null); // Stores the URL from DB
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null); // For display in Avatar

    // Control states
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [pageTitleName, setPageTitleName] = useState('');

    // Fetch existing person data
    const fetchPerson = useCallback(async () => {
        setIsLoadingData(true);
        setError('');
        try {
            const response = await axios.get(`/people/${personId}`);
            if (response.data.status === 'success') {
                const personData = response.data.data.person;
                console.log("EDIT PAGE - Fetched Person Data:", personData); // DEBUG LOG

                setName(personData.name || '');
                setPageTitleName(personData.name || '');
                setRelationship(personData.relationship || '');
                setBirthday(personData.birthday ? new Date(personData.birthday).toISOString().split('T')[0] : '');
                setInterests(personData.interests ? personData.interests.join(', ') : '');

                // CRITICAL FOR DISPLAYING EXISTING IMAGE
                setCurrentImageUrl(personData.profilePictureUrl || null);
                setImagePreview(personData.profilePictureUrl || null);

            } else {
                setError('Failed to load person data.');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Error loading person data.';
            if (err.response?.status === 404) setError('Person not found.');
            else if (err.response?.status === 401) { setError('Authentication error.'); navigate('/login'); }
            else setError(message);
            console.error('EditPage - Fetch person error:', err.response?.data || err.message);
        } finally {
            setIsLoadingData(false);
        }
    }, [personId, navigate]);

    useEffect(() => {
        fetchPerson();
    }, [fetchPerson]);

    // Handle file selection change
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result); // Show preview of newly selected file
            };
            reader.readAsDataURL(file);
        } else {
            setSelectedFile(null);
            setImagePreview(currentImageUrl); // Revert to original DB image if selection cancelled
        }
    };

    // Handle form submission for update (Ensure FormData logic is correct)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('relationship', relationship);
        const interestsArray = interests.split(',').map(item => item.trim()).filter(item => item !== '');
        formData.append('interests', JSON.stringify(interestsArray)); // Send as JSON string
        if (birthday) formData.append('birthday', birthday);

        if (selectedFile) {
            console.log('EditPage Frontend: Appending selectedFile to FormData:', selectedFile);
            formData.append('profileImage', selectedFile);
        }
        // Logic for explicit removal (if frontend allows clearing preview to signal removal)
        // This depends on how you want "removing" an image to work from the UI.
        // If imagePreview is null and currentImageUrl existed, it means user cleared the preview
        // of an existing image. If selectedFile is also null, it's not a new upload.
        else if (!selectedFile && currentImageUrl && !imagePreview) {
             console.log("EditPage Frontend: Signaling image removal");
             formData.append('profilePictureUrl', ''); // Send empty string to signal removal to backend
        }


        try {
            const response = await axios.patch(`/people/${personId}`, formData); // FormData sets Content-Type
            if (response.data.status === 'success') {
                navigate(`/people/${personId}`);
            } else {
                setError(response.data.message || 'Failed to update person.');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'An error occurred while updating.';
             if (err.response?.status === 401) { setError('Authentication error.'); navigate('/login'); }
             else setError(message);
            console.error('EditPage - Update person error:', err.response?.data || err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Logic ---
    if (isLoadingData) { /* ... same loading JSX ... */
         return ( <Container maxWidth="sm" sx={{ mt: 4, mb: 4, textAlign: 'center' }}><CircularProgress /><Typography sx={{ mt: 2 }}>Loading person data...</Typography></Container> );
    }
    if (error && !pageTitleName) { /* ... same error JSX ... */
         return ( <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}><Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}><IconButton component={RouterLink} to="/people" sx={{ mr: 1 }}><ArrowBackIcon /></IconButton><Typography component="h1" variant="h5" color="error">Error</Typography></Box><Alert severity="error">{error}</Alert></Container> );
    }
    if (!name && !isLoadingData && !pageTitleName) { /* Check if person was truly not found */
        return <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}><Alert severity="warning">Person not found or could not be loaded.</Alert></Container>;
    }

    return (
        <Container component="main" maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
             <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                 <IconButton component={RouterLink} to={`/people/${personId}`} sx={{ mr: 1 }}> <ArrowBackIcon /> </IconButton>
                <Typography component="h1" variant="h5"> Edit: {pageTitleName || 'Person'} </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>} {/* Show submission errors */}

            <Box component="form" onSubmit={handleSubmit} noValidate>
                 {/* Image Preview and Upload Button */}
                 <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                    <Avatar
                        src={imagePreview || ''} // Use imagePreview state here
                        alt="Profile picture"
                        sx={{ width: 100, height: 100, mb: 1, bgcolor: 'grey.300' }} // Fallback bg color
                    >
                        {/* Show initial if no imagePreview and no currentImageUrl */}
                        {!imagePreview && pageTitleName ? pageTitleName[0].toUpperCase() : null}
                    </Avatar>
                     <Button variant="outlined" component="label" size="small" startIcon={<PhotoCamera />} disabled={isSubmitting}>
                        {currentImageUrl || selectedFile ? 'Change Picture' : 'Upload Picture'}
                        <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                      </Button>
                      {/* Optional: Add a button to remove/clear the selected/current image */}
                      {(imagePreview || currentImageUrl) && !selectedFile && ( // Show remove if there's a preview/current and no new file selected
                           <Button
                                size="small"
                                color="warning"
                                onClick={() => { setImagePreview(null); setSelectedFile(null); /* This signals removal via handleSubmit logic */}}
                                sx={{mt: 1}}
                                disabled={isSubmitting}
                           >
                               Remove Picture
                           </Button>
                      )}
                 </Box>

                {/* Text Fields */}
                <TextField label="Name" variant="outlined" margin="normal" required fullWidth value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmitting} autoFocus />
                <TextField label="Relationship" variant="outlined" margin="normal" fullWidth value={relationship} onChange={(e) => setRelationship(e.target.value)} disabled={isSubmitting} />
                <TextField label="Birthday" type="date" variant="outlined" margin="normal" fullWidth value={birthday} onChange={(e) => setBirthday(e.target.value)} disabled={isSubmitting} InputLabelProps={{ shrink: true }} />
                <TextField label="Interests/Likes (comma-separated)" variant="outlined" margin="normal" fullWidth value={interests} onChange={(e) => setInterests(e.target.value)} disabled={isSubmitting} placeholder="e.g., hiking, sci-fi books, coffee" />

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button variant="text" component={RouterLink} to={`/people/${personId}`} disabled={isSubmitting}> Cancel </Button>
                    <Button type="submit" variant="contained" color="primary" disabled={isSubmitting} sx={{ position: 'relative' }}> {isSubmitting ? <CircularProgress size={24} sx={{color: 'white', position: 'absolute'}} /> : 'Save Changes'} </Button>
                </Box>
            </Box>
        </Container>
    );
}

export default EditPersonPage;