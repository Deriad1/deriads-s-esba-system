# 🚀 Production Deployment Checklist

Complete guide for deploying DERIAD's eSBA System to production.

---

## 📋 **Pre-Deployment Checklist**

### 1. **Environment Variables**
```bash
# Copy .env.example to .env
cp .env.example .env

# Set these variables in Vercel/Production:
POSTGRES_URL=          # Your Neon database URL
POSTGRES_PRISMA_URL=   # Same as POSTGRES_URL
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
JWT_SECRET=            # Generate: openssl rand -base64 32
VITE_APP_URL=         # Your production URL
```

### 2. **Clean Up Development Files**
Files to EXCLUDE from production (add to `.gitignore`):

```
# Development & Documentation
*.md (except README.md)
*.sql
*.js (root level development scripts)
*.zip
.claude/
server/
dev-server.js
create-godmode-user.js
create-production-admin.js
test-*.js
fix-*.js
check-*.js
```

### 3. **Security Checklist**
- [ ] Remove all godmode users from database
- [ ] Change all default passwords
- [ ] Verify JWT_SECRET is strong and unique
- [ ] Ensure .env is in .gitignore
- [ ] Remove console.log statements (production)
- [ ] Enable HTTPS only
- [ ] Set secure cookie settings

---

## 🔧 **Deployment Steps**

### **Step 1: Deploy to Vercel**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

Or use Vercel Dashboard:
1. Connect your GitHub repo
2. Import project
3. Configure environment variables
4. Deploy

### **Step 2: Verify Database Connection**

After deployment, check that your Neon database is accessible:
1. Go to your Vercel deployment URL
2. Open browser console
3. Check for database connection errors

### **Step 3: Create Initial Admin User**

You have **3 options** to create your first admin:

---

## 🔐 **OPTION 1: Using the Production Admin Script (RECOMMENDED)**

### From Your Local Machine:

```bash
# Make sure .env has production database credentials
npm run setup:admin
```

Follow the prompts:
```
Enter admin first name: John
Enter admin last name: Doe
Enter admin email: admin@yourschool.com
Enter admin password: [Strong password]
Confirm password: [Same password]
```

**✅ Pros:**
- Interactive and safe
- Validates input
- Secure password hashing
- No plain text passwords

**📝 Example:**
```bash
$ npm run setup:admin

═══════════════════════════════════════════════
🚀 PRODUCTION ADMIN USER SETUP
═══════════════════════════════════════════════

Enter admin first name: John
Enter admin last name: Administrator
Enter admin email: john.admin@school.com
Enter admin password: SecurePass2025!
Confirm password: SecurePass2025!

🔄 Creating admin user...

✅ Production admin user created successfully!

═══════════════════════════════════════════════
📋 ADMIN LOGIN CREDENTIALS
═══════════════════════════════════════════════
📧 Email:    john.admin@school.com
👤 Name:     John Administrator
🔑 Password: [Secure - You entered this]
═══════════════════════════════════════════════

✨ Admin Features:
   • Full access to Admin Dashboard
   • Manage teachers and students
   • Access to all system features
   • Can create additional users

💡 You can now login at: your-production-url.com

⚠️  IMPORTANT: Store these credentials securely!
   This is the only time the password is displayed.
```

---

## 🔐 **OPTION 2: Using SQL in Neon Console**

### Generate Password Hash First:

```bash
# Option A: Using Node.js
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourPassword123', 10).then(console.log)"

# Option B: Online (use secure site)
# Visit: https://bcrypt-generator.com/
# Rounds: 10
```

### Run SQL in Neon Dashboard:

1. Go to Neon Dashboard → Your Project → SQL Editor
2. Use the SQL from `create-admin-user.sql`:

```sql
INSERT INTO teachers (
  first_name,
  last_name,
  email,
  password,
  gender,
  teacher_primary_role,
  all_roles,
  classes,
  subjects,
  term,
  academic_year,
  requires_password_change
) VALUES (
  'Admin',
  'User',
  'admin@yourschool.com',
  '$2a$10$YOUR_BCRYPT_HASH_HERE',  -- Replace with your hash
  'male',
  'admin',
  ARRAY['admin', 'head_teacher']::text[],
  ARRAY[]::text[],
  ARRAY[]::text[],
  'First Term',
  '2024/2025',
  false
);
```

