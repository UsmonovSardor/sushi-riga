import React, { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || '';

const STATUS = {
  new:       { label:'Yangi',          color:'#dbeafe', text:'#1d4ed8', icon:'🆕' },
  cooking:   { label:'Tayyorlanmoqda', color:'#fef9c3', text:'#a16207', icon:'👨‍🍳' },
  ready:     { label:'Tayyor',         color:'#dcfce7', text:'#15803d', icon:'✅' },
  delivered: { label:'Berildi',        color:'#f0fdf4', text:'#166534', icon:'🚀' },
  cancelled: { label:'Bekor',          color:'#fee2e2', text:'#991b1b', icon:'❌' },
};
const PAY = { cash:'💵 Naqd', card:'💳 Karta' };

function emptyForm() {
  return { cat:'cold', e:'🍣', name_ru:'', name_lv:'', name_en:'',
           desc_ru:'', desc_lv:'', desc_en:'', price:'', old:'', img:'', hit:false };
}

export default function Admin() {
  const [token,   setToken]   = useState(() => localStorage.getItem('sr_admin') || '');
  const [secret,  setSecret]  = useState('');
  const [err,     setErr]     = useState('');
  const [tab,     setTab]     = useState('orders');
  const [stats,   setStats]   = useState(null);
  const [orders,  setOrders]  = useState([]);
  const [menu,    setMenu]    = useState([]);
  const [msg,     setMsg]     = useState('');
  const [search,  setSrch]    = useState('');
  const [catF,    setCatF]    = useState('all');
  const [stF,     setStF]     = useState('all');
  const [editItem,setEdit]    = useState(null);
  const [form,    setForm]    = useState(emptyForm());
  const [saving,  setSaving]  = useState(false);

  const hdrs = { 'Content-Type':'application/json', Authorization:`Bearer ${token}` };
  const flash = m => { setMsg(m); setTimeout(()=>setMsg(''),3000); };
  const fmt   = n => typeof n==='number' ? n.toFixed(2) : '0.00';
  const fmtT  = iso => iso ? new Date(iso).toLocaleString('ru-RU',{timeZone:'Europe/Riga',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—';

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [s,o,m] = await Promise.all([
        fetch(`${API}/api/admin/stats`,{headers:hdrs}).then(r=>r.json()),
        fetch(`${API}/api/admin/orders`,{headers:hdrs}).then(r=>r.json()),
        fetch(`${API}/api/admin/menu`,{headers:hdrs}).then(r=>r.json()),
      ]);
      setStats(s); setOrders(Array.isArray(o)?o:[]); setMenu(Array.isArray(m)?m:[]);
    } catch(e){ console.error(e); }
  }, [token]);

  useEffect(()=>{ load(); },[load]);
  useEffect(()=>{
    if(!token) return;
    const id=setInterval(()=>{ if(tab==='orders'||tab==='stats') load(); },30000);
    return ()=>clearInterval(id);
  },[token,tab,load]);

  async function login(e) {
    e.preventDefault();
    try {
      const r = await fetch(`${API}/api/admin/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret})});
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      localStorage.setItem('sr_admin', d.token);
      setToken(d.token);
    } catch(ex){ setErr(ex.message); }
  }

  async function changeStatus(id, status) {
    await fetch(`${API}/api/admin/orders/${id}`,{method:'PATCH',headers:hdrs,body:JSON.stringify({status})});
    setOrders(p=>p.map(o=>o.id==id?{...o,status}:o));
  }

  async function saveItem(e) {
    e.preventDefault(); setSaving(true);
    const body = {
      cat:form.cat, e:form.e, hit:form.hit, img:form.img,
      price:parseFloat(form.price)||0,
      old:form.old?parseFloat(form.old):null,
      name:{ru:form.name_ru, lv:form.name_lv||form.name_ru, en:form.name_en||form.name_ru},
      desc:{ru:form.desc_ru, lv:form.desc_lv||form.desc_ru, en:form.desc_en||form.desc_ru},
    };
    try {
      const url = editItem ? `${API}/api/admin/menu/${editItem.id}` : `${API}/api/admin/menu`;
      const r   = await fetch(url,{method:editItem?'PUT':'POST',headers:hdrs,body:JSON.stringify(body)});
      if (!r.ok) throw new Error('Saqlash xatosi');
      flash(editItem?'✅ Yangilandi':'✅ Qo\'shildi');
      setEdit(null); setForm(emptyForm()); setTab('menu'); await load();
    } catch(ex){ flash('❌ '+ex.message); }
    finally { setSaving(false); }
  }

  async function delItem(id) {
    if (!confirm('Rostdan ham o\'chirish kerakmi?')) return;
    await fetch(`${API}/api/admin/menu/${id}`,{method:'DELETE',headers:hdrs});
    flash('🗑 O\'chirildi'); await load();
  }

  async function toggleHit(id) {
    await fetch(`${API}/api/admin/menu/${id}/hit`,{method:'PATCH',headers:hdrs});
    await load();
  }

  function startEdit(item) {
    setEdit(item);
    setForm({
      cat:item.cat, e:item.e||'🍣', hit:!!item.hit, img:item.img||'', price:item.price, old:item.old||'',
      name_ru:item.name?.ru||'', name_lv:item.name?.lv||'', name_en:item.name?.en||'',
      desc_ru:item.desc?.ru||'', desc_lv:item.desc?.lv||'', desc_en:item.desc?.en||'',
    });
    setTab('add');
  }

  const CATS = ['cold','hot','tempura','gunkan','nigiri','sashimi','double','sets','soup','wok','burger','salad','poke','snacks','drinks'];
  const EMOJIS = ['🍣','🔥','🍤','🎎','🥗','🍜','🍱','🥤','🍟','🍛','🍔','🎁','🍒','🦐','🥢'];

  const filtOrders = orders.filter(o=>
    (stF==='all'||o.status===stF) &&
    (!search || o.name?.toLowerCase().includes(search.toLowerCase()) || String(o.id).includes(search))
  );
  const filtMenu = menu.filter(i=>
    (catF==='all'||i.cat===catF) &&
    (!search || i.name?.ru?.toLowerCase().includes(search.toLowerCase()) || i.name?.lv?.toLowerCase().includes(search.toLowerCase()))
  );

  // LOGIN
  if (!token) return (
    <div style={{minHeight:'100vh',background:'#f5f5f5',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'#fff',borderRadius:18,padding:'36px 32px',width:'100%',maxWidth:380,boxShadow:'0 8px 40px rgba(0,0,0,.12)'}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:'2.5rem',marginBottom:8}}>🍒</div>
          <div style={{fontSize:'1.3rem',fontWeight:900,color:'#e31e24'}}>Cherry Sushi</div>
          <div style={{fontSize:'.85rem',color:'#888',marginTop:4}}>Admin Panel</div>
        </div>
        <form onSubmit={login}>
          <div className="form-group">
            <label className="form-label">Parol</label>
            <input className="form-input" type="password" placeholder="Admin parolini kiriting"
              value={secret} onChange={e=>setSecret(e.target.value)} required autoFocus/>
          </div>
          {err && <div style={{background:'#fef2f2',color:'#e31e24',borderRadius:8,padding:'9px 12px',fontSize:'.8rem',marginBottom:12}}>{err}</div>}
          <button className="btn-primary" type="submit">Kirish →</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="admin-root" style={{minHeight:'100vh',background:'#f4f5f7',fontFamily:'Inter,sans-serif'}}>

      {/* TOP BAR */}
      <div style={{background:'#e31e24',padding:'10px 16px',minHeight:64,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',position:'sticky',top:0,zIndex:100,boxShadow:'0 2px 12px rgba(0,0,0,.2)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:'1.5rem'}}>🍒</span>
          <div>
            <div style={{color:'#fff',fontWeight:900,fontSize:'.95rem',letterSpacing:'-.3px'}}>Cherry Sushi</div>
            <div style={{color:'rgba(255,255,255,.65)',fontSize:'.68rem',marginTop:-1}}>Admin Panel</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}>
          <button onClick={load} style={{background:'rgba(255,255,255,.14)',border:'1px solid rgba(255,255,255,.18)',color:'#fff',borderRadius:12,padding:'8px 14px',fontSize:'.75rem',fontWeight:700,cursor:'pointer',backdropFilter:'blur(8px)'}}>🔄 Yangilash</button>
          <a href="/" target="_blank" rel="noreferrer" style={{background:'rgba(255,255,255,.14)',border:'1px solid rgba(255,255,255,.18)',color:'#fff',borderRadius:12,padding:'8px 14px',fontSize:'.75rem',fontWeight:700,cursor:'pointer',textDecoration:'none',backdropFilter:'blur(8px)'}}>Sayt ↗</a>
          <button onClick={()=>{localStorage.removeItem('sr_admin');setToken('');}} style={{background:'#fff',border:'none',color:'#e31e24',borderRadius:12,padding:'8px 14px',fontSize:'.75rem',fontWeight:800,cursor:'pointer'}}>Chiqish</button>
        </div>
      </div>

      {/* FLASH */}
      {msg && <div style={{background:msg.startsWith('❌')?'#fef2f2':'#f0fff4',borderBottom:`3px solid ${msg.startsWith('❌')?'#e31e24':'#22c55e'}`,padding:'10px 24px',fontSize:'.85rem',fontWeight:600}}>{msg}</div>}

      {/* TABS */}
      <div style={{background:'#fff',borderBottom:'1px solid #e5e7eb',padding:'0 16px',display:'flex',gap:6,overflowX:'auto',position:'sticky',top:64,zIndex:90}}>
        {[
          ['stats','📊 Statistika'],
          ['orders',`📦 Buyurtmalar${orders.filter(o=>o.status==='new').length>0?` (${orders.filter(o=>o.status==='new').length} yangi)`:''}`],
          ['menu',`🍣 Menyu (${menu.length})`],
          ['add', editItem?'✏️ Tahrirlash':'➕ Qo\'shish'],
        ].map(([k,label])=>(
          <button key={k} onClick={()=>{ setTab(k); setSrch(''); if(k!=='add'){setEdit(null);setForm(emptyForm());} }}
            style={{padding:'14px 16px',fontWeight:800,fontSize:'.82rem',background:tab===k?'#fff5f5':'transparent',border:'none',borderBottom:`2.5px solid ${tab===k?'#e31e24':'transparent'}`,color:tab===k?'#e31e24':'#6b7280',cursor:'pointer',whiteSpace:'nowrap',transition:'all .15s',borderTopLeftRadius:12,borderTopRightRadius:12}}>
            {label}
          </button>
        ))}
      </div>

       <div className="admin-wrap" style={{maxWidth:1200,margin:'0 auto',padding:'20px 24px 60px'}}>
        {/* ═══ STATS ═══ */}
        {tab==='stats' && stats && (
          <div>
            {/* KPI */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:14,marginBottom:20}}>
              {[
                {label:'Umumiy daromad',val:`€${fmt(stats.totalRevenue)}`,color:'#e31e24',ico:'💰'},
                {label:'Jami buyurtmalar',val:stats.totalOrders,color:'#2563eb',ico:'📦'},
                {label:'Bugun daromad',val:`€${fmt(stats.todayRevenue)}`,color:'#16a34a',ico:'📅'},
                {label:'Bugun buyurtma',val:stats.todayOrders,color:'#7c3aed',ico:'🔥'},
              ].map((c,i)=>(
                <div key={i} style={{background:'#fff',borderRadius:14,padding:'18px 20px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',borderLeft:`4px solid ${c.color}`}}>
                  <div style={{fontSize:'1rem',marginBottom:6}}>{c.ico}</div>
                  <div style={{fontSize:'1.6rem',fontWeight:900,color:'#111',lineHeight:1.1}}>{c.val}</div>
                  <div style={{fontSize:'.74rem',color:'#888',marginTop:4}}>{c.label}</div>
                </div>
              ))}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              {/* Status */}
              <div style={{background:'#fff',borderRadius:14,padding:'18px 20px',boxShadow:'0 1px 4px rgba(0,0,0,.08)'}}>
                <div style={{fontWeight:800,fontSize:'.78rem',textTransform:'uppercase',letterSpacing:'.6px',color:'#6b7280',marginBottom:14}}>📊 Statuslar</div>
                {Object.entries(STATUS).map(([k,v])=>{
                  const cnt = stats.byStatus?.[k]||0;
                  const pct = stats.totalOrders ? Math.round(cnt/stats.totalOrders*100) : 0;
                  return (
                    <div key={k} style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                      <span style={{width:70,fontSize:'.78rem',fontWeight:600}}>{v.icon} {v.label}</span>
                      <div style={{flex:1,height:6,background:'#f0f0f0',borderRadius:3,overflow:'hidden'}}>
                        <div style={{height:'100%',width:pct+'%',background:v.text,borderRadius:3,transition:'width .4s'}}/>
                      </div>
                      <span style={{width:28,textAlign:'right',fontSize:'.78rem',fontWeight:700}}>{cnt}</span>
                    </div>
                  );
                })}
              </div>

              {/* 7 days */}
              <div style={{background:'#fff',borderRadius:14,padding:'18px 20px',boxShadow:'0 1px 4px rgba(0,0,0,.08)'}}>
                <div style={{fontWeight:800,fontSize:'.78rem',textTransform:'uppercase',letterSpacing:'.6px',color:'#6b7280',marginBottom:14}}>📈 So'nggi 7 kun</div>
                {Object.entries(stats.last7||{}).map(([date,d])=>(
                  <div key={date} style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                    <span style={{width:36,fontSize:'.76rem',color:'#888'}}>{date.slice(5)}</span>
                    <div style={{flex:1,height:6,background:'#f0f0f0',borderRadius:3,overflow:'hidden'}}>
                      <div style={{height:'100%',width:Math.min(100,(d.revenue/Math.max(...Object.values(stats.last7||{}).map(x=>x.revenue||0),1))*100)+'%',background:'#e31e24',borderRadius:3}}/>
                    </div>
                    <span style={{fontSize:'.78rem',fontWeight:700,minWidth:50,textAlign:'right'}}>€{fmt(d.revenue)}</span>
                    <span style={{fontSize:'.74rem',color:'#888',minWidth:30}}>{d.orders}ta</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top items */}
            <div style={{background:'#fff',borderRadius:14,padding:'18px 20px',boxShadow:'0 1px 4px rgba(0,0,0,.08)'}}>
              <div style={{fontWeight:800,fontSize:'.78rem',textTransform:'uppercase',letterSpacing:'.6px',color:'#6b7280',marginBottom:14}}>⭐ Top mahsulotlar</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10}}>
                {(stats.topItems||[]).map((item,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'#fafafa',borderRadius:10}}>
                    <span style={{fontSize:'1.3rem',fontWeight:900,color:'#e31e24',minWidth:24}}>#{i+1}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'.8rem',fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</div>
                      <div style={{fontSize:'.72rem',color:'#888'}}>{item.qty} marta</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ ORDERS ═══ */}
        {tab==='orders' && (
          <div>
            {/* Filters */}
            <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 220px',gap:12,marginBottom:18}}>
              <input placeholder="🔍 Ism yoki #raqam..." value={search} onChange={e=>setSrch(e.target.value)}
                style={{width:'100%',height:48,border:'1.5px solid #d1d5db',borderRadius:14,padding:'0 16px',fontSize:'.9rem',outline:'none',background:'#fff'}}/>
              <select value={stF} onChange={e=>setStF(e.target.value)} style={{height:48,border:'1.5px solid #d1d5db',borderRadius:14,padding:'0 14px',fontSize:'.85rem',outline:'none',cursor:'pointer',background:'#fff'}}>
                <option value="all">Barcha ({orders.length})</option>
                {Object.entries(STATUS).map(([k,v])=>(
                  <option key={k} value={k}>{v.icon} {v.label} ({orders.filter(o=>o.status===k).length})</option>
                ))}
              </select>
            </div>

            {filtOrders.length===0 && (
              <div style={{textAlign:'center',padding:'48px',color:'#9ca3af',background:'#fff',borderRadius:14}}>Buyurtmalar topilmadi</div>
            )}

            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {filtOrders.map(o => (
                <div key={o.id} style={{background:'#fff',borderRadius:20,overflow:'hidden',boxShadow:'0 10px 30px rgba(15,23,42,.08)',border:'1px solid #eef0f3'}}>
                  {/* Order header */}
                  <div style={{display:'flex',alignItems:'center',gap:10,padding:'14px 18px',background:'#fcfcfd',borderBottom:'1px solid #f1f3f5',flexWrap:'wrap'}}>
                    <span style={{fontWeight:900,fontSize:.9+'rem',color:'#e31e24'}}>#{o.id}</span>
                    <span style={{background:STATUS[o.status||'new']?.color,color:STATUS[o.status||'new']?.text,borderRadius:20,padding:'3px 10px',fontSize:'.72rem',fontWeight:700}}>
                      {STATUS[o.status||'new']?.icon} {STATUS[o.status||'new']?.label}
                    </span>
                    <span style={{fontSize:'.74rem',color:'#9ca3af'}}>🕐 {fmtT(o.createdAt)}</span>
                    <span style={{fontSize:'.74rem',color:'#9ca3af'}}>{PAY[o.payMethod]||o.payMethod}</span>
                    <select value={o.status||'new'} onChange={e=>changeStatus(o.id,e.target.value)} style={{marginLeft:'auto',height:38,border:'1.5px solid #d1d5db',borderRadius:12,padding:'0 12px',fontSize:'.76rem',cursor:'pointer',outline:'none',background:'#fff',fontWeight:700}}>
                      {Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
                    </select>
                  </div>

                  {/* Order body */}
                    <div style={{padding:'16px 18px'}}>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10,marginBottom:12,fontSize:'.84rem'}}>
                      <span>👤 <b>{o.name}</b></span>
                      <a href={`tel:${o.phone}`} style={{color:'#e31e24',textDecoration:'none'}}>📞 {o.phone}</a>
                      {o.note && <span style={{color:'#6b7280'}}>💬 {o.note}</span>}
                    </div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:14}}>
                      {o.items?.map((it,i)=>(
                       <span key={i} style={{background:'#f8fafc',borderRadius:999,padding:'6px 12px',fontSize:'.76rem',fontWeight:700,border:'1px solid #eef2f7'}}>
      
                          {it.e} {it.name?.lv||it.name?.ru} ×{it.qty}
                        </span>
                      ))}
                    </div>
                      <div style={{fontWeight:900,fontSize:'1rem',color:'#e31e24',display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:4}}><span>💰 Jami</span><span>€{fmt(o.total)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ MENU ═══ */}
        {tab==='menu' && (
          <div>
            <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
              <input placeholder="🔍 Mahsulot nomi..." value={search} onChange={e=>setSrch(e.target.value)}
                style={{flex:1,minWidth:180,height:40,border:'1.5px solid #d1d5db',borderRadius:10,padding:'0 14px',fontSize:'.84rem',outline:'none'}}/>
              <select value={catF} onChange={e=>setCatF(e.target.value)}
                style={{height:40,border:'1.5px solid #d1d5db',borderRadius:10,padding:'0 10px',fontSize:'.82rem',outline:'none',cursor:'pointer'}}>
                <option value="all">Barchasi ({menu.length})</option>
                {CATS.map(c=><option key={c} value={c}>{c} ({menu.filter(i=>i.cat===c).length})</option>)}
              </select>
              <button onClick={()=>{setTab('add');setEdit(null);setForm(emptyForm());}}
                style={{height:40,background:'#e31e24',color:'#fff',border:'none',borderRadius:10,padding:'0 18px',fontWeight:700,fontSize:'.84rem',cursor:'pointer'}}>
                + Qo'shish
              </button>
            </div>
             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:16}}>
              {filtMenu.map(item=>(
                 <div key={item.id} style={{background:'#fff',borderRadius:18,overflow:'hidden',boxShadow:'0 10px 24px rgba(15,23,42,.08)',display:'flex',flexDirection:'column',transition:'transform .2s,box-shadow .2s',border:'1px solid #eef0f3'}}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,.12)'}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.07)'}}>
                  {/* Image */}
                  <div style={{position:'relative',paddingTop:'65%',background:'#f4f5f7',overflow:'hidden'}}>
                    {item.img
                      ? <img src={item.img} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                      : <span style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2.5rem'}}>{item.e}</span>}
                    {item.hit && <span style={{position:'absolute',top:7,left:7,background:'#e31e24',color:'#fff',fontSize:'.55rem',fontWeight:900,padding:'2px 7px',borderRadius:5,textTransform:'uppercase'}}>HIT</span>}
                  </div>
                  {/* Info */}
                  <div style={{padding:'10px 12px',flex:1}}>
                    <div style={{fontSize:'.82rem',fontWeight:700,marginBottom:3,lineHeight:1.3}}>{item.name?.lv||item.name?.ru}</div>
                    <div style={{fontSize:'.7rem',color:'#9ca3af',marginBottom:6}}>{item.cat}</div>
                    <div style={{fontSize:'.92rem',fontWeight:900,color:'#e31e24'}}>€{item.price?.toFixed(2)}</div>
                  </div>
                  {/* Actions */}
                  <div style={{display:'flex',gap:4,padding:'6px 10px 10px'}}>
                    <button onClick={()=>toggleHit(item.id)} title={item.hit?'Hit o\'chirish':'Hit qilish'}
                      style={{flex:1,height:30,borderRadius:7,border:'none',cursor:'pointer',background:item.hit?'#fef9c3':'#f4f5f7',fontSize:'.8rem',fontWeight:700}}>
                      {item.hit?'⭐':'☆'}
                    </button>
                    <button onClick={()=>startEdit(item)}
                      style={{flex:2,height:30,borderRadius:7,border:'none',cursor:'pointer',background:'#eff6ff',fontSize:'.78rem',fontWeight:700,color:'#2563eb'}}>
                      ✏️ Tahrir
                    </button>
                    <button onClick={()=>delItem(item.id)}
                      style={{flex:1,height:30,borderRadius:7,border:'none',cursor:'pointer',background:'#fff0f0',fontSize:'.8rem'}}>
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ ADD/EDIT ═══ */}
        {tab==='add' && (
          <div style={{background:'#fff',borderRadius:16,padding:'24px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',maxWidth:800}}>
            <h2 style={{fontSize:'1.05rem',fontWeight:800,marginBottom:20,color:'#111'}}>
              {editItem ? `✏️ Tahrirlash: ${editItem.name?.lv||editItem.name?.ru}` : '➕ Yangi mahsulot qo\'shish'}
            </h2>
            <form onSubmit={saveItem}>

              {/* Row 1 */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
                <div className="form-group">
                  <label className="form-label">Kategoriya *</label>
                  <select className="form-input" value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))}>
                    {CATS.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Emoji</label>
                  <select className="form-input" value={form.e} onChange={e=>setForm(f=>({...f,e:e.target.value}))}>
                    {EMOJIS.map(em=><option key={em} value={em}>{em} {em}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Hit</label>
                  <select className="form-input" value={form.hit?'yes':'no'} onChange={e=>setForm(f=>({...f,hit:e.target.value==='yes'}))}>
                    <option value="no">Yo'q</option>
                    <option value="yes">⭐ Ha</option>
                  </select>
                </div>
              </div>

              {/* Row 2 */}
              <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:12,marginBottom:16}}>
                <div className="form-group">
                  <label className="form-label">Rasm URL</label>
                  <input className="form-input" type="url" placeholder="https://..."
                    value={form.img} onChange={e=>setForm(f=>({...f,img:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Narx € *</label>
                  <input className="form-input" type="number" step="0.1" min="0" placeholder="8.90"
                    value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} required/>
                </div>
                <div className="form-group">
                  <label className="form-label">Eski narx €</label>
                  <input className="form-input" type="number" step="0.1" min="0" placeholder="11.00"
                    value={form.old} onChange={e=>setForm(f=>({...f,old:e.target.value}))}/>
                </div>
              </div>

              {form.img && <img src={form.img} alt="" style={{width:100,height:68,objectFit:'cover',borderRadius:8,marginBottom:14}} onError={e=>e.target.style.display='none'}/>}

              {/* Names */}
              <div style={{fontWeight:800,fontSize:'.76rem',textTransform:'uppercase',letterSpacing:'.7px',color:'#9ca3af',marginBottom:10,paddingBottom:6,borderBottom:'1px solid #f0f0f0'}}>Nomi</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
                {[['name_lv','🇱🇻 Latviešu'],['name_ru','🇷🇺 Русский'],['name_en','🇬🇧 English']].map(([k,lbl])=>(
                  <div key={k} className="form-group">
                    <label className="form-label">{lbl}</label>
                    <input className="form-input" placeholder={`Nom (${k.slice(-2)})`}
                      value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} required={k==='name_lv'||k==='name_ru'}/>
                  </div>
                ))}
              </div>

              {/* Descriptions */}
              <div style={{fontWeight:800,fontSize:'.76rem',textTransform:'uppercase',letterSpacing:'.7px',color:'#9ca3af',marginBottom:10,paddingBottom:6,borderBottom:'1px solid #f0f0f0'}}>Tavsif</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:24}}>
                {[['desc_lv','🇱🇻 Latviešu'],['desc_ru','🇷🇺 Русский'],['desc_en','🇬🇧 English']].map(([k,lbl])=>(
                  <div key={k} className="form-group">
                    <label className="form-label">{lbl}</label>
                    <input className="form-input" placeholder={`Tavsif (${k.slice(-2)})`}
                      value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/>
                  </div>
                ))}
              </div>

              <div style={{display:'flex',gap:10}}>
                <button className="btn-primary" type="submit" disabled={saving} style={{flex:1}}>
                  {saving ? '⏳ Saqlanmoqda...' : editItem ? '💾 Saqlash' : '➕ Qo\'shish'}
                </button>
                <button type="button" className="btn-secondary"
                  onClick={()=>{setTab('menu');setEdit(null);setForm(emptyForm());}}>
                  Bekor qilish
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

