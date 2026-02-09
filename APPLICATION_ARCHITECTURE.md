# POS Application - Complete Architecture & Business Logic Analysis

## PART 1: BACKEND ARCHITECTURE

### Database Models Overview

#### 1. **Products Table** (`products.py`)
```
Core Fields:
- id: Primary Key
- business_id: Links to business (multi-tenant)
- productid: Auto-generated unique ID (PRD{id})
- productname: Product name
- barcode: Unique barcode for scanning
- sku: Unique stock keeping unit

Pricing & Units:
- price: Decimal(10,2) - Base price per unit
- unit: Unit type (kg, liter, bottle, g, ml, etc.)
- unitvalue: Decimal(10,3) - Multiplier for converting base units
  * Example: If unit="bag" and unitvalue=5, then 1 bag = 5kg
  * For direct units (kg, liter), unitvalue is optional

Bottle System (NEW):
- bottle_capacity: Decimal(10,2) - Capacity value (e.g., 500)
- bottle_unit: String - Unit for capacity (ml, l, etc.)
  * Example: bottle_capacity=500, bottle_unit="ml" means 500ml bottle

Inventory:
- quantity: Decimal(10,3) - Current stock (supports decimals for weight)
- openingstock: Initial stock count

Product Details:
- category: Product category
- brand: Brand name
- description: Product description
- productimages: JSON array of base64 images (max 5)
- customfields: JSON for custom attributes
- gst: Tax percentage
- discount: Discount percentage

Metadata:
- created_at: Timestamp
- updated_at: Timestamp
- updated_by: User who updated
```

#### 2. **Sales Table** (`sales.py`)
```
Sale Header:
- id: Primary Key
- business_id: Business reference
- sale_number: Unique invoice number (INV-001, SALE-001)
- customer_id: Optional customer reference
- customer_name, customer_phone, customer_email

Financial:
- subtotal: Total before discount/tax
- discount_amount: Total discount in rupees
- tax_amount: Total tax (GST)
- total_amount: Final amount

Payment:
- payment_method: cash, card, upi, online
- payment_status: pending, paid, partial
- amount_paid: Cash/card/upi received
- amount_due: Remaining amount

Metadata:
- created_by: Employee who created sale
- created_at: Sale timestamp
- notes: Sale notes
```

#### 3. **SaleItem Table** (`sales.py`)
```
Each sale has multiple sale items:
- id: Primary Key
- sale_id: Reference to parent sale
- product_id: Reference to product
- product_code: Product ID or SKU
- barcode: Product barcode
- product_name: Product name at time of sale
- quantity: Decimal(10,3) - Quantity sold (supports decimals)
- unit_price: Price per unit
- discount_percent: Item-level discount %
- discount_amount: Item-level discount amount (₹)
- tax_percent: Item-level tax %
- tax_amount: Item-level tax amount (₹)
- subtotal: quantity * unit_price
- total_amount: subtotal - discount + tax
```

---

## PART 2: BOTTLE SYSTEM BUSINESS LOGIC

### Bottle System Overview
When unit is "Bottle", the system tracks bottle capacity separately from quantity.

**Example Scenario:**
```
Product: Mineral Water
- Unit: "Bottle"
- Bottle Capacity: 500
- Bottle Unit: "ml"
- Current Quantity: 100 (bottles)

Display Format: "₹50 / bottle(500ml)"

When Selling 5 bottles:
- Quantity to sell: 5
- Quantity deducted from inventory: 5 bottles (NOT 2500ml)
- New inventory: 95 bottles
```

### Key Logic Points:
1. **Display**: Shows bottle capacity in product list
2. **Storage**: Stores bottle_capacity and bottle_unit separately
3. **Deduction**: For bottles, deduct by COUNT not by volume conversion
4. **No Conversion**: Unlike kg→g or liter→ml, bottles don't convert

---

## PART 3: QUANTITY DEDUCTION LOGIC (Sales Route)

### Deduction Algorithm (`sales.py` lines 283-310)
```python
# Get unit name from product
unit_name = (product.unit or '').lower()

# If BOTTLE unit:
if unit_name == 'bottle':
    quantity_to_deduct = float(item.quantity)  # Direct count
    # Example: Sell 5 bottles → deduct 5 bottles

# If WEIGHT/VOLUME units:
elif unit_name in ['kg', 'kilogram', 'liter', 'g', 'gram', 'ml']:
    quantity_to_deduct = float(item.quantity)  # Direct quantity
    # Example: Sell 2kg → deduct 2kg directly

# If OTHER units with multiplier:
else:
    unit_multiplier = float(product.unitvalue) or 1.0
    quantity_to_deduct = float(item.quantity) * unit_multiplier
    # Example: Unit="bag", unitvalue=5, sell 3 bags → deduct 3*5=15kg
```

