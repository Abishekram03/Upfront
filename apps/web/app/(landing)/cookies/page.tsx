import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/marketing/legal";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Cookie Policy — ${SITE_NAME}`,
  description: `How cookies and similar technologies are used on the ${SITE_NAME} website, and how to control them.`,
  openGraph: {
    title: `Cookie Policy — ${SITE_NAME}`,
    description: `How cookies and similar technologies are used on the ${SITE_NAME} website, and how to control them.`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Cookie Policy"
      description="What cookies and similar technologies this website uses, and what consent categories mean when you configure UpFront on your own site."
    >
      <LegalSection title="1. Cookies on this website">
        <p>
          This website does not set cookies for advertising, and {SITE_NAME} analytics does not
          rely on cookies for measurement — it is cookieless by default and does not store raw IP
          addresses. If we introduce cookies or similar technologies on this website, we will
          describe them here and, where consent is required, ask for it through the same consent
          tooling we sell.
        </p>
      </LegalSection>

      <LegalSection title="2. What cookies are">
        <p>
          Cookies are small text files that websites store on your device. Websites also use
          similar technologies such as local storage and pixels. Cookies can be first-party (set
          by the site you visit) or third-party (set by a different domain embedded in the page).
        </p>
      </LegalSection>

      <LegalSection title="3. Consent categories in UpFront">
        <p>
          When you configure UpFront on your own website, the scanner and banner work with the
          following consent categories:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-ink">Strictly necessary</strong> — cookies required for core
            site functionality. These are always active and not subject to consent choices.
          </li>
          <li>
            <strong className="text-ink">Functional</strong> — cookies that remember preferences
            and non-essential functionality.
          </li>
          <li>
            <strong className="text-ink">Analytics</strong> — cookies used to measure how the site
            is used.
          </li>
          <li>
            <strong className="text-ink">Marketing</strong> — cookies used for personalized
            advertising and measurement.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Controlling cookies">
        <p>
          In addition to consent banners on websites that use UpFront, most browsers let you block
          or delete cookies in their settings. Websites that use UpFront may also honor Global
          Privacy Control signals, depending on their configuration.
        </p>
      </LegalSection>

      <LegalSection title="5. Changes">
        <p>
          If this website's use of cookies changes, this policy will be updated with a new "Last
          updated" date.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
