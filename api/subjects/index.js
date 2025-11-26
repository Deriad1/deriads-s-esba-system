/**
 * API Endpoint: /api/subjects
 * Handles subject operations
 */

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // GET /api/subjects - Get all subjects
    if (req.method === 'GET') {
        try {
            // Standard list of subjects
            // In a future update, this could fetch from a database table if one is created
            const subjects = [
                { id: 1, name: 'Mathematics', code: 'MATH' },
                { id: 2, name: 'English Language', code: 'ENG' },
                { id: 3, name: 'Science', code: 'SCI' },
                { id: 4, name: 'Social Studies', code: 'SOC' },
                { id: 5, name: 'Ghanaian Language', code: 'GHA' },
                { id: 6, name: 'Religious & Moral Education', code: 'RME' },
                { id: 7, name: 'ICT', code: 'ICT' },
                { id: 8, name: 'French', code: 'FRE' },
                { id: 9, name: 'Career Technology', code: 'CT' },
                { id: 10, name: 'Creative Arts', code: 'CA' },
                { id: 11, name: 'Our World Our People', code: 'OWOP' },
                { id: 12, name: 'Physical Education', code: 'PE' },
                { id: 13, name: 'History', code: 'HIS' }
            ];

            return res.status(200).json({
                status: 'success',
                data: subjects
            });
        } catch (error) {
            console.error('Subjects API error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    return res.status(405).json({
        status: 'error',
        message: 'Method not allowed'
    });
}
