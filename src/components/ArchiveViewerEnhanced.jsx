import React, { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import ArchiveList from './archive/ArchiveList';
import ArchiveDetails from './archive/ArchiveDetails';
import ArchiveComparison from './archive/ArchiveComparison';
import ArchiveCharts from './archive/ArchiveCharts';
import RestoreArchiveModal from './archive/RestoreArchiveModal';

/**
 * Enhanced Archive Viewer with Advanced Features:
 * - PDF Export
 * - Term Comparison
 * - Search Functionality
 * - Restore Function
 * - Delete Archives
 * - Charts & Graphs
 */
const ArchiveViewerEnhanced = ({ isOpen, onClose }) => {
  const { showNotification } = useNotification();
  const [archives, setArchives] = useState([]);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [archiveDetails, setArchiveDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'details', 'compare', 'charts'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [archiveToRestore, setArchiveToRestore] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadArchives();
    }
  }, [isOpen]);

  const loadArchives = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/archives');
      const result = await response.json();

      if (result.status === 'success') {
        setArchives(result.data);
      } else {
        throw new Error(result.message || 'Failed to load archives');
      }
    } catch (error) {
      console.error('Error loading archives:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load archived terms: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const loadArchiveDetails = async (archiveId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/archives?archiveId=${archiveId}`);
      const result = await response.json();

      if (result.status === 'success') {
        setArchiveDetails(result.data);
        setViewMode('details');
      } else {
        throw new Error(result.message || 'Failed to load archive details');
      }
    } catch (error) {
      console.error('Error loading archive details:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load archive details: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewArchive = (archive) => {
    setSelectedArchive(archive);
    loadArchiveDetails(archive.id);
  };

  const handleDeleteArchive = async (archiveId) => {
    if (!confirm('Are you sure you want to delete this archive? The marks and remarks data will be preserved in the database.')) {
      return;
    }

    try {
      const response = await fetch(`/api/archives?id=${archiveId}`, {
        method: 'DELETE'
      });
      const result = await response.json();

      if (result.status === 'success') {
        showNotification({
          type: 'success',
          title: 'Archive Deleted',
          message: 'Archive has been deleted successfully'
        });
        loadArchives();
        if (selectedArchive?.id === archiveId) {
          handleBackToList();
        }
      } else {
        throw new Error(result.message || 'Failed to delete archive');
      }
    } catch (error) {
      console.error('Error deleting archive:', error);
      showNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete archive: ' + error.message
      });
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedArchive(null);
    setArchiveDetails(null);
    setSelectedForComparison([]);
  };

  const toggleCompareSelection = (archive) => {
    setSelectedForComparison(prev => {
      const exists = prev.find(a => a.id === archive.id);
      if (exists) {
        return prev.filter(a => a.id !== archive.id);
      } else {
        if (prev.length >= 3) {
          showNotification({
            type: 'warning',
            title: 'Comparison Limit',
            message: 'You can only compare up to 3 terms at once'
          });
          return prev;
        }
        return [...prev, archive];
      }
    });
  };

  const handleCompareTerms = () => {
    if (selectedForComparison.length < 2) {
      showNotification({
        type: 'warning',
        title: 'Select More Terms',
        message: 'Please select at least 2 terms to compare'
      });
      return;
    }
    setViewMode('compare');
  };

  const handleShowCharts = (archive) => {
    setSelectedArchive(archive);
    loadArchiveDetails(archive.id);
    setViewMode('charts');
  };

  const handleRestoreArchive = (archive) => {
    setArchiveToRestore(archive);
    setRestoreModalOpen(true);
  };

  const handleRestoreComplete = () => {
    loadArchives();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] overflow-y-auto flex items-center justify-center p-4">
        <div className="glass-card-golden rounded-xl shadow-2xl w-full max-w-7xl my-8 border-2 border-white/30 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b-4 border-yellow-500/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/90 to-blue-600/90 backdrop-blur-sm flex items-center justify-center text-white text-2xl shadow-lg border-2 border-white/50">
              📦
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white text-shadow">
                {viewMode === 'list' && 'Archived Terms'}
                {viewMode === 'details' && `Archive: ${selectedArchive?.term} (${selectedArchive?.academicYear})`}
                {viewMode === 'compare' && 'Compare Terms'}
                {viewMode === 'charts' && `Analytics: ${selectedArchive?.term} (${selectedArchive?.academicYear})`}
              </h2>
              <p className="text-sm text-white/90 mt-1">
                {viewMode === 'list' && 'View, compare, and analyze historical term data'}
                {viewMode === 'details' && 'Viewing archived marks and remarks'}
                {viewMode === 'compare' && `Comparing ${selectedForComparison.length} terms`}
                {viewMode === 'charts' && 'Visual performance analytics'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-white/80 text-2xl font-bold p-2 hover:bg-white/20 rounded-xl transition-colors"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            ×
          </button>
        </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
                  <p className="mt-4 text-white font-bold">Loading...</p>
                </div>
              </div>
            ) : (
              <>
                {viewMode === 'list' && (
                  <ArchiveList
                    archives={archives}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedForComparison={selectedForComparison}
                    onViewArchive={handleViewArchive}
                    onDeleteArchive={handleDeleteArchive}
                    onShowCharts={handleShowCharts}
                    onToggleCompare={toggleCompareSelection}
                    onCompare={handleCompareTerms}
                    onRestoreArchive={handleRestoreArchive}
                  />
                )}

                {viewMode === 'details' && archiveDetails && (
                  <ArchiveDetails
                    archive={selectedArchive}
                    details={archiveDetails}
                    onBack={handleBackToList}
                    onDelete={() => handleDeleteArchive(selectedArchive.id)}
                  />
                )}

                {viewMode === 'compare' && (
                  <ArchiveComparison
                    selectedArchives={selectedForComparison}
                    onBack={handleBackToList}
                  />
                )}

                {viewMode === 'charts' && archiveDetails && (
                  <ArchiveCharts
                    archive={selectedArchive}
                    details={archiveDetails}
                    onBack={handleBackToList}
                  />
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t-4 border-yellow-500/50 flex-shrink-0">
            {viewMode !== 'list' && (
              <button
                onClick={handleBackToList}
                className="px-6 py-3 bg-white/20 border-2 border-white/30 hover:bg-white/30 text-white rounded-xl font-semibold transition-all backdrop-blur-md shadow-md"
                style={{ minHeight: '44px', minWidth: '120px' }}
              >
                ← Back to Archives
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-gray-500/90 to-gray-600/90 border-2 border-white/50 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all font-bold shadow-lg backdrop-blur-md"
              style={{ minHeight: '44px', minWidth: '100px' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Restore Archive Modal */}
      {restoreModalOpen && archiveToRestore && (
        <RestoreArchiveModal
          archive={archiveToRestore}
          onClose={() => setRestoreModalOpen(false)}
          onRestoreComplete={handleRestoreComplete}
        />
      )}
    </>
  );
};

export default ArchiveViewerEnhanced;
