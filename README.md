# Assignment 3: Inventory and Data Management System

**Course:** Web Dev III  
**Unit:** 3  
**Technology:** Node.js, Express.js, MongoDB, Mongoose and dotenv

A REST API for managing a store/warehouse product catalogue. It includes validated product records, CRUD operations, filtering, sorting, pagination, safe stock adjustment, low-stock reporting and category-wise aggregation.

## 1. Requirements

- Node.js 18 or later
- MongoDB Community Server running locally, or a MongoDB Atlas connection string
- VS Code
- Postman (recommended for API testing)

## 2. Open in VS Code

1. Extract `Inventory_Data_Management_System.zip`.
2. In VS Code choose **File → Open Folder** and select `Inventory_Data_Management_System`.
3. Open the integrated terminal (**Terminal → New Terminal**).

## 3. Install and configure

```bash
npm install
```

Create your own `.env` file in the project root by copying `.env.example`, then set the MongoDB connection string:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/inventory_management
NODE_ENV=development
```

For MongoDB Atlas, replace the local URI with your own Atlas connection string. Do not share or commit `.env`.

## 4. Run the project

```bash
npm run dev
```

Or:

```bash
npm start
```

When connected, the terminal displays `MongoDB connected successfully` and the API runs at `http://localhost:5000`.

## 5. API endpoints

Base URL: `http://localhost:5000/api/products`

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/` | Create a product |
| GET | `/` | List products |
| GET | `/:id` | Get one product |
| PUT | `/:id` | Update product details |
| DELETE | `/:id` | Delete a product |
| PATCH | `/:id/stock` | Restock or record a sale |
| GET | `/low-stock` | Low-stock alert report |
| GET | `/summary` | Category-wise inventory summary |

### Create product — POST `/api/products`

Set `Content-Type: application/json` and send:

```json
{
  "name": "Gel Pen Pack of 15",
  "sku": "STNY-PN-713",
  "category": "Stationery",
  "price": 120,
  "quantity": 40,
  "reorderLevel": 20,
  "supplier": "Cello Pens"
}
```

### List, filter, sort and paginate

Examples:

```text
GET /api/products
GET /api/products?category=Stationery
GET /api/products?search=pen
GET /api/products?minPrice=50&maxPrice=500
GET /api/products?sort=price
GET /api/products?sort=-price
GET /api/products?page=2&limit=5
GET /api/products?category=Stationery&sort=name&page=1&limit=10
```

`sort` supports `name`, `price`, `quantity`, `createdAt`, `updatedAt` and `category`. Prefix a field with `-` for descending order. Page size is capped at 100.

### Get one product — GET `/api/products/PRODUCT_ID`

Copy the `_id` returned by the create/list endpoint and replace `PRODUCT_ID`.

### Update product — PUT `/api/products/PRODUCT_ID`

Send only the fields you want to change, for example:

```json
{
  "price": 140,
  "quantity": 60
}
```

### Delete product — DELETE `/api/products/PRODUCT_ID`

Replace `PRODUCT_ID` with a real product ID.

### Stock adjustment — PATCH `/api/products/PRODUCT_ID/stock`

Restock by sending a positive number:

```json
{ "change": 10 }
```

Record a sale by sending a negative number:

```json
{ "change": -3 }
```

The API prevents stock from becoming negative and performs the change atomically.

### Low-stock report — GET `/api/products/low-stock`

Returns products where `quantity` is less than or equal to `reorderLevel`.

### Category summary — GET `/api/products/summary`

Uses a MongoDB aggregation pipeline to calculate product count, total quantity, total stock value and average price for each category.

## 6. Suggested testing order

1. Create two or more products with different categories.
2. List all products and test category/search/price filters.
3. Test ascending and descending sorting and pagination.
4. Fetch a product by its ID.
5. Update its price or quantity.
6. Increase stock, then decrease stock. Try an excessive sale to confirm the negative-stock guard.
7. Open `/low-stock` after creating a product whose quantity is at or below its reorder level.
8. Open `/summary` and check the category totals.
9. Delete a product and fetch it again to confirm the 404 response.

## 7. Project structure

```text
Inventory_Data_Management_System/
├── src/
│   ├── config/db.js
│   ├── controllers/productController.js
│   ├── middleware/
│   │   ├── asyncHandler.js
│   │   ├── errorHandler.js
│   │   ├── notFound.js
│   │   └── validateObjectId.js
│   ├── models/Product.js
│   ├── routes/productRoutes.js
│   └── app.js
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## 8. Concepts demonstrated

- Mongoose schema design and field-level validation
- MongoDB persistent storage and Express REST routes
- Create, Read, Update and Delete operations
- Query-string filtering, sorting and pagination
- MongoDB aggregation pipelines
- Atomic stock increment/decrement
- Async error handling and centralized error responses
- Environment configuration with dotenv

**Note:** The source code is ready to open and run, but you must install dependencies and provide a working MongoDB connection in your local `.env` file. The API responses will appear when you run and test the endpoints; screenshots in the assignment brief are examples of expected API output, not pre-generated results from your machine.
