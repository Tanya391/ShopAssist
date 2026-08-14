export const INITIAL_TICKETS = [
  {
    id: 'TICK-8012',
    customerName: 'David Chen',
    email: 'david.chen@example.com',
    orderId: 'ORD-1003',
    category: 'Damaged Product',
    description:
      'The Nexus Mechanical Gaming Keyboard arrived with a cracked aluminum housing on the top right corner.',
    priority: 'High',
    status: 'In Review',
    createdAt: '2026-08-04T14:30:00Z',
    resolutionNotes:
      'Support team requested photo evidence and generated prepaid return authorization label.'
  },
  {
    id: 'TICK-7990',
    customerName: 'Sarah Smith',
    email: 'sarah.s@example.com',
    orderId: 'ORD-1002',
    category: 'Late Delivery',
    description: 'Package status was stuck in transit for 2 days. Requested delivery status update.',
    priority: 'Medium',
    status: 'Resolved',
    createdAt: '2026-08-03T09:15:00Z',
    resolutionNotes: 'Carrier confirmed package departed hub. Delivered expected Aug 8.'
  }
];