### Product Lookup Response
When searching product (barcode/product_id/SKU), API returns:
```json
{
  "id": 1,
  "productname": "Mineral Water",
  "price": "50.00",
  "unit": "bottle",
  "unitvalue": null,
  "quantity": 100,
  "bottle_capacity": 500,
  "bottle_unit": "ml",
  ...
}
```

---

## PART 4: FRONTEND ARCHITECTURE

### Key Components Structure
```
src/
├── RouteConfig.jsx                 # Main route definitions
├── App.jsx                         # Root app component
├── main.jsx                        # Entry point
│
├── config/
│   └── menuConfig.js              # Sidebar menu items
│
├── components/
│   ├── Layout/
│   │   ├── MainLayout.jsx         # Main layout with sidebar
│   │   └── Sidebar.jsx            # Navigation sidebar
│   │
│   ├── AddProducts.jsx            # Product creation form
│   ├── AllProducts.jsx            # Product list & display
│   ├── SalesScreen.jsx            # Point of sale interface
│   ├── SalesHistory.jsx           # Sales records & analytics
│   ├── UnitManagement.jsx         # Custom unit creation (NEW)
│   │
│   ├── Dashboard.jsx              # Main dashboard
│   ├── Employees.jsx              # Employee management
│   ├── CustomLabelManagement.jsx  # Custom fields
│   ├── CategoryManagement.jsx     # Product categories
│   ├── StoreManagement.jsx        # Store management
│   │
│   └── ProtectedRoute.jsx         # Role-based access control
│
├── services/
│   ├── api/
│   │   └── axios.js               # Axios instance with auth
│   └── token.service.js           # JWT token management
│
├── styles/
├── hooks/
├── utils/
└── context/
```

### Key Frontend Features

#### 1. **AddProducts.jsx** - Product Creation
```
Form Structure:
- Product name, barcode, SKU
- Category, brand, description
- Price & unit selection
- Unit value (for multiplier units)
- Images (up to 5)
- Custom fields/labels
- Bottle fields (conditional - shown only when unit="bottle")

Bottle Conditional Logic:
if (productForm.unit === "bottle") {
  show: bottleCapacity input
  show: bottleUnit dropdown (ml, l, etc.)
  disabled: unitValue field
}

API Payload:
{
  productname: "Mineral Water",
  barcode: "123456",
  price: 50,
  unit: "bottle",
  bottle_capacity: 500,
  bottle_unit: "ml",
  quantity: 100,
  ...
}
```

#### 2. **AllProducts.jsx** - Product List & Display
```
Display Logic:
- For bottle units: "₹50 / bottle(500ml)"
- For other units: "₹50 / kg"
- Shows product info, prices, stock

formatUnitPrice() function:
- Takes: price, unit, unitvalue, bottleCapacity, bottleUnit
- Returns formatted string for display
- Handles special formatting for bottles

Price Column Shows:
- Price with unit (inline)
- Bottle capacity below (if bottle unit)
```

#### 3. **SalesScreen.jsx** - Point of Sale
```
Three-section Layout:
1. LEFT: Product search & cart
   - Search by barcode/product ID/SKU
   - Add to cart
   - Manage cart items (edit qty, remove)

2. RIGHT: Customer & Billing
   - Customer phone/name/email
   - Payment method selection
   - Amount paid input
   - Balance display (auto-calculated)

3. BOTTOM: Complete Sale button

Product Lookup Flow:
1. User enters barcode
2. Calls /sales/product-lookup endpoint
3. Returns product with bottle fields
4. Cart item includes: bottle_capacity, bottle_unit
5. Display: "₹50/bottle (500ml)"

Quantity in Cart:
- Shows: Qty field with +/- buttons
- Stores: Decimal quantity (supports 0.5, 1.5, etc.)
- For bottles: Qty = number of bottles
- Updates cart total dynamically

Sale Submission:
POST /sales/create
{
  items: [
    {
      product_id: 1,
      quantity: 5,
      unit_price: 50,
      discount: 0,
      tax: 18,
    }
  ],
  customer_phone: "9999999999",
  payment_method: "cash",
  amount_paid: 300,
}

Response: Sale with invoice number
```

