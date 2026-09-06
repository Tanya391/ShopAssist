import React from 'react';
import { Ticket } from 'lucide-react';

export const TicketCard = ({ ticket, onViewDetails }) => {
  const getPriorityBadge = (p) => {
    if (p === 'Urgent' || p === 'High') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (p === 'Medium') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-orange-50 text-[#FA8C00] border-orange-200';
  };
  const getStatusBadge = (s) => {
    if (s === 'Resolved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s === 'In Review') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-orange-50 text-[#FA8C00] border-orange-200';
  };

  return (
    <div className="bg-white border border-stone-200/80 rounded-2xl p-4 space-y-3 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-[#FA8C00]">
            <Ticket className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm">Ticket #{ticket.id}</span>
            <span className="text-[10px] text-slate-500 block">{ticket.category}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-semibold ${getPriorityBadge(ticket.priority)}`}>{ticket.priority}</span>
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-semibold ${getStatusBadge(ticket.status)}`}>{ticket.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-slate-400 block text-[10px]">Customer</span>
          <span className="font-medium text-slate-800">{ticket.customerName}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Order ID</span>
          <span className="font-mono text-[#FA8C00] font-semibold">{ticket.orderId}</span>
        </div>
      </div>

      <div className="text-xs bg-stone-50 p-3 rounded-xl border border-stone-200/70">
        <span className="text-slate-400 block text-[10px] font-semibold uppercase mb-0.5">Issue Description</span>
        <p className="text-slate-700 line-clamp-2">{ticket.description}</p>
      </div>

      {ticket.resolutionNotes && (
        <div className="text-xs bg-emerald-50 border border-emerald-200/80 p-3 rounded-xl text-emerald-800">
          <span className="text-[10px] font-bold text-emerald-700 block uppercase">Resolution Notes</span>
          <p>{ticket.resolutionNotes}</p>
        </div>
      )}

      {onViewDetails && (
        <button onClick={onViewDetails} className="w-full text-center py-2 bg-orange-50 hover:bg-orange-100 text-[#FA8C00] text-xs font-semibold rounded-xl border border-orange-200 transition-colors">
          View in Support Tickets
        </button>
      )}
    </div>
  );
};
