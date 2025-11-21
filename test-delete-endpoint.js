// Test DELETE endpoint
// import fetch from 'node-fetch'; // Native fetch in Node 18+

const testDelete = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/marks?className=BS5&subject=History&term=First%20Term', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                // Add a test token - you'll need to replace this with a real token
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
            }
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
};

testDelete();
