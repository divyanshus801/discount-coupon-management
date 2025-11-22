# Monk Commerce – Coupons Management API

A clean and extensible REST API for managing discount coupons across three types: **cart-wise**, **product-wise**, and **BxGy (Buy X Get Y)**.
The implementation focuses on correctness, clarity, and documenting all real-world cases as required in the assignment.

---

## Tech Stack

* Node.js (Express.js)
* PostgreSQL with Sequelize ORM
* Joi for validation
* Winston for logging

---

## How to Run

Clone and install dependencies:

```
git clone https://github.com/divyanshus801/discount-coupon-management.git
cd monk-commerce-backend
npm install
```

Configure environment:

```
cp .env.example .env
# Update database credentials
```

Run migrations:

```
npm run migrate
```

Start the server:

```
npm run dev
```

---

## API Endpoints

### Coupon Management (CRUD)

* POST /api/v1/coupons
* GET /api/v1/coupons
* GET /api/v1/coupons/:id
* PUT /api/v1/coupons/:id
* DELETE /api/v1/coupons/:id

### Coupon Application

* POST /api/v1/applicable-coupons
* POST /api/v1/apply-coupon/:id

---

## Coupon Types

### 1. Cart-Wise Discount

Percentage discount applied to the entire cart when the cart total crosses a defined threshold.

### 2. Product-Wise Discount

Percentage discount applied only on specific product(s) defined inside coupon details.

### 3. BxGy (Buy X Get Y)

Buy certain quantities from a “buy” set and get free items from a “get” set.
Supports repetition limits and works with multi-product buy/get combinations.

---

## Implemented Cases (Core Requirements)

1. Cart-wise discount with threshold
2. Cart-wise percentage discount
3. Product-wise discount on specific product_id
4. Product-wise scaling by quantity
5. BxGy basic logic
6. BxGy with repetition limits
7. BxGy with multiple buy products
8. BxGy with multiple get products
9. Expired coupon checks
10. Global usage limit
11. Maximum discount cap
12. Minimum cart value validation
13. Applicable coupons endpoint
14. Apply coupon endpoint (returns updated cart and discount summary)


## Unimplemented Cases (Documented for Future)

1. Flat Discount on Cart (Fixed Amount)
   Example: ₹100 OFF on cart (not percentage).

2. Shipping Fee Discount
   Reduce or waive shipping charge.

3. App-Only Coupons
   Coupons valid only when order placed from mobile app.

4. Per-user coupon usage limit
   Needs authentication (user login) to track per-user redemptions.

5. Coupon stacking / combining multiple coupons
   Apply more than one coupon in a single order (with rules).

6. Category-level or brand-level discounts
   Apply discount if product.category == X or product.brand == Y.

7. Tiered or slab-based discounts
   Example:
   ₹0–499 ⇒ 5%
   ₹500–999 ⇒ 10%
   ₹1000+ ⇒ 15%

8. Volume-based progressive discounts
   Example: Buy 5 items = 10% off, Buy 10 items = 20% off.

9. Time-window based coupon activation
   Valid only between 7PM–11PM or on weekends.

10. Coupon code format validation rules
    Example: Must start with “MONK-”, must be 6–10 characters, uppercase only.

11. First-order only coupon logic
    Allow discount only if user has never placed any order.

12. Region-specific coupons
    Discount applicable only in certain cities/countries.

13. Referral-based coupons
    Provide coupon through referral invite or referral link.

14. Dynamic discount brackets
    Discount changes dynamically based on demand / inventory.

15. Coupon conflicts (A cannot be used with B)
    Example: "FREESHIP" cannot be used with "NEW50".

16. Gift-card or wallet integration
    Not a coupon, but a payment method that deducts from gift/wallet balance.

17. Bulk coupon creation or update
    Create/update 1000+ coupons via CSV/Excel upload.

These were intentionally not implemented to keep the core assignment focused while still documenting realistic cases.

---

## Assumptions

* Product price and quantity provided in the request are final.
* Cart data is complete and does not require external services.
* No authentication required as per assignment.
* INR assumed as single currency.
* Rounding is capped to two decimals.
* Only one coupon applied at a time.
* Usage count is tracked globally.
* No distributed locking since running on a single instance.

---

## Limitations

* Per-user usage not enforced without user authentication.
* No coupon stacking support.
* No category-level or metadata-based product filtering.
* No rate-limiting or abuse prevention.
* Decimal rounding may vary for large carts.
* Usage counter uses database but no distributed locking to prevent race conditions at scale.
* Audit trail exists but not returned in API responses.

---

## Why PostgreSQL?

* Strong ACID guarantees
* JSONB flexibility for variable coupon structures
* Reliable relational model for audit trails and reporting
* Good long-term scalability for a coupon engine

---

## Testing

```
npm test
npm run test:watch
```