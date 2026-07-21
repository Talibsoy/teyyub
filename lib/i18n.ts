// lib/i18n.ts
// Flynatoure Multi-Language Localization Engine (AZ, EN, TR)

export type Locale = "az" | "en" | "tr";

export interface TranslationDictionary {
  // Navigation
  home: string;
  tours: string;
  hotels: string;
  about: string;
  contact: string;
  wishlist: string;
  login: string;
  panel: string;

  // Hero
  heroBadge: string;
  heroGreeting: string;
  heroTitleStart: string;
  heroTitleMiddle: string;
  heroTitleEnd: string;
  heroSubtitle: string;
  startDna: string;
  startGuide: string;
  statsMatch: string;
  statsDest: string;
  statsSupport: string;

  // Bento Tabs
  flights: string;
  hotelsTab: string;
  cruises: string;
  trains: string;
  buses: string;
  toursTab: string;
  from: string;
  to: string;
  date: string;
  passengers: string;
  traveler: string;
  travelers: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  searchNow: string;
  searching: string;
  orPrompt: string;
  placeholderPrompt: string;
  aiAskButton: string;

  // Archetypes & DNA
  dnaTitle: string;
  dnaSubtitle: string;
  viewTours: string;
  viewAllTours: string;
  
  // Dynamic Package Card
  packageTitle: string;
  perPerson: string;
  totalPrice: string;
  flightIncluded: string;
  conciergeFeeIncluded: string;
  direct: string;
  stops: string;
  reserveWhatsApp: string;
  seatsLeft: string;
  noToursFound: string;
  
  // Geolocation Banner Switching Alert
  geoSuggestion: string;
  yesButton: string;
  noButton: string;
}

export const DICTIONARIES: Record<Locale, TranslationDictionary> = {
  az: {
    home: "Ana Səhifə",
    tours: "Turlar",
    hotels: "Otellər",
    about: "Haqqımızda",
    contact: "Əlaqə",
    wishlist: "İstək Siyahısı",
    login: "Daxil Ol",
    panel: "Panel",

    heroBadge: "AI Səyahət Qərar Motoru",
    heroGreeting: "📍 Sizi {city}, {country}-dan salamlayırıq! Ən yaxın hava limanı: {airport}",
    heroTitleStart: "Səyahətiniz",
    heroTitleMiddle: "3 Nəticəyə",
    heroTitleEnd: "endirilir.",
    heroSubtitle: "NatoureFly sizin Səyahət DNT-nizi analiz edir, minlərlə variantı süzgəcdən keçirir və yalnız 100% uyğun, tam büdcələşdirilmiş holistik marşrut təqdim edir.",
    startDna: "Səyahət DNT-ni Başla",
    startGuide: "AI Bələdçi ilə Başla",
    statsMatch: "Uyğunluq dəqiqliyi",
    statsDest: "Destinasiya",
    statsSupport: "AI Dəstək",

    flights: "Uçuşlar",
    hotelsTab: "Otellər",
    cruises: "Kruizlər",
    trains: "Qatarlar",
    buses: "Avtobuslar",
    toursTab: "Turlar",
    from: "Haradan",
    to: "Haraya",
    date: "Tarix",
    passengers: "Sərnişin",
    traveler: "səyahətçi",
    travelers: "səyahətçi",
    checkIn: "Giriş tarixi",
    checkOut: "Çıxış tarixi",
    guests: "Qonaq sayı",
    searchNow: "Axtar",
    searching: "Axtarılır...",
    orPrompt: "Və ya Təbii Dildə Axtarın",
    placeholderPrompt: "Məsələn: Gələn ay yoldaşımla romantik bir yerə getmək istəyirik, büdcəmiz 2000 AZN-dir...",
    aiAskButton: "AI Soruş",

    dnaTitle: "Səyahət DNT-niz analiz edildi",
    dnaSubtitle: "Turlar sizin psixometrik profilinizə görə sıralanır. Ən uyğun variantlar ən yuxarıda görünür.",
    viewTours: "Turlarıma Bax",
    viewAllTours: "Bütün Turları Gör",

    packageTitle: "Natoure Paketi",
    perPerson: "Nəfər başına",
    totalPrice: "Cəmi",
    flightIncluded: "Gediş-dönüş uçuş daxildir",
    conciergeFeeIncluded: "flynatoure bələdçi və vergilər daxildir",
    direct: "Birbaşa",
    stops: "dayanacaq",
    reserveWhatsApp: "WhatsApp-la Rezerv Et",
    seatsLeft: "Son {seats} yer!",
    noToursFound: "Hazırda uyğun tur tapılmadı. Yeni marşrutları izləyin!",
    
    geoSuggestion: "Türkiyədən və ya digər ölkədən daxil olduğunuzu hiss etdik. Saytı Türkçe və ya English dilinə keçirmək istərdinizmi?",
    yesButton: "Bəli",
    noButton: "Xeyr"
  },
  en: {
    home: "Home",
    tours: "Tours",
    hotels: "Hotels",
    about: "About Us",
    contact: "Contact",
    wishlist: "Wishlist",
    login: "Login",
    panel: "Dashboard",

    heroBadge: "AI Outdoor Experience Planner",
    heroGreeting: "📍 Welcoming you from {city}, {country}! Nearest airport: {airport}",
    heroTitleStart: "Your Next",
    heroTitleMiddle: "Wild",
    heroTitleEnd: "Adventure — Fully Planned.",
    heroSubtitle: "Natoure plans your outdoor experience end to end — real flights, hotels, and guided tours in one confirmed itinerary. Every price is live, every step is yours to approve. No guesswork, no surprises.",
    startDna: "Find My Adventure",
    startGuide: "Plan with AI Guide",
    statsMatch: "Match Accuracy",
    statsDest: "Experiences",
    statsSupport: "24/7 AI Support",

    flights: "Flights",
    hotelsTab: "Hotels",
    cruises: "Cruises",
    trains: "Trains",
    buses: "Buses",
    toursTab: "Tours",
    from: "From",
    to: "To",
    date: "Date",
    passengers: "Passengers",
    traveler: "traveler",
    travelers: "travelers",
    checkIn: "Check-in",
    checkOut: "Check-out",
    guests: "Guests",
    searchNow: "Search Now",
    searching: "Searching...",
    orPrompt: "Or Describe Your Trip in Your Own Words",
    placeholderPrompt: "e.g. Two of us want a week hiking in Alaska next month, flying from Austin, budget around $2,500...",
    aiAskButton: "Plan It",

    dnaTitle: "Your Adventure Profile Is Ready",
    dnaSubtitle: "Experiences are ranked to match how you like to travel. Your best-fit adventures appear at the top.",
    viewTours: "View My Experiences",
    viewAllTours: "Browse All Experiences",

    packageTitle: "Natoure Experience",
    perPerson: "Per person",
    totalPrice: "Total",
    flightIncluded: "Round-trip flight included",
    conciergeFeeIncluded: "Natoure concierge fee & taxes included",
    direct: "Direct",
    stops: "stop",
    reserveWhatsApp: "Reserve on WhatsApp",
    seatsLeft: "Only {seats} seats left!",
    noToursFound: "No matching tours found right now. Stay tuned for new routes!",
    
    geoSuggestion: "We noticed you are visiting from Turkey or international location. Would you like to switch to Turkish or English?",
    yesButton: "Yes",
    noButton: "No"
  },
  tr: {
    home: "Ana Sayfa",
    tours: "Turlar",
    hotels: "Oteller",
    about: "Hakkımızda",
    contact: "İletişim",
    wishlist: "İstek Listesi",
    login: "Giriş Yap",
    panel: "Panel",

    heroBadge: "Yapay Zeka Seyahat Karar Motoru",
    heroGreeting: "📍 Sizi {city}, {country}'dan selamlıyoruz! En yakın havalimanı: {airport}",
    heroTitleStart: "Seyahatiniz",
    heroTitleMiddle: "En İyi 3",
    heroTitleEnd: "Sonuca İndirgeniyor.",
    heroSubtitle: "NatoureFly Seyahat DNA'nızı analiz eder, binlerce seçeneği eler ve yalnızca %100 uyumlu, tam bütçelendirilmiş bütünsel seyahat rotanızı sunar.",
    startDna: "Seyahat DNA'sını Başlat",
    startGuide: "AI Rehberi ile Başla",
    statsMatch: "Eşleşme Doğruluğu",
    statsDest: "Destinasyon",
    statsSupport: "Yapay Zeka Desteği",

    flights: "Uçuşlar",
    hotelsTab: "Oteller",
    cruises: "Kruvaziyer",
    trains: "Trenler",
    buses: "Otobüsler",
    toursTab: "Turlar",
    from: "Nereden",
    to: "Nereye",
    date: "Tarih",
    passengers: "Yolcular",
    traveler: "yolcu",
    travelers: "yolcu",
    checkIn: "Giriş Tarihi",
    checkOut: "Çıkış Tarihi",
    guests: "Konuk Sayısı",
    searchNow: "Şimdi Ara",
    searching: "Aranıyor...",
    orPrompt: "Veya Doğal Dilde Arama Yapın",
    placeholderPrompt: "Örneğin: Gelecek ay eşimle romantik bir yere gitmek istiyoruz, bütçemiz 2000 USD...",
    aiAskButton: "AI Sor",

    dnaTitle: "Seyahat DNA'nız Analiz Edildi",
    dnaSubtitle: "Turlar psikometrik profilinize göre sıralanır. En uyumlu seçenekler en üstte görünür.",
    viewTours: "Turlarımı İncele",
    viewAllTours: "Tüm Turları Gör",

    packageTitle: "Natoure Paketi",
    perPerson: "Kişi başı",
    totalPrice: "Toplam",
    flightIncluded: "Gidiş-dönüş uçuş dahildir",
    conciergeFeeIncluded: "flynatoure danışmanlık ve vergiler dahildir",
    direct: "Aktarmasız",
    stops: "aktarma",
    reserveWhatsApp: "WhatsApp ile Rezerve Et",
    seatsLeft: "Son {seats} koltuk!",
    noToursFound: "Şu anda eşleşen tur bulunamadı. Yeni rotalar için takipte kalın!",
    
    geoSuggestion: "Türkiye'den veya farklı bir ülkeden bağlandığınızı fark ettik. Siteyi Türkçe veya İngilizce görüntülemek ister misiniz?",
    yesButton: "Evet",
    noButton: "Hayır"
  }
};
