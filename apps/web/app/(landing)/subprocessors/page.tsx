import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/marketing/legal";
import { COMPANY, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Subprocessors — ${SITE_NAME}`,
  description: `The infrastructure providers and subprocessors ${COMPANY} relies on to deliver the ${SITE_NAME} service.`,
  openGraph: {
    title: `Subprocessors — ${SITE_NAME}`,
    description: `The infrastructure providers and subprocessors ${COMPANY} relies on to deliver the ${SITE_NAME} service.`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

const subprocessors = [
  {
    vendor: "Cloudflare",
    role: "Hosting and edge delivery",
    purpose: "Serves this website and the Service's edge infrastructure.",
  },
  {
    vendor: "Supabase",
    role: "Database and authentication infrastructure",
    purpose: "Stores workspace, analytics, and consent data; handles account authentication.",
  },
];

export default function SubprocessorsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Subprocessors"
      description={`The providers ${COMPANY} relies on to operate ${SITE_NAME}.`}
      intro={`${SITE_NAME} runs on managed infrastructure. The providers listed below process data on our behalf as subprocessors when we deliver the Service.`}
    >
      <LegalSection title="Current subprocessors">
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="px-4 py-3 font-medium">Provider</th>
                <th scope="col" className="px-4 py-3 font-medium">Role</th>
                <th scope="col" className="px-4 py-3 font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {subprocessors.map((s) => (
                <tr key={s.vendor}>
                  <td className="px-4 py-3 font-medium text-ink">{s.vendor}</td>
                  <td className="px-4 py-3 text-ink-soft">{s.role}</td>
                  <td className="px-4 py-3 text-ink-soft">{s.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection title="Keeping this list current">
        <p>
          We add, remove, or replace subprocessors as the Service evolves. When we engage a new
          subprocessor, we update this page. If you have questions about a specific provider,{" "}
          <Link href="/contact" className="font-medium text-primary underline-offset-2 hover:underline">
            contact us
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Your responsibilities as a customer">
        <p>
          If you operate a website that uses UpFront, this list may be relevant to the disclosures
          you make in your own privacy documentation. You remain the controller of the data
          collected from your website's visitors.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
