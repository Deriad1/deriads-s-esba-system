const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

(async () => {
  try {
    console.log('Checking for subject-related tables...');
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%subject%'
    `;
    console.log('Subject-related tables:', JSON.stringify(tables, null, 2));

    // Also check for class_subjects specifically
    const classSubjects = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'class_subjects'
      )
    `;
    console.log('\nclass_subjects table exists:', classSubjects[0].exists);

    // If it exists, check the structure
    if (classSubjects[0].exists) {
      const columns = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'class_subjects'
      `;
      console.log('\nclass_subjects columns:', JSON.stringify(columns, null, 2));

      // Get sample data
      const data = await sql`SELECT * FROM class_subjects LIMIT 5`;
      console.log('\nSample data:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
})();
