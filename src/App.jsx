import { useEffect, useState } from "react";
import { getLearners } from "./api";
import ProjectRoutes from "./Routes";
import LoginPage from "./pages/LoginPage";

function App() {
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Test API connection
    async function testConnection() {
      try {
        console.log("Testing API connection...");
        const result = await getLearners();
        console.log("API Response:", result);
        
        if (result.status === "success") {
          setLearners(result.data);
          setError("");
        } else {
          setError(`API Error: ${result.message || "Unknown error"}`);
        }
      } catch (err) {
        console.error("Connection Error:", err);
        setError(`Connection failed: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    
    testConnection();
  }, []);

  // Show connection test results
  if (loading) {
    return (
      <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <h1>eSBA System - Connection Test</h1>
        <p>Testing connection to Google Apps Script...</p>
        <p>Check browser console (F12) for detailed logs.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <h1>eSBA System - Connection Error</h1>
        <p style={{ color: "red" }}><strong>Error:</strong> {error}</p>
        <p><strong>Troubleshooting steps:</strong></p>
        <ol>
          <li>Check that your Google Apps Script is deployed as a web app</li>
          <li>Verify the API_URL in your api.js file</li>
          <li>Make sure your Google Apps Script has the updated backend code</li>
          <li>Check browser console (F12) for more details</li>
        </ol>
        <button onClick={() => window.location.reload()} style={{
          background: "#007bff", color: "white", padding: "10px 20px", 
          border: "none", borderRadius: "5px", cursor: "pointer"
        }}>
          Retry Connection
        </button>
        <hr style={{ margin: "20px 0" }} />
        <h3>Continue to Login (Offline Mode)</h3>
        <ProjectRoutes />
      </div>
    );
  }

  // Connection successful - show full app
  return (
    <div>
      <div style={{ padding: "20px", background: "#d4edda", marginBottom: "10px" }}>
        <strong>✓ API Connection Successful!</strong> Loaded {learners.length} learners.
        {learners.length === 0 && (
          <span style={{ color: "#856404" }}> (No learners in database yet - add some via Admin Dashboard)</span>
        )}
      </div>
      
      <ProjectRoutes />
    </div>
  );
}

export default App;