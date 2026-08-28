import React from 'react';
import { HardDrive, Shield, Wrench, Search, ChevronRight, Camera, Zap, Database, Cpu, Server, CreditCard, Usb, Layers } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { translations, services } from '../data/mockData';
import { useNavigate } from 'react-router-dom';

const Services = ({ language }) => {
  const t = translations[language];
  const navigate = useNavigate();

  const serviceRoutes = {
    1: '/services/hdd-recovery',
    2: '/services/ssd-recovery',
    3: '/services/usb-recovery',
    4: '/services/raid-recovery'
  };

  const openServiceDetails = (serviceId) => {
    navigate(serviceRoutes[serviceId]);
  };

  const getIcon = (iconName) => {
    const icons = {
      HardDrive,
      Shield,
      Wrench,
      Search,
      Camera,
      Zap,        // ელექტრული/სწრაფი - კარგია SSD-ისთვის
      Database,   // მონაცემები
      Cpu,        // პროცესორი/ჩიპი
      Server,     // სერვერი/ტექნოლოგია
      CreditCard, // ბარათი
      Usb,        // USB icon - პირდაპირ USB-ისთვის
      Layers      // ფენები - კარგია RAID-ისთვის (მრავალი ფენა)
    };
    return icons[iconName] || HardDrive;
  };

  return (
    <section id="services" className="py-20 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t.servicesTitle}
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {t.servicesSubtitle}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service) => {
            const IconComponent = getIcon(service.icon);
            return (
              <Card
                key={service.id}
                className="service-card bg-gray-800 border-gray-700 hover:border-red-accent/50 group cursor-pointer"
                role="link"
                tabIndex={0}
                aria-label={`${t[service.titleKey]} — ${language === 'ka' ? 'დეტალურად' : 'Learn More'}`}
                onClick={() => openServiceDetails(service.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openServiceDetails(service.id);
                  }
                }}
              >
                <CardHeader className="text-center pb-1">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-red-accent/10 rounded-full mb-1 mx-auto group-hover:bg-red-accent/20 transition-colors duration-300">
                    <IconComponent className="w-8 h-8 text-red-accent" />
                  </div>
                  <CardTitle className="text-xl font-bold text-white mb-1">
                    {t[service.titleKey]}
                  </CardTitle>
                  <CardDescription className="text-gray-400 mb-1">
                    {t[service.descKey]}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-2">
                  <div className="space-y-2 mb-10 mt-4">
                    {(language === 'ka' ? service.features : service.features_en || service.features).map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-300">
                        <ChevronRight className="w-4 h-4 text-red-accent mr-2 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-8">
                    <Badge variant="outline" className="border-red-accent text-red-accent">
                      {service.price}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-accent hover:text-white hover:bg-red-accent"
                      onClick={(event) => {
                        event.stopPropagation();
                        openServiceDetails(service.id);
                      }}
                    >
                      {language === 'ka' ? 'დეტალურად' : 'Learn More'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default Services;
