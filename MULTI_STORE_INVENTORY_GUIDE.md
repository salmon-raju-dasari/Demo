# Multi-Store Inventory Assignment System

## Overview
This comprehensive system allows you to assign products from the central inventory to multiple stores with automatic quantity tracking and user audit trails.

## Key Features

### 1. **Central Inventory Management**
- Products are stored in a central inventory with a master quantity
- When products are assigned to stores, the central quantity automatically decreases
- Central inventory reflects the true available stock across all locations

### 2. **Multi-Store Assignment**
- Assign same products to different stores
- Each store can have different quantities of the same product
- Track minimum stock thresholds per store

### 3. **User Tracking & Audit Trail**
- Every assignment is recorded with the user ID who made the assignment
- Timestamp of assignment is automatically recorded
- Complete history of which user assigned what products to which stores

### 4. **Product Search & Filtering**
- Search products by:
  - **Barcode**: Scan barcodes in the popup
  - **Product ID**: Search by product ID (e.g., PRD001)
  - **SKU**: Search by Stock Keeping Unit

## System Architecture

### Backend (FastAPI)

#### 1. **Database Model** (`app/models/store_inventory.py`)
```python
StoreInventory Table:
- id: Primary key
- business_id: Links to business
- product_id: Foreign key to products table
- store_id: Foreign key to stores table
- assigned_quantity: How much was assigned from central inventory
- current_quantity: Current quantity at store (may differ due to sales)
- min_stock_qty: Minimum stock alert threshold
- assigned_by_emp_id: Employee who made the assignment
- assigned_at: Timestamp of assignment
- updated_at: Last update timestamp
```

#### 2. **API Endpoints** (`app/routes/inventory.py`)

- **POST `/inventory/assign-product-to-store`**
  - Assign a product to a store
  - Automatically decreases central inventory quantity
  - Tracks which employee made the assignment
  - Response: StoreInventory record with all details

- **GET `/inventory/search-products`**
  - Search products by barcode, product ID, or SKU
  - Only shows products with available quantity in central inventory
  - Query parameters:
    - `search_type`: "barcode" | "productid" | "sku"
    - `search_value`: The value to search for

- **GET `/inventory/stores`**
  - Get list of all stores for the current business
  - Used to populate store dropdown in assignment modal

- **GET `/inventory/product/{product_id}/stores`**
  - Get all stores where a product is currently assigned
  - Shows assignment details for each store
  - Includes assigned quantity, current quantity, and who assigned it

- **GET `/inventory/store/{store_id}/inventory`**
  - Get all products assigned to a specific store
  - Shows current inventory levels per store

- **DELETE `/inventory/assignment/{assignment_id}`**
  - Delete an assignment and restore quantity to central inventory
  - Requires manager/admin role

- **GET `/inventory/assignment-history`**
  - Get complete history of assignments
  - Optional filters by product_id or store_id
  - Shows who assigned what when

### Frontend (React)

#### 1. **InventoryManagement Component** (`src/components/InventoryManagement.jsx`)
- Updated to show "Assign to Stores" button next to edit button
- Clicking the button opens the AssignmentModal
- Automatically refreshes product list after successful assignment

#### 2. **AssignmentModal Component** (`src/components/AssignmentModal.jsx`)
This is the main popup interface for assigning products. Features include:

**Step 1: Product Selection**
- Choice of search method (Barcode, Product ID, or SKU)
- Real-time search results
- Shows:
  - Product name
  - Product ID
  - SKU
  - Barcode
  - Available quantity in central inventory
  - Price

**Step 2: Store Assignment**
- Dropdown to select target store
- Quantity input field with validation
- Minimum stock threshold configuration
- Shows existing assignments for the product

**Features:**
- Shows all existing store assignments for selected product
- Expandable table showing:
  - Store name
  - Assigned quantity
  - Current quantity (after sales)
  - Who assigned it
  - When it was assigned
- Real-time error messages
- Success confirmation with details
- Quantity validation

## How It Works

### Workflow

1. **Go to Inventory Page**
   - Click on the Inventory Management in the menu

2. **View Products**
   - See list of all products with quantities
   - Filter by "All", "Out of Stock", or "Low Stock"

3. **Assign Product to Store**
   - Click the "Assign to Stores" button (blue share icon)
   - Modal opens with product pre-selected

4. **Search for Product** (if not pre-selected)
   - Select search type (Barcode, Product ID, or SKU)
   - Enter search value
   - Click Search or press Enter
   - Available products appear in list
   - Click to select a product

5. **Configure Assignment**
   - Select target store from dropdown
   - Enter quantity to assign from central inventory
   - (Optional) Set minimum stock threshold for this store
   - View existing assignments for this product

6. **Confirm Assignment**
   - Click "Assign" button
   - System validates:
     - Product has sufficient quantity in central inventory
     - Store is selected
     - Valid quantity entered
   
7. **Success**
   - Assignment is recorded with current user ID and timestamp
   - Central inventory quantity automatically decreases
   - Store inventory is created/updated
   - Modal shows success message
   - Product list automatically refreshes

## Data Flow Example

### Example: Assigning 50 units of Product "Coca Cola" to "Mumbai Store"

**Before Assignment:**
- Central Inventory: Coca Cola = 200 units
- Mumbai Store: (no assignment yet)

**Action:** Assign 50 units to Mumbai Store

**After Assignment:**
- Central Inventory: Coca Cola = 150 units (decreased by 50)
- Mumbai Store: Coca Cola = 50 units (newly created)
- Database Record: StoreInventory entry created with:
  - product_id: 5 (Coca Cola)
  - store_id: 1 (Mumbai)
  - assigned_quantity: 50
  - current_quantity: 50
  - assigned_by_emp_id: 1005 (current user)
  - assigned_at: 2026-02-12 10:30:45

### Later: If Mumbai Store sells 10 units

**Updated Quantities:**
- Central Inventory: Coca Cola = 150 units (unchanged)
- Mumbai Store: Coca Cola = 40 units (decreased by 10 due to sale)
- Database: StoreInventory current_quantity updated to 40

## Technical Implementation Details

### Central Quantity Update Logic
```python
# When assigning new or updating:
product.quantity -= assignment.assigned_quantity

# When deleting an assignment:
product.quantity += assignment.assigned_quantity
```

### Validation Checks
1. **Product Exists**: Verify product belongs to current business
2. **Store Exists**: Verify store belongs to current business
3. **Sufficient Stock**: Check if central inventory has enough quantity
4. **Unique Assignment**: Prevent duplicate product-store assignments (updates instead)
5. **User Authentication**: Only authenticated employees can assign
6. **Role-Based Access**: Only owner/admin/manager can assign or delete

### Audit Trail
Every assignment records:
- Who assigned it (employee ID and name)
- What was assigned (product ID)
- Where it was assigned (store ID)
- How much was assigned (quantity)
- When it was assigned (timestamp)
- Last update time (for modifications)

## API Usage Examples

### 1. Search Products by SKU
```bash
GET /api/inventory/search-products?search_type=sku&search_value=COCA-COLA-01
```

### 2. Assign Product to Store
```bash
POST /api/inventory/assign-product-to-store
{
  "product_id": 5,
  "store_id": 1,
  "assigned_quantity": 50,
  "min_stock_qty": 10
}
```

### 3. Get All Stores
```bash
GET /api/inventory/stores
```

### 4. Get Product Assignments
```bash
GET /api/inventory/product/5/stores
```

### 5. Get Store Inventory
```bash
GET /api/inventory/store/1/inventory
```

### 6. Get Assignment History
```bash
GET /api/inventory/assignment-history?product_id=5&limit=50
```

## Database Changes Required

The following database table will be created automatically when the backend starts:

```sql
store_inventory:
- id (INT, PK, AUTO)
- business_id (VARCHAR)
- product_id (INT, FK)
- store_id (INT, FK)
- assigned_quantity (DECIMAL 10,3)
- current_quantity (DECIMAL 10,3)
- min_stock_qty (DECIMAL 10,3)
- assigned_by_emp_id (INT, FK)
- assigned_at (DATETIME)
- updated_at (DATETIME)
- UNIQUE(product_id, store_id, business_id)
```

## Error Handling

The system handles various error scenarios:

1. **Insufficient Stock**
   - Error: "Insufficient product quantity. Available: X, Requested: Y"

2. **Product Not Found**
   - Error: "Product not found"

3. **Store Not Found**
   - Error: "Store not found"

4. **Invalid Search Type**
   - Error: "Invalid search_type. Must be 'barcode', 'productid', or 'sku'"

5. **No Results**
   - Shows: "No products found matching your search"

6. **Database Errors**
   - Generic error with retry option

## Security Features

1. **Authentication**: All endpoints require valid access token
2. **Authorization**: Role-based access control
   - View: All authenticated users
   - Assign/Delete: Only owner/admin/manager
3. **Business Isolation**: Data filtered by business_id
4. **Audit Trail**: All actions tracked with user ID and timestamp
5. **Validation**: Input validation on all fields

## Performance Optimizations

1. **Pagination**: Product search results limited to 50
2. **Indexes**: Foreign keys and business_id indexed
3. **Lazy Loading**: Assignment history lazy loaded
4. **Query Optimization**: Efficient joins for detail responses

## Files Modified/Created

### Backend
- Created: `app/models/store_inventory.py`
- Created: `app/schemas/inventory.py`
- Created: `app/routes/inventory.py`
- Modified: `app/models/__init__.py` (added StoreInventory import)
- Modified: `main.py` (added inventory model and route imports)

### Frontend
- Modified: `src/components/InventoryManagement.jsx`
- Created: `src/components/AssignmentModal.jsx`
- Created: `src/components/AssignmentModal.css`

## Next Steps (Optional)

1. **Dashboard Widget**: Show store-wise inventory levels
2. **Stock Transfer**: Move inventory between stores
3. **Inventory Reports**: Generate reports by store
4. **Alerts**: Notify when store stock falls below threshold
5. **Sync Sales**: Automatically update store quantities from sales
6. **Export**: Export store inventory to CSV/Excel
