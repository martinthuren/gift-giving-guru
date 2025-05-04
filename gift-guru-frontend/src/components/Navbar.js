// FULL CODE SNIPPET: src/components/Navbar.js (Placeholder)
import React from 'react';
import { Link } from 'react-router-dom'; // Use Link for internal navigation

// Receive token and onLogout function as props from App.js
function Navbar({ token, onLogout }) {
    return (
        <nav style={{ background: '#eee', padding: '10px', marginBottom: '20px' }}>
            <Link to="/" style={{ marginRight: '15px' }}>Gift Guru</Link>

            {token ? (
                <>
                    <Link to="/dashboard" style={{ marginRight: '10px' }}>Dashboard</Link>
                    <Link to="/people" style={{ marginRight: '10px' }}>People</Link>
                    <Link to="/settings" style={{ marginRight: '15px' }}>Settings</Link> {/* <-- ADD THIS LINK */}
                    <button onClick={onLogout}>Logout</button>
                </>
            ) : (
                <>
                    <Link to="/login" style={{ marginRight: '10px' }}>Login</Link>
                    <Link to="/register">Register</Link>
                </>
            )}
        </nav>
    );
}

export default Navbar;