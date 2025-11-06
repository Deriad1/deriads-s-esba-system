import React from 'react';

/**
 * Archive List Component with Search and Comparison Features
 */
const ArchiveList = ({
  archives,
  searchTerm,
  setSearchTerm,
  selectedForComparison,
  onViewArchive,
  onDeleteArchive,
  onShowCharts,
  onToggleCompare,
  onCompare,
  onRestoreArchive
}) => {
  const filteredArchives = archives.filter(archive =>
    archive.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    archive.academicYear.includes(searchTerm)
  );

  const isSelected = (archiveId) => {
    return selectedForComparison.some(a => a.id === archiveId);
  };

  if (archives.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-bold text-white mb-2">No Archives Found</h3>
        <p className="text-white/80">No terms have been archived yet.</p>
        <p className="text-sm text-white/70 mt-2">
          Go to School Setup to archive completed terms.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Search and Compare Bar */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by term or year..."
            className="w-full pl-10 pr-4 py-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/10 text-white placeholder-white/60"
            style={{ minHeight: '48px' }}
          />
          <svg
            className="absolute left-3 top-4 w-5 h-5 text-white/60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Compare Button */}
        {selectedForComparison.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/90 font-semibold">
              {selectedForComparison.length} selected
            </span>
            <button
              onClick={onCompare}
              disabled={selectedForComparison.length < 2}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
              style={{ minHeight: '44px' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Compare Terms
            </button>
          </div>
        )}
      </div>

      {/* Archives Grid */}
      {filteredArchives.length === 0 ? (
        <div className="text-center py-8 text-white/90 font-semibold">
          No archives match your search
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArchives.map(archive => (
            <div
              key={archive.id}
              className={`border-2 rounded-xl p-4 transition-all backdrop-blur-md ${
                isSelected(archive.id)
                  ? 'border-purple-400 bg-purple-500/20 shadow-lg'
                  : 'border-white/30 bg-white/10 hover:shadow-lg hover:bg-white/20'
              }`}
            >
              {/* Header with Checkbox */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={isSelected(archive.id)}
                    onChange={() => onToggleCompare(archive)}
                    className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-purple-500 flex-shrink-0 cursor-pointer"
                    style={{ minWidth: '20px', minHeight: '20px' }}
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-white">{archive.term}</h3>
                    <p className="text-sm text-white/80">{archive.academicYear}</p>
                  </div>
                </div>
                <span className="bg-blue-500/80 text-white text-xs px-2 py-1 rounded border border-white/30 font-semibold">
                  Archive
                </span>
              </div>

              {/* Statistics */}
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-white/80">Marks:</span>
                  <span className="font-semibold text-white">{archive.counts.marks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80">Remarks:</span>
                  <span className="font-semibold text-white">{archive.counts.remarks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80">Students:</span>
                  <span className="font-semibold text-white">{archive.counts.students}</span>
                </div>
                <div className="border-t border-white/20 pt-2 mt-2">
                  <span className="text-white/70 text-xs">
                    Archived: {new Date(archive.archivedDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onViewArchive(archive)}
                  className="px-3 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-1 font-semibold border-2 border-white/30 active:scale-95"
                  style={{ minHeight: '44px' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View
                </button>
                <button
                  onClick={() => onShowCharts(archive)}
                  className="px-3 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-1 font-semibold border-2 border-white/30 active:scale-95"
                  style={{ minHeight: '44px' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Charts
                </button>
              </div>

              {/* Restore Button */}
              <button
                onClick={() => onRestoreArchive(archive)}
                className="mt-2 w-full px-3 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center gap-1 font-semibold border-2 border-white/30 active:scale-95"
                style={{ minHeight: '44px' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Restore
              </button>

              {/* Delete Button */}
              <button
                onClick={() => onDeleteArchive(archive.id)}
                className="mt-2 w-full px-3 py-3 bg-red-600/80 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center justify-center gap-1 font-semibold border-2 border-white/30 active:scale-95"
                style={{ minHeight: '44px' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Archive
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArchiveList;
