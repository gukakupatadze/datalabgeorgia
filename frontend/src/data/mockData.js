export const translations = {
  ka: {
    // Header
    home: "მთავარი",
    services: "სერვისები",
    about: "ჩვენ შესახებ",
    contact: "კონტაქტი",
    caseTracking: "საქმის თვალთვალი",

    // Hero Section
    heroTitle: "მონაცემთა აღდგენის პროფესიონალები",
    heroSubtitle: "DataLab Georgia - საქართველოს წამყვანი მონაცემთა აღდგენის სერვისი. ჩვენ ვაღვადგენთ თქვენს მნიშვნელოვან ინფორმაციას ნებისმიერი მოწყობილობიდან.",
    getStarted: "დაიწყეთ ახლავე",
    freeConsultation: "უფასო კონსულტაცია",

    // Services
    servicesTitle: "ჩვენი სერვისები",
    servicesSubtitle: "თანამედროვე ტექნოლოგიებითა და გამოცდილი სპეციალისტებით ვაღვადგენთ მონაცემებს",

    dataRecovery: "HDD აღდგენა",
    dataRecoveryDesc: "დაზიანებული მყარი დისკებიდან ფაილების აღდგენა",

    dataBackup: "SSD აღდგენა",
    dataBackupDesc: "დაზიანებული SSD დისკებიდან ფაილების აღდგენა",

    hardwareRepair: "USB აღდგენა",
    hardwareRepairDesc: "USB ,SD, microSD ბარათებიდან მონაცემთა აღდგენა",

    forensicRecovery: "RAID აღდგენა",
    forensicRecoveryDesc: "RAID მასივებიდან მონაცემთა აღდგენა და კონფიგურაციები",

    // Service Request
    serviceRequestTitle: "სერვისის მოთხოვნა",
    serviceRequestSubtitle: "მოგვწერეთ თქვენი პრობლემის შესახებ და მიიღეთ პროფესიონალური რჩევა",

    // Price Estimation
    priceEstimationTitle: "ფასის გაანგარიშება",
    priceEstimationSubtitle: "მიიღეთ წინასწარი ფასის შეფასება",

    // Case Tracking
    caseTrackingTitle: "საქმის თვალთვალი",
    caseTrackingSubtitle: "შეამოწმეთ თქვენი საქმის სტატუსი",

    // Testimonials
    testimonialsTitle: "მომხმარებელთა გამოხმაურება",
    testimonialsSubtitle: "რას ამბობენ ჩვენი კმაყოფილი კლიენტები",

    // Contact
    contactTitle: "დაგვიკავშირდით",
    contactSubtitle: "მზად ვართ გაგეხმაროთ 24/7",

    // Footer
    footerDesc: "DataLab Georgia - საქართველოს საიმედო მონაცემთა აღდგენის სერვისი",
    quickLinks: "სწრაფი ლინკები",
    contactInfo: "საკონტაქტო ინფორმაცია",
    allRightsReserved: "ყველა უფლება დაცულია"
  },

  en: {
    // Header
    home: "Home",
    services: "Services",
    about: "About",
    contact: "Contact",
    caseTracking: "Case Tracking",

    // Hero Section
    heroTitle: "Data Recovery Professionals",
    heroSubtitle: "DataLab Georgia - Georgia's leading data recovery service. We restore your important information from any device.",
    getStarted: "Get Started",
    freeConsultation: "Free Consultation",

    // Services
    servicesTitle: "Our Services",
    servicesSubtitle: "We recover data using modern technologies and experienced specialists",

    dataRecovery: "HDD Recovery",
    dataRecoveryDesc: "File recovery from damaged hard drives",

    dataBackup: "SSD Recovery",
    dataBackupDesc: "File recovery from damaged SSD drives",

    hardwareRepair: "USB Recovery",
    hardwareRepairDesc: "Data recovery from USB, SD, microSD cards",

    forensicRecovery: "RAID Recovery",
    forensicRecoveryDesc: "Data recovery from RAID arrays and configurations",

    // Service Request
    serviceRequestTitle: "Service Request",
    serviceRequestSubtitle: "Tell us about your problem and get professional advice",

    // Price Estimation
    priceEstimationTitle: "Price Estimation",
    priceEstimationSubtitle: "Get a preliminary price assessment",

    // Case Tracking
    caseTrackingTitle: "Case Tracking",
    caseTrackingSubtitle: "Check the status of your case",

    // Testimonials
    testimonialsTitle: "Customer Testimonials",
    testimonialsSubtitle: "What our satisfied clients say",

    // Contact
    contactTitle: "Contact Us",
    contactSubtitle: "We're ready to help you 24/7",

    // Footer
    footerDesc: "DataLab Georgia - Georgia's reliable data recovery service",
    quickLinks: "Quick Links",
    contactInfo: "Contact Information",
    allRightsReserved: "All rights reserved"
  }
};

