# E-commerce Backend API 

An e-commerce backend API built with NestJS, MongoDB, and TypeScript. Features include product management, user authentication, shopping cart, order processing, and mock payment integration.

##  Features

### Core Functionality
-  **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Admin/User)
  - Protected routes with guards
  - Secure password hashing with bcrypt

-  **User Management**
  - User registration and login
  - Profile management
  - Admin user management (CRUD)

-  **Product Management**
  - Full CRUD operations (Admin only)
  - Cursor-based pagination
  - Advanced filtering (category, price range, search)
  - Product stock management
  - Redis caching for improved performance

-  **Shopping Cart**
  - Add/remove/update items
  - Automatic total calculation
  - Stock validation
  - Persistent cart per user

-  **Order Management**
  - Create orders from cart
  - Order history with pagination
  - Order status tracking
  - Admin order management

-  **Checkout & Payment**
  - Mock payment gateway
  - Multiple payment methods support
  - Transaction tracking
  - Stock deduction on successful payment

### Technical Features
-  Mono-repo architecture with NestJS modules
-  Controller/Service/Repository pattern
-  DTO validation with class-validator
-  Secure environment configuration
-  Rate limiting
-  Redis caching
-  Swagger/OpenAPI documentation
-  MongoDB with Mongoose ODM
-  Database seeding script

##  Prerequisites

- Node.js (v18 or higher) - **Tested and compatible with Node.js 22.21.1** 
- MongoDB (v4.4 or higher)
- Redis (v6 or higher)
- npm or yarn

> **Note**: This project is fully compatible with Node.js 22! See [NODE_22_COMPATIBILITY.md](NODE_22_COMPATIBILITY.md) for details.

##  Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd ecommerce-api
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

MONGODB_URI=mongodb://localhost:27017/ecommerce

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=7d

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL=3600

THROTTLE_TTL=60
THROTTLE_LIMIT=10

DEFAULT_PAGE_SIZE=10
MAX_PAGE_SIZE=100
```

### 4. Start MongoDB
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use your local MongoDB installation
mongod
```

### 5. Start Redis
```bash
# Using Docker
docker run -d -p 6379:6379 --name redis redis:latest

# Or use your local Redis installation
redis-server
```

### 6. Seed the database
```bash
npm run seed
```

This will create:
- Admin user: `admin@example.com` / `Admin123!`
- Regular user: `user@example.com` / `User123!`
- 10 sample products

### 7. Start the application
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at: `http://localhost:3000/api/v1`

##  API Documentation

Once the application is running, access the Swagger documentation at:
```
http://localhost:3000/api/docs
```

##  API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### Users
- `GET /api/v1/users` - Get all users (Admin only)
- `GET /api/v1/users/profile` - Get current user profile
- `GET /api/v1/users/:id` - Get user by ID (Admin only)
- `POST /api/v1/users` - Create user (Admin only)
- `PATCH /api/v1/users/:id` - Update user (Admin only)
- `DELETE /api/v1/users/:id` - Delete user (Admin only)

### Products
- `GET /api/v1/products` - Get all products (with filters & pagination)
- `GET /api/v1/products/:id` - Get product by ID
- `POST /api/v1/products` - Create product (Admin only)
- `PATCH /api/v1/products/:id` - Update product (Admin only)
- `DELETE /api/v1/products/:id` - Delete product (Admin only)

### Cart
- `GET /api/v1/cart` - Get user cart
- `POST /api/v1/cart/items` - Add item to cart
- `PATCH /api/v1/cart/items/:productId` - Update cart item quantity
- `DELETE /api/v1/cart/items/:productId` - Remove item from cart
- `DELETE /api/v1/cart` - Clear cart

### Orders
- `POST /api/v1/orders` - Create order from cart
- `GET /api/v1/orders` - Get user order history
- `GET /api/v1/orders/all` - Get all orders (Admin only)
- `GET /api/v1/orders/:id` - Get order details
- `PATCH /api/v1/orders/:id/status` - Update order status (Admin only)

### Checkout
- `POST /api/v1/checkout/payment` - Process payment (Mock)
- `GET /api/v1/checkout/order/:orderId/status` - Get order payment status

##  Example API Calls

### 1. Register a new user
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "User123!"
  }'
```

### 3. Get products with filters
```bash
curl "http://localhost:3000/api/v1/products?category=Electronics&limit=10"
```

### 4. Add item to cart (requires authentication)
```bash
curl -X POST http://localhost:3000/api/v1/cart/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": "PRODUCT_ID",
    "quantity": 2
  }'
```

### 5. Create order
```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "shippingAddress": {
      "fullName": "John Doe",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA",
      "phone": "+1234567890"
    }
  }'
```

### 6. Process payment
```bash
curl -X POST http://localhost:3000/api/v1/checkout/payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "orderId": "ORDER_ID",
    "paymentMethod": "credit_card",
    "paymentDetails": {
      "cardNumber": "4111111111111111",
      "cardHolder": "John Doe",
      "expiryDate": "12/25",
      "cvv": "123"
    }
  }'
```

##  Project Structure

```
ecommerce-api/
├── src/
│   ├── common/
│   │   ├── decorators/      # Custom decorators
│   │   ├── guards/          # Auth guards
│   │   └── dto/             # Common DTOs
│   ├── database/
│   │   └── seeders/         # Database seeders
│   ├── modules/
│   │   ├── auth/            # Authentication module
│   │   ├── users/           # User management module
│   │   ├── products/        # Product management module
│   │   ├── cart/            # Shopping cart module
│   │   ├── orders/          # Order management module
│   │   └── checkout/        # Checkout & payment module
│   ├── schemas/             # Mongoose schemas
│   ├── app.module.ts        # Root module
│   └── main.ts              # Application entry point
├── .env.example             # Environment variables template
├── nest-cli.json            # NestJS CLI configuration
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript configuration
└── README.md                # This file
```

##  Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Admin and User roles with permissions
- **Input Validation**: DTO validation with class-validator
- **Rate Limiting**: Prevents API abuse
- **Environment Variables**: Secure configuration management

##  Database Schema

### Users
- name, email, password (hashed), role, isActive
- Indexes: email, role

### Products
- name, description, price, stock, category, images, isActive, createdBy
- Indexes: name (text), description (text), category, price, isActive, createdAt

### Carts
- user, items (product, quantity, price), totalAmount
- Index: user

### Orders
- orderNumber, user, items (product, productName, quantity, price, subtotal)
- totalAmount, status, paymentStatus, paymentMethod, transactionId, shippingAddress, notes
- Indexes: user, orderNumber, status, createdAt

##  Performance Optimizations

1. **Cursor-Based Pagination**: Efficient handling of large datasets
2. **Redis Caching**: Product listings and details cached
3. **Database Indexing**: Optimized query performance
4. **Rate Limiting**: Protects against excessive requests

##  Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

##  API Response Format

### Success Response
```json
{
  "data": { ... },
  "message": "Success message"
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

### Paginated Response
```json
{
  "data": [...],
  "pagination": {
    "nextCursor": "cursor_id",
    "hasMore": true
  }
}
```
---

**Note**: This is a demonstration project with mock payment processing.