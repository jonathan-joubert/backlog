import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <span className="text-xs text-muted-foreground">
          Effective 2025-09-13 · Last updated 2025-09-13
        </span>
      </div>

      <article className="prose-backlog space-y-6 text-sm leading-relaxed text-foreground">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Privacy Policy for Backlog</h1>
          <p className="text-muted-foreground">
            This policy meets applicable legal requirements and Google Play Developer Policy
            expectations.
          </p>
        </header>

        <Section title="1. Information Controller">
          <p>
            <strong>App Developer:</strong> Jonathan Reece Joubert
            <br />
            <strong>Contact:</strong>{" "}
            <a className="text-primary hover:underline" href="mailto:jjoubert@fibco.co.za">
              jjoubert@fibco.co.za
            </a>
          </p>
        </Section>

        <Section title="2. What Information Is Collected">
          <p>
            <strong>Short summary:</strong> Backlog does not collect, store, or transmit any
            personal information to our servers. All firearm and application details you enter
            remain only on your device/browser unless you explicitly choose otherwise.
          </p>
          <h4 className="mt-3 font-semibold">User-entered data (local only)</h4>
          <ul className="ml-5 list-disc space-y-1">
            <li>Firearm application reference numbers</li>
            <li>Firearm serial numbers, make, and model</li>
            <li>License issue and expiry dates</li>
            <li>Notes or comments</li>
          </ul>
          <h4 className="mt-3 font-semibold">Technical data (local only)</h4>
          <ul className="ml-5 list-disc space-y-1">
            <li>Notification preferences</li>
            <li>App settings</li>
          </ul>
          <p>
            Backlog does not collect identity numbers, biometric data, financial information, or
            other categories of sensitive personal information.
          </p>
        </Section>

        <Section title="3. How Information Is Processed">
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Local Storage:</strong> All data is stored only on your device or in your
              browser's local storage.
            </li>
            <li>
              <strong>Notifications:</strong> Renewal reminders and local alarms are scheduled
              on-device.
            </li>
            <li>
              <strong>Status Checks:</strong> If you opt to check application status, the app may
              connect directly from your device to the official SAPS website to fetch status data.
              These requests are initiated by your device and not routed via our servers.
            </li>
            <li>
              <strong>No Servers:</strong> We do not operate servers that receive or store your
              firearm or personal data.
            </li>
          </ul>
        </Section>

        <Section title="4. Third-Party Services">
          <p>
            Backlog may use the following third-party services for operational functionality. The
            use of these services does not result in firearm or personal details being transmitted
            to us:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Google Play Services</strong> — for app updates and optional crash
              reporting (if enabled by you).
            </li>
            <li>
              <strong>Firebase / Google Cloud Messaging (FCM)</strong> — used for push
              notification delivery tokens only. No firearm/application data is sent to Firebase
              as part of these tokens.
            </li>
          </ul>
        </Section>

        <Section title="5. Data Storage and Security">
          <ul className="ml-5 list-disc space-y-1">
            <li>
              Data remains on your device. If you uninstall Backlog or clear your browser
              storage, stored information will be permanently deleted.
            </li>
            <li>Notifications stop automatically when the app is removed.</li>
            <li>
              We recommend device-level protections (PIN/biometrics, encrypted device storage) to
              keep your data safe.
            </li>
          </ul>
        </Section>

        <Section title="6. Your Rights Under POPIA">
          <p>
            Because Backlog does not collect or store personal data on our servers, you retain
            full control of your records on device. You can view, edit, export, or delete all
            records directly in the app or by clearing browser storage. To stop notifications,
            use device settings or uninstall the app.
          </p>
        </Section>

        <Section title="7. Children's Privacy">
          <p>
            Backlog is a utility app that provides firearm license application status checks and
            renewal reminders. It contains no firearm imagery, instructions, or purchase
            functionality. The app is suitable for users of all ages. We do not knowingly collect
            or process personal information from children.
          </p>
        </Section>

        <Section title="8. Affiliation & Disclaimer">
          <p>
            Backlog is <strong>not affiliated</strong> with the South African Police Service
            (SAPS). SAPS is solely responsible for the accuracy and availability of any
            information on their public website. Backlog is a personal tracker tool and does not
            constitute legal advice.
          </p>
        </Section>

        <Section title="9. Updates to This Policy">
          <p>
            If we change this privacy policy, users will be notified with an app update (and the
            policy date above will be updated). You may withdraw consent at any time by
            uninstalling the app or clearing browser data.
          </p>
        </Section>

        <Section title="10. Contact Information">
          <p>
            <strong>Data Protection Officer:</strong> Jonathan Reece Joubert
            <br />
            <strong>Email:</strong>{" "}
            <a className="text-primary hover:underline" href="mailto:jjoubert@fibco.co.za">
              jjoubert@fibco.co.za
            </a>
            <br />
            <strong>Location:</strong> South Africa
          </p>
        </Section>

        <Section title="Consent Statement">
          <p>
            By using Backlog, you acknowledge and consent that all firearm and application
            information is stored and managed locally on your device/browser, and is not shared
            with us or other third parties except as described above (e.g., push notification
            tokens to FCM).
          </p>
        </Section>

        <p className="text-xs text-muted-foreground">
          Last updated: 2025-09-13 · Backlog — Personal firearm &amp; application tracker
        </p>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="space-y-2 text-sm text-muted-foreground [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}
