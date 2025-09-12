# 🚀 Backend Setup Guide

## Google Apps Script Deployment

### Step 1: Prepare Your Google Sheets Database
1. Create a new Google Sheets document
2. The backend will automatically create these sheets when first run:
   - **Teachers** - User authentication and roles
   - **Learners** - Student records  
   - **Broadsheet** - Academic scores and grades
   - **Hobbies** - Student character/behavior records
   - **Attendance** - Optional attendance tracking

### Step 2: Set Up Google Apps Script
1. Go to [script.google.com](https://script.google.com)
2. Click **"New Project"**
3. Replace the default code with the contents from `backend/code.gs`
4. Save the project (give it a name like "SDA School Management API")

### Step 3: Deploy as Web App
1. Click **"Deploy"** → **"New Deployment"**
2. Choose **Type: "Web app"**
3. Set **"Execute as: Me"**
4. Set **"Who has access: Anyone"**
5. Click **"Deploy"**
6. **Copy the deployment URL** (looks like: `https://script.google.com/macros/s/SCRIPT_ID_HERE/exec`)

### Step 4: Update Frontend API URL
1. Open `src/api.js`
2. Replace `YOUR_SCRIPT_ID_HERE` with your actual script ID from the deployment URL
3. Save the file

### Step 5: Initialize Test Data (Optional)
Run these functions in Google Apps Script editor to set up demo data:
1. `ensureCorrectLoginData()` - Creates admin user
2. `initializeTestData()` - Adds sample teachers and students

## 🔑 Demo Login Credentials

After running the setup functions, you can log in with:

**Admin Account:**
- Email: `admin@school.com`
- Password: `admin123`

**Test Teacher Accounts:**
- Email: `alice@school.com` / Password: `teacher123`
- Email: `bob@school.com` / Password: `teacher123`
- Email: `carol@school.com` / Password: `admin123`

## 📊 Database Schema

### Teachers Sheet
```
TeacherID | First Name | Last Name | Gender | Email | Password | Primary_Role | All_Roles | Classes | Subjects | Active
```

### Learners Sheet  
```
LearnerID | First Name | Last Name | Gender | Class
```

### Broadsheet Sheet
```
Class | Subject | Learner Name | Test 1 | Test 2 | Test 3 | Test 4 | Total (60) | Scaled (50%) | Exam (100) | Exam Scaled (50%) | Total Score | Position | Remarks
```

### Hobbies Sheet
```
LearnerID | Name | Class | Interests | Hobbies | Attitude | Class Teacher Remarks
```

### Attendance Sheet
```
Attendance_ID | LearnerID | Name | Class | Days Present | Total School Days
```

## 🧪 Testing Your Setup

1. **Test API Connection**: Visit your deployment URL with `?action=test`
   - Should return: `{"status":"success","data":{"message":"API is working!","timestamp":"..."}}`

2. **Test Frontend**: Start your React app and try logging in with demo credentials

3. **Check Logs**: View Google Apps Script logs in the editor for debugging

## 🔧 Troubleshooting

**Connection Issues:**
- Verify the API URL is correct in `src/api.js`
- Check that the Google Apps Script is deployed as a web app
- Ensure "Anyone" has access to the web app

**Login Issues:**
- Run `ensureCorrectLoginData()` to create admin user
- Check that passwords are being hashed correctly
- Verify the Teachers sheet exists and has proper headers

**CORS Issues:**
- Google Apps Script automatically handles CORS
- Make sure you're using the deployed web app URL, not the script editor URL

## 📱 Features Supported

✅ **Authentication**: Multi-role login system  
✅ **User Management**: Teachers and learners CRUD  
✅ **Academic Records**: Student scores and broadsheets  
✅ **Role-based Access**: Admin, teachers, class teachers  
✅ **Grading System**: Tests (60 marks → 50%) + Exam (100 marks → 50%)  
✅ **Position Calculation**: Automatic ranking within class/subject  
✅ **Character Records**: Hobbies, interests, teacher remarks  
✅ **Data Validation**: Input sanitization and error handling  

## 🎯 Next Steps

1. Deploy your Google Apps Script ✅
2. Update the API_URL in your frontend ✅
3. Initialize test data ✅
4. Test the complete application ✅
5. Customize for your school's needs 🎓