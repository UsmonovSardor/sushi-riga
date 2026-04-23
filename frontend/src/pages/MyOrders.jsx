import React, { useEffect, useState } from 'react';
import { ordersApi } from '../services/api';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    ordersApi.getMine().then(setOrders);
  }, []);

  return (
    <div>
      <h2>My Orders</h2>
      {orders.map(o => (
        <div key={o.id}>
          #{o.id} — {o.status}
        </div>
      ))}
    </div>
  );
}
