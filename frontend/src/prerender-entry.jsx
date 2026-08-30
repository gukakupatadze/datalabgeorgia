import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Route, Routes, StaticRouter } from 'react-router';
import { Home } from './App';
import ServiceDetailPage from './components/ServiceDetailPage';
import { SERVICE_DETAILS } from './data/serviceDetailsData';
import { HOME_SEO, SITE_URL } from './data/seoMetadata';

export const PUBLIC_ROUTES = [
  '/',
  '/services/hdd-recovery',
  '/services/ssd-recovery',
  '/services/raid-recovery',
  '/services/usb-recovery'
];

const serviceForRoute = (route) => SERVICE_DETAILS[route.split('/').filter(Boolean).at(-1)];

export const metadataForRoute = (route) => {
  if (route === '/') return HOME_SEO;

  const service = serviceForRoute(route);
  if (!service) throw new Error(`Unknown public SEO route: ${route}`);
  const copy = service.content.ka;

  return {
    title: copy.seo.title,
    description: copy.seo.description,
    canonical: `${SITE_URL}${route}`,
    image: `${SITE_URL}${service.image.src}`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: copy.faqs.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a }
      }))
    }
  };
};

export const renderRoute = (route) => {
  const content = route === '/'
    ? <Home language="ka" setLanguage={() => {}} />
    : (
      <Routes>
        <Route
          path="/services/:serviceSlug"
          element={<ServiceDetailPage language="ka" setLanguage={() => {}} />}
        />
      </Routes>
    );

  return renderToStaticMarkup(
    <StaticRouter location={route}>
      {content}
    </StaticRouter>
  );
};
