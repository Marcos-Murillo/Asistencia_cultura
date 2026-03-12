# Task 13.10: Fix Area Persistence on Page Reload

## Problem

When a super admin selects the "deporte" area and then reloads the page, the area resets back to "cultura". This happens on all pages, causing confusion and requiring the user to manually switch back to deporte after every reload.

## Root Cause

The issue was in how the `AreaContext` was handling the initial state:

1. The `AreaProviderWrapper` was reading from `localStorage` and passing it as `initialArea` prop
2. The `AreaContext` was also trying to read from `localStorage` in a `useEffect`
3. This created a race condition where sometimes the `useState` initialization would happen before the `useEffect` could update the state
4. The `useEffect` only ran when `isSuperAdmin` was true, but by that time the component had already rendered with the default value

## Solution

### 1. Updated `contexts/area-context.tsx`

Changed the initialization strategy to read from `localStorage` immediately during state initialization:

```typescript
// Before: Used initialArea prop and tried to update in useEffect
const [area, setAreaState] = useState<Area>(initialArea)

useEffect(() => {
  if (isSuperAdmin) {
    const savedArea = localStorage.getItem('selectedArea') as Area | null
    if (savedArea && (savedArea === 'cultura' || savedArea === 'deporte')) {
      setAreaState(savedArea)
    }
  }
}, [isSuperAdmin])

// After: Read from localStorage during initialization
const getInitialArea = (): Area => {
  if (typeof window !== 'undefined') {
    const savedArea = localStorage.getItem('selectedArea') as Area | null
    if (savedArea && (savedArea === 'cultura' || savedArea === 'deporte')) {
      console.log('[AreaProvider] Loading area from localStorage:', savedArea)
      return savedArea
    }
  }
  console.log('[AreaProvider] Using initial area:', initialArea)
  return initialArea
}

const [area, setAreaState] = useState<Area>(getInitialArea)
```

Benefits:
- No race condition - the value is read synchronously during initialization
- No unnecessary re-renders from useEffect
- Works consistently across page reloads
- Simpler code without the useEffect dependency

### 2. Simplified `components/providers/area-provider-wrapper.tsx`

Removed the duplicate `localStorage` reading logic since `AreaContext` now handles it:

```typescript
// Before: Tried to read from localStorage and pass as initialArea
const [initialArea, setInitialArea] = useState<Area>('cultura')

useEffect(() => {
  if (isSuperAdmin) {
    const savedArea = localStorage.getItem('selectedArea') as Area | null
    if (savedArea && (savedArea === 'cultura' || savedArea === 'deporte')) {
      setInitialArea(savedArea)
    }
  }
  // ...
}, [])

return (
  <AreaProvider initialArea={mounted ? initialArea : 'cultura'} userRole={...}>
    {children}
  </AreaProvider>
)

// After: Let AreaProvider handle localStorage reading
return (
  <AreaProvider userRole={mounted ? userRole : 'ESTUDIANTE'}>
    {children}
  </AreaProvider>
)
```

Benefits:
- Single source of truth for area persistence
- No duplicate logic
- Cleaner code

## How It Works Now

1. **Initial Load:**
   - `AreaProvider` initializes state by calling `getInitialArea()`
   - `getInitialArea()` checks `localStorage` for saved area
   - If found and valid, uses saved area
   - Otherwise, uses default 'cultura'

2. **Area Switch:**
   - User clicks area selector (only super admin can do this)
   - `setArea()` is called with new area
   - State is updated
   - New area is saved to `localStorage`
   - Area switch is logged

3. **Page Reload:**
   - `AreaProvider` initializes again
   - `getInitialArea()` reads from `localStorage`
   - Finds the previously saved area
   - Initializes with that area
   - User sees the same area they had selected

## Testing

To verify the fix works:

1. **Test Area Persistence:**
   - Login as super admin
   - Switch to "deporte" area
   - Reload the page (F5 or Ctrl+R)
   - Verify you're still in "deporte" area
   - Navigate to different pages
   - Verify area stays as "deporte"

2. **Test Area Switch:**
   - Switch back to "cultura"
   - Reload the page
   - Verify you're in "cultura" area

3. **Test Default Behavior:**
   - Clear localStorage (browser dev tools)
   - Reload the page
   - Verify it defaults to "cultura"

## Files Modified

- `contexts/area-context.tsx` - Changed state initialization to read from localStorage synchronously
- `components/providers/area-provider-wrapper.tsx` - Removed duplicate localStorage logic

## Technical Notes

### Why This Approach Works

1. **Synchronous Reading**: Reading from `localStorage` during state initialization is synchronous, so there's no race condition
2. **SSR Safe**: The `typeof window !== 'undefined'` check ensures it works in server-side rendering contexts
3. **Single Source of Truth**: Only `AreaContext` manages the area state and persistence
4. **No Extra Renders**: No `useEffect` means no extra render cycles

### localStorage Key

The area is stored in `localStorage` with the key `'selectedArea'` and can have values:
- `'cultura'`
- `'deporte'`

This is only set when a super admin switches areas, ensuring that regular users always start with their assigned area.
