# 🚨 PostgreSQL Connection Troubleshooting Guide

## "Database Connection Failed" Error Solutions

### 🔍 **Step 1: Verify Environment Variables**

**Check your .env file:**
1. Open `.env` in your project root
2. Verify `VITE_POSTGRES_URL` is set correctly
3. Format should be: `postgresql://username:password@hostname/database?sslmode=require`

**Test manually:**
```bash
npm run db:test
```

**Expected Response:**
```
✅ Database connection successful!
📅 Current time: 2024-01-15 10:30:00
🐘 PostgreSQL version: PostgreSQL 15.4
📊 Found tables: users, students, teachers, student_scores, form_master_remarks, system_config
```

### 🛠️ **Step 2: Check Database Provider**

**If you get connection errors:**
1. **Neon Database**: Check your connection string in the Neon dashboard
2. **Supabase**: Verify your database is running and accessible
3. **Railway**: Ensure your database is deployed and running
4. **Local PostgreSQL**: Check if the service is running

### 🔧 **Step 3: Common Fixes**

#### **Fix 1: Update Connection String**
```bash
# Make sure your .env file has the correct format:
VITE_POSTGRES_URL=postgresql://username:password@hostname/database?sslmode=require
```

#### **Fix 2: Check SSL Settings**
- Most cloud providers require SSL
- Make sure `sslmode=require` is in your connection string
- Some providers use `sslmode=prefer`

#### **Fix 3: Verify Database Access**
1. Test your connection string directly in a PostgreSQL client
2. Ensure your database user has proper permissions
3. Check if your IP is whitelisted (if required)

### 🧪 **Step 4: Alternative Testing Methods**

#### **Test with psql (if installed):**
```bash
psql "your_connection_string_here"
```

#### **Test with online PostgreSQL client:**
- Use pgAdmin, DBeaver, or similar tools
- Test the connection string directly

### 🔍 **Step 5: Enable Debugging**

Run the test script to see detailed error messages:
```bash
npm run db:test
```

### 📋 **Step 6: Verification Checklist**

- [ ] ✅ `.env` file exists and contains `VITE_POSTGRES_URL`
- [ ] ✅ Connection string format is correct
- [ ] ✅ Database is accessible from the internet
- [ ] ✅ SSL settings are correct (`sslmode=require`)
- [ ] ✅ Database user has CREATE TABLE permissions
- [ ] ✅ No firewall blocking the connection

### 🆘 **Step 7: Emergency Setup**

If you still can't connect, create a new database:

**Quick Neon Setup:**
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Update your `.env` file
5. Run `npm run db:init`

### 📞 **Step 8: Get Help**

If you're still having issues, please provide:
1. The exact error message from `npm run db:test`
2. Your database provider (Neon, Supabase, etc.)
3. Whether you can connect with other PostgreSQL clients
4. Your connection string format (redact sensitive parts)

---

## 🎯 **Quick Fixes Summary**

| Issue | Solution |
|-------|----------|
| Missing .env file | Create `.env` with `VITE_POSTGRES_URL` |
| Wrong connection string | Update format to `postgresql://...` |
| SSL errors | Add `?sslmode=require` to connection string |
| Permission denied | Check database user permissions |
| Connection timeout | Verify database is running and accessible |

## 🔄 **After Fixing**

1. **Test the connection**: `npm run db:test`
2. **Initialize tables**: `npm run db:init`
3. **Start the application**: `npm run dev`
4. **Test login**: Use demo credentials or create new users

## 🎉 **Success Indicators**

When everything is working, you should see:
- ✅ Database connection successful
- ✅ Tables created successfully
- ✅ Application starts without errors
- ✅ Login works with proper authentication
- ✅ All CRUD operations function correctly