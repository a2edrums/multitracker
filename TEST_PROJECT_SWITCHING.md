# Test Plan: Project Switching Bug Fix

## Issues Fixed
1. **Tracks being deleted**: Save effect no longer runs with empty tracks during project switch
2. **Project names overwritten**: Created timestamp is now preserved from original project
3. **localStorage sync**: Project ID is properly saved to localStorage on selection

## How to Test

### Test 1: Project Names Preserved
1. Create "Project A" with some tracks
2. Create "Project B" with different tracks  
3. Switch back to "Project A"
4. **Expected**: Project A still shows as "Project A" (not "Project B")

### Test 2: Tracks Not Deleted
1. Create a project with 2-3 tracks (add audio or record)
2. Create a second project with different tracks
3. Switch back to first project
4. **Expected**: All original tracks are still there with audio intact

### Test 3: Verify in IndexedDB
1. Open browser DevTools → Application → IndexedDB → MultiTrackerDB
2. Check `projects` store - each project should have its own tracks array
3. Check `audioBlobs` store - audio blobs should persist for all track IDs
4. Switch projects and verify data doesn't get overwritten

### Test 4: localStorage Sync
1. Create/open a project
2. Check localStorage for 'multitracker-last-project' key
3. Refresh the page
4. **Expected**: Last opened project loads automatically

## Quick Verification Steps
1. Create Project 1, add a track, name it "Track A"
2. Create Project 2, add a track, name it "Track B"  
3. Switch to Project 1
4. ✅ Should see "Track A" (not "Track B")
5. ✅ Project name should still be "Project 1"
