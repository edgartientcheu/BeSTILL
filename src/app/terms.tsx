import { LegalPage } from '@/components/legal-page';

// DRAFT. To be reviewed and completed before launch (step 6 checklist).
export default function TermsScreen() {
  return (
    <LegalPage
      title="Terms of Use"
      updated="October 2026 (draft)"
      sections={[
        [
          'The music',
          'All recordings in BE STILL are original works by Pastor Edgar and are for personal listening only. Please don’t copy, download, share or re-publish them.',
        ],
        [
          'Subscriptions',
          'Some tracks are free. The full library needs a subscription: $6.99 CAD per month or $59.99 CAD per year. New members get a 7-day free trial; if you cancel before it ends you won’t be charged. Subscriptions renew automatically until cancelled.',
        ],
        [
          'Cancelling',
          'You can cancel anytime from Account → Manage subscription. You keep access until the end of the period you’ve paid for.',
        ],
        [
          'Your account',
          'Keep your password private. You can delete your account at any time from the Account screen.',
        ],
        ['Contact', 'Questions? Contact us at the support email listed on our website.'],
      ]}
    />
  );
}
