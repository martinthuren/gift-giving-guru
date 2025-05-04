// FULL CODE SNIPPET: src/components/Navbar.js (using MUI)

import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom'; // Use RouterLink for react-router

// Import MUI components
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link'; // MUI Link component
import IconButton from '@mui/material/IconButton'; // For potential icon buttons later
import SettingsIcon from '@mui/icons-material/Settings'; // Example icon
import CakeIcon from '@mui/icons-material/Cake'; // Example icon for title

function Navbar({ token, onLogout }) {
    const navigate = useNavigate();

    const handleLogoutClick = () => {
        onLogout(); // Call the logout function passed from App.js
        navigate('/login'); // Redirect to login after logout
    };

    return (
        // AppBar provides the main bar structure
        <AppBar position="static"> {/* Or "fixed", "sticky" etc. */}
            <Toolbar>
                {/* Left Side: Title */}
                {/* Use MUI Link component that internally uses RouterLink */}
                <Link
                    component={RouterLink} // Use react-router's Link for navigation
                    to="/"
                    sx={{ // sx prop for inline styling overrides
                        color: 'inherit', // Inherit color from AppBar (white)
                        textDecoration: 'none', // Remove underline
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <CakeIcon sx={{ mr: 1 }} /> {/* Margin right */}
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Gift Guru
                    </Typography>
                </Link>

                {/* Box component to push subsequent items to the right */}
                <Box sx={{ flexGrow: 1 }} />

                {/* Right Side: Links/Buttons */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}> {/* gap adds space */}
                    {token ? (
                        <>
                            <Button color="inherit" component={RouterLink} to="/dashboard">Dashboard</Button>
                            <Button color="inherit" component={RouterLink} to="/people">People</Button>
                            <Button color="inherit" component={RouterLink} to="/settings">Settings</Button>
                            <Button variant="contained" color="secondary" onClick={handleLogoutClick}>
                                Logout
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button color="inherit" component={RouterLink} to="/login">Login</Button>
                            <Button color="inherit" component={RouterLink} to="/register">Register</Button>
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default Navbar;