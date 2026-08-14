import React, { useState } from 'react';
import { Package, Truck, Calendar, Search } from 'lucide-react';

export const OrdersManager = ({ orders }) => {
  const [searchTerm, useState] = useState('');

  const filteredOrders = orders.filter(
    o =>
      o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80">
              <Package className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">Orders Database</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">Customer order records and tracking status.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search orders (e.g. ORD-1002)..."
            className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-violet-500 w-full sm:w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredOrders.map(order => (
          <div
            key={order.orderId}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 text-slate-800 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-bold text-slate-900 text-base font-mono">{order.orderId}</span>
                <span className="text-xs text-slate-500 block">{order.customerName}</span>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${
                  order.status === 'Delivered'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : order.status === 'Shipped' || order.status === 'Out for Delivery'
                    ? 'text-cyan-700 bg-cyan-50 border-cyan-200'
                    : 'text-amber-700 bg-amber-50 border-amber-200'
                }`}
              >
                {order.status}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-1">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Shipping Info
                </span>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Truck className="w-3.5 h-3.5 text-cyan-600" />
                  <span>
                    {order.carrier || 'Standard'} •{' '}
                    <code className="text-cyan-700 font-mono font-medium">
                      {order.trackingNumber || 'Pending'}
                    </code>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-violet-600" />
                  <span>
                    Delivery Date:{' '}
                    <strong className="text-emerald-700">
                      {order.estimatedDelivery || order.deliveredDate || 'N/A'}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-1">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Items (${order.totalAmount.toFixed(2)})
                </span>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-slate-700">
                    <span>
                      {item.name} (x{item.quantity})
                    </span>
                    <span className="font-mono text-violet-700 font-medium">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="text-[11px] flex items-center justify-between text-slate-500 pt-1">
                <span>Return Status:</span>
                <span className={`font-semibold ${order.returnEligible ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {order.returnEligible ? 'Eligible (30 Days)' : 'Not Eligible'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
