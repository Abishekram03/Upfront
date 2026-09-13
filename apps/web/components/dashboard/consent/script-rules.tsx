"use client"

import { useState } from "react"
import {
  Copy,
  Check,
  Code2,
  CheckCircle2,
} from "lucide-react"
import { useDomain } from "@/lib/domain-context"

function HighlightedCode({ code }: { code: string }) {
  const lines = code.split("\n")

  const highlightLine = (line: string) => {
    // Split by strings, tags, keywords, attributes, methods
    const tokens = line.split(/(<\/?[a-zA-Z0-9-]+|"[^"]*"|'[^']*'|\b(?:function|return|if|else|var|let|const|new)\b|\b(?:type|data-category|src|async)\b|\b(?:window|document|fbq|gtag|ttq|hj|apply|push|createElement|getElementsByTagName|parentNode|insertBefore|init|track|config)\b|[<>=!&|;:,{}()\[\]])/g).filter(Boolean)

    return tokens.map((token, i) => {
      // Tags
      if (/^<\/?(script|span|div|a)/.test(token)) {
        return <span key={i} className="text-blue-700 font-semibold">{token}</span>
      }
      // Tag closures >
      if (token === ">" || token === "/>") {
        return <span key={i} className="text-blue-700 font-semibold">{token}</span>
      }
      // Attributes
      if (/^(type|data-category|src|async)$/.test(token)) {
        return <span key={i} className="text-purple-700 font-medium">{token}</span>
      }
      // Strings
      if (/^("[^"]*"|'[^']*')$/.test(token)) {
        return <span key={i} className="text-emerald-700 font-mono">{token}</span>
      }
      // Keywords
      if (/^(function|return|if|else|var|let|const|new)$/.test(token)) {
        return <span key={i} className="text-blue-600 font-semibold">{token}</span>
      }
      // Built-ins and Methods
      if (/^(window|document|fbq|gtag|ttq|hj|apply|push|createElement|getElementsByTagName|parentNode|insertBefore|init|track|config)$/.test(token)) {
        return <span key={i} className="text-sky-700 font-medium">{token}</span>
      }
      // Punctuation & base text
      return <span key={i} className="text-slate-800">{token}</span>
    })
  }

  return (
    <pre className="font-mono text-[11px] overflow-x-auto leading-relaxed select-all">
      <code>
        {lines.map((line, idx) => (
          <div key={idx} className="min-h-[1.25rem]">
            {highlightLine(line)}
          </div>
        ))}
      </code>
    </pre>
  )
}

export function ScriptRules() {
  const { activeDomain } = useDomain()
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const trackers = [
    {
      name: "Meta (Facebook) Pixel",
      category: "Advertisement",
      tag: `<script type="text/usrly-block" data-category="advertisement">
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>`,
      desc: "Automatically paused until the visitor approves the Advertisement category.",
    },
    {
      name: "Google Tag / Google Ads / GA4",
      category: "Analytics & Advertisement",
      tag: `<script type="text/usrly-block" data-category="analytics" src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"></script>
<script type="text/usrly-block" data-category="analytics">
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXX');
</script>`,
      desc: "Gated until consent is granted. Also supports Google Consent Mode v2 signals.",
    },
    {
      name: "TikTok Pixel",
      category: "Advertisement",
      tag: `<script type="text/usrly-block" data-category="advertisement">
  !function (w, d, t) {
    w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i;var s=d.createElement("script");s.type="text/javascript",s.async=!0,s.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(s,a)};
    ttq.load('YOUR_TIKTOK_PIXEL_ID');
    ttq.page();
  }(window, document, 'ttq');
</script>`,
      desc: "Held in DOM and executed immediately once Advertisement consent is given.",
    },
    {
      name: "Hotjar / Heatmaps & User Replay",
      category: "Functional",
      tag: `<script type="text/usrly-block" data-category="functional">
  (function(h,o,t,j,a,r){
    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
    h._hjSettings={hjid:YOUR_HOTJAR_ID,hjsv:6};
    a=o.getElementsByTagName('head')[0];
    r=o.createElement('script');r.async=1;
    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
    a.appendChild(r);
  })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
</script>`,
      desc: "Held in DOM and executed once Functional cookies are approved.",
    },
  ]

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Script Rules & Auto-Blocking</h1>
          <span className="rounded-[4px] bg-neutral-100 px-2.5 py-0.5 text-xs font-bold text-neutral-700 border border-neutral-200">
            Privacy CMP Standard
          </span>
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          Zero-code script gating for 3rd-party marketing, analytics, and functional tags on <strong className="text-neutral-800">{activeDomain || "your site"}</strong>.
        </p>
      </div>

      {/* How it Works Banner - Human Enterprise Styled */}
      <div className="flex items-start gap-3 rounded-lg border border-slate-200/80 bg-slate-50/60 p-4 text-xs text-slate-700">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 shadow-2xs">
          <Code2 className="size-3.5" />
        </div>
        <div className="space-y-1">
          <div className="font-semibold text-slate-900">
            How Script Auto-Blocking Works
          </div>
          <p className="text-slate-600 leading-relaxed text-xs">
            Replace <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-slate-800 text-[11px]">type="text/javascript"</code> with <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-blue-600 font-semibold text-[11px]">type="text/usrly-block"</code> and specify the <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-slate-800 text-[11px]">data-category="advertisement"</code> attribute. The browser will hold the script until the visitor grants consent, at which point <strong className="text-slate-900 font-semibold">usrly</strong> will dynamically unblock and execute it.
          </p>
        </div>
      </div>

      {/* Google Consent Mode v2 Card */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-[4px] bg-[#1868db] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              GCM
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Google Consent Mode v2 (Native Integration)</h3>
              <p className="text-[11px] text-slate-500">Automatically syncs ad_storage, analytics_storage, and ad_personalization</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[4px] border border-emerald-200">
            <CheckCircle2 className="size-3" /> Auto Enabled
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          When visitors interact with your banner, <strong>usrly.js</strong> automatically calls <code className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-blue-600 font-medium">gtag('consent', 'update', &#123; ... &#125;)</code> with the exact categories chosen. No complex Tag Manager triggers required.
        </p>
      </div>

      {/* Code Snippets List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Popular Tracker Snippets</h3>

        <div className="grid grid-cols-1 gap-4">
          {trackers.map((tracker, idx) => (
            <div
              key={tracker.name}
              className="rounded-lg border border-slate-200 bg-white shadow-2xs overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 px-4 py-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{tracker.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{tracker.desc}</p>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-700 border border-slate-200">
                  {tracker.category}
                </span>
              </div>

              {/* Light themed code block with syntax highlighting */}
              <div className="relative bg-slate-50/70 p-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => copyCode(tracker.tag, idx)}
                  className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="size-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 text-slate-500" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>

                <div className="pr-24">
                  <HighlightedCode code={tracker.tag} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
