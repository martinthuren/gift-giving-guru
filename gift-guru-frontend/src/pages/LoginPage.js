// FULL CODE SNIPPET: src/pages/LoginPage.js (Functional)
import React, { useState } from 'react';
import axios from 'axios'; // Make sure axios is imported
import { useNavigate, Link } from 'react-router-dom'; // Import Link for Register link

// Expect onLoginSuccess prop from App.js to handle token update
function LoginPage({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); // To display login errors
    const [isLoading, setIsLoading] = useState(false); // To disable form while loading
    const navigate = useNavigate(); // Hook for programmatic navigation

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default browser form submission
        setError(''); // Clear previous errors
        setIsLoading(true);

        try {
            // Axios instance should have baseURL configured in App.js
            const response = await axios.post('/auth/login', {
                email: email,
                password: password
            });

            // Check backend response structure (adjust if necessary)
            if (response.data.status === 'success' && response.data.token) {
                // Call the function passed from App.js to update the token state
                onLoginSuccess(response.data.token);
                // Redirect to the dashboard after successful login
                navigate('/dashboard');
            } else {
                // Handle cases where backend responds 200 but login wasn't successful (less common)
                setError(response.data.message || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            // Handle errors (e.g., 401 Unauthorized, network error)
            const message = err.response?.data?.message || 'An error occurred during login.';
            setError(message);
            console.error('Login error:', err.response?.data || err.message || err);
        } finally {
            // Re-enable the form whether login succeeded or failed
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                {/* Display error message if login fails */}
                {error && <div style={{ color: 'red', marginBottom: '10px', border: '1px solid red', padding: '8px' }}>{error}</div>}

                <div style={{ marginBottom: '10px' }}> {/* Added margin */}
                    <label htmlFor="email" style={{ marginRight: '5px' }}>Email:</label> {/* Added margin */}
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading} // Disable input when loading
                        style={{ padding: '5px' }} // Basic styling
                    />
                </div>
                <div style={{ marginBottom: '10px' }}> {/* Added margin */}
                    <label htmlFor="password" style={{ marginRight: '5px' }}>Password:</label> {/* Added margin */}
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading} // Disable input when loading
                        style={{ padding: '5px' }} // Basic styling
                    />
                </div>
                <button type="submit" style={{ marginTop: '5px', padding: '8px 15px' }} disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <p style={{ marginTop: '15px' }}>
                Don't have an account? <Link to="/register">Register here</Link> {/* Use Link component */}
            </p>
        </div>
    );
}

export default LoginPage;