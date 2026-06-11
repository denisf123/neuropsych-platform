import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import Sidebar from './components/Sidebar';
import ToastContainer from './components/Toast';
import Modal from './components/Modal';
import Spinner from './components/Spinner';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BlockPage from './pages/BlockPage';
import TopicPage from './pages/TopicPage';
import TechniquePage from './pages/TechniquePage';
import MethodPage from './pages/MethodPage';
import TestPage from './pages/TestPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { loading } = useAuth();

  if (loading) return <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>;

  return (
    <>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <header className="mobile-header">
        <button className="burger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
        <span className="mobile-title">ЦДН Счастливые детки</span>
      </header>

      <main className="main-content">
        <div className="page-container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/block/:id" element={<BlockPage />} />
            <Route path="/topic/:id" element={<TopicPage />} />
            <Route path="/technique/:id" element={<TechniquePage />} />
            <Route path="/method/:id" element={<MethodPage />} />
            <Route path="/test/:topicId" element={<TestPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<div className="card"><h2>404</h2><p>Страница не найдена</p></div>} />
          </Routes>
        </div>
      </main>

      <ToastContainer />
      <Modal />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UIProvider>
          <AppContent />
        </UIProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
