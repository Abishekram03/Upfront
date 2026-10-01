"use client"

import { useState } from "react"
import {
  Copy,
  Check,
  CheckCircle2,
} from "lucide-react"
import { useDomain } from "@/lib/domain-context"
import { cn } from "@/lib/utils"

interface TrackerItem {
  id: string
  name: string
  category: string
  tag: string
}

const TRACKERS: TrackerItem[] = [
  {
    id: "ga4",
    name: "Google Analytics 4 / Google Tag",
    category: "analytics",
    tag: `<script type="text/usrly-block" data-category="analytics" src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"></script>
<script type="text/usrly-block" data-category="analytics">
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXX');
</script>`,
  },
  {
    id: "meta",
    name: "Meta (Facebook) Pixel",
    category: "advertisement",
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
  },
  {
    id: "tiktok",
    name: "TikTok Pixel",
    category: "advertisement",
    tag: `<script type="text/usrly-block" data-category="advertisement">
  !function (w, d, t) {
    w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i;var s=d.createElement("script");s.type="text/javascript",s.async=!0,s.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(s,a)};
    ttq.load('YOUR_TIKTOK_PIXEL_ID');
    ttq.page();
  }(window, document, 'ttq');
</script>`,
  },
  {
    id: "hotjar",
    name: "Hotjar / Heatmaps",
    category: "functional",
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
  },
]

export function ScriptRules() {
  const { activeDomain } = useDomain()
  const domain = activeDomain || "onconnect.one"
  const defaultTracker = TRACKERS[0] ?? {
    id: "ga4",
    name: "Google Analytics 4 / Google Tag",
    category: "analytics",
    tag: "",
  }

  const [selectedTrackerId, setSelectedTrackerId] = useState<string>(defaultTracker.id)
  const [copied, setCopied] = useState(false)

  const currentTracker: TrackerItem =
    TRACKERS.find((t) => t.id === selectedTrackerId) ?? defaultTracker

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Script Blocking Rules
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Control and auto-block third-party marketing and analytics scripts until visitor consent is granted.
        </p>
      </div>

      {/* Clean Quick Setup Card */}
      <div className="rounded-lg border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-slate-900">
              How to block any script
            </h2>
            <p className="text-xs text-slate-500">
              Change <code className="text-slate-800 font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">type="text/javascript"</code> to <code className="text-[#1868db] font-semibold font-mono bg-blue-50 px-1 py-0.5 rounded text-[11px]">type="text/usrly-block"</code> and assign its category.
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 shrink-0">
            <CheckCircle2 className="size-3.5 text-emerald-600" />
            <span>Google Consent Mode v2 Active</span>
          </span>
        </div>

        {/* Tab Selector */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {TRACKERS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTrackerId(t.id)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer shrink-0",
                  selectedTrackerId === t.id
                    ? "bg-[#1868db] text-white shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
                )}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* Light-Themed Snippet Viewer */}
          <div className="relative mt-3 rounded-md bg-slate-50 text-slate-800 p-4 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-200/90 shadow-2xs">
            <button
              type="button"
              onClick={() => handleCopy(currentTracker.tag)}
              className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer border border-slate-200 shadow-2xs"
            >
              {copied ? (
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
            <pre className="pr-20 font-mono text-[11px] text-slate-800">
              <code>{currentTracker.tag}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
