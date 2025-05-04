// FULL CODE SNIPPET: src/pages/RegisterPage.js (Using MUI)

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

// Import MUI Components
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Avatar from '@mui/material/Avatar';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'; // Re-use same icon or choose another

// Expect onRegisterSuccess prop from App.js to handle token update
function RegisterPage({ onRegisterSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post('/auth/register', { email, password });

            if (response.data.status === 'success' && response.data.token) {
                onRegisterSuccess(response.data.token);
                navigate('/dashboard'); // Redirect after successful registration
            } else {
                setError(response.data.message || 'Registration failed. Please try again.');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'An error occurred during registration.';
            setError(message);
            console.error('Registration error:', err.response?.data || err.message || err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                    <LockOutlinedIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    Register
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        id="reg-email" // Use different ID if needed
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                    />
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password (min. 6 characters)"
                        type="password"
                        id="reg-password"
                        autoComplete="new-password" // Hint for browser
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                    />
                     <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        name="confirmPassword"
                        label="Confirm Password"
                        type="password"
                        id="confirm-password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        // Add error prop for visual feedback if passwords don't match?
                        error={password !== confirmPassword && confirmPassword !== ''}
                        helperText={password !== confirmPassword && confirmPassword !== '' ? "Passwords must match" : ""}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        sx={{ mt: 3, mb: 2, position: 'relative' }}
                        disabled={isLoading}
                    >
                        {isLoading ? <CircularProgress size={24} sx={{color: 'white', position: 'absolute'}} /> : 'Register'}
                    </Button>

                     <Box sx={{ textAlign: 'right' }}>
                         <Link component={RouterLink} to="/login" variant="body2">
                            {"Already have an account? Login"}
                         </Link>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
}

export default RegisterPage;