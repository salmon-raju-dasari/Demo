# POS APPLICATION - FLOW DIAGRAMS & TECHNICAL DETAILS

## FLOW 1: USER LOGIN & ROLE-BASED ROUTING

```
User Access
    ↓
┌─────────────────────────────┐
│  Login.jsx                  │
│  - Email/Password input     │
│  - Submit to POST /login    │
└─────────────────────────────┘
    ↓
Backend Verification
    ↓
Token Generated (JWT)
    ↓
┌─────────────────────────────┐
│ localStorage.setItem("token")│
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│ Navigate to /dashboard      │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│ MainLayout.jsx renders      │
│ with Sidebar                │
└─────────────────────────────┘
    ↓
Role Check (from JWT)
    ↓
┌─────────────────────────────┐
│ Sidebar shows allowed menu  │
│ items based on role         │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│ ProtectedRoute checks roles │
│ - If allowed: render        │
│ - If denied: /unauthorized  │
└─────────────────────────────┘
```

---

## FLOW 2: PRODUCT CREATION WITH BOTTLE SYSTEM

```
┌──────────────────────────────────────┐
│ User navigates to Products > Add     │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ AddProducts.jsx loads                │
│ Form State Initialized:              │
│  - productname: ""                   │
│  - price: ""                         │
│  - unit: ""                          │
│  - unitvalue: ""                     │
│  - bottle_capacity: ""               │
│  - bottle_unit: "ml" (default)       │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ User fills basic info                │
│ (name, barcode, price, etc.)         │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ User selects unit from dropdown      │
│ Options:                             │
│  - kg, liter, bag, box, ...          │
│  - bottle (NEW)                      │
└──────────────────────────────────────┘
    ↓
Unit = "bottle" ?
    ├─ YES ──→ ┌────────────────────────────┐
    │          │ Show bottle fields:        │
    │          │ - Bottle Capacity input    │
    │          │ - Bottle Unit dropdown     │
    │          │ - Disable Unit Value field │
    │          │                            │
    │          │ Show live preview:         │
    │          │ "₹50 / bottle(500ml)"      │
    │          └────────────────────────────┘
    │                  ↓
    │          User fills:
    │          - bottleCapacity: 500
    │          - bottleUnit: "ml"
    │
    └─ NO ──→ ┌────────────────────────────┐
              │ Unit Value field enabled   │
              │ if not direct unit         │
              └────────────────────────────┘
    ↓
All fields filled ✓
    ↓
┌──────────────────────────────────────┐
│ Build API Payload                    │
│ {                                    │
│   productname: "Mineral Water",      │
│   barcode: "123456",                 │
│   price: 50,                         │
│   unit: "bottle",                    │
│   bottle_capacity: 500,              │
│   bottle_unit: "ml",                 │
│   quantity: 100,                     │
│   category: "Beverages",             │
│   ... other fields                   │
│ }                                    │
└──────────────────────────────────────┘
    ↓
Submit POST /products/add
    ↓
┌──────────────────────────────────────┐
│ Backend (products.py routes)         │
│ 1. Validate input                    │
│ 2. Create Products row               │
│ 3. Generate productid: PRD{id}       │
│ 4. Store bottle fields in DB         │
│ 5. Return product with ID            │
└──────────────────────────────────────┘
    ↓
Success Response
    ↓
┌──────────────────────────────────────┐
│ Frontend notification                │
│ "Product created successfully"       │
│ Redirect to /products/all            │
└──────────────────────────────────────┘
    ↓
Product now visible in AllProducts.jsx
with format: "₹50 / bottle(500ml)"
```

---

## FLOW 3: PRODUCT DISPLAY & PRICING

```
┌──────────────────────────────────────┐
│ User navigates to Products > All     │
└──────────────────────────────────────┘
    ↓
GET /products API call
    ↓
Backend returns array of products:
[
  {
    id: 1,
    productname: "Mineral Water",
    price: 50,
    unit: "bottle",
    bottle_capacity: 500,
    bottle_unit: "ml",
    quantity: 100,
  },
  {
    id: 2,
    productname: "Rice",
    price: 80,
    unit: "kg",
    unitvalue: null,
    quantity: 50,
  }
]
    ↓
┌──────────────────────────────────────┐
│ AllProducts.jsx receives data        │
└──────────────────────────────────────┘
    ↓
For each product, call formatUnitPrice()
    ↓
┌──────────────────────────────────────┐
│ formatUnitPrice logic:               │
│                                      │
│ if (unit === "bottle") {             │
│   return "/ bottle(" +               │
│          capacity + unit + ")";      │
│ } else if (unit has unitvalue) {     │
│   return "/ unit";                   │
│ } else {                             │
│   return "/ " + unit;                │
│ }                                    │
└──────────────────────────────────────┘
    ↓
Result:
  Product 1: "₹50 / bottle(500ml)"
  Product 2: "₹80 / kg"
    ↓
┌──────────────────────────────────────┐
│ Product Cards Displayed:             │
│                                      │
│ ┌─ Mineral Water ─┐                 │
│ │ Price: ₹50      │                 │
│ │ Unit: /bottle   │                 │
│ │ Cap: 500ml      │                 │
│ │ Stock: 100      │                 │
│ │ [Edit] [Delete] │                 │
│ └─────────────────┘                 │
│                                      │
│ ┌──── Rice ────┐                     │
│ │ Price: ₹80   │                     │
│ │ Unit: /kg    │                     │
│ │ Stock: 50    │                     │
│ │ [Edit] [Del] │                     │
│ └──────────────┘                     │
└──────────────────────────────────────┘
```

---

## FLOW 4: SALES CREATION (MOST COMPLEX)

