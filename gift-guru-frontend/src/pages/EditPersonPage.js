// FULL CODE SNIPPET: src/pages/EditPersonPage.js (Using MUI)

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'; // Import hooks

// Import MUI Components
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link'; // MUI Link
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Avatar from '@mui/material/Avatar';
import PhotoCamera from '@mui/icons-material/PhotoCamera';


function EditPersonPage() {
    const { id: personId } = useParams(); // Get person ID from URL
    const navigate = useNavigate();

    // Form state
    const [name, setName] = useState('');
    const [relationship, setRelationship] = useState('');
    const [birthday, setBirthday] = useState(''); // 'YYYY-MM-DD'
    const [interests, setInterests] = useState(''); // Comma-separated string

    // Control states
    const [isLoadingData, setIsLoadingData] = useState(true); // Loading existing data
    const [isSubmitting, setIsSubmitting] = useState(false); // Submitting update
    const [error, setError] = useState('');
    const [pageTitleName, setPageTitleName] = useState(''); // Store name for title after loading
    const [imagePreview, setImagePreview] = useState(null); // State for image preview URL
    // Ensure these state variables are declared
const [selectedFile, setSelectedFile] = useState(null);
const [currentImageUrl, setCurrentImageUrl] = useState(null);


    // Fetch existing person data
    const fetchPerson = useCallback(async () => {
        setIsLoadingData(true);
        setError('');
        try {
            const response = await axios.get(`/people/${personId}`);
            if (response.data.status === 'success') {
                const personData = response.data.data.person;
                // Populate form state
                setName(personData.name || '');
                setPageTitleName(personData.name || ''); // Set initial name for title
                setRelationship(personData.relationship || '');
                setBirthday(personData.birthday ? new Date(personData.birthday).toISOString().split('T')[0] : '');
                setInterests(personData.interests ? personData.interests.join(', ') : '');
            } else {
                setError('Failed to load person data.');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Error loading person data.';
            if (err.response?.status === 404) setError('Person not found.');
            else if (err.response?.status === 401) { setError('Authentication error.'); navigate('/login'); }
            else setError(message);
            console.error('Fetch person error:', err.response?.data || err.message);
        } finally {
            setIsLoadingData(false);
        }
    }, [personId, navigate]); // Depend on personId

    // Fetch data on component mount
    useEffect(() => {
        fetchPerson();
    }, [fetchPerson]);

    // Handle file selection change
const handleFileChange = (event) => {
    const file = event.target.files[0]; // Get the selected file
    if (file) {
        // Store the file object itself (needed for FormData)
        setSelectedFile(file); // Assuming you also have: const [selectedFile, setSelectedFile] = useState(null);

        // Create a temporary URL for previewing the selected image
        const reader = new FileReader();
        reader.onloadend = () => {
            // Update the imagePreview state with the result (a base64 data URL)
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file); // Read the file content
    } else {
        // If user cancelled file selection, reset state
        setSelectedFile(null);
        setImagePreview(currentImageUrl); // Revert preview to original image URL (make sure currentImageUrl state exists)
    }
};

    // Handle form submission for update
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const interestsArray = interests.split(',')
                                   .map(item => item.trim())
                                   .filter(item => item !== '');

        const updatedPersonData = { name, relationship, interests: interestsArray };
        if (birthday) { updatedPersonData.birthday = birthday; }
        // Note: We could potentially only send fields that changed, but sending all is simpler here.

        try {
            // Send PATCH request
            const response = await axios.patch(`/people/${personId}`, updatedPersonData);

            if (response.data.status === 'success') {
                navigate(`/people/${personId}`); // Redirect back to detail page
            } else {
                setError(response.data.message || 'Failed to update person.');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'An error occurred while updating.';
             if (err.response?.status === 401) { setError('Authentication error.'); navigate('/login'); }
             else setError(message);
            console.error('Update person error:', err.response?.data || err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Logic ---
    if (isLoadingData) {
        return (
            <Container maxWidth="sm" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Loading person data...</Typography>
            </Container>
        );
    }

    // If error occurred during initial load
    if (error && !pageTitleName) {
        return (
            <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
                 <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                     <IconButton component={RouterLink} to="/people" sx={{ mr: 1 }} aria-label="Back to People List">
                        <ArrowBackIcon />
                     </IconButton>
                    <Typography component="h1" variant="h5" color="error">
                        Error
                    </Typography>
                 </Box>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }


    return (
        <Container component="main" maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
             <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                 {/* Link back to detail page */}
                 <IconButton component={RouterLink} to={`/people/${personId}`} sx={{ mr: 1 }} aria-label={`Back to ${pageTitleName}'s details`}>
                    <ArrowBackIcon />
                 </IconButton>
                <Typography component="h1" variant="h5">
                    Edit: {pageTitleName || 'Person'} {/* Show name in title */}
                </Typography>
            </Box>

            {/* Show submission errors here */}
            {error && isSubmitting && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                    label="Name"
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    id="edit-name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSubmitting} // Disable only during submission
                    autoFocus
                />
                <TextField
                    label="Relationship"
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    id="edit-relationship"
                    name="relationship"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    disabled={isSubmitting}
                />
                <TextField
                    label="Birthday"
                    type="date"
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    id="edit-birthday"
                    name="birthday"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    disabled={isSubmitting}
                    InputLabelProps={{ shrink: true }}
                />
                 <TextField
                    label="Interests/Likes (comma-separated)"
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    id="edit-interests"
                    name="interests"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="e.g., hiking, sci-fi books, coffee"
                />

                {/* Image Preview and Upload Button */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                    <Avatar
                        src={imagePreview || ''} // Shows current image or newly selected preview
                        alt="Profile picture preview"
                        sx={{ width: 100, height: 100, mb: 1 }}
                    />
                    <Button
                        variant="outlined"
                        component="label" // Acts as a label for the hidden input
                        size="small"
                        startIcon={<PhotoCamera />}
                        disabled={isSubmitting}
                    >
                        Upload Picture
                        <input
                            type="file"
                            hidden // The actual file input is hidden   
                            accept="image/*" // Only allows image types
                            onChange={handleFileChange} // Triggers preview update
                        />
                    </Button>
                </Box>
                
                
                

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                        variant="text"
                        component={RouterLink}
                        to={`/people/${personId}`} // Link back to detail page
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={isSubmitting}
                        sx={{ position: 'relative' }}
                    >
                       {isSubmitting ? <CircularProgress size={24} sx={{color: 'white', position: 'absolute'}} /> : 'Save Changes'}
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}

export default EditPersonPage;