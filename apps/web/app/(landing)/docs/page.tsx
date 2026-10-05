import type { Metadata } from "next";
import { DocumentationView } from "@/components/docs/documentation-view";

export const metadata: Metadata = {
  title: "Documentation — UpFront",
  description:
    "Comprehensive UpFront documentation: getting started, script installation, CMP, cookie scanning, analytics, and privacy compliance.",
  openGraph: {
    title: "Documentation — UpFront",
    description:
      "Comprehensive UpFront documentation: getting started, script installation, CMP, cookie scanning, analytics, and privacy compliance.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function DocsPage() {
  return <DocumentationView />;
}

