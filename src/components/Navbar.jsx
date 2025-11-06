import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useOnlineOffline } from "../context/OnlineOfflineContext";

const Navbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const {
    isOnline,
    browserOnline,
    toggleOnlineMode,
    pendingChanges,
    failedChanges,
    syncOfflineChanges,
    isSyncing
  } = useOnlineOffline();

  const handleLogout = () => {
    logout();          // Clear user authentication state
    navigate("/login"); // Redirect to login page
  };

  const isFullyOnline = isOnline && browserOnline;

  return (
    <nav className="bg-gray-800 text-white p-3 md:p-4">
      <div className="flex justify-between items-center gap-2">
        <div className="font-semibold text-base md:text-lg">eSBA System</div>

        <div className="flex items-center gap-2 md:gap-4">
        {/* Online/Offline Status Indicator */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Connection Status - Hidden on mobile, toggle switch shows status */}
          <div className="hidden sm:flex items-center gap-1 md:gap-2">
            <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${isFullyOnline ? 'bg-green-500' : 'bg-yellow-500'} ${!browserOnline ? 'bg-red-500' : ''}`}></div>
            <span className="text-xs md:text-sm">
              {!browserOnline ? 'No Connection' : isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Pending Changes Badge */}
          {pendingChanges > 0 && (
            <button
              onClick={syncOfflineChanges}
              disabled={!browserOnline || isSyncing}
              className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 rounded text-xs md:text-sm ${
                isSyncing
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              title="Click to sync pending changes"
            >
              {isSyncing ? (
                <>
                  <svg className="animate-spin h-3 w-3 md:h-4 md:w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="hidden sm:inline">Syncing...</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{pendingChanges}</span>
                  {failedChanges > 0 && <span className="text-red-300 text-xs">({failedChanges})</span>}
                </>
              )}
            </button>
          )}

          {/* Online/Offline Toggle Switch - Mobile Optimized */}
          <button
            onClick={toggleOnlineMode}
            disabled={!browserOnline}
            className={`relative inline-flex items-center justify-center h-7 rounded-full w-14 transition-all duration-300 flex-shrink-0 shadow-md border-2 ${
              isOnline
                ? 'bg-green-500 border-green-400'
                : 'bg-gray-500 border-gray-400'
            } ${!browserOnline ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg active:scale-95'}`}
            style={{ minWidth: '56px', minHeight: '28px', borderRadius: '14px' }}
            title={!browserOnline ? 'No internet connection' : isOnline ? 'Switch to Offline Mode' : 'Switch to Online Mode'}
            aria-label={isOnline ? 'Switch to Offline Mode' : 'Switch to Online Mode'}
          >
            {/* Toggle Circle */}
            <span
              className={`absolute w-5 h-5 transform transition-all duration-300 bg-white rounded-full shadow-lg ${
                isOnline ? 'translate-x-3.5' : '-translate-x-3.5'
              }`}
              style={{ left: '50%', marginLeft: '-10px' }}
            />
          </button>
        </div>

        {/* Logout Button */}
        <button
          className="bg-red-600 px-2 md:px-3 py-1 rounded hover:bg-red-700 text-xs md:text-sm whitespace-nowrap"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
      </div>
    </nav>
  );
};

export default Navbar;
