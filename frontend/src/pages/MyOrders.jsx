import React, { useEffect, useState } from 'react';
import { ordersApi, reviewsApi } from '../services/api';

const STEPS = [
  { key:'new',       icon:'🆕', label:'Qabul qilindi' },
  { key:'cooking',   icon:'👨‍🍳', label:'Tayyorlanmoqda' },
  { key:'ready',     icon:'✅', label:'Tayyor' },
  { key:'delivered', icon:'🚀', label:'Yetkazildi' },
];

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display:'flex', gap:4 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          style={{ fontSize:32, cursor:'pointer', color: i <= (hover||value) ? '#f59e0b' : '#d1d5db', transition:'color .1s', lineHeight:1 }}>
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewModal({ item, onClose, onDone }) {
  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [err,     setErr]     = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!rating) { setErr('Yulduz tanlang'); return; }
    setSending(true);
    try {
      await reviewsApi.add({ menuId: item.menuId, orderId: item.orderId, rating, comment });
      onDone(item.menuId, item.orderId);
    } catch(ex) { setErr(ex.message); }
    finally { setSending(false); }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:24, padding:32, width:'100%', maxWidth:420, boxShadow:'0 24px 80px rgba(0,0,0,.3)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
          <span style={{ fontSize:'2.4rem', lineHeight:1 }}>{item.itemEmoji || '🍣'}</span>
          <div>
            <div style={{ fontWeight:800, fontSize:'1rem', color:'#0f172a' }}>
              {item.itemName?.lv || item.itemName?.ru || item.itemName || 'Mahsulot'}
            </div>
            <div style={{ fontSize:'.78rem', color:'#94a3b8', marginTop:2 }}>Buyurtma #{item.orderId}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft:'auto', background:'#f1f5f9', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>

        <div style={{ fontWeight:700, fontSize:'.85rem', color:'#374151', marginBottom:8 }}>Bahoyingiz</div>
        <StarPicker value={rating} onChange={setRating} />

        <form onSubmit={submit} style={{ marginTop:18 }}>
          <textarea
            placeholder="Izoh qoldiring (ixtiyoriy)..."
            value={comment} onChange={e => setComment(e.target.value)}
            rows={3}
            style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:12, padding:'10px 14px', fontSize:'.88rem', resize:'vertical', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}
          />
          {err && <div style={{ color:'#e31e24', fontSize:'.8rem', marginTop:6 }}>{err}</div>}
          <button type="submit" disabled={sending}
            style={{ marginTop:14, width:'100%', height:46, background:'#e31e24', color:'#fff', border:'none', borderRadius:12, fontWeight:800, fontSize:'.95rem', cursor:'pointer' }}>
            {sending ? '⏳ Yuborilmoqda...' : '⭐ Baholash yuborish'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function MyOrdersPage({ isOpen, onClose }) {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState([]);   // unreviewed delivered items
  const [reviewed,setReviewed]= useState(new Set()); // locally marked as done
  const [modal,   setModal]   = useState(null);  // current item being reviewed

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersApi.getMine();
      setOrders(Array.isArray(data) ? data : []);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  };

  const loadPending = async () => {
    try {
      const data = await reviewsApi.getMyPending();
      setPending(Array.isArray(data) ? data : []);
    } catch { setPending([]); }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadOrders();
    loadPending();
    const id = setInterval(() => { loadOrders(); loadPending(); }, 15000);
    return () => clearInterval(id);
  }, [isOpen]);

  function handleReviewDone(menuId, orderId) {
    setReviewed(s => new Set([...s, `${orderId}_${menuId}`]));
    setPending(p => p.filter(i => !(i.orderId === orderId && i.menuId === menuId)));
    setModal(null);
  }

  if (!isOpen) return null;

  const lang = localStorage.getItem('sr_lang') || 'lv';
  const STATUS = {
    new:       { label:'Yangi',          color:'#dbeafe', text:'#1d4ed8' },
    cooking:   { label:'Tayyorlanmoqda', color:'#fef9c3', text:'#a16207' },
    ready:     { label:'Tayyor',         color:'#dcfce7', text:'#15803d' },
    delivered: { label:'Yetkazildi',     color:'#f0fdf4', text:'#166534' },
    cancelled: { label:'Bekor',          color:'#fee2e2', text:'#991b1b' },
  };

  return (
    <>
      {modal && (
        <ReviewModal item={modal} onClose={() => setModal(null)} onDone={handleReviewDone} />
      )}

      <div className="orders-overlay" onClick={onClose}>
        <div className="orders-panel" onClick={e => e.stopPropagation()}>

          {/* Head */}
          <div className="orders-head">
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:'1.4rem' }}>📦</span>
              <h2 style={{ fontSize:'1.1rem', fontWeight:900, color:'#0f172a', margin:0 }}>Mening buyurtmalarim</h2>
            </div>
            <button onClick={onClose} style={{ background:'#f1f5f9', border:'none', borderRadius:10, width:36, height:36, cursor:'pointer', fontSize:'1.2rem' }}>×</button>
          </div>

          {/* Pending reviews banner */}
          {pending.filter(i => !reviewed.has(`${i.orderId}_${i.menuId}`)).length > 0 && (
            <div style={{ margin:'12px 16px', padding:'14px 16px', background:'linear-gradient(135deg,#fef3c7,#fde68a)', borderRadius:14, border:'1px solid #f59e0b' }}>
              <div style={{ fontWeight:800, fontSize:'.88rem', color:'#92400e', marginBottom:8 }}>⭐ Baholanmagan mahsulotlar</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {pending.filter(i => !reviewed.has(`${i.orderId}_${i.menuId}`)).map((item, idx) => (
                  <button key={idx} onClick={() => setModal(item)}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', background:'#fff', border:'1.5px solid #f59e0b', borderRadius:20, cursor:'pointer', fontSize:'.8rem', fontWeight:700, color:'#92400e' }}>
                    <span>{item.itemEmoji || '🍣'}</span>
                    <span>{item.itemName?.lv || item.itemName?.ru || 'Mahsulot'}</span>
                    <span style={{ color:'#f59e0b' }}>★ Baho ber</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && <p className="orders-empty">⏳ Yuklanmoqda...</p>}
          {!loading && orders.length === 0 && <p className="orders-empty">Buyurtmalar yo'q</p>}

          <div className="orders-list">
            {orders.map(order => {
              const stepIdx = Math.max(0, STEPS.findIndex(s => s.key === (order.status || 'new')));
              const st = STATUS[order.status] || STATUS.new;
              const orderPending = pending.filter(i => i.orderId === order.id && !reviewed.has(`${i.orderId}_${i.menuId}`));

              return (
                <div className="order-card" key={order.id} style={{ border:'1px solid #f1f5f9', borderRadius:20, marginBottom:14, overflow:'hidden', background:'#fff', boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>
                  {/* Header */}
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'#fafafa', borderBottom:'1px solid #f1f5f9', flexWrap:'wrap' }}>
                    <span style={{ fontWeight:900, color:'#e31e24', fontSize:'.92rem' }}>#{order.id}</span>
                    <span style={{ background:st.color, color:st.text, borderRadius:20, padding:'3px 12px', fontSize:'.73rem', fontWeight:700 }}>{st.label}</span>
                    <span style={{ fontSize:'.74rem', color:'#94a3b8', marginLeft:'auto' }}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : ''}
                    </span>
                  </div>

                  <div style={{ padding:'14px 16px' }}>
                    {/* Progress steps */}
                    <div style={{ display:'flex', alignItems:'center', marginBottom:16 }}>
                      {STEPS.map((step, i) => (
                        <React.Fragment key={step.key}>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                            <div style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem',
                              background: i <= stepIdx ? '#e31e24' : '#f1f5f9',
                              color: i <= stepIdx ? '#fff' : '#94a3b8',
                              transition:'all .3s' }}>
                              {step.icon}
                            </div>
                            <span style={{ fontSize:'.6rem', color: i <= stepIdx ? '#e31e24' : '#94a3b8', fontWeight: i <= stepIdx ? 700 : 400, textAlign:'center', maxWidth:60 }}>
                              {step.label}
                            </span>
                          </div>
                          {i < STEPS.length - 1 && (
                            <div style={{ flex:1, height:3, margin:'0 4px', marginBottom:20, background: i < stepIdx ? '#e31e24' : '#f1f5f9', borderRadius:2, transition:'background .3s' }}/>
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Items */}
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
                      {(order.items || []).map((item, i) => (
                        <span key={i} style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:20, padding:'5px 12px', fontSize:'.78rem', fontWeight:600 }}>
                          {item.e} {item.name?.lv || item.name?.ru || item.name} ×{item.qty}
                        </span>
                      ))}
                    </div>

                    <div style={{ fontWeight:900, fontSize:'1rem', color:'#e31e24', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span>💰 Jami</span>
                      <span>€{typeof order.total === 'number' ? order.total.toFixed(2) : order.total}</span>
                    </div>

                    {/* Review buttons for this order */}
                    {orderPending.length > 0 && (
                      <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #f1f5f9' }}>
                        <div style={{ fontSize:'.78rem', color:'#64748b', marginBottom:8, fontWeight:600 }}>⭐ Baholanmagan:</div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                          {orderPending.map((item, idx) => (
                            <button key={idx} onClick={() => setModal(item)}
                              style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', background:'#fffbeb', border:'1.5px solid #f59e0b', borderRadius:20, cursor:'pointer', fontSize:'.78rem', fontWeight:700, color:'#92400e' }}>
                              {item.itemEmoji || '🍣'} {item.itemName?.lv || item.itemName?.ru || 'Mahsulot'} ★
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
