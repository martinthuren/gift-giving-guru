// FULL CODE SNIPPET: src/theme.js (Custom MUI Theme)

import { createTheme } from '@mui/material/styles';

// Your provided colors (using the DEFAULT hex values)
const bone = '#D3CFC3';
const dimGray = '#5F6461';
const silver = '#ACADA8';
const champagne = '#F3E5C9';
const gunmetal = '#2C383A';

// Create the custom theme
const theme = createTheme({
  palette: {
    // Decide which colors map to primary and secondary actions
    primary: {
      // Let's use Gunmetal as primary (for buttons, app bar?)
      main: gunmetal, // The main color shade
      contrastText: '#ffffff', // Text color on primary background (usually white/black)
      // You can optionally define light/dark variants if needed
      // light: '#4f6569', // Lighter shade from your palette
      // dark: '#1a2223',  // Darker shade from your palette
    },
    secondary: {
      // Let's use Dim Gray as secondary
      main: dimGray,
      contrastText: '#ffffff',
    },
    // Define other palette colors
    error: {
      main: '#dc3545', // Standard red for errors
    },
    warning: {
      main: '#ffc107', // Standard yellow/orange for warnings
    },
    info: {
      main: '#17a2b8', // Standard cyan/blue for info
    },
    success: {
      main: '#28a745', // Standard green for success
    },
    // Define background and text colors based on your palette
    background: {
      default: '#f6f6f3', // Use the lightest Bone shade (900) for page background? Or keep slightly off-white
      paper: '#ffffff', // Background for elements like Card, Paper (often white)
    },
    text: {
      primary: gunmetal, // Main text color (dark)
      secondary: dimGray, // Secondary text color (less emphasis)
      disabled: silver, // Disabled text color
    },
    // Add your custom colors directly if you want to access them easily
    // e.g., theme.palette.customColors.bone
    customColors: {
        bone: bone,
        dimGray: dimGray,
        silver: silver,
        champagne: champagne,
        gunmetal: gunmetal,
    }
  },
  // Optional: Customize Typography (font sizes, weights)
  typography: {
    fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif',
    h1: { fontWeight: 700, /* Add other styles */ },
    h2: { fontWeight: 700, },
    // ... customize other variants (h3, body1, button, etc.)
  },
  // Optional: Customize component defaults
  components: {
    MuiButton: {
      styleOverrides: {
        // Example: Make all contained buttons have slightly rounded corners
        // root: ({ ownerState }) => ({
        //   ...(ownerState.variant === 'contained' && {
        //     borderRadius: '8px',
        //   }),
        // }),
      }
    },
    MuiAppBar: {
        styleOverrides: {
            // Example: Ensure AppBar uses primary color
            // colorPrimary: {
            //     backgroundColor: gunmetal, // Use your primary color variable
            // }
        }
    }
    // ... customize other components (TextField, Card, etc.)
  }
});

export default theme;