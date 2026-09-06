export function extractOrderIdFromText(text) {
  const match = text.match(/ORD-\d{4}/i);
  return match ? match[0].toUpperCase() : null;
}

export function fallbackIntentClassification(query, orderId) {
  const q = query.toLowerCase();
  if (
    q.includes('joke') ||
    q.includes('weather') ||
    q.includes('recipe') ||
    q.includes('president') ||
    q.includes('code')
  ) {
    return 'OUT_OF_SCOPE';
  }
  if (
    q.includes('damaged') ||
    q.includes('broken') ||
    q.includes('wrong') ||
    q.includes('missing') ||
    q.includes('complaint') ||
    q.includes('defect')
  ) {
    return 'COMPLAINT';
  }
  if (
    orderId ||
    q.includes('order') ||
    q.includes('track') ||
    q.includes('package') ||
    q.includes('shipped') ||
    q.includes('delivery')
  ) {
    return 'ORDER_QUERY';
  }
  if (
    q.includes('refund') ||
    q.includes('return') ||
    q.includes('warranty') ||
    q.includes('shipping') ||
    q.includes('pay') ||
    q.includes('faq')
  ) {
    return 'FAQ';
  }
  return 'FAQ';
}

export function determineComplaintCategory(query) {
  const q = query.toLowerCase();
  if (q.includes('damage') || q.includes('broken') || q.includes('crack'))
    return 'Damaged Product';
  if (q.includes('wrong') || q.includes('different item')) return 'Wrong Product';
  if (q.includes('missing') || q.includes('empty box')) return 'Missing Package';
  if (q.includes('late') || q.includes('delay') || q.includes('stuck')) return 'Late Delivery';
  if (q.includes('defect') || q.includes('not working') || q.includes("won't turn on"))
    return 'Defective Product';
  return 'General Inquiry';
}

export function constructFallbackReply(
  intent,
  query,
  orderData,
  createdTicket,
  chunks,
  orderId
) {
  if (orderData) {
    return `### 📦 Order Status for **${orderData.orderId}** (Retrieved via Prisma ORM)\n\n- **Customer:** ${orderData.customerName}\n- **Status:** **${orderData.status}**\n- **Carrier:** ${orderData.carrier || 'Standard Carrier'}\n- **Tracking Number:** \`${orderData.trackingNumber || 'Processing'}\`\n- **Estimated Delivery:** ${orderData.estimatedDelivery || 'N/A'}\n\n**Items in Order:**\n${orderData.items.map(i => `- ${i.name} (Qty: ${i.quantity}) - $${i.price}`).join('\n')}\n\n*If you need further assistance or wish to request a return, please let me know!*`;
  }

  if (createdTicket) {
    return `### 🎟️ Support Ticket Registered (Stored in PostgreSQL via Prisma)\n\nWe have created support ticket **#${createdTicket.id}** for your request.\n\n- **Category:** ${createdTicket.category}\n- **Priority:** ${createdTicket.priority}\n- **Status:** **${createdTicket.status}**\n- **Order ID:** ${createdTicket.orderId}\n\nOur dedicated customer support team has been notified and will review your issue within 24 hours.`;
  }

  if (orderId && !orderData) {
    return `I searched our Prisma order database for Order **${orderId}**, but I could not find a matching record. Please double-check your Order ID or provide your email address so I can locate your purchase.`;
  }

  if (chunks && chunks.length > 0) {
    return `### 📖 Information from Knowledge Base (Pinecone RAG)\n\n${chunks[0].text}\n\n---\n*Grounded response from markdown document: **${chunks[0].docTitle}** (${chunks[0].fileName})*`;
  }

  return `Thank you for reaching out to **ShopAssist AI**. I searched our documentation regarding your request ("${query}"), but could not find a high-confidence match. \n\nWould you like me to register a **Support Ticket** so our human customer support representative can investigate this for you?`;
}
