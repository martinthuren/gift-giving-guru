// FULL CODE SNIPPET: src/App.js (Applying MUI Theme)

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Import MUI ThemeProvider and CssBaseline
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme'; // <-- Import your custom theme

// Import Page Components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PeopleListPage from './pages/PeopleListPage';
import PersonDetailPage from './pages/PersonDetailPage';
import AddPersonPage from './pages/AddPersonPage';
import EditPersonPage from './pages/EditPersonPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import Navbar from './components/Navbar'; // Assuming this uses MUI now

// Configure Axios base URL
axios.defaults.baseURL = 'http://localhost:5000/api';

function App() {
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const [isLoading, setIsLoading] = useState(true);

    const handleSetToken = (newToken) => {
        if (newToken) {
            localStorage.setItem('authToken', newToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        } else {
            localStorage.removeItem('authToken');
            delete axios.defaults.headers.common['Authorization'];
        }
        setToken(newToken);
    };

    useEffect(() => {
         const storedToken = localStorage.getItem('authToken');
         if (storedToken) {
             axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
             setToken(storedToken);
         }
         setIsLoading(false);
     }, []);

    const handleLogout = () => {
          handleSetToken(null);
          // No need to navigate here, Navbar can handle it
    };

    if (isLoading) {
         return <div>Loading...</div>; // Or an MUI spinner: <CircularProgress />
    }

    return (
        // Apply the theme to the entire application
        <ThemeProvider theme={theme}>
             {/* CssBaseline kickstarts an elegant, consistent baseline */}
            <CssBaseline />
            <Router>
                <Navbar token={token} onLogout={handleLogout} />
                 {/* No need for the extra 'container' div, MUI components handle layout */}
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={!token ? <LoginPage onLoginSuccess={handleSetToken} /> : <Navigate to="/dashboard" />} />
                    <Route path="/register" element={!token ? <RegisterPage onRegisterSuccess={handleSetToken} /> : <Navigate to="/dashboard" />} />

                    {/* Protected Routes */}
                    <Route path="/dashboard" element={token ? <DashboardPage /> : <Navigate to="/login" />} />
                    <Route path="/people" element={token ? <PeopleListPage /> : <Navigate to="/login" />} />
                     <Route path="/people/add" element={token ? <AddPersonPage /> : <Navigate to="/login" />} />
                     <Route path="/people/:id" element={token ? <PersonDetailPage /> : <Navigate to="/login" />} />
                     <Route path="/people/:id/edit" element={token ? <EditPersonPage /> : <Navigate to="/login" />} />
                     <Route path="/settings" element={token ? <SettingsPage /> : <Navigate to="/login" />} />

                    {/* Redirect root path */}
                    <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} />} />

                    {/* 404 Not Found */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;