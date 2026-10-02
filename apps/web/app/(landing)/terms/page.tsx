import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/marketing/legal";
import { COMPANY, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Terms of Service — ${SITE_NAME}`,
  description: `The terms that govern your use of the ${SITE_NAME} website and service.`,
  openGraph: {
    title: `Terms of Service — ${SITE_NAME}`,
    description: `The terms that govern your use of the ${SITE_NAME} website and service.`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      description={`The agreement between you and ${COMPANY} for use of the ${SITE_NAME} service.`}
    >
      <LegalSection title="1. Acceptance">
        <p>
          By accessing or using {SITE_NAME} (the "Service"), you agree to these Terms of Service.
          If you use the Service on behalf of an organization, you confirm that you have authority
          to bind that organization.
        </p>
      </LegalSection>

      <LegalSection title="2. The Service">
        <p>
          {SITE_NAME} provides software tools for website analytics and consent management,
          including cookieless analytics, a consent management platform, a cookie scanner, and
          proof-of-consent records, delivered through a lightweight script. Use of the Service does
          not constitute legal advice and does not guarantee regulatory compliance.
        </p>
      </LegalSection>

      <LegalSection title="3. Accounts and workspaces">
        <p>
          You are responsible for the activity in your workspace, for keeping your credentials
          secure, and for ensuring you have the right to install the Service on the websites you
          add. You must not use the Service to process data you are not permitted to process, or
          in violation of applicable law.
        </p>
      </LegalSection>

      <LegalSection title="4. Plans and billing">
        <p>
          The Service is offered on the plans and limits described on our{" "}
          <Link href="/pricing" className="font-medium text-primary underline-offset-2 hover:underline">
            Pricing
          </Link>{" "}
          page. Pricing is based on monthly pageviews, not on the number of websites. Current
          launch pricing applies at signup; we may adjust prices prospectively with notice. You
          can change plans at any time, and changes apply to billing going forward.
        </p>
      </LegalSection>

      <LegalSection title="5. Customer data">
        <p>
          As between you and us, you own the analytics and consent data generated for your
          websites. You instruct us to process that data to provide the Service. We may use
          aggregated, de-identified information to operate and improve the Service.
        </p>
      </LegalSection>

      <LegalSection title="6. Acceptable use">
        <p>You must not:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>use the Service unlawfully or to infringe the rights of others;</li>
          <li>probe, scan, or test the vulnerability of the Service or our infrastructure;</li>
          <li>circumvent plan limits or access controls;</li>
          <li>install the script on websites without the authority to do so.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Availability and changes">
        <p>
          We aim for the Service to be reliable and fast, but we do not promise uninterrupted or
          error-free operation. We may modify or discontinue features over time; material changes
          that affect you will be communicated through the Service or this website.
        </p>
      </LegalSection>

      <LegalSection title="8. Disclaimers and liability">
        <p>
          The Service is provided "as is" without warranties of any kind, whether express or
          implied, to the maximum extent permitted by law. We are not liable for indirect,
          incidental, or consequential damages, or for lost profits or data, arising from your use
          of the Service. Nothing in these Terms limits liability that cannot be limited under
          applicable law.
        </p>
      </LegalSection>

      <LegalSection title="9. Termination">
        <p>
          You may stop using the Service and close your workspace at any time. We may suspend or
          terminate accounts that violate these Terms or applicable law. Where these Terms end,
          the sections that by their nature should survive will continue to apply.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes to these terms">
        <p>
          We may update these Terms from time to time. The current version will always be
          available on this page with its "Last updated" date. Continued use of the Service after
          changes take effect constitutes acceptance.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
