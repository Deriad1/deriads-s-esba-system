# Quick Reference: Phase 1 Components

## Import Statement
```javascript
import { DraftIndicator, SyncStatusPanel } from '@/components/formmaster/shared';
import { useFormMasterState } from '@/hooks/useFormMasterState';
```

---

## DraftIndicator

### Props
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isDraft` | boolean | ✅ Yes | - | Whether data is in draft state |
| `isSyncing` | boolean | ❌ No | false | Whether data is syncing |
| `small` | boolean | ❌ No | false | Use compact display |

### Usage
```jsx
// Show draft (yellow badge)
<DraftIndicator isDraft={true} />

// Show saved (green badge)
<DraftIndicator isDraft={false} />

// Show syncing (blue spinner)
<DraftIndicator isDraft={false} isSyncing={true} />

// Compact mode
<DraftIndicator isDraft={true} small />
```

### Visual States
- 🟡 **Draft** - Yellow badge: "Draft (local)"
- ✅ **Saved** - Green badge: "Saved"
- 🔄 **Syncing** - Blue spinner: "Syncing"

---

## SyncStatusPanel

### Props
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `drafts` | number | ✅ Yes | - | Count of draft items |
| `saved` | number | ✅ Yes | - | Count of saved items |
| `pending` | number | ✅ Yes | - | Count of pending items |
| `onSyncAll` | function | ❌ No | null | Callback for sync all |
| `isSyncing` | boolean | ❌ No | false | Whether sync is in progress |
| `showDetails` | boolean | ❌ No | false | Show detailed stats |

### Usage
```jsx
<SyncStatusPanel
  drafts={5}
  saved={20}
  pending={3}
  onSyncAll={() => syncAllData()}
  isSyncing={false}
  showDetails={true}
/>
```

### Features
- Shows summary stats
- "Sync All" button (appears when pending > 0)
- Help text when drafts exist
- Success message when all synced
- Disabled state during sync

---

## useFormMasterState Hook

### Usage
```javascript
const { state, actions } = useFormMasterState();
```

### State Structure
```javascript
state = {
  mainView: 'manageClass' | 'enterScores',
  activeTab: 'attendance' | 'marks' | 'broadsheet' | 'analytics' | 'daily' | 'report',

  formData: {
    remarks: {},
    attitude: {},
    interest: {},
    comments: {},
    attendance: {}
  },

  marksData: {},
  dailyAttendance: {},
  analyticsData: {},

  syncStatus: {
    remarks: 'draft' | 'saved' | 'syncing',
    attitude: 'draft' | 'saved' | 'syncing',
    // ... etc
  },

  errors: {},
  savedStudents: Set
}
```

### Common Actions
```javascript
// View navigation
actions.setMainView('manageClass');
actions.setActiveTab('attendance');

// Update form data
actions.updateRemark('student123', 'EXCELLENT');
actions.updateAttitude('student123', 'VERY GOOD');
actions.updateAttendance('student123', '180');

// Update marks
actions.updateMark('Mathematics', 'student123', 'test1', '12');

// Sync status
actions.setSyncStatus('remarks', 'syncing');
actions.setSyncStatus('remarks', 'saved');
actions.setAllSyncStatus('saved');

// Errors
actions.setError('student123', 'Invalid attendance value');
actions.clearErrors();
```

---

## Common Patterns

### Pattern 1: Tab with Sync Status
```jsx
const MyTab = ({ students }) => {
  const { state, actions } = useFormMasterState();

  const getDrafts = () => /* count drafts */;
  const getSaved = () => /* count saved */;
  const getPending = () => /* count pending */;

  const handleSyncAll = async () => {
    actions.setSyncStatus('remarks', 'syncing');
    try {
      await saveToServer(state.formData.remarks);
      actions.setSyncStatus('remarks', 'saved');
    } catch (error) {
      actions.setSyncStatus('remarks', 'draft');
    }
  };

  return (
    <div>
      <SyncStatusPanel
        drafts={getDrafts()}
        saved={getSaved()}
        pending={getPending()}
        onSyncAll={handleSyncAll}
        isSyncing={state.syncStatus.remarks === 'syncing'}
      />

      {/* Tab content */}
    </div>
  );
};
```

### Pattern 2: Form Field with Draft Indicator
```jsx
<tr>
  <td>{student.name}</td>
  <td>
    <input
      value={state.formData.attendance[student.id] || ''}
      onChange={(e) => actions.updateAttendance(student.id, e.target.value)}
    />
  </td>
  <td>
    <DraftIndicator
      isDraft={state.syncStatus.attendance === 'draft'}
      isSyncing={state.syncStatus.attendance === 'syncing'}
      small
    />
  </td>
</tr>
```

### Pattern 3: Calculate Stats
```javascript
const getDraftCount = () => {
  return Object.keys(state.formData.attendance).filter(
    id => state.formData.attendance[id] && state.syncStatus.attendance === 'draft'
  ).length;
};

const getSavedCount = () => {
  return Object.keys(state.formData.attendance).filter(
    id => state.formData.attendance[id] && state.syncStatus.attendance === 'saved'
  ).length;
};

const getPendingCount = () => {
  return state.syncStatus.attendance === 'draft' ? getDraftCount() : 0;
};
```

---

## File Locations

```
📁 src/
├── 📁 hooks/
│   └── 📄 useFormMasterState.js (493 lines)
│
└── 📁 components/
    └── 📁 formmaster/
        └── 📁 shared/
            ├── 📄 DraftIndicator.jsx (142 lines)
            ├── 📄 SyncStatusPanel.jsx (263 lines)
            ├── 📄 index.js (24 lines)
            └── 📄 USAGE_EXAMPLES.jsx (297 lines)
```

---

## Notes

- ✅ All components have PropTypes
- ✅ All components have JSDoc comments
- ✅ Hook uses useCallback for all actions
- ✅ Hook auto-calculates mark totals
- ⚠️ localStorage sync not yet implemented in hook
- ⚠️ Server sync functions need to be added

---

## Next: Phase 2

Create these components using Phase 1 infrastructure:
1. `ManageClassView.jsx` - Container for tabs
2. `EnterScoresView.jsx` - Subject teaching view
3. `TabNavigation.jsx` - Reusable tab bar
4. Then extract 6 tab components

---

**Questions?** See `PHASE_1_COMPLETE.md` or `USAGE_EXAMPLES.jsx`
