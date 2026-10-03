import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"

const TRACKER_SCRIPT = `(function () {
  "use strict";

  if (typeof window !== "undefined") {
    if (window.__USRLY_PREVIEW_MODE__ || (window.self !== window.top && window.location.pathname.indexOf("preview-proxy") !== -1)) {
      return;
    }
    if (window.__USRLY_INITIALIZED__) {
      return;
    }
    window.__USRLY_INITIALIZED__ = true;
  }

  var currentScript = document.currentScript;
  var domain = (currentScript && currentScript.getAttribute("data-domain")) || window.location.hostname;
  var apiHost = (currentScript && currentScript.getAttribute("data-api")) || (currentScript ? currentScript.src.replace(/\\/(script|upfront|userly|tracker)\\.js.*/, "") : "");
  if (!apiHost) apiHost = window.location.origin;

  var analyticsEndpoint = apiHost + "/api/v1/event";
  var consentConfigEndpoint = apiHost + "/api/v1/consent/config?domain=" + encodeURIComponent(domain);
  var consentLogEndpoint = apiHost + "/api/v1/consent/log";
  var policyEndpoint = apiHost + "/api/v1/consent/policy?domain=" + encodeURIComponent(domain);

  var STORAGE_KEY = "usrly_consent_" + domain;
  var consentListeners = [];
  var activeConfig = null;
  var cachedPolicyCookies = null;
  var isGPCSignal = typeof navigator !== "undefined" && Boolean(navigator.globalPrivacyControl);

  // =========================================================================
  // MULTI-LANGUAGE / TRANSLATIONS ENGINE (LOCAL & DETERMINISTIC)
  // =========================================================================
  var TRANSLATIONS = {
    en: {
      title: "We value your privacy",
      description: "We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking 'Accept All', you consent to our use of cookies.",
      accept_all_label: "Accept All",
      reject_all_label: "Reject All",
      preferences_label: "Customise",
      preferences_title: "Customise Consent Preferences",
      preferences_description: "We use cookies to help you navigate efficiently and perform certain functions. You will find detailed information about all cookies under each consent category below.",
      save_preferences_label: "Save My Preferences",
      pref_accept_all_label: "Accept All",
      pref_reject_all_label: "Reject All",
      always_active_label: "Always Active",
      no_cookies_to_display_label: "No cookies to display",
      cookie_column_label: "Cookie",
      duration_column_label: "Duration",
      description_column_label: "Description",
      necessary_title: "Necessary",
      necessary_description: "Necessary cookies are required to enable the basic features of this site, such as providing secure log-in or adjusting your consent preferences. These cookies do not store any personally identifiable data.",
      functional_title: "Functional",
      functional_description: "Functional cookies help perform certain functionalities like sharing the content of the website on social media platforms, collecting feedback, and other third-party features.",
      analytics_title: "Analytics",
      analytics_description: "Analytical cookies are used to understand how visitors interact with the website. These cookies help provide information on metrics such as the number of visitors, bounce rate, traffic source, etc.",
      performance_title: "Performance",
      performance_description: "Performance cookies are used to understand and analyze the key performance indexes of the website which helps in delivering a better user experience for the visitors.",
      advertisement_title: "Advertisement",
      advertisement_description: "Advertisement cookies are used to provide visitors with customized advertisements based on the pages you visited previously and to analyze the effectiveness of the ad campaigns.",
      blocked_content_alt_text: "Please accept cookies to access this content",
      revisit_button_label: "Consent Preferences",
      read_privacy_policy: "Read Privacy Policy"
    },
    de: {
      title: "Wir schätzen Ihre Privatsphäre",
      description: "Wir verwenden Cookies, um Ihr Surferlebnis zu verbessern, personalisierte Anzeigen oder Inhalte bereitzustellen und unseren Datenverkehr zu analysieren. Indem Sie auf „Alle akzeptieren“ klicken, stimmen Sie der Verwendung von Cookies zu.",
      accept_all_label: "Alle akzeptieren",
      reject_all_label: "Alle ablehnen",
      preferences_label: "Einstellungen anpassen",
      preferences_title: "Datenschutzeinstellungen anpassen",
      preferences_description: "Wir respektieren Ihre Datenschutzeinstellungen. Sie können festlegen, welche Cookie-Kategorien Sie auf dieser Website zulassen. Notwendige Cookies können nicht deaktiviert werden.",
      save_preferences_label: "Einstellungen speichern",
      pref_accept_all_label: "Alle akzeptieren",
      pref_reject_all_label: "Alle ablehnen",
      always_active_label: "Immer aktiv",
      no_cookies_to_display_label: "Keine Cookies vorhanden",
      cookie_column_label: "Cookie",
      duration_column_label: "Dauer",
      description_column_label: "Beschreibung",
      necessary_title: "Notwendig",
      necessary_description: "Notwendige Cookies sind für die Kernfunktionen der Website, die Sicherheit und das Speichern Ihrer Einstellungen erforderlich.",
      functional_title: "Funktional",
      functional_description: "Funktionale Cookies ermöglichen erweiterte Funktionen wie Chat-Widgets, Videos und Social-Media-Integrationen.",
      analytics_title: "Analytisch",
      analytics_description: "Analytische Cookies helfen uns zu verstehen, wie Besucher mit der Website interagieren, um die Benutzerfreundlichkeit zu verbessern.",
      performance_title: "Leistung",
      performance_description: "Leistungs-Cookies werden verwendet, um wichtige Leistungskennzahlen wie Ladezeiten und Systemfehler zu analysieren.",
      advertisement_title: "Werbung & Marketing",
      advertisement_description: "Werbe-Cookies werden verwendet, um Besuchern relevante Werbung und personalisierte Kampagnen bereitzustellen.",
      blocked_content_alt_text: "Bitte akzeptieren Sie Cookies, um auf diesen Inhalt zuzugreifen",
      revisit_button_label: "Datenschutzeinstellungen",
      read_privacy_policy: "Datenschutzerklärung lesen"
    },
    fr: {
      title: "Nous respectons votre vie privée",
      description: "Nous utilisons des cookies pour améliorer votre expérience de navigation, diffuser des publicités ou des contenus personnalisés et analyser notre trafic. En cliquant sur « Tout accepter », vous consentez à notre utilisation des cookies.",
      accept_all_label: "Tout accepter",
      reject_all_label: "Tout refuser",
      preferences_label: "Personnaliser",
      preferences_title: "Personnaliser les préférences de consentement",
      preferences_description: "Nous respectons vos préférences de confidentialité. Vous pouvez choisir les catégories de cookies autorisées sur ce site. Les cookies nécessaires ne peuvent pas être désactivés.",
      save_preferences_label: "Enregistrer mes préférences",
      pref_accept_all_label: "Tout accepter",
      pref_reject_all_label: "Tout refuser",
      always_active_label: "Toujours actif",
      no_cookies_to_display_label: "Aucun cookie à afficher",
      cookie_column_label: "Cookie",
      duration_column_label: "Durée",
      description_column_label: "Description",
      necessary_title: "Nécessaire",
      necessary_description: "Les cookies nécessaires sont indispensables au fonctionnement de base, à la sécurité et à la gestion de vos préférences.",
      functional_title: "Fonctionnel",
      functional_description: "Les cookies fonctionnels permettent des fonctionnalités telles que les vidéos, les widgets de discussion et le partage social.",
      analytics_title: "Statistiques",
      analytics_description: "Les cookies statistiques aident à mesurer le trafic et les pages populaires pour améliorer l'expérience utilisateur.",
      performance_title: "Performance",
      performance_description: "Les cookies de performance surveillent les temps de chargement et les erreurs techniques du site.",
      advertisement_title: "Publicité et Marketing",
      advertisement_description: "Les cookies publicitaires sont utilisés pour présenter des publicités pertinentes et mesurer l'impact des campagnes.",
      blocked_content_alt_text: "Veuillez accepter les cookies pour accéder à ce contenu",
      revisit_button_label: "Préférences de cookies",
      read_privacy_policy: "Lire la politique de confidentialité"
    },
    es: {
      title: "Valoramos su privacidad",
      description: "Utilizamos cookies para mejorar su experiencia de navegación, ofrecer anuncios o contenidos personalizados y analizar nuestro tráfico. Al hacer clic en «Aceptar todo», acepta nuestro uso de cookies.",
      accept_all_label: "Aceptar todo",
      reject_all_label: "Rechazar todo",
      preferences_label: "Personalizar",
      preferences_title: "Personalizar preferencias de consentimiento",
      preferences_description: "Respetamos sus preferencias de privacidad. Puede elegir qué categorías de cookies permite en este sitio web. Las cookies esenciales no se pueden desactivar.",
      save_preferences_label: "Guardar mis preferencias",
      pref_accept_all_label: "Aceptar todo",
      pref_reject_all_label: "Rechazar todo",
      always_active_label: "Siempre activo",
      no_cookies_to_display_label: "No hay cookies para mostrar",
      cookie_column_label: "Cookie",
      duration_column_label: "Duración",
      description_column_label: "Descripción",
      necessary_title: "Necesarias",
      necessary_description: "Las cookies necesarias son fundamentales para la navegación básica, la seguridad y el almacenamiento de su consentimiento.",
      functional_title: "Funcionales",
      functional_description: "Las cookies funcionales permiten funciones enriquecidas como widgets de chat, vídeos y herramientas interactivas.",
      analytics_title: "Analíticas",
      analytics_description: "Las cookies analíticas ayudan a comprender cómo los visitantes interactúan con el sitio web para optimizarlo.",
      performance_title: "Rendimiento",
      performance_description: "Las cookies de rendimiento miden los tiempos de respuesta y la velocidad del sitio web.",
      advertisement_title: "Publicidad y Marketing",
      advertisement_description: "Las cookies de publicidad se utilizan para ofrecer anuncios relevantes y medir la eficacia de las campañas.",
      blocked_content_alt_text: "Por favor, acepte las cookies para acceder a este contenido",
      revisit_button_label: "Preferencias de cookies",
      read_privacy_policy: "Leer política de privacidad"
    },
    pt: {
      title: "Valorizamos a sua privacidade",
      description: "Utilizamos cookies para melhorar a sua experiência de navegação, apresentar anúncios ou conteúdos personalizados e analisar o nosso tráfego. Ao clicar em 'Aceitar tudo', consente a nossa utilização de cookies.",
      accept_all_label: "Aceitar tudo",
      reject_all_label: "Rejeitar tudo",
      preferences_label: "Personalizar",
      preferences_title: "Personalizar preferências de consentimento",
      preferences_description: "Respeitamos as suas preferências de privacidade. Pode escolher quais as categorias de cookies que permite neste website. Os cookies necessários não podem ser desativados.",
      save_preferences_label: "Guardar as minhas preferências",
      pref_accept_all_label: "Aceitar tudo",
      pref_reject_all_label: "Rejeitar tudo",
      always_active_label: "Sempre ativo",
      no_cookies_to_display_label: "Nenhum cookie para apresentar",
      cookie_column_label: "Cookie",
      duration_column_label: "Duração",
      description_column_label: "Descrição",
      necessary_title: "Necessários",
      necessary_description: "Os cookies necessários são essenciais para o funcionamento do site, segurança e gestão de consentimento.",
      functional_title: "Funcionais",
      functional_description: "Os cookies funcionais permitem ferramentas como widgets de apoio ao cliente, reprodução de vídeo e partilha social.",
      analytics_title: "Analíticos",
      analytics_description: "Os cookies analíticos ajudam a compreender como os visitantes utilizam o site para melhorar o serviço.",
      performance_title: "Desempenho",
      performance_description: "Os cookies de desempenho monitorizam a velocidade e eventuais erros na navegação.",
      advertisement_title: "Publicidade",
      advertisement_description: "Os cookies de publicidade são utilizados para disponibilizar anúncios personalizados e medir a sua eficácia.",
      blocked_content_alt_text: "Por favor, aceite cookies para aceder a este conteúdo",
      revisit_button_label: "Preferências de cookies",
      read_privacy_policy: "Ler política de privacidade"
    },
    it: {
      title: "Rispettiamo la tua privacy",
      description: "Utilizziamo i cookie per migliorare la tua esperienza di navigazione, mostrarti annunci o contenuti personalizzati e analizzare il nostro traffico. Cliccando su «Accetta tutti», acconsenti all'uso dei cookie.",
      accept_all_label: "Accetta tutti",
      reject_all_label: "Rifiuta tutti",
      preferences_label: "Personalizza",
      preferences_title: "Personalizza le preferenze di consenso",
      preferences_description: "Rispettiamo le tue scelte sulla privacy. Puoi personalizzare quali categorie di cookie consentire su questo sito. I cookie necessari non possono essere disattivati.",
      save_preferences_label: "Salva le mie preferenze",
      pref_accept_all_label: "Accetta tutti",
      pref_reject_all_label: "Rifiuta tutti",
      always_active_label: "Sempre attivo",
      no_cookies_to_display_label: "Nessun cookie da mostrare",
      cookie_column_label: "Cookie",
      duration_column_label: "Durata",
      description_column_label: "Descrizione",
      necessary_title: "Necessari",
      necessary_description: "I cookie necessari sono indispensabili per le funzionalità di base, la sicurezza e la registrazione delle preferenze.",
      functional_title: "Funzionali",
      functional_description: "I cookie funzionali consentono funzionalità interattive come chat di supporto, video e condivisione social.",
      analytics_title: "Statistici",
      analytics_description: "I cookie statistici raccolgono dati anonimi sull'utilizzo del sito per aiutarci a migliorarlo.",
      performance_title: "Prestazioni",
      performance_description: "I cookie di prestazione monitorano la velocità di caricamento e le metriche di affidabilità tecnica.",
      advertisement_title: "Pubblicità e Marketing",
      advertisement_description: "I cookie pubblicitari vengono usati per offrirti annunci pertinenti e monitorare le campagne.",
      blocked_content_alt_text: "Accetta i cookie per visualizzare questo contenuto",
      revisit_button_label: "Preferenze cookie",
      read_privacy_policy: "Leggi l'informativa sulla privacy"
    },
    nl: {
      title: "Wij waarderen uw privacy",
      description: "Wij gebruiken cookies om uw browse-ervaring te verbeteren, gepersonaliseerde advertenties of inhoud aan te bieden en ons verkeer te analyseren. Door op 'Alles accepteren' te klikken, stemt u in met ons gebruik van cookies.",
      accept_all_label: "Alles accepteren",
      reject_all_label: "Alles weigeren",
      preferences_label: "Aanpassen",
      preferences_title: "Toestemmingsvoorkeuren aanpassen",
      preferences_description: "Wij respecteren uw privacy. U kunt zelf kiezen welke categorieën cookies u toestaat op deze website. Noodzakelijke cookies kunnen niet worden uitgeschakeld.",
      save_preferences_label: "Mijn voorkeuren opslaan",
      pref_accept_all_label: "Alles accepteren",
      pref_reject_all_label: "Alles weigeren",
      always_active_label: "Altijd actief",
      no_cookies_to_display_label: "Geen cookies om weer te geven",
      cookie_column_label: "Cookie",
      duration_column_label: "Bewaartermijn",
      description_column_label: "Beschrijving",
      necessary_title: "Noodzakelijk",
      necessary_description: "Noodzakelijke cookies zijn essentieel voor de basisfunctionaliteit, beveiliging en het opslaan van uw keuzes.",
      functional_title: "Functioneel",
      functional_description: "Functionele cookies maken functies zoals videoweergave, chatwidgets en sociale integraties mogelijk.",
      analytics_title: "Analytisch",
      analytics_description: "Analytische cookies helpen begrijpen hoe bezoekers de website gebruiken om deze continu te verbeteren.",
      performance_title: "Prestaties",
      performance_description: "Prestatiecookies meten laadtijden en technische werking van de website.",
      advertisement_title: "Advertenties & Marketing",
      advertisement_description: "Marketingcookies worden ingezet om relevante advertenties te tonen en advertentiecampagnes te meten.",
      blocked_content_alt_text: "Accepteer cookies om deze inhoud te bekijken",
      revisit_button_label: "Cookievoorkeuren",
      read_privacy_policy: "Lees privacybeleid"
    },
    hi: {
      title: "हम आपकी गोपनीयता का सम्मान करते हैं",
      description: "हम आपके अनुभव को बेहतर बनाने, व्यक्तिगत विज्ञापन या सामग्री प्रस्तुत करने और ट्रैफ़िक का विश्लेषण करने के लिए कुकीज़ का उपयोग करते हैं। 'सभी स्वीकार करें' पर क्लिक करके, आप कुकीज़ के उपयोग की सहमति देते हैं।",
      accept_all_label: "सभी स्वीकार करें",
      reject_all_label: "सभी अस्वीकार करें",
      preferences_label: "अनुकूलित करें",
      preferences_title: "सहमति प्राथमिकताएं अनुकूलित करें",
      preferences_description: "हम आपकी गोपनीयता प्राथमिकताओं का सम्मान करते हैं। आप चुन सकते हैं कि आप किन श्रेणियों की कुकीज़ की अनुमति देते हैं। आवश्यक कुकीज़ को बंद नहीं किया जा सकता।",
      save_preferences_label: "प्राथमिकताएं सहेजें",
      pref_accept_all_label: "सभी स्वीकार करें",
      pref_reject_all_label: "सभी अस्वीकार करें",
      always_active_label: "हमेशा सक्रिय",
      no_cookies_to_display_label: "प्रदर्शित करने के लिए कोई कुकीज़ नहीं",
      cookie_column_label: "कुकी",
      duration_column_label: "अवधि",
      description_column_label: "विवरण",
      necessary_title: "आवश्यक",
      necessary_description: "वेबसाइट के बुनियादी संचालन, सुरक्षा और प्राथमिकताओं को सहेजने के लिए आवश्यक कुकीज़ अनिवार्य हैं।",
      functional_title: "कार्यात्मक",
      functional_description: "कार्यात्मक कुकीज़ वीडियो, चैट विजेट और सोशल शेयरिंग जैसी अतिरिक्त सुविधाएं सक्षम करती हैं।",
      analytics_title: "एनालिटिक्स",
      analytics_description: "एनालिटिक्स कुकीज़ हमें यह समझने में मदद करती हैं कि आगंतुक वेबसाइट के साथ कैसे इंटरैक्ट करते हैं।",
      performance_title: "प्रदर्शन",
      performance_description: "प्रदर्शन कुकीज़ वेबसाइट की लोडिंग गति और त्रुटि रिपोर्टिंग की निगरानी करती हैं।",
      advertisement_title: "विज्ञापन और मार्केटिंग",
      advertisement_description: "मार्केटिंग कुकीज़ का उपयोग प्रासंगिक विज्ञापन दिखाने और अभियानों की प्रभावशीलता मापने के लिए किया जाता है।",
      blocked_content_alt_text: "इस सामग्री को देखने के लिए कृपया कुकीज़ स्वीकार करें",
      revisit_button_label: "कुकी प्राथमिकताएं",
      read_privacy_policy: "गोपनीयता नीति पढ़ें"
    }
  };

  var activeLanguage = "en";

  function detectVisitorLanguage(config) {
    try {
      var visitorLang = localStorage.getItem("usrly_lang_" + domain);
      if (visitorLang && TRANSLATIONS[visitorLang]) {
        return visitorLang;
      }
    } catch (e) {}

    if (!config || config.enable_auto_language !== false) {
      try {
        var navLangs = (navigator.languages && navigator.languages.length > 0) ? navigator.languages : [navigator.language || navigator.userLanguage || "en"];
        for (var i = 0; i < navLangs.length; i++) {
          var tag = (navLangs[i] || "").toLowerCase().trim();
          if (TRANSLATIONS[tag]) return tag;
          var primary = tag.split("-")[0];
          if (TRANSLATIONS[primary]) return primary;
        }
      } catch (e) {}
    }

    if (config && config.default_language && TRANSLATIONS[config.default_language]) {
      return config.default_language;
    }

    return "en";
  }

  function resolveText(key, config, customLang) {
    var lang = customLang || activeLanguage || "en";
    var dict = TRANSLATIONS[lang] || TRANSLATIONS["en"];
    var enDefault = (TRANSLATIONS["en"] && TRANSLATIONS["en"][key]) || "";
    var customVal = config ? config[key] : undefined;

    if (config && (customVal === undefined || customVal === null || customVal === "")) {
      if (key === "preferences_description") {
        customVal = config.preferences_description || config.preference_description || config.preference_message;
      } else if (key === "preferences_title") {
        customVal = config.preferences_title || config.preference_title;
      } else if (key === "show_more_label") {
        customVal = config.show_more_label;
      } else if (key === "show_less_label") {
        customVal = config.show_less_label;
      }
    }

    if (customVal && typeof customVal === "string" && customVal.indexOf("We respect your privacy preferences") !== -1) {
      customVal = enDefault;
    }

    // Customer custom copy always takes precedence over automatic translation
    if (customVal && typeof customVal === "string" && customVal.trim().length > 0) {
      if (lang !== "en" && lang !== (config && config.default_language ? config.default_language : "en") && customVal === enDefault) {
        return (dict && dict[key]) || enDefault || "";
      }
      return customVal;
    }

    return (dict && dict[key]) || enDefault || "";
  }

  function resolveCategoryTitle(catKey, config, customLang) {
    if (config && config.category_configs && config.category_configs[catKey] && config.category_configs[catKey].title) {
      return config.category_configs[catKey].title;
    }
    var flatKey = catKey + "_title";
    return resolveText(flatKey, config, customLang);
  }

  function resolveCategoryDesc(catKey, config, customLang) {
    if (config && config.category_configs && config.category_configs[catKey] && config.category_configs[catKey].description) {
      return config.category_configs[catKey].description;
    }
    var flatKey = catKey + "_description";
    return resolveText(flatKey, config, customLang);
  }

  // =========================================================================
  // IAB TCF v2.3 SIGNALING ENGINE
  // =========================================================================
  var tcfListeners = {};
  var nextListenerId = 1;
  var lastTCFEventStatus = "tcloaded";
  var cmpUiIsVisible = false;

  function toBitString(val, numBits) {
    var s = (val >>> 0).toString(2);
    while (s.length < numBits) s = "0" + s;
    return s.slice(-numBits);
  }

  function toEpochBits(date) {
    var ts = date ? (date instanceof Date ? date.getTime() : new Date(date).getTime()) : Date.now();
    var ds = Math.floor(ts / 100);
    var hi = Math.floor(ds / 0x100000000);
    var lo = ds % 0x100000000;
    return toBitString(hi, 4) + toBitString(lo, 32);
  }

  function toLangBits(code) {
    var c1 = ((code && code.length > 0 ? code.charCodeAt(0) : 65) - 65) & 63;
    var c2 = ((code && code.length > 1 ? code.charCodeAt(1) : 65) - 65) & 63;
    return toBitString(c1, 6) + toBitString(c2, 6);
  }

  function encodeTCString(consent, createdDate, updatedDate) {
    var c = consent || {};
    var isGiven = Boolean(c.consent_given || c.functional || c.analytics || c.performance || c.advertisement);
    var isGPC = isGPCSignal && (!activeConfig || activeConfig.enable_gpc !== false) && !c.gpc_explicit_override;
    var ad = !isGPC && Boolean(c.advertisement || c.marketing);
    var ana = !isGPC && Boolean(c.analytics);
    var func = Boolean(c.functional);
    var perf = Boolean(c.performance);

    var p1 = isGiven ? 1 : 0;
    var p2 = ad ? 1 : 0;
    var p3 = ad ? 1 : 0;
    var p4 = ad ? 1 : 0;
    var p5 = (func || perf) ? 1 : 0;
    var p6 = func ? 1 : 0;
    var p7 = (ad || ana) ? 1 : 0;
    var p8 = ana ? 1 : 0;
    var p9 = ana ? 1 : 0;
    var p10 = (func || perf || ana) ? 1 : 0;
    var p11 = func ? 1 : 0;

    var purposeBits = "" + p1 + p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9 + p10 + p11 + "0000000000000";
    var purposeLIBits = "000000" + (ad || ana ? "1" : "0") + (ana ? "1" : "0") + (ana ? "1" : "0") + (func || perf || ana ? "1" : "0") + "00000000000000";

    var bits = "";
    bits += toBitString(2, 6); // Version = 2
    bits += toEpochBits(createdDate || new Date()); // Created (36 bits)
    bits += toEpochBits(updatedDate || new Date()); // LastUpdated (36 bits)
    bits += toBitString(0, 12); // CmpId = 0 (Self-hosted UpFront CMP)
    bits += toBitString(1, 12); // CmpVersion = 1
    bits += toBitString(1, 6); // ConsentScreen = 1
    bits += toLangBits("EN"); // ConsentLanguage = EN (12 bits)
    bits += toBitString(1, 12); // VendorListVersion = 1 (12 bits)
    bits += toBitString(4, 6); // TcfPolicyVersion = 4 (TCF v2.2/v2.3)
    bits += "1"; // IsServiceSpecific = 1 (1 bit)
    bits += "0"; // UseNonStandardStacks = 0 (1 bit)
    bits += "000000000000"; // SpecialFeatureOptIns (12 bits)
    bits += purposeBits; // PurposesConsent (24 bits)
    bits += purposeLIBits; // PurposesLITransparency (24 bits)
    bits += "0"; // PurposeOneTreatment = 0 (1 bit)
    bits += toLangBits("AA"); // PublisherCC = AA (12 bits)
    bits += toBitString(0, 16); // VendorConsents MaxVendorId = 0
    bits += "0"; // IsRange = 0
    bits += toBitString(0, 16); // VendorLegitimateInterests MaxVendorId = 0
    bits += "0"; // IsRange = 0
    bits += toBitString(0, 12); // NumPublisherRestrictions = 0

    while (bits.length % 6 !== 0) {
      bits += "0";
    }

    var b64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    var tcString = "";
    for (var i = 0; i < bits.length; i += 6) {
      tcString += b64Chars.charAt(parseInt(bits.substr(i, 6), 2));
    }
    return tcString;
  }

  function getGdprApplies() {
    if (activeConfig && activeConfig.enable_iab_tcf === false) return false;
    if (activeConfig && activeConfig.is_in_geo_zone !== undefined) return Boolean(activeConfig.is_in_geo_zone);
    if (activeConfig && activeConfig.law_template) {
      return activeConfig.law_template === "gdpr" || activeConfig.law_template === "uk_gdpr";
    }
    return true;
  }

  function buildTCData(eventStatus, listenerId) {
    var c = getEffectiveConsent() || getStoredConsent() || { necessary: true };
    var isGiven = Boolean(c.consent_given || c.functional || c.analytics || c.performance || c.advertisement);
    var isGPC = isGPCSignal && (!activeConfig || activeConfig.enable_gpc !== false) && !c.gpc_explicit_override;
    var ad = !isGPC && Boolean(c.advertisement || c.marketing);
    var ana = !isGPC && Boolean(c.analytics);
    var func = Boolean(c.functional);
    var perf = Boolean(c.performance);

    var tcString = encodeTCString(c);

    var tcData = {
      tcString: tcString,
      tcfPolicyVersion: 4,
      cmpId: 0,
      cmpVersion: 1,
      gdprApplies: getGdprApplies(),
      eventStatus: eventStatus || lastTCFEventStatus || "tcloaded",
      cmpStatus: "loaded",
      isServiceSpecific: true,
      useNonStandardStacks: false,
      publisherCC: "AA",
      purposeOneTreatment: false,
      purpose: {
        consents: {
          1: isGiven,
          2: ad,
          3: ad,
          4: ad,
          5: Boolean(func || perf),
          6: func,
          7: Boolean(ad || ana),
          8: ana,
          9: ana,
          10: Boolean(func || perf || ana),
          11: func
        },
        legitimateInterests: {
          1: false,
          2: false,
          3: false,
          4: false,
          5: false,
          6: false,
          7: Boolean(ad || ana),
          8: ana,
          9: ana,
          10: Boolean(func || perf || ana),
          11: false
        }
      },
      vendor: {
        consents: {},
        legitimateInterests: {}
      },
      specialFeatureOptins: {
        1: false,
        2: false
      },
      publisher: {
        consents: {
          1: isGiven,
          2: ad,
          3: ad,
          4: ad,
          5: Boolean(func || perf),
          6: func,
          7: Boolean(ad || ana),
          8: ana,
          9: ana,
          10: Boolean(func || perf || ana),
          11: func
        },
        legitimateInterests: {
          1: false,
          2: false,
          3: false,
          4: false,
          5: false,
          6: false,
          7: Boolean(ad || ana),
          8: ana,
          9: ana,
          10: Boolean(func || perf || ana),
          11: false
        },
        customPurposes: {
          consents: {},
          legitimateInterests: {}
        },
        restrictions: {}
      }
    };

    if (listenerId !== undefined) {
      tcData.listenerId = listenerId;
    }

    return tcData;
  }

  function notifyTCFListeners(eventStatus) {
    lastTCFEventStatus = eventStatus;
    var keys = Object.keys(tcfListeners);
    for (var i = 0; i < keys.length; i++) {
      var id = keys[i];
      var cb = tcfListeners[id];
      if (typeof cb === "function") {
        try {
          cb(buildTCData(eventStatus, Number(id)), true);
        } catch (e) {
          if (typeof console !== "undefined" && console.error) console.error("[TCF] Listener error:", e);
        }
      }
    }
  }

  function handleTCFCommand(command, version, callback, parameter) {
    if (typeof callback !== "function") return;

    if (command === "ping") {
      callback({
        gdprApplies: getGdprApplies(),
        cmpLoaded: true,
        cmpStatus: "loaded",
        displayStatus: cmpUiIsVisible ? "visible" : "hidden",
        apiVersion: "2.3",
        cmpId: 0,
        cmpVersion: 1,
        tcfPolicyVersion: 4,
        gvlVersion: 1
      }, true);
      return;
    }

    if (command === "addEventListener") {
      var listenerId = nextListenerId++;
      tcfListeners[listenerId] = callback;
      callback(buildTCData(lastTCFEventStatus, listenerId), true);
      return;
    }

    if (command === "removeEventListener") {
      var idToRemove = parameter;
      if (idToRemove !== undefined && tcfListeners[idToRemove]) {
        delete tcfListeners[idToRemove];
        callback(true, true);
      } else {
        callback(false, false);
      }
      return;
    }

    if (command === "getTCData") {
      callback(buildTCData(lastTCFEventStatus), true);
      return;
    }

    // Unsupported command
    callback(null, false);
  }

  function initTCFEngine() {
    var existingQueue = [];
    if (typeof window !== "undefined") {
      if (typeof window.__tcfapi === "function" && Array.isArray(window.__tcfapi.queue)) {
        existingQueue = window.__tcfapi.queue.slice();
      }

      window.__tcfapi = handleTCFCommand;
      window.__tcfapi.queue = [];

      // Ensure locator iframe exists
      try {
        if (!window.frames["__tcfapiLocator"]) {
          if (document.body) {
            var iframe = document.createElement("iframe");
            iframe.style.cssText = "display:none";
            iframe.name = "__tcfapiLocator";
            document.body.appendChild(iframe);
          } else {
            window.addEventListener("DOMContentLoaded", function () {
              if (!window.frames["__tcfapiLocator"] && document.body) {
                var iframe = document.createElement("iframe");
                iframe.style.cssText = "display:none";
                iframe.name = "__tcfapiLocator";
                document.body.appendChild(iframe);
              }
            });
          }
        }
      } catch (e) {}

      // PostMessage bridge for cross-origin frame calls
      window.addEventListener("message", function (event) {
        var data = event.data;
        var isString = typeof data === "string";
        var json = {};
        if (isString) {
          try { json = JSON.parse(data); } catch (e) {}
        } else {
          json = data;
        }
        var call = json && json.__tcfapiCall;
        if (call && typeof window.__tcfapi === "function") {
          window.__tcfapi(call.command, call.version, function (ret, success) {
            var returnMsg = {
              __tcfapiReturn: {
                returnValue: ret,
                success: success,
                callId: call.callId
              }
            };
            if (event.source && event.source.postMessage) {
              event.source.postMessage(isString ? JSON.stringify(returnMsg) : returnMsg, "*");
            }
          }, call.parameter);
        }
      }, false);

      // Drain queued calls
      for (var i = 0; i < existingQueue.length; i++) {
        var item = existingQueue[i];
        if (Array.isArray(item) && item.length >= 3) {
          handleTCFCommand(item[0], item[1], item[2], item[3]);
        }
      }
    }
  }

  initTCFEngine();

  // 1. CONSENT MANAGEMENT PLATFORM (CMP) CORE STATE
  function getStoredConsent() {
    try {
      var item = localStorage.getItem(STORAGE_KEY);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      return null;
    }
  }

  function setStoredConsent(consentObj) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consentObj));
    } catch (e) {}
  }

  function getEffectiveConsent() {
    var stored = getStoredConsent();
    var isGPC = isGPCSignal && (!activeConfig || activeConfig.enable_gpc !== false);

    if (isGPC) {
      if (stored && stored.gpc_explicit_override) {
        return stored;
      }
      var base = stored || {
        necessary: true,
        functional: false,
        analytics: false,
        performance: false,
        advertisement: false,
        consent_version: (activeConfig && activeConfig.consent_version) || "1.0",
      };
      return {
        consent_given: Boolean(base.functional || base.performance),
        necessary: true,
        functional: Boolean(base.functional),
        analytics: false,
        performance: Boolean(base.performance),
        advertisement: false,
        gpc_applied: true,
        consent_version: base.consent_version || (activeConfig && activeConfig.consent_version) || "1.0",
      };
    }

    if (stored) {
      return stored;
    }

    if (activeConfig) {
      if (!activeConfig.is_enabled || activeConfig.law_template === "notice_only") {
        return {
          consent_given: true,
          necessary: true,
          functional: true,
          analytics: true,
          performance: true,
          advertisement: true,
          consent_version: activeConfig.consent_version || "1.0",
        };
      }
      if (activeConfig.law_template === "ccpa") {
        return {
          consent_given: true,
          necessary: true,
          functional: activeConfig.default_functional !== false,
          analytics: activeConfig.default_analytics !== false,
          performance: activeConfig.default_performance !== false,
          advertisement: activeConfig.default_advertisement !== false,
          consent_version: activeConfig.consent_version || "1.0",
        };
      }
      return null;
    }

    return null;
  }

  function isAnalyticsPermitted() {
    var effective = getEffectiveConsent();
    if (effective) {
      return Boolean(effective.analytics);
    }
    return false;
  }

  // 2. COOKIELESS ANALYTICS ENGINE (CONSENT-GATED)
  function sendEvent(name, props) {
    if (!isAnalyticsPermitted()) {
      return;
    }

    var payload = {
      domain: domain,
      name: name || "pageview",
      url: window.location.href,
      referrer: document.referrer || null,
      screen_width: window.innerWidth,
      props: props || null,
    };

    var body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      navigator.sendBeacon(analyticsEndpoint, body);
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", analyticsEndpoint, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(body);
    }
  }

  var lastUrl = window.location.href;
  function triggerPageview() {
    if (!isAnalyticsPermitted()) {
      return;
    }
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
    }
    sendEvent("pageview");
  }

  // SPA History Listeners
  var history = window.history;
  if (history && history.pushState) {
    var originalPush = history.pushState;
    history.pushState = function () {
      originalPush.apply(this, arguments);
      setTimeout(triggerPageview, 50);
    };

    var originalReplace = history.replaceState;
    history.replaceState = function () {
      originalReplace.apply(this, arguments);
      setTimeout(triggerPageview, 50);
    };

    window.addEventListener("popstate", triggerPageview);
  }

  function triggerConsentListeners(consent) {
    for (var i = 0; i < consentListeners.length; i++) {
      try {
        consentListeners[i](consent);
      } catch (e) {
        if (typeof console !== "undefined" && console.error) console.error(e);
      }
    }
  }

  function dispatchGoogleConsent(consent) {
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }

    var consentPayload = {
      analytics_storage: consent.analytics ? "granted" : "denied",
      ad_storage: (consent.advertisement || consent.marketing) ? "granted" : "denied",
      ad_user_data: (consent.advertisement || consent.marketing) ? "granted" : "denied",
      ad_personalization: (consent.advertisement || consent.marketing) ? "granted" : "denied",
      functionality_storage: consent.functional ? "granted" : "denied",
      personalization_storage: consent.performance ? "granted" : "denied",
      security_storage: "granted",
    };

    try {
      gtag("consent", "update", consentPayload);
      window.dataLayer.push({
        event: "userly_consent_update",
        userly_consent: consent,
      });
    } catch (e) {}
  }

  function unblockGatedScripts(consent) {
    var gatedScripts = document.querySelectorAll(
      'script[type="text/userly-block"], script[type="text/usrly-block"]'
    );
    for (var i = 0; i < gatedScripts.length; i++) {
      var script = gatedScripts[i];
      var category = (script.getAttribute("data-category") || "").toLowerCase().trim();

      var isAllowed = false;
      if (category === "necessary") isAllowed = true;
      else if (category === "functional" && consent.functional) isAllowed = true;
      else if (category === "analytics" && consent.analytics) isAllowed = true;
      else if (category === "performance" && consent.performance) isAllowed = true;
      else if ((category === "advertisement" || category === "marketing") && (consent.advertisement || consent.marketing)) isAllowed = true;
      else if (!category && (consent.consent_given || consent.advertisement || consent.analytics)) isAllowed = true;

      if (isAllowed) {
        var unblocked = document.createElement("script");
        for (var a = 0; a < script.attributes.length; a++) {
          var attr = script.attributes[a];
          if (attr.name !== "type" && attr.name !== "data-category") {
            unblocked.setAttribute(attr.name, attr.value);
          }
        }
        unblocked.setAttribute("type", "text/javascript");
        unblocked.innerHTML = script.innerHTML;
        if (script.parentNode) {
          script.parentNode.replaceChild(unblocked, script);
        }
      }
    }
  }

  function logConsentReceipt(consent, version) {
    var payload = {
      domain: domain,
      consent_given: consent.consent_given,
      necessary: true,
      functional: !!consent.functional,
      analytics: !!consent.analytics,
      performance: !!consent.performance,
      advertisement: !!(consent.advertisement || consent.marketing),
      user_agent_category: /mobile/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
      consent_version: version || (activeConfig && activeConfig.consent_version) || "1.0",
      country: (activeConfig && activeConfig.visitor_country) || undefined,
    };

    var body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(consentLogEndpoint, body);
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", consentLogEndpoint, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(body);
    }
  }

  function checkAndRenderPolicyDeclaration(storedConsent) {
    var declarationEl = document.getElementById("usrly-cookie-declaration") || document.getElementById("usrly-cookie-policy");
    if (!declarationEl) return;

    var isGranted = function(cat) {
      if (!storedConsent) return "Pending Consent";
      if (cat === "necessary") return "Always Active";
      return storedConsent[cat] ? "Active / Consented" : "Disabled / Blocked";
    };

    function renderDeclaration(cookiesList) {
      var itemizedRows = "";
      if (cookiesList && cookiesList.length > 0) {
        for (var k = 0; k < cookiesList.length; k++) {
          var c = cookiesList[k];
          var catKey = (c.category || "functional").toLowerCase();
          var statusText = isGranted(catKey);
          var statusColor = catKey === "necessary" ? "#16a34a" : (storedConsent && storedConsent[catKey] ? "#1868db" : "#dc2626");
          if (!storedConsent) statusColor = "#64748b";

          itemizedRows += '<tr style="border-bottom: 1px solid #f1f5f9;">' +
            '<td style="padding: 9px 12px; font-weight: 700; color: #0f172a; font-family: monospace;">' + (c.name || "") + '</td>' +
            '<td style="padding: 9px 12px; text-transform: capitalize; color: #475569;">' + catKey + '</td>' +
            '<td style="padding: 9px 12px; color: #475569;">' + (c.service_name || "First Party") + '</td>' +
            '<td style="padding: 9px 12px; color: #64748b;">' + (c.duration || "Session") + '</td>' +
            '<td style="padding: 9px 12px; color: #475569;">' + (c.description || "Maintains site operation and services.") + '</td>' +
            '<td style="padding: 9px 12px; font-weight: 700; color: ' + statusColor + ';">' + statusText + '</td>' +
          '</tr>';
        }
      }

      var itemizedSection = "";
      if (itemizedRows) {
        itemizedSection = '<div style="margin-top: 24px;">' +
          '<h4 style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0;">Itemized Cookie Audit Inventory</h4>' +
          '<div style="overflow-x: auto;">' +
            '<table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">' +
              '<thead>' +
                '<tr style="background: #f8fbff; border-bottom: 2px solid #e0ebf8; color: #64748b; font-weight: 700;">' +
                  '<th style="padding: 9px 12px;">Cookie</th>' +
                  '<th style="padding: 9px 12px;">Category</th>' +
                  '<th style="padding: 9px 12px;">Provider</th>' +
                  '<th style="padding: 9px 12px;">Duration</th>' +
                  '<th style="padding: 9px 12px;">Purpose</th>' +
                  '<th style="padding: 9px 12px;">Current Status</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody>' + itemizedRows + '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>';
      }

      declarationEl.innerHTML = \`
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.6; border: 1px solid #e0ebf8; border-radius: 6px; padding: 24px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e0ebf8; padding-bottom: 16px; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
            <div>
              <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0;">Cookie Declaration for \${domain}</h3>
              <p style="font-size: 12px; color: #64748b; margin: 0;">Verified and updated dynamically by Userly CMP</p>
            </div>
            <button id="usrly-open-prefs-btn" style="background: #1868db; color: #ffffff; border: none; padding: 8px 16px; font-size: 12px; font-weight: 700; border-radius: 4px; cursor: pointer; transition: background 0.2s;">
              Change Consent Preferences
            </button>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; text-align: left;">
            <thead>
              <tr style="background: #f8fbff; border-bottom: 2px solid #e0ebf8; color: #64748b; font-weight: 700;">
                <th style="padding: 10px 12px;">Category</th>
                <th style="padding: 10px 12px;">Purpose</th>
                <th style="padding: 10px 12px;">Current Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 12px; font-weight: 700; color: #0f172a;">Necessary</td>
                <td style="padding: 10px 12px; color: #475569;">Essential for website security, user authentication, and preference storage.</td>
                <td style="padding: 10px 12px; color: #16a34a; font-weight: 700;">Always Active</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 12px; font-weight: 700; color: #0f172a;">Functional</td>
                <td style="padding: 10px 12px; color: #475569;">Social media sharing widgets, user feedback, and interactive tools.</td>
                <td style="padding: 10px 12px; font-weight: 600; color: #1868db;">\${isGranted("functional")}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 12px; font-weight: 700; color: #0f172a;">Analytics</td>
                <td style="padding: 10px 12px; color: #475569;">Aggregated cookieless traffic metrics, bounce rate, and referrer data.</td>
                <td style="padding: 10px 12px; font-weight: 600; color: #1868db;">\${isGranted("analytics")}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 12px; font-weight: 700; color: #0f172a;">Performance</td>
                <td style="padding: 10px 12px; color: #475569;">Page speed monitoring, latency analysis, and crash reporting.</td>
                <td style="padding: 10px 12px; font-weight: 600; color: #1868db;">\${isGranted("performance")}</td>
              </tr>
              <tr>
                <td style="padding: 10px 12px; font-weight: 700; color: #0f172a;">Advertisement</td>
                <td style="padding: 10px 12px; color: #475569;">Targeted advertising scripts (Meta Pixel, Google Ads, TikTok).</td>
                <td style="padding: 10px 12px; font-weight: 600; color: #1868db;">\${isGranted("advertisement")}</td>
              </tr>
            </tbody>
          </table>
          \${itemizedSection}
        </div>
      \`;

      var btn = declarationEl.querySelector("#usrly-open-prefs-btn");
      if (btn) {
        btn.onclick = function() {
          if (activeConfig) {
            renderCMP(activeConfig, true);
          } else {
            fetchConfigAndRender(true);
          }
        };
      }
    }

    if (cachedPolicyCookies !== null) {
      renderDeclaration(cachedPolicyCookies);
    } else {
      renderDeclaration([]);
      var pxhr = new XMLHttpRequest();
      pxhr.open("GET", policyEndpoint, true);
      pxhr.onload = function() {
        if (pxhr.status === 200) {
          try {
            var pData = JSON.parse(pxhr.responseText);
            cachedPolicyCookies = pData.cookies || [];
            renderDeclaration(cachedPolicyCookies);
          } catch(e) {}
        }
      };
      pxhr.send();
    }
  }

  function fetchConfigAndRender(openPreferencesDirectly) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", consentConfigEndpoint, true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          activeConfig = JSON.parse(xhr.responseText);
          activeLanguage = detectVisitorLanguage(activeConfig);
          renderCMP(activeConfig, openPreferencesDirectly);
        } catch (e) {}
      }
    };
    xhr.send();
  }

  function initCMP() {
    var stored = getStoredConsent();
    checkAndRenderPolicyDeclaration(stored);

    var xhr = new XMLHttpRequest();
    xhr.open("GET", consentConfigEndpoint, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            var config = JSON.parse(xhr.responseText);
            activeConfig = config;
            activeLanguage = detectVisitorLanguage(config);

            if (!config.is_enabled) {
              triggerPageview();
              return;
            }

            var effective = getEffectiveConsent();

            // GPC Signal Check: if GPC enabled & signal present & no explicit override
            var isGPC = config.enable_gpc !== false && isGPCSignal;
            if (isGPC && (!stored || !stored.gpc_explicit_override)) {
              var gpcConsent = {
                consent_given: false,
                necessary: true,
                functional: false,
                analytics: false,
                performance: false,
                advertisement: false,
                gpc_applied: true,
                consent_version: config.consent_version || "1.0",
                timestamp: new Date().toISOString(),
              };
              setStoredConsent(gpcConsent);
              dispatchGoogleConsent(gpcConsent);
              triggerConsentListeners(gpcConsent);
              notifyTCFListeners("tcloaded");
              if (config.show_revisit_button) {
                renderRevisitButtonOnly(gpcConsent);
              }
              return;
            }

            // Version check: re-prompt if consent_version upgraded
            if (stored && config.consent_version && stored.consent_version && stored.consent_version !== config.consent_version) {
              renderCMP(config);
              return;
            }

            if (stored) {
              if (effective && effective.analytics) {
                triggerPageview();
              }
              dispatchGoogleConsent(effective || stored);
              unblockGatedScripts(effective || stored);
              triggerConsentListeners(effective || stored);
              notifyTCFListeners("tcloaded");
              if (config.show_revisit_button) {
                renderRevisitButtonOnly(effective || stored);
              }
            } else {
              if (effective && effective.analytics) {
                triggerPageview();
              }
              renderCMP(config);
            }
          } catch (e) {
            if (isAnalyticsPermitted()) {
              triggerPageview();
            }
          }
        } else {
          if (isAnalyticsPermitted()) {
            triggerPageview();
          }
        }
      }
    };
    xhr.send();
  }

  function renderRevisitButtonOnly(storedConsent) {
    var existingRoots = document.querySelectorAll("#usrly-cmp-root, #usrly-revisit-root");
    for (var r = 0; r < existingRoots.length; r++) {
      existingRoots[r].remove();
    }

    var host = document.createElement("div");
    host.id = "usrly-revisit-root";
    document.body.appendChild(host);
    var shadow = host.attachShadow({ mode: "open" });

    var posClass = "pos-bottom-left";
    var posStyle = "bottom: 18px; left: 18px;";
    if (activeConfig && activeConfig.revisit_button_position === "bottom_right") {
      posStyle = "bottom: 18px; right: 18px;";
    }

    var style = document.createElement("style");
    style.textContent = \`
      .usrly-revisit-btn {
        position: fixed;
        \${posStyle}
        z-index: 2147483645;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: \${(activeConfig && activeConfig.primary_color) || "#1868db"};
        color: #ffffff;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(24, 104, 219, 0.35);
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s;
      }
      .usrly-revisit-btn:hover {
        transform: scale(1.08);
        box-shadow: 0 6px 20px rgba(24, 104, 219, 0.45);
      }
      .usrly-revisit-btn svg {
        width: 22px;
        height: 22px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    \`;
    shadow.appendChild(style);

    var btn = document.createElement("button");
    btn.className = "usrly-revisit-btn";
    btn.title = "Consent Preferences";
    btn.setAttribute("aria-label", "Cookie Consent Preferences");
    btn.innerHTML = \`
      <svg viewBox="0 0 24 24">
        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
        <path d="M8.5 8.5v.01" />
        <path d="M7.5 15.5v.01" />
        <path d="M12 12v.01" />
        <path d="M15.5 15.5v.01" />
      </svg>
    \`;
    btn.onclick = function () {
      host.remove();
      if (activeConfig) {
        renderCMP(activeConfig, true);
      } else {
        fetchConfigAndRender(true);
      }
    };
    shadow.appendChild(btn);
  }

  function renderCMP(config, openPreferencesDirectly) {
    cmpUiIsVisible = true;
    notifyTCFListeners("cmpuishown");
    var existingRoots = document.querySelectorAll("#usrly-cmp-root, #usrly-revisit-root");
    for (var r = 0; r < existingRoots.length; r++) {
      existingRoots[r].remove();
    }

    var host = document.createElement("div");
    host.id = "usrly-cmp-root";
    document.body.appendChild(host);

    var shadow = host.attachShadow({ mode: "open" });
    var primaryColor = config.primary_color || "#1868db";
    var isDark = config.theme === "dark";
    var layout = config.layout || "bottom_bar";

    var radiusMap = {
      "rounded-none": "0px",
      "rounded-sm": "4px",
      "rounded-md": "8px",
      "rounded-lg": "12px",
      "rounded-full": "24px",
    };
    var borderRadius = radiusMap[config.border_radius] || "8px";

    var bgCard = isDark ? "#0f172a" : "#ffffff";
    var textPrimary = isDark ? "#f8fafc" : "#0f172a";
    var textMuted = isDark ? "#94a3b8" : "#475569";
    var borderCard = isDark ? "#334155" : "#e2e8f0";

    var layoutStyles = "";
    if (layout === "top_bar") {
      layoutStyles = \`
        .usrly-banner-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          border-bottom: 1px solid \${borderCard};
          border-radius: 0;
        }
      \`;
    } else if (layout === "floating_bottom_left" || (layout === "box" && config.revisit_button_position !== "bottom_right")) {
      layoutStyles = \`
        .usrly-banner-wrapper {
          position: fixed;
          bottom: 24px;
          left: 24px;
          max-width: 440px;
          width: calc(100% - 32px);
          border-radius: \${borderRadius};
          border: 1px solid \${borderCard};
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.2);
        }
        .usrly-banner-inner {
          flex-direction: column !important;
          align-items: flex-start !important;
        }
        .usrly-btn-group {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          width: 100% !important;
          gap: 6px !important;
        }
        .usrly-btn-group .usrly-btn {
          width: 100% !important;
          padding: 8px 4px !important;
          font-size: 12px !important;
          text-align: center !important;
          text-overflow: ellipsis;
          overflow: hidden;
        }
      \`;
    } else if (layout === "floating_bottom_right" || (layout === "box" && config.revisit_button_position === "bottom_right") || layout === "floating_box") {
      layoutStyles = \`
        .usrly-banner-wrapper {
          position: fixed;
          bottom: 24px;
          right: 24px;
          max-width: 440px;
          width: calc(100% - 32px);
          border-radius: \${borderRadius};
          border: 1px solid \${borderCard};
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.2);
        }
        .usrly-banner-inner {
          flex-direction: column !important;
          align-items: flex-start !important;
        }
        .usrly-btn-group {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          width: 100% !important;
          gap: 6px !important;
        }
        .usrly-btn-group .usrly-btn {
          width: 100% !important;
          padding: 8px 4px !important;
          font-size: 12px !important;
          text-align: center !important;
          text-overflow: ellipsis;
          overflow: hidden;
        }
      \`;
    } else if (layout === "center_modal" || layout === "popup" || layout === "modal") {
      layoutStyles = \`
        .usrly-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(2px);
          z-index: 2147483645;
        }
        .usrly-banner-wrapper {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          max-width: 440px;
          width: calc(100% - 32px);
          border-radius: \${borderRadius};
          border: 1px solid \${borderCard};
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
          z-index: 2147483646;
        }
        .usrly-banner-inner {
          flex-direction: column !important;
          align-items: flex-start !important;
        }
        .usrly-btn-group {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          width: 100% !important;
          gap: 6px !important;
        }
        .usrly-btn-group .usrly-btn {
          width: 100% !important;
          padding: 8px 4px !important;
          font-size: 12px !important;
          text-align: center !important;
          text-overflow: ellipsis;
          overflow: hidden;
        }
      \`;
    } else {
      // Default bottom_bar
      layoutStyles = \`
        .usrly-banner-wrapper {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          border-top: 1px solid \${borderCard};
          border-radius: 0;
        }
      \`;
    }

    var style = document.createElement("style");
    style.textContent = \`
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-weight: 300; -webkit-font-smoothing: antialiased; }
      
      .usrly-banner-wrapper {
        z-index: 2147483646;
        background: \${bgCard};
        box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.08);
        padding: 20px 24px;
        color: \${textPrimary};
        animation: usrlySlideUp 0.3s ease-out;
      }
      \${layoutStyles}
      @keyframes usrlySlideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .usrly-banner-inner {
        max-width: 1280px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      @media (min-width: 768px) {
        .usrly-banner-inner {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
        }
      }
      .usrly-banner-text {
        flex: 1;
      }
      .usrly-banner-title {
        font-size: 15px;
        font-weight: 500;
        letter-spacing: -0.01em;
        color: \${textPrimary};
        margin-bottom: 4px;
      }
      .usrly-banner-desc {
        font-size: 13px;
        font-weight: 300;
        color: \${textMuted};
        line-height: 1.55;
      }
      .usrly-banner-desc a {
        color: \${primaryColor};
        text-decoration: underline;
      }
      .usrly-btn-group {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      
      .usrly-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 400;
        border-radius: \${borderRadius};
        cursor: pointer;
        transition: all 0.15s ease;
        border: 1px solid transparent;
        text-decoration: none;
        white-space: nowrap;
      }
      .usrly-btn-primary {
        background: \${primaryColor};
        color: #ffffff;
        border-color: \${primaryColor};
      }
      .usrly-btn-primary:hover {
        filter: brightness(0.92);
      }
      .usrly-btn-outline {
        background: transparent;
        color: \${primaryColor};
        border-color: \${primaryColor};
      }
      .usrly-btn-outline:hover {
        background: \${isDark ? "rgba(24, 104, 219, 0.15)" : "#eff6ff"};
      }
      .usrly-btn-secondary {
        background: \${isDark ? "#1e293b" : "#ffffff"};
        color: \${textPrimary};
        border-color: \${borderCard};
      }
      .usrly-btn-secondary:hover {
        background: \${isDark ? "#334155" : "#f8fafc"};
      }

      @media (max-width: 640px) {
        .usrly-banner-inner {
          flex-direction: column !important;
          align-items: stretch !important;
        }
        .usrly-btn-group {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          width: 100% !important;
          gap: 6px !important;
        }
        .usrly-btn-group .usrly-btn {
          width: 100% !important;
          padding: 8px 4px !important;
          font-size: 11.5px !important;
          text-align: center !important;
          text-overflow: ellipsis;
          overflow: hidden;
        }
      }

      .usrly-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        animation: usrlyFadeIn 0.2s ease-out;
      }
      @keyframes usrlyFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .usrly-modal-card {
        background: \${bgCard};
        width: 100%;
        max-width: 680px;
        max-height: 90vh;
        border-radius: \${borderRadius};
        box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.35);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid \${borderCard};
      }
      .usrly-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 24px;
        border-bottom: 1px solid \${borderCard};
      }
      .usrly-modal-title {
        font-size: 16px;
        font-weight: 500;
        letter-spacing: -0.01em;
        color: \${textPrimary};
      }
      .usrly-modal-close {
        background: transparent;
        border: none;
        cursor: pointer;
        color: \${textMuted};
        font-size: 20px;
        line-height: 1;
        padding: 4px;
      }
      .usrly-modal-close:hover {
        color: \${textPrimary};
      }
      .usrly-modal-body {
        padding: 20px 24px;
        overflow-y: auto;
        flex: 1;
        font-size: 13px;
        font-weight: 300;
        color: \${textMuted};
        line-height: 1.55;
      }
      .usrly-intro-text {
        margin-bottom: 18px;
        color: \${textMuted};
        font-weight: 300;
      }

      .usrly-category-item {
        border-top: 1px solid \${borderCard};
        padding: 14px 0;
      }
      .usrly-cat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
      }
      .usrly-cat-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .usrly-cat-arrow {
        font-size: 12px;
        color: \${textMuted};
        transition: transform 0.2s;
      }
      .usrly-cat-arrow.expanded {
        transform: rotate(90deg);
      }
      .usrly-cat-title {
        font-size: 13.5px;
        font-weight: 500;
        color: \${textPrimary};
      }
      .usrly-cat-always-active {
        color: #16a34a;
        font-size: 11.5px;
        font-weight: 500;
      }
      .usrly-cat-desc {
        padding: 10px 0 4px 20px;
        font-size: 12.5px;
        color: \${textMuted};
        line-height: 1.5;
        display: none;
      }
      .usrly-cat-desc.visible {
        display: block;
      }

      .usrly-switch {
        position: relative;
        display: inline-block;
        width: 44px;
        height: 24px;
      }
      .usrly-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      .usrly-slider {
        position: absolute;
        cursor: pointer;
        inset: 0;
        background-color: \${isDark ? "#334155" : "#cbd5e1"};
        transition: 0.2s;
        border-radius: 24px;
      }
      .usrly-slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.2s;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0,0,0,0.15);
      }
      input:checked + .usrly-slider {
        background-color: \${primaryColor};
      }
      input:checked + .usrly-slider:before {
        transform: translateX(20px);
      }

      .usrly-modal-footer {
        padding: 16px 24px;
        border-top: 1px solid \${borderCard};
        display: flex;
        gap: 10px;
      }
      .usrly-modal-footer .usrly-btn {
        flex: 1;
        padding: 11px;
        font-size: 13.5px;
      }
      .usrly-google-policy-notice {
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 11px;
        margin-bottom: 14px;
        border: 1px solid \${borderCard};
        background: \${isDark ? "rgba(30, 41, 59, 0.6)" : "#f8fafc"};
        color: \${textMuted};
        line-height: 1.45;
      }
      .usrly-cookie-table-wrap {
        margin-top: 8px;
        border: 1px solid \${borderCard};
        border-radius: 4px;
        background: \${isDark ? "rgba(30, 41, 59, 0.5)" : "#f8fafc"};
        padding: 8px 10px;
        font-size: 11px;
        overflow-x: auto;
      }
      .usrly-cookie-table-header {
        display: grid;
        grid-template-columns: 35% 25% 40%;
        font-weight: 700;
        font-size: 10px;
        padding-bottom: 5px;
        border-bottom: 1px solid \${borderCard};
        color: \${textPrimary};
        min-width: 280px;
      }
      .usrly-cookie-table-row {
        display: grid;
        grid-template-columns: 35% 25% 40%;
        padding: 5px 0 3px 0;
        align-items: center;
        min-width: 280px;
        font-size: 10px;
        color: \${textMuted};
      }
      .usrly-cookie-table-row:not(:last-child) {
        border-bottom: 1px dashed \${isDark ? "rgba(51, 65, 85, 0.5)" : "#e2e8f0"};
      }
      .usrly-cookie-name {
        font-weight: 700;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        color: \${textPrimary};
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding-right: 6px;
      }
      .usrly-cookie-duration {
        color: \${textMuted};
        padding-right: 6px;
      }
      .usrly-cookie-desc {
        color: \${textMuted};
        font-size: 9.5px;
        line-height: 1.35;
      }
      .usrly-no-cookies-box {
        margin-top: 8px;
        border: 1px dashed \${borderCard};
        border-radius: 4px;
        padding: 8px 12px;
        text-align: center;
        font-size: 10.5px;
        font-style: italic;
        color: \${textMuted};
        background: \${isDark ? "rgba(30, 41, 59, 0.3)" : "rgba(248, 250, 252, 0.7)"};
      }
      .usrly-powered-bar {
        background: \${isDark ? "#0b1120" : "#f8fafc"};
        padding: 8px 24px;
        border-top: 1px solid \${borderCard};
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 6px;
        font-size: 11px;
        color: \${textMuted};
      }
      .usrly-powered-bar img {
        height: 14px;
        width: auto;
        display: inline-block;
        vertical-align: middle;
      }
    \`;
    shadow.appendChild(style);

    if (config.custom_css && typeof config.custom_css === "string" && config.custom_css.trim().length > 0) {
      var cssLower = config.custom_css.toLowerCase();
      var isUnsafe =
        cssLower.indexOf("<script") !== -1 ||
        cssLower.indexOf("</script") !== -1 ||
        cssLower.indexOf("javascript:") !== -1 ||
        cssLower.indexOf("expression(") !== -1 ||
        cssLower.indexOf("behavior:") !== -1 ||
        cssLower.indexOf("-moz-binding") !== -1 ||
        cssLower.indexOf("@import") !== -1;

      if (!isUnsafe) {
        var customStyle = document.createElement("style");
        customStyle.setAttribute("data-usrly-custom-css", "true");
        customStyle.textContent = config.custom_css;
        shadow.appendChild(customStyle);
      }
    }

    var eff = getEffectiveConsent();
    var stored = getStoredConsent();
    var isNoticeOnly = config.law_template === "notice_only";
    var isCCPA = config.law_template === "ccpa";
    var isOptInModel = !isCCPA && !isNoticeOnly;

    var functionalChecked = false;
    var analyticsChecked = false;
    var performanceChecked = false;
    var adChecked = false;

    if (eff) {
      functionalChecked = Boolean(eff.functional);
      analyticsChecked = Boolean(eff.analytics);
      performanceChecked = Boolean(eff.performance);
      adChecked = Boolean(eff.advertisement || eff.marketing);
    } else if (!isOptInModel) {
      functionalChecked = config.default_functional !== false;
      analyticsChecked = config.default_analytics !== false;
      performanceChecked = config.default_performance !== false;
      adChecked = config.default_advertisement !== false;
    } else {
      functionalChecked = Boolean(config.default_functional);
      analyticsChecked = Boolean(config.default_analytics);
      performanceChecked = Boolean(config.default_performance);
      adChecked = Boolean(config.default_advertisement);
    }

    function applyAndClose(consentData) {
      cmpUiIsVisible = false;
      consentData.consent_version = config.consent_version || "1.0";
      consentData.timestamp = new Date().toISOString();
      if (isGPCSignal) {
        consentData.gpc_explicit_override = true;
      }
      setStoredConsent(consentData);
      dispatchGoogleConsent(consentData);
      unblockGatedScripts(consentData);
      logConsentReceipt(consentData, config.consent_version);
      triggerConsentListeners(consentData);
      notifyTCFListeners("useractioncomplete");
      checkAndRenderPolicyDeclaration(consentData);

      if (consentData.analytics) {
        triggerPageview();
      }

      host.remove();
      if (config.show_revisit_button) {
        renderRevisitButtonOnly(consentData);
      }
    }

    function showPreferencesModal() {
      var existingBanner = shadow.querySelector(".usrly-banner-wrapper");
      if (existingBanner) existingBanner.style.display = "none";

      function renderCategoryCookieTable(catName) {
        if (config.show_cookie_list_on_banner === false) return "";

        var allCookies = (config && config.cookies && config.cookies.length > 0)
          ? config.cookies
          : (cachedPolicyCookies && cachedPolicyCookies.length > 0 ? cachedPolicyCookies : null);

        var catCookies = [];
        if (allCookies && allCookies.length > 0) {
          catCookies = allCookies.filter(function(c) {
            return (c.category || "").toLowerCase() === catName.toLowerCase();
          });
        } else {
          // Default standard cookies matching banner studio
          if (catName === "necessary") {
            catCookies = [
              { name: "usrly_consent", duration: "1 year", description: "Consent preferences state" },
              { name: "cf_clearance", duration: "30 days", description: "Cloudflare bot clearance" }
            ];
          } else if (catName === "functional") {
            catCookies = [
              { name: "i18n_lang", duration: "Session", description: "User language choice" }
            ];
          } else if (catName === "analytics") {
            catCookies = [
              { name: "_ga", duration: "2 years", description: "Google Analytics visitor ID" },
              { name: "_gid", duration: "24 hours", description: "Google Analytics session ID" }
            ];
          } else if (catName === "performance") {
            catCookies = [];
          } else if (catName === "advertisement") {
            catCookies = [
              { name: "_fbp", duration: "3 months", description: "Meta advertising pixel tracking" }
            ];
          }
        }

        if (!catCookies || catCookies.length === 0) {
          return '<div class="usrly-no-cookies-box">' +
            resolveText("no_cookies_to_display_label", config) +
            '</div>';
        }

        var colCookie = resolveText("cookie_column_label", config) || "Cookie";
        var colDuration = resolveText("duration_column_label", config) || "Duration";
        var colDesc = resolveText("description_column_label", config) || "Description";

        var html = '<div class="usrly-cookie-table-wrap">';
        html += '<div class="usrly-cookie-table-header">';
        html += '<span>' + colCookie + '</span>';
        html += '<span>' + colDuration + '</span>';
        html += '<span>' + colDesc + '</span>';
        html += '</div>';

        for (var i = 0; i < catCookies.length; i++) {
          var ck = catCookies[i];
          html += '<div class="usrly-cookie-table-row">';
          html += '<span class="usrly-cookie-name">' + (ck.name || "") + '</span>';
          html += '<span class="usrly-cookie-duration">' + (ck.duration || "Session") + '</span>';
          html += '<span class="usrly-cookie-desc">' + (ck.description || "-") + '</span>';
          html += '</div>';
        }
        html += '</div>';
        return html;
      }

      var overlay = document.createElement("div");
      overlay.className = "usrly-modal-overlay upfront-modal-overlay";

      overlay.innerHTML = \`
        <div class="usrly-modal-card upfront-modal">
          <div class="usrly-modal-header">
            <h3 class="usrly-modal-title">\${resolveText("preferences_title", config)}</h3>
            <button class="usrly-modal-close" id="usrly-close-modal" aria-label="Close">✕</button>
          </div>
          <div class="usrly-modal-body">
            <p class="usrly-intro-text">
              \${resolveText("preferences_description", config)}
            </p>

            \${config.show_google_privacy_policy ? \`
            <div class="usrly-google-policy-notice">
              \${config.google_policy_message || "For more information on how Google's third-party cookies operate, see"}{" "}
              <a href="\${config.google_policy_url || "https://business.safety.google/privacy"}" target="_blank" rel="noreferrer" style="color:\${primaryColor};font-weight:700;text-decoration:underline;">
                \${config.google_policy_link_text || "Google Privacy Policy"}
              </a>.
            </div>
            \` : ""}

            <div class="usrly-category-item">
              <div class="usrly-cat-header" data-target="desc-nec">
                <div class="usrly-cat-left">
                  <span class="usrly-cat-arrow">›</span>
                  <span class="usrly-cat-title">\${resolveCategoryTitle("necessary", config)}</span>
                </div>
                <span class="usrly-cat-always-active">\${resolveText("always_active_label", config)}</span>
              </div>
              <div class="usrly-cat-desc" id="desc-nec">
                <p style="margin-bottom:6px;">\${resolveCategoryDesc("necessary", config)}</p>
                \${renderCategoryCookieTable("necessary")}
              </div>
            </div>

            \${config.enable_functional_category !== false ? \`
            <div class="usrly-category-item">
              <div class="usrly-cat-header" data-target="desc-func">
                <div class="usrly-cat-left">
                  <span class="usrly-cat-arrow">›</span>
                  <span class="usrly-cat-title">\${resolveCategoryTitle("functional", config)}</span>
                </div>
                <label class="usrly-switch">
                  <input type="checkbox" id="usrly-toggle-func" \${functionalChecked ? "checked" : ""}>
                  <span class="usrly-slider"></span>
                </label>
              </div>
              <div class="usrly-cat-desc" id="desc-func">
                <p style="margin-bottom:6px;">\${resolveCategoryDesc("functional", config)}</p>
                \${renderCategoryCookieTable("functional")}
              </div>
            </div>
            \` : ""}

            \${config.enable_analytics_category !== false ? \`
            <div class="usrly-category-item">
              <div class="usrly-cat-header" data-target="desc-ana">
                <div class="usrly-cat-left">
                  <span class="usrly-cat-arrow">›</span>
                  <span class="usrly-cat-title">\${resolveCategoryTitle("analytics", config)}</span>
                </div>
                <label class="usrly-switch">
                  <input type="checkbox" id="usrly-toggle-ana" \${analyticsChecked ? "checked" : ""}>
                  <span class="usrly-slider"></span>
                </label>
              </div>
              <div class="usrly-cat-desc" id="desc-ana">
                <p style="margin-bottom:6px;">\${resolveCategoryDesc("analytics", config)}</p>
                \${renderCategoryCookieTable("analytics")}
              </div>
            </div>
            \` : ""}

            \${config.enable_performance_category !== false ? \`
            <div class="usrly-category-item">
              <div class="usrly-cat-header" data-target="desc-perf">
                <div class="usrly-cat-left">
                  <span class="usrly-cat-arrow">›</span>
                  <span class="usrly-cat-title">\${resolveCategoryTitle("performance", config)}</span>
                </div>
                <label class="usrly-switch">
                  <input type="checkbox" id="usrly-toggle-perf" \${performanceChecked ? "checked" : ""}>
                  <span class="usrly-slider"></span>
                </label>
              </div>
              <div class="usrly-cat-desc" id="desc-perf">
                <p style="margin-bottom:6px;">\${resolveCategoryDesc("performance", config)}</p>
                \${renderCategoryCookieTable("performance")}
              </div>
            </div>
            \` : ""}

            \${config.enable_advertisement_category !== false ? \`
            <div class="usrly-category-item">
              <div class="usrly-cat-header" data-target="desc-ad">
                <div class="usrly-cat-left">
                  <span class="usrly-cat-arrow">›</span>
                  <span class="usrly-cat-title">\${resolveCategoryTitle("advertisement", config)}</span>
                </div>
                <label class="usrly-switch">
                  <input type="checkbox" id="usrly-toggle-ad" \${adChecked ? "checked" : ""}>
                  <span class="usrly-slider"></span>
                </label>
              </div>
              <div class="usrly-cat-desc" id="desc-ad">
                <p style="margin-bottom:6px;">\${resolveCategoryDesc("advertisement", config)}</p>
                \${renderCategoryCookieTable("advertisement")}
              </div>
            </div>
            \` : ""}
          </div>

          <div class="usrly-modal-footer">
            <button class="usrly-btn usrly-btn-secondary" id="usrly-modal-reject">\${resolveText("pref_reject_all_label", config)}</button>
            <button class="usrly-btn usrly-btn-outline" id="usrly-modal-save">\${resolveText("save_preferences_label", config)}</button>
            <button class="usrly-btn usrly-btn-primary" id="usrly-modal-accept">\${resolveText("pref_accept_all_label", config)}</button>
          </div>

          \${config.show_branding !== false && !config.hide_branding ? \`
          <div class="usrly-powered-bar">
            <span>Powered by</span>
            <a href="https://upfront.io" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;">
              <img src="\${apiHost}/UpFront-Logo-Blue-500.svg" alt="Upfront" />
            </a>
          </div>
          \` : ""}
        </div>
      \`;

      shadow.appendChild(overlay);

      var headers = overlay.querySelectorAll(".usrly-cat-header");
      headers.forEach(function (h) {
        h.addEventListener("click", function (e) {
          if (e.target.tagName === "INPUT" || e.target.classList.contains("usrly-slider") || e.target.classList.contains("usrly-switch")) {
            return;
          }
          var targetId = h.getAttribute("data-target");
          var desc = overlay.querySelector("#" + targetId);
          var arrow = h.querySelector(".usrly-cat-arrow");
          if (desc) {
            var isVis = desc.classList.toggle("visible");
            if (arrow) arrow.classList.toggle("expanded", isVis);
          }
        });
      });

      function closeModal() {
        overlay.remove();
        if (existingBanner) {
          existingBanner.style.display = "block";
        } else {
          host.remove();
          if (config.show_revisit_button !== false) {
            renderRevisitButtonOnly(getStoredConsent() || stored);
          }
        }
      }

      overlay.querySelector("#usrly-close-modal").onclick = closeModal;
      overlay.onclick = function (e) {
        if (e.target === overlay) {
          closeModal();
        }
      };

      overlay.querySelector("#usrly-modal-accept").onclick = function () {
        applyAndClose({
          consent_given: true,
          necessary: true,
          functional: true,
          analytics: true,
          performance: true,
          advertisement: true,
        });
      };

      var modalReject = overlay.querySelector("#usrly-modal-reject");
      if (modalReject) {
        modalReject.onclick = function () {
          if (isCCPA) {
            applyAndClose({
              consent_given: false,
              necessary: true,
              functional: true,
              analytics: true,
              performance: true,
              advertisement: false,
              ccpa_opted_out: true,
            });
          } else {
            applyAndClose({
              consent_given: false,
              necessary: true,
              functional: false,
              analytics: false,
              performance: false,
              advertisement: false,
            });
          }
        };
      }

      overlay.querySelector("#usrly-modal-save").onclick = function () {
        var funcEl = overlay.querySelector("#usrly-toggle-func");
        var anaEl = overlay.querySelector("#usrly-toggle-ana");
        var perfEl = overlay.querySelector("#usrly-toggle-perf");
        var adEl = overlay.querySelector("#usrly-toggle-ad");

        var funcVal = funcEl ? funcEl.checked : false;
        var anaVal = anaEl ? anaEl.checked : false;
        var perfVal = perfEl ? perfEl.checked : false;
        var adVal = adEl ? adEl.checked : false;

        applyAndClose({
          consent_given: funcVal || anaVal || perfVal || adVal,
          necessary: true,
          functional: funcVal,
          analytics: anaVal,
          performance: perfVal,
          advertisement: adVal,
        });
      };
    }

    if (openPreferencesDirectly) {
      showPreferencesModal();
      return;
    }

    if (layout === "center_modal" || layout === "popup" || layout === "modal") {
      var backdrop = document.createElement("div");
      backdrop.className = "usrly-backdrop";
      shadow.appendChild(backdrop);
    }

    var banner = document.createElement("div");
    banner.className = "usrly-banner-wrapper upfront-banner";
    var closeBtnHtml = config.show_close_button
      ? \`<button class="usrly-modal-close" id="usrly-close-banner" aria-label="Close" style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:14px;cursor:pointer;color:\${textMuted};padding:4px;line-height:1;z-index:10;">✕</button>\`
      : "";
    banner.innerHTML = \`
      \${closeBtnHtml}
      <div class="usrly-banner-inner\${config.show_close_button ? " usrly-has-close" : ""}">
        <div class="usrly-banner-text">
          <div class="usrly-banner-title">\${resolveText("title", config)}</div>
          <div class="usrly-banner-desc">
            \${resolveText("description", config)}
            \${config.privacy_policy_url ? \`<a href="\${config.privacy_policy_url}" target="_blank" rel="noopener noreferrer">\${resolveText("read_privacy_policy", config)}</a>\` : ""}
          </div>
        </div>
        <div class="usrly-btn-group">
          \${!isNoticeOnly ? \`<button class="usrly-btn usrly-btn-outline" id="usrly-btn-customise">\${resolveText("preferences_label", config)}</button>\` : ""}
          \${!isNoticeOnly ? \`<button class="usrly-btn usrly-btn-secondary" id="usrly-btn-reject">\${resolveText("reject_all_label", config)}</button>\` : ""}
          <button class="usrly-btn usrly-btn-primary" id="usrly-btn-accept">\${resolveText("accept_all_label", config)}</button>
        </div>
      </div>
    \`;
    shadow.appendChild(banner);

    var btnCloseBanner = banner.querySelector("#usrly-close-banner");
    if (btnCloseBanner) {
      btnCloseBanner.onclick = function () {
        applyAndClose({
          consent_given: false,
          necessary: true,
          functional: false,
          analytics: false,
          performance: false,
          advertisement: false,
        });
      };
    }

    var btnAccept = banner.querySelector("#usrly-btn-accept");
    if (btnAccept) {
      btnAccept.onclick = function () {
        applyAndClose({
          consent_given: true,
          necessary: true,
          functional: true,
          analytics: true,
          performance: true,
          advertisement: true,
        });
      };
    }

    var btnReject = banner.querySelector("#usrly-btn-reject");
    if (btnReject) {
      btnReject.onclick = function () {
        if (isCCPA) {
          applyAndClose({
            consent_given: false,
            necessary: true,
            functional: true,
            analytics: true,
            performance: true,
            advertisement: false,
            ccpa_opted_out: true,
          });
        } else {
          applyAndClose({
            consent_given: false,
            necessary: true,
            functional: false,
            analytics: false,
            performance: false,
            advertisement: false,
          });
        }
      };
    }

    var btnCustomise = banner.querySelector("#usrly-btn-customise");
    if (btnCustomise) {
      btnCustomise.onclick = function () {
        showPreferencesModal();
      };
    }
  }

  // 3. EXPOSE DEVELOPER SDK ON window.Userly & window.usrly
  window.Userly = {
    track: function (eventName, props) {
      sendEvent(eventName, props);
    },
    showBanner: function () {
      if (activeConfig) {
        renderCMP(activeConfig, false);
      } else {
        fetchConfigAndRender(false);
      }
    },
    hideBanner: function () {
      var root = document.getElementById("usrly-cmp-root");
      if (root) root.remove();
    },
    showPreferences: function () {
      if (activeConfig) {
        renderCMP(activeConfig, true);
      } else {
        fetchConfigAndRender(true);
      }
    },
    getConsent: function () {
      return getStoredConsent();
    },
    hasConsent: function (category) {
      var c = getStoredConsent();
      if (!c) return false;
      if (category) return Boolean(c[category]);
      return Boolean(c.consent_given);
    },
    onConsent: function (callback) {
      if (typeof callback === "function") {
        consentListeners.push(callback);
        var current = getStoredConsent();
        if (current) {
          try { callback(current); } catch (e) {}
        }
      }
    },
    updateConsent: function (categories) {
      var stored = getStoredConsent() || { necessary: true };
      var wasAnalytics = Boolean(stored.analytics);
      var merged = Object.assign({}, stored, categories);
      merged.consent_given = Boolean(merged.functional || merged.analytics || merged.performance || merged.advertisement);
      setStoredConsent(merged);
      dispatchGoogleConsent(merged);
      unblockGatedScripts(merged);
      logConsentReceipt(merged);
      triggerConsentListeners(merged);
      notifyTCFListeners("useractioncomplete");
      if (!wasAnalytics && merged.analytics) {
        triggerPageview();
      }
    },
    resetConsent: function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      notifyTCFListeners("useractioncomplete");
      initCMP();
    },
    getTCData: function () {
      return buildTCData(lastTCFEventStatus);
    },
    isGPC: function () {
      return isGPCSignal;
    },
    isAnalyticsAllowed: function () {
      return isAnalyticsPermitted();
    },
    getLanguage: function () {
      return activeLanguage;
    },
    setLanguage: function (lang) {
      if (!lang || typeof lang !== "string") return;
      var clean = lang.toLowerCase().trim().split("-")[0];
      if (TRANSLATIONS[clean]) {
        activeLanguage = clean;
        try {
          localStorage.setItem("usrly_lang_" + domain, clean);
        } catch (e) {}
        if (cmpUiIsVisible && activeConfig) {
          renderCMP(activeConfig, false);
        }
      }
    },
    getSupportedLanguages: function () {
      return Object.keys(TRANSLATIONS);
    },
    resolveText: function (key, lang) {
      return resolveText(key, activeConfig, lang);
    },
    resolveCategoryTitle: function (catKey, lang) {
      return resolveCategoryTitle(catKey, activeConfig, lang);
    },
    resolveCategoryDesc: function (catKey, lang) {
      return resolveCategoryDesc(catKey, activeConfig, lang);
    },
    version: "2.1.0",
  };

  // =========================================================================
  // AUTO-UPDATING POLICY EMBED CONTAINER LOADER
  // =========================================================================
  function initPolicyEmbeds() {
    var policyContainers = document.querySelectorAll(
      "[id^='usrly-'], [id^='userly-'], [id^='upfront-'], [id^='consentos-'], [data-usrly-policy], [data-policy-id], [data-policy]"
    );
    if (!policyContainers || policyContainers.length === 0) return;

    for (var i = 0; i < policyContainers.length; i++) {
      (function (container) {
        var id = container.id || "";
        var explicitPolicy = container.getAttribute("data-usrly-policy") || container.getAttribute("data-policy-id") || container.getAttribute("data-policy");
        var containerDomain = container.getAttribute("data-domain") || domain;
        var policyId = "";

        if (explicitPolicy) {
          policyId = explicitPolicy.trim().toLowerCase();
        } else if (id) {
          if (id.indexOf("cookie-declaration") !== -1 || id.indexOf("cookies-policy") !== -1 || id.indexOf("cookie-policy") !== -1) {
            policyId = "cookies";
          } else if (id.indexOf("privacy") !== -1) {
            policyId = "privacy";
          } else if (id.indexOf("terms") !== -1) {
            policyId = "terms";
          } else if (id.indexOf("eula") !== -1) {
            policyId = "eula";
          } else if (id.indexOf("return") !== -1) {
            policyId = "return";
          } else if (id.indexOf("disclaimer") !== -1) {
            policyId = "disclaimer";
          } else if (id.indexOf("shipping") !== -1) {
            policyId = "shipping";
          } else if (id.indexOf("acceptable_use") !== -1 || id.indexOf("acceptable-use") !== -1) {
            policyId = "acceptable_use";
          }
        }

        if (!policyId) return;

        var endpoint = apiHost + "/api/v1/policies/" + encodeURIComponent(policyId) + "?domain=" + encodeURIComponent(containerDomain);

        fetch(endpoint)
          .then(function (res) {
            if (!res.ok) throw new Error("HTTP " + res.status);
            return res.json();
          })
          .then(function (data) {
            var html = data.contentHtml || data.content_html || "";
            if (!html && (data.contentMarkdown || data.content_markdown)) {
              var rawMd = data.contentMarkdown || data.content_markdown;
              var lines = rawMd.split(String.fromCharCode(10));
              var out = [];
              for (var j = 0; j < lines.length; j++) {
                var line = lines[j].trim();
                if (!line) {
                  out.push("<div style='height:12px;'></div>");
                } else if (line.indexOf("### ") === 0) {
                  out.push("<h3 style='font-size:14px;font-weight:600;color:#1e293b;margin:20px 0 6px;'>" + line.substring(4) + "</h3>");
                } else if (line.indexOf("## ") === 0) {
                  out.push("<h2 style='font-size:16px;font-weight:700;color:#0f172a;margin:28px 0 8px;'>" + line.substring(3) + "</h2>");
                } else if (line.indexOf("# ") === 0) {
                  out.push("<h1 style='font-size:24px;font-weight:700;color:#0f172a;margin-bottom:12px;'>" + line.substring(2) + "</h1>");
                } else if (line === "---") {
                  out.push("<hr style='border:0;border-top:1px solid #e2e8f0;margin:24px 0;'/>");
                } else {
                  var parts = line.split("**");
                  var formatted = "";
                  for (var k = 0; k < parts.length; k++) {
                    if (k % 2 === 1) {
                      formatted += "<strong style='font-weight:600;color:#0f172a;'>" + parts[k] + "</strong>";
                    } else {
                      formatted += parts[k];
                    }
                  }
                  out.push("<p style='margin:0 0 12px;color:#475569;font-size:14px;line-height:1.65;font-weight:400;'>" + formatted + "</p>");
                }
              }
              html = "<div style='font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;line-height:1.65;color:#475569;max-width:820px;margin:0 auto;padding:24px 16px;'>" + out.join("") + "</div>";
            }
            if (html) {
              container.innerHTML = html;
            }
          })
          .catch(function (err) {
            console.warn("[Usrly CMP] Failed to load policy embed for " + policyId + ":", err);
          });
      })(policyContainers[i]);
    }
  }

  window.usrly = function (eventName, props) {
    if (!isAnalyticsPermitted()) return;
    sendEvent(eventName, props);
  };
  window.usrly.initPolicyEmbeds = initPolicyEmbeds;
  window.userly = window.usrly;

  function onReady() {
    initCMP();
    initPolicyEmbeds();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }
  window.addEventListener("load", initPolicyEmbeds);
})();
`

export async function GET() {
  return new NextResponse(TRACKER_SCRIPT, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, must-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
