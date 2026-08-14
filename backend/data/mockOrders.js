export const MOCK_ORDERS = {
  'ORD-1001': {
    orderId: 'ORD-1001',
    customerName: 'Alex Johnson',
    items: [
      { name: 'AuraPods Pro Wireless Earphones', quantity: 1, price: 149.99 }
    ],
    totalAmount: 149.99,
    status: 'Processing',
    shippingAddress: '742 Evergreen Terrace, Springfield, OR 97477',
    carrier: 'USPS',
    estimatedDelivery: 'Aug 10, 2026',
    returnEligible: false
  },
  'ORD-1002': {
    orderId: 'ORD-1002',
    customerName: 'Sarah Smith',
    items: [
      { name: 'Lumina Smartwatch Series 5', quantity: 1, price: 199.99 }
    ],
    totalAmount: 199.99,
    status: 'Shipped',
    shippingAddress: '100 Main Street, Suite 400, Seattle, WA 98101',
    carrier: 'FedEx Express',
    trackingNumber: 'FX-982134591',
    estimatedDelivery: 'Aug 8, 2026',
    returnEligible: true
  },
  'ORD-1003': {
    orderId: 'ORD-1003',
    customerName: 'David Chen',
    items: [
      { name: 'Nexus Mechanical Gaming Keyboard', quantity: 1, price: 129.99 },
      { name: 'ChargePulse 100W Power Bank', quantity: 1, price: 79.99 }
    ],
    totalAmount: 209.98,
    status: 'Delivered',
    shippingAddress: '456 Oak Avenue, Austin, TX 78701',
    carrier: 'UPS Ground',
    trackingNumber: '1Z9999999999999999',
    estimatedDelivery: 'Aug 2, 2026',
    deliveredDate: 'Aug 2, 2026',
    returnEligible: true
  },
  'ORD-1004': {
    orderId: 'ORD-1004',
    customerName: 'Maria Garcia',
    items: [
      { name: 'ChargePulse 100W Power Bank', quantity: 1, price: 79.99 }
    ],
    totalAmount: 79.99,
    status: 'Returned',
    shippingAddress: '123 Pine Road, Miami, FL 33101',
    carrier: 'FedEx Ground',
    trackingNumber: 'FX-112233445',
    deliveredDate: 'Jul 20, 2026',
    returnEligible: false
  },
  'ORD-1005': {
    orderId: 'ORD-1005',
    customerName: 'James Wilson',
    items: [
      { name: 'Ergofit Ergonomic Office Desk Chair', quantity: 1, price: 299.99 }
    ],
    totalAmount: 299.99,
    status: 'Out for Delivery',
    shippingAddress: '88 Market Street, San Francisco, CA 94105',
    carrier: 'UPS Express',
    trackingNumber: 'UPS-771239088',
    estimatedDelivery: 'Today (Aug 6, 2026)',
    returnEligible: true
  }
};
