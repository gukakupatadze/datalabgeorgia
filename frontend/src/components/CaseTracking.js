import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Package, Search, Wrench } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import { translations } from '../data/mockData';
import crmApi from '../lib/crmApi';

const STATUS_INFO = {
  new: {
    ka: 'ახალი',
    en: 'New',
    color: 'border-orange-500 text-orange-400',
    icon: AlertCircle
  },
  in_progress: {
    ka: 'მიმდინარე',
    en: 'In progress',
    color: 'border-blue-500 text-blue-400',
    icon: Wrench
  },
  waiting_for_part: {
    ka: 'ნაწილის მოლოდინში',
    en: 'Waiting for part',
    color: 'border-amber-500 text-amber-400',
    icon: Clock
  },
  ready: {
    ka: 'მზადაა',
    en: 'Ready',
    color: 'border-green-500 text-green-400',
    icon: CheckCircle
  },
  could_not_fix: {
    ka: 'ვერ შეკეთდა',
    en: 'Could not repair',
    color: 'border-red-500 text-red-400',
    icon: AlertCircle
  },
  picked_up: {
    ka: 'გატანილია',
    en: 'Picked up',
    color: 'border-emerald-500 text-emerald-400',
    icon: CheckCircle
  }
};

const statusMessage = (status, language) => {
  const messages = {
    new: {
      ka: 'თქვენი განაცხადი მიღებულია და დამუშავებას ელოდება.',
      en: 'Your request has been received and is waiting to be processed.'
    },
    in_progress: {
      ka: 'თქვენს მოწყობილობაზე მუშაობა მიმდინარეობს.',
      en: 'Work on your device is in progress.'
    },
    waiting_for_part: {
      ka: 'შეკეთებისთვის საჭირო ნაწილის მიღებას ველოდებით.',
      en: 'We are waiting for a required replacement part.'
    },
    ready: {
      ka: 'მოწყობილობა მზადაა. დეტალებისთვის დაგვიკავშირდით.',
      en: 'Your device is ready. Contact us for collection details.'
    },
    could_not_fix: {
      ka: 'სამწუხაროდ, მოწყობილობის შეკეთება ვერ მოხერხდა. დეტალებისთვის დაგვიკავშირდით.',
      en: 'Unfortunately, the device could not be repaired. Contact us for details.'
    },
    picked_up: {
      ka: 'მოწყობილობა გატანილია.',
      en: 'The device has been picked up.'
    }
  };
  return messages[status]?.[language] || '';
};

const formatDate = (dateString, language) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(language === 'ka' ? 'ka-GE' : 'en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

const CaseTracking = ({ language }) => {
  const t = translations[language];
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [tickets, setTickets] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const selectedTicket = tickets[selectedIndex] || null;
  const progressPercentage = selectedTicket
    ? Math.max(0, Math.min(100, Number(selectedTicket.progress_percentage) || 0))
    : 0;

  const trackCase = async () => {
    const value = query.trim();
    if (value.length < 4) {
      toast({
        title: language === 'ka' ? 'შეცდომა' : 'Error',
        description: language === 'ka'
          ? 'შეიყვანეთ ტიკეტის კოდი ან ტელეფონის ნომერი'
          : 'Enter a ticket code or phone number',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await crmApi.get('/public/tickets/track', {
        params: { query: value }
      });
      setTickets(response.data);
      setSelectedIndex(0);
      toast({
        title: language === 'ka' ? 'ტიკეტი ნაპოვნია' : 'Ticket found',
        description: response.data.length > 1
          ? (language === 'ka'
            ? `ნაპოვნია ${response.data.length} მიმდინარე ტიკეტი`
            : `${response.data.length} active tickets found`)
          : (language === 'ka' ? 'ინფორმაცია წარმატებით ჩაიტვირთა' : 'Ticket details loaded')
      });
    } catch (error) {
      setTickets([]);
      setSelectedIndex(0);
      toast({
        title: language === 'ka' ? 'ტიკეტი ვერ მოიძებნა' : 'Ticket not found',
        description: error.response?.status === 404
          ? (language === 'ka'
            ? 'ამ მონაცემებით მიმდინარე ტიკეტი არ იძებნება'
            : 'No active ticket matches this information')
          : (language === 'ka'
            ? 'ძიებისას დაფიქსირდა შეცდომა. სცადეთ მოგვიანებით.'
            : 'A search error occurred. Please try again later.'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const status = selectedTicket ? STATUS_INFO[selectedTicket.status] : null;
  const StatusIcon = status?.icon || AlertCircle;

  return (
    <section id="case-tracking" className="py-20 bg-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t.caseTrackingTitle}
          </h2>
          <p className="text-xl text-gray-300">{t.caseTrackingSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center">
                <Search className="w-6 h-6 text-red-accent mr-3" />
                {language === 'ka' ? 'ტიკეტის ძიება' : 'Ticket Search'}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {language === 'ka'
                  ? 'შეიყვანეთ ტიკეტის კოდი ან ტელეფონის ნომერი.'
                  : 'Enter your ticket code or phone number.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tracking-query" className="text-gray-300">
                  {language === 'ka' ? 'ტიკეტის კოდი ან ტელეფონის ნომერი' : 'Ticket code or phone number'}
                </Label>
                <Input
                  id="tracking-query"
                  type="text"
                  inputMode="tel"
                  autoComplete="tel"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && trackCase()}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder={language === 'ka' ? 'მაგ: 10001 ან 5XX XX XX XX' : 'e.g. 10001 or 5XX XX XX XX'}
                />
              </div>

              <Button
                type="button"
                onClick={trackCase}
                disabled={isLoading}
                className="w-full bg-red-accent hover-red-accent text-white py-3"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {language === 'ka' ? 'ძიება...' : 'Searching...'}
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    {language === 'ka' ? 'სტატუსის ნახვა' : 'View Status'}
                  </>
                )}
              </Button>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400">
                  {language === 'ka'
                    ? 'ტელეფონის ნომრით ძებნისას გამოჩნდება ყველა მიმდინარე ტიკეტი და ბოლო 30 დღის განმავლობაში გატანილი ნივთებიც.'
                    : 'Phone search shows every active ticket plus items picked up within the last 30 days.'}
                </p>
              </div>

              {tickets.length > 1 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">
                    {language === 'ka' ? 'აირჩიეთ ტიკეტი:' : 'Select a ticket:'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tickets.map((ticket, index) => (
                      <button
                        key={`${ticket.tracking_code || ticket.ticket_code}-${index}`}
                        type="button"
                        onClick={() => setSelectedIndex(index)}
                        className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                          selectedIndex === index
                            ? 'border-red-accent bg-red-accent text-white'
                            : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        #{ticket.tracking_code || ticket.ticket_code}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center">
                <Package className="w-6 h-6 text-red-accent mr-3" />
                {language === 'ka' ? 'აღდგენის სტატუსი' : 'Recovery Status'}
              </CardTitle>
            </CardHeader>

            <CardContent>
              {selectedTicket ? (
                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        #{selectedTicket.tracking_code || selectedTicket.ticket_code}
                      </h3>
                      <p className="text-gray-400">
                        {selectedTicket.device || selectedTicket.device_type?.toUpperCase()}
                      </p>
                    </div>
                    <Badge variant="outline" className={status?.color || 'border-gray-500 text-gray-400'}>
                      <StatusIcon className="w-4 h-4" />
                      <span className="ml-1">{status?.[language] || selectedTicket.status}</span>
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">{language === 'ka' ? 'პროგრესი' : 'Progress'}</span>
                      <span className="text-white">{progressPercentage}%</span>
                    </div>
                    <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-700">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${progressPercentage}%`,
                          background: 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)'
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between gap-4 py-2 border-b border-gray-700">
                      <span className="text-gray-400">{language === 'ka' ? 'მიღების თარიღი:' : 'Received:'}</span>
                      <span className="text-white text-right">{formatDate(selectedTicket.created_at, language)}</span>
                    </div>
                    {selectedTicket.estimated_completion && (
                      <div className="flex justify-between gap-4 py-2 border-b border-gray-700">
                        <span className="text-gray-400">{language === 'ka' ? 'სავარაუდო დასრულება:' : 'Estimated completion:'}</span>
                        <span className="text-white text-right">{formatDate(selectedTicket.estimated_completion, language)}</span>
                      </div>
                    )}
                    {selectedTicket.price !== null && selectedTicket.price !== undefined && (
                      <div className="flex justify-between gap-4 py-2 border-b border-gray-700">
                        <span className="text-gray-400">{language === 'ka' ? 'ღირებულება:' : 'Price:'}</span>
                        <span className="text-white">{selectedTicket.price} ₾</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-red-accent/10 border border-red-accent/20 rounded-lg p-4">
                    <p className="text-sm text-gray-300">
                      {statusMessage(selectedTicket.status, language) || selectedTicket.customer_message}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {language === 'ka'
                      ? 'შეიყვანეთ ტიკეტის კოდი ან ტელეფონის ნომერი, რათა ნახოთ მონაცემთა აღდგენის პროცესის მიმდინარე სტატუსი.'
                      : 'Enter a ticket code or phone number to view the current status of the data recovery process.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default CaseTracking;
