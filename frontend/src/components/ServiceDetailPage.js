import React, { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, CircleDot,
  DatabaseBackup, HardDrive, Layers3, Search, ShieldCheck, Usb, Zap
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import { Button } from './ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { SERVICE_DETAILS } from '../data/serviceDetailsData';

const ICONS = { HardDrive, Zap, Layers3, Usb };
const SITE_URL = 'https://datalabgeorgia.ge';
const HOME_META = {
  title: 'DataLab Georgia - მონაცემთა აღდგენის სერვისი',
  description: 'DataLab Georgia — მონაცემთა აღდგენის პროფესიონალური სერვისი საქართველოში.'
};

function setHeadElement(selector, attributes) {
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement(attributes.tag || 'meta');
    document.head.appendChild(node);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    if (key !== 'tag') node.setAttribute(key, value);
  });
}

function useServiceSeo(service, copy, language) {
  useEffect(() => {
    if (!service || !copy) return undefined;

    const canonicalUrl = `${SITE_URL}/services/${service.slug}`;
    document.title = copy.seo.title;
    setHeadElement('meta[name="description"]', { name: 'description', content: copy.seo.description });
    setHeadElement('link[rel="canonical"]', { tag: 'link', rel: 'canonical', href: canonicalUrl });
    setHeadElement('meta[property="og:title"]', { property: 'og:title', content: copy.seo.title });
    setHeadElement('meta[property="og:description"]', { property: 'og:description', content: copy.seo.description });
    setHeadElement('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    setHeadElement('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    setHeadElement('meta[property="og:locale"]', { property: 'og:locale', content: language === 'ka' ? 'ka_GE' : 'en_US' });
    setHeadElement('meta[property="og:image"]', { property: 'og:image', content: `${SITE_URL}${service.image.src}` });

    const schemaId = 'service-faq-schema';
    document.getElementById(schemaId)?.remove();
    const schema = document.createElement('script');
    schema.id = schemaId;
    schema.type = 'application/ld+json';
    schema.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: copy.faqs.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a }
      }))
    });
    document.head.appendChild(schema);

    return () => {
      document.title = HOME_META.title;
      setHeadElement('meta[name="description"]', { name: 'description', content: HOME_META.description });
      setHeadElement('meta[property="og:title"]', { property: 'og:title', content: HOME_META.title });
      setHeadElement('meta[property="og:description"]', { property: 'og:description', content: HOME_META.description });
      setHeadElement('meta[property="og:image"]', { property: 'og:image', content: `${SITE_URL}/images/datalab-logo.png` });
      setHeadElement('link[rel="canonical"]', { tag: 'link', rel: 'canonical', href: `${SITE_URL}/` });
      setHeadElement('meta[property="og:url"]', { property: 'og:url', content: `${SITE_URL}/` });
      setHeadElement('meta[property="og:locale"]', { property: 'og:locale', content: 'ka_GE' });
      document.getElementById(schemaId)?.remove();
    };
  }, [service, copy, language]);
}

