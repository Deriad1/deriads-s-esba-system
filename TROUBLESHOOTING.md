# 🚨 Connection Troubleshooting Guide

## "Failed to fetch" Error Solutions

### 🔍 **Step 1: Verify API URL**

**Current API URL:** `https://script.google.com/macros/s/AKfycbx8vZGD2AnOpyKXKIrF2HUX1rBjO7iXLAIW_tgj7N3LBp6n9Qnide1Eq0-BujnwFmwzJQ/exec`

**Test manually:**
1. Open this URL in your browser: 
   ```
   https://script.google.com/macros/s/AKfycbx8vZGD2AnOpyKXKIrF2HUX1rBjO7iXLAIW_tgj7N3LBp6n9Qnide1Eq0-BujnwFmwzJQ/exec?action=test
   ```

2. **Expected Response:**
   ```json
   {"status":"success","data":{"message":"API is working!","timestamp":"..."}}
   ```

3. **If you get an error:**
   - ❌ **Permission denied**: Web app not deployed properly
   - ❌ **404 Not Found**: Wrong script ID
   - ❌ **500 Internal Error**: Code error in Google Apps Script

### 🛠️ **Step 2: Check Google Apps Script Deployment**

1. **Go to your Google Apps Script project**
2. **Check deployment status:**
   - Click **Deploy** → **Manage Deployments**
   - Verify **Type: Web app**
   - Verify **Execute as: Me**
   - Verify **Who has access: Anyone**

3. **If not deployed:**
   - Click **Deploy** → **New Deployment**
   - Set correct permissions and deploy

### 🔧 **Step 3: Common Fixes**

#### **Fix 1: Redeploy with new version**
```
1. In Google Apps Script: Deploy → Manage Deployments
2. Click the edit icon (pencil)
3. Change version to "New"
4. Click "Deploy"
5. Copy the NEW URL to your api.js
```

#### **Fix 2: Check CORS (Cross-Origin Resource Sharing)**
Google Apps Script should handle CORS automatically, but ensure:
- You're using the **deployed web app URL** (not the script editor URL)
- The URL ends with `/exec` (not `/edit` or `/dev`)

#### **Fix 3: Test with Browser Network Tab**
1. Open Chrome DevTools (F12)
2. Go to **Network** tab
3. Try to load your app
4. Look for failed requests to see exact error

### 🧪 **Step 4: Alternative Testing Methods**

#### **Test with cURL (if you have it):**
```bash
curl "https://script.google.com/macros/s/AKfycbx8vZGD2AnOpyKXKIrF2HUX1rBjO7iXLAIW_tgj7N3LBp6n9Qnide1Eq0-BujnwFmwzJQ/exec?action=test"
```

#### **Test with Postman or similar tool:**
- Method: GET
- URL: Your API URL + `?action=test`

### 🔍 **Step 5: Enable Debugging**

Open your browser console (F12) and look for detailed error messages. The updated frontend now provides more debugging information.

### 📋 **Step 6: Verification Checklist**

- [ ] ✅ Google Apps Script contains the backend code
- [ ] ✅ Web app is deployed with correct permissions
- [ ] ✅ API URL in `src/api.js` matches deployment URL
- [ ] ✅ URL ends with `/exec` not `/execc` (typo fixed)
- [ ] ✅ Browser can access the test URL directly
- [ ] ✅ No browser extensions blocking requests
- [ ] ✅ Network allows HTTPS requests to Google

### 🆘 **Step 7: Emergency Offline Mode**

If you still can't connect, the app has fallback authentication in `AuthContext.jsx`:

**Demo accounts that work offline:**
- Admin: `admin@school.com` / `admin123` 
- Teacher: `teacher1@example.com` / `teacher123`

### 📞 **Step 8: Get Help**

If you're still having issues, please provide:
1. The exact error message from browser console
2. Response when testing the API URL directly in browser
3. Screenshot of Google Apps Script deployment settings
4. Network tab errors from DevTools

---

## 🎯 **Quick Fixes Summary**

| Issue | Solution |
|-------|----------|
| Wrong URL | Update API_URL in `src/api.js` |
| Not deployed | Deploy as web app in Google Apps Script |
| Permission denied | Set "Who has access: Anyone" |
| CORS error | Use deployed URL, not editor URL |
| Network blocked | Check firewall/proxy settings |

## 🔄 **After Fixing**

1. **Restart your React development server**
2. **Clear browser cache** (Ctrl+Shift+R)
3. **Test the connection** using the browser preview
4. **Check console logs** for success messages