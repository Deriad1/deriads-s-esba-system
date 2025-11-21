// Clear all marks cache (localStorage + IndexedDB)
// Run this in your browser console

async function clearAllMarksCache() {
    console.log('🧹 Starting cache cleanup...');

    // 1. Clear localStorage cache
    let localStorageCount = 0;
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('marks_') || key.startsWith('classTeacher_marks_') || key.startsWith('subjectTeacher_')) {
            localStorage.removeItem(key);
            localStorageCount++;
        }
    });
    console.log(`✅ Cleared ${localStorageCount} localStorage entries`);

    // 2. Clear IndexedDB cache
    try {
        const dbName = 'esbaDatabaseOffline'; // Correct DB name
        const request = indexedDB.open(dbName);

        request.onsuccess = function (event) {
            const db = event.target.result;
            const stores = ['marks', 'students', 'subjects', 'classes', 'teachers', 'remarks'];

            let completed = 0;

            stores.forEach(storeName => {
                if (db.objectStoreNames.contains(storeName)) {
                    const transaction = db.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const clearRequest = store.clear();

                    clearRequest.onsuccess = function () {
                        console.log(`✅ Cleared IndexedDB store: ${storeName}`);
                        completed++;
                        if (completed === stores.length) {
                            console.log('🎉 Cache cleanup complete! Please refresh the page.');
                        }
                    };
                } else {
                    completed++;
                }
            });
        };

        request.onerror = function () {
            console.error('❌ Failed to open IndexedDB');
            console.log('✅ localStorage cleared. Please refresh the page.');
        };
    } catch (error) {
        console.error('❌ IndexedDB error:', error);
        console.log('✅ localStorage cleared. Please refresh the page.');
    }
}

// Run the cleanup
clearAllMarksCache();