#### 4. **UnitManagement.jsx** - Custom Units (NEW)
```
Purpose: Create custom units for products

Form:
- Unit Title: "Weight", "Volume", "Length"
- Base Unit: "Kilogram"
- Base Unit Code: "kg"
- Unit Value: "1000" (conversion factor)
- Sub Unit: "Milligram"
- Sub Unit Code: "mg"

Result: 1kg = 1000mg

Storage: localStorage (frontend for now)
Future: Backend API

Display:
- Card-based list of created units
- Shows conversion formula
- Edit/Delete buttons
```

#### 5. **SalesHistory.jsx** - Sales Analytics
```
Features:
- Filter by date range
- Filter by payment method
- Filter by customer
- Search by sale number
- View detailed sale breakdown
- Print invoice
- Responsive grid/table

Display:
- Sale number, date, customer
- Total, payment status
- Items count
- Click to view details
```

---

## PART 5: AUTHENTICATION & AUTHORIZATION

### Token Service (`token.service.js`)
```javascript
- getToken(): Get JWT from localStorage
- setToken(token): Store JWT
- decodeToken(): Parse JWT to get user data
- getUserRole(): Get user role from token
- isTokenExpired(): Check if token expired
- logout(): Clear token
```

### Protected Routes (`ProtectedRoute.jsx`)
```javascript
// Check if user has required roles
// Redirect to /unauthorized if not
// Redirect to /login if no token

<ProtectedRoute requiredRoles={["admin", "owner", "manager"]}>
  <Component />
</ProtectedRoute>
```

### Menu Configuration (`menuConfig.js`)
```javascript
Menu items defined with:
- label: Display name
- icon: PrimeIcons icon
- to: Route path
- items: Submenu items (nested)

Only rendered if user has access
```

---

## PART 6: DATA FLOW EXAMPLES

### Example 1: Creating a Product with Bottle Unit
```
UI Form:
1. User fills: Name="Coke", Price=50, Unit="Bottle"
2. Bottle fields appear
3. User fills: bottleCapacity=250, bottleUnit="ml"
4. User submits

Backend Processing:
1. POST /products/add receives data
2. Creates product row in DB
3. Stores: unit="bottle", bottle_capacity=250, bottle_unit="ml"

Display on AllProducts:
- Shows: "₹50 / bottle(250ml)"

Product Card:
{
  id: 1,
  productname: "Coke",
  price: 50,
  unit: "bottle",
  bottle_capacity: 250,
  bottle_unit: "ml",
  quantity: 100,
}
```

### Example 2: Selling a Bottle Product
```
SalesScreen:
1. User searches barcode "123456" (Coke)
2. API returns product with bottle fields
3. User sets quantity: 5 bottles
4. Cart shows: Coke | ₹50/bottle(250ml) | Qty: 5 | Total: ₹250

Submission to Backend:
POST /sales/create
{
  items: [{
    product_id: 1,
    quantity: 5,
    unit_price: 50,
    discount_percent: 0,
    tax_percent: 18,
  }],
  ...
}

Backend Processing:
1. Creates Sale record
2. Creates 5 SaleItem records (1 per line item)
3. Updates Products table:
   - old quantity: 100 bottles
   - deduction: 5 bottles (NOT converted)
   - new quantity: 95 bottles
4. Returns invoice with sale number
```

### Example 3: Selling a Weight-Based Product
```
Product Setup:
- Unit: "kg"
- Quantity: 50 kg

Sale:
- Quantity: 2.5 kg

Backend Deduction:
- unit_name = 'kg'
- quantity_to_deduct = 2.5 (direct)
- new quantity = 50 - 2.5 = 47.5 kg
```

### Example 4: Selling with Unit Multiplier
```
Product Setup:
- Unit: "box"
- Unit Value: 10
- Quantity: 100 kg (physical inventory)

Sale:
- Quantity: 3 boxes

Backend Deduction:
- unit_name = 'box'
- unit_multiplier = 10
- quantity_to_deduct = 3 * 10 = 30 kg
- new quantity = 100 - 30 = 70 kg
```

---

## PART 7: KEY BUSINESS RULES

