/**
 * CORRECTED CLEARMARKS PLACEMENT FIX
 * 
 * INSTRUCTIONS:
 * 1. Find line 1647-1648 in FormMasterPage.jsx which says:
 *      } finally {
 *        setLoading('marks', false);
 * 
 * 2. DELETE everything from line 1649 to line 1701 (the nested clearMarks function)
 * 
 * 3. Replace those lines with JUST the closing braces:
 *      }
 *    };
 * 
 * 4. Then AFTER that (around line 1650), PASTE the clearMarks function below as a SEPARATE function
 * 
 * ==================== WHAT TO DELETE ====================
 * Delete from line 1649 to line 1701:
 * (Everything from the comment "// ==================== FUNCTION 2: CLEAR MARKS" 
 *  to the closing brace before "// Auto-load marks")
 * 
 * ==================== WHAT THE END OF loadMarksFromDatabase SHOULD LOOK LIKE ====================
 */

    } catch (error) {
    console.error("Error loading marks from database:", error);
    showNotification({ message: `Error loading marks: ${error.message}`, type: 'error' });
} finally {
    setLoading('marks', false);
}
  };

// ==================== FUNCTION 2: CLEAR MARKS ====================

// Clear all marks for the selected class, subject, and term
const clearMarks = async () => {
    if (!selectedClass || !selectedSubject || !selectedTerm) {
        showNotification({ message: "Please select class, subject, and term first", type: 'error' });
        return;
    }

    // Confirm deletion
    const confirmed = window.confirm(
        `⚠️ WARNING: This will permanently delete ALL marks for:\n\n` +
        `Class: ${selectedClass}\n` +
        `Subject: ${selectedSubject}\n` +
        `Term: ${selectedTerm}\n\n` +
        `This action CANNOT be undone!\n\n` +
        `Are you absolutely sure?`
    );

    if (!confirmed) return;

    setSavingScores(true);
    try {
        const response = await deleteMarks(selectedClass, selectedSubject, selectedTerm);

        if (response.status === 'success') {
            // Clear marks state
            const emptyMarks = {};
            const isCustomAssessment = selectedAssessment !== 'regular';

            filteredLearners.forEach(learner => {
                const studentId = learner.idNumber || learner.LearnerID;
                if (isCustomAssessment) {
                    emptyMarks[studentId] = { score: "" };
                } else {
                    emptyMarks[studentId] = {
                        test1: "", test2: "", test3: "", test4: "", exam: ""
                    };
                }
            });

            setSubjectMarks(emptyMarks);
            setSavedStudents(new Set());

            // Clear cache
            const cacheKey = `formMaster_marks_${selectedClass}_${selectedSubject}_${selectedAssessment}_${selectedTerm}`;
            localStorage.removeItem(cacheKey);

            showNotification({ message: `Marks cleared successfully for ${selectedSubject}!`, type: 'success' });
        } else {
            showNotification({ message: `Error clearing marks: ${response.message}`, type: 'error' });
        }
    } catch (error) {
        console.error("Clear marks error:", error);
        showNotification({ message: `Error clearing marks: ${error.message}`, type: 'error' });
    } finally {
        setSavingScores(false);
    }
};

// Auto-load marks when class, subject, and assessment are selected

/**
 * ==================== SUMMARY ====================
 * 
 * After the fix, the structure should be:
 * 
 * const loadMarksFromDatabase = async () => {
 *   // ... loadMarksFromDatabase code ...
 * };  // <-- ends here
 * 
 * const clearMarks = async () => {
 *   // ... clearMarks code ...
 * };  // <-- separate function
 * 
 * // Auto-load marks when class...
 * useEffect(() => {
 *   ...
 * });
 */
