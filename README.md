# DartCodes Smart Order Allocation System

A full-stack order management system that automatically assigns each customer order to the
most suitable branch, based on stock availability, proximity, and branch workload. Built for
the DartCodes Software Engineer Intern technical assessment.

## Live links

- **GitHub:** https://github.com/Tharindudesh43/DartCodes-Orders
- **Frontend:** _add your deployed URL here_
- **Backend API:** _add your deployed URL here_
- **ML service:** _add your deployed URL here (if deployed)_

## Technologies used

| Part | Stack |
|---|---|
| Backend | Node.js, Express, MongoDB (Mongoose) |
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| ML service | Python, FastAPI, scikit-learn |
| Auth | JWT, bcrypt |

## Setup instructions

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in MONGODB_URI, JWT_SECRET, ML_SERVICE_URL
npm run seed            # creates sample branches, products, and an admin user
npm run dev              # runs on http://localhost:5000
```

### 2. ML service
```bash
cd ml-service
python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app/train.py             # trains the classifier (model is also already committed)
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL
npm run dev                          # runs on http://localhost:3000
```

Seeded admin login: `admin@dartcodes.test` / `Admin@123`

## System architecture

Three independent services:

```
Next.js frontend  →  Express API (Node + MongoDB)  →  FastAPI ML service (Python)
```

- The **frontend** never talks to the ML service directly — it only calls the Express API.
- The **backend** is layered: `routes → controllers → services → models`. All business logic
  (branch allocation, message classification) lives in the `services/` folder, kept separate
  from HTTP handling in controllers and from raw database access in models.
- The **ML service** is a separate microservice so it can be retrained/redeployed independently,
  and so the Node backend doesn't need any Python dependencies.

## Branch allocation logic

There's no single "correct" algorithm for this — the approach here is a **filter → score → decide**
pipeline, chosen because it lets multiple factors compete in one, explainable decision rather than
a rigid if/else chain.

**Step 1 — Filter.** Any branch that's inactive, or missing stock for any item in the order, is
removed immediately. There's no point scoring a branch that can't actually fulfil the order.

**Step 2 — Score.** Every remaining branch gets a weighted score:

```
score = 0.5 × proximity + 0.2 × stockHealth + 0.3 × workload
```

- **Proximity** (weighted highest): closer branches deliver faster, which matters most to the
  customer experience. Uses the Haversine formula for real-world distance, decaying smoothly
  rather than a hard distance cutoff.
- **Workload** (second): prevents every order piling onto the same nearest branch — a busy branch
  scores lower so the system naturally spreads load.
- **Stock health** (lowest): the hard filter already guarantees a branch *can* fulfil the order,
  so this only fine-tunes *how comfortably* (a branch with barely enough stock scores lower than
  one with a safe margin).

**Step 3 — Decide.** Highest score wins; ties fall back to the less busy branch.

Allocation runs inside a **database transaction**: stock is decremented and the branch's workload
incremented atomically, with a guard (`quantity >= requested`) that fails safely if two orders
race for the same last unit. Cancelling an order reverses both.

### Edge cases handled
- No branch has full stock → order is recorded as `unfulfillable` rather than silently failing
- Concurrent orders competing for the last unit → transaction guard prevents overselling
- Order cancellation → stock and workload are restored
- Missing/invalid product IDs → rejected with a clear validation error before allocation runs

## Authentication & security approach

- Passwords hashed with **bcrypt** (cost factor 10)
- **JWT**-based auth, 3-day expiry — a single token rather than an access/refresh pair, chosen
  for simplicity within the project timeline; still a bounded, deliberate expiry rather than none
- **Role-based access control**: admin-only routes are protected by middleware that checks the
  role from the *verified token*, never from anything the client sends — so a normal user can't
  gain admin access by editing frontend requests
- **Rate limiting**: a general API limiter, plus a tighter one specifically on login/register to
  slow brute-force attempts
- **Input validation** on every mutating endpoint (order creation, product/branch management)
- **Helmet** for standard protective HTTP headers, **mongo-sanitize** against injection, and a
  bounded JSON body size limit
- Secrets (DB connection string, JWT secret) are read from environment variables, never committed
- HTTPS is provided automatically by the hosting platform in production

## AI/ML approach

A customer's order note or support message is classified into one of 8 categories (Payment Issue,
Delivery Issue, Refund/Cancellation, Account/Login Issue, Order Status Inquiry, Product/Stock
Inquiry, Promotion/Discount Inquiry, General Inquiry) using **TF-IDF + Logistic Regression**.

**Why this approach over a larger model:** the training dataset has 450 rows. That's far too small
to fine-tune a transformer meaningfully, but plenty for a classical model — it trains in under a
second, is fully explainable, and reached **~97% accuracy** on held-out test data.

**Handling low confidence:** predictions below a 0.5 confidence threshold are marked `isUncertain`
rather than forced into a category. The model's best guess is still kept (`topCandidate`) so an
admin sees "uncertain, but possibly X" instead of a dead end — a wrong confident guess is worse
than an honest "I'm not sure," especially for something like a payment complaint.

**Resilience:** classification is treated as a non-blocking enrichment. If the ML service is down
or times out, order/message creation still succeeds — it just isn't categorized. This is handled
with a timeout + fallback in `classificationService.js`.

## Assumptions & limitations

- No real payment processing — "refund" in this system means the order is cancelled and stock is
  released, not that money moves anywhere
- The proximity score uses a 10km decay constant, assuming branches operate within a single city;
  a nationwide deployment would need a larger constant
- Single-token JWT auth (no refresh flow) — acceptable trade-off for this project's scope
- Discounts are per-product only (percentage or flat), not order-wide promo codes
- Branch/product deletion isn't implemented — records are deactivated (`isActive: false`) instead,
  since hard-deleting something referenced by existing orders would break data integrity
