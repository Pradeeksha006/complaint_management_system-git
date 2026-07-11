import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(localStorage.getItem('preferredLanguage') || 'en');

  useEffect(() => {
    // Create hidden translate container if it doesn't exist
    if (!document.getElementById('google_translate_element')) {
      const gdiv = document.createElement('div');
      gdiv.id = 'google_translate_element';
      gdiv.style.display = 'none';
      document.body.appendChild(gdiv);
    }

    // Set Google translate callback
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement({
        pageLanguage: 'en',
        autoDisplay: false
      }, 'google_translate_element');
    };

    // Load google translate script
    if (!document.getElementById('google_translate_script')) {
      const script = document.createElement('script');
      script.id = 'google_translate_script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const changeLanguage = (langCode) => {
    setCurrentLanguage(langCode);
    localStorage.setItem('preferredLanguage', langCode);

    const applyTranslation = () => {
      const combo = document.querySelector('select.goog-te-combo');
      if (combo) {
        combo.value = langCode;
        combo.dispatchEvent(new Event('change'));
      }
    };

    // Try immediately
    applyTranslation();

    // Check periodically for loading script
    const interval = setInterval(() => {
      const combo = document.querySelector('select.goog-te-combo');
      if (combo) {
        applyTranslation();
        clearInterval(interval);
      }
    }, 200);

    setTimeout(() => clearInterval(interval), 4000);
  };

  // Re-apply on initialization if non-default
  useEffect(() => {
    if (currentLanguage !== 'en') {
      const timer = setTimeout(() => {
        changeLanguage(currentLanguage);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentLanguage]);

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
