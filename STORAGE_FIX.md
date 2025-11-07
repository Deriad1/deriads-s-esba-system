# Storage Quota Exceeded - Quick Fix

## 🔴 Immediate Fix (Browser Console)

**OPTION 1: Clear Old Term Data (Recommended)**

Open browser console (F12) and paste this:

```javascript
// Clean old term data (keeps current year only)
let removed = 0;
const currentYear = localStorage.getItem('currentAcademicYear') || '2024/2025';

for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key)) {
    // Check if key is term-specific data from old years
    const match = key.match(/_([\d\/]+)_/);
    if (match && match[1] !== currentYear) {
      console.log('Removing:', key);
      localStorage.removeItem(key);
      removed++;
    }
  }
}

console.log(`✅ Removed ${removed} old term items`);
location.reload();
```

**OPTION 2: Emergency Clear (Keeps Essential Data)**

```javascript
// Keep only essential data
const keysToKeep = [
  'currentTerm',
  'currentAcademicYear',
  'authToken',
  'currentUser',
  'schoolInfo',
  'onlineMode'
];

let removed = 0;
for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key) && !keysToKeep.includes(key)) {
    localStorage.removeItem(key);
    removed++;
  }
}

console.log(`✅ Removed ${removed} items`);
location.reload();
```

**OPTION 3: Nuclear Option (Clear Everything)**

```javascript
// ⚠️ WARNING: This clears EVERYTHING - you'll need to login again
if (confirm('Clear ALL localStorage? You will need to login again.')) {
  localStorage.clear();
  console.log('✅ localStorage cleared');
  location.reload();
}
```

## 📊 Check Storage Usage

Run this to see what's taking up space:

```javascript
let total = 0;
const items = [];

for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key)) {
    const size = new Blob([localStorage.getItem(key)]).size;
    total += size;
    items.push({ key, kb: (size/1024).toFixed(2) });
  }
}

items.sort((a,b) => parseFloat(b.kb) - parseFloat(a.kb));

console.log(`Total: ${(total/1024/1024).toFixed(2)} MB`);
console.log('Top 10 largest items:');
items.slice(0,10).forEach((item, i) => {
  console.log(`${i+1}. ${item.key}: ${item.kb} KB`);
});
```

## 🛠️ Permanent Solution

### 1. Add Storage Manager to Admin Settings

The system now includes a Storage Manager component. To use it:

1. Go to Admin Dashboard
2. Click "Admin Settings"
3. Look for "Storage Manager" tab (if integrated)
4. Use "Clean Old Term Data" button regularly

### 2. Use Online Mode

The storage issue is primarily because the system stores large amounts of data in localStorage (offline mode).

**Switch to Online Mode:**
1. Go to Admin Settings
2. Toggle "Online Mode" ON
3. Data will be fetched from database instead of localStorage

### 3. Regular Maintenance

Run cleanup regularly:
- After each term ends
- When switching academic years
- When storage warning appears

## 🔍 Why This Happens

1. **LocalStorage Limit**: Browsers typically limit localStorage to 5-10MB
2. **Large Datasets**: Student marks, remarks, and analytics data can be large
3. **Multiple Terms**: Data accumulates across terms and years
4. **No Auto-Cleanup**: Old term data isn't automatically removed

## ✅ Prevention Tips

1. **Use Online Mode**: Reduces localStorage usage significantly
2. **Clean Regularly**: Remove old term data you don't need
3. **Export Before Cleaning**: Backup data to Excel/JSON before cleaning
4. **Archive Old Terms**: Use the Archive feature to store historical data in database

## 🚨 If Nothing Works

1. **Backup Important Data**:
   - Export current term marks to Excel
   - Screenshot important information

2. **Clear Browser Data**:
   - Chrome: Settings → Privacy → Clear browsing data
   - Select "Cookies and site data" only
   - Time range: "All time"

3. **Use Incognito/Private Mode** temporarily while you clean up

4. **Try Different Browser**: Edge, Firefox, or Chrome (whichever you're not using)

## 📞 Need Help?

If the problem persists:
1. Check browser console for specific errors
2. Try the Storage Manager component
3. Contact system administrator
4. Export all data and do a fresh start

---

**Quick Command for Console:**
```javascript
// Quick fix - paste this in console
localStorage.clear(); location.reload();
```
