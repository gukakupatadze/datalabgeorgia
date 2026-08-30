const sharedKa = {
  diagnosisNote: 'ზუსტი შეფასება ხდება მოწყობილობის დიაგნოსტიკის შემდეგ.',
  faqTitle: 'ხშირად დასმული კითხვები',
  relatedTitle: 'სხვა მონაცემთა აღდგენის სერვისები',
  finalCta: {
    title: 'დაკარგეთ მნიშვნელოვანი მონაცემები?',
    text: 'მოწყობილობის მდგომარეობისა და მონაცემების აღდგენის შესაძლებლობის შეფასება ხდება დიაგნოსტიკის შემდეგ.',
    contact: 'დაგვიკავშირდით',
    request: 'შეკვეთის შექმნა'
  }
};

const sharedEn = {
  diagnosisNote: 'An exact assessment is provided after device diagnostics.',
  faqTitle: 'Frequently asked questions',
  relatedTitle: 'Other data recovery services',
  finalCta: {
    title: 'Have you lost important data?',
    text: 'The condition of the device and the possibility of data recovery are assessed after diagnostics.',
    contact: 'Contact us',
    request: 'Create a request'
  }
};

export const SERVICE_DETAILS = {
  'hdd-recovery': {
    slug: 'hdd-recovery',
    iconName: 'HardDrive',
    image: {
      src: '/images/services/hdd-recovery.png',
      width: 1807,
      height: 870,
      alt: {
        ka: 'HDD მყარი დისკის მონაცემთა აღდგენის ლაბორატორიული სამუშაო',
        en: 'Laboratory data recovery work on an HDD hard drive'
      }
    },
    related: ['ssd-recovery', 'raid-recovery', 'usb-recovery'],
    content: {
      ka: {
        ...sharedKa,
        seo: {
          title: 'HDD მონაცემთა აღდგენა საქართველოში | DataLab Georgia',
          description: 'HDD მონაცემთა აღდგენა საქართველოში — ლოგიკური, მექანიკური და ელექტრონული დაზიანებები, SMART, Bad Sectors, Firmware და ლაბორატორიული სამუშაოები.'
        },
        title: 'HDD მონაცემთა აღდგენა',
        hero: [
          'DataLab Georgia-ში ვახორციელებთ მონაცემების აღდგენას შიდა და გარე მყარი დისკებიდან (HDD), მათ შორის ლოგიკური, ელექტრონული და მექანიკური დაზიანებების შემთხვევაში.',
          'ვმუშაობთ შემთხვევებზე, როდესაც მყარი დისკი აღარ იკითხება, კომპიუტერი ვერ ხედავს HDD-ს, მოწყობილობა გამოსცემს უჩვეულო ხმას, აქვს SMART ან Bad Sector პრობლემები, დაზიანებულია ფაილური სისტემა, firmware ან მექანიკური კომპონენტები.',
          'ფიზიკური დაზიანების შემთხვევაში საჭირო სამუშაოები შეიძლება შესრულდეს სპეციალიზებულ სუფთა სამუშაო გარემოში.'
        ],
        trust: ['ლოგიკური დაზიანება', 'ელექტრონული დაზიანება', 'მექანიკური დაზიანება', 'სექტორული ასლის შექმნა'],
        overviewSections: [
          {
            title: 'HDD დაზიანების ძირითადი ტიპები',
            cards: [
              {
                title: 'ლოგიკური დაზიანება',
                text: 'ლოგიკური დაზიანების დროს HDD შეიძლება ფიზიკურად გამართული იყოს, მაგრამ ფაილები მიუწვდომელი გახდეს ფაილური სისტემის, partition-ის ან სხვა მონაცემთა სტრუქტურის დაზიანების გამო.',
                items: ['შემთხვევით წაშლილი ფაილები', 'Format', 'დაკარგული Partition', 'RAW Partition', 'File System Corruption', 'მიუწვდომელი ფაილები', 'მონაცემთა სტრუქტურის დაზიანება']
              },
              {
                title: 'ელექტრონული დაზიანება',
                items: ['PCB დაზიანება', 'ელექტრონული კომპონენტის გაუმართაობა', 'კვების პრობლემები', 'ძაბვის დაზიანება', 'დამწვარი კომპონენტები', 'დაზიანებული კონექტორი']
              },
              {
                title: 'მექანიკური დაზიანება',
                items: ['Clicking ხმა', 'წამკითხველი თავაკების დაზიანება', 'Head Crash', 'Actuator-ის პრობლემა', 'Motor / Spindle პრობლემა', 'დისკი აღარ ტრიალებს', 'HDD აღარ იდენტიფიცირდება', 'შიდა მექანიკური დაზიანება']
              }
            ]
          }
        ],
        signs: {
          title: 'ნიშნები, რომ HDD შეიძლება დაზიანებული იყოს',
          items: ['დისკი აღარ ჩანს BIOS/UEFI-ში', 'HDD პერიოდულად ქრება', 'უჩვეულო clicking ან repetitive ხმა', 'დისკი ძალიან ნელა მუშაობს', 'SMART Warning', 'Bad Sectors', 'სისტემა იყინება HDD-ზე წვდომისას', 'ფაილები აღარ იხსნება', 'Windows ითხოვს Format-ს', 'უცნაური vibration ან ხმა']
        },
        recoverable: {
          title: 'რა მონაცემების აღდგენა შეიძლება?',
          text: 'დაზიანების ტიპისა და მედიის მდგომარეობის მიხედვით შესაძლებელია სხვადასხვა ტიპის მომხმარებლის მონაცემების აღდგენა. კონკრეტული შედეგი დიაგნოსტიკისა და მედიის მდგომარეობის მიხედვით ფასდება.',
          items: ['ფოტოები', 'ვიდეოები', 'დოკუმენტები', 'სამუშაო ფაილები', 'არქივები', 'პროექტები', 'მომხმარებლის სხვა ფაილები']
        },
        processTitle: 'HDD მონაცემთა აღდგენის პროცესი',
        process: [
          { title: 'მიღება და რეგისტრაცია', text: 'ვაფიქსირებთ მოწყობილობისა და შემთხვევის ძირითად მონაცემებს.', items: ['HDD მოდელი და სერიული ნომერი', 'მოწყობილობის მდგომარეობა', 'მომხმარებლის მიერ აღწერილი პრობლემა', 'მონაცემების დაკარგვის გარემოებები', 'პრიორიტეტული ფაილები და საქაღალდეები'] },
          { title: 'პირველადი დიაგნოსტიკა', text: 'ვაფასებთ მოწყობილობის ტექნიკურ მდგომარეობას.', items: ['მოწყობილობის იდენტიფიკაცია', 'SMART მონაცემები', 'ელექტრონული მდგომარეობა', 'firmware-ის მდგომარეობა', 'წაკითხვის სტაბილურობა', 'მექანიკური დაზიანების ნიშნები'] },
          { title: 'დაზიანების ტიპის განსაზღვრა', text: 'განისაზღვრება, პრობლემა არის logical, firmware, electronic თუ mechanical.' },
          { title: 'საჭირო ტექნიკური სამუშაო', text: 'კონკრეტული დაზიანების მიხედვით შეიძლება საჭირო გახდეს შესაბამისი ტექნიკური სამუშაო.', items: ['PCB დიაგნოსტიკა ან შეკეთება', 'ROM/adaptive data სამუშაო', 'firmware/service area სამუშაო', 'შესაბამისი donor HDD-ის შერჩევა', 'წამკითხველი თავაკების შეცვლა'] },
          { title: 'სუფთა გარემოში ლაბორატორიული ჩარევა', text: 'თუ მექანიკურად დაზიანებულ HDD-ზე შიდა მექანიზმთან მუშაობაა საჭირო, პროცედურა სრულდება სპეციალიზებულ სუფთა სამუშაო გარემოში.' },
          { title: 'უსაფრთხო Sector-by-Sector Image', text: 'როდესაც მოწყობილობის მდგომარეობა ამის საშუალებას იძლევა, პრიორიტეტია დაზიანებული დისკიდან სექტორული ასლის შექმნა. შემდგომი ანალიზი შესაძლებლობის შემთხვევაში კეთდება ასლზე და არა ორიგინალ HDD-ზე.' },
          { title: 'მონაცემების რეკონსტრუქცია', text: 'მიღებულ image-ზე სრულდება partition analysis, file system analysis, logical reconstruction და საჭირო ფაილების მოძიება.' },
          { title: 'შედეგის შემოწმება', text: 'მოწმდება აღდგენილი ფაილების სტრუქტურა და ხელმისაწვდომობა.' }
        ],
        technical: [
          {
            title: 'HDD ლაბორატორიული სამუშაოები',
            paragraphs: [
              'მექანიკურად დაზიანებული HDD-ის გახსნა ჩვეულებრივ სამუშაო გარემოში არ არის რეკომენდებული. დისკის შიდა მაგნიტური ზედაპირი და წამკითხველი სისტემა ძალიან მგრძნობიარეა მტვრისა და სხვა ნაწილაკების მიმართ.',
              'საჭიროების შემთხვევაში DataLab Georgia-ში HDD-ის შიდა მექანიზმთან დაკავშირებული სამუშაო სრულდება სპეციალიზებულ სუფთა სამუშაო გარემოში.'
            ],
            items: ['თავსებადი donor HDD-ის შერჩევა', 'წამკითხველი თავაკების შეცვლა', 'ელექტრონული პლატის დიაგნოსტიკა', 'დაზიანებული კომპონენტების შეფასება', 'მოწყობილობის დროებით სტაბილიზაცია', 'მონაცემების მაქსიმალურად უსაფრთხოდ წაკითხვის მცდელობა']
          },
          {
            title: 'PC-3000 გამოყენება',
            paragraphs: ['DataLab Georgia მონაცემთა აღდგენის სამუშაოებში იყენებს PC-3000 პროფესიულ სისტემას. კონკრეტული დაზიანების მიხედვით ტექნოლოგია გამოიყენება ტექნიკური დიაგნოსტიკისა და კონტროლირებული მუშაობისთვის.'],
            items: ['HDD-ის ტექნიკური დიაგნოსტიკა', 'firmware-ის ანალიზი', 'Service Area-სთან მუშაობა', 'კონტროლირებული წაკითხვა', 'დაზიანებული მედიის imaging', 'რთული წაკითხვის შემთხვევების მართვა']
          }
        ],
        warning: {
          title: 'HDD დაზიანების დროს რა არ უნდა გააკეთოთ',
          items: ['ნუ გახსნით HDD-ს სახლში', 'ნუ ჩართავთ მრავალჯერ clicking drive-ს', 'არ გაუშვათ CHKDSK, თუ ფიზიკური დაზიანების ეჭვია', 'არ გააკეთოთ Format', 'ნუ გამოიყენებთ შემთხვევით Recovery პროგრამებს არასტაბილურ HDD-ზე', 'ნუ გამოიყენებთ ინტერნეტში გავრცელებულ freezer ან სხვა საეჭვო მეთოდებს'],
          text: 'თუ დისკზე მნიშვნელოვანი ინფორმაცია ინახება, არასწორმა ექსპერიმენტებმა შეიძლება აღდგენის პროცესი დამატებით გაართულოს.'
        },
        faqs: [
          { q: 'შესაძლებელია თუ არა HDD-ის აღდგენა, თუ დისკი აღარ იკითხება?', a: 'ხშირ შემთხვევაში შესაძლებელია, თუმცა შედეგი დამოკიდებულია დაზიანების ტიპსა და დისკის ფიზიკურ მდგომარეობაზე. ზუსტი შეფასება ხდება დიაგნოსტიკის შემდეგ.' },
          { q: 'რას ნიშნავს HDD-ის Clicking ხმა?', a: 'Clicking ხმა შეიძლება დაკავშირებული იყოს წამკითხველი თავაკების, firmware-ის ან სხვა მექანიკური კომპონენტის პრობლემასთან. ასეთ შემთხვევაში რეკომენდებული არ არის დისკის მრავალჯერ ჩართვა.' },
          { q: 'შესაძლებელია ფორმატირებული HDD-დან მონაცემების აღდგენა?', a: 'ხშირ შემთხვევაში მონაცემების სრულად ან ნაწილობრივ აღდგენა შესაძლებელია, განსაკუთრებით თუ Format-ის შემდეგ დისკზე ახალი ინფორმაცია არ ჩაწერილა.' },
          { q: 'აკეთებთ HDD-ის წამკითხველი თავაკების შეცვლას?', a: 'საჭიროების შემთხვევაში შესაძლებელია თავსებადი donor HDD-ის გამოყენება და წამკითხველი თავაკების შეცვლა სპეციალიზებულ სუფთა სამუშაო გარემოში.' },
          { q: 'რატომ არ უნდა გავხსნა HDD სახლში?', a: 'HDD-ის შიდა ზედაპირები და წამკითხველი სისტემა მგრძნობიარეა მტვრისა და სხვა ნაწილაკების მიმართ. არასათანადო გარემოში გახსნამ შეიძლება დამატებითი ფიზიკური დაზიანება გამოიწვიოს.' }
        ]
      },
      en: {
        ...sharedEn,
        seo: {
          title: 'HDD Data Recovery in Tbilisi | DataLab Georgia',
          description: 'HDD data recovery in Tbilisi for logical, mechanical and electronic damage, including read/write head replacement, PCB, firmware, SMART and laboratory work.'
        },
        title: 'HDD Data Recovery',
        hero: [
          'DataLab Georgia recovers data from internal and external hard disk drives (HDDs), including cases involving logical, electronic and mechanical damage.',
          'We work with drives that are unreadable, are not detected by a computer, make unusual sounds, show SMART or bad-sector problems, or have damaged file systems, firmware or mechanical components.',
          'When physical damage requires internal work, procedures may be carried out in a specialized clean work environment.'
        ],
        trust: ['Logical damage', 'Electronic damage', 'Mechanical damage', 'Sector-by-sector imaging'],
        overviewSections: [{
          title: 'Main types of HDD damage',
          cards: [
            { title: 'Logical damage', text: 'An HDD may remain physically functional while files become inaccessible because of file-system, partition or other data-structure damage.', items: ['Accidentally deleted files', 'Formatting', 'Lost partition', 'RAW partition', 'File-system corruption', 'Inaccessible files', 'Damaged data structures'] },
            { title: 'Electronic damage', items: ['PCB damage', 'Electronic component failure', 'Power problems', 'Voltage damage', 'Burnt components', 'Damaged connector'] },
            { title: 'Mechanical damage', items: ['Clicking sound', 'Read/write head damage', 'Head crash', 'Actuator problem', 'Motor or spindle problem', 'Drive no longer spins', 'HDD is not identified', 'Internal mechanical damage'] }
          ]
        }],
        signs: { title: 'Signs that an HDD may be damaged', items: ['Drive is absent from BIOS/UEFI', 'HDD disappears intermittently', 'Unusual clicking or repetitive sound', 'Drive works very slowly', 'SMART warning', 'Bad sectors', 'System freezes when accessing the HDD', 'Files no longer open', 'Windows requests formatting', 'Unusual vibration or sound'] },
        recoverable: { title: 'What data may be recoverable?', text: 'Depending on the type of damage and the condition of the medium, recovery of different kinds of user data may be attempted. The result is assessed from diagnostics and media condition.', items: ['Photos', 'Videos', 'Documents', 'Work files', 'Archives', 'Projects', 'Other user files'] },
        processTitle: 'How HDD data recovery works',
        process: [
          { title: 'Intake and registration', text: 'We record the device and case details.', items: ['HDD model and serial number', 'Device condition', 'Reported problem', 'How the data was lost', 'Priority files and folders'] },
          { title: 'Initial diagnostics', text: 'We assess the technical condition of the device.', items: ['Device identification', 'SMART data', 'Electronic condition', 'Firmware condition', 'Read stability', 'Signs of mechanical damage'] },
          { title: 'Damage classification', text: 'The problem is classified as logical, firmware, electronic or mechanical.' },
          { title: 'Required technical work', text: 'The exact work depends on the diagnosed fault.', items: ['PCB diagnostics or repair', 'ROM/adaptive data work', 'Firmware/service-area work', 'Selection of a compatible donor HDD', 'Read/write head replacement'] },
          { title: 'Laboratory work in a clean environment', text: 'When internal work is necessary on a mechanically damaged HDD, it is performed in a specialized clean work environment.' },
          { title: 'Safe sector-by-sector image', text: 'When the drive condition permits, priority is given to creating a sector image. Further analysis is performed on the copy whenever possible.' },
          { title: 'Data reconstruction', text: 'The image is used for partition and file-system analysis, logical reconstruction and locating required files.' },
          { title: 'Result verification', text: 'The structure and accessibility of recovered files are checked.' }
        ],
        technical: [
          { title: 'HDD laboratory work', paragraphs: ['Opening a mechanically damaged HDD in an ordinary workspace is not recommended. The magnetic surfaces and read/write assembly are highly sensitive to dust and particles.', 'When required, work involving the HDD internal mechanism is carried out in a specialized clean work environment.'], items: ['Compatible donor HDD selection', 'Read/write head replacement', 'PCB diagnostics', 'Damaged component assessment', 'Temporary device stabilization', 'Controlled attempts to read data safely'] },
          { title: 'Use of PC-3000', paragraphs: ['DataLab Georgia uses the professional PC-3000 system for data-recovery work. Its use depends on the specific fault and supports technical diagnostics and controlled access.'], items: ['Technical HDD diagnostics', 'Firmware analysis', 'Service Area work', 'Controlled reading', 'Damaged-media imaging', 'Management of difficult reads'] }
        ],
        warning: { title: 'What not to do when an HDD is damaged', items: ['Do not open an HDD at home', 'Do not repeatedly power on a clicking drive', 'Do not run CHKDSK if physical damage is suspected', 'Do not format the drive', 'Do not run random recovery software on an unstable HDD', 'Do not use freezer tricks or other questionable online methods'], text: 'If the drive contains important information, incorrect experiments can make the recovery process more difficult.' },
        faqs: [
          { q: 'Can an HDD be recovered if it is no longer readable?', a: 'It is possible in many cases, but the result depends on the type of damage and the physical condition of the drive. An exact assessment follows diagnostics.' },
          { q: 'What does an HDD clicking sound mean?', a: 'Clicking may be related to read/write heads, firmware or another mechanical component. Repeatedly powering on the drive is not recommended.' },
          { q: 'Can data be recovered from a formatted HDD?', a: 'Full or partial recovery is often possible, especially if no new information was written after formatting.' },
          { q: 'Do you replace HDD read/write heads?', a: 'When required, a compatible donor HDD may be used and the read/write heads may be replaced in a specialized clean work environment.' },
          { q: 'Why should I not open an HDD at home?', a: 'The internal surfaces and read/write system are sensitive to dust and particles. Opening the drive in an unsuitable environment can cause additional physical damage.' }
        ]
      }
    }
  },

  'ssd-recovery': {
    slug: 'ssd-recovery',
    iconName: 'Zap',
    image: {
      src: '/images/services/ssd-recovery.png',
      width: 1851,
      height: 850,
      alt: { ka: 'SSD მოწყობილობის მონაცემთა აღდგენის დიაგნოსტიკა', en: 'SSD data recovery diagnostics' }
    },
    related: ['hdd-recovery', 'raid-recovery', 'usb-recovery'],
    content: {
      ka: {
        ...sharedKa,
        seo: { title: 'SSD მონაცემთა აღდგენა საქართველოში | DataLab Georgia', description: 'SSD მონაცემთა აღდგენა საქართველოში — SATA, M.2, NVMe, Controller, Firmware, NAND Flash, TRIM და ლოგიკური/ელექტრონული დაზიანებები.' },
        title: 'SSD მონაცემთა აღდგენა',
        hero: ['DataLab Georgia-ში ვახორციელებთ მონაცემების აღდგენას SATA, M.2 და NVMe SSD მოწყობილობებიდან.', 'SSD-ის მუშაობის პრინციპი მნიშვნელოვნად განსხვავდება HDD-ისგან. ინფორმაცია ინახება NAND Flash მეხსიერებაში, ხოლო მონაცემების მართვას SSD Controller და Firmware ახორციელებს.', 'ვმუშაობთ როგორც ლოგიკურ დაზიანებებზე, ასევე Controller, Firmware, NAND Flash და ელექტრონული პრობლემების შემთხვევებზე.'],
        trust: ['SATA / M.2', 'NVMe / PCIe', 'Controller / Firmware', 'NAND Flash'],
        overviewSections: [
          { title: 'SSD ტიპები', text: 'კონკრეტული აღდგენის მეთოდი დამოკიდებულია SSD-ის მოდელზე, Controller-სა და დაზიანების ტიპზე.', cards: [{ title: 'SATA SSD' }, { title: 'M.2 SATA' }, { title: 'NVMe SSD' }, { title: 'PCIe SSD' }] },
          { title: 'SSD-ის დაზიანების ძირითადი მიზეზები', items: ['Controller Failure', 'Firmware დაზიანება', 'NAND Flash degradation', 'Bad Blocks', 'ელექტრონული დაზიანება', 'Power Surge', 'არასტაბილური ძაბვა', 'File System Corruption', 'შემთხვევითი File Delete', 'Format', 'Flash wear', 'სხვა ფიზიკური დაზიანება'] }
        ],
        signs: { title: 'SSD დაზიანების ნიშნები', items: ['SSD აღარ ჩანს BIOS/UEFI-ში', 'მოწყობილობა ხდება Read Only', 'ფაილები ქრება', 'ხშირი გაჭედვა', 'Boot failure', 'Read/write errors', 'File System Error', 'ძალიან ნელი წაკითხვა', 'SSD არასწორ მოცულობას აჩვენებს', 'SSD პერიოდულად ქრება'] },
        recoverable: { title: 'რა მონაცემების აღდგენა შეიძლება?', text: 'მოწყობილობის მდგომარეობის მიხედვით შესაძლებელია სხვადასხვა მომხმარებლის ფაილის აღდგენის მცდელობა. შედეგზე გავლენას ახდენს Controller, NAND, Firmware, TRIM და შემდგომი გამოყენება.', items: ['ფოტოები და ვიდეოები', 'დოკუმენტები', 'სამუშაო ფაილები', 'არქივები', 'პროექტები', 'მომხმარებლის სხვა ფაილები'] },
        processTitle: 'SSD მონაცემთა აღდგენის პროცესი',
        process: [
          { title: 'რეგისტრაცია', text: 'ვაფიქსირებთ SSD-ის ბრენდს, მოდელს, მოცულობას, SATA/M.2/NVMe ტიპს და პრობლემის ისტორიას.' },
          { title: 'ელექტრონული დიაგნოსტიკა', text: 'ვამოწმებთ PCB-ს, კვების ხაზებს, ელექტრონულ კომპონენტებსა და კომპიუტერთან კომუნიკაციას.' },
          { title: 'Controller / Firmware Analysis', text: 'ვსწავლობთ, დაკავშირებულია თუ არა პრობლემა SSD Controller-თან, Firmware-თან ან შიდა Service Data-სთან.' },
          { title: 'უსაფრთხო წვდომის მცდელობა', text: 'თუ SSD იძლევა შესაძლებლობას, მონაცემების კითხვა ხდება კონტროლირებული მეთოდით და მოწყობილობაზე ზედმეტი დატვირთვის გარეშე.' },
          { title: 'NAND Flash შეფასება', text: 'რთულ შემთხვევებში მოწმდება NAND მეხსიერების მდგომარეობა და SSD-ის კონკრეტული არქიტექტურა.' },
          { title: 'Image / Dump', text: 'როდესაც ტექნიკურად შესაძლებელია, იქმნება უსაფრთხო ასლი შემდგომი მუშაობისთვის.' },
          { title: 'Logical Reconstruction', text: 'ხდება File System-ისა და მონაცემთა სტრუქტურის ანალიზი.' },
          { title: 'File Verification', text: 'მოწმდება აღდგენილი ფაილების მდგომარეობა.' }
        ],
        technical: [
          { title: 'Controller, Firmware და NAND Flash', paragraphs: ['SSD Controller მართავს NAND Flash ჩიპებთან კომუნიკაციას და მონაცემების შიდა განაწილებას. Firmware-ის დაზიანებამ შეიძლება გამოიწვიოს მდგომარეობა, როდესაც SSD აღარ იდენტიფიცირდება, არასწორ მოცულობას აჩვენებს ან მონაცემებთან წვდომა შეუძლებელი ხდება.', 'NAND Flash არის მეხსიერების ფიზიკური ნაწილი. რთულ შემთხვევებში Raw NAND მონაცემების წაკითხვა ჯერ კიდევ არ ნიშნავს მზა ფაილების მიღებას — საჭიროა Controller-ის mapping და translation logic-ის გათვალისწინება.'], items: ['Firmware-level diagnostics', 'Controller diagnostics', 'NAND evaluation', 'Electronic repair', 'Controlled reading', 'მხარდაჭერილ შემთხვევებში chip-level მეთოდები'] },
          { title: 'TRIM და წაშლილი SSD ფაილები', paragraphs: ['SSD-დან წაშლილი ფაილების აღდგენა HDD-ისგან განსხვავდება. TRIM ფუნქცია SSD-ს აცნობებს, რომ კონკრეტული blocks აღარ არის საჭირო.', 'SSD-ის შიდა garbage collection პროცესმა შეიძლება მონაცემების ფიზიკური აღდგენა მნიშვნელოვნად გაართულოს ან ზოგ შემთხვევაში შეუძლებელი გახადოს. თუ ფაილები წაიშალა ან SSD დაფორმატდა, რეკომენდებულია მოწყობილობის გამოყენების დაუყოვნებლივ შეწყვეტა.'] },
          { title: 'PC-3000 SSD', paragraphs: ['DataLab Georgia იყენებს PC-3000 სისტემას მხარდაჭერილი SSD მოწყობილობების ტექნიკური დიაგნოსტიკისა და მონაცემებთან კონტროლირებული მუშაობისთვის. კონკრეტული შესაძლებლობა დამოკიდებულია Controller-ზე, Firmware-ზე, მოდელსა და დაზიანების ტიპზე.'] }
        ],
        warning: { title: 'SSD-ის დაზიანების შემდეგ', items: ['ნუ ჩაწერთ ახალ ფაილებს', 'ნუ დააყენებთ ახალ პროგრამებს იმავე SSD-ზე', 'ნუ გაუშვებთ მრავალ სხვადასხვა Recovery პროგრამას', 'არ გააკეთოთ Format', 'მოწყობილობას ზედმეტად ნუ გამოიყენებთ'], text: 'ახალი მონაცემების ჩაწერამ და SSD-ის შემდგომმა მუშაობამ შეიძლება აღდგენის შესაძლებლობაზე უარყოფითად იმოქმედოს.' },
        faqs: [
          { q: 'შესაძლებელია სრულიად გაუმართავი SSD-დან მონაცემების აღდგენა?', a: 'ზოგიერთ შემთხვევაში შესაძლებელია, თუმცა შედეგი დამოკიდებულია Controller-ის, NAND Flash-ის, Firmware-ის და ელექტრონული კომპონენტების მდგომარეობაზე.' },
          { q: 'შესაძლებელია ფორმატირებული SSD-ის აღდგენა?', a: 'შესაძლებლობა დამოკიდებულია Format-ის ტიპზე, TRIM-ის მუშაობასა და იმაზე, მოხდა თუ არა ახალი მონაცემების ჩაწერა.' },
          { q: 'რას ნიშნავს TRIM?', a: 'TRIM არის მექანიზმი, რომლის საშუალებითაც ოპერაციული სისტემა SSD-ს აცნობებს, რომ გარკვეული blocks აღარ შეიცავს საჭირო მონაცემებს. ეს SSD-ის მუშაობას აუმჯობესებს, მაგრამ წაშლილი მონაცემების აღდგენას ზოგ შემთხვევაში ართულებს.' },
          { q: 'მუშაობთ NVMe SSD მოწყობილობებზე?', a: 'დიახ, ვასრულებთ NVMe SSD-ის დიაგნოსტიკას და კონკრეტული შემთხვევის მიხედვით აღდგენის შესაძლებლობის შეფასებას.' },
          { q: 'Controller-ის დაზიანების დროს შეიძლება მონაცემების აღდგენა?', a: 'ზოგიერთ შემთხვევაში შესაძლებელია, თუმცა აღდგენის მეთოდი დამოკიდებულია კონკრეტულ Controller-ზე და SSD-ის არქიტექტურაზე.' }
        ]
      },
      en: {
        ...sharedEn,
        seo: { title: 'SSD Data Recovery in Tbilisi | DataLab Georgia', description: 'SSD data recovery in Tbilisi for SATA, M.2 and NVMe devices, including controller, firmware, NAND Flash, TRIM, electronic and logical issues.' },
        title: 'SSD Data Recovery',
        hero: ['DataLab Georgia recovers data from SATA, M.2 and NVMe SSD devices.', 'SSD technology differs significantly from HDD technology. Information is stored in NAND Flash memory, while an SSD controller and firmware manage the data.', 'We work with logical damage as well as controller, firmware, NAND Flash and electronic problems.'],
        trust: ['SATA / M.2', 'NVMe / PCIe', 'Controller / Firmware', 'NAND Flash'],
        overviewSections: [
          { title: 'SSD types', text: 'The recovery method depends on the SSD model, controller and type of damage.', cards: [{ title: 'SATA SSD' }, { title: 'M.2 SATA' }, { title: 'NVMe SSD' }, { title: 'PCIe SSD' }] },
          { title: 'Main causes of SSD failure', items: ['Controller failure', 'Firmware corruption', 'NAND Flash degradation', 'Bad blocks', 'Electronic damage', 'Power surge', 'Unstable voltage', 'File-system corruption', 'Accidental file deletion', 'Formatting', 'Flash wear', 'Other physical damage'] }
        ],
        signs: { title: 'Signs of SSD damage', items: ['SSD is absent from BIOS/UEFI', 'Device becomes read-only', 'Files disappear', 'Frequent freezes', 'Boot failure', 'Read/write errors', 'File-system error', 'Very slow reads', 'SSD shows the wrong capacity', 'SSD disappears intermittently'] },
        recoverable: { title: 'What data may be recoverable?', text: 'Recovery of different user files may be attempted depending on device condition. The controller, NAND, firmware, TRIM and later use all affect the result.', items: ['Photos and videos', 'Documents', 'Work files', 'Archives', 'Projects', 'Other user files'] },
        processTitle: 'How SSD data recovery works',
        process: [
          { title: 'Registration', text: 'We record the SSD brand, model, capacity, SATA/M.2/NVMe type and problem history.' },
          { title: 'Electronic diagnostics', text: 'We check the PCB, power rails, electronic components and communication with a computer.' },
          { title: 'Controller / firmware analysis', text: 'We determine whether the issue is connected to the controller, firmware or internal service data.' },
          { title: 'Controlled access attempt', text: 'If the SSD permits access, reading is performed with controlled methods and without unnecessary load.' },
          { title: 'NAND Flash assessment', text: 'In complex cases, the NAND condition and specific SSD architecture are evaluated.' },
          { title: 'Image / dump', text: 'When technically possible, a safe copy is created for further work.' },
          { title: 'Logical reconstruction', text: 'The file system and data structures are analyzed.' },
          { title: 'File verification', text: 'The condition of recovered files is checked.' }
        ],
        technical: [
          { title: 'Controller, firmware and NAND Flash', paragraphs: ['The SSD controller manages communication with NAND Flash chips and internal data distribution. Firmware damage may leave an SSD undetected, showing an incorrect capacity or inaccessible.', 'NAND Flash is the physical storage. In complex cases, reading raw NAND data does not by itself produce ready files; the controller mapping and translation logic must be considered.'], items: ['Firmware-level diagnostics', 'Controller diagnostics', 'NAND evaluation', 'Electronic repair', 'Controlled reading', 'Chip-level methods in supported cases'] },
          { title: 'TRIM and deleted SSD files', paragraphs: ['Recovering deleted files from an SSD differs from an HDD. TRIM tells the SSD that certain blocks are no longer needed.', 'Internal garbage collection may make physical recovery significantly harder or, in some cases, impossible. If files were deleted or the SSD was formatted, stop using it immediately.'] },
          { title: 'PC-3000 SSD', paragraphs: ['DataLab Georgia uses the PC-3000 system for technical diagnostics and controlled work with supported SSD devices. Available methods depend on the controller, firmware, model and type of damage.'] }
        ],
        warning: { title: 'After an SSD failure', items: ['Do not write new files', 'Do not install programs on the same SSD', 'Do not run many different recovery programs', 'Do not format the SSD', 'Avoid unnecessary device use'], text: 'Writing new data and continuing to use the SSD may reduce the possibility of recovery.' },
        faqs: [
          { q: 'Can data be recovered from a completely failed SSD?', a: 'It may be possible in some cases, depending on the condition of the controller, NAND Flash, firmware and electronic components.' },
          { q: 'Can a formatted SSD be recovered?', a: 'The possibility depends on the type of format, TRIM activity and whether new data was written.' },
          { q: 'What is TRIM?', a: 'TRIM allows the operating system to tell an SSD that certain blocks no longer contain needed data. It improves SSD operation but may make deleted-data recovery harder.' },
          { q: 'Do you work with NVMe SSD devices?', a: 'Yes. We diagnose NVMe SSDs and assess recovery possibilities for each case.' },
          { q: 'Can data be recovered when the controller is damaged?', a: 'It may be possible in some cases, but the method depends on the specific controller and SSD architecture.' }
        ]
      }
    }
  },

  'raid-recovery': {
    slug: 'raid-recovery',
    iconName: 'Layers3',
    image: {
      src: '/images/services/raid-recovery.png',
      width: 1693,
      height: 929,
      alt: { ka: 'RAID და NAS მასივის მონაცემთა აღდგენის დიაგნოსტიკა', en: 'RAID and NAS data recovery diagnostics' }
    },
    related: ['hdd-recovery', 'ssd-recovery', 'usb-recovery'],
    content: {
      ka: {
        ...sharedKa,
        seo: { title: 'RAID და NAS მონაცემთა აღდგენა საქართველოში | DataLab Georgia', description: 'RAID და NAS მონაცემთა აღდგენა საქართველოში — RAID 0, 1, 5, 6, 10, degraded arrays, failed disks და RAID reconstruction.' },
        title: 'RAID / NAS მონაცემთა აღდგენა',
        hero: ['DataLab Georgia-ში ვახორციელებთ მონაცემების აღდგენას დაზიანებული RAID მასივებიდან და NAS სისტემებიდან.', 'RAID Recovery ერთ-ერთი ყველაზე კომპლექსური მონაცემთა აღდგენის მიმართულებაა, რადგან ინფორმაცია ერთზე მეტ დისკზე კონკრეტული კონფიგურაციის მიხედვით არის განაწილებული.', 'არასწორმა Rebuild-მა, Disk Order-ის შეცვლამ ან Initialization-მა შეიძლება აღდგენის პროცესი მნიშვნელოვნად გაართულოს.'],
        trust: ['RAID 0 / RAID 1', 'RAID 5 / RAID 6', 'RAID 10 / JBOD', 'NAS Systems'],
        overviewSections: [
          { title: 'RAID და NAS სისტემები', text: 'აღდგენის შესაძლებლობა დამოკიდებულია კონკრეტულ RAID კონფიგურაციაზე, დაზიანებული დისკების რაოდენობასა და თითოეული წევრი დისკის მდგომარეობაზე.', cards: [{ title: 'RAID 0' }, { title: 'RAID 1' }, { title: 'RAID 5' }, { title: 'RAID 6' }, { title: 'RAID 10' }, { title: 'JBOD' }, { title: 'NAS Systems' }] },
          { title: 'RAID Data Loss-ის მიზეზები', items: ['ერთი დისკის დაზიანება', 'რამდენიმე დისკის დაზიანება', 'Degraded RAID', 'Failed Rebuild', 'Interrupted Rebuild', 'Controller Failure', 'Configuration Loss', 'Metadata Corruption', 'File System Corruption', 'Accidental Initialization', 'Accidental Formatting', 'Disk Order-ის შეცვლა', 'Power Failure', 'NAS Hardware Failure'] }
        ],
        signs: { title: 'RAID/NAS დაზიანების ნიშნები', items: ['Degraded Array', 'RAID Offline', 'NAS აღარ იხსნება', 'ერთი ან რამდენიმე Drive Missing', 'განმეორებითი დისკის შეცდომები', 'Parity errors', 'Rebuild ვერ სრულდება', 'სისტემა ძალიან ნელა მუშაობს', 'ფაილები აღარ არის ხელმისაწვდომი', 'HDD პერიოდულად ქრება', 'რომელიმე დისკი უჩვეულო ხმას გამოსცემს'] },
        recoverable: { title: 'რა მონაცემების აღდგენა შეიძლება?', text: 'კონფიგურაციისა და წევრი დისკების მდგომარეობის მიხედვით შესაძლებელია RAID/NAS სისტემაზე შენახული სხვადასხვა მომხმარებლისა და ორგანიზაციის მონაცემის აღდგენის მცდელობა.', items: ['დოკუმენტები', 'ფოტოები და ვიდეოები', 'სამუშაო პროექტები', 'არქივები', 'ბაზის ფაილები', 'გაზიარებული საქაღალდეები', 'სხვა მომხმარებლის ფაილები'] },
        processTitle: 'RAID / NAS მონაცემთა აღდგენის პროცესი',
        process: [
          { title: 'სისტემისა და დისკების რეგისტრაცია', text: 'ვაფიქსირებთ RAID/NAS მოდელს, წევრ დისკებს, თავდაპირველ Disk Order-ს, ცნობილ RAID level-ს, წარუმატებელი მოვლენების ისტორიასა და პრიორიტეტულ მონაცემებს.' },
          { title: 'თითოეული დისკის დიაგნოსტიკა', text: 'თითოეული წევრი დისკი ცალ-ცალკე მოწმდება იდენტიფიკაციაზე, SMART-ზე, ზედაპირის მდგომარეობაზე, სტაბილურობასა და ფიზიკური დაზიანების ნიშნებზე.' },
          { title: 'უსაფრთხო imaging', text: 'როდესაც შესაძლებელია, თითოეული წევრი დისკიდან იქმნება სექტორული ასლი და შემდგომი მუშაობა ასლებზე გრძელდება.' },
          { title: 'RAID პარამეტრების ანალიზი', text: 'განისაზღვრება RAID level, Disk Order, stripe/block size, parity rotation, offsets და სხვა საჭირო პარამეტრები.' },
          { title: 'ვირტუალური რეკონსტრუქცია', text: 'მასივი აღდგება პროგრამულად, ორიგინალ დისკებზე ჩაწერის გარეშე.' },
          { title: 'File System Analysis', text: 'რეკონსტრუირებულ მასივზე მოწმდება partition-ები, file system და საქაღალდეების სტრუქტურა.' },
          { title: 'მონაცემების ამოღება', text: 'ხელმისაწვდომი მონაცემები გადაიტანება უსაფრთხო მედიაზე, პრიორიტეტული საქაღალდეების გათვალისწინებით.' },
          { title: 'შედეგის შემოწმება', text: 'მოწმდება ფაილების სტრუქტურა, ხელმისაწვდომობა და შერჩეული მონაცემების გახსნა.' }
        ],
        technical: [
          { title: 'რატომ არის Disk Order მნიშვნელოვანი?', paragraphs: ['RAID-ში დისკების ფიზიკური თანმიმდევრობა ხშირად რეკონსტრუქციის ერთ-ერთი მთავარი პარამეტრია. დისკების გადაადგილებამ, ხელახლა ჩასმამ ან არასწორმა მონიშვნამ შეიძლება სწორი კონფიგურაციის დადგენა გაართულოს.', 'თუ შესაძლებელია, დისკების მოხსნამდე მონიშნეთ მათი თავდაპირველი პოზიციები და არ შეცვალოთ რიგითობა.'] },
          { title: 'რა ინფორმაცია დაგვეხმარება დიაგნოსტიკაში?', paragraphs: ['საწყისი ინფორმაციის შენარჩუნება დიაგნოსტიკას უფრო ზუსტს ხდის.'], items: ['RAID/NAS მოდელი', 'RAID level, თუ ცნობილია', 'დისკების თავდაპირველი რიგითობა', 'რომელი დისკი დაზიანდა პირველად', 'Rebuild ან Initialization ჩატარდა თუ არა', 'სისტემის ბოლო შეტყობინებები', 'პრიორიტეტული საქაღალდეები'] }
        ],
        warning: { title: 'RAID-ზე რა არ უნდა გააკეთოთ', items: ['არ გაუშვათ Rebuild დიაგნოსტიკის გარეშე', 'არ შეცვალოთ Disk Order', 'არ გააკეთოთ Initialization', 'არ გააკეთოთ Format', 'არ გაუშვათ CHKDSK ან fsck ორიგინალ მასივზე', 'ნუ ჩართავთ მრავალჯერ ფიზიკურად დაზიანებულ დისკებს'], text: 'RAID/NAS სისტემაზე ერთმა არასწორმა მოქმედებამ შეიძლება რამდენიმე დისკზე განაწილებული მონაცემების სტრუქტურა შეცვალოს. მნიშვნელოვანი მონაცემების შემთხვევაში შეაჩერეთ ექსპერიმენტები და შეინარჩუნეთ დისკების თავდაპირველი მდგომარეობა.' },
        faqs: [
          { q: 'შესაძლებელია RAID-ის აღდგენა, თუ ერთზე მეტი დისკია დაზიანებული?', a: 'ზოგიერთ შემთხვევაში შესაძლებელია, თუმცა შედეგი დამოკიდებულია RAID level-ზე, დაზიანებული დისკების რაოდენობაზე და თითოეული დისკის მდგომარეობაზე.' },
          { q: 'რა უნდა გავაკეთო, თუ NAS აჩვენებს Degraded სტატუსს?', a: 'არ დაიწყოთ ავტომატურად Rebuild, განსაკუთრებით თუ მონაცემები მნიშვნელოვანია ან რომელიმე დისკს ფიზიკური დაზიანების ნიშნები აქვს. ჯერ შეინარჩუნეთ კონფიგურაცია და შეაფასეთ წევრი დისკები.' },
          { q: 'რატომ არის Disk Order მნიშვნელოვანი?', a: 'RAID-ის მონაცემები დისკებზე განსაზღვრული თანმიმდევრობით ნაწილდება. სწორი რიგითობა ხშირად საჭიროა მასივის ზუსტი ვირტუალური რეკონსტრუქციისთვის.' },
          { q: 'შეიძლება RAID Rebuild-მა მონაცემები დააზიანოს?', a: 'არასწორ პირობებში Rebuild-მა შეიძლება შეცვალოს ან გადაწეროს მონაცემთა სტრუქტურის ნაწილი, ამიტომ დიაგნოსტიკის გარეშე მისი დაწყება რეკომენდებული არ არის.' },
          { q: 'მუშაობთ NAS სისტემებზე?', a: 'დიახ, ვასრულებთ NAS მოწყობილობებისა და მათი წევრი დისკების დიაგნოსტიკას და კონკრეტული კონფიგურაციის მიხედვით აღდგენის შესაძლებლობის შეფასებას.' }
        ]
      },
      en: {
        ...sharedEn,
        seo: { title: 'RAID and NAS Data Recovery in Tbilisi | DataLab Georgia', description: 'RAID and NAS data recovery in Tbilisi for RAID 0, RAID 1, RAID 5, RAID 6, RAID 10, degraded arrays, failed disks and RAID reconstruction.' },
        title: 'RAID / NAS Data Recovery',
        hero: ['DataLab Georgia recovers data from damaged RAID arrays and NAS systems.', 'RAID recovery is a complex area because information is distributed across multiple drives according to a specific configuration.', 'An incorrect rebuild, changed disk order or initialization may make recovery significantly more difficult.'],
        trust: ['RAID 0 / RAID 1', 'RAID 5 / RAID 6', 'RAID 10 / JBOD', 'NAS systems'],
        overviewSections: [
          { title: 'RAID and NAS systems', text: 'Recovery depends on the RAID configuration, the number of failed drives and the condition of each member drive.', cards: [{ title: 'RAID 0' }, { title: 'RAID 1' }, { title: 'RAID 5' }, { title: 'RAID 6' }, { title: 'RAID 10' }, { title: 'JBOD' }, { title: 'NAS systems' }] },
          { title: 'Causes of RAID data loss', items: ['One failed drive', 'Multiple failed drives', 'Degraded RAID', 'Failed rebuild', 'Interrupted rebuild', 'Controller failure', 'Configuration loss', 'Metadata corruption', 'File-system corruption', 'Accidental initialization', 'Accidental formatting', 'Changed disk order', 'Power failure', 'NAS hardware failure'] }
        ],
        signs: { title: 'Signs of RAID/NAS failure', items: ['Degraded array', 'RAID offline', 'NAS is inaccessible', 'One or more drives missing', 'Repeated disk errors', 'Parity errors', 'Rebuild does not complete', 'System is extremely slow', 'Files are inaccessible', 'An HDD disappears intermittently', 'A drive makes an unusual sound'] },
        recoverable: { title: 'What data may be recoverable?', text: 'Depending on the configuration and member-drive condition, recovery of different personal and organizational data stored on a RAID/NAS system may be attempted.', items: ['Documents', 'Photos and videos', 'Work projects', 'Archives', 'Database files', 'Shared folders', 'Other user files'] },
        processTitle: 'How RAID/NAS data recovery works',
        process: [
          { title: 'System and drive registration', text: 'We record the RAID/NAS model, member drives, original disk order, known RAID level, event history and priority data.' },
          { title: 'Individual drive diagnostics', text: 'Each member is checked separately for identification, SMART information, surface condition, stability and signs of physical damage.' },
          { title: 'Safe imaging', text: 'When possible, a sector image is created from each member drive and further work continues on the copies.' },
          { title: 'RAID parameter analysis', text: 'We determine the RAID level, disk order, stripe/block size, parity rotation, offsets and other required parameters.' },
          { title: 'Virtual reconstruction', text: 'The array is reconstructed in software without writing to the original drives.' },
          { title: 'File-system analysis', text: 'Partitions, file system and folder structure are examined on the reconstructed array.' },
          { title: 'Data extraction', text: 'Accessible data is copied to safe media, with priority folders considered first.' },
          { title: 'Result verification', text: 'File structure, accessibility and selected files are checked.' }
        ],
        technical: [
          { title: 'Why is disk order important?', paragraphs: ['The physical order of drives is often a key RAID reconstruction parameter. Moving, reinserting or incorrectly labelling drives can make it harder to determine the correct configuration.', 'If possible, mark the original positions before removing drives and do not change their order.'] },
          { title: 'What information helps diagnostics?', paragraphs: ['Preserving the initial information makes diagnosis more accurate.'], items: ['RAID/NAS model', 'RAID level, if known', 'Original disk order', 'Which drive failed first', 'Whether rebuild or initialization was run', 'Latest system messages', 'Priority folders'] }
        ],
        warning: { title: 'What not to do with a failed RAID', items: ['Do not run a rebuild without diagnostics', 'Do not change disk order', 'Do not initialize the array', 'Do not format it', 'Do not run CHKDSK or fsck on the original array', 'Do not repeatedly power on physically damaged drives'], text: 'One incorrect action may change data structures distributed across several drives. For important data, stop experimenting and preserve the original state and order of the drives.' },
        faqs: [
          { q: 'Can a RAID be recovered if more than one drive has failed?', a: 'It may be possible in some cases, depending on the RAID level, the number of failed drives and the condition of each drive.' },
          { q: 'What should I do if a NAS reports a degraded status?', a: 'Do not start a rebuild automatically, especially when the data is important or a drive shows physical damage. Preserve the configuration and assess the member drives first.' },
          { q: 'Why is disk order important?', a: 'RAID data is distributed across drives in a defined sequence. Correct order is often required for accurate virtual reconstruction.' },
          { q: 'Can a RAID rebuild damage data?', a: 'Under incorrect conditions, a rebuild may change or overwrite parts of the data structure, so starting it without diagnostics is not recommended.' },
          { q: 'Do you work with NAS systems?', a: 'Yes. We diagnose NAS devices and member drives and assess recovery possibilities for the specific configuration.' }
        ]
      }
    }
  },

  'usb-recovery': {
    slug: 'usb-recovery',
    iconName: 'Usb',
    image: {
      src: '/images/services/usb-recovery.png',
      width: 1536,
      height: 1024,
      alt: { ka: 'USB Flash, SD და microSD მონაცემთა აღდგენა', en: 'USB Flash, SD and microSD data recovery' }
    },
    related: ['hdd-recovery', 'ssd-recovery', 'raid-recovery'],
    content: {
      ka: {
        ...sharedKa,
        seo: { title: 'USB, SD და microSD მონაცემთა აღდგენა | DataLab Georgia', description: 'USB Flash, SD და microSD მონაცემთა აღდგენა — წაშლილი ფოტოები, Format, Controller, NAND Flash, PCB და სხვა დაზიანებები.' },
        title: 'USB Flash / SD / microSD მონაცემთა აღდგენა',
        hero: ['DataLab Georgia-ში ვახორციელებთ მონაცემების აღდგენას USB Flash, SD და microSD მეხსიერების მოწყობილობებიდან.', 'ვმუშაობთ შემთხვევებზე, როდესაც ფაილები წაიშალა, მოწყობილობა დაფორმატდა, კომპიუტერი ან კამერა მედიას ვერ ხედავს, დაზიანებულია Connector, PCB, Controller ან NAND Flash მეხსიერება.'],
        trust: ['USB Flash', 'SD / microSD', 'PCB / Controller', 'NAND Flash'],
        overviewSections: [
          { title: 'USB Flash მონაცემთა აღდგენა', text: 'USB Flash მოწყობილობებზე მონაცემების დაკარგვა შეიძლება იყოს როგორც ლოგიკური, ისე ელექტრონული ან ფიზიკური დაზიანების შედეგი.', items: ['შემთხვევით წაშლილი ფაილები', 'Accidental Format', 'Device Not Recognized', 'Format Request', 'Connector დაზიანება', 'PCB დაზიანება', 'Controller Failure', 'NAND Flash დაზიანება', 'Wrong Capacity', 'ნაწილობრივ იკითხება'] },
          { title: 'SD და microSD მონაცემთა აღდგენა', text: 'SD და microSD ბარათებზე აღდგენის მეთოდი დამოკიდებულია მეხსიერების მდგომარეობაზე, დაზიანების ტიპსა და მოწყობილობის არქიტექტურაზე.', items: ['ფოტოები წაიშალა', 'ვიდეოები წაიშალა', 'Accidental Format', 'File System Corruption', 'Controller Failure', 'Flash Memory Failure', 'ფიზიკური დაზიანება', 'ელექტრონული დაზიანება', 'ნაწილობრივ იკითხება'] },
          { title: 'რომელი მოწყობილობებიდან შეიძლება SD/microSD მონაცემების აღდგენა?', cards: [{ title: 'Digital Camera' }, { title: 'Professional Camera' }, { title: 'Drone' }, { title: 'Action Camera' }, { title: 'Dash Cam' }, { title: 'Security Camera' }, { title: 'Camcorder' }, { title: 'Laptop / Computer' }, { title: 'სხვა SD/microSD მოწყობილობა' }] }
        ],
        signs: { title: 'USB / SD დაზიანების ნიშნები', items: ['Device Not Recognized', 'Format Request', 'Missing Files', 'Corrupted Files', 'Slow Access', 'Intermittent Access', 'Wrong Capacity', 'Overheating', 'Loose USB Connector', 'Camera Cannot Read Card'] },
        recoverable: { title: 'ფოტოებისა და ვიდეოების აღდგენა', text: 'SD და microSD ბარათები ხშირად გამოიყენება ფოტოებისა და ვიდეოების შესანახად კამერებში, დრონებში, Action Camera-ებში და სხვა მოწყობილობებში. დაზიანების ტიპისა და მეხსიერების მდგომარეობის მიხედვით შესაძლებელია სხვადასხვა მომხმარებლის ფაილის აღდგენის მცდელობა. თუ ფაილები წაიშალა ან ბარათი დაფორმატდა, შეწყვიტეთ გამოყენება — ახალმა ჩაწერამ შეიძლება ძველი მონაცემების ნაწილი გადაწეროს.', items: ['ფოტოები', 'ვიდეოები', 'RAW Camera Files', 'დოკუმენტები', 'სხვა მომხმარებლის ფაილები'] },
        processTitle: 'USB / SD / microSD მონაცემთა აღდგენის პროცესი',
        process: [
          { title: 'მოწყობილობის რეგისტრაცია', text: 'ვაფიქსირებთ ტიპს, ბრენდს, მოცულობას, პრობლემის ისტორიასა და პრიორიტეტულ მონაცემებს.' },
          { title: 'პირველადი დიაგნოსტიკა', text: 'ვამოწმებთ logical damage-ს, Connector-ს, PCB-ს, Controller-ს, კომუნიკაციასა და Flash/NAND მდგომარეობის ნიშნებს.' },
          { title: 'წვდომის მეთოდის განსაზღვრა', text: 'თუ მოწყობილობა იკითხება, ვცდილობთ მონაცემებთან უსაფრთხო წვდომას. თუ აღარ იდენტიფიცირდება, საჭიროა ელექტრონული ან Flash დონის დამატებითი შეფასება.' },
          { title: 'PCB / Controller Analysis', text: 'საჭიროების შემთხვევაში მოწმდება მოწყობილობის ელექტრონული ნაწილი და Controller.' },
          { title: 'NAND / Flash Evaluation', text: 'რთულ შემთხვევებში მოწმდება Flash მეხსიერების მდგომარეობა და მოწყობილობის არქიტექტურა.' },
          { title: 'Raw Read / Dump', text: 'მხარდაჭერილ შემთხვევებში შეიძლება საჭირო გახდეს Raw მონაცემების წაკითხვა.' },
          { title: 'Data Reconstruction', text: 'Flash მოწყობილობებში Raw data ყოველთვის პირდაპირ მზა ფაილები არ არის. საჭიროების შემთხვევაში რეკონსტრუქცია ითვალისწინებს Controller-ის მონაცემთა განაწილების ლოგიკას.' },
          { title: 'File Verification', text: 'მოწმდება აღდგენილი ფოტოები, ვიდეოები, დოკუმენტები და სხვა ფაილები.' }
        ],
        technical: [
          { title: 'PCB, Controller და NAND Flash', paragraphs: ['USB Flash, SD და microSD მოწყობილობების პრობლემა ყოველთვის მხოლოდ File System-თან არ არის დაკავშირებული. ზოგიერთ შემთხვევაში დაზიანებული შეიძლება იყოს Connector, PCB, Controller ან NAND Flash მეხსიერება.', 'ასეთ დროს ჩვეულებრივმა პროგრამულმა Recovery მეთოდმა შეიძლება მოწყობილობა საერთოდ ვერ დაინახოს. კონკრეტულ მხარდაჭერილ შემთხვევებში შესაძლებელია უფრო ღრმა ტექნიკური ან chip-level სამუშაოების გამოყენება. თითოეული შემთხვევა ინდივიდუალურად ფასდება.'] }
        ],
        warning: { title: 'USB/SD მონაცემების დაკარგვის შემდეგ', items: ['არ გააკეთოთ Format', 'ნუ გადაიღებთ ახალ ფოტოებს იმავე SD ბარათზე', 'ნუ ჩაწერთ ახალ ფაილებს USB-ზე', 'დაზიანებულ Connector-ს ნუ შეაკეთებთ შემთხვევითი soldering-ით', 'არ გაუშვათ ბევრი სხვადასხვა Recovery პროგრამა არასტაბილურ მედიაზე'], text: 'მონაცემების დაკარგვის შემდეგ მოწყობილობის გამოყენების შეწყვეტა ხშირად მნიშვნელოვანია, რადგან ახალმა ჩაწერამ ან დამატებითმა დაზიანებამ შესაძლოა აღდგენის შესაძლებლობაზე იმოქმედოს.' },
        faqs: [
          { q: 'შესაძლებელია SD ბარათიდან წაშლილი ფოტოების აღდგენა?', a: 'ხშირ შემთხვევაში შესაძლებელია, თუ წაშლის შემდეგ ბარათზე ახალი ინფორმაცია არ ჩაწერილა. საბოლოო შედეგი დამოკიდებულია მეხსიერების მდგომარეობასა და გამოყენების ისტორიაზე.' },
          { q: 'შესაძლებელია ფორმატირებული SD ბარათის აღდგენა?', a: 'ზოგიერთ შემთხვევაში შესაძლებელია სრულად ან ნაწილობრივ. შედეგი დამოკიდებულია Format-ის ტიპსა და იმაზე, ჩაიწერა თუ არა ბარათზე ახალი ინფორმაცია.' },
          { q: 'შესაძლებელია USB Flash-ის აღდგენა, თუ კომპიუტერი საერთოდ ვერ ხედავს?', a: 'ზოგიერთ შემთხვევაში შესაძლებელია, რადგან პრობლემა შეიძლება დაკავშირებული იყოს Connector-თან, PCB-სთან, Controller-თან ან NAND Flash მეხსიერებასთან.' },
          { q: 'მუშაობთ microSD ბარათებზე?', a: 'დიახ, ვასრულებთ microSD ბარათების დიაგნოსტიკას და კონკრეტული დაზიანების მიხედვით აღდგენის შესაძლებლობის შეფასებას.' },
          { q: 'დაზიანებული USB Connector-ის შემთხვევაში შეიძლება მონაცემების აღდგენა?', a: 'თუ Flash მეხსიერება და სხვა საჭირო კომპონენტები კრიტიკულად არ არის დაზიანებული, ზოგ შემთხვევაში შესაძლებელია მოწყობილობასთან ტექნიკური წვდომის აღდგენა და მონაცემების წაკითხვის მცდელობა.' },
          { q: 'რა გავაკეთო, თუ კამერა SD Card-ის Format-ს მთხოვს?', a: 'თუ ბარათზე მნიშვნელოვანი ინფორმაციაა, Format არ გააკეთოთ. შეწყვიტეთ ბარათის გამოყენება და ჯერ შეაფასეთ მონაცემების აღდგენის შესაძლებლობა.' }
        ]
      },
      en: {
        ...sharedEn,
        seo: { title: 'USB, SD and microSD Data Recovery | DataLab Georgia', description: 'USB Flash, SD and microSD data recovery in Tbilisi for deleted photos, formatting, controller, NAND Flash, PCB and physical damage.' },
        title: 'USB Flash / SD / microSD Data Recovery',
        hero: ['DataLab Georgia recovers data from USB Flash, SD and microSD memory devices.', 'We work with deleted files, formatted media, devices that are not detected by a computer or camera, and damaged connectors, PCBs, controllers or NAND Flash memory.'],
        trust: ['USB Flash', 'SD / microSD', 'PCB / Controller', 'NAND Flash'],
        overviewSections: [
          { title: 'USB Flash data recovery', text: 'Data loss on USB Flash devices can result from logical, electronic or physical damage.', items: ['Accidentally deleted files', 'Accidental format', 'Device not recognized', 'Format request', 'Connector damage', 'PCB damage', 'Controller failure', 'NAND Flash damage', 'Wrong capacity', 'Partially readable device'] },
          { title: 'SD and microSD data recovery', text: 'The recovery method depends on the condition of the memory, type of damage and device architecture.', items: ['Deleted photos', 'Deleted videos', 'Accidental format', 'File-system corruption', 'Controller failure', 'Flash memory failure', 'Physical damage', 'Electronic damage', 'Partially readable card'] },
          { title: 'Devices that use SD/microSD storage', cards: [{ title: 'Digital camera' }, { title: 'Professional camera' }, { title: 'Drone' }, { title: 'Action camera' }, { title: 'Dash cam' }, { title: 'Security camera' }, { title: 'Camcorder' }, { title: 'Laptop / computer' }, { title: 'Other SD/microSD device' }] }
        ],
        signs: { title: 'Signs of USB / SD damage', items: ['Device not recognized', 'Format request', 'Missing files', 'Corrupted files', 'Slow access', 'Intermittent access', 'Wrong capacity', 'Overheating', 'Loose USB connector', 'Camera cannot read card'] },
        recoverable: { title: 'Photo and video recovery', text: 'SD and microSD cards often store photos and videos in cameras, drones, action cameras and other devices. Depending on damage and memory condition, recovery of different user files may be attempted. If files were deleted or the card was formatted, stop using it because new writes may overwrite old data.', items: ['Photos', 'Videos', 'RAW camera files', 'Documents', 'Other user files'] },
        processTitle: 'How USB / SD / microSD recovery works',
        process: [
          { title: 'Device registration', text: 'We record the type, brand, capacity, problem history and priority data.' },
          { title: 'Initial diagnostics', text: 'We check for logical damage and examine the connector, PCB, controller, communication and signs of Flash/NAND damage.' },
          { title: 'Access-method selection', text: 'If the device is readable, we attempt safe access. If it is not identified, further electronic or Flash-level assessment is required.' },
          { title: 'PCB / controller analysis', text: 'The electronic section and controller are examined when necessary.' },
          { title: 'NAND / Flash evaluation', text: 'In complex cases, the Flash memory condition and device architecture are assessed.' },
          { title: 'Raw read / dump', text: 'Reading raw data may be required in supported cases.' },
          { title: 'Data reconstruction', text: 'Raw data from Flash devices is not always immediately usable. Reconstruction may need to account for the controller data-distribution logic.' },
          { title: 'File verification', text: 'Recovered photos, videos, documents and other files are checked.' }
        ],
        technical: [{ title: 'PCB, controller and NAND Flash', paragraphs: ['USB Flash, SD and microSD problems are not always limited to the file system. A connector, PCB, controller or NAND Flash memory may be damaged.', 'Standard recovery software may not detect such a device. Deeper technical or chip-level work may be used in supported cases. Every case is assessed individually.'] }],
        warning: { title: 'After USB/SD data loss', items: ['Do not format the device', 'Do not take new photos on the same SD card', 'Do not write new files to the USB drive', 'Do not attempt random soldering on a damaged connector', 'Do not run many recovery programs on unstable media'], text: 'Stopping use after data loss is often important because new writes or additional damage may affect recovery possibilities.' },
        faqs: [
          { q: 'Can deleted photos be recovered from an SD card?', a: 'Often they can, provided no new information was written after deletion. The final result depends on memory condition and later use.' },
          { q: 'Can a formatted SD card be recovered?', a: 'Full or partial recovery may be possible. The result depends on the type of format and whether new data was written.' },
          { q: 'Can a USB Flash drive be recovered if the computer cannot see it?', a: 'It may be possible in some cases because the issue can involve the connector, PCB, controller or NAND Flash memory.' },
          { q: 'Do you work with microSD cards?', a: 'Yes. We diagnose microSD cards and assess recovery possibilities according to the specific damage.' },
          { q: 'Can data be recovered when a USB connector is damaged?', a: 'If the Flash memory and other necessary components are not critically damaged, technical access and a controlled read may be possible.' },
          { q: 'What should I do if a camera asks to format the SD card?', a: 'If the card contains important data, do not format it. Stop using the card and have the recovery possibility assessed first.' }
        ]
      }
    }
  }
};
