import { ComingSoon } from '@/components/coming-soon';
import { Screen } from '@/components/screen';

export default function AuthScreen() {
  return (
    <Screen>
      <ComingSoon title="Sign in" note="Email and Google sign-in arrive in step 3." />
    </Screen>
  );
}
