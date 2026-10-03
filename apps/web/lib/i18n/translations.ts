export interface CMPTranslationDictionary {
  title: string
  description: string
  accept_all_label: string
  reject_all_label: string
  preferences_label: string
  preferences_title: string
  preferences_description: string
  save_preferences_label: string
  pref_accept_all_label: string
  pref_reject_all_label: string
  always_active_label: string
  no_cookies_to_display_label: string
  cookie_column_label: string
  duration_column_label: string
  description_column_label: string
  necessary_title: string
  necessary_description: string
  functional_title: string
  functional_description: string
  analytics_title: string
  analytics_description: string
  performance_title: string
  performance_description: string
  advertisement_title: string
  advertisement_description: string
  blocked_content_alt_text: string
  revisit_button_label: string
  show_less_label?: string
  show_more_label?: string
}

export interface SupportedLanguageInfo {
  code: string
  name: string
  nativeName: string
  flag?: string
}

export const SUPPORTED_LANGUAGES: SupportedLanguageInfo[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
]

export const CMP_TRANSLATIONS: Record<string, CMPTranslationDictionary> = {
  en: {
    title: "We value your privacy",
    description:
      "We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking 'Accept All', you consent to our use of cookies.",
    accept_all_label: "Accept All",
    reject_all_label: "Reject All",
    preferences_label: "Customise",
    preferences_title: "Customise Consent Preferences",
    preferences_description:
      "We use cookies to help you navigate efficiently and perform certain functions. You will find detailed information about all cookies under each consent category below.",
    save_preferences_label: "Save My Preferences",
    pref_accept_all_label: "Accept All",
    pref_reject_all_label: "Reject All",
    always_active_label: "Always Active",
    no_cookies_to_display_label: "No cookies to display",
    cookie_column_label: "Cookie",
    duration_column_label: "Duration",
    description_column_label: "Description",
    necessary_title: "Necessary",
    necessary_description:
      "Necessary cookies are required to enable the basic features of this site, such as providing secure log-in or adjusting your consent preferences. These cookies do not store any personally identifiable data.",
    functional_title: "Functional",
    functional_description:
      "Functional cookies help perform certain functionalities like sharing the content of the website on social media platforms, collecting feedback, and other third-party features.",
    analytics_title: "Analytics",
    analytics_description:
      "Analytical cookies are used to understand how visitors interact with the website. These cookies help provide information on metrics such as the number of visitors, bounce rate, traffic source, etc.",
    performance_title: "Performance",
    performance_description:
      "Performance cookies are used to understand and analyze the key performance indexes of the website which helps in delivering a better user experience for the visitors.",
    advertisement_title: "Advertisement",
    advertisement_description:
      "Advertisement cookies are used to provide visitors with customized advertisements based on the pages you visited previously and to analyze the effectiveness of the ad campaigns.",
    blocked_content_alt_text: "Please accept cookies to access this content",
    revisit_button_label: "Consent Preferences",
  },
  de: {
    title: "Wir schätzen Ihre Privatsphäre",
    description:
      "Wir verwenden Cookies, um Ihr Surferlebnis zu verbessern, personalisierte Anzeigen oder Inhalte bereitzustellen und unseren Datenverkehr zu analysieren. Indem Sie auf „Alle akzeptieren“ klicken, stimmen Sie der Verwendung von Cookies zu.",
    accept_all_label: "Alle akzeptieren",
    reject_all_label: "Alle ablehnen",
    preferences_label: "Einstellungen anpassen",
    preferences_title: "Datenschutzeinstellungen anpassen",
    preferences_description:
      "Wir respektieren Ihre Datenschutzeinstellungen. Sie können festlegen, welche Cookie-Kategorien Sie auf dieser Website zulassen. Notwendige Cookies können nicht deaktiviert werden.",
    save_preferences_label: "Einstellungen speichern",
    pref_accept_all_label: "Alle akzeptieren",
    pref_reject_all_label: "Alle ablehnen",
    always_active_label: "Immer aktiv",
    no_cookies_to_display_label: "Keine Cookies vorhanden",
    cookie_column_label: "Cookie",
    duration_column_label: "Dauer",
    description_column_label: "Beschreibung",
    necessary_title: "Notwendig",
    necessary_description:
      "Notwendige Cookies sind für die Grundfunktionen der Website, Sicherheit und die Speicherung Ihrer Datenschutzeinstellungen unerlässlich.",
    functional_title: "Funktional",
    functional_description:
      "Funktionale Cookies ermöglichen erweiterte Funktionen wie Chat-Widgets, Video-Einbettungen und Social-Media-Sharing.",
    analytics_title: "Analytisch",
    analytics_description:
      "Analytische Cookies helfen uns zu verstehen, wie Besucher mit der Website interagieren, um die Benutzerfreundlichkeit zu verbessern.",
    performance_title: "Leistung",
    performance_description:
      "Leistungs-Cookies überwachen Ladezeiten, Server-Reaktionszeiten und Fehlerberichte für ein optimales Surferlebnis.",
    advertisement_title: "Werbung & Marketing",
    advertisement_description:
      "Marketing-Cookies werden verwendet, um Besuchern relevante Werbung anzuzeigen und die Wirksamkeit von Kampagnen zu messen.",
    blocked_content_alt_text: "Bitte akzeptieren Sie Cookies, um diesen Inhalt anzuzeigen",
    revisit_button_label: "Datenschutzeinstellungen",
  },
  fr: {
    title: "Nous respectons votre vie privée",
    description:
      "Nous utilisons des cookies pour améliorer votre expérience de navigation, diffuser des publicités ou des contenus personnalisés et analyser notre trafic. En cliquant sur « Tout accepter », vous consentez à notre utilisation des cookies.",
    accept_all_label: "Tout accepter",
    reject_all_label: "Tout refuser",
    preferences_label: "Personnaliser",
    preferences_title: "Personnaliser les préférences de consentement",
    preferences_description:
      "Nous respectons vos préférences de confidentialité. Vous pouvez choisir les catégories de cookies autorisées sur ce site. Les cookies nécessaires ne peuvent pas être désactivés.",
    save_preferences_label: "Enregistrer mes préférences",
    pref_accept_all_label: "Tout accepter",
    pref_reject_all_label: "Tout refuser",
    always_active_label: "Toujours actif",
    no_cookies_to_display_label: "Aucun cookie à afficher",
    cookie_column_label: "Cookie",
    duration_column_label: "Durée",
    description_column_label: "Description",
    necessary_title: "Nécessaires",
    necessary_description:
      "Les cookies nécessaires sont essentiels au bon fonctionnement du site, à la sécurité et à la mémorisation de vos choix de consentement.",
    functional_title: "Fonctionnels",
    functional_description:
      "Les cookies fonctionnels permettent d'activer des fonctionnalités enrichies telles que les vidéos, les widgets de chat et le partage social.",
    analytics_title: "Analytiques",
    analytics_description:
      "Les cookies d'analyse nous permettent de mesurer le trafic, les pages consultées et d'améliorer les performances du site.",
    performance_title: "Performance",
    performance_description:
      "Les cookies de performance analysent les temps de réponse et la rapidité d'affichage pour optimiser votre navigation.",
    advertisement_title: "Publicité & Marketing",
    advertisement_description:
      "Les cookies publicitaires sont utilisés pour vous présenter des annonces personnalisées pertinentes et mesurer l'impact des campagnes.",
    blocked_content_alt_text: "Veuillez accepter les cookies pour afficher ce contenu",
    revisit_button_label: "Préférences de cookies",
  },
  es: {
    title: "Valoramos su privacidad",
    description:
      "Utilizamos cookies para mejorar su experiencia de navegación, ofrecer contenido o publicidad personalizados y analizar nuestro tráfico. Al hacer clic en «Aceptar todo», acepta nuestro uso de cookies.",
    accept_all_label: "Aceptar todo",
    reject_all_label: "Rechazar todo",
    preferences_label: "Personalizar",
    preferences_title: "Personalizar preferencias de consentimiento",
    preferences_description:
      "Respetamos sus preferencias de privacidad. Puede elegir qué categorías de cookies permite en este sitio web. Las cookies esenciales no se pueden desactivar.",
    save_preferences_label: "Guardar preferencias",
    pref_accept_all_label: "Aceptar todo",
    pref_reject_all_label: "Rechazar todo",
    always_active_label: "Siempre activo",
    no_cookies_to_display_label: "No hay cookies para mostrar",
    cookie_column_label: "Cookie",
    duration_column_label: "Duración",
    description_column_label: "Descripción",
    necessary_title: "Necesarias",
    necessary_description:
      "Las cookies necesarias son fundamentales para el funcionamiento seguro del sitio web y el almacenamiento de sus preferencias.",
    functional_title: "Funcionales",
    functional_description:
      "Las cookies funcionales permiten funciones avanzadas como reproducción de videos, herramientas interactivas y widgets de chat.",
    analytics_title: "Analíticas",
    analytics_description:
      "Las cookies analíticas ayudan a comprender cómo interactúan los visitantes con el sitio web para optimizar su rendimiento.",
    performance_title: "Rendimiento",
    performance_description:
      "Las cookies de rendimiento supervisan la velocidad de carga y la respuesta del servidor para una navegación fluida.",
    advertisement_title: "Publicidad & Marketing",
    advertisement_description:
      "Las cookies de marketing se utilizan para mostrar anuncios personalizados relevantes y medir la eficacia de las campañas.",
    blocked_content_alt_text: "Acepte las cookies para acceder a este contenido",
    revisit_button_label: "Preferencias de cookies",
  },
  pt: {
    title: "Valorizamos sua privacidade",
    description:
      "Utilizamos cookies para aprimorar sua experiência de navegação, exibir anúncios ou conteúdos personalizados e analisar nosso tráfego. Ao clicar em 'Aceitar todos', você concorda com o uso de cookies.",
    accept_all_label: "Aceitar todos",
    reject_all_label: "Rejeitar todos",
    preferences_label: "Personalizar",
    preferences_title: "Personalizar preferências de privacidade",
    preferences_description:
      "Respeitamos suas preferências de privacidade. Você pode personalizar quais categorias de cookies autoriza neste site. Cookies essenciais não podem ser desativados.",
    save_preferences_label: "Salvar preferências",
    pref_accept_all_label: "Aceitar todos",
    pref_reject_all_label: "Rejeitar todos",
    always_active_label: "Sempre ativo",
    no_cookies_to_display_label: "Nenhum cookie para exibir",
    cookie_column_label: "Cookie",
    duration_column_label: "Duração",
    description_column_label: "Descrição",
    necessary_title: "Necessários",
    necessary_description:
      "Cookies necessários são essenciais para o funcionamento básico do site, segurança e registro de suas escolhas de privacidade.",
    functional_title: "Funcionais",
    functional_description:
      "Cookies funcionais permitem recursos complementares como chat ao vivo, vídeos integrados e compartilhamento social.",
    analytics_title: "Analíticos",
    analytics_description:
      "Cookies analíticos nos ajudam a entender como os visitantes interagem com o site, permitindo aprimorar o serviço.",
    performance_title: "Desempenho",
    performance_description:
      "Cookies de desempenho monitoram a velocidade de carregamento e tempo de resposta do servidor.",
    advertisement_title: "Publicidade & Marketing",
    advertisement_description:
      "Cookies de marketing são usados para entregar anúncios personalizados e medir a eficácia das campanhas.",
    blocked_content_alt_text: "Por favor, aceite os cookies para visualizar este conteúdo",
    revisit_button_label: "Preferências de cookies",
  },
  it: {
    title: "Rispettiamo la tua privacy",
    description:
      "Utilizziamo i cookie per migliorare la tua esperienza di navigazione, mostrare annunci o contenuti personalizzati e analizzare il nostro traffico. Cliccando su 'Accetta tutti', acconsenti all'uso dei cookie.",
    accept_all_label: "Accetta tutti",
    reject_all_label: "Rifiuta tutti",
    preferences_label: "Personalizza",
    preferences_title: "Personalizza preferenze di consenso",
    preferences_description:
      "Rispettiamo le tue preferenze di privacy. Puoi scegliere quali categorie di cookie autorizzare. I cookie necessari non possono essere disattivati.",
    save_preferences_label: "Salva preferenze",
    pref_accept_all_label: "Accetta tutti",
    pref_reject_all_label: "Rifiuta tutti",
    always_active_label: "Sempre attivo",
    no_cookies_to_display_label: "Nessun cookie da visualizzare",
    cookie_column_label: "Cookie",
    duration_column_label: "Durata",
    description_column_label: "Descrizione",
    necessary_title: "Necessari",
    necessary_description:
      "I cookie necessari sono indispensabili per il corretto funzionamento del sito, la sicurezza e il salvataggio delle tue preferenze.",
    functional_title: "Funzionali",
    functional_description:
      "I cookie funzionali abilitano funzionalità avanzate come video, widget di chat e condivisione social.",
    analytics_title: "Statistici",
    analytics_description:
      "I cookie analitici ci aiutano a comprendere come i visitatori interagiscono con il sito per migliorarne le prestazioni.",
    performance_title: "Prestazioni",
    performance_description:
      "I cookie di prestazione monitorano la velocità del sito e la reattività del server.",
    advertisement_title: "Pubblicità & Marketing",
    advertisement_description:
      "I cookie di marketing vengono utilizzati per fornire pubblicità personalizzata e misurare l'efficacia delle campagne.",
    blocked_content_alt_text: "Accetta i cookie per visualizzare questo contenuto",
    revisit_button_label: "Preferenze cookie",
  },
  nl: {
    title: "Wij respecteren uw privacy",
    description:
      "Wij gebruiken cookies om uw browse-ervaring te verbeteren, gepersonaliseerde advertenties of inhoud te tonen en ons verkeer te analyseren. Door op 'Alles accepteren' te klikken, stemt u in met ons gebruik van cookies.",
    accept_all_label: "Alles accepteren",
    reject_all_label: "Alles weigeren",
    preferences_label: "Aanpassen",
    preferences_title: "Voorkeuren aanpassen",
    preferences_description:
      "Wij respecteren uw privacykeuzes. U kunt aangeven welke categorieën cookies u toestaat. Noodzakelijke cookies kunnen niet worden uitgeschakeld.",
    save_preferences_label: "Voorkeuren opslaan",
    pref_accept_all_label: "Alles accepteren",
    pref_reject_all_label: "Alles weigeren",
    always_active_label: "Altijd actief",
    no_cookies_to_display_label: "Geen cookies om weer te geven",
    cookie_column_label: "Cookie",
    duration_column_label: "Duur",
    description_column_label: "Beschrijving",
    necessary_title: "Noodzakelijk",
    necessary_description:
      "Noodzakelijke cookies zijn essentieel voor de basiswerking van de website, beveiliging en het onthouden van uw voorkeuren.",
    functional_title: "Functioneel",
    functional_description:
      "Functionele cookies maken extra functies mogelijk zoals video's, chatwidgets en knoppen voor sociale media.",
    analytics_title: "Analytisch",
    analytics_description:
      "Analytische cookies helpen ons inzicht te krijgen in het bezoekersgedrag om de website te optimaliseren.",
    performance_title: "Prestatie",
    performance_description:
      "Prestatiecookies monitoren de laadsnelheid en serverreactietijden voor een soepele gebruikservaring.",
    advertisement_title: "Advertenties & Marketing",
    advertisement_description:
      "Marketingcookies worden gebruikt om relevante advertenties te tonen en campagneresultaten te meten.",
    blocked_content_alt_text: "Accepteer cookies om deze inhoud te bekijken",
    revisit_button_label: "Cookievoorkeuren",
  },
  hi: {
    title: "हम आपकी गोपनीयता का सम्मान करते हैं",
    description:
      "हम आपके अनुभव को बेहतर बनाने, व्यक्तिगत विज्ञापन या सामग्री प्रस्तुत करने और ट्रैफ़िक का विश्लेषण करने के लिए कुकीज़ का उपयोग करते हैं। 'सभी स्वीकार करें' पर क्लिक करके, आप कुकीज़ के उपयोग की सहमति देते हैं।",
    accept_all_label: "सभी स्वीकार करें",
    reject_all_label: "सभी अस्वीकार करें",
    preferences_label: "अनुकूलित करें",
    preferences_title: "सहमति प्राथमिकताएं अनुकूलित करें",
    preferences_description:
      "हम आपकी गोपनीयता प्राथमिकताओं का सम्मान करते हैं। आप चुन सकते हैं कि आप किन श्रेणियों की कुकीज़ की अनुमति देते हैं। आवश्यक कुकीज़ को बंद नहीं किया जा सकता।",
    save_preferences_label: "प्राथमिकताएं सहेजें",
    pref_accept_all_label: "सभी स्वीकार करें",
    pref_reject_all_label: "सभी अस्वीकार करें",
    always_active_label: "हमेशा सक्रिय",
    no_cookies_to_display_label: "प्रदर्शित करने के लिए कोई कुकीज़ नहीं",
    cookie_column_label: "कुकी",
    duration_column_label: "अवधि",
    description_column_label: "विवरण",
    necessary_title: "आवश्यक",
    necessary_description:
      "वेबसाइट के बुनियादी संचालन, सुरक्षा और प्राथमिकताओं को सहेजने के लिए आवश्यक कुकीज़ अनिवार्य हैं।",
    functional_title: "कार्यात्मक",
    functional_description:
      "कार्यात्मक कुकीज़ वीडियो, चैट विजेट और सोशल शेयरिंग जैसी अतिरिक्त सुविधाएं सक्षम करती हैं।",
    analytics_title: "एनालिटिक्स",
    analytics_description:
      "एनालिटिक्स कुकीज़ हमें यह समझने में मदद करती हैं कि आगंतुक वेबसाइट के साथ कैसे इंटरैक्ट करते हैं।",
    performance_title: "प्रदर्शन",
    performance_description:
      "प्रदर्शन कुकीज़ वेबसाइट की लोडिंग गति और त्रुटि रिपोर्टिंग की निगरानी करती हैं।",
    advertisement_title: "विज्ञापन और मार्केटिंग",
    advertisement_description:
      "मार्केटिंग कुकीज़ का उपयोग प्रासंगिक विज्ञापन दिखाने और अभियानों की प्रभावशीलता मापने के लिए किया जाता है।",
    blocked_content_alt_text: "इस सामग्री को देखने के लिए कृपया कुकीज़ स्वीकार करें",
    revisit_button_label: "कुकी प्राथमिकताएं",
  },
}

