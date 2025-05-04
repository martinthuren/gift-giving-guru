// FULL CODE SNIPPET: src/App.js (Basic Routing)
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios'; // Import axios

// Import Page Components (Create these files)
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PeopleListPage from './pages/PeopleListPage';
import PersonDetailPage from './pages/PersonDetailPage'; // You'll need this
import AddPersonPage from './pages/AddPersonPage'; // You'll need this
import NotFoundPage from './pages/NotFoundPage'; // Simple 404 page
import Navbar from './components/Navbar'; // Simple navigation component
import EditPersonPage from './pages/EditPersonPage'; // <-- ADD THIS IMPORT LINE
import SettingsPage from './pages/SettingsPage'; // <-- ADD THIS IMPORT LINE


// Configure Axios base URL (optional but recommended)
axios.defaults.baseURL = 'http://localhost:5000/api'; // Your backend API URL

function App() {
    const [token, setToken] = useState(localStorage.getItem('authToken')); // Check local storage on load
    const [isLoading, setIsLoading] = useState(true); // To prevent premature redirects

    // Function to set token in state and localStorage
    const handleSetToken = (newToken) => {
        if (newToken) {
            localStorage.setItem('authToken', newToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`; // Set auth header for future requests
        } else {
            localStorage.removeItem('authToken');
            delete axios.defaults.headers.common['Authorization']; // Remove auth header
        }
        setToken(newToken);
    };

     // Set auth header on initial load if token exists
     useEffect(() => {
         const storedToken = localStorage.getItem('authToken');
         if (storedToken) {
             axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
             setToken(storedToken); // Ensure state is updated
         }
         setIsLoading(false); // Finished checking token
     }, []);

      // Logout handler
      const handleLogout = () => {
          handleSetToken(null); // Clear token
          // Optionally redirect to login page or home
      };


     if (isLoading) {
         return <div>Loading...</div>; // Or a proper spinner component
     }

    return (
        <Router>
            <Navbar token={token} onLogout={handleLogout} /> {/* Pass token and logout handler */}
            <div className="container" style={{marginTop: '20px'}}> {/* Basic container */}
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
            </div>
        </Router>
    );
}

export default App;