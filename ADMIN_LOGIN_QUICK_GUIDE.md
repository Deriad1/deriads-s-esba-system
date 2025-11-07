# 🔐 Admin Login Quick Guide

## How to Login as Admin After Deployment

After deploying your app to production, you need to create the initial admin account. Here are your options:

---

## ⚡ **QUICKEST METHOD: Run the Setup Script**

### From your local machine:

```bash
# Make sure your .env file has the production database URL
npm run setup:admin
```

**Follow the prompts:**
```
Enter admin first name: John
Enter admin last name: Doe
Enter admin email: admin@yourschool.com
Enter admin password: [Your secure password]
Confirm password: [Same password]
```

**✅ Done! You can now login at your production URL**

---

## 📝 **Alternative Methods**

### **Option 2: SQL in Neon Dashboard**

1. Generate bcrypt hash:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourPassword123', 10).then(console.log)"
```

2. Go to [Neon Dashboard](https://console.neon.tech)
3. Open SQL Editor
4. Run the SQL from `create-admin-user.sql` (replace placeholders)

### **Option 3: Direct SQL Command**

```sql
-- Replace YOUR_* placeholders with your actual values
INSERT INTO teachers (
  first_name, last_name, email, password,
  gender, teacher_primary_role, all_roles,
  classes, subjects, term, academic_year
) VALUES (
  'YOUR_FIRSTNAME',
  'YOUR_LASTNAME',
  'YOUR_EMAIL@example.com',
  'YOUR_BCRYPT_HASH',  -- Generated from step 1
  'male',
  'admin',
  ARRAY['admin', 'head_teacher']::text[],
  ARRAY[]::text[],
  ARRAY[]::text[],
  'First Term',
  '2024/2025'
);
```

---

## 🎯 **Login Credentials Format**

After creating your admin:

```
URL:      https://your-app.vercel.app
Email:    admin@yourschool.com
Password: [The password you set]
```

---

## 🔒 **Security Reminders**

✅ **DO:**
- Use a strong password (12+ characters)
- Mix uppercase, lowercase, numbers, symbols
- Store credentials securely
- Change default passwords immediately

❌ **DON'T:**
- Use simple passwords like "password123"
- Share credentials via email
- Keep godmode users in production
- Commit .env files to Git

---

## ❓ **Troubleshooting**

### "User already exists"
Check if user exists:
```sql
SELECT * FROM teachers WHERE email = 'your-email@example.com';
```

### "Cannot connect to database"
- Verify `DATABASE_URL` in Vercel environment variables
- Check Neon database is active
- Ensure you're using the production database URL in `.env`

### "Script not found"
Make sure you're in the project directory:
```bash
cd path/to/react_app
npm run setup:admin
```

---

## 📞 **Need Help?**

See the complete guide: `PRODUCTION_DEPLOYMENT_CHECKLIST.md`

---

**That's it! You're ready to manage your school's data! 🎉**
