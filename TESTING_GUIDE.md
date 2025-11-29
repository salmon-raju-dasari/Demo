# Testing & Validation Guide

## Pre-Deployment Testing

This guide will help you verify that all components are working correctly.

---

## Part 1: Backend Validation

### Step 1: Start Backend Server

```bash
cd c:\fastapiDev
# Activate your virtual environment
.\.fastapienv\Scripts\Activate.ps1

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### Step 2: Test Categories Endpoint

**Get All Categories:**
```bash
curl http://localhost:8000/api/categories
```

**Expected Response:**
```json
[]
```
(Empty array is normal for first run)

### Step 3: Create a Test Category

```bash
curl -X POST http://localhost:8000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Electronics","description":"Electronic devices and gadgets"}'
```

**Expected Response:**
```json
{
  "id": 1,
  "name": "Electronics",
  "description": "Electronic devices and gadgets",
  "created_at": "2024-11-28T...",
  "updated_at": "2024-11-28T..."
}
```

### Step 4: Verify Database

Check if the category was saved:

```bash
curl http://localhost:8000/api/categories
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "name": "Electronics",
    "description": "Electronic devices and gadgets",
    "created_at": "2024-11-28T...",
    "updated_at": "2024-11-28T..."
  }
]
```

### Step 5: Test Error Handling

**Duplicate Category (should fail):**
```bash
curl -X POST http://localhost:8000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Electronics","description":"Another attempt"}'
```

**Expected Error Response:**
```json
{
  "detail": {
    "error": "DuplicateEntryError",
    "message": "A category with this name already exists",
    "field": "name",
    "type": "duplicate_constraint",
    "suggestion": "Please use a different category name"
  }
}
```

---

## Part 2: Frontend Validation

### Step 1: Start Frontend Dev Server

In a new terminal:

```bash
cd "c:\React Demos\Demo"
npm run dev
```

**Expected Output:**
```
  VITE v7.1.7  ready in 123 ms

  ➜  local:   http://localhost:5173/
  ➜  press h to show help
```

### Step 2: Verify Package Installation

```bash
npm list html5-qrcode
```

**Expected Output:**
```
supermarket@0.0.0
└── html5-qrcode@2.3.4
```

### Step 3: Check Browser Console

Navigate to `http://localhost:5173` and open DevTools (F12).

**Console Tab:**
- Should show no critical errors
- Look for: "Fetching categories (attempt 1/3)..."
- If API fails, should see retry messages

### Step 4: Navigate to Add Products Page

1. Open the application
2. Navigate to "Add Products" section
3. Look for loading spinner

**Expected Behavior:**
- Loading spinner appears briefly
- Categories dropdown becomes populated
- No errors in console

### Step 5: Test Category Dropdown

1. Click on Category dropdown
2. Should see "Electronics" (from backend)
3. Type to filter categories
4. Should work smoothly

### Step 6: Test Add New Category

1. Click "+" button next to Category dropdown
2. Enter new category name: "Clothing"
3. Click "Add"

**Expected Behavior:**
- Dialog appears
- Toast notification: "Category Added"
- List updates (may require refresh)

### Step 7: Test QR Scanner

1. Click "Scan" button in Barcode Details
2. Grant camera permission (first time)

**Expected Behavior:**
- Modal dialog opens
- Camera feed loads
- "Initializing camera..." message briefly shown
- Can see camera view

### Step 8: Test QR Scanner - Manual Entry

If you don't have a physical barcode:

1. In the scanner dialog
2. Scroll to "Or enter manually" section
3. Type a test barcode: `123456789`
4. Click "Confirm"

**Expected Behavior:**
- Modal closes
- Barcode field populated with `123456789`
- Toast notification appears

### Step 9: Test Scanner - Error Handling

1. Deny camera permission (reset if needed)
2. Click "Scan" again

**Expected Behavior:**
- Error message appears: "Camera permission denied"
- "Retry Camera" button shown
- Can manually enter barcode instead

---

## Part 3: Integration Testing

### Test 1: Complete Product Flow

1. Navigate to Add Products
2. Wait for categories to load (spinner shown)
3. Enter product details:
   - Name: "Sample Product"
   - Description: "Test Description"
   - Category: Select "Electronics"
   - Price: "99.99"
   - Scan barcode or enter manually

**Expected Result:**
- All fields populated
- No errors in console
- Form ready for submission

### Test 2: Loading State During Network Latency

1. Open DevTools (F12)
2. Network Tab → Throttle to "Slow 3G"
3. Refresh page on Add Products
4. Watch for loading spinner

**Expected Behavior:**
- Spinner shows for extended time
- Categories still load successfully
- Form works normally after load

### Test 3: Error Recovery

1. Stop backend server (Ctrl+C in backend terminal)
2. Refresh frontend page
3. Watch for error message
4. Restart backend
5. Click "Retry" or refresh page

**Expected Behavior:**
- Error message appears
- Categories don't load
- Toast shows error details
- Works again after backend restart

### Test 4: Concurrent Operations

1. Multiple barcode scans in succession
2. Add multiple products
3. Add multiple categories

**Expected Behavior:**
- No memory leaks
- Proper error handling
- Consistent state

---

## Part 4: Browser Compatibility Testing

### Desktop Browsers

Test in:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

