import { LawPreset } from "./types"

export const lgpdPreset: LawPreset = {
  id: "lgpd",
  name: "LGPD (Brasil)",
  jurisdiction: "Brasil",
  badge: "Consentimento Prévio",
  info: "Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). Exige consentimento livre, informado e inequívoco para finalidades determinadas antes da ativação de cookies não essenciais.",
  consentModel: "opt_in",
  defaultCategories: {
    necessary: true,
    functional: false,
    analytics: false,
    performance: false,
    advertisement: false,
  },
  bannerData: {
    title: "Gerenciamento de Privacidade e Cookies",
    description: "Utilizamos cookies e tecnologias semelhantes para aprimorar sua experiência de navegação, analisar o tráfego do site e oferecer conteúdos personalizados, em conformidade com a LGPD. Você pode aceitar todos, recusar os não essenciais ou personalizar suas escolhas.",
    accept_all_label: "Aceitar Todos",
    reject_all_label: "Rejeitar Não Essenciais",
    preferences_label: "Personalizar Escolhas",
    save_preferences_label: "Salvar Preferências",
    pref_accept_all_label: "Aceitar Todos",
    pref_reject_all_label: "Rejeitar Não Essenciais",
    show_reject_button: true,
    show_preferences_button: true,
  },
  preferenceCenterData: {
    title: "Central de Preferências de Privacidade",
    description: "Respeitamos sua privacidade e seus direitos sob a LGPD. Os cookies necessários garantem o funcionamento correto e seguro do site. As demais categorias são opcionais e você pode gerenciá-las ou revogar seu consentimento a qualquer momento.",
    always_active_label: "Sempre Ativo",
    save_preferences_label: "Salvar Minhas Preferências",
  },
  categories: {
    necessary: {
      title: "Essenciais e Segurança",
      description: "Indispensáveis para a navegação básica, autenticação segura, prevenção de fraudes e armazenamento do seu consentimento.",
      alwaysActive: true,
      defaultChecked: true,
    },
    functional: {
      title: "Funcionalidades e Preferências",
      description: "Permitem lembrar suas preferências de idioma, ferramentas interativas e integração com recursos adicionais.",
      defaultChecked: false,
    },
    analytics: {
      title: "Estatísticas e Análise de Tráfego",
      description: "Coletam métricas agregadas de navegação e comportamento para aprimorar o desempenho e a estrutura do site.",
      defaultChecked: false,
    },
    performance: {
      title: "Desempenho e Diagnóstico",
      description: "Monitoram a velocidade de carregamento da página, estabilidade do servidor e diagnósticos de erros técnicos.",
      defaultChecked: false,
    },
    advertisement: {
      title: "Publicidade e Marketing",
      description: "Permitem a exibição de anúncios direcionados e mensuração de campanhas em plataformas parceiras.",
      defaultChecked: false,
    },
  },
  cookieTableLabels: {
    cookie_column_label: "Cookie",
    duration_column_label: "Duração",
    description_column_label: "Finalidade",
    no_cookies_to_display_label: "Nenhum cookie registrado nesta categoria.",
  },
  runtimeConfig: {
    enable_gpc: true,
    google_consent_mode: true,
    geo_targeting: "br",
    prior_blocking: true,
  },
}
