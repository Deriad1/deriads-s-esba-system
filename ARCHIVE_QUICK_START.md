# Archive Viewer - Quick Start Guide

## 🚀 How to Use

### Step 1: Access the Archive Viewer
1. Login as **Admin** or **Head Teacher**
2. Go to **Admin Dashboard**
3. Click the **"View Archives"** button (📦 icon)

### Step 2: Browse Archives
- Archives are displayed as cards
- Each card shows: Term, Year, Marks count, Remarks count, Students count
- Use the **search box** to filter by term or year

### Step 3: Main Actions

#### 🔍 View Details
- Click **"View"** button on any archive
- See all marks and remarks
- Filter by class or subject
- Export to **PDF** or **Excel**

#### 📊 View Charts
- Click **"Charts"** button on any archive
- Choose chart type:
  - Grade Distribution
  - Subject Performance
  - Class Performance
  - Score Distribution
- Apply filters and export data

#### 🔄 Compare Terms
1. **Check boxes** next to 2-3 archives
2. Click **"Compare Terms"** button
3. View side-by-side performance with trends
4. Export comparison to Excel

#### ⬆️ Restore Archive
1. Click **"Restore"** button on archive
2. Select target term and year
3. Choose restore mode:
   - **Merge** ✅ (Recommended) - Overwrites conflicts
   - **Replace** ⚠️ (Dangerous) - Deletes all existing data
   - **Skip** (Safest) - Only non-conflicting data
4. Confirm and restore

#### 🗑️ Delete Archive
- Click **"Delete Archive"** button
- Confirm deletion
- Note: Marks/remarks remain in database

## 📋 All Features

| Feature | Description | Location |
|---------|-------------|----------|
| **PDF Export** | Generate student reports | Detail View |
| **Excel Export** | Download marks/remarks | Detail/Compare/Charts |
| **Search** | Filter archives | List View |
| **Comparison** | Compare 2-3 terms | List View → Compare |
| **Charts** | Visual analytics | Charts View |
| **Restore** | Load data to term | List View → Restore Modal |
| **Delete** | Remove archive | List/Detail View |

## ⚠️ Important

### Before Restoring
- ✅ Backup current term first
- ✅ Review restore mode carefully
- ✅ Test with "Skip" mode first
- ✅ Verify data after restore

### Data Types
- **Students**: Permanent (not term-specific)
- **Marks**: Term-specific (will be restored)
- **Remarks**: Term-specific (will be restored)

## 🧪 Testing

### Create Test Archive
1. Go to **School Setup** page
2. Enter marks for current term
3. Click **"Archive Term"** button
4. Confirm archiving
5. Check Archive Viewer for new archive

### Test All Features
```bash
# Run test script
node src/test-archives-enhanced.js
```

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| No archives found | Archive a term in School Setup |
| Can't load archives | Check server is running (npm run dev) |
| Export not working | Check browser allows downloads |
| Charts not showing | Ensure archive has marks data |

## 📞 Need Help?

Check the full documentation: `ARCHIVE_VIEWER_COMPLETE.md`

---

**Quick Reference Created**: 2025-10-24
