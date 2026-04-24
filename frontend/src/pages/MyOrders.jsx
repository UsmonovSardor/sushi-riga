import React, { useEffect, useState } from 'react';
import { ordersApi } from '../services/api';

export default function MyOrdersPage({ isOpen, onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersApi.getMine();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadOrders();
    const id = setInterval(loadOrders, 15000);
    return () => clearInterval(id);
  }, [isOpen]);

  if (!isOpen) return null;

  const steps = ['new', 'accepted', 'cooking', 'ready', 'delivered'];

  return (
    <div className="orders-overlay" onClick={onClose}>
      <div className="orders-panel" onClick={(e) => e.stopPropagation()}>
        <div className="orders-head">
          <h2>📦 My Orders</h2>
          <button onClick={onClose}>×</button>
        </div>

        {loading && <p className="orders-empty">Loading...</p>}

        {!loading && orders.length === 0 && (
          <p className="orders-empty">No orders yet</p>
        )}

        <div className="orders-list">
          {orders.map((order) => {
            const current = Math.max(0, steps.indexOf(order.status || 'new'));

            return (
              <div className="order-card" key={order.id}>
                <div className="order-top">
                  <strong>Order #{order.id}</strong>
                  <span>{order.status}</span>
                </div>

                <div className="order-progress">
                  {steps.map((step, i) => (
                    <div
                      key={step}
                      className={`order-step ${i <= current ? 'active' : ''}`}
                    >
                      <div className="dot" />
                      <small>{step}</small>
                    </div>
                  ))}
                </div>

                <div className="order-items">
                  {(order.items || []).map((item) => (
                    <div key={item.id}>
                      {item.qty} × {item.name} — €{item.price}
                    </div>
                  ))}
                </div>

                <div className="order-total">
                  Total: <b>€{order.total}</b>
                </div>

                {order.status === 'ready' && (
                  <div className="order-ready">
                    ✅ Your order is ready!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
