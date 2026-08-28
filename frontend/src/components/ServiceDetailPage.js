import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  DatabaseBackup,
  HardDrive,
  Layers,
  Search,
  ShieldCheck,
  Usb,
  Zap
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import Header from './Header';

const SERVICE_DETAILS = {
  'hdd-recovery': {
    icon: HardDrive,
    image: '/images/services/hdd-recovery.png',
    price: '150 ₾',
    ka: {
      title: 'HDD მონაცემთა აღდგენა',
      lead: 'მექანიკურად ან ლოგიკურად დაზიანებული მყარი დისკებიდან ფოტოების, დოკუმენტების, ვიდეოებისა და სხვა ფაილების პროფესიონალური აღდგენა.',
      cases: ['დისკი აღარ იკითხება ან ითხოვს ფორმატირებას', 'კლიკებს, წკაპუნებს ან უჩვეულო ხმას გამოსცემს', 'ფაილები შემთხვევით წაიშალა ან დანაყოფი დაიკარგა', 'SMART შეცდომა, bad sector-ები ან დაზიანებული ფაილური სისტემა'],
      included: ['პირველადი დიაგნოსტიკა და დაზიანების ტიპის განსაზღვრა', 'დისკის უსაფრთხო სექტორული კლონის შექმნა', 'ლოგიკური სტრუქტურისა და დაკარგული დანაყოფების აღდგენა', 'საჭიროების შემთხვევაში მექანიკური ნაწილის ლაბორატორიული დამუშავება', 'აღდგენილი ფაილების სიის მომზადება და გადამოწმება'],
      steps: [
        ['დიაგნოსტიკა', 'ვამოწმებთ ელექტრონიკას, თავაკებს, ზედაპირსა და SMART მაჩვენებლებს.'],
        ['სტაბილიზაცია', 'დაზიანებულ დისკზე პირდაპირ მუშაობის ნაცვლად ვქმნით მაქსიმალურად სრულ კლონს.'],
        ['აღდგენა', 'კლონიდან ვაწყობთ დანაყოფებს, საქაღალდეებსა და ფაილურ სისტემას.'],
        ['ჩაბარება', 'თქვენთან შეთანხმებულ ახალ მატარებელზე გადაგვაქვს გადამოწმებული მონაცემები.']
      ],
      warning: 'თუ HDD ხმაურობს ან აღარ იკითხება, აღარ ჩართოთ განმეორებით და არ გახსნათ სახლის პირობებში — ამან შეიძლება ზედაპირი დააზიანოს.'
    },
    en: {
      title: 'HDD Data Recovery',
      lead: 'Professional recovery of photos, documents, videos and other files from mechanically or logically damaged hard drives.',
      cases: ['The drive is unreadable or asks to be formatted', 'Clicking or other unusual mechanical noise', 'Deleted files or a lost partition', 'SMART errors, bad sectors or file-system damage'],
      included: ['Initial diagnostics and damage assessment', 'Safe sector-by-sector imaging', 'Logical structure and partition reconstruction', 'Laboratory mechanical work when required', 'File-list preparation and verification'],
      steps: [['Diagnostics', 'We inspect electronics, heads, media and SMART data.'], ['Stabilization', 'We create the safest possible clone instead of working on the original.'], ['Recovery', 'Partitions, folders and files are reconstructed from the clone.'], ['Delivery', 'Verified data is copied to an agreed healthy destination.']],
      warning: 'If the HDD clicks or is no longer readable, stop powering it on and never open it outside a suitable laboratory.'
    }
  },
  'ssd-recovery': {
    icon: Zap,
    image: '/images/services/ssd-recovery.png',
    price: '300 ₾',
    ka: {
      title: 'SSD მონაცემთა აღდგენა',
      lead: 'SATA, NVMe და სხვა SSD მატარებლებიდან მონაცემების აღდგენა კონტროლერის, firmware-ის, NAND მეხსიერების ან ლოგიკური დაზიანების დროს.',
      cases: ['SSD BIOS-ში ან სისტემაში აღარ ჩანს', 'კონტროლერი გადახურდა ან ელექტრულად დაზიანდა', 'Firmware გაიჭედა და ტევადობა არასწორად ჩანს', 'ფაილები წაიშალა, დისკი დაფორმატდა ან დანაყოფი დაზიანდა'],
      included: ['კონტროლერისა და კვების ხაზების დიაგნოსტიკა', 'Firmware-ისა და service area-ს ანალიზი', 'NAND ჩიპების წაკითხვა სპეციალური მოწყობილობით', 'ECC, XOR და wear-leveling სტრუქტურების რეკონსტრუქცია', 'ლოგიკური ფაილური სისტემის აღდგენა და შედეგის შემოწმება'],
      steps: [['დიაგნოსტიკა', 'ვადგენთ პრობლემა კონტროლერშია, firmware-ში, NAND-ში თუ ფაილურ სისტემაში.'], ['წვდომის აღდგენა', 'ვიყენებთ უსაფრთხო ტექნიკურ რეჟიმს ან საჭიროებისას ჩიპების პირდაპირ წაკითხვას.'], ['რეკონსტრუქცია', 'ვაწყობთ მეხსიერების გვერდებსა და კონტროლერის მიერ გამოყენებულ ტრანსლაციას.'], ['ვერიფიკაცია', 'ფაილებს ვამოწმებთ გახსნაზე და შეთანხმებულ მატარებელზე გადაგვაქვს.']],
      warning: 'SSD-ზე ახალი ფაილების ჩაწერა და ოპერაციული სისტემის ხელახლა დაყენება ამცირებს აღდგენის შანსს, განსაკუთრებით TRIM-ის შემდეგ.'
    },
    en: {
      title: 'SSD Data Recovery',
      lead: 'Recovery from SATA, NVMe and other SSD media affected by controller, firmware, NAND or logical failure.',
      cases: ['The SSD is no longer detected', 'Controller or power-circuit failure', 'Firmware lock or incorrect capacity', 'Deleted, formatted or corrupted volumes'],
      included: ['Controller and power diagnostics', 'Firmware and service-area analysis', 'Direct NAND acquisition when required', 'ECC, XOR and wear-level reconstruction', 'File-system recovery and verification'],
      steps: [['Diagnostics', 'We identify controller, firmware, NAND or logical failure.'], ['Access', 'Safe technical mode or direct chip acquisition is used.'], ['Reconstruction', 'Memory pages and controller translation are rebuilt.'], ['Verification', 'Recovered files are checked and copied to healthy storage.']],
      warning: 'Do not reinstall the OS or write new data to the SSD; TRIM and overwriting can make deleted data unrecoverable.'
    }
  },
  'usb-recovery': {
    icon: Usb,
    image: '/images/services/usb-recovery.png',
    price: '150 ₾',
    ka: {
      title: 'USB და მეხსიერების ბარათის აღდგენა',
      lead: 'USB Flash, SD და microSD მატარებლებიდან ფოტოების, ვიდეოების, დოკუმენტებისა და სხვა მონაცემების აღდგენა.',
      cases: ['USB ან ბარათი აღარ იკითხება', 'კონექტორი მოტეხილია ან დაფა დაზიანდა', 'მატარებელი ითხოვს ფორმატირებას', 'ფოტოები ან ფაილები წაიშალა და საქაღალდეები აღარ ჩანს'],
      included: ['კონექტორის, დაფისა და კვების დიაგნოსტიკა', 'კონტროლერისა და NAND მეხსიერების შეფასება', 'ლოგიკური იმიჯის ან ჩიპის პირდაპირი წაკითხვა', 'ECC/XOR მონაცემების დამუშავება და ფაილების აწყობა', 'ფოტოების, ვიდეოებისა და დოკუმენტების შემოწმება'],
      steps: [['შემოწმება', 'ვადგენთ ფიზიკური დაზიანებაა თუ ლოგიკური შეცდომა.'], ['იმიჯის შექმნა', 'მატარებლიდან ვიღებთ უსაფრთხო სრულ ასლს ან NAND dump-ს.'], ['დეკოდირება', 'საჭიროებისას ვაწყობთ კონტროლერის ალგორითმსა და მონაცემთა რიგს.'], ['ფაილების აღდგენა', 'ვპოულობთ, ვამოწმებთ და ახალ მატარებელზე გადაგვაქვს ფაილები.']],
      warning: 'არ დააფორმატოთ და არ გამოიყენოთ ავტომატური Repair ფუნქცია — მან შეიძლება მნიშვნელოვანი სტრუქტურები გადაწეროს.'
    },
    en: {
      title: 'USB & Memory Card Recovery',
      lead: 'Recovery of photos, videos, documents and other data from USB flash, SD and microSD media.',
      cases: ['The USB drive or card is unreadable', 'Broken connector or damaged PCB', 'The media asks to be formatted', 'Deleted photos, files or missing folders'],
      included: ['Connector, PCB and power diagnostics', 'Controller and NAND assessment', 'Logical imaging or direct chip reading', 'ECC/XOR processing and reconstruction', 'Photo, video and document verification'],
      steps: [['Inspection', 'We identify physical or logical damage.'], ['Imaging', 'A safe full image or NAND dump is acquired.'], ['Decoding', 'Controller algorithms and data order are reconstructed when needed.'], ['Recovery', 'Files are found, verified and copied to healthy storage.']],
      warning: 'Do not format the device or run automatic repair tools because they may overwrite important structures.'
    }
  },
  'raid-recovery': {
    icon: Layers,
    image: '/images/services/raid-recovery.png',
    price: '500 ₾',
    ka: {
      title: 'RAID და NAS მონაცემთა აღდგენა',
      lead: 'RAID 0/1/5/6/10, NAS, server storage და virtual RAID სისტემებიდან მონაცემების აღდგენა დისკების, კონტროლერის ან კონფიგურაციის დაზიანებისას.',
      cases: ['ერთდროულად ერთი ან რამდენიმე დისკი გამოვიდა მწყობრიდან', 'RAID degraded/offline მდგომარეობაშია', 'კონტროლერი ან NAS აღარ ირთვება', 'კონფიგურაცია, parity ან დისკების თანმიმდევრობა დაიკარგა'],
      included: ['ყველა დისკის ინდივიდუალური დიაგნოსტიკა და კლონირება', 'დისკების რიგის, stripe size-ისა და parity-ის განსაზღვრა', 'ვირტუალური RAID-ის უსაფრთხო რეკონსტრუქცია', 'ფაილური სისტემისა და volume-ების აღდგენა', 'კრიტიკული საქაღალდეების პრიორიტეტული გადამოწმება'],
      steps: [['ინვენტარიზაცია', 'ვაფიქსირებთ დისკების პოზიციებს, მოდელებსა და მიმდინარე მდგომარეობას.'], ['კლონირება', 'თითოეული დისკიდან ვქმნით უსაფრთხო ასლს და ორიგინალებს აღარ ვცვლით.'], ['RAID-ის აწყობა', 'ვადგენთ სწორ გეომეტრიას, parity-სა და დისკების თანმიმდევრობას.'], ['მონაცემების ექსპორტი', 'აღდგენილ volume-ს ვამოწმებთ და მონაცემებს ახალ საცავში გადაგვაქვს.']],
      warning: 'არ დაიწყოთ rebuild და არ შეცვალოთ დისკების თანმიმდევრობა. მონიშნეთ თითოეული დისკის საწყისი სლოტი და გამორთეთ სისტემა.'
    },
    en: {
      title: 'RAID & NAS Data Recovery',
      lead: 'Recovery from RAID 0/1/5/6/10, NAS, server storage and virtual RAID after disk, controller or configuration failure.',
      cases: ['One or several drives failed', 'Array is degraded or offline', 'Controller or NAS no longer starts', 'Configuration, parity or disk order was lost'],
      included: ['Individual drive diagnostics and imaging', 'Disk order, stripe size and parity analysis', 'Safe virtual RAID reconstruction', 'File-system and volume recovery', 'Priority verification of critical folders'],
      steps: [['Inventory', 'Drive positions, models and condition are recorded.'], ['Imaging', 'Every drive is safely cloned without modifying originals.'], ['Reconstruction', 'Correct geometry, parity and disk order are determined.'], ['Export', 'The recovered volume is verified and exported to new storage.']],
      warning: 'Do not start a rebuild or change disk order. Label every original slot and power the system down.'
    }
  }
};

