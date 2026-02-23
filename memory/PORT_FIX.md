# 🔧 Port Configuration Fix

## Issue
**Error:** `pdf-export-hub-1.preview.emergentagent.com refused to connect`

**Cause:** Frontend was running on port 5000, but preview expects port 3000

## Solution ✅

### Changed Port Configuration
**File:** `/app/frontend/vite.config.ts`

**Before:**
```typescript
server: {
  host: "0.0.0.0",
  port: 5000,  // ❌ Wrong port
  ...
}
```

**After:**
```typescript
server: {
  host: "0.0.0.0",
  port: 3000,  // ✅ Correct port
  strictPort: true,  // ✅ Added to ensure port consistency
  ...
}
```

## Verification ✅

### Services Status
```
✅ Backend:   RUNNING on port 8001
✅ Frontend:  RUNNING on port 3000
✅ MongoDB:   RUNNING
```

### Port Check
```
✅ Port 3000: LISTENING (Frontend)
✅ Port 8001: LISTENING (Backend)
```

### HTTP Test
```
✅ http://localhost:3000/ → HTTP 200 OK
✅ http://localhost:8001/api/ → {"message":"Hello World"}
```

## Preview URL
**Your app is now accessible at:**
`https://pdf-export-hub-1.preview.emergentagent.com`

## What Was Fixed
1. ✅ Changed Vite server port from 5000 → 3000
2. ✅ Added `strictPort: true` to prevent auto port change
3. ✅ Restarted frontend service
4. ✅ Verified both frontend and backend are responding

## Status: RESOLVED ✅

The app preview should now load correctly!

---

**Fixed:** February 21, 2025
**Issue Duration:** ~5 minutes
**Root Cause:** Port mismatch between Vite config and preview proxy
