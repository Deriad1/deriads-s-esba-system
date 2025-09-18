# Enhanced Notification & Loading Systems - Usability Guide

This guide explains how to use the new enhanced notification and loading systems that have been implemented in the application.

## 1. Notification System

The new notification system provides enhanced features including:
- Auto-dismiss functionality with configurable timeouts
- Different styles for different notification types (success, error, warning, info)
- Action buttons in notifications (e.g., "Undo" for destructive actions)

### How to Use

1. **Import the notification hook** in your component:
```javascript
import { useNotification } from '../context/NotificationContext';
```

2. **Use the hook** in your component:
```javascript
const { showNotification } = useNotification();
```

3. **Show notifications** with various options:

```javascript
// Success notification
showNotification({
  title: "Success!",
  message: "Operation completed successfully.",
  type: "success",
  duration: 3000 // Auto-dismiss after 3 seconds
});

// Error notification
showNotification({
  title: "Error!",
  message: "Something went wrong. Please try again.",
  type: "error",
  duration: 5000 // Auto-dismiss after 5 seconds
});

// Warning notification
showNotification({
  title: "Warning",
  message: "This is a warning message.",
  type: "warning",
  duration: 4000 // Auto-dismiss after 4 seconds
});

// Info notification
showNotification({
  title: "Information",
  message: "Here's some useful information.",
  type: "info",
  duration: 3000 // Auto-dismiss after 3 seconds
});

// Notification with action button
showNotification({
  title: "Action Required",
  message: "You have a pending action that needs attention.",
  type: "info",
  duration: 0, // No auto-dismiss
  action: {
    label: "View Details",
    onClick: () => {
      // Handle action click
      console.log("Action button clicked!");
    }
  }
});
```

### Notification Options

- `title` (optional): Title for the notification
- `message` (required): Main message content
- `type` (required): Type of notification (success, error, warning, info)
- `duration` (optional): Time in milliseconds before auto-dismiss (0 for no auto-dismiss)
- `action` (optional): Action button configuration
  - `label`: Text for the action button
  - `onClick`: Function to call when action button is clicked

## 2. Loading System

The new loading system provides granular loading states for different operations instead of a generic loading spinner.

### How to Use

1. **Import the loading hook** in your component:
```javascript
import { useLoading } from '../context/LoadingContext';
```

2. **Use the hook** in your component:
```javascript
const { setLoading, isLoading, getLoadingMessage } = useLoading();
```

3. **Set loading states** for different operations:

```javascript
// Start loading with a specific key and message
setLoading('userCreation', true, 'Creating user...');

// Perform async operation
await createUser(userData);

// Stop loading
setLoading('userCreation', false);

// Check if a specific operation is loading
const isUserCreationLoading = isLoading('userCreation');

// Get the current loading message
const loadingMessage = getLoadingMessage('userCreation');
```

### Loading Functions

- `setLoading(key, isLoading, message)`: Set loading state for a specific key
- `isLoading(key)`: Check if a specific operation is loading
- `getLoadingMessage(key)`: Get the current loading message for a specific operation
- `clearLoading(key)`: Clear loading state for a specific key

## 3. Loading Spinner Component

A reusable loading spinner component is available with different sizes.

### How to Use

1. **Import the component**:
```javascript
import LoadingSpinner from '../components/LoadingSpinner';
```

2. **Use the component**:
```javascript
// Small spinner
<LoadingSpinner message="Loading..." size="sm" />

// Medium spinner (default)
<LoadingSpinner message="Processing..." size="md" />

// Large spinner
<LoadingSpinner message="Please wait..." size="lg" />
```

### LoadingSpinner Props

- `message` (optional): Text to display next to the spinner
- `size` (optional): Size of the spinner (sm, md, lg)

## 4. Example Implementation

Here's a complete example of how to use both systems together:

```javascript
import React from "react";
import { useNotification } from '../context/NotificationContext';
import { useLoading } from '../context/LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';

const ExampleComponent = () => {
  const { showNotification } = useNotification();
  const { setLoading, isLoading, getLoadingMessage } = useLoading();
  const loadingKey = "dataProcessing";

  const handleProcessData = async () => {
    try {
      // Start loading
      setLoading(loadingKey, true, "Processing your data...");
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Show success notification
      showNotification({
        title: "Success!",
        message: "Data processed successfully.",
        type: "success"
      });
    } catch (error) {
      // Show error notification
      showNotification({
        title: "Error!",
        message: "Failed to process data: " + error.message,
        type: "error"
      });
    } finally {
      // Stop loading
      setLoading(loadingKey, false);
    }
  };

  // Show loading spinner when processing
  if (isLoading(loadingKey)) {
    return <LoadingSpinner message={getLoadingMessage(loadingKey)} size="md" />;
  }

  return (
    <div>
      <h1>Example Component</h1>
      <button 
        onClick={handleProcessData}
        disabled={isLoading(loadingKey)}
      >
        {isLoading(loadingKey) ? "Processing..." : "Process Data"}
      </button>
    </div>
  );
};

export default ExampleComponent;
```

## 5. Demo Page

A demo page is available at `/notification-demo` that showcases all the features of the new notification and loading systems.

## 6. Existing Components Updated

The following components have been updated to use the new systems:
- Notification display component
- Loading overlay component
- Context providers in App.jsx

## 7. Benefits of the New Systems

1. **Better User Experience**: Users get specific feedback about what operation is in progress
2. **Flexible Notifications**: Notifications can include action buttons and have configurable timeouts
3. **Granular Loading States**: Different operations can have their own loading states
4. **Consistent Design**: All notifications follow the same design language
5. **Easy to Use**: Simple API that's consistent across the application