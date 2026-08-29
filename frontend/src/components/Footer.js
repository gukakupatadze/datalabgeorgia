import React from 'react';
import { Facebook, Instagram, Mail, MapPin, Music2, Phone, Youtube } from 'lucide-react';
import { translations } from '../data/mockData';

const Footer = ({ language }) => {
  const t = translations[language];

  const socialLinks = [
    { label: 'Facebook', href: null, icon: Facebook },
    { label: 'Instagram', href: null, icon: Instagram },
    { label: 'TikTok', href: 'https://www.tiktok.com/@datalabgeorgia', icon: Music2 },
    { label: 'YouTube', href: null, icon: Youtube }
  ];

  const serviceLinks = [
    { labelKa: 'HDD აღდგენა', labelEn: 'HDD Recovery' },
    { labelKa: 'SSD აღდგენა', labelEn: 'SSD Recovery' },
    { labelKa: 'RAID აღდგენა', labelEn: 'RAID Recovery' },
    { labelKa: 'უსბ აღდგენა', labelEn: 'USB Recovery' },
    { labelKa: 'SD ბარათი', labelEn: 'SD Card Recovery' }
  ];

  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <img src="/images/datalab-logo.png" alt="DataLab Georgia" className="h-10 w-10 rounded-lg object-contain" />
              <span className="text-xl font-bold text-white">DataLab Georgia</span>
            </div>

            <p className="text-gray-400 leading-relaxed">
              {t.footerDesc}
            </p>

            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-500 text-sm font-medium">
                {language === 'ka' ? 'სამუშაო საათები:' : 'Business hours:'}
              </span>
              <span className="text-gray-400 text-sm">10:00–19:00</span>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">
              {t.services}
            </h3>
            <ul className="space-y-3">
              {serviceLinks.map((service, index) => (
                <li key={index}>
                  <span className="text-gray-400 hover:text-red-accent transition-colors duration-300 cursor-pointer">
                    {language === 'ka' ? service.labelKa : service.labelEn}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">
              {language === 'ka' ? 'გამოგვყევით' : 'Follow us'}
            </h3>
            <ul className="space-y-3">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  {href ? (
                    <a href={href} target="_blank" rel="noreferrer" className="flex items-center text-gray-400 transition-colors duration-300 hover:text-red-accent">
                      <Icon className="mr-2 h-5 w-5 text-red-accent" /><span>{label}</span>
                    </a>
                  ) : (
                    <span className="flex items-center text-gray-500" aria-label={`${label} — მალე`}>
                      <Icon className="mr-2 h-5 w-5 text-red-accent" /><span>{label}</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">
              {t.contactInfo}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-red-accent flex-shrink-0 mt-0.5" />
                <div>
                  <a href="tel:+995574001930" className="font-medium text-white transition-colors duration-300 hover:text-red-accent">
                    +995 574 00 19 30
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-red-accent flex-shrink-0 mt-0.5" />
                <div>
                  <a href="mailto:info@datalabgeorgia.ge" className="font-medium text-white transition-colors duration-300 hover:text-red-accent">
                    info@datalabgeorgia.ge
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-red-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">
                    {language === 'ka' ? 'თბილისი, ცოტნე დადიანის 7ბ' : '7b Tsotne Dadiani St., Tbilisi'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 mt-12">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} DataLab Georgia. {t.allRightsReserved}
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