```
┌──────────────────────────────────────┐
│ User navigates to Sales > New Sale   │
│ SalesScreen.jsx loads                │
└──────────────────────────────────────┘
    ↓
Init State:
  - cartItems: []
  - customer: { phone, name, email }
  - paymentMethod: "cash"
  - amountPaid: ""
  - searchValue: ""
    ↓
Load from localStorage (if exists)
    ↓
┌──────────────────────────────────────┐
│ STEP 1: SEARCH PRODUCT               │
└──────────────────────────────────────┘
    ↓
User enters barcode: "123456"
    ↓
Calls POST /sales/product-lookup
{
  barcode: "123456"
}
    ↓
Backend lookup logic:
  1. Filter by business_id
  2. Search by barcode field
  3. Return matching product
    ↓
Response:
{
  id: 1,
  productname: "Mineral Water",
  price: 50,
  unit: "bottle",
  bottle_capacity: 500,
  bottle_unit: "ml",
  quantity: 100,  // Available stock
  unitvalue: null
}
    ↓
┌──────────────────────────────────────┐
│ STEP 2: ADD TO CART                  │
└──────────────────────────────────────┘
    ↓
Frontend receives product
    ↓
Create cart item:
{
  product_id: 1,
  name: "Mineral Water",
  barcode: "123456",
  price: 50,
  unit: "bottle",
  bottle_capacity: 500,  // Stored for display
  bottle_unit: "ml",     // Stored for display
  quantity: 1,           // Default qty
  discount: 0,           // % discount
  tax: 18,              // % tax (GST)
  available: 100        // Check stock
}
    ↓
Add to cartItems array
    ↓
┌──────────────────────────────────────┐
│ STEP 3: DISPLAY IN CART              │
└──────────────────────────────────────┘
    ↓
Cart Table Row:
┌─────────┬────────┬──────┬───────────┐
│ Item    │ Price  │ Qty  │ Total     │
├─────────┼────────┼──────┼───────────┤
│ Mineral │ ₹50    │  [1] │ ₹59       │
│ Water   │/bottle │ ← →  │           │
│ 123456  │500ml   │      │ (+Tax)    │
└─────────┴────────┴──────┴───────────┘

Qty field:
  - Manual input: user types "5"
  - Or +/- buttons to increment/decrement
  - Max qty = available stock (100)
    ↓
┌──────────────────────────────────────┐
│ STEP 4: CALCULATE TOTALS             │
└──────────────────────────────────────┘
    ↓
Calculate per item:
  subtotal = qty * unit_price
           = 5 * 50
           = ₹250

  discount_amount = subtotal * (discount% / 100)
                  = 250 * 0%
                  = 0

  tax_amount = (subtotal - discount) * (tax% / 100)
             = 250 * 18%
             = ₹45

  item_total = subtotal - discount + tax
             = 250 - 0 + 45
             = ₹295
    ↓
Sum all items for order totals:
  order_subtotal = sum(all item subtotals)
  order_discount = sum(all item discounts)
  order_tax = sum(all item taxes)
  order_total = order_subtotal - order_discount + order_tax
    ↓
Update Bill Summary display
    ↓
┌──────────────────────────────────────┐
│ STEP 5: CUSTOMER DETAILS             │
└──────────────────────────────────────┘
    ↓
User enters phone: "9999999999"
    ↓
Click "Search Customer" button
    ↓
Call GET /customers/{phone}
    ↓
Response:
  - If found: auto-fill name, email
             show "Existing Customer" badge
  - If not found: "New Customer"
                  allow to create
    ↓
User can edit/add details
    ↓
┌──────────────────────────────────────┐
│ STEP 6: PAYMENT                      │
└──────────────────────────────────────┘
    ↓
Select payment method:
  - Cash
  - Card
  - UPI
  - Online
    ↓
Enter amount paid: "300"
    ↓
Auto-calculate balance:
  balance = total - amount_paid
          = 295 - 300
          = -5
    ↓
Display:
  if balance < 0: "₹5 Change"
  if balance > 0: "₹5 Due"
  if balance = 0: "Exact Payment"
    ↓
┌──────────────────────────────────────┐
│ STEP 7: SUBMIT SALE                  │
└──────────────────────────────────────┘
    ↓
User clicks "Complete Sale"
    ↓
Validate:
  ✓ Cart not empty
  ✓ Phone number provided
  ✓ Amount paid >= 0
    ↓
Build request payload:
{
  items: [
    {
      product_id: 1,
      quantity: 5,
      unit_price: 50,
      discount_percent: 0,
      discount_amount: 0,
      tax_percent: 18,
      tax_amount: 45,
      subtotal: 250,
      total_amount: 295
    }
  ],
  customer_phone: "9999999999",
  customer_name: "John",
  customer_email: "john@email.com",
  payment_method: "cash",
  amount_paid: 300,
  notes: ""
}
    ↓
POST /sales/create
    ↓
┌──────────────────────────────────────┐
│ BACKEND: PROCESS SALE                │
└──────────────────────────────────────┘
    ↓
1. Validate all data
    ↓
2. Create Sale record in DB:
   INSERT INTO sales (
     business_id, sale_number, customer_name,
     customer_phone, customer_email,
     subtotal, discount_amount, tax_amount,
     total_amount, payment_method,
     payment_status, amount_paid, amount_due,
     created_by, created_at
   )
   VALUES (...)
    ↓
3. Generate invoice number: SALE-001, SALE-002
    ↓
4. Get sale_id from inserted record
    ↓
5. For each item, create SaleItem:
   INSERT INTO sale_items (
     sale_id, product_id, quantity,
     unit_price, discount_percent, tax_percent,
     subtotal, total_amount, ...
   )
   VALUES (...)
    ↓
6. UPDATE Product Quantity:
   For product_id=1:
   
   unit_name = product.unit.lower() = "bottle"
   
   if unit_name == "bottle":
       quantity_to_deduct = 5  // Direct bottle count
   
   product.quantity = 100 - 5 = 95 bottles
   
   UPDATE products
   SET quantity = 95
   WHERE id = 1
    ↓
7. Return response:
   {
     id: 1,
     sale_number: "SALE-001",
     total_amount: 295,
     status: "success",
     items: [...]
   }
    ↓
┌──────────────────────────────────────┐
│ FRONTEND: HANDLE RESPONSE            │
└──────────────────────────────────────┘
    ↓
Show success notification:
  "Sale created: SALE-001"
    ↓
Clear localStorage:
  - removeItem("salesCart")
  - removeItem("salesCustomer")
  - removeItem("salesPaymentMethod")
  - removeItem("salesAmountPaid")
    ↓
Reset form state:
  - cartItems: []
  - customer: {}
  - amountPaid: ""
    ↓
Focus back to search input
    ↓
Ready for next sale
```

