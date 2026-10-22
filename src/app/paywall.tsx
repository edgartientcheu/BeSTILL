import { ComingSoon } from '@/components/coming-soon';
import { Screen } from '@/components/screen';

export default function PaywallScreen() {
  return (
    <Screen>
      <ComingSoon title="Unlock your quiet place" note="Subscription plans and the free trial arrive in step 4." />
    </Screen>
  );
}
