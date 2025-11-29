# System Architecture Overview

## Complete System Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         WEB BROWSER / MOBILE APP                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     React Application                           │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │ AddProducts Component (Main Screen)                        │ │  │
│  │  │                                                            │ │  │
│  │  │ ┌──────────────────────────────────────────────────────┐  │ │  │
│  │  │ │ LoadingSpinner                                       │  │ │  │
│  │  │ │ (Shows while loading categories from API)           │  │ │  │
│  │  │ └──────────────────────────────────────────────────────┘  │ │  │
│  │  │                                                            │ │  │
│  │  │ ┌──────────────────────────────────────────────────────┐  │ │  │
│  │  │ │ Category Dropdown (Populated from Database)         │  │ │  │
│  │  │ │ - Fetched via categoryService                       │  │ │  │
│  │  │ │ - Manages loading state                             │  │ │  │
│  │  │ │ - Retry on failure                                  │  │ │  │
│  │  │ └──────────────────────────────────────────────────────┘  │ │  │
│  │  │                                                            │ │  │
│  │  │ ┌──────────────────────────────────────────────────────┐  │ │  │
│  │  │ │ QR Code Scanner Button                              │  │ │  │
│  │  │ │ - Opens Modal Scanner (html5-qrcode)               │  │ │  │
│  │  │ │ - Camera access & permission handling               │  │ │  │
│  │  │ │ - Manual entry fallback                             │  │ │  │
│  │  │ │ - Error recovery with retry                         │  │ │  │
│  │  │ └──────────────────────────────────────────────────────┘  │ │  │
│  │  │                                                            │ │  │
│  │  │ ┌──────────────────────────────────────────────────────┐  │ │  │
│  │  │ │ Other Form Fields & Controls                        │  │ │  │
│  │  │ │ (Images, Labels, Pricing, Supplier Info)           │  │ │  │
│  │  │ └──────────────────────────────────────────────────────┘  │ │  │
│  │  │                                                            │ │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  │                                                                  │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │ QRCodeScanner Modal Component (When Visible)           │  │  │
│  │  │ - Camera feed display                                   │  │  │
│  │  │ - Barcode detection (multiple formats)                │  │  │
│  │  │ - Manual input field                                  │  │  │
│  │  │ - Error handling & recovery                           │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  │                                                                  │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │ Service Layer                                           │  │  │
│  │  │                                                         │  │  │
│  │  │ categoryService.js                                    │  │  │
│  │  │ ├─ fetchCategories()                                 │  │  │
│  │  │ ├─ createCategory()                                 │  │  │
│  │  │ ├─ updateCategory()                                 │  │  │
│  │  │ └─ deleteCategory()                                 │  │  │
│  │  │                                                         │  │  │
│  │  │ Features:                                              │  │  │
│  │  │ • Retry logic with exponential backoff               │  │  │
│  │  │ • Error classification & user messages               │  │  │
│  │  │ • Data transformation                                │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  │                                                                  │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │ Custom Hook: useDependentDataLoader                    │  │  │
│  │  │                                                         │  │  │
│  │  │ Manages:                                               │  │  │
│  │  │ • Multiple dependent API calls                        │  │  │
│  │  │ • Loading states                                      │  │  │
│  │  │ • Error tracking                                      │  │  │
│  │  │ • Retry logic per dependency                          │  │  │
│  │  │ • Parallel or sequential fetching                     │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  │                                                                  │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │ HTTP Client (Axios)                                    │  │  │
│  │  │ • axios.js configuration                              │  │  │
│  │  │ • Request/response interceptors                       │  │  │
│  │  │ • Token management                                    │  │  │
│  │  │ • Timeout & retry settings                            │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  External Libraries:                                                    │
│  • react@19.1.1                                                        │
│  • primereact@10.9.7 (UI components)                                   │
│  • axios@1.6.0 (HTTP client)                                           │
│  • html5-qrcode@2.3.4 (QR code scanning)                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS/HTTP ↓
         ┌───────────────────────────────────────────────┐
         │        Network / Internet                     │
         └───────────────────────────────────────────────┘
                              ↓ HTTPS/HTTP ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         FastAPI Backend Server                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ API Routes Layer (app/routes/)                                  │  │
│  │                                                                  │  │
│  │ categories.py Routes:                                           │  │
│  │ ├─ GET  /api/categories        (Get all categories)            │  │
│  │ ├─ GET  /api/categories/{id}   (Get by ID)                    │  │
│  │ ├─ POST /api/categories        (Create new category)           │  │
│  │ ├─ PUT  /api/categories/{id}   (Update category)               │  │
│  │ └─ DELETE /api/categories/{id} (Delete category)               │  │
│  │                                                                  │  │
│  │ Features:                                                       │  │
│  │ • Request validation (Pydantic schemas)                        │  │
│  │ • Authentication/Authorization checks                          │  │
│  │ • Comprehensive error handling                                 │  │
│  │ • Detailed error messages                                      │  │
│  │ • Logging for audit trail                                      │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Business Logic Layer (Error Handling & Validation)              │  │
│  │                                                                  │  │
│  │ parse_exception_to_error_detail()                               │  │
│  │ ├─ IntegrityError handling                                     │  │
│  │ │  ├─ Duplicate key detection                                  │  │
│  │ │  ├─ Foreign key violations                                   │  │
│  │ │  └─ Not null violations                                      │  │
│  │ ├─ OperationalError handling                                   │  │
│  │ ├─ DatabaseError handling                                      │  │
│  │ └─ ValidationError handling                                    │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Schema/Serialization Layer (app/schemas/)                       │  │
│  │                                                                  │  │
│  │ categories.py:                                                  │  │
│  │ ├─ CategoryBase (shared fields)                                │  │
│  │ ├─ CategoryCreate (POST request validation)                    │  │
│  │ ├─ CategoryUpdate (PUT request validation)                     │  │
│  │ └─ CategoryResponse (API response format)                      │  │
│  │                                                                  │  │
│  │ Features:                                                       │  │
│  │ • Field validation (min/max length)                            │  │
│  │ • Type checking                                                │  │
│  │ • Documentation strings                                        │  │
│  │ • Automatic OpenAPI docs generation                           │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ ORM/Database Layer (app/models/)                                │  │
│  │                                                                  │  │
│  │ categories.py - SQLAlchemy Model:                               │  │
│  │ ├─ id (Integer, PK, Auto-increment)                            │  │
│  │ ├─ name (String, Unique, Indexed)                              │  │
│  │ ├─ description (String, Optional)                              │  │
│  │ ├─ created_at (DateTime, Auto-generated)                       │  │
│  │ └─ updated_at (DateTime, Auto-updated)                         │  │
│  │                                                                  │  │
│  │ Database Operations:                                            │  │
│  │ • SQLAlchemy ORM                                               │  │
│  │ • Connection pooling                                           │  │
│  │ • Transaction management                                       │  │
│  │ • Query optimization                                           │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Configuration (main.py)                                         │  │
│  │                                                                  │
│  │ • CORS configuration (allow multiple origins)                  │  │
│  │ • Middleware setup                                             │  │
│  │ • Route registration                                           │  │
│  │ • Database initialization                                      │  │
│  │ • Error handling middleware                                    │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓ DB Connection ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         Database Layer                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Database Server (SQLite/PostgreSQL/MySQL)                             │
│                                                                          │
│  Table: categories                                                      │
│  ├─ id: INTEGER PRIMARY KEY AUTOINCREMENT                             │
│  ├─ name: VARCHAR(100) UNIQUE NOT NULL                                │
│  ├─ description: VARCHAR(500)                                         │
│  ├─ created_at: DATETIME DEFAULT CURRENT_TIMESTAMP                    │
│  └─ updated_at: DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE          │
│                                                                          │
│  Indexes:                                                               │
│  ├─ PRIMARY KEY (id)                                                  │
│  ├─ UNIQUE (name)                                                     │
│  └─ INDEX (id)                                                        │
│                                                                          │
│  Sample Data:                                                           │
│  ┌────┬──────────────┬─────────────────────────────────────────────┐  │
│  │ id │    name      │           description                       │  │
│  ├────┼──────────────┼─────────────────────────────────────────────┤  │
│  │  1 │ Electronics  │ Electronic devices and gadgets              │  │
│  │  2 │ Clothing     │ Apparel and fashion items                   │  │
│  │  3 │ Food         │ Consumable food products                    │  │
│  └────┴──────────────┴─────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Category Loading Flow

```
User Opens Add Products Page
        ↓
Component Mounts
        ↓
useDependentDataLoader Hook Initializes
        ↓
fetchCategories() Called
        ↓
    ┌───┴────────────────────┐
    │                        │
    ↓                        ↓
Success              Failure/Error
    │                        │
    ├─→ Transform Data  ←────┤
    │   (label, value)       │
    │                        │
    ├─→ Update State    ←────┤
    │   (data object)        │
    │                        │
    ├─→ Hide Spinner    ←────┤
    │                        │
    └────────────┬───────────┘
                 ↓
            Dropdown Updated
            (User can select)
```

### 2. QR Code Scanning Flow

```
User Clicks "Scan" Button
        ↓
QRCodeScanner Modal Opens
        ↓
HTML5-QRCode Library Initializes
        ↓
Request Camera Permission
        ↓
    ┌───┴─────────────────────┐
    │                         │
    ↓                         ↓
Granted                    Denied
    │                         │
    ├─→ Camera Feed   ←───────┤
    │   Starts               Show Error
    │                        Message
    ├─→ Scanning          ←──→ Offer
    │   Loop                Manual Entry
    │                          │
    ├─→ Detect Code        ←──┤
    │   (multiple formats)
    │
    ├─→ Confidence Check
    │   (require 2 matches)
    │
    ├─→ Display Result
    │
    ├─→ User Confirms
    │
    ├─→ Data Returned
    │
    ├─→ Modal Closes
    │
    └─→ Barcode Field Updated
```

### 3. Error Handling Flow

```
API Request Sent
        ↓
    ┌───┴─────────────────┐
    │                     │
    ↓                     ↓
Success              Error/Failure
    │                     │
    │                     ├─→ Parse Error
    │                     │
    │                     ├─→ Classify Type
    │                     │   (Network, Auth, Validation, etc.)
    │                     │
    │                     ├─→ Generate Message
    │                     │   (User-friendly)
    │                     │
    │                     ├─→ Log Details
    │                     │   (Console, Backend)
    │                     │
    │                     ├─→ Update Error State
    │                     │
    │                     ├─→ Show Toast
    │                     │   Notification
    │                     │
    │                     ├─→ Check Retry Count
    │                     │   │
    │                     │   ├─ < Max: Retry with Backoff
    │                     │   └─ >= Max: Show Error to User
    │                     │
    │                     └─→ Offer Manual Alternative
    │                         or Retry Button
    │
    └─→ Continue Processing
```

---

## Component Hierarchy

```
App (Root)
├── Router
│   └── Routes
│       └── AddProducts (Our Focus)
│           ├── Toast (Global notifications)
│           ├── LoadingSpinner (Dependent data loading)
│           │   └── ProgressSpinner (PrimeReact)
│           ├── QRCodeScanner (Modal component)
│           │   ├── Dialog (PrimeReact)
│           │   ├── Html5QrcodeScanner (html5-qrcode)
│           │   ├── InputText (Manual entry)
│           │   └── Buttons
│           ├── Dialog (Add Category)
│           │   ├── InputText
│           │   └── Buttons
│           ├── Form Sections
│           │   ├── Media Section
│           │   │   ├── Buttons (Upload, Camera)
│           │   │   └── Image Thumbnails
│           │   ├── Barcode Details
│           │   │   ├── Scan Button → Opens QRCodeScanner
│           │   │   └── InputText
│           │   ├── Product Information
│           │   │   └── InputTexts
│           │   ├── Category Selection
│           │   │   ├── Add Button → Opens Category Dialog
│           │   │   └── Dropdown (Populated from Categories)
│           │   ├── Pricing
│           │   │   └── InputTexts
│           │   ├── Dates
│           │   │   └── Calendar Components
│           │   ├── Labels (Custom)
│           │   │   └── Label Items
│           │   └── Supplier Details
│           │       └── InputTexts
│           └── Dialog (Image Gallery)
│               └── Image Display & Selection
```

---

## State Management Architecture

```
Component State (AddProducts)
├── productForm (Product data)
│   ├── name, description, brand
│   ├── price, quantity, unit, cgst
│   ├── category (from database dropdown)
│   ├── barcode (populated by QR scanner)
│   ├── mfgDate, expiryDate
│   └── supplier info
│
├── variants (Custom labels)
│   └── Array of { id, name, value, saved }
│
├── productImages (Uploaded images)
│   └── Array of { id, file, url, name }
│
├── UI State
│   ├── categoryDialogVisible
│   ├── scannerVisible
│   ├── galleriaVisible
│   ├── primaryImageIndex
│   └── isCreatingCategory
│
├── Form Data
│   ├── newCategory
│   └── manualInput
│
└── Hook State (useDependentDataLoader)
    ├── data (categories)
    ├── isLoading
    ├── error
    ├── retry function
    └── failedKeys
```

---

## API Contract

### Request/Response Examples

**GET /api/categories**
```json
// Request
GET /api/categories
Authorization: Bearer <token> (optional)

// Response 200 OK
[
  {
    "id": 1,
    "name": "Electronics",
    "description": "Electronic devices",
    "created_at": "2024-11-28T10:30:00",
    "updated_at": "2024-11-28T10:30:00"
  }
]
```

**POST /api/categories**
```json
// Request
POST /api/categories
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "New Category",
  "description": "Optional description"
}

// Response 201 Created
{
  "id": 2,
  "name": "New Category",
  "description": "Optional description",
  "created_at": "2024-11-28T10:31:00",
  "updated_at": "2024-11-28T10:31:00"
}

// Response 409 Conflict (Duplicate)
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

## Technology Stack

### Frontend
- **Framework**: React 19.1.1
- **UI Library**: PrimeReact 10.9.7
- **HTTP Client**: Axios 1.6.0
- **QR Scanner**: html5-qrcode 2.3.4
- **Router**: React Router 7.9.5
- **Styling**: Tailwind CSS 4.1.17

### Backend
- **Framework**: FastAPI
- **ORM**: SQLAlchemy
- **Validation**: Pydantic
- **Server**: Uvicorn
- **Database**: SQLite/PostgreSQL/MySQL (configurable)

### DevTools
- **Build**: Vite 7.1.7
- **Linting**: ESLint 9.36.0
- **Package Manager**: npm

---

## Key Features Summary

| Feature | Implementation | Status |
|---------|-----------------|--------|
| Database Categories | SQLAlchemy ORM model + API routes | ✅ Complete |
| Category Fetching | Service layer with retry logic | ✅ Complete |
| Loading States | useDependentDataLoader hook + Spinner | ✅ Complete |
| QR Code Scanning | html5-qrcode with modal interface | ✅ Complete |
| Error Handling | Comprehensive with retry & classification | ✅ Complete |
| Error Recovery | Automatic retry + manual fallback | ✅ Complete |
| Form Integration | Dropdown + Scanner + Manual input | ✅ Complete |
| Responsive Design | Mobile-friendly layout | ✅ Complete |
| Accessibility | Keyboard nav + Screen reader support | ✅ Complete |
| Performance | Optimized loading + caching | ✅ Complete |

---

## Deployment Checklist

- [ ] Database migration completed
- [ ] Backend server tested and working
- [ ] Frontend dependencies installed
- [ ] Environment variables configured
- [ ] API endpoints verified
- [ ] Loading states tested
- [ ] QR scanner tested on target devices
- [ ] Error handling tested
- [ ] Performance verified
- [ ] Security reviewed
- [ ] Accessibility verified
- [ ] Documentation complete
- [ ] Team training completed