---

## FLOW 5: INVENTORY UPDATE LOGIC (DETAILED)

```
When Sale is Created, Quantity Deduction Happens:

Product Setup:
┌─────────────────────────────────┐
│ Mineral Water Bottle (BOTTLE)   │
│ - id: 1                         │
│ - unit: "bottle"                │
│ - bottle_capacity: 500          │
│ - bottle_unit: "ml"             │
│ - current quantity: 100         │
└─────────────────────────────────┘

Sale: Customer buys 5 bottles
    ↓
Backend executes for each item:
    ↓
GET unit_name:
  unit_name = product.unit.lower() = "bottle"
    ↓
Deduction Logic:
  if unit_name == "bottle":
    quantity_to_deduct = float(item.quantity)
                        = float(5)
                        = 5.0 (bottles, not ml)
    ✗ NOT: 5 * 500 = 2500
    ✗ NOT converting to ml
    ✓ Direct bottle count
    ↓
Update inventory:
  old_quantity = 100 bottles
  new_quantity = 100 - 5 = 95 bottles
    ↓
Database update:
  UPDATE products
  SET quantity = 95.000
  WHERE id = 1;
    ↓
Log:
  ✓ Updated Mineral Water:
    Quantity 100 → 95 bottles
    (sold 5 bottles = -5)

───────────────────────────────────

Comparison with KG Product:

Product Setup:
┌─────────────────────────────────┐
│ Rice (KG)                       │
│ - id: 2                         │
│ - unit: "kg"                    │
│ - current quantity: 50          │
└─────────────────────────────────┘

Sale: Customer buys 2.5 kg
    ↓
GET unit_name:
  unit_name = "kg"
    ↓
Deduction Logic:
  if unit_name in ['kg', 'kilogram', ...]:
    quantity_to_deduct = float(item.quantity)
                        = 2.5
    ↓
Update inventory:
  old_quantity = 50 kg
  new_quantity = 50 - 2.5 = 47.5 kg
    ↓
Database update:
  UPDATE products
  SET quantity = 47.500
  WHERE id = 2;

───────────────────────────────────

Example with Unit Multiplier:

Product Setup:
┌─────────────────────────────────┐
│ Sugar Box (BOX)                 │
│ - id: 3                         │
│ - unit: "box"                   │
│ - unitvalue: 5 (1 box = 5kg)    │
│ - current quantity: 50kg        │
└─────────────────────────────────┘

Sale: Customer buys 3 boxes
    ↓
GET unit_name:
  unit_name = "box"
    ↓
Deduction Logic:
  else:  // Unit not in special list
    unit_multiplier = float(product.unitvalue) or 1.0
                    = 5
    quantity_to_deduct = float(item.quantity) * unit_multiplier
                        = 3 * 5
                        = 15 kg
    ↓
Update inventory:
  old_quantity = 50 kg
  new_quantity = 50 - 15 = 35 kg
    ↓
Database update:
  UPDATE products
  SET quantity = 35.000
  WHERE id = 3;
    ↓
Log:
  ✓ Updated Sugar:
    Quantity 50 → 35 kg
    (sold 3 box = 3 * 5kg = -15kg)
```

