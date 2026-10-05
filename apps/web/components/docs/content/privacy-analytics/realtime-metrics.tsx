"use client"

import React from "react"
import { Activity, Users, Radio, Zap, Clock, ShieldCheck, ArrowUpRight } from "lucide-react"
import { DocsCallout } from "../../docs-callout"
import { DocsCodeBlock } from "../../docs-code-block"

export function RealtimeMetricsDoc() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="h-px w-4 bg-primary/60" />
          <span>Privacy Analytics</span>
          <span>•</span>
          <span>Live Visitors & Real-Time Pulse</span>
        </div>
        <h1 id="realtime-metrics" className="mt-3 text-3xl font-medium tracking-normal text-balance text-ink sm:text-4xl">
          Live Visitors & Real-Time Pulse
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Monitor concurrent visitors, active URLs, and traffic spikes as they happen with UpFront&apos;s low-latency real-time analytics engine.
        </p>
      </div>

      {/* 5-Minute Pulse Engine */}
      <div className="space-y-4">
        <h2 id="pulse-engine" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          The 5-Minute Rolling Pulse Engine
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Rather than keeping heavy open WebSocket connections on visitor devices, UpFront uses lightweight, batched heartbeat pings to calculate live audience volume:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary font-medium text-sm">
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>Lightweight Beacon</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dispatches an anonymous pulse heartbeat every 30 seconds while the browser tab remains visible and active.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary font-medium text-sm">
              <Clock className="w-4 h-4" />
              <span>Rolling 5-Min Window</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Calculates distinct active session hashes recorded within the last 300 seconds.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary font-medium text-sm">
              <Zap className="w-4 h-4" />
              <span>Zero Battery Drain</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Pauses automatically when the user switches tabs via standard <code>document.visibilityState</code> listeners.
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Dimensions */}
      <div className="space-y-4">
        <h2 id="realtime-dimensions" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Real-Time Dashboard Dimensions
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          When viewing the Real-Time pulse in your UpFront Dashboard, you can see live data updating instantly:
        </p>

        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-muted/40 font-medium text-ink">
              <tr>
                <th className="p-3">Card</th>
                <th className="p-3">Information Displayed</th>
                <th className="p-3">Use Case</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-muted-foreground">
              <tr>
                <td className="p-3 font-medium text-ink">Active Page URLs</td>
                <td className="p-3">Live path breakdown (e.g. <code>/pricing</code>, <code>/blog/v2-release</code>).</td>
                <td className="p-3">Detect viral blog posts or high-intent landing page traffic.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-ink">Current Referrers</td>
                <td className="p-3">Top referring domains sending visitors right now.</td>
                <td className="p-3">Monitor sudden surges from Hacker News, Product Hunt, or Twitter.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-ink">Geographic Pulse</td>
                <td className="p-3">Country-level breakdown with percentage distribution.</td>
                <td className="p-3">See global campaign reach in real time.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-ink">Device Types</td>
                <td className="p-3">Mobile vs. Desktop vs. Tablet split.</td>
                <td className="p-3">Understand immediate visitor viewing conditions.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <DocsCallout type="tip" title="No Configuration Needed">
          Real-time metrics are enabled out of the box with the standard <code>upfront.js</code> snippet. No special flags or additional script configurations are required.
        </DocsCallout>
      </div>
    </article>
  )
}
