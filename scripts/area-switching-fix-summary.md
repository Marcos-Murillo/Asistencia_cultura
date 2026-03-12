# Area Switching Fix - Summary

## Problem
When switching between areas (Cultura ↔ Deporte), data was not appearing on pages. The user reported that after running the migration to add the `area` field to Cultura users, data still wasn't showing up when switching areas.

## Root Causes Identified

### 1. Invalid Firestore Queries
The code was trying to filter collections by `area` field that didn't exist:
- `attendance_records` collection doesn't have `area` field
- `cultural_groups` collection doesn't have `area` field
- Only `user_profiles` collection has the `area` field after migration

This caused `INVALID_ARGUMENT` errors from Firestore.

### 2. Chained useEffect Dependencies
In `app/usuarios/page.tsx`, there were two separate `useEffect` hooks:
1. First effect: Set permissions based on area
2. Second effect: Load users based on area AND permissions

This created a race condition where the second effect might not trigger properly when area changes.

### 3. Dynamic Imports
Some functions in `db-router.ts` were using dynamic imports (`await import("firebase/firestore")`), which could cause timing issues.

## Solutions Implemented

### 1. Fixed Firestore Queries in `lib/db-router.ts`

#### `getAttendanceRecords()`
- **Before:** Filtered both `user_profiles` and `attendance_records` by area
- **After:** Only filter `user_profiles` by area, then join with all attendance records
- **Reason:** Attendance records don't have area field; isolation comes from the database itself

```typescript
// Only filter users by area - attendance records don't have area field yet
const usersQuery = query(usersRef, where("area", "==", area))

const [usersSnapshot, attendanceSnapshot] = await Promise.all([
  getDocs(usersQuery), 
  getDocs(attendanceRef) // Get all attendance records from this database
])
```

#### `getAllCulturalGroups()`
- **Before:** Filtered by area field
- **After:** Get all groups from the database without area filter
- **Reason:** Cultural groups don't have area field; database separation provides isolation

```typescript
// Don't filter by area field - cultural_groups collection doesn't have area field
// The database itself (cultura vs deporte) provides the isolation
const snapshot = await getDocs(groupsRef)
```

#### `saveEventAttendance()` and `getUserEventEnrollments()`
- **Before:** Used dynamic imports for query functions
- **After:** Use static imports from top of file
- **Reason:** Avoid potential timing issues with dynamic imports

### 2. Simplified useEffect in `app/usuarios/page.tsx`

#### Before (Two separate effects):
```typescript
useEffect(() => {
  // Set permissions
  const permissions = getRolePermissions(userRole, area, assignedGroups)
  setCurrentUserPermissions(permissions)
}, [area])

useEffect(() => {
  if (currentUserPermissions) {
    loadUsers()
  }
}, [area, currentUserPermissions])
```

#### After (Single effect):
```typescript
useEffect(() => {
  // Set permissions
  const permissions = getRolePermissions(userRole, area, assignedGroups)
  setCurrentUserPermissions(permissions)
  
  // Load users immediately after setting permissions
  loadUsers()
}, [area])
```

### 3. Enhanced Logging

Added detailed console logging in:
- `loadUsers()` function to track when and how users are loaded
- Timestamps for debugging timing issues
- Counts of users with/without area field

## Data Isolation Strategy

The system now uses a two-layer approach:

### Layer 1: Physical Database Separation (Primary)
- Cultura data → `cultuaraasistencia` database
- Deporte data → `cdudemo-94ab9` database
- This provides the main isolation

### Layer 2: Area Field Validation (Secondary)
- `user_profiles` collection has `area` field
- Queries filter by `area` for additional validation
- Other collections rely on database separation

## Collections Status

| Collection | Has `area` field? | Filtering Strategy |
|------------|-------------------|-------------------|
| `user_profiles` | ✅ Yes (after migration) | Filter by `area` field |
| `attendance_records` | ❌ No | Database separation only |
| `cultural_groups` | ❌ No | Database separation only |
| `events` | ❌ No | Database separation only |
| `event_attendance` | ❌ No | Database separation only |

## Testing

### Test Page Created
- `/test-area-switch` - Real-time testing page with detailed logging
- Shows current area, load count, and user list
- Updates automatically when area changes

### Browser Test Page Created
- `scripts/browser-test-area-switching.html` - Instructions and diagnostics
- Lists expected behavior and common issues
- Provides console commands for manual testing

## Expected Behavior After Fix

1. **Switching to Cultura:**
   - Should load 3 users (Mariana, Jose David, Tobías)
   - All users should have `area: 'cultura'`
   - Console shows: "Loaded 3 users from database"

2. **Switching to Deporte:**
   - Should load 1 user (Marcos Amilkar)
   - User should have `area: 'deporte'`
   - Console shows: "Loaded 1 users from database"

3. **Console Logs:**
   - "========== LOADING USERS =========="
   - "Current area: [cultura|deporte]"
   - "✓ Loaded X users from database"
   - "========== USERS LOADED SUCCESSFULLY =========="

## Next Steps for User

1. **Restart dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Clear browser cache:**
   - Press Ctrl+Shift+Delete
   - Clear cached images and files
   - Clear cookies and site data

3. **Test area switching:**
   - Navigate to `/test-area-switch`
   - Open browser console (F12)
   - Switch between Cultura and Deporte
   - Verify users change and load count increases

4. **Check other pages:**
   - `/usuarios` - User management
   - `/estadisticas` - Statistics
   - `/grupos` - Groups
   - All should now update when switching areas

## Files Modified

1. `lib/db-router.ts` - Fixed Firestore queries
2. `app/usuarios/page.tsx` - Simplified useEffect
3. `app/test-area-switch/page.tsx` - Enhanced test page (already existed)
4. `scripts/browser-test-area-switching.html` - New diagnostic page
5. `scripts/area-switching-fix-summary.md` - This file

## Migration Status

✅ **Completed:**
- User profiles migrated with `area` field
- Cultura users: 3 (all have `area: 'cultura'`)
- Deporte users: 1 (has `area: 'deporte'`)

❌ **Not Required:**
- Other collections don't need `area` field
- Database separation provides sufficient isolation

## Troubleshooting

If data still doesn't appear:

1. **Check browser console for errors**
2. **Verify localStorage:** `localStorage.getItem('selectedArea')`
3. **Check React DevTools:** Verify AreaProvider is wrapping the app
4. **Check Network tab:** Look for Firestore requests
5. **Verify migration:** Run `/debug-firebase` to check user data
6. **Check sessionStorage:** Verify super admin status

## Technical Notes

- The `INVALID_ARGUMENT` error in Node.js scripts is expected (env vars not loaded)
- Browser should work fine with the fixes
- The area field in users provides validation, not primary isolation
- Database separation is the main isolation mechanism
