# MX3 Promo System Guide

## Single Source of Truth
**File:** `assets/checkout.js` (lines 1-44)

---

## 1. Period Promos (Limited Time)

Define time-based promotional periods:

```javascript
const PROMO_CONFIG = [
    {
        name: "Weekend Flash Sale",
        startDate: "2025-11-10T00:00:00+08:00",
        endDate: "2025-11-12T23:59:59+08:00",
        discountPercentage: 25,
        excludeFromPromo: [] // Optional: exclude specific products
    }
];
```

### Features:
- ✅ Start and end dates (Philippine Time)
- ✅ Percentage-based discounts
- ✅ Product exclusions (optional)
- ✅ Multiple promo periods (latest wins if overlap)

---

## 2. Always Promo Products (Permanent)

Define products that are ALWAYS on sale:

```javascript
const ALWAYS_PROMO_PRODUCTS = [
    {
        productKey: "1-box",
        discountPercentage: 10,
        promoName: "Everyday Low Price"
    },
    {
        productKey: "upsell-blister-pack",
        discountPercentage: 15,
        promoName: "Special Offer"
    }
];
```

### Features:
- ✅ Always shows discount (24/7/365)
- ✅ Always shows strikethrough original price
- ✅ Takes precedence over period promos
- ✅ NOT affected by `excludeFromPromo` in period promos

---

## Available Product Keys

### Main Products:
- `"1-box"` - 1 Box Coffee Mix
- `"6-boxes"` - 6 Boxes Coffee Mix
- `"mx3-capsule-blister-pack"` - 7 Blister Packs
- `"mx3-capsule-buy15-take1-free"` - Buy 15 Take 1 Free
- `"mx3-capsule-w-coffee-gift-set"` - Gift Set
- `"1-kilo-pack-coffee-mix"` - 1 Kilo Coffee
- `"MX3-Plus-Capsule"` - MX3 Plus Capsule
- `"mx3-capsule"` - MX3 Capsule
- `"capsule_coffee"` - Capsule + Coffee Bundle

### Upsell Products:
- `"upsell-capsule-w-mx3-coffee-gift-set"`
- `"upsell-coffemix-buy11take1"`
- `"upsell-blister-pack"`

---

## Promo Priority Logic

**Order of precedence:**
1. **Always Promo** (highest priority)
2. Period Promo (if not excluded)
3. Base Price (no promo)

### Examples:

#### Scenario 1: Product with Always Promo
```javascript
ALWAYS_PROMO_PRODUCTS = [
    { productKey: "1-box", discountPercentage: 10, promoName: "Everyday" }
];

PROMO_CONFIG = [
    {
        name: "Flash Sale",
        discountPercentage: 20,
        excludeFromPromo: []
    }
];

Result: "1-box" gets 10% discount (always promo wins)
```

#### Scenario 2: Product Excluded from Period Promo
```javascript
PROMO_CONFIG = [
    {
        name: "Weekend Sale",
        discountPercentage: 25,
        excludeFromPromo: ["mx3-capsule-buy15-take1-free"]
    }
];

Result:
- Most products: 25% off
- "mx3-capsule-buy15-take1-free": Full price (excluded)
```

#### Scenario 3: Combining Both
```javascript
ALWAYS_PROMO_PRODUCTS = [
    { productKey: "1-box", discountPercentage: 10, promoName: "Everyday" }
];

PROMO_CONFIG = [
    {
        name: "Flash Sale",
        discountPercentage: 30,
        excludeFromPromo: ["1-box"] // This has NO effect
    }
];

Result: "1-box" still gets 10% (always promo cannot be excluded)
```

---

## What Users See

### Product with Always Promo:
- Price: **₱162** ~~₱180~~ (10% off)
- Shows strikethrough **all the time**

### Product with Period Promo (Active):
- Price: **₱135** ~~₱180~~ (25% off)
- Shows strikethrough **only during promo period**

### Product Excluded from Period Promo:
- Price: **₱180**
- No strikethrough
- Looks like regular price

### Product with No Promo:
- Price: **₱180**
- No strikethrough
- Regular price

---

## Quick Setup Examples

### Example 1: Simple Period Promo
```javascript
const PROMO_CONFIG = [
    {
        name: "New Year Sale 2025",
        startDate: "2025-01-01T00:00:00+08:00",
        endDate: "2025-01-07T23:59:59+08:00",
        discountPercentage: 20,
        excludeFromPromo: []
    }
];

const ALWAYS_PROMO_PRODUCTS = [];
```
**Result:** 20% off everything from Jan 1-7

### Example 2: Exclude High-Value Items
```javascript
const PROMO_CONFIG = [
    {
        name: "Flash Sale",
        startDate: "2025-02-14T00:00:00+08:00",
        endDate: "2025-02-14T23:59:59+08:00",
        discountPercentage: 30,
        excludeFromPromo: ["mx3-capsule-buy15-take1-free", "1-kilo-pack-coffee-mix"]
    }
];

const ALWAYS_PROMO_PRODUCTS = [];
```
**Result:** 30% off everything EXCEPT the bulk items on Feb 14

### Example 3: Permanent Low Price on Entry Products
```javascript
const PROMO_CONFIG = [];

const ALWAYS_PROMO_PRODUCTS = [
    {
        productKey: "1-box",
        discountPercentage: 10,
        promoName: "Everyday Low Price"
    },
    {
        productKey: "upsell-blister-pack",
        discountPercentage: 15,
        promoName: "Special Offer"
    }
];
```
**Result:** 10% off 1-box and 15% off upsell blister pack, always

### Example 4: Combining Period and Always Promos
```javascript
const PROMO_CONFIG = [
    {
        name: "Holiday Sale",
        startDate: "2025-12-20T00:00:00+08:00",
        endDate: "2025-12-26T23:59:59+08:00",
        discountPercentage: 25,
        excludeFromPromo: []
    }
];

const ALWAYS_PROMO_PRODUCTS = [
    {
        productKey: "1-box",
        discountPercentage: 10,
        promoName: "Everyday Low Price"
    }
];
```
**Result:**
- "1-box": Always 10% off (always promo)
- All other products: 25% off Dec 20-26, regular price otherwise

---

## Testing Your Promo

1. Edit `assets/checkout.js`
2. Set promo dates to current date/time
3. Refresh any product page
4. Check:
   - Prices are discounted
   - Original prices show strikethrough
   - Excluded products stay at full price
   - Always promo products always show discount

---

## Notes

- All dates are in **Philippine Time (UTC+8)**
- Discounts are **rounded to nearest peso**
- **Always promos** cannot be excluded by period promos
- If multiple period promos overlap, **latest in array wins**
- Empty arrays mean no exclusions/no always promos
