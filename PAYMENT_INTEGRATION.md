# Payment Integration Guide

## Overview
The application now includes Razorpay payment integration that works seamlessly across:
- Web Browsers (Chrome, Firefox, Safari, Edge)
- Android App (via Capacitor)
- Electron Desktop App

## Features

### 1. **Cross-Platform Support**
- **Web Browser**: Uses Razorpay Web Checkout with enhanced z-index to prevent modal from going behind status bar
- **Android App**: Uses Capacitor Razorpay plugin for native Android payment experience
- **Auto-Detection**: Automatically detects the platform and uses the appropriate payment method

### 2. **Payment Flow**
1. User registers → Receives login credentials via email
2. User logs in → Redirected to Dashboard
3. Dashboard checks payment status from backend API
4. If payment not completed:
   - Shows unclosable PaymentModal
   - Blocks navigation to all pages except Dashboard and Login
   - Prevents closing/refreshing the browser tab
5. User clicks "Pay Now with Razorpay"
6. Razorpay checkout opens (web modal or Android native)
7. User completes payment (UPI, Card, NetBanking, etc.)
8. Backend verifies payment signature using HMAC SHA256
9. Payment status updated in database
10. Modal closes → User can access full application

### 3. **Multi-Device Sync**
- Payment status is stored in PostgreSQL database
- Backend API is the single source of truth
- If user pays on one device, status is immediately reflected on all devices
- LocalStorage is used only as a cache for quick checks

### 4. **Security Features**
- All payment verification happens on backend
- HMAC SHA256 signature verification using Razorpay secret key
- Environment variables for sensitive keys
- No client-side payment verification
- Payment signature tampering is impossible

### 5. **Navigation Blocking**
- **NavigationGuard Component**: Checks payment status from backend before allowing route changes
- **PaymentModal**: Uses `closable={false}`, `dismissableMask={false}`, `closeOnEscape={false}`
- **beforeunload Event**: Warns user when trying to close/refresh tab
- **Redirect Logic**: Automatically redirects to Dashboard if user tries to navigate without payment

## Technical Implementation

### Backend (FastAPI)

#### Environment Variables (.env)
```env
RAZORPAY_KEY_ID=rzp_test_RnbcS8ilA0LUYN
RAZORPAY_KEY_SECRET=AU47B3h1CcSHUIflXoU8k0tW
```

#### API Endpoints

1. **GET `/api/payment/razorpay-key`**
   - Returns Razorpay public key ID for frontend
   - Response: `{"key_id": "rzp_test_..."}`

2. **POST `/api/payment/create-order`**
   - Creates Razorpay order
   - Request: `{"user_id": "USR1049", "amount": 50000}`
   - Response: `{"order_id": "order_...", "amount": 50000, "currency": "INR", "user_id": "USR1049"}`
   - Saves order to database

3. **POST `/api/payment/verify`**
   - Verifies payment signature
   - Request: `{"razorpay_order_id": "order_...", "razorpay_payment_id": "pay_...", "razorpay_signature": "..."}`
   - Response: `{"success": true, "message": "Payment verified successfully", "payment_id": "pay_..."}`
   - Updates payment status in database

4. **GET `/api/payment/status/{user_id}`**
   - Checks if user has completed payment
   - Response: `{"payment_completed": true}`
   - Used by Dashboard and NavigationGuard

#### Database Schema (payments table)
```sql
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    razorpay_order_id VARCHAR(100) UNIQUE NOT NULL,
    razorpay_payment_id VARCHAR(100),
    razorpay_signature VARCHAR(200),
    amount INTEGER NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50) DEFAULT 'created',
    payment_method VARCHAR(50),
    payment_email VARCHAR(255),
    payment_contact VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES employees(emp_id) ON DELETE CASCADE
);
```

### Frontend (React + Capacitor)

#### Dependencies
```json
{
  "dependencies": {
    "@capacitor/core": "^7.4.4",
    "@capacitor/android": "^7.4.4",
    "capacitor-razorpay": "^1.3.0",
    "axios": "...",
    "primereact": "..."
  }
}
```

#### Environment Variables (.env)
```env
VITE_API_BASE_URL=http://192.168.1.2:8000/api
VITE_RAZORPAY_KEY_ID=rzp_test_RnbcS8ilA0LUYN
```

#### Components

1. **PaymentModal.jsx**
   - Detects platform using `Capacitor.isNativePlatform()`
   - Web: Loads Razorpay checkout.js script dynamically
   - Android: Uses `RazorpayCheckout.open()` from capacitor-razorpay plugin
   - Handles payment success/failure/cancellation
   - Verifies payment on backend
   - Updates localStorage after successful payment

2. **Dashboard.jsx**
   - Checks payment status from backend API on mount
   - Shows PaymentModal if payment not completed
   - Syncs localStorage with backend status

3. **NavigationGuard.jsx**
   - Wraps entire app in App.jsx
   - Checks payment status from backend before each route change
   - Redirects to Dashboard if payment pending
   - Allows only Dashboard, Login, and Home routes without payment