const shared = {
  ka: {
    back: 'სერვისებზე დაბრუნება',
    from: 'საორიენტაციო ფასი, დან',
    cases: 'როდის არის ეს სერვისი საჭირო',
    included: 'რა შედის მომსახურებაში',
    process: 'როგორ მიმდინარეობს აღდგენა',
    time: 'ვადა განისაზღვრება დიაგნოსტიკის შემდეგ',
    request: 'სერვისის მოთხოვნა',
    note: 'საბოლოო ფასი დამოკიდებულია დაზიანებაზე, მოწყობილობის მდგომარეობასა და საჭირო სამუშაოზე.'
  },
  en: {
    back: 'Back to services',
    from: 'Estimated price from',
    cases: 'When this service is needed',
    included: 'What is included',
    process: 'How recovery works',
    time: 'Turnaround is confirmed after diagnostics',
    request: 'Request service',
    note: 'Final pricing depends on the damage, device condition and required work.'
  }
};

const ServiceDetailPage = ({ language = 'ka', setLanguage }) => {
  const { serviceSlug } = useParams();
  const navigate = useNavigate();
  const service = SERVICE_DETAILS[serviceSlug];
  if (!service) return <Navigate to="/" replace />;

  const copy = service[language] || service.ka;
  const ui = shared[language] || shared.ka;
  const Icon = service.icon;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header language={language} setLanguage={setLanguage} />

      <main className="pt-16">
        <section className="relative overflow-hidden border-b border-gray-800">
          <img src={service.image} alt={copy.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/90 to-gray-950/30" />
          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
            <button
              type="button"
              onClick={() => navigate('/#services')}
              className="mb-8 inline-flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-red-accent"
            >
              <ArrowLeft className="h-4 w-4" /> {ui.back}
            </button>
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-accent/15 ring-1 ring-red-accent/30">
                <Icon className="h-7 w-7 text-red-accent" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">{copy.title}</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">{copy.lead}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="border-red-accent px-4 py-2 text-base text-red-accent">
                  {ui.from}: {service.price}
                </Badge>
                <span className="inline-flex items-center gap-2 text-sm text-gray-300"><Clock3 className="h-4 w-4" /> {ui.time}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="rounded-2xl border border-gray-700 bg-gray-800/70 p-6">
            <h2 className="flex items-center gap-3 text-2xl font-bold"><Search className="h-6 w-6 text-red-accent" /> {ui.cases}</h2>
            <ul className="mt-6 space-y-4">
              {copy.cases.map((item) => <li key={item} className="flex gap-3 text-gray-300"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" /> {item}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl border border-gray-700 bg-gray-800/70 p-6">
            <h2 className="flex items-center gap-3 text-2xl font-bold"><DatabaseBackup className="h-6 w-6 text-red-accent" /> {ui.included}</h2>
            <ul className="mt-6 space-y-4">
              {copy.included.map((item) => <li key={item} className="flex gap-3 text-gray-300"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" /> {item}</li>)}
            </ul>
          </div>
        </section>

        <section className="border-y border-gray-800 bg-gray-950/50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold">{ui.process}</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {copy.steps.map(([title, description], index) => (
                <div key={title} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-accent font-bold">{index + 1}</span>
                  <h3 className="mt-4 text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-400">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
            <h2 className="flex items-center gap-3 text-xl font-bold text-amber-300"><ShieldCheck className="h-6 w-6" /> {copy.warning}</h2>
          </div>
          <div className="mt-8 rounded-2xl border border-red-accent/30 bg-gray-800 p-8 text-center">
            <p className="text-sm text-gray-400">{ui.note}</p>
            <p className="mt-3 text-3xl font-extrabold text-red-accent">{ui.from}: {service.price}</p>
            <Button className="mt-6 bg-red-accent px-8 text-white hover:bg-red-600" onClick={() => navigate('/#service-request')}>
              {ui.request} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ServiceDetailPage;
