import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    appTitle: 'ClimaShield TN',
    tagline: 'State Disaster Operations & Citizen Climate Safety DSS',
    navHome: 'Overview',
    navLiveMap: 'Live Map',
    navTimeline: 'Time Machine',
    navSimulator: 'Disaster Simulator',
    navReport: 'Report Incident',
    navCitizen: 'My Safety Hub',
    navAdmin: 'Command Center',
    navLogin: 'Sign In',
    navLogout: 'Sign Out',
    emergencyHotlines: 'Emergency Hotlines',
    stateControlRoom: 'State Control Room (1070)',
    districtControlRoom: 'District Control Room (1077)',
    ambulance: 'Ambulance (108)',
    fireAndRescue: 'Fire & Rescue (101)',
    meenatchiAi: 'TN Meenatchi AI Assistant',
    meenatchiSubtitle: 'TNSDMA 24/7 Virtual Emergency Advisor',
    typeMessage: 'Type your message or ask for emergency guidance...',
    send: 'Send',
    verifyIncident: 'Verify Incident',
    shelterCapacity: 'Shelter Capacity',
    broadcastAlert: 'Dispatch Broadcast Alert',
    riskScore: 'Personal Risk Verdict',
    nearestShelters: 'Nearest Designated Safe Shelters',
    navigateGoogleMaps: 'Navigate on Google Maps',
    citizenLockNotice: 'Coordinates auto-locked to registered home location:',
    demoPersonas: 'Demo Personas Quick-Fill',
  },
  ta: {
    appTitle: 'கிளைமாஷீல்ட் தமிழ்நாடு',
    tagline: 'தமிழ்நாடு பேரிடர் மேலாண்மை & பொது மக்கள் காலநிலை பாதுகாப்பு மையம்',
    navHome: 'முகப்பு',
    navLiveMap: 'நேரலை வரைபடம்',
    navTimeline: 'கால இயந்திரம்',
    navSimulator: 'பேரிடர் மாதிரி',
    navReport: 'அறிக்கை தாக்கல்',
    navCitizen: 'எனது பாதுகாப்பு மையம்',
    navAdmin: 'கட்டுப்பாட்டு மையம்',
    navLogin: 'உள்நுழைவு',
    navLogout: 'வெளியேறு',
    emergencyHotlines: 'அவசர உதவி எண்கள்',
    stateControlRoom: 'மாநிலக் கட்டுப்பாட்டு அறை (1070)',
    districtControlRoom: 'மாவட்டக் கட்டுப்பாட்டு அறை (1077)',
    ambulance: 'ஆம்புலன்ஸ் (108)',
    fireAndRescue: 'தீயணைப்பு & மீட்பு (101)',
    meenatchiAi: 'தமிழ்நாடு மீனாட்சி AI',
    meenatchiSubtitle: 'TNSDMA 24/7 டிஜிட்டல் உதவி மையம்',
    typeMessage: 'உங்கள் வினா அல்லது அவசர உதவியைக் கேட்கவும்...',
    send: 'அனுப்பு',
    verifyIncident: 'அறிக்கை சரிபார்ப்பு',
    shelterCapacity: 'நிவாரண முகாம் கொள்ளளவு',
    broadcastAlert: 'அவசர எச்சரிக்கை அனுப்பு',
    riskScore: 'பாதுகாப்பு நிலை மதிப்பீடு',
    nearestShelters: 'அருகிலுள்ள பாதுகாப்பான நிவாரண முகாம்கள்',
    navigateGoogleMaps: 'கூகிள் வரைபடத்தில் வழிசெலுத்து',
    citizenLockNotice: 'பதிவு செய்யப்பட்ட இடத்திற்கு இருப்பிடம் பூட்டப்பட்டது:',
    demoPersonas: 'டெமோ கணக்குகள் விரைவு தேர்வு',
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ta' : 'en'));
  };

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
