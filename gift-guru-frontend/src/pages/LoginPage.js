// FULL CODE SNIPPET: src/pages/LoginPage.js (Using MUI)

import React, { useState } from 'react';
import axios from 'axios'; // Make sure axios is imported and configured
import { useNavigate, Link as RouterLink } from 'react-router-dom'; // Import Link for Register link

// Import MUI Components
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link'; // MUI Link component
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'; // Optional: Login icon
import Avatar from '@mui/material/Avatar'; // Optional: For the icon

// Expect onLoginSuccess prop from App.js to handle token update
function LoginPage({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); // To display login errors
    const [isLoading, setIsLoading] = useState(false); // To disable form while loading
    const navigate = useNavigate(); // Hook for programmatic navigation

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default browser form submission
        setError('');
        setIsLoading(true);

        try {
            const response = await axios.post('/auth/login', { email, password });

            if (response.data.status === 'success' && response.data.token) {
                onLoginSuccess(response.data.token);
                navigate('/dashboard'); // Redirect after successful login
            } else {
                // Handle cases where backend responds 200 but login wasn't successful
                setError(response.data.message || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            const message = err.response?.data?.message || 'An error occurred during login.';
            setError(message);
            console.error('Login error:', err.response?.data || err.message || err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Container centers content and sets max width
        <Container component="main" maxWidth="xs"> {/* 'xs' for extra-small form width */}
            <Box
                sx={{
                    marginTop: 8, // Margin top from AppBar
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                {/* Optional Avatar with Icon */}
                <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}> {/* Use theme's secondary color */}
                    <LockOutlinedIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    Log In
                </Typography>

                {/* Display error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                        {error}
                    </Alert>
                )}

                {/* Form using Box */}
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                    <TextField
                        variant="outlined" // Common TextField style
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        autoFocus
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
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                    />
                    {/* Login Button with Loading state */}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained" // Primary button style
                        color="primary" // Use theme's primary color
                        sx={{ mt: 3, mb: 2, position: 'relative' }} // Margin top/bottom
                        disabled={isLoading}
                    >
                        {isLoading ? <CircularProgress size={24} sx={{color: 'white', position: 'absolute'}} /> : 'Log In'}
                    </Button>

                    {/* Link to Register Page */}
                     <Box sx={{ textAlign: 'right' }}>
                        <Link component={RouterLink} to="/register" variant="body2">
                            {"Don't have an account? Register here"}
                        </Link>
                     </Box>
                </Box>
            </Box>
        </Container>
    );
}

export default LoginPage;