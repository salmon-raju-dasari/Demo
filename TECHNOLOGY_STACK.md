# POS APPLICATION - TECHNOLOGY STACK & INTEGRATION

## 1. TECHNOLOGY STACK

### Frontend
```
Framework:     React 18.x
Build Tool:    Vite
Router:        React Router v6
UI Library:    PrimeReact (Lara theme)
Icons:         PrimeIcons
HTTP Client:   Axios
State:         React Hooks + localStorage
Styling:       CSS3 + Media Queries
Mobile:        Responsive Design + Capacitor for native
```

### Backend
```
Framework:     FastAPI (Python 3.9+)
Database:      PostgreSQL
ORM:           SQLAlchemy
Auth:          JWT tokens
Validation:    Pydantic
Middleware:    CORS, error handling
Server:        Uvicorn (ASGI)
Port:          8000
```

### Infrastructure
```
Frontend Host:     http://192.168.1.2:5173 (Vite dev server)
Backend Host:      http://192.168.1.2:8000
Database:          PostgreSQL (local or remote)
Static Files:      /uploads directory for avatars/logos
Environment:       .env file for config
```

---

## 2. PROJECT STRUCTURE

### Frontend (/React Demos/Demo/src)
```
src/
├── RouteConfig.jsx                  # Route definitions
├── App.jsx                          # Root component
├── main.jsx                         # Entry point
│
├── config/
│   └── menuConfig.js               # Navigation menu items
│
├── components/
│   ├── Layout/
│   │   ├── MainLayout.jsx          # Main wrapper with sidebar
│   │   ├── MainLayout.css
│   │   ├── Sidebar.jsx             # Navigation sidebar
│   │   └── Sidebar.css
│   │
│   ├── ProtectedRoute.jsx          # Role-based access wrapper
│   ├── Login/
│   │   ├── Login.jsx
│   │   ├── ForgotUsername.jsx
│   │   └── ForgotPassword.jsx
│   │
│   ├── Register/
│   │   └── OwnerRegistration.jsx
│   │
│   ├── Dashboard.jsx               # Main dashboard
│   │
│   ├── Products/
│   │   ├── AddProducts.jsx         # Create/edit products
│   │   ├── AllProducts.jsx         # Product listing
│   │   └── AllProducts.css
│   │
│   ├── Sales/
│   │   ├── SalesScreen.jsx         # Point of sale interface
│   │   ├── SalesScreen.css
│   │   ├── SalesHistory.jsx        # Sales records
│   │   └── SalesHistory.css
│   │
│   ├── UnitManagement.jsx          # Custom units (NEW)
│   ├── UnitManagement.css          # Custom units styling
│   │
│   ├── CategoryManagement.jsx      # Product categories
│   ├── CustomLabelManagement.jsx   # Custom fields
│   ├── StoreManagement.jsx         # Store management
│   ├── Employees.jsx               # Employee management
│   ├── Business.jsx                # Business settings
│   │
│   └── PaymentModal.jsx            # Payment UI modal
│
├── services/
│   ├── api/
│   │   ├── axios.js               # Axios instance
│   │   └── config.js
│   │
│   ├── token.service.js           # JWT token management
│   └── api.service.js             # Generic API calls
│
├── styles/
│   └── global.css
│
├── index.css                       # Global styles
└── App.css
```

### Backend (/fastapiDev/app)
```
app/
├── __init__.py
├── database.py                     # SQLAlchemy setup
│
├── core/
│   ├── dependencies.py             # Dependency injection
│   └── security.py                 # JWT authentication
│
├── models/                         # SQLAlchemy ORM models
│   ├── __init__.py
│   ├── products.py                 # Product model with bottle fields
│   ├── sales.py                    # Sale & SaleItem models
│   ├── customers.py
│   ├── employees.py
│   ├── categories.py
│   ├── business.py
│   ├── stores.py
│   ├── payment.py
│   ├── custom_labels.py
│   └── employee_labels.py
│
├── schemas/                        # Pydantic validation schemas
│   ├── __init__.py
│   ├── products.py                 # Product schema (includes bottle fields)
│   ├── sales.py                    # Sale schema with ProductLookupResponse
│   ├── customers.py
│   ├── employees.py
│   └── ... (others)
│
├── routes/                         # API endpoints
│   ├── __init__.py
│   ├── products.py                 # GET/POST /products
│   ├── sales.py                    # POST /sales/create, /product-lookup
│   ├── customers.py
│   ├── employees.py
│   ├── categories.py
│   ├── business.py
│   ├── stores.py
│   ├── payment.py
│   ├── custom_labels.py
│   └── ... (others)
│
├── services/                       # Business logic layer
│   └── (utility functions)
│
└── utils/                          # Helper utilities
```

---

## 3. AUTHENTICATION & TOKEN FLOW

### Authentication Process
```
1. User Login (Frontend)
   ├─ Email: user@example.com
   └─ Password: ****

2. Frontend POST /login
   └─ axios.post("/auth/login", credentials)

3. Backend Verification
   ├─ Query employees table
   ├─ Hash password comparison
   └─ Validate user exists

4. JWT Token Generation
   ├─ Payload: {
   │   sub: user_id,
   │   email: user@example.com,
   │   role: "manager",
   │   business_id: "BUS123",
   │   exp: timestamp
   │ }
   └─ Sign with SECRET_KEY

5. Response
   └─ { access_token, token_type, user }

6. Frontend Storage
   ├─ localStorage.setItem("token", access_token)
   ├─ localStorage.setItem("user_id", user_id)
   ├─ localStorage.setItem("user_role", role)
   └─ localStorage.setItem("business_id", business_id)

7. Subsequent Requests
   └─ Headers: { Authorization: "Bearer {token}" }

8. Backend Validation
   ├─ Extract token from header
   ├─ Decode JWT
   ├─ Check expiration
   ├─ Verify signature
   └─ Extract business_id, role, user_id

9. Role-Based Access
   ├─ Check if role in required_roles
   ├─ If authorized: execute endpoint
   └─ If denied: return 403 Unauthorized
```

### Token Service Functions
```javascript
// token.service.js
export const tokenService = {
  
  getToken: () => {
    return localStorage.getItem("token");
  },
  
  setToken: (token) => {
    localStorage.setItem("token", token);
  },
  
  decodeToken: () => {
    const token = this.getToken();
    // JWT format: header.payload.signature
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  },
  
  getUserRole: () => {
    const decoded = this.decodeToken();
    return decoded?.role;
  },
  
  getBusinessId: () => {
    return localStorage.getItem("business_id");
  },
  
  isTokenExpired: () => {
    const decoded = this.decodeToken();
    return decoded.exp * 1000 < Date.now();
  },
  
  logout: () => {
    localStorage.clear();
    // Redirect to login
  }
};
```

---

## 4. API REQUEST/RESPONSE PATTERNS

### Product API

#### Create Product
```
POST /products/add

Request:
{
  productname: "Mineral Water",
  barcode: "123456",
  sku: "MW-500",
  category: "Beverages",
  price: 50.00,
  unit: "bottle",
  bottle_capacity: 500,
  bottle_unit: "ml",
  quantity: 100,
  gst: 18,
  discount: 0,
  suppliername: "ABC Corp",
  productimages: ["base64_string_1", ...],
  customfields: [...]
}

Response:
{
  id: 1,
  productid: "PRD1",
  productname: "Mineral Water",
  barcode: "123456",
  price: "50.00",
  unit: "bottle",
  bottle_capacity: "500.00",
  bottle_unit: "ml",
  quantity: "100.000",
  created_at: "2026-01-22T10:00:00"
}
```

#### Get Products
```
GET /products?business_id=BUS123

Response:
[
  {
    id: 1,
    productname: "Mineral Water",
    price: "50.00",
    unit: "bottle",
    bottle_capacity: "500.00",
    bottle_unit: "ml",
    quantity: "100.000"
  },
  ...
]
```

### Sales API

#### Product Lookup
```
POST /sales/product-lookup

Request:
{
  barcode: "123456"
  // OR
  product_id: "PRD1"
  // OR
  sku: "MW-500"
}

Response:
{
  id: 1,
  productname: "Mineral Water",
  price: "50.00",
  quantity: "100.000",
  unit: "bottle",
  unitvalue: null,
  bottle_capacity: "500.00",
  bottle_unit: "ml",
  category: "Beverages"
}
```

#### Create Sale
```
POST /sales/create

Request:
{
  items: [
    {
      product_id: 1,
      quantity: 5,
      unit_price: 50.00,
      discount_percent: 0,
      tax_percent: 18
    }
  ],
  customer_phone: "9999999999",
  customer_name: "John Doe",
  customer_email: "john@example.com",
  payment_method: "cash",
  amount_paid: 300.00,
  notes: ""
}

Response:
{
  id: 1,
  sale_number: "SALE-001",
  subtotal: "250.00",
  discount_amount: "0.00",
  tax_amount: "45.00",
  total_amount: "295.00",
  payment_method: "cash",
  amount_paid: "300.00",
  amount_due: "0.00",
  created_at: "2026-01-22T10:00:00",
  items: [
    {
      product_id: 1,
      quantity: "5.000",
      unit_price: "50.00",
      subtotal: "250.00",
      tax_amount: "45.00",
      total_amount: "295.00"
    }
  ]
}
```

---

## 5. AXIOS CONFIGURATION

### axios.js (API Configuration)
```javascript
import axios from 'axios';
import { tokenService } from '../token.service';

const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL || 
  'http://192.168.1.2:8000/api';

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Add auth token
instance.interceptors.request.use(
  (config) => {
    const token = tokenService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle errors
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      tokenService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance;
```

---

## 6. STATE MANAGEMENT PATTERNS

### Local Storage Usage
```javascript
// Cart persistence
localStorage.setItem("salesCart", JSON.stringify(cartItems));
const savedCart = JSON.parse(localStorage.getItem("salesCart")) || [];

// Customer session
localStorage.setItem("salesCustomer", JSON.stringify(customer));

// Payment details
localStorage.setItem("salesPaymentMethod", paymentMethod);
localStorage.setItem("salesAmountPaid", amountPaid);

// Auth tokens
localStorage.setItem("token", jwt_token);
localStorage.setItem("user_id", user_id);
localStorage.setItem("user_role", role);
localStorage.setItem("business_id", business_id);

// Custom units
localStorage.setItem("customUnits", JSON.stringify(units));
```

### React Hooks Patterns
```javascript
// useState for form data
const [productForm, setProductForm] = useState({
  productname: "",
  price: "",
  unit: "",
  bottle_capacity: "",
  bottle_unit: "ml"
});

// useEffect for API calls
useEffect(() => {
  fetchProducts();
}, [business_id]);

// useRef for input focus
const searchInputRef = useRef(null);

// useCallback for memoized functions
const handleQuantityChange = useCallback((index, delta) => {
  setCartItems(prev => [...]);
}, [cartItems]);
```

---

## 7. ERROR HANDLING FLOW

### Frontend Error Handling
```javascript
try {
  const response = await axios.post(
    '/sales/create',
    saleData
  );
  
  if (response.status === 200) {
    // Success
    showNotification('Sale created', 'success');
    clearCart();
  }
} catch (error) {
  if (error.response?.status === 400) {
    // Validation error
    showNotification(
      error.response.data.detail || 'Invalid data',
      'error'
    );
  } else if (error.response?.status === 401) {
    // Unauthorized
    logout();
  } else if (error.response?.status === 403) {
    // Forbidden
    showNotification('Access denied', 'error');
  } else {
    // Network or other error
    showNotification('Server error', 'error');
  }
}
```

### Backend Error Handling
```python
# FastAPI exception handling
from fastapi import HTTPException, status

@router.post("/sales/create")
def create_sale(sale: SaleCreate, db: Session = Depends(get_db)):
    try:
        # Validation
        if not sale.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sale must have at least one item"
            )
        
        # Business logic
        db_sale = Sale(**sale.dict())
        db.add(db_sale)
        db.flush()
        
        # Return success
        return db_sale
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
```

---

## 8. DATA FLOW ARCHITECTURE

### Complete Request-Response Cycle
```
User Action (Frontend)
    ↓
Input Validation (Client-side)
    ↓
API Call (axios)
    ↓
HTTP Request
├─ Method: GET/POST/PUT/DELETE
├─ URL: /api/endpoint
├─ Headers: Authorization: "Bearer token"
└─ Body: JSON payload
    ↓
Backend Route Handler
├─ Extract business_id from JWT
├─ Query database
├─ Apply business logic
└─ Validate data with Pydantic
    ↓
Database Transaction
├─ INSERT/UPDATE/DELETE
├─ Commit if success
└─ Rollback if error
    ↓
Response (JSON)
├─ Status Code: 200/201/400/401/403/500
├─ Headers: Content-Type application/json
└─ Body: Result data or error message
    ↓
Frontend Receives Response
├─ Check status code
├─ Parse JSON
├─ Update React state
└─ Re-render UI
    ↓
User sees result
    ↓
Update localStorage if needed
```

---

## 9. MULTI-TENANCY (Business Isolation)

### How Business Isolation Works
```
Every API request includes business_id from JWT token:

1. User logs in
   └─ JWT includes: { business_id: "BUS123" }

2. Each API request
   ├─ Extract business_id from token
   └─ Use in all database queries

3. Product queries
   ├─ WHERE business_id = "BUS123"
   └─ Results filtered to current business only

4. Sales queries
   ├─ WHERE business_id = "BUS123"
   └─ Only see own sales

Benefits:
✓ Multiple businesses in same system
✓ Complete data isolation
✓ Cannot access other business data
✓ Scalable architecture
```

### Example: Get Products (Multi-Tenant)
```python
@router.get("/products")
def get_products(
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    # Automatically filtered by business_id
    products = db.query(Products).filter(
        Products.business_id == business_id  # Multi-tenant filter
    ).all()
    
    return products
```

---

## 10. SECURITY CONSIDERATIONS

### JWT Tokens
```
Token Structure:
header.payload.signature

Payload (Base64 encoded):
{
  "sub": "123",           # User ID
  "email": "user@example",
  "role": "manager",
  "business_id": "BUS123",
  "exp": 1642800000      # Expiration timestamp
}

Security:
✓ Signed with SECRET_KEY
✓ Cannot be tampered (signature invalid)
✓ Expires after set time
✓ Sent in Authorization header
✓ Not stored in cookies (XSS safe)
```

### Password Security
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"])

# Hash password on registration
hashed = pwd_context.hash(plain_password)

# Verify on login
is_correct = pwd_context.verify(plain_password, hashed)
```

### CORS Configuration
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://192.168.1.2:5173",   # Frontend dev
        "http://192.168.1.2:8000",   # Backend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 11. ENVIRONMENT CONFIGURATION

### Frontend (.env)
```
VITE_API_BASE_URL=http://192.168.1.2:8000/api
VITE_APP_NAME=POS System
VITE_APP_VERSION=1.0.0
```

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost/posdb
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Upload settings
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880  # 5MB
```

---

## 12. DEPLOYMENT ARCHITECTURE

### Development Setup
```
Local Machine:
├─ Frontend: npm run dev
│  ├─ Vite dev server
│  └─ http://localhost:5173
│
├─ Backend: uvicorn main:app --reload
│  ├─ FastAPI server
│  └─ http://localhost:8000
│
└─ Database: PostgreSQL (local or remote)
   └─ postgresql://localhost/posdb
```

### Production Setup (Potential)
```
Server:
├─ Frontend: npm run build
│  ├─ Static files to S3/CDN
│  └─ nginx reverse proxy
│
├─ Backend: gunicorn + nginx
│  ├─ FastAPI with Gunicorn
│  └─ nginx load balancer
│
└─ Database: PostgreSQL managed
   └─ Cloud database service
```

