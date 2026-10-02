import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/marketing/legal";
import { COMPANY, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacy Policy — ${SITE_NAME}`,
  description: `How ${COMPANY} collects, uses, and protects personal data for the ${SITE_NAME} website and service.`,
  openGraph: {
    title: `Privacy Policy — ${SITE_NAME}`,
    description: `How ${COMPANY} collects, uses, and protects personal data for the ${SITE_NAME} website and service.`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      description={`How ${COMPANY} handles personal data across the ${SITE_NAME} website and service.`}
    >
      <LegalSection title="1. Who we are">
        <p>
          {SITE_NAME} is a website analytics and consent management platform operated by{" "}
          {COMPANY} ("we", "us"). This policy explains how we handle personal data when you visit
          this website, use the Service, or correspond with us.
        </p>
        <p>
          UpFront provides software tools for website analytics and consent management. Use of the
          Service does not constitute legal advice and does not guarantee regulatory compliance.
        </p>
      </LegalSection>

      <LegalSection title="2. What we collect">
        <p>We collect and process the following categories of data:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-ink">Account data.</strong> When you create a workspace, we
            process your name, email address, and authentication credentials.
          </li>
          <li>
            <strong className="text-ink">Workspace data.</strong> The websites you add, your
            consent configurations, and your product settings.
          </li>
          <li>
            <strong className="text-ink">Website analytics data.</strong> When the UpFront script
            runs on a website you manage, we process aggregate, privacy-oriented traffic data.
            UpFront analytics is cookieless by default and does not store raw IP addresses.
          </li>
          <li>
            <strong className="text-ink">Consent records.</strong> When a visitor of a website you
            manage makes a consent choice, we process the consent record associated with that
            choice, including its timestamp, country, status, categories, and configuration
            version.
          </li>
          <li>
            <strong className="text-ink">Support data.</strong> If you contact us, we process the
            information you provide so we can respond.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Why we process data">
        <p>
          We process personal data to provide the Service, operate and secure our infrastructure,
          respond to support requests, keep consent records you can rely on, and comply with
          applicable laws. We do not sell personal data, and we do not use website analytics data
          to build advertising profiles.
        </p>
      </LegalSection>

      <LegalSection title="4. Cookies on this website">
        <p>
          Details about the cookies and similar technologies used on this website are described in
          our <Link href="/cookies" className="font-medium text-primary underline-offset-2 hover:underline">Cookie Policy</Link>.
        </p>
      </LegalSection>

      <LegalSection title="5. Data retention">
        <p>
          Analytics and consent history is retained according to your plan: 30 days on Free, 12
          months on Growth, and 24 months on Business. Account data is retained for as long as
          your workspace is active, and deleted on request or after account closure, subject to
          legal retention obligations.
        </p>
      </LegalSection>

      <LegalSection title="6. Processors and infrastructure">
        <p>
          We rely on managed infrastructure providers to host the Service. The current list of
          subprocessors is available on our{" "}
          <Link href="/subprocessors" className="font-medium text-primary underline-offset-2 hover:underline">
            Subprocessors
          </Link>{" "}
          page and is kept up to date as vendors are added or removed.
        </p>
      </LegalSection>

      <LegalSection title="7. Your rights">
        <p>
          Depending on where you are located, you may have rights to access, correct, delete, or
          restrict the processing of your personal data, and to object to certain processing. To
          exercise these rights, contact us. If you are a visitor of a website that uses UpFront,
          contact that website's owner first — it controls its own consent configuration.
        </p>
      </LegalSection>

      <LegalSection title="8. Security">
        <p>
          We apply technical and organizational measures appropriate to the risks of the data we
          process, including encryption in transit and access controls. No method of transmission
          or storage is completely secure, and we cannot guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes to this policy">
        <p>
          We may update this policy as the Service evolves. Material changes will be reflected on
          this page with a new "Last updated" date.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