3. Verify:
```sql
SELECT id, email, teacher_primary_role, all_roles
FROM teachers
WHERE email = 'admin@yourschool.com';
```

**✅ Pros:**
- Works directly in database
- No need for local setup
- Can be done from anywhere

---

## 🔐 **OPTION 3: Using Vercel Serverless Function (API)**

### Create a temporary setup endpoint:

Create `api/setup-admin.js`:

```javascript
import bcrypt from 'bcryptjs';
import { sql } from './lib/db.js';

export default async function handler(req, res) {
  // SECURITY: Add authentication or delete after use!
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields required' });
    }

    // Check if user exists
    const existing = await sql`
      SELECT id FROM teachers WHERE email = ${email}
    `;

    if (existing.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create admin
    const hashedPassword = await bcrypt.hash(password, 10);

    await sql`
      INSERT INTO teachers (
        first_name, last_name, email, password,
        gender, teacher_primary_role, all_roles,
        classes, subjects, term, academic_year
      ) VALUES (
        ${firstName}, ${lastName}, ${email}, ${hashedPassword},
        'male', 'admin', ARRAY['admin', 'head_teacher']::text[],
        ARRAY[]::text[], ARRAY[]::text[], 'First Term', '2024/2025'
      )
    `;

    return res.status(200).json({
      success: true,
      message: 'Admin created successfully'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

### Call the API:

```bash
curl -X POST https://your-app.vercel.app/api/setup-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.com",
    "password": "SecurePass2025!",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

**⚠️ IMPORTANT: DELETE this endpoint after creating your admin!**

---

## 🔒 **Post-Deployment Security**

### 1. **Remove Development Files**
```bash
# Delete these from production:
rm create-godmode-user.js
rm create-production-admin.js
rm create-admin-user.sql
rm -rf *.md (except README.md)
rm -rf server/
```

### 2. **Verify Admin Access**
1. Go to your production URL
2. Login with admin credentials
3. Verify access to Admin Dashboard
4. Change password if using temporary credentials

### 3. **Create Additional Users**
Once logged in as admin:
1. Navigate to Admin Dashboard
2. Click "Manage Users"
3. Add teachers, head teachers, etc.
4. Assign appropriate roles

### 4. **Test Key Features**
- [ ] Login/Logout works
- [ ] Can add students
- [ ] Can add teachers
- [ ] Marks entry works
- [ ] Report generation works
- [ ] Class management works

---

## 📊 **Monitoring & Maintenance**

### Database Backups (Neon)
1. Go to Neon Dashboard
2. Project Settings → Backups
3. Enable automatic backups
4. Configure retention period

### Vercel Analytics
1. Enable Web Analytics in Vercel
2. Monitor error rates
3. Check API response times
4. Review logs regularly

### Security Monitoring
- [ ] Review user access logs
- [ ] Monitor failed login attempts
- [ ] Check for unusual API activity
- [ ] Update dependencies regularly

---

## 🆘 **Troubleshooting**

### "Cannot connect to database"
- Verify DATABASE_URL in Vercel env vars
- Check Neon database is active
- Verify IP allowlist (if configured)

### "Admin user already exists"
```sql
-- Check existing admin:
SELECT * FROM teachers WHERE all_roles @> ARRAY['admin'];

-- Delete if needed (CAREFUL!):
DELETE FROM teachers WHERE email = 'admin@example.com';
```

### "Deployment failed"
- Check build logs in Vercel
- Verify all dependencies in package.json
- Ensure dist/ folder is generated
- Check for TypeScript/ESLint errors

---

## ✅ **Final Checklist**

Before going live:
- [ ] Production database configured
- [ ] Environment variables set in Vercel
- [ ] Admin user created and tested
- [ ] All development files removed
- [ ] SSL/HTTPS enabled
- [ ] Backup strategy configured
- [ ] Monitoring enabled
- [ ] Security checklist completed
- [ ] Test all major features
- [ ] Document admin credentials securely

---

## 📞 **Support**

If you encounter issues:
1. Check Vercel deployment logs
2. Review Neon database logs
3. Check browser console for errors
4. Verify environment variables
5. Test database connection

---

## 🎉 **You're Live!**

Your eSBA system is now in production!

**Next Steps:**
1. Share login URL with staff
2. Provide training/documentation
3. Monitor system usage
4. Collect feedback
5. Plan feature updates

**Admin Dashboard URL:** `https://your-app.vercel.app/admin`

Good luck! 🚀
