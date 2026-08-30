import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Globe, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { translations } from '../data/mockData';

const SERVICE_ITEMS = [
  {
    href: '/services/hdd-recovery',
    titleKa: 'HDD აღდგენა',
    titleEn: 'HDD Recovery'
  },
  {
    href: '/services/ssd-recovery',
    titleKa: 'SSD აღდგენა',
    titleEn: 'SSD Recovery'
  },
  {
    href: '/services/raid-recovery',
    titleKa: 'RAID / NAS აღდგენა',
    titleEn: 'RAID / NAS Recovery'
  },
  {
    href: '/services/usb-recovery',
    titleKa: 'USB / SD / microSD',
    titleEn: 'USB / SD / microSD'
  }
];

const Header = ({ language, setLanguage }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(false);
  const servicesCloseTimer = useRef(null);
  const servicesButtonRef = useRef(null);
  const { pathname } = useLocation();
  const t = translations[language];
  const isServicePage = pathname.startsWith('/services/');

  const cancelServicesClose = () => {
    if (servicesCloseTimer.current) {
      window.clearTimeout(servicesCloseTimer.current);
      servicesCloseTimer.current = null;
    }
  };

  const openServices = () => {
    cancelServicesClose();
    setIsServicesOpen(true);
  };

  const scheduleServicesClose = () => {
    cancelServicesClose();
    servicesCloseTimer.current = window.setTimeout(() => setIsServicesOpen(false), 130);
  };

  useEffect(() => {
    setIsServicesOpen(false);
    setIsMobileServicesOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isServicesOpen) {
        cancelServicesClose();
        setIsServicesOpen(false);
        servicesButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isServicesOpen]);

  useEffect(() => () => cancelServicesClose(), []);

  const toggleLanguage = () => {
    setLanguage(language === 'ka' ? 'en' : 'ka');
  };

  const goHome = () => {
    if (window.location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsMenuOpen(false);
      setIsMobileServicesOpen(false);
      return;
    }
    window.location.assign('/');
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
      setIsMobileServicesOpen(false);
      return;
    }
    window.location.assign(`/#${sectionId}`);
  };

  return (
    <header className="fixed top-0 left-0 right-0 right-scroll-bar-position bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer transition-transform duration-200 hover:scale-105"
            onClick={goHome}
          >
            <img
              src="/images/datalab-logo.png"
              alt="DataLab Georgia Logo"
              className="h-10 w-auto object-contain"
              style={{
                filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.4))'
              }}
            />
            <span className="text-xl font-bold text-white">DataLab Georgia</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={goHome}
              className="text-gray-300 hover:text-red-accent transition-colors duration-300"
            >
              {t.home}
            </button>
            <div
              className="relative"
              onMouseEnter={openServices}
              onMouseLeave={scheduleServicesClose}
              onFocus={openServices}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setIsServicesOpen(false);
              }}
            >
              <button
                ref={servicesButtonRef}
                type="button"
                aria-haspopup="true"
                aria-expanded={isServicesOpen}
                aria-controls="desktop-services-menu"
                onClick={() => setIsServicesOpen((open) => !open)}
                className={`inline-flex items-center gap-1.5 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-accent focus-visible:ring-offset-4 focus-visible:ring-offset-gray-900 ${isServicePage || isServicesOpen ? 'text-red-accent' : 'text-gray-300 hover:text-red-accent'}`}
              >
                {t.services}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isServicesOpen ? 'rotate-180' : ''}`} />
              </button>
              <span aria-hidden="true" className="absolute left-0 top-full h-3 w-full" />
              <div
                id="desktop-services-menu"
                role="menu"
                aria-label={t.services}
                aria-hidden={!isServicesOpen}
                className={`absolute left-1/2 top-full z-[60] mt-2 w-[min(210px,calc(100vw-2rem))] -translate-x-1/2 origin-top overflow-hidden rounded-lg border border-gray-700/80 bg-gray-900/[0.98] p-1 shadow-[0_10px_24px_rgba(0,0,0,0.34)] backdrop-blur-sm transition-all duration-150 ease-out ${isServicesOpen ? 'pointer-events-auto translate-y-0 scale-100 opacity-100' : 'pointer-events-none -translate-y-1 scale-[0.98] opacity-0'}`}
              >
                <div className="grid">
                  {SERVICE_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        role="menuitem"
                        tabIndex={isServicesOpen ? 0 : -1}
                        onClick={() => setIsServicesOpen(false)}
                        className={`flex min-h-9 items-center rounded-md px-3 py-1.5 text-left text-[13px] font-medium leading-5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-accent ${isActive ? 'bg-red-accent/10 text-red-accent' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                      >
                        {language === 'ka' ? item.titleKa : item.titleEn}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
            <button
              onClick={() => scrollToSection('service-request')}
              className="text-gray-300 hover:text-red-accent transition-colors duration-300"
            >
              {t.serviceRequestTitle}
            </button>
            <button
              onClick={() => scrollToSection('case-tracking')}
              className="text-gray-300 hover:text-red-accent transition-colors duration-300"
            >
              {t.caseTracking}
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-gray-300 hover:text-red-accent transition-colors duration-300"
            >
              {t.contact}
            </button>
          </nav>

          {/* Language Toggle & Mobile Menu */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="text-gray-300 hover:text-red-accent hover:bg-gray-800"
            >
              <Globe className="w-4 h-4 mr-1" />
              {language === 'ka' ? 'EN' : 'KA'}
            </Button>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-gray-300 hover:text-red-accent"
              onClick={() => {
                setIsMenuOpen((open) => {
                  if (open) setIsMobileServicesOpen(false);
                  return !open;
                });
              }}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-gray-800 border-t border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button
                onClick={goHome}
                className="block w-full text-left px-3 py-2 text-gray-300 hover:text-red-accent hover:bg-gray-700 rounded-md"
              >
                {t.home}
              </button>
              <div>
                <button
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={isMobileServicesOpen}
                  aria-controls="mobile-services-menu"
                  onClick={() => setIsMobileServicesOpen((open) => !open)}
                  className={`flex min-h-11 w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-accent ${isServicePage ? 'bg-red-accent/10 text-red-accent' : 'text-gray-300 hover:bg-gray-700 hover:text-red-accent'}`}
                >
                  <span>{t.services}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMobileServicesOpen ? 'rotate-180' : ''}`} />
                </button>
                <div
                  id="mobile-services-menu"
                  aria-hidden={!isMobileServicesOpen}
                  className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${isMobileServicesOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-1 px-1 pb-2 pt-1">
                      {SERVICE_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            tabIndex={isMobileServicesOpen ? 0 : -1}
                            onClick={() => {
                              setIsMobileServicesOpen(false);
                              setIsMenuOpen(false);
                            }}
                            className={`flex min-h-9 w-full min-w-0 items-center rounded-md px-4 py-1.5 text-[13px] font-medium leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-accent ${isActive ? 'bg-red-accent/10 text-red-accent' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                          >
                            {language === 'ka' ? item.titleKa : item.titleEn}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => scrollToSection('service-request')}
                className="block w-full text-left px-3 py-2 text-gray-300 hover:text-red-accent hover:bg-gray-700 rounded-md"
              >
                {t.serviceRequestTitle}
              </button>
              <button
                onClick={() => scrollToSection('case-tracking')}
                className="block w-full text-left px-3 py-2 text-gray-300 hover:text-red-accent hover:bg-gray-700 rounded-md"
              >
                {t.caseTracking}
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="block w-full text-left px-3 py-2 text-gray-300 hover:text-red-accent hover:bg-gray-700 rounded-md"
              >
                {t.contact}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
