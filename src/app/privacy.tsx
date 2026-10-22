import { LegalPage } from '@/components/legal-page';

// DRAFT. To be reviewed and completed before launch (step 6 checklist).
export default function PrivacyScreen() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="October 2026 (draft)"
      sections={[
        [
          'What we collect',
          'Your email address, the tracks you mark as favourites, and whether you have a subscription. That’s all. We do not track what you listen to, and there are no ads.',
        ],
        ['Payments', 'Payments are handled by Stripe. We never see or store your card number.'],
        ['Where it’s stored', 'Your account is stored securely with Supabase, our database provider.'],
        ['Your choices', 'You can delete your account and all its data at any time from the Account screen.'],
        ['Contact', 'Questions about your data? Contact us at the support email listed on our website.'],
      ]}
    />
  );
}
