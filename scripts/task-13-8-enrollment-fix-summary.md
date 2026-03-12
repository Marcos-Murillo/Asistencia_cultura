# Task 13.8: Fix Enrollment Counts in Grupos Page for Deporte

## Problem
The grupos page was showing 0 enrollments for deporte groups even though there was 1 user enrolled in Atletismo. The issue was that the enrollment functions were not area-aware and were saving to the wrong database.

## Root Cause
The `enrollUserToGroup` function in `lib/firestore.ts` was using the default `db` (cultura database) instead of the area-specific database. This meant:
- When users enrolled in deporte groups via `/inscripcion-deporte`, the enrollment was saved to the cultura database
- When the grupos page tried to count enrollments in the deporte database, it found 0 records

## Solution Implemented

### 1. Created Area-Aware Enrollment Functions in `lib/db-router.ts`

Added three new area-aware functions:

```typescript
// Enroll user to group (area-aware)
export async function enrollUserToGroup(
  area: Area, 
  userId: string, 
  grupoCultural: string
): Promise<string>

// Get user enrollments (area-aware)
export async function getUserEnrollments(
  area: Area, 
  userId: string
): Promise<Array<{...}>>

// Get all group enrollments (area-aware) - already existed
export async function getAllGroupEnrollments(area: Area): Promise<Array<{...}>>
```

These functions:
- Accept an `area` parameter ('cultura' | 'deporte')
- Use `getFirestoreForArea(area)` to get the correct database
- Save/retrieve enrollments from the area-specific database
- Use composite IDs (`userId_groupName`) to prevent duplicates

### 2. Updated `/inscripcion-deporte/page.tsx`

Changed imports from:
```typescript
import { getUserEnrollments, enrollUserToGroup } from "@/lib/firestore"
```

To:
```typescript
import { 
  saveUserProfile,
  findSimilarUsers,
  enrollUserToGroup,
  getUserEnrollments,
} from "@/lib/db-router"
```

Updated all function calls to include the 'deporte' area parameter:
- `getUserEnrollments('deporte', userId)`
- `enrollUserToGroup('deporte', userId, grupoCultural)`

### 3. Updated `getGroupsWithEnrollmentCounts` in `lib/db-router.ts`

This function already existed but now works correctly because:
- It calls `getAllGroupEnrollments(area)` which gets enrollments from the correct database
- It matches enrollments with users from the same area
- It counts enrollments per group and by gender

## Data Flow

### Enrollment Flow (Deporte)
1. User fills form in `/inscripcion-deporte`
2. User profile saved to deporte database via `saveUserProfile('deporte', profile)`
3. Enrollment saved to deporte database via `enrollUserToGroup('deporte', userId, group)`
4. Enrollment document created in `cdudemo-94ab9/group_enrollments` collection

### Count Flow (Grupos Page)
1. Grupos page calls `getGroupsWithEnrollmentCounts('deporte')`
2. Function gets groups from deporte database
3. Function gets enrollments from deporte database
4. Function gets users from deporte database
5. Function matches enrollments with users and counts by group
6. Returns array with enrollment counts per group

## Testing

To verify the fix works:

1. Go to `/inscripcion-deporte`
2. Enroll a user in a deporte group (e.g., Atletismo)
3. Go to `/grupos` and switch to deporte area
4. Verify that the enrollment count shows correctly

## Files Modified

- `lib/db-router.ts` - Added area-aware enrollment functions
- `app/inscripcion-deporte/page.tsx` - Updated to use area-aware functions

## Next Steps

The main cultura page (`app/page.tsx`) still uses the old firestore functions. If needed, it should also be updated to use the area-aware functions from db-router for consistency.

## Database Structure

### Enrollment Document Structure
```typescript
{
  userId: string,
  grupoCultural: string,
  enrolledAt: Timestamp
}
```

Document ID: `${userId}_${grupoCultural.replace(/\s+/g, "_")}`

This composite ID ensures that a user can only be enrolled once per group.