export function resolveCMPText(
  key: keyof CMPTranslationDictionary,
  config: Record<string, any> | null,
  langCode?: string
): string {
  const lang = (langCode || (config && config.default_language) || "en").toLowerCase().split("-")[0] || "en"
  const englishDefault = CMP_TRANSLATIONS["en"]?.[key] || ""

  // Check category_configs nested dictionary if applicable
  if (config && config.category_configs) {
    for (const cat of ["necessary", "functional", "analytics", "performance", "advertisement"]) {
      if (key === `${cat}_title` && config.category_configs[cat]?.title) {
        return config.category_configs[cat].title
      }
      if (key === `${cat}_description` && config.category_configs[cat]?.description) {
        return config.category_configs[cat].description
      }
    }
  }

  // Resolve direct key or common alias keys from config
  let customVal = config ? config[key] : undefined
  if (config && (customVal === undefined || customVal === null || customVal === "")) {
    if (key === "preferences_description") {
      customVal = config.preferences_description ?? config.preference_description ?? config.preference_message
    } else if (key === "preferences_title") {
      customVal = config.preferences_title ?? config.preference_title
    } else if (key === "show_more_label") {
      customVal = config.show_more_label
    } else if (key === "show_less_label") {
      customVal = config.show_less_label
    }
  }

  // If customer provided custom text that is non-empty, manual copy takes precedence
  if (customVal && typeof customVal === "string" && customVal.trim().length > 0) {
    // If previewing non-default language and customVal is the standard English default, return translated dictionary
    if (lang !== "en" && lang !== (config?.default_language || "en") && customVal === englishDefault) {
      const dict = CMP_TRANSLATIONS[lang] || CMP_TRANSLATIONS["en"]
      return dict?.[key] || englishDefault
    }
    return customVal
  }

  // Otherwise, use dictionary translation for the resolved language
  const dict = CMP_TRANSLATIONS[lang] || CMP_TRANSLATIONS["en"]
  return dict?.[key] || englishDefault || ""
}

export function detectVisitorLanguage(
  config?: Record<string, any> | null,
  navLangs?: string[]
): string {
  if (typeof window !== "undefined") {
    try {
      const domain = config?.domain || "default"
      const stored = localStorage.getItem("usrly_lang_" + domain)
      if (stored && CMP_TRANSLATIONS[stored]) return stored
    } catch (e) {}
  }

  if (!config || config.enable_auto_language !== false) {
    const langs = navLangs || (typeof navigator !== "undefined" ? ((navigator.languages && navigator.languages.length > 0) ? Array.from(navigator.languages) : [navigator.language || "en"]) : [])
    for (const l of langs) {
      const clean = (l || "").toLowerCase().trim()
      if (CMP_TRANSLATIONS[clean]) return clean
      const primary = clean.split("-")[0] || ""
      if (primary && CMP_TRANSLATIONS[primary]) return primary
    }
  }

  if (config && config.default_language && CMP_TRANSLATIONS[config.default_language]) {
    return config.default_language
  }

  return "en"
}

