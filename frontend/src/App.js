import React, { useEffect, useState } from 'react';
import './App.css';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation
} from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import Testimonials from './components/Testimonials';
import ServiceRequest from './components/ServiceRequest';
import PriceEstimation from './components/PriceEstimation';
import CaseTracking from './components/CaseTracking';
import Contact from './components/Contact';
import Footer from './components/Footer';
import ServiceDetailPage from './components/ServiceDetailPage';
import { Toaster } from './components/ui/sonner';

const AdminRedirect = () => {
  useEffect(() => {
    window.location.replace(
      process.env.REACT_APP_ADMIN_URL || 'http://localhost:3000'
    );
  }, []);

  return null;
};

const ScrollManager = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (hash) {
        document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0 });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, hash]);

  return null;
};

const Home = ({ language, setLanguage }) => (
  <div className="min-h-screen bg-gray-900">
    <Header language={language} setLanguage={setLanguage} />
    <main>
      <Hero language={language} />
      <Services language={language} />
      <ServiceRequest language={language} />
      <PriceEstimation language={language} />
      <CaseTracking language={language} />
      <Testimonials language={language} />
      <Contact language={language} />
    </main>
    <Footer language={language} />
  </div>
);

function App() {
  const [language, setLanguage] = useState(() => {
    const saved = window.localStorage.getItem('datalab-language');
    return saved === 'en' ? 'en' : 'ka';
  });

  useEffect(() => {
    window.localStorage.setItem('datalab-language', language);
    document.documentElement.lang = language;
  }, [language]);

  return (
    <div className="App">
      <BrowserRouter>
        <ScrollManager />
        <Routes>
          <Route
            path="/"
            element={<Home language={language} setLanguage={setLanguage} />}
          />
          <Route
            path="/services/:serviceSlug"
            element={<ServiceDetailPage language={language} setLanguage={setLanguage} />}
          />
          <Route path="/data-recovery" element={<Navigate to="/services/hdd-recovery" replace />} />
          <Route path="/admin/*" element={<AdminRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