// Mock data for services
export const services = [
  {
    id: 1,
    icon: "HardDrive",
    titleKey: "dataRecovery",
    descKey: "dataRecoveryDesc",
    features: ["მექანიკური დაზიანება", "ლოგიკური შეცდომა", "ფაილების წაშლა", "დისკი არ იკითხება"],
    features_en: ["Mechanical damage", "Logical errors", "File deletion", "Drive not readable"],
    price: "150₾ დან"
  },
  {
    id: 2,
    icon: "Zap",
    titleKey: "dataBackup",
    descKey: "dataBackupDesc",
    features: ["კონტროლერის დაზიანება", "Flash მეხსიერების ცვეთა", "Firmware კორუფცია", "NAND ჩიპები"],
    features_en: ["Controller damage", "Flash memory wear", "Firmware corruption", "NAND chips"],
    price: "300₾ დან"
  },
  {
    id: 3,
    icon: "Usb",
    titleKey: "hardwareRepair",
    descKey: "hardwareRepairDesc",
    features: ["ფიზიკური დაზიანება", "კონტროლერის პრობლემები", "ფორმატირების შემდეგ", "NAND ჩიპები"],
    features_en: ["Physical damage", "Controller problems", "After formatting", "NAND chips"],
    price: "150₾ დან"
  },
  {
    id: 4,
    icon: "Layers",
    titleKey: "forensicRecovery",
    descKey: "forensicRecoveryDesc",
    features: ["RAID 0, 1, 5, 6, 10", "კონტროლერის პრობლემები", "Virtual RAID", "NAS სისტემები"],
    features_en: ["RAID 0, 1, 5, 6, 10", "Controller problems", "Virtual RAID", "NAS systems"],
    price: "500₾ დან"
  }
];

// These reviews remain available even before the future admin panel is connected.
// When the API contains active reviews, the API data takes precedence.
export const testimonials = [
  {
    id: 'coded-review-1',
    name: 'ნინო ღაღანიძე',
    name_en: 'Nino Ghaganidze',
    position: 'ბიზნეს ანალიტიკოსი',
    position_en: 'Business Analyst',
    text_ka: 'ლეპტოპის SSD მოულოდნელად გაფუჭდა და მნიშვნელოვანი სამუშაო ფაილები დავკარგე. გუნდმა მონაცემების აღდგენა სწრაფად და პროფესიონალურად შეძლო.',
    text_en: 'My laptop SSD failed unexpectedly and I lost important work files. The team recovered the data quickly and professionally.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop',
    is_active: true
  },
  {
    id: 'coded-review-2',
    name: 'გიორგი კვარაცხელია',
    name_en: 'Giorgi Kvaratskhelia',
    position: 'IT მენეჯერი',
    position_en: 'IT Manager',
    text_ka: 'დაზიანებული RAID მასივიდან კრიტიკული მონაცემები სრულად აღადგინეს. პროცესის ყველა ეტაპზე ზუსტ ინფორმაციას მაწვდიდნენ.',
    text_en: 'They recovered critical data from a damaged RAID array. I received clear updates throughout every stage of the process.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop',
    is_active: true
  },
  {
    id: 'coded-review-3',
    name: 'ელენე მამუკელაშვილი',
    name_en: 'Elene Mamukelashvili',
    position: 'ფოტოგრაფი',
    position_en: 'Photographer',
    text_ka: 'დაფორმატებული SD ბარათიდან ფოტოსესიის მასალა დამიბრუნეს. მომსახურება დროული იყო და შედეგმა მოლოდინს გადააჭარბა.',
    text_en: 'They restored a photo shoot from a formatted SD card. The service was timely and the result exceeded my expectations.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop',
    is_active: true
  }
];
