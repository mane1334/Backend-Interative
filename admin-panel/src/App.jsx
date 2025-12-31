import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminLayout from './layouts/AdminLayout.jsx';
import Dashboard from './components/Dashboard.jsx';
import OrderHistory from './components/OrderHistory.jsx';
import DishManagement from './components/DishManagement.jsx';
import OrderManagement from './components/OrderManagement.jsx';
import AdManagement from './components/AdManagement.jsx';
import Settings from './components/Settings.jsx';
import DatabaseSettings from './components/DatabaseSettings.jsx';
import RatingsManagement from './components/RatingsManagement.jsx';
import SystemLogs from './components/SystemLogs.jsx';

function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/current-orders" element={<OrderManagement />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/menu" element={<DishManagement />} />
          <Route path="/ads" element={<AdManagement />} />
          <Route path="/ratings" element={<RatingsManagement />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/database" element={<DatabaseSettings />} />
          <Route path="/logs" element={<SystemLogs />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;

