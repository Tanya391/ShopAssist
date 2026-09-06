import React, { useState } from 'react';
import { Ticket, Plus, User, Package } from 'lucide-react';

export const TicketsManager = ({ tickets, onCreateTicket, onUpdateTicketStatus }) => {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [orderId, setOrderId] = useState('');
  const [category, setCategory] = useState('Damaged Product');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolutionInput, setResolutionInput] = useState('');

  const filteredTickets = tickets.filter(t => filterStatus === 'ALL' || t.status === filterStatus);

  const reset = () => { setCustomerName(''); setEmail(''); setOrderId(''); setDescription(''); };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !description.trim()) return;
    setIsSubmitting(true);
    try { await onCreateTicket({ customerName, email, orderId: orderId || 'N/A', category, priority, description }); setShowCreateModal(false); reset(); }
    catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try { await onUpdateTicketStatus(ticketId, newStatus, resolutionInput); setSelectedTicket(null); setResolutionInput(''); }
    catch (err) { console.error(err); }
  };

  const inp = "w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#FA8C00]";

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-50 text-[#FA8C00] border border-orange-200/60"><Ticket className="w-5 h-5" /></span>
            <h2 className="text-xl font-bold text-slate-900">Support Tickets</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">Manage customer complaints and escalations.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-[#FA8C00] hover:bg-[#e07c00] text-white font-semibold text-xs rounded-xl shadow-md shadow-orange-400/20 transition-all flex items-center gap-1.5 shrink-0">
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-stone-200 pb-3 overflow-x-auto">
        {['ALL', 'Open', 'In Review', 'Resolved'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              filterStatus === s ? 'bg-white text-[#FA8C00] border border-orange-200 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
            }`}>
            {s} ({s === 'ALL' ? tickets.length : tickets.filter(t => t.status === s).length})
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTickets.map(ticket => (
          <div key={ticket.id} className="bg-white border border-stone-200/80 rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="font-bold text-slate-900 text-sm">#{ticket.id}</span>
                <span className="text-[10px] text-slate-500 block font-mono">{ticket.category}</span>
              </div>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${
                ticket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : ticket.status === 'In Review' ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-orange-50 text-[#FA8C00] border-orange-200'
              }`}>{ticket.status}</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <User className="w-3.5 h-3.5 text-[#FA8C00]" />
                <span className="font-medium">{ticket.customerName}</span>
                {ticket.email && <span className="text-slate-400 text-[10px]">({ticket.email})</span>}
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Package className="w-3.5 h-3.5 text-amber-600" />
                <span>Order: <strong className="font-mono text-[#FA8C00]">{ticket.orderId}</strong></span>
              </div>
            </div>
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/70 text-xs">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Description</span>
              <p className="text-slate-700 leading-relaxed line-clamp-3">{ticket.description}</p>
            </div>
            {ticket.resolutionNotes && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-800">
                <span className="text-[10px] font-bold text-emerald-700 block uppercase mb-1">Resolution</span>
                <p>{ticket.resolutionNotes}</p>
              </div>
            )}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
              <button onClick={() => { setSelectedTicket(ticket); setResolutionInput(ticket.resolutionNotes || ''); }}
                className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-[#FA8C00] rounded-xl text-xs font-semibold border border-orange-200 transition-colors">
                Update Status
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Status Dialog */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base">Update Ticket #{selectedTicket.id}</h3>
            <textarea rows={3} value={resolutionInput} onChange={e => setResolutionInput(e.target.value)} placeholder="Resolution notes..."
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs focus:outline-none focus:border-[#FA8C00]" />
            <div className="flex gap-2">
              <button onClick={() => handleUpdateStatus(selectedTicket.id, 'In Review')} className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-xs font-semibold">In Review</button>
              <button onClick={() => handleUpdateStatus(selectedTicket.id, 'Resolved')} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold">Resolved</button>
            </div>
            <button onClick={() => setSelectedTicket(null)} className="w-full py-2 bg-stone-100 text-slate-600 rounded-xl text-xs font-medium">Cancel</button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateSubmit} className="bg-white border border-stone-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-lg">Create Support Ticket</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-slate-500 font-medium block mb-1">Customer Name *</label><input type="text" required value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Alex Johnson" className={inp} /></div>
              <div><label className="text-xs text-slate-500 font-medium block mb-1">Order ID</label><input type="text" value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="e.g. ORD-1002" className={inp} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs text-slate-500 font-medium block mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className={inp}>
                  <option>Damaged Product</option><option>Wrong Product</option><option>Missing Package</option><option>Late Delivery</option><option>Defective Product</option><option>General Inquiry</option>
                </select>
              </div>
              <div><label className="text-xs text-slate-500 font-medium block mb-1">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className={inp}>
                  <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
                </select>
              </div>
            </div>
            <div><label className="text-xs text-slate-500 font-medium block mb-1">Description *</label>
              <textarea rows={4} required value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the issue..." className={`w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs focus:outline-none focus:border-[#FA8C00]`} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl text-xs font-semibold">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-[#FA8C00] hover:bg-[#e07c00] text-white rounded-xl text-xs font-semibold">Submit</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
