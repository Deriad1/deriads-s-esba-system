/**
 * MARKS MANAGEMENT FUNCTIONS FOR FORM MASTER PAGE
 * 
 * Instructions:
 * 1. First, update the imports at line 4 to include deleteMarks and getCustomAssessmentScores:
 *    
 *    import { getLearners, updateFormMasterRemarks, getMarks, updateStudentScores, 
 *             getClassPerformanceTrends, getClassSubjects, getStudentsByClass, 
 *             getCustomAssessments, getCustomAssessmentScores, saveCustomAssessmentScores, 
 *             getTeachers, getClasses, getSubjects, deleteMarks } from '../api-client';
 * 
 * 2. Copy the two functions below (loadMarksFromDatabase and clearMarks)
 * 
 * 3. Paste them in FormMasterPage.jsx after the loadSubjectMarks function (around line 1546)
 *    Right after the closing brace of loadSubjectMarks, before the comment:
 *    "// Auto-load marks when class, subject, and assessment are selected"
 * 
 * 4. Add these functions to the actions object (around line 1750):
 *    In the actions object, add:
 *      loadMarksFromDatabase,
 *      clearMarks,
 *    to the "Enter Scores handlers" section
 * 
 * 5. The EnterScoresView component will automatically receive these via props
 */

// ==================== FUNCTION 1: LOAD MARKS FROM DATABASE ====================

// Load saved marks from database with caching (explicit load button)
const loadMarksFromDatabase = async () => {
    if (!selectedClass || !selectedSubject || !selectedAssessment) {
        showNotification({ message: "Please select class, subject, and assessment first", type: 'warning' });
        return;
    }

    setLoading('marks', true, 'Loading saved marks from database...');
    try {
        // Check localStorage cache first for instant loading
        const cacheKey = `formMaster_marks_${selectedClass}_${selectedSubject}_${selectedAssessment}_${selectedTerm}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
            try {
                const parsed = JSON.parse(cachedData);
                const cacheAge = Date.now() - parsed.timestamp;
                const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

                // If cache is fresh and matches current term, use it immediately
                if (cacheAge < CACHE_DURATION && parsed.term === selectedTerm) {
                    setSubjectMarks(parsed.marks);
                    setSavedStudents(new Set(Object.keys(parsed.marks).filter(id => {
                        const marks = parsed.marks[id];
                        return Object.values(marks).some(v => v && v !== "");
                    })));
                    showNotification({ message: "Loaded from cache (refreshing from database...)", type: 'info', duration: 2000 });
                }
            } catch (e) {
                console.warn("Cache parse error:", e);
            }
        }

        // Then fetch from database
        const isCustomAssessment = selectedAssessment !== 'regular';
        let response;

        if (isCustomAssessment) {
            response = await getCustomAssessmentScores(parseInt(selectedAssessment), selectedClass, selectedSubject);
        } else {
            response = await getMarks(selectedClass, selectedSubject, selectedTerm);
        }

        if (response.status === 'success') {
            const data = response.data || [];
            const newMarks = {};
            const savedSet = new Set();

            // Initialize empty marks for all students
            filteredLearners.forEach(learner => {
                const studentId = learner.idNumber || learner.LearnerID;
                if (isCustomAssessment) {
                    newMarks[studentId] = { score: "" };
                } else {
                    newMarks[studentId] = {
                        test1: "", test2: "", test3: "", test4: "", exam: ""
                    };
                }
            });

            // Populate with database marks
            data.forEach(mark => {
                const studentId = mark.studentId || mark.student_id || mark.id_number;
                if (newMarks[studentId]) {
                    if (isCustomAssessment) {
                        newMarks[studentId] = { score: mark.score ?? "" };
                        if (mark.score) savedSet.add(studentId);
                    } else {
                        newMarks[studentId] = {
                            test1: mark.test1 ?? "",
                            test2: mark.test2 ?? "",
                            test3: mark.test3 ?? "",
                            test4: mark.test4 ?? "",
                            exam: mark.exam ?? ""
                        };
                        const hasMarks = mark.test1 || mark.test2 || mark.test3 || mark.test4 || mark.exam;
                        if (hasMarks) savedSet.add(studentId);
                    }
                }
            });

            setSubjectMarks(newMarks);
            setSavedStudents(savedSet);

            // Cache the marks
            localStorage.setItem(cacheKey, JSON.stringify({
                marks: newMarks,
                timestamp: Date.now(),
                term: selectedTerm
            }));

            showNotification({ message: 'Marks loaded successfully from database!', type: 'success' });
        } else {
            throw new Error(response.message || 'Failed to load marks');
        }
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

// ==================== ACTIONS OBJECT UPDATE ====================

/*
 * Add these two lines to the actions object (around line 1750):
 * 
 * Find the section that says "// Enter Scores handlers" and add:
 * 
 *   // Enter Scores handlers
 *   setSelectedClass,
 *   setSelectedSubject,
 *   setSelectedAssessment,
 *   handleScoreChange: handleSubjectMarkChange,
 *   saveScore: saveStudentScores,
 *   saveAllScores: saveAllSubjectScores,
 *   loadMarks: loadSubjectMarks,
 *   loadMarksFromDatabase,    // <-- ADD THIS LINE
 *   clearMarks,                // <-- ADD THIS LINE
 * 
 */