**Check:**
- [ ] Loading spinner displays correctly
- [ ] QR scanner opens and works
- [ ] Dropdown populates
- [ ] All buttons responsive

### Mobile Browsers

Test on actual device or use DevTools mobile emulation:

**Test Devices:**
- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] Android Firefox

**Check:**
- [ ] Touch interactions work
- [ ] Camera access works on mobile
- [ ] Responsive layout looks good
- [ ] Performance acceptable

---

## Part 5: Performance Testing

### Load Time Metrics

1. Open DevTools → Lighthouse
2. Run "Mobile" audit
3. Check metrics:
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Cumulative Layout Shift (CLS)

**Target:**
- FCP < 1.8s
- LCP < 2.5s
- CLS < 0.1

### API Response Time

In DevTools → Network Tab:
1. Load Add Products page
2. Check "GET /api/categories" request
3. Response time should be < 500ms

**If slow:**
- Check backend performance
- Verify database indexes
- Check network latency

### Memory Usage

1. Open DevTools → Memory tab
2. Take heap snapshot
3. Switch between pages
4. Take another snapshot
5. Compare sizes

**Expected:**
- No major memory leaks
- Heap size stable over time

---

## Part 6: Error Scenarios

### Scenario 1: API Timeout

**How to Test:**
1. Add `?delay=10000` to network tab simulation
2. Or use throttling to simulate slow connection

**Expected:**
- Spinner shows
- After timeout, error message appears
- Manual entry still works

### Scenario 2: Invalid Data

**Test:**
1. Try entering special characters in category
2. Try very long inputs

**Expected:**
- Frontend validation works
- Backend validation catches issues
- Proper error messages shown

### Scenario 3: Duplicate Categories

**Test:**
1. Try adding same category twice

**Expected:**
- Second attempt fails
- Error message: "Category already exists"
- User can retry with different name

### Scenario 4: Network Interruption

**How to Test:**
1. Start category fetch
2. Disconnect internet mid-request
3. Reconnect

**Expected:**
- Error appears
- Automatic retry triggers
- Works after reconnection

---

## Part 7: Accessibility Testing

### Keyboard Navigation

1. Remove mouse
2. Use Tab key to navigate
3. Use Enter/Space to activate buttons

**Expected:**
- All form fields accessible
- Buttons focusable and clickable
- Logical tab order

### Screen Reader Testing

Test with:
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (Mac)

**Check:**
- Form labels announced
- Buttons announced with purpose
- Errors announced

### Color Contrast

1. Use DevTools → Color Contrast Tool
2. Check all text colors
3. Verify WCAG AA compliance

**Target:**
- Normal text: 4.5:1 ratio
- Large text: 3:1 ratio

---

## Part 8: Security Testing

### Input Validation

1. Try SQL injection: `'; DROP TABLE categories; --`
2. Try XSS: `<script>alert('test')</script>`

**Expected:**
- Inputs sanitized
- No errors in app
- Backend rejects invalid data

### CORS Testing

1. Test from different origin
2. Check CORS headers in response

**Expected (if allowed):**
- Request succeeds
- Proper CORS headers present

### Authentication

1. Try API call without auth token for protected endpoints
2. Verify 401 Unauthorized response

---

## Testing Checklist

- [ ] Backend server starts without errors
- [ ] GET /api/categories returns empty array
- [ ] Can create new category via API
- [ ] Categories appear in dropdown
- [ ] Loading spinner shows/hides properly
- [ ] QR scanner modal opens
- [ ] Camera permission prompt appears
- [ ] Can enter barcode manually
- [ ] Toast notifications appear
- [ ] Error handling works
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Keyboard navigation works
- [ ] Performance metrics acceptable
- [ ] All buttons clickable
- [ ] All fields editable
- [ ] Form validation works

---

## Troubleshooting Issues During Testing

### Issue: "Cannot GET /api/categories"

**Solution:**
1. Verify backend is running
2. Check base URL in axios config
3. Check CORS settings in main.py

### Issue: "html5-qrcode not found"

**Solution:**
```bash
npm install html5-qrcode
npm list html5-qrcode
```

### Issue: Camera permission never prompts

**Solution:**
1. Check browser security settings
2. Reset site permissions
3. Try incognito mode

### Issue: Categories load but scanner doesn't work

**Solution:**
1. Check html5-qrcode import
2. Verify library file exists: `node_modules/html5-qrcode`
3. Check console for errors

### Issue: Loading spinner stuck

**Solution:**
1. Check network tab for hanging requests
2. Verify backend responds in time
3. Check retry logic in service

---

## Final Validation

When all tests pass:

1. ✅ Backend working correctly
2. ✅ Frontend loads categories from database
3. ✅ QR scanner functional
4. ✅ Loading states working
5. ✅ Error handling in place
6. ✅ Performance acceptable
7. ✅ Accessible to users
8. ✅ Secure from attacks

**Your implementation is ready for production!**

---

## Support

If you encounter issues:

1. **Check logs:**
   - Backend: Console output
   - Frontend: Browser DevTools Console
   - Network: DevTools Network tab

2. **Review documentation:**
   - IMPLEMENTATION_GUIDE.md
   - QUICK_START.md

3. **Common fixes:**
   - Restart backend/frontend servers
   - Clear browser cache
   - Reinstall dependencies
   - Check port conflicts
