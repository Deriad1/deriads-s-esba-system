// ============================================================================
// CORRECTED VIEW SCORES FUNCTIONS - Copy and Paste These
// Add to FormMasterPage.jsx after the clearMarks function (around line 1740)
// ============================================================================

/**
 * Load marks for ALL subjects in the class (for View Scores tab)
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

        const marksDataBySubject = {};  // FIXED: Removed garbage text

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

        // Use the existing print functionality
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
