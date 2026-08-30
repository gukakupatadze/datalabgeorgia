import React from 'react';
import {
  Camera, ChevronRight, Cpu, CreditCard, Database, HardDrive,
  Layers, Search, Server, Shield, Usb, Wrench, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { translations, services } from '../data/mockData';

const serviceRoutes = {
  1: '/services/hdd-recovery',
  2: '/services/ssd-recovery',
  3: '/services/usb-recovery',
  4: '/services/raid-recovery'
};

const icons = {
  HardDrive,
  Shield,
  Wrench,
  Search,
  Camera,
  Zap,
  Database,
  Cpu,
  Server,
  CreditCard,
  Usb,
  Layers
};

const Services = ({ language }) => {
  const t = translations[language];

  return (
    <section id="services" className="bg-gray-900 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-6 text-4xl font-bold text-white md:text-5xl">{t.servicesTitle}</h2>
          <p className="mx-auto max-w-3xl text-xl text-gray-300">{t.servicesSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => {
            const IconComponent = icons[service.icon] || HardDrive;
            const route = serviceRoutes[service.id];
            const title = t[service.titleKey];
            return (
              <Link
                key={service.id}
                to={route}
                aria-label={`${title} — ${language === 'ka' ? 'დეტალურად' : 'Learn more'}`}
                className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-accent focus-visible:ring-offset-4 focus-visible:ring-offset-gray-900"
              >
                <Card className="service-card group h-full cursor-pointer border-gray-700 bg-gray-800 hover:border-red-accent/50">
                  <CardHeader className="pb-1 text-center">
                    <div className="mx-auto mb-1 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-accent/10 transition-colors duration-300 group-hover:bg-red-accent/20">
                      <IconComponent className="h-8 w-8 text-red-accent" />
                    </div>
                    <CardTitle className="mb-1 text-xl font-bold text-white">{title}</CardTitle>
                    <CardDescription className="mb-1 text-gray-400">{t[service.descKey]}</CardDescription>
                  </CardHeader>

                  <CardContent className="pt-2">
                    <div className="mb-10 mt-4 space-y-2">
                      {(language === 'ka' ? service.features : service.features_en || service.features).map((feature) => (
                        <div key={feature} className="flex items-center text-sm text-gray-300">
                          <ChevronRight className="mr-2 h-4 w-4 shrink-0 text-red-accent" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 flex items-center justify-between">
                      <Badge variant="outline" className="border-red-accent text-red-accent">{service.price}</Badge>
                      <span className="inline-flex h-8 items-center rounded-md px-3 text-xs font-medium text-red-accent transition-colors group-hover:bg-red-accent group-hover:text-white">
                        {language === 'ka' ? 'დეტალურად' : 'Learn more'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