const BulletList = ({ items = [], tone = 'default' }) => (
  <ul className="mt-5 grid gap-3">
    {items.map((item) => (
      <li key={item} className="flex gap-3 text-sm leading-6 text-gray-300">
        {tone === 'warning'
          ? <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-amber-400" />
          : <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-red-accent" />}
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const ServiceDetailPage = ({ language = 'ka', setLanguage }) => {
  const { serviceSlug } = useParams();
  const service = SERVICE_DETAILS[serviceSlug];
  const copy = service ? (service.content[language] || service.content.ka) : null;
  useServiceSeo(service, copy, language);

  if (!service) return <Navigate to="/" replace />;
  const Icon = ICONS[service.iconName] || DatabaseBackup;

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-900 text-white">
      <Header language={language} setLanguage={setLanguage} />
      <main className="pt-16">
        <section className="relative isolate overflow-hidden border-b border-gray-800">
          <img
            src={service.image.src}
            width={service.image.width}
            height={service.image.height}
            alt={service.image.alt[language] || service.image.alt.ka}
            fetchPriority="high"
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-gray-950 via-gray-950/95 to-gray-950/55" />
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
            <Link to="/#services" className="inline-flex items-center gap-2 rounded text-sm text-gray-300 transition hover:text-red-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-accent">
              <ArrowLeft className="h-4 w-4" /> {language === 'ka' ? 'სერვისებზე დაბრუნება' : 'Back to services'}
            </Link>
            <div className="mt-8 max-w-3xl">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-accent/15 ring-1 ring-red-accent/40">
                <Icon className="h-7 w-7 text-red-accent" />
              </div>
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">{copy.title}</h1>
              <div className="mt-6 max-w-2xl space-y-4 text-base leading-7 text-gray-300 sm:text-lg sm:leading-8">
                {copy.hero.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild className="h-12 bg-red-accent px-6 text-white hover:bg-red-600">
                  <Link to="/#service-request">{language === 'ka' ? 'მოითხოვეთ დიაგნოსტიკა' : 'Request diagnostics'}</Link>
                </Button>
                <p className="flex items-center text-sm text-gray-300"><ShieldCheck className="mr-2 h-4 w-4 shrink-0 text-emerald-400" />{copy.diagnosisNote}</p>
              </div>
            </div>
          </div>
        </section>

        <section aria-label={language === 'ka' ? 'შესაძლებლობები' : 'Capabilities'} className="border-b border-gray-800 bg-gray-800">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4">
            {copy.trust.map((item) => <p key={item} className="bg-gray-950/95 px-6 py-5 text-center text-sm font-medium text-gray-200">{item}</p>)}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {copy.overviewSections.map((section, sectionIndex) => (
            <article key={section.title} className={sectionIndex === 0 ? '' : 'mt-16 border-t border-gray-800 pt-16'}>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-accent">DataLab Georgia</p>
              <h2 className="mt-3 max-w-3xl text-3xl font-bold sm:text-4xl">{section.title}</h2>
              {section.text && <p className="mt-4 max-w-3xl leading-7 text-gray-400">{section.text}</p>}
              {section.cards?.length > 0 && (
                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {section.cards.map((card, index) => (
                    <div key={card.title} className="rounded-2xl border border-gray-800 bg-gray-950/50 p-6">
                      <span className="text-sm font-bold text-red-accent">{String(index + 1).padStart(2, '0')}</span>
                      <h3 className="mt-3 text-xl font-bold">{card.title}</h3>
                      {card.text && <p className="mt-3 text-sm leading-6 text-gray-400">{card.text}</p>}
                      {card.items?.length > 0 && <BulletList items={card.items} />}
                    </div>
                  ))}
                </div>
              )}
              {section.items?.length > 0 && <div className="mt-8 max-w-4xl rounded-2xl border border-gray-800 bg-gray-950/40 p-6 sm:p-8"><BulletList items={section.items} /></div>}
            </article>
          ))}
        </section>

        <section className="border-y border-gray-800 bg-gray-950/50 py-16">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div><h2 className="flex items-start gap-3 text-3xl font-bold"><Search className="mt-1 h-7 w-7 shrink-0 text-red-accent" />{copy.signs.title}</h2><BulletList items={copy.signs.items} tone="warning" /></div>
            {copy.recoverable && <div><h2 className="flex items-start gap-3 text-3xl font-bold"><DatabaseBackup className="mt-1 h-7 w-7 shrink-0 text-red-accent" />{copy.recoverable.title}</h2><p className="mt-4 leading-7 text-gray-400">{copy.recoverable.text}</p><BulletList items={copy.recoverable.items} /></div>}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">{copy.processTitle}</h2>
          <div className="relative mt-12 space-y-6 before:absolute before:bottom-4 before:left-[1.15rem] before:top-4 before:w-px before:bg-gray-700 md:before:left-1/2">
            {copy.process.map((step, index) => (
              <article key={`${step.title}-${index}`} className={`relative grid gap-5 pl-14 md:grid-cols-2 md:pl-0 ${index % 2 ? '' : 'md:text-right'}`}>
                <div className={`rounded-2xl border border-gray-800 bg-gray-950/60 p-6 ${index % 2 ? 'md:col-start-2' : ''}`}>
                  <p className="text-sm font-bold text-red-accent">{String(index + 1).padStart(2, '0')}</p>
                  <h3 className="mt-2 text-xl font-bold">{step.title}</h3>
                  {step.text && <p className="mt-3 text-sm leading-6 text-gray-400">{step.text}</p>}
                  {step.items?.length > 0 && <BulletList items={step.items} />}
                </div>
                <span className="absolute left-0 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-red-accent text-sm font-bold md:left-1/2 md:-translate-x-1/2">{index + 1}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-gray-800 bg-gray-950/50 py-16">
          <div className="mx-auto max-w-6xl space-y-12 px-4 sm:px-6 lg:px-8">
            {copy.technical.map((section) => (
              <article key={section.title} className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
                <h2 className="text-3xl font-bold">{section.title}</h2>
                <div className="space-y-4 leading-7 text-gray-300">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.items?.length > 0 && <BulletList items={section.items} />}</div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 sm:p-8">
            <h2 className="flex items-start gap-3 text-2xl font-bold text-amber-200"><AlertTriangle className="mt-1 h-6 w-6 shrink-0" />{copy.warning.title}</h2>
            <BulletList items={copy.warning.items} tone="warning" />
            <p className="mt-6 leading-7 text-amber-100/80">{copy.warning.text}</p>
          </div>
        </section>

        <section className="border-y border-gray-800 bg-gray-950/50 py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="text-3xl font-bold sm:text-4xl">{copy.faqTitle}</h2>
            <Accordion type="single" collapsible className="mt-8 rounded-2xl border border-gray-800 bg-gray-900 px-5 sm:px-7">
              {copy.faqs.map(({ q, a }, index) => <AccordionItem key={q} value={`faq-${index}`} className="border-gray-800"><AccordionTrigger className="py-5 text-left text-base text-white hover:text-red-accent hover:no-underline">{q}</AccordionTrigger><AccordionContent className="pb-5 leading-7 text-gray-400">{a}</AccordionContent></AccordionItem>)}
            </Accordion>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">{copy.relatedTitle}</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {service.related.map((slug) => {
              const related = SERVICE_DETAILS[slug];
              if (!related) return null;
              const relatedCopy = related.content[language] || related.content.ka;
              const RelatedIcon = ICONS[related.iconName] || CircleDot;
              return <Link key={slug} to={`/services/${slug}`} className="group rounded-2xl border border-gray-800 bg-gray-950/50 p-6 transition hover:-translate-y-1 hover:border-red-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-accent"><RelatedIcon className="h-7 w-7 text-red-accent" /><h3 className="mt-4 text-xl font-bold group-hover:text-red-accent">{relatedCopy.title}</h3><span className="mt-5 inline-flex items-center gap-2 text-sm text-gray-400">{language === 'ka' ? 'სერვისის ნახვა' : 'View service'}<ArrowRight className="h-4 w-4" /></span></Link>;
            })}
          </div>
        </section>

        <section className="border-t border-gray-800 bg-gradient-to-br from-gray-950 to-gray-900 py-16">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-extrabold sm:text-4xl">{copy.finalCta.title}</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-300">{copy.finalCta.text}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild className="h-12 bg-red-accent px-7 text-white hover:bg-red-600"><Link to="/#contact">{copy.finalCta.contact}</Link></Button>
              <Button asChild variant="outline" className="h-12 border-gray-600 bg-transparent px-7 text-white hover:bg-gray-800"><Link to="/#service-request">{copy.finalCta.request}</Link></Button>
            </div>
          </div>
        </section>
      </main>
      <Footer language={language} />
    </div>
  );
};

export default ServiceDetailPage;