#### CSS Fixes (index.css)
```css
/* Razorpay modal z-index fix */
.razorpay-container,
iframe[name^="razorpay"] {
    z-index: 999999999 !important;
}

.razorpay-container::before {
    z-index: 999999998 !important;
}
```

## Testing

### Test Payment Flow

1. **Register New User**
   - Email must be unique
   - Receives credentials via email
   - Username/password are mandatory

2. **Login**
   - User logs in with credentials
   - Redirected to Dashboard

3. **Payment Modal Appears**
   - Try closing modal → Cannot close
   - Try pressing ESC → Modal stays open
   - Try clicking outside → Modal stays open
   - Try refreshing page → Browser warns about unsaved changes

4. **Navigate Away**
   - Try clicking any menu item → Redirected back to Dashboard
   - Try manually typing URL → Redirected back to Dashboard

5. **Complete Payment**
   - Click "Pay Now with Razorpay"
   - **Web**: Razorpay checkout modal opens on top of everything
   - **Android**: Native Razorpay screen opens
   - Select payment method (UPI, Card, NetBanking)
   - Complete test payment

6. **After Payment**
   - Backend verifies signature
   - Payment status updated in database
   - Modal closes automatically
   - User can now navigate freely

7. **Multi-Device Test**
   - Login on another device with same credentials
   - Payment modal should NOT appear
   - User should have full access immediately

### Test Credentials (Razorpay Test Mode)

**Test Card Numbers:**
- Success: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date
- OTP: `123456`

**Test UPI IDs:**
- Success: `success@razorpay`
- Failure: `failure@razorpay`

## Deployment

### Backend Deployment

1. **Environment Variables**
   ```bash
   RAZORPAY_KEY_ID=your_production_key_id
   RAZORPAY_KEY_SECRET=your_production_key_secret
   DATABASE_URL=postgresql://user:password@host:port/database
   ```

2. **Run Migration**
   ```bash
   python create_payments_table.py
   ```

3. **Start Server**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

### Frontend Deployment

#### Web Deployment
1. Update `.env`:
   ```env
   VITE_API_BASE_URL=https://your-production-api.com/api
   VITE_RAZORPAY_KEY_ID=your_production_key_id
   ```

2. Build:
   ```bash
   npm run build
   ```

3. Deploy `dist/` folder to hosting service

#### Android Deployment

1. Update production API URL in `.env`
2. Build Android app:
   ```bash
   npm run build:android
   npx cap open android
   ```
3. In Android Studio:
   - Build → Generate Signed Bundle/APK
   - Select "Android App Bundle"
   - Upload to Google Play Console

## Razorpay Account Setup

### Test Mode (Current)
- Dashboard: https://dashboard.razorpay.com/
- Test Key ID: `rzp_test_RnbcS8ilA0LUYN`
- Test transactions are free
- No real money involved

### Production Mode
1. Complete KYC verification
2. Get production keys from dashboard
3. Update environment variables
4. Test thoroughly before going live
5. Set up webhooks for payment notifications

## Troubleshooting

### Web Browser Issues

**Issue**: Razorpay modal goes behind other elements
- **Solution**: CSS z-index fix is already applied in `index.css`

**Issue**: Modal can be closed by clicking outside
- **Solution**: Check `dismissableMask={false}` in PaymentModal

### Android Issues

**Issue**: Payment doesn't open
- **Solution**: Ensure `capacitor-razorpay` plugin is installed
- Run: `npx cap sync android`

**Issue**: Payment verification fails
- **Solution**: Check backend API is accessible from mobile network
- Ensure API URL uses IP address (192.168.1.2) not localhost

### Backend Issues

**Issue**: Payment signature verification fails
- **Solution**: Check `RAZORPAY_KEY_SECRET` is correct
- Ensure signature is being sent correctly from frontend

**Issue**: User can access app without payment
- **Solution**: Check NavigationGuard is wrapping routes
- Verify payment status endpoint returns correct data

## Security Checklist

- [x] Payment signature verified on backend using HMAC SHA256
- [x] Razorpay secret key stored in environment variables
- [x] No sensitive keys in frontend code
- [x] Database foreign key constraint on user_id
- [x] Payment status checked from database (not localStorage)
- [x] HTTPS for production API
- [x] User_id validation before payment verification

## Future Enhancements

1. **Email Notifications**
   - Send payment receipt via email
   - Payment failure notifications

2. **Payment History**
   - Dashboard to view payment history
   - Download invoice/receipt

3. **Subscription Model**
   - Recurring payments
   - Different pricing tiers

4. **Refund System**
   - Admin panel for refunds
   - Automatic refund processing

5. **Analytics**
   - Payment success rate
   - Popular payment methods
   - Revenue tracking

## Support

For issues or questions:
- Razorpay Docs: https://razorpay.com/docs/
- Capacitor Razorpay: https://github.com/capacitor-community/razorpay
- Backend: Check FastAPI logs
- Frontend: Check browser console
