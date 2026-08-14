import React from 'react';
import { Package } from 'lucide-react';

export const OrderCard = ({ order }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Shipped':
      case 'Out for Delivery':
        return 'text-cyan-700 bg-cyan-50 border-cyan-200';
      case 'Processing':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      default:
        return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  const steps = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
  const currentStepIndex = steps.indexOf(
    order.status === 'Returned' ? 'Delivered' : order.status
  );

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-4 text-slate-800 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-700 border border-violet-200/80 flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm font-mono">{order.orderId}</span>
            <span className="text-[10px] text-slate-500 block">{order.customerName}</span>
          </div>
        </div>
        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${getStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>

      {/* Progress Tracker */}
      <div className="space-y-1.5 pt-0.5">
        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
          <span>Processing</span>
          <span>Shipped</span>
          <span>Out for Delivery</span>
          <span>Delivered</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {steps.map((step, idx) => (
            <div
              key={step}
              className={`h-2 rounded-full transition-colors ${
                idx <= currentStepIndex
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600'
                  : 'bg-slate-100'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
          <span className="text-[10px] text-slate-400 block font-semibold uppercase">
            Carrier & Tracking
          </span>
          <span className="font-semibold text-slate-800">{order.carrier || 'N/A'}</span>
          <p className="text-[10px] font-mono text-cyan-700 truncate">
            {order.trackingNumber || 'Pending'}
          </p>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
          <span className="text-[10px] text-slate-400 block font-semibold uppercase">
            Delivery Estimate
          </span>
          <span className="font-semibold text-emerald-700">
            {order.estimatedDelivery || order.deliveredDate || 'N/A'}
          </span>
          <p className="text-[10px] text-slate-500">
            {order.returnEligible ? '✅ Return Eligible' : '❌ Non-Returnable'}
          </p>
        </div>
      </div>

      <div className="space-y-1 text-xs pt-2 border-t border-slate-100">
        <span className="text-[10px] text-slate-400 block font-semibold uppercase">
          Items in Order
        </span>
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between text-slate-700 text-[11px]">
            <span>
              {item.name} (x{item.quantity})
            </span>
            <span className="font-mono text-violet-700 font-medium">${item.price.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