### Pricing Rules
- Products stored with price per unit
- Sales use unit price from product at time of sale
- Discount applied before tax
- Tax calculated on discounted amount

### Inventory Rules
- Decimal quantities allowed (support 0.5kg, 1.5liters)
- Quantity never goes below 0
- Deduction happens on sale completion
- Bottle units deduct by count, not conversion

### Payment Rules
- Multiple payment methods supported
- Amount due = total - amount paid
- Payment status: pending (partial payment), paid (full payment)

### Role-Based Access
```
- Admin: Full access to all modules
- Owner: Full access except role management
- Manager: Products, sales, inventory, employees
- Cashier: Only sales screen
- Employee: View-only access
- Stock Keeper: Inventory management only
```

---

## PART 8: API ENDPOINTS OVERVIEW

### Products API
```
GET /products              - List all products
POST /products/add         - Create new product
GET /products/{id}        - Get product details
PUT /products/{id}        - Update product
DELETE /products/{id}     - Delete product
```

### Sales API
```
POST /sales/product-lookup              - Search product
POST /sales/create                      - Create sale
GET /sales                              - List sales
GET /sales/{id}                        - Get sale details
PUT /sales/{id}/refund                 - Process refund
```

### Customers API
```
GET /customers                          - List customers
POST /customers/create                  - Create customer
GET /customers/{phone}                  - Search by phone
PUT /customers/{id}                     - Update customer
```

### Categories API
```
GET /products/categories                - List categories
POST /products/categories               - Create category
```

---

## PART 9: STATE MANAGEMENT

### Frontend State Patterns

#### 1. LocalStorage Persistence
```javascript
// Cart items
localStorage.setItem("salesCart", JSON.stringify(cartItems))

// Customer
localStorage.setItem("salesCustomer", JSON.stringify(customer))

// Payment method
localStorage.setItem("salesPaymentMethod", paymentMethod)

// Amount paid
localStorage.setItem("salesAmountPaid", amountPaid)

// Units (UnitManagement)
localStorage.setItem("customUnits", JSON.stringify(units))
```

#### 2. Component State (React)
```javascript
// AddProducts
const [productForm, setProductForm] = useState({
  productname: "",
  price: "",
  unit: "",
  unitvalue: "",
  bottle_capacity: "",
  bottle_unit: "ml",
  ...
})

// SalesScreen
const [cartItems, setCartItems] = useState([])
const [customer, setCustomer] = useState({ phone: "", name: "", email: "" })
const [paymentMethod, setPaymentMethod] = useState("cash")
const [amountPaid, setAmountPaid] = useState("")
```

---

## PART 10: KEY FEATURES SUMMARY

| Feature | Status | Details |
|---------|--------|---------|
| Product Management | ✅ Complete | Add, edit, delete, search |
| Bottle System | ✅ Complete | Track capacity separately |
| Custom Units | ✅ Complete | Create weight/volume/etc units |
| Sales Screen | ✅ Complete | POS interface with cart |
| Inventory Tracking | ✅ Complete | Real-time deduction |
| Customer Management | ✅ Complete | Create, search, edit |
| Sales History | ✅ Complete | Analytics & reporting |
| Payment Methods | ✅ Complete | Cash, card, UPI, online |
| Role-Based Access | ✅ Complete | 6 role types |
| Mobile Responsive | ✅ Complete | All screens mobile-ready |
| Unit Multipliers | ✅ Complete | Convert between units |
| Decimal Quantities | ✅ Complete | Support 0.5kg, 1.5l |

---

## INTEGRATION POINTS (Frontend ↔ Backend)

### Authentication
```
Frontend → Backend:
Headers: { Authorization: "Bearer {token}" }

Backend → Frontend:
Response: JWT token on login
Frontend stores in localStorage
```

### Product Creation Flow
```
User fills form in AddProducts.jsx
↓
Submits to POST /products/add
↓
Backend validates & stores in DB
↓
Returns product with ID
↓
Frontend shows success & redirects
```

### Sales Flow
```
User searches product in SalesScreen.jsx
↓
Calls POST /sales/product-lookup
↓
Backend returns product data
↓
Frontend displays in cart
↓
User submits sale
↓
Calls POST /sales/create
↓
Backend processes:
  - Creates Sale record
  - Creates SaleItem records
  - Updates product quantity
  - Returns invoice
↓
Frontend shows confirmation
```

