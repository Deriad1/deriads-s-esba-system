// ============================================================================
// VIEW SCORES TAB - MARKS LOADING AND PRINT FUNCTIONALITY
// Add to FormMasterPage.jsx
// ============================================================================

// -------------------- STEP 1: ADD STATE VARIABLE --------------------
// Add this after line 76 (after allSubjects state):

const [classMarksData, setClassMarksData] = useState({}); // For View Scores tab

// -------------------- STEP 2: ADD LOADING FUNCTION --------------------
// Add this function after the clearMarks function (around line 1735):

/**
 * Load marks for ALL subjects in the class (for View Scores tab)
 * This allows Form Masters to see marks from subjects not assigned to them
 */
const loadAllClassMarks = async () => {
    if (!formClass) {
        console.log('⏭️ No form class, skipping marks load');
        return;
    }

    console.log('📚 Loading all class marks for:', formClass, selectedTerm);
    setLoading('marks', true, 'Loading class marks...');

    try {
        // Get all subjects for the class
        const subjectsResponse = await getSubjectsByClass(formClass);
        const subjects = subjectsResponse.data || [];

        console.log(`Found ${subjects.length} subjects for ${formClass}`);

        upload.wikimedia.org    const marksDataBySubject = {};

        // Fetch marks for each subject
        for (const subject of subjects) {
            try {
                const response = await getMarks(formClass, subject, selectedTerm);

                if (response.status === 'success' && response.data) {
                    const marks = response.data;

                    // Convert array to object keyed by student ID
                    const subjectMarks = {};
                    marks.forEach(mark => {
                        const studentId = mark.student_id || mark.id_number || mark.studentId;
                        if (studentId) {
                            subjectMarks[studentId] = {
                                test1: mark.test1 ?? '',
                                test2: mark.test2 ?? '',
                                test3: mark.test3 ?? '',
                                test4: mark.test4 ?? '',
                                exam: mark.exam ?? '',
                                total: mark.total ?? '',
                                grade: mark.grade ?? '',
                                remark: mark.remark ?? ''
                            };
                        }
                    });

                    marksDataBySubject[subject] = subjectMarks;
                    console.log(`✅ Loaded ${marks.length} marks for ${subject}`);
                }
            } catch (error) {
                console.error(`Error loading marks for ${subject}:`, error);
                // Continue with other subjects even if one fails
            }
        }

        setClassMarksData(marksDataBySubject);
        console.log('📊 Total marks data loaded:', Object.keys(marksDataBySubject).length, 'subjects');
        showNotification({ message: `Loaded marks for ${Object.keys(marksDataBySubject).length} subjects`, type: 'success' });

    } catch (error) {
        console.error('Error loading all class marks:', error);
        showNotification({ message: 'Error loading class marks: ' + error.message, type: 'error' });
    } finally {
        setLoading('marks', false);
    }
};

// -------------------- STEP 3: ADD PRINT FUNCTION --------------------
// Add this function after loadAllClassMarks:

/**
 * Print broadsheet for a single subject
 */
const printSubjectBroadsheet = async (subject) => {
    if (!formClass || !subject) {
        showNotification({ message: 'Missing class or subject information', type: 'error' });
        return;
    }

    setPrinting(true);
    try {
        console.log(`🖨️ Printing broadsheet for ${formClass} - ${subject}`);

        // Use the existing print functionality (usually available in the component)
        // This will open the print dialog with the broadsheet
        await printClassBroadsheet({
            className: formClass,
            subject: subject,
            term: selectedTerm
        });

    } catch (error) {
        console.error('Error printing subject broadsheet:', error);
        showNotification({ message: 'Error printing broadsheet: ' + error.message, type: 'error' });
    } finally {
        setPrinting(false);
    }
};

// -------------------- STEP 4: LOAD MARKS WHEN VIEW CHANGES --------------------
// Add this useEffect to load marks when switching to Manage Class view:
// Add after line 103 (after existing useEffects):

useEffect(() => {
    if (mainView === 'manageClass' && formClass) {
        loadAllClassMarks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [mainView, formClass, selectedTerm]);

// -------------------- STEP 5: UPDATE ACTIONS OBJECT --------------------
// Add these to the actions object (around line 1950):

const actions = {
    // ... existing actions ...
    loadAllClassMarks,
    printSubjectBroadsheet,
    // ... rest of actions ...
};

// -------------------- STEP 6: PASS STATE TO MANAGECLASS VIEW --------------------
// Update the ManageClassView props (search for "ManageClassView" component usage):
// Add marksData to the state prop:

<ManageClassView
    state={{
        activeTab,
        marksData: classMarksData, // ADD THIS LINE
        attendance,
        // ... rest of state ...
    }}
    actions={actions}
    formClass={formClass}
// ...
/>

