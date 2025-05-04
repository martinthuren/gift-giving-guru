// FULL CODE SNIPPET: src/pages/RegisterPage.js (Functional)
import React, { useState } from 'react';
import axios from 'axios'; // Make sure axios is imported
import { useNavigate, Link } from 'react-router-dom'; // Import Link for Login link

// Expect onRegisterSuccess prop from App.js to handle token update
function RegisterPage({ onRegisterSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(''); // Added for confirmation
    const [error, setError] = useState(''); // To display registration errors
    const [isLoading, setIsLoading] = useState(false); // To disable form while loading
    const navigate = useNavigate(); // Hook for programmatic navigation

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default browser form submission
        setError(''); // Clear previous errors

        // Basic client-side validation
        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return; // Stop submission
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return; // Stop submission
        }

        setIsLoading(true);

        try {
            // Axios instance should have baseURL configured in App.js
            const response = await axios.post('/auth/register', {
                email: email,
                password: password
                // No need to send confirmPassword to backend typically
            });

            // Check backend response structure (adjust if necessary)
            if (response.data.status === 'success' && response.data.token) {
                // Call the function passed from App.js to update the token state immediately after register
                onRegisterSuccess(response.data.token);
                // Redirect to the dashboard after successful registration
                navigate('/dashboard');
            } else {
                // Handle cases where backend responds 200 but registration wasn't successful
                setError(response.data.message || 'Registration failed. Please try again.');
            }
        } catch (err) {
            // Handle errors (e.g., 400 Bad Request if email exists, network error)
            const message = err.response?.data?.message || 'An error occurred during registration.';
            setError(message);
            console.error('Registration error:', err.response?.data || err.message || err);
        } finally {
            // Re-enable the form whether registration succeeded or failed
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                {/* Display error message if registration fails */}
                {error && <div style={{ color: 'red', marginBottom: '10px', border: '1px solid red', padding: '8px' }}>{error}</div>}

                <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="reg-email" style={{ marginRight: '5px' }}>Email:</label>
                    <input
                        type="email"
                        id="reg-email" // Use different ID than login if needed
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        style={{ padding: '5px' }}
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="reg-password" style={{ marginRight: '5px' }}>Password:</label>
                    <input
                        type="password"
                        id="reg-password" // Use different ID
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength="6" // Add basic HTML5 validation
                        disabled={isLoading}
                        style={{ padding: '5px' }}
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="confirm-password" style={{ marginRight: '5px' }}>Confirm Password:</label>
                    <input
                        type="password"
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength="6"
                        disabled={isLoading}
                        style={{ padding: '5px' }}
                    />
                </div>
                <button type="submit" style={{ marginTop: '5px', padding: '8px 15px' }} disabled={isLoading}>
                    {isLoading ? 'Registering...' : 'Register'}
                </button>
            </form>
            <p style={{ marginTop: '15px' }}>
                Already have an account? <Link to="/login">Login here</Link> {/* Use Link component */}
            </p>
        </div>
    );
}

export default RegisterPage;