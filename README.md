# E-Commerce Backend Template

Reusable NestJS backend starter for storefronts, admin dashboards, marketplace prototypes, and e-commerce integrations. It ships with authentication, role-based access control, product catalog APIs, cart flows, orders, a Paystack-ready checkout flow, MongoDB persistence, Redis-backed caching, Swagger docs, and a seed script so a fresh clone is usable quickly.

## What You Get

- NestJS 11 + TypeScript project structure
- JWT authentication and admin/user roles
- Product CRUD with filtering, search, and cursor pagination
- Cart management with stock-aware quantity updates
- Order creation and order history endpoints
- Paystack payment initialization and verification template
- MongoDB with Mongoose schemas
- Optional Redis caching for product reads
- Swagger documentation at `/api/docs`
- Seed script with demo users and sample products
- Docker + Docker Compose setup for containerized local development

## Project Fit

This repo now works best as a backend template you can clone and adapt when you need:

- a starter API for a storefront or mobile commerce app
- a backend for frontend practice projects
- a portfolio-ready commerce API with real structure
- a base for extending into payments, inventory, shipping, coupons, or webhooks

## Quick Start

### Option 1: Run locally

1. Install dependencies.

```bash
npm install
```

2. Create your environment file.

```bash
cp .env.example .env
```

PowerShell alternative:

```powershell
Copy-Item .env.example .env
```

3. Start MongoDB and Redis locally.

```bash
docker compose up -d mongodb redis
```

4. Seed the database.

```bash
npm run seed
```

5. Start the API.

```bash
npm run start:dev
```

The app will be available at `http://localhost:3000/api/v1` and Swagger will be available at `http://localhost:3000/api/docs`.

### Option 2: Run everything with Docker Compose

```bash
docker compose up --build
```

This starts:

- MongoDB on `localhost:27017`
- Redis on `localhost:6379`
- API on `localhost:3000`

If you want demo data after the containers are up, open another shell in the project and run:

```bash
npm run seed
```

## Demo Accounts

The seed script creates:

- Admin: `admin@example.com` / `Admin123!`
- User: `user@example.com` / `User123!`

`npm run seed` resets users and products before inserting sample data, so treat it as a development-only command.

## Environment Variables

Copy `.env.example` to `.env` and update values as needed.

| Variable | Required | Purpose | Example |
| --- | --- | --- | --- |
| `NODE_ENV` | No | Runtime environment | `development` |
| `PORT` | No | API port | `3000` |
| `API_PREFIX` | No | Global route prefix | `api/v1` |
| `MONGODB_URI` | Yes | MongoDB connection string | `mongodb://127.0.0.1:27017/ecommerce_template` |
| `JWT_SECRET` | Yes | JWT signing secret | `change-me-before-production` |
| `JWT_EXPIRATION` | No | Access token lifetime | `7d` |
| `PAYSTACK_PUBLIC_KEY` | No | Frontend Paystack public key | `pk_test_xxx` |
| `PAYSTACK_SECRET_KEY` | Yes for Paystack checkout | Server-side Paystack secret key | `sk_test_xxx` |
| `PAYSTACK_BASE_URL` | No | Paystack API base URL | `https://api.paystack.co` |
| `PAYSTACK_CALLBACK_URL` | No | Optional redirect URL passed when initializing a transaction | `http://localhost:3001/payments/callback` |
| `PAYSTACK_CURRENCY` | No | Currency sent to Paystack | `NGN` |
| `REDIS_HOST` | No | Redis host. Leave empty to use in-memory cache. | `127.0.0.1` |
| `REDIS_PORT` | No | Redis port | `6379` |
| `REDIS_TTL` | No | Cache TTL in seconds | `3600` |
| `THROTTLE_TTL` | No | Rate limit window in seconds | `60` |
| `THROTTLE_LIMIT` | No | Max requests per window | `10` |
| `DEFAULT_PAGE_SIZE` | No | Suggested default page size | `10` |
| `MAX_PAGE_SIZE` | No | Suggested max page size | `100` |

## API Surface

### Authentication

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

### Users

- `GET /api/v1/users`
- `GET /api/v1/users/profile`
- `GET /api/v1/users/:id`
- `POST /api/v1/users`
- `PATCH /api/v1/users/:id`
- `DELETE /api/v1/users/:id`

### Products

- `GET /api/v1/products`
- `GET /api/v1/products/:id`
- `POST /api/v1/products`
- `PATCH /api/v1/products/:id`
- `DELETE /api/v1/products/:id`

### Cart

- `GET /api/v1/cart`
- `POST /api/v1/cart/items`
- `PATCH /api/v1/cart/items/:productId`
- `DELETE /api/v1/cart/items/:productId`
- `DELETE /api/v1/cart`

### Orders

- `POST /api/v1/orders`
- `GET /api/v1/orders`
- `GET /api/v1/orders/all`
- `GET /api/v1/orders/:id`
- `PATCH /api/v1/orders/:id/status`

### Checkout

- `POST /api/v1/checkout/paystack/initialize`
- `POST /api/v1/checkout/paystack/verify`
- `GET /api/v1/checkout/order/:orderId/status`

Use Swagger for request/response shapes and authorization testing once the app is running.

## Common Commands

```bash
npm run start:dev
npm run build
npm run start:prod
npm run test
npm run test:e2e
npm run test:cov
npm run seed
```

## Example Flow

1. Register or log in.
2. Browse products with `GET /api/v1/products`.
3. Add a product to cart.
4. Create an order from the cart.
5. Call `POST /api/v1/checkout/paystack/initialize` to get an `authorizationUrl`, `accessCode`, and `reference`.
6. Complete payment on the frontend with Paystack using the returned data.
7. Call `POST /api/v1/checkout/paystack/verify` with the reference before fulfilling the order.

## Template Customization Ideas

Good first extensions for teams cloning this repo:

- add Paystack webhooks for automatic post-payment fulfillment
- swap Paystack out for Stripe, Flutterwave, or PayPal if needed
- add product images hosted in S3 or Cloudinary
- split admin and shopper auth flows
- add coupons, taxes, shipping rules, and inventory reservations
- introduce background jobs for emails and order events
- add CI, deployment manifests, and environment validation

## Project Structure

```text
e-commerce-api/
|-- src/
|   |-- common/
|   |-- modules/
|   |   |-- auth/
|   |   |-- cart/
|   |   |-- checkout/
|   |   |-- orders/
|   |   |-- products/
|   |   `-- user/
|   |-- schemas/
|   |-- utilities/
|   |-- app.controller.ts
|   |-- app.module.ts
|   `-- main.ts
|-- test/
|-- .env.example
|-- docker-compose.yml
|-- dockerfile
`-- README.md
```

## Notes

- Redis is optional for local development now. If `REDIS_HOST` is empty, the app falls back to the default in-memory cache.
- The root API route returns a small status payload instead of `Hello World!`, which makes the template friendlier for health checks.
- This template now uses Paystack's initialize-and-verify pattern, but it still stops short of a full production billing setup until you add webhooks, stronger reconciliation, and deployment-specific callback URLs.
