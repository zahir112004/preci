# PRECI — Cute Things, Happy Little Moments

A complete **front-end demo storefront** inspired by the supplied PRECI cover artwork. Built using plain HTML, CSS, and JavaScript — no npm install or framework required.

## Pages

- `index.html` — Home, your supplied PRECI cover artwork, categories, featured items
- `products.html` — All products, live search, filters, sorting
- `product.html?id=blossom-bunny-keychain` — Individual product detail and quantity selection
- `checkout.html` — Contact/delivery fields, shipping cost calculation, PRECI10 discount, sample payment methods
- `payment-success.html` — Simulated online-payment confirmation
- `thank-you.html` — Thank-you/order-received page

## Run locally

From this project folder run:

```bash
python -m http.server 8000
```

Then open **http://localhost:8000** in your browser.

You can also upload this folder to a static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, etc.) for a preview. Configure the project as a static site with its root directory as the publish directory.

## Try the complete flow

1. Open the home page and choose **Shop all cuties**.
2. Add one or more products to the bag.
3. Open **My bag** and choose **Go to checkout**.
4. Enter sample delivery information; choose Dhaka or outside Dhaka; optionally enter `PRECI10` for 10% off.
5. Select **bKash Demo** or **Nagad Demo** to see `payment-success.html`, then continue to the thank-you page. Select **Cash on Delivery** to go straight to the thank-you page.

The shopping bag and minimal demo order summaries are **saved only in your browser's localStorage**. Phone numbers, email addresses and street addresses are not retained in the demo order summary. No money changes hands and no orders are sent to a real business.

## Customize your store

- Update `js/data.js` to replace the **illustrative sample products, sample prices, descriptions, and sample size information** with actual inventory.
- Replace `assets/products/*.svg` with real product photos (and update image paths in `js/data.js`). Original cute SVG product art is included as placeholders.
- The provided uploaded cover is at `assets/preci-cover.png` and appears on the homepage.
- Update brand colors, typography, responsive layout, and components in `css/styles.css`.
- Update site copy in the HTML files and shared footer/nav in `js/site.js`.
- Set shipping rates and coupon details in `js/data.js` (`PRECI_CONFIG`).

## Important: to accept *real* orders and payments

This is **not yet a production online shop**. Before launch, you will need to:

1. Set up a secure backend and real database for customers, products, stock, orders and order status.
2. Connect a verified Bangladesh-compatible payment gateway (e.g. a provider that supports your merchant account). Use the gateway's **server-side API and verified payment notifications/webhooks** — never mark a real payment successful purely from client-side JavaScript.
3. Provide merchant contact details, delivery/return/refund policies, privacy notice, and correct inventory and pricing.
4. Use HTTPS; validate inputs on the server; protect customer personal information and avoid storing sensitive payment data in the browser.
5. Integrate order alerts, shipping/fulfillment and admin tools as needed.

No real bKash, Nagad or other wallet account is connected. The buttons are explicitly labeled **Demo** for safety.

## File structure

```
preci-store/
├── index.html
├── products.html
├── product.html
├── checkout.html
├── payment-success.html
├── thank-you.html
├── css/styles.css
├── js/data.js
├── js/site.js
└── assets/
    ├── preci-cover.png
    ├── favicon.svg
    └── products/*.svg
```
