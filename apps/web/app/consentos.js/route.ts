import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

const SCRIPT_CACHE = new Map<string, { script: string; timestamp: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const domain = searchParams.get("domain") || "default"
    const isTest = searchParams.get("test") === "true"
    const firstDomainPart = domain.replace("https://", "").replace("http://", "").split("/")[0]
    const cleanDomain = (firstDomainPart || domain).toLowerCase()

    // 1. Check in-memory cache for ultra high throughput (sub-millisecond response)
    const cacheKey = `${cleanDomain}_${isTest}`
    const cached = SCRIPT_CACHE.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS && !isTest) {
      return new NextResponse(cached.script, {
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
          "Access-Control-Allow-Origin": "*",
        },
      })
    }

    let config: any = {
      is_enabled: true,
      layout: "bottom_bar",
      theme: "light",
      primary_color: "#1868db",
      border_radius: "rounded-md",
      title: "We value your privacy",
      description:
        "We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking 'Accept All', you consent to our use of cookies.",
      privacy_policy_url: "/privacy",
      accept_all_label: "Accept All",
      reject_all_label: "Reject All",
      preferences_label: "Customise",
      preferences_title: "Customise Consent Preferences",
      preferences_description:
        "We use cookies to help you navigate efficiently and perform certain functions. You will find detailed information about all cookies under each consent category below.",
      save_preferences_label: "Save My Preferences",
      always_active_label: "Always Active",
      no_cookies_to_display_label: "No cookies to display",
      cookie_column_label: "Cookie",
      duration_column_label: "Duration",
      description_column_label: "Description",
      enable_necessary_category: true,
      enable_functional_category: true,
      enable_analytics_category: true,
      enable_performance_category: true,
      enable_advertisement_category: true,
      show_revisit_button: true,
      revisit_button_position: "bottom_left",
      enable_consent_mode_v2: true,
      enable_gpc: true,
      geo_targeting: "all",
      enable_auto_language: true,
      default_language: "en",
      supported_languages: ["en", "de", "fr", "es", "pt", "it", "nl", "hi"],
      consent_version: "1.0",
    }

    if (domain !== "default") {
      const res = await pool.query(
        `SELECT * FROM consent_configs WHERE domain = $1 LIMIT 1`,
        [cleanDomain]
      ).catch(() => ({ rows: [] }))
      if (res.rows.length > 0 && res.rows[0]) {
        config = { ...config, ...res.rows[0] }
      }
    }

    // Fetch site discovered cookies for live table populator
    const cookiesRes = await pool.query(
      `SELECT name, category, service_name, duration, description, script_pattern_regex FROM discovered_cookies WHERE domain = $1 ORDER BY category ASC, name ASC`,
      [cleanDomain]
    ).catch(() => ({ rows: [] }))
    const siteCookies = cookiesRes.rows || []

    const script = `/**
 * ConsentOS CMP - Open Source Privacy & Consent Management Runtime
 * Version: 2.3.0 (IAB TCF v2.3, Google Consent Mode v2, GPC, Multilingual, Auto-Blocking)
 */
(function() {
  var domain = "${domain}";
  var isTest = ${isTest};
  var initialConfig = ${JSON.stringify(config)};
  var siteCookies = ${JSON.stringify(siteCookies)};
  var consentLogEndpoint = "${process.env.NEXT_PUBLIC_APP_URL || "https://usrly-five.vercel.app"}/api/v1/consent/log";

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
      necessary_description: "Necessary cookies are required to enable basic features of this site, such as providing secure log-in or adjusting your consent preferences.",
      functional_title: "Functional",
      functional_description: "Functional cookies allow enhanced functionality and personalization, such as live support chats and embedded multimedia content.",
      analytics_title: "Analytics",
      analytics_description: "Analytics cookies help us understand how visitors interact with the website to discover technical bugs and optimize user flows.",
      performance_title: "Performance",
      performance_description: "Performance cookies monitor site speed, server response times, and frontend error telemetry.",
      advertisement_title: "Advertisement",
      advertisement_description: "Marketing cookies enable personalized advertising and attribution tracking across third-party platforms.",
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
      necessary_description: "Las cookies necesarias son fundamentales para funciones básicas como inicio de sesión seguro y gestión de preferencias.",
      functional_title: "Funcionales",
      functional_description: "Las cookies funcionales permiten características mejoradas como chat en vivo y reproducción de video.",
      analytics_title: "Analíticas",
      analytics_description: "Las cookies analíticas nos ayudan a entender cómo los visitantes interactúan con el sitio web.",
      performance_title: "Rendimiento",
      performance_description: "Las cookies de rendimiento miden la velocidad del sitio y los tiempos de respuesta del servidor.",
      advertisement_title: "Publicidad",
      advertisement_description: "Las cookies publicitarias se utilizan para ofrecer anuncios relevantes y medir el rendimiento de las campañas.",
      blocked_content_alt_text: "Acepte las cookies para acceder a este contenido",
      revisit_button_label: "Preferencias de cookies",
      read_privacy_policy: "Leer política de privacidad"
    },
    pt: {
      title: "Valorizamos a sua privacidade",
      description: "Utilizamos cookies para melhorar a sua experiência de navegação, apresentar anúncios ou conteúdos personalizados e analisar o nosso tráfego. Ao clicar em 'Aceitar tudo', concorda com a nossa utilização de cookies.",
      accept_all_label: "Aceitar tudo",
      reject_all_label: "Rejeitar tudo",
      preferences_label: "Personalizar",
      preferences_title: "Personalizar preferências de consentimento",
      preferences_description: "Respeitamos as suas preferências de privacidade. Pode escolher que categorias de cookies autoriza neste site. Os cookies necessários não podem ser desativados.",
      save_preferences_label: "Guardar preferências",
      pref_accept_all_label: "Aceitar tudo",
      pref_reject_all_label: "Rejeitar tudo",
      always_active_label: "Sempre ativo",
      no_cookies_to_display_label: "Sem cookies para apresentar",
      cookie_column_label: "Cookie",
      duration_column_label: "Duração",
      description_column_label: "Descrição",
      necessary_title: "Necessários",
      necessary_description: "Os cookies necessários são essenciais para as funcionalidades básicas, segurança e registo de consentimento.",
      functional_title: "Funcionais",
      functional_description: "Os cookies funcionais permitem recursos avançados como chat de suporte e conteúdo multimédia incorporado.",
      analytics_title: "Analíticos",
      analytics_description: "Os cookies analíticos ajudam a compreender como os visitantes interagem com o site.",
      performance_title: "Desempenho",
      performance_description: "Os cookies de desempenho monitorizam a velocidade da página e diagnósticos de erro.",
      advertisement_title: "Publicidade",
      advertisement_description: "Os cookies de publicidade são usados para fornecer anúncios relevantes e avaliar campanhas de marketing.",
      blocked_content_alt_text: "Por favor, aceite os cookies para ver este conteúdo",
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

  function detectVisitorLanguage(cfg) {
    try {
      var visitorLang = localStorage.getItem("usrly_lang_" + domain);
      if (visitorLang && TRANSLATIONS[visitorLang]) {
        return visitorLang;
      }
    } catch (e) {}

    if (!cfg || cfg.enable_auto_language !== false) {
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

    if (cfg && cfg.default_language && TRANSLATIONS[cfg.default_language]) {
      return cfg.default_language;
    }

    return "en";
  }

  function resolveText(key, cfg, customLang) {
    var lang = customLang || activeLanguage || "en";
    var dict = TRANSLATIONS[lang] || TRANSLATIONS["en"];
    var enDefault = (TRANSLATIONS["en"] && TRANSLATIONS["en"][key]) || "";
    var customVal = cfg ? cfg[key] : undefined;

    if (cfg && (customVal === undefined || customVal === null || customVal === "")) {
      if (key === "preferences_description") {
        customVal = cfg.preferences_description || cfg.preference_description || cfg.preference_message;
      } else if (key === "preferences_title") {
        customVal = cfg.preferences_title || cfg.preference_title;
      } else if (key === "show_more_label") {
        customVal = cfg.show_more_label;
      } else if (key === "show_less_label") {
        customVal = cfg.show_less_label;
      }
    }

    if (customVal && typeof customVal === "string" && customVal.indexOf("We respect your privacy preferences") !== -1) {
      customVal = enDefault;
    }

    // Customer custom copy always takes precedence over automatic translation
    if (customVal && typeof customVal === "string" && customVal.trim().length > 0) {
      if (lang !== "en" && lang !== (cfg && cfg.default_language ? cfg.default_language : "en") && customVal === enDefault) {
        return (dict && dict[key]) || enDefault || "";
      }
      return customVal;
    }

    return (dict && dict[key]) || enDefault || "";
  }

  var isGPCSignal = initialConfig.enable_gpc && (navigator.globalPrivacyControl === true || window.globalPrivacyControl === true);

  // Initialize Google Consent Mode v2
  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  
  var existingConsent = getStoredConsent();
  if (initialConfig.enable_consent_mode_v2) {
    if (existingConsent) {
      gtag("consent", "default", {
        "ad_storage": existingConsent.advertisement ? "granted" : "denied",
        "analytics_storage": existingConsent.analytics ? "granted" : "denied",
        "ad_user_data": existingConsent.advertisement ? "granted" : "denied",
        "ad_personalization": existingConsent.advertisement ? "granted" : "denied",
        "personalization_storage": existingConsent.functional ? "granted" : "denied",
        "functionality_storage": existingConsent.functional ? "granted" : "denied",
        "security_storage": "granted",
        "wait_for_update": 500
      });
    } else {
      gtag("consent", "default", {
        "ad_storage": "denied",
        "analytics_storage": "denied",
        "ad_user_data": "denied",
        "ad_personalization": "denied",
        "personalization_storage": "denied",
        "functionality_storage": "denied",
        "security_storage": "granted",
        "wait_for_update": 500
      });
    }
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
    var isGPC = isGPCSignal && initialConfig.enable_gpc !== false && !c.gpc_explicit_override;
    var ad = !isGPC && Boolean(c.advertisement);
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
    if (initialConfig.enable_iab_tcf === false) return false;
    return true;
  }

  function buildTCData(eventStatus, listenerId) {
    var c = getStoredConsent() || { necessary: true };
    var isGiven = Boolean(c.consent_given || c.functional || c.analytics || c.performance || c.advertisement);
    var isGPC = isGPCSignal && initialConfig.enable_gpc !== false && !c.gpc_explicit_override;
    var ad = !isGPC && Boolean(c.advertisement);
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

    callback(null, false);
  }

  function initTCFEngine() {
    var existingQueue = [];
    if (typeof window.__tcfapi === "function" && Array.isArray(window.__tcfapi.queue)) {
      existingQueue = window.__tcfapi.queue.slice();
    }

    window.__tcfapi = handleTCFCommand;
    window.__tcfapi.queue = [];

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

    for (var i = 0; i < existingQueue.length; i++) {
      var item = existingQueue[i];
      if (Array.isArray(item) && item.length >= 3) {
        handleTCFCommand(item[0], item[1], item[2], item[3]);
      }
    }
  }

  initTCFEngine();

  // AUTO-BLOCKING & SCRIPT INTERCEPTION ENGINE
  var blockedScriptRegistry = [];
  var blockedVendors = [
    { pattern: /googletagmanager\\.com\\/gtag\\/js|google-analytics\\.com/i, category: "analytics" },
    { pattern: /connect\\.facebook\\.net|fbevents\\.js/i, category: "advertisement" },
    { pattern: /clarity\\.ms\\/tag/i, category: "analytics" },
    { pattern: /static\\.hotjar\\.com/i, category: "analytics" },
    { pattern: /snap\\.licdn\\.com/i, category: "advertisement" },
    { pattern: /analytics\\.tiktok\\.com/i, category: "advertisement" },
    { pattern: /bat\\.bing\\.com/i, category: "advertisement" },
    { pattern: /widget\\.intercom\\.io/i, category: "functional" },
    { pattern: /client\\.crisp\\.chat/i, category: "functional" }
  ];

  function shouldBlockScript(src) {
    if (!src) return null;
    var consent = getStoredConsent();
    for (var i = 0; i < blockedVendors.length; i++) {
      if (blockedVendors[i].pattern.test(src)) {
        var cat = blockedVendors[i].category;
        if (!consent || !consent[cat]) {
          return cat;
        }
      }
    }
    return null;
  }

  // Monkey-patch document.createElement for dynamic script injection
  var originalCreateElement = document.createElement;
  document.createElement = function(tagName, options) {
    var element = originalCreateElement.call(document, tagName, options);
    if (tagName && tagName.toLowerCase() === "script") {
      var originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name, value) {
        if (name.toLowerCase() === "src") {
          var blockCat = shouldBlockScript(value);
          if (blockCat) {
            originalSetAttribute.call(element, "type", "text/plain");
            originalSetAttribute.call(element, "data-consentos-category", blockCat);
            blockedScriptRegistry.push({ element: element, src: value, category: blockCat });
          }
        }
        return originalSetAttribute.apply(element, arguments);
      };
    }
    return element;
  };

  // MutationObserver for scripts already in DOM
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      m.addedNodes.forEach(function(node) {
        if (node.tagName === "SCRIPT" && node.src) {
          var blockCat = shouldBlockScript(node.src);
          if (blockCat && node.type !== "text/plain") {
            node.type = "text/plain";
            node.setAttribute("data-consentos-category", blockCat);
            blockedScriptRegistry.push({ element: node, src: node.src, category: blockCat });
          }
        }
      });
    });
  });
  if (document.documentElement) {
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function unblockConsentedScripts(consent) {
    var scripts = document.querySelectorAll('script[type="text/plain"][data-consentos-category]');
    scripts.forEach(function(s) {
      var cat = s.getAttribute("data-consentos-category");
      if (consent[cat]) {
        var newScript = originalCreateElement.call(document, "script");
        Array.from(s.attributes).forEach(function(attr) {
          if (attr.name !== "type" && attr.name !== "data-consentos-category") {
            newScript.setAttribute(attr.name, attr.value);
          }
        });
        if (s.src) newScript.src = s.src;
        if (s.textContent) newScript.textContent = s.textContent;
        s.parentNode.replaceChild(newScript, s);
      }
    });
  }

  function getStoredConsent() {
    try {
      var match = document.cookie.match(new RegExp("(^| )consentos_consent=([^;]+)"));
      if (match) return JSON.parse(decodeURIComponent(match[2]));
    } catch(e) {}
    try {
      var ls = localStorage.getItem("consentos_consent");
      if (ls) return JSON.parse(ls);
    } catch(e) {}
    return null;
  }

  function setStoredConsent(consent) {
    var val = encodeURIComponent(JSON.stringify(consent));
    var d = new Date();
    d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
    document.cookie = "consentos_consent=" + val + "; expires=" + d.toUTCString() + "; path=/; SameSite=Lax";
    try { localStorage.setItem("consentos_consent", JSON.stringify(consent)); } catch(e) {}
  }

  function renderAuditTables() {
    var targets = document.querySelectorAll(".consentos-audit-table, .upfront-audit-table-element");
    targets.forEach(function(el) {
      if (siteCookies.length === 0) {
        el.innerHTML = '<div style="padding: 16px; border: 1px dashed #cbd5e1; border-radius: 6px; text-align: center; color: #64748b; font-size: 13px; font-style: italic;">' + (resolveText("no_cookies_to_display_label", initialConfig) || 'No cookies to display') + '</div>';
        return;
      }
      var html = '<div style="border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; font-family: sans-serif; font-size: 12.5px;">';
      html += '<table style="width: 100%; border-collapse: collapse; text-align: left;">';
      html += '<thead style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569;"><tr>';
      html += '<th style="padding: 10px 14px;">' + (resolveText("cookie_column_label", initialConfig) || 'Cookie') + '</th>';
      html += '<th style="padding: 10px 14px;">Provider</th>';
      html += '<th style="padding: 10px 14px;">Category</th>';
      html += '<th style="padding: 10px 14px;">' + (resolveText("duration_column_label", initialConfig) || 'Duration') + '</th>';
      html += '<th style="padding: 10px 14px;">' + (resolveText("description_column_label", initialConfig) || 'Description') + '</th>';
      html += '</tr></thead><tbody>';
      siteCookies.forEach(function(c) {
        html += '<tr style="border-bottom: 1px solid #f1f5f9;">';
        html += '<td style="padding: 10px 14px; font-weight: 700; color: #0f172a; font-family: monospace;">' + c.name + '</td>';
        html += '<td style="padding: 10px 14px; color: #334155;">' + (c.service_name || 'Site') + '</td>';
        html += '<td style="padding: 10px 14px;"><span style="background: #eff6ff; color: #1868db; font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: capitalize;">' + c.category + '</span></td>';
        html += '<td style="padding: 10px 14px; color: #64748b;">' + (c.duration || 'Session') + '</td>';
        html += '<td style="padding: 10px 14px; color: #475569;">' + (c.description || '-') + '</td>';
        html += '</tr>';
      });
      html += '</tbody></table></div>';
      el.innerHTML = html;
    });
  }

  function logConsentReceipt(consent) {
    var payload = {
      domain: domain,
      consent_given: consent.consent_given,
      necessary: true,
      functional: !!consent.functional,
      analytics: !!consent.analytics,
      performance: !!consent.performance,
      advertisement: !!consent.advertisement,
      user_agent_category: /mobile/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
      consent_version: initialConfig.consent_version || "1.0",
    };
    if (navigator.sendBeacon) {
      navigator.sendBeacon(consentLogEndpoint, JSON.stringify(payload));
    }
  }

  var bannerHost = null;

  function renderCMPBanner() {
    if (bannerHost) {
      bannerHost.remove();
      bannerHost = null;
    }

    cmpUiIsVisible = true;
    notifyTCFListeners("cmpuishown");

    var host = document.createElement("div");
    host.id = "consentos-root";
    bannerHost = host;
    var shadow = host.attachShadow({ mode: "open" });
    document.body.appendChild(host);

    var style = document.createElement("style");
    style.textContent = \`
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .consentos-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 2147483646;
        background: #ffffff;
        border-top: 1px solid #e2e8f0;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
        padding: 18px 24px;
        color: #0f172a;
        animation: slideUp 0.25s ease-out;
      }
      @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      .inner { max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }
      @media (min-width: 768px) { .inner { flex-direction: row; align-items: center; justify-content: space-between; } }
      .title { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
      .desc { font-size: 13px; color: #334155; line-height: 1.5; font-weight: 400; }
      .actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; justify-content: flex-end; }
      .btn { padding: 8px 16px; border-radius: 4px; font-size: 12.5px; font-weight: 600; cursor: pointer; border: 1px solid transparent; white-space: normal; line-height: 1.3; text-align: center; max-width: 100%; transition: all 0.15s ease; }
      .btn-primary { background: \${initialConfig.primary_color || "#1868db"}; color: white; }
      .btn-secondary { background: white; border-color: #cbd5e1; color: #334155; }
      .btn-outline { background: transparent; border-color: \${initialConfig.primary_color || "#1868db"}; color: \${initialConfig.primary_color || "#1868db"}; }
      @media (max-width: 640px) {
        .consentos-banner { padding: 14px 16px; }
        .inner { flex-direction: column; gap: 12px; }
        .actions { flex-direction: column; width: 100%; gap: 8px; }
        .btn { width: 100%; }
      }
    \`;
    shadow.appendChild(style);

    var banner = document.createElement("div");
    banner.className = "consentos-banner";
    banner.innerHTML = \`
      <div class="inner">
        <div>
          <div class="title">\${resolveText("title", initialConfig)}</div>
          <div class="desc">\${resolveText("description", initialConfig)}</div>
        </div>
        <div class="actions">
          \${initialConfig.preferences_label !== false ? '<button class="btn btn-outline" id="pref-btn">' + resolveText("preferences_label", initialConfig) + '</button>' : ''}
          <button class="btn btn-secondary" id="reject-btn">\${resolveText("reject_all_label", initialConfig)}</button>
          <button class="btn btn-primary" id="accept-btn">\${resolveText("accept_all_label", initialConfig)}</button>
        </div>
      </div>
    \`;
    shadow.appendChild(banner);

    function apply(c) {
      cmpUiIsVisible = false;
      setStoredConsent(c);
      unblockConsentedScripts(c);
      logConsentReceipt(c);
      notifyTCFListeners("useractioncomplete");
      if (initialConfig.enable_consent_mode_v2) {
        gtag("consent", "update", {
          "ad_storage": c.advertisement ? "granted" : "denied",
          "analytics_storage": c.analytics ? "granted" : "denied",
          "ad_user_data": c.advertisement ? "granted" : "denied",
          "ad_personalization": c.advertisement ? "granted" : "denied",
          "functionality_storage": c.functional ? "granted" : "denied"
        });
      }
      host.remove();
      bannerHost = null;
      if (initialConfig.show_revisit_button) renderRevisitWidget();
    }

    var prefBtn = shadow.querySelector("#pref-btn");
    if (prefBtn) {
      prefBtn.onclick = function() {
        apply({ consent_given: true, necessary: true, functional: true, analytics: false, performance: false, advertisement: false });
      };
    }
    shadow.querySelector("#accept-btn").onclick = function() {
      apply({ consent_given: true, necessary: true, functional: true, analytics: true, performance: true, advertisement: true });
    };
    shadow.querySelector("#reject-btn").onclick = function() {
      apply({ consent_given: false, necessary: true, functional: false, analytics: false, performance: false, advertisement: false });
    };
  }

  function initCMP() {
    activeLanguage = detectVisitorLanguage(initialConfig);
    renderAuditTables();
    if (existingConsent && !isTest) {
      unblockConsentedScripts(existingConsent);
      notifyTCFListeners("tcloaded");
      if (initialConfig.show_revisit_button) renderRevisitWidget();
      return;
    }

    renderCMPBanner();
  }

  function renderRevisitWidget() {
    if (document.getElementById("consentos-revisit")) return;
    var btn = document.createElement("button");
    btn.id = "consentos-revisit";
    btn.style.cssText = "position: fixed; bottom: 18px; left: 18px; z-index: 2147483640; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 20px; padding: 6px 14px; font-size: 11.5px; font-weight: 700; color: #334155; box-shadow: 0 4px 12px rgba(0,0,0,0.1); cursor: pointer; display: flex; align-items: center; gap: 6px;";
    btn.innerHTML = "🍪 " + (resolveText("revisit_button_label", initialConfig) || "Consent");
    btn.onclick = function() { renderCMPBanner(); };
    document.body.appendChild(btn);
  }

  window.ConsentOS = window.Userly = {
    getLanguage: function() {
      return activeLanguage;
    },
    setLanguage: function(lang) {
      if (!lang || typeof lang !== "string") return;
      var clean = lang.toLowerCase().trim();
      if (TRANSLATIONS[clean]) {
        activeLanguage = clean;
        try {
          localStorage.setItem("usrly_lang_" + domain, clean);
        } catch(e) {}
        renderAuditTables();
        if (cmpUiIsVisible) {
          renderCMPBanner();
        }
      }
    },
    getSupportedLanguages: function() {
      return Object.keys(TRANSLATIONS);
    },
    resolveText: function(key, lang) {
      return resolveText(key, initialConfig, lang);
    },
    version: "2.3.0"
  };

  function initPolicyEmbeds() {
    var policyContainers = document.querySelectorAll(
      "[id^='usrly-'], [id^='userly-'], [id^='upfront-'], [id^='consentos-'], [data-usrly-policy], [data-policy-id], [data-policy]"
    );
    if (!policyContainers || policyContainers.length === 0) return;

    for (var i = 0; i < policyContainers.length; i++) {
      (function (container) {
        if (container.getAttribute("data-usrly-loaded") === "true") return;
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
        container.setAttribute("data-usrly-loaded", "pending");

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
                      formatted += "<strong style='font-weight:600;color:#0f172a;'>$1</strong>".replace("$1", parts[k]);
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
              container.setAttribute("data-usrly-loaded", "true");
            }
          })
          .catch(function (err) {
            container.removeAttribute("data-usrly-loaded");
            console.warn("[ConsentOS CMP] Failed to load policy embed for " + policyId + ":", err);
          });
      })(policyContainers[i]);
    }
  }

  function observePolicyContainers() {
    if (typeof MutationObserver !== "undefined") {
      var observer = new MutationObserver(function () {
        initPolicyEmbeds();
      });
      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      } else if (document.documentElement) {
        observer.observe(document.documentElement, { childList: true, subtree: true });
      }
    }

    var origPush = history.pushState;
    if (origPush) {
      history.pushState = function () {
        origPush.apply(this, arguments);
        setTimeout(initPolicyEmbeds, 50);
      };
    }
    var origReplace = history.replaceState;
    if (origReplace) {
      history.replaceState = function () {
        origReplace.apply(this, arguments);
        setTimeout(initPolicyEmbeds, 50);
      };
    }
    window.addEventListener("popstate", function () {
      setTimeout(initPolicyEmbeds, 50);
    });
  }

  function onReady() {
    initCMP();
    initPolicyEmbeds();
    observePolicyContainers();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }
  window.addEventListener("load", function () {
    initPolicyEmbeds();
    observePolicyContainers();
  });
})();
`

    if (!isTest) {
      SCRIPT_CACHE.set(cacheKey, { script, timestamp: Date.now() })
    }

    return new NextResponse(script, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (err: any) {
    console.error("GET /consentos.js error:", err)
    return new NextResponse(`console.error("ConsentOS CMP Script Failed to Load: ${err.message}");`, {
      headers: { "Content-Type": "application/javascript" },
      status: 500,
    })
  }
}