---

## FLOW 6: UNIT MANAGEMENT (NEW FEATURE)

```
User navigates: Products > Unit Management
    ↓
┌──────────────────────────────────────┐
│ UnitManagement.jsx loads             │
│                                      │
│ State:                               │
│ - units: [] (from localStorage)      │
│ - formData:                          │
│   {                                  │
│     unitTitle: "",                   │
│     baseUnit: "",                    │
│     baseUnitCode: "",                │
│     unitValue: "",                   │
│     subUnit: "",                     │
│     subUnitCode: ""                  │
│   }                                  │
└──────────────────────────────────────┘
    ↓
User fills form:
  Unit Title: "Weight"
  Base Unit: "Kilogram"
  Base Unit Code: "kg"
  Unit Value: "1000"  (numeric only)
  Sub Unit: "Milligram"
  Sub Unit Code: "mg"
    ↓
Live Preview shows:
  "Conversion: 1 kg = 1000 mg"
    ↓
Validation:
  ✓ All fields required
  ✓ Unit Value must be number > 0
    ↓
Submit "Create Unit"
    ↓
Add to units array:
{
  id: 1642789432000,  // Timestamp
  unitTitle: "Weight",
  baseUnit: "Kilogram",
  baseUnitCode: "kg",
  unitValue: "1000",
  subUnit: "Milligram",
  subUnitCode: "mg"
}
    ↓
Save to localStorage:
  localStorage.setItem(
    "customUnits",
    JSON.stringify(units)
  )
    ↓
Display in card grid:
┌────────────────────────────┐
│ Weight                     │
│ Base: Kilogram (kg)        │
│ 1 kg = 1000 mg             │
│ Sub: Milligram (mg)        │
│ [Edit] [Delete]            │
└────────────────────────────┘
    ↓
Features:
  - Edit: Click edit button, fill form again
  - Delete: Confirm, remove from array
  - Persist: Survives page refresh
    ↓
Future Backend:
  POST /units/create
  - Create units table
  - Link to business_id
  - Use in AddProducts form
```

---

## KEY DECISION POINTS IN CODE

### 1. Unit Selection Logic
```javascript
// In AddProducts.jsx
const handleUnitChange = (unit) => {
  const isBottle = unit === "bottle";
  
  setProductForm(prev => ({
    ...prev,
    unit,
    unitvalue: isBottle ? "" : prev.unitvalue,  // Clear if bottle
    bottle_capacity: isBottle ? prev.bottle_capacity : "",
    bottle_unit: isBottle ? "ml" : ""
  }));
};
```

### 2. Bottle Field Visibility
```javascript
// In AddProducts.jsx render
if (productForm.unit === "bottle") {
  // Show: bottleCapacity, bottleUnit
  // Hide: unitValue
  // Disable: unitValue
}
```

### 3. Quantity Deduction Decision
```python
# In sales.py routes
unit_name = (product.unit or '').lower()

if unit_name == 'bottle':
    quantity_to_deduct = float(item.quantity)
elif unit_name in ['kg', 'kilogram', 'liter', ...]:
    quantity_to_deduct = float(item.quantity)
else:
    unit_multiplier = float(product.unitvalue) or 1.0
    quantity_to_deduct = float(item.quantity) * unit_multiplier
```

### 4. Price Formatting for Display
```javascript
// In AllProducts.jsx
const formatUnitPrice = (price, unit, unitvalue, 
                         bottleCapacity, bottleUnit) => {
  const baseUnit = unit || 'unit';
  
  if (baseUnit.toLowerCase() === 'bottle' && bottleCapacity) {
    return `/ bottle(${bottleCapacity}${bottleUnit || ''})`;
  } else if (unitvalue) {
    return `/ unit`;
  } else {
    return `/ ${baseUnit}`;
  }
};
```

