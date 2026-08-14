// NOTE: This file is a temporary legacy fallback data source used by lib/prisma.js
// when no Supabase DATABASE_URL is configured. It will be consolidated in the
// database/RAG phase once Supabase is connected and Prisma migrations are established.
// The authoritative knowledge source remains knowledge-base/*.md

export const DEFAULT_KNOWLEDGE_DOCS = [
  {
    id: 'doc-refund-policy',
    title: 'Refund Policy',
    fileName: 'refund-policy.md',
    category: 'policy',
    updatedAt: '2026-08-06',
    content: `# Company Refund Policy & Financial Terms

## 1. Executive Overview
At ShopAssist Store, customer satisfaction is our highest priority. All standard purchases made on our platform are backed by our **30-Day Money-Back Guarantee** unless otherwise explicitly marked as final sale.

---

## 2. Refund Processing Timelines

| Payment Method | Refund Processing Window | Bank Posting Time |
| :--- | :--- | :--- |
| **Credit / Debit Cards** | 3 – 5 Business Days | 5 – 10 Business Days |
| **PayPal / Digital Wallet** | 24 – 48 Hours | Immediate to 2 Days |
| **Store Credit / Gift Card** | Instant | Immediate upon approval |

> **Note:** Original shipping and express delivery fees are non-refundable unless the item arrived damaged, defective, or was sent in error by our warehouse team.`
  },
  {
    id: 'doc-shipping-policy',
    title: 'Shipping & Delivery Policy',
    fileName: 'shipping-policy.md',
    category: 'policy',
    updatedAt: '2026-08-06',
    content: `# Express Shipping & Delivery Policy

## 1. Shipping Methods & Carriers
ShopAssist Store partners with tier-1 global carriers including **FedEx**, **UPS**, **DHL Express**, and **USPS** to ensure fast and secure parcel delivery.

---

## 2. Delivery Rates & Estimated Timelines

| Shipping Tier | Estimated Transit Time | Cost | Order Threshold |
| :--- | :--- | :--- | :--- |
| **Standard Ground** | 3 – 5 Business Days | $4.99 | Free on orders over $50 |
| **Expedited Priority** | 2 Business Days | $12.99 | Flat rate |
| **Overnight Express** | 1 Business Day | $24.99 | Orders placed before 2 PM EST |`
  },
  {
    id: 'doc-return-policy',
    title: 'Return & Exchange Policy',
    fileName: 'return-policy.md',
    category: 'policy',
    updatedAt: '2026-08-06',
    content: `# Product Returns & Exchange Procedures

## 1. Simple 3-Step Return Process
Returning an item at ShopAssist is quick and automated:

1. **Initiate Request:** Contact ShopAssist AI in the chat or navigate to the Returns Center.
2. **Prepaid Shipping Label:** Download and print your prepaid carrier return shipping label (FedEx / USPS).
3. **Drop Off Parcel:** Attach label to box and drop off at any authorized shipping location.`
  },
  {
    id: 'doc-warranty-policy',
    title: 'Manufacturer Warranty Policy',
    fileName: 'warranty-policy.md',
    category: 'policy',
    updatedAt: '2026-08-06',
    content: `# Manufacturer Warranty & Product Guarantee Coverage

## 1. Limited Hardware Warranty Terms
ShopAssist guarantees all original consumer hardware products against defects in materials and workmanship under normal use for a period of **ONE (1) YEAR** from the date of retail purchase by the original end-user purchaser ("Warranty Period").`
  },
  {
    id: 'doc-faq',
    title: 'Frequently Asked Questions',
    fileName: 'faq.md',
    category: 'faq',
    updatedAt: '2026-08-06',
    content: `# Frequently Asked Questions (FAQ)

## 1. General Ordering & Account Questions

### Q: Can I modify or cancel my order after placing it?
**A:** You can modify or cancel your order within **30 minutes** of placing it. After 30 minutes, the order enters automated fulfillment at our warehouse and cannot be canceled, but you may return it upon arrival for a full refund.`
  },
  {
    id: 'doc-product-info',
    title: 'Product Information & Specs',
    fileName: 'product-information.md',
    category: 'product',
    updatedAt: '2026-08-06',
    content: `# Product Information & Hardware Specifications Catalog

## 1. Ergonomic Mechanical Keyboards

### ProTech Wireless RGB Mechanical Keyboard
- **Model ID:** KB-9000
- **Connectivity:** Bluetooth 5.2, 2.4GHz Wireless Dongle, USB-C Wired
- **Switch Options:** Linear Red, Tactile Brown, Clicky Blue`
  }
];
