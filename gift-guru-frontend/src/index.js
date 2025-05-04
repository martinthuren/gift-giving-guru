// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client'; // Uses react-dom/client
import './index.css'; // Your main CSS
import App from './App'; // Your root App component
// import reportWebVitals from './reportWebVitals'; // Optional

// Find the root DOM element
const container = document.getElementById('root');

// Create a root.
const root = ReactDOM.createRoot(container); // Use createRoot

// Initial render
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();