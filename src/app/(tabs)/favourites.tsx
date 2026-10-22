import { ComingSoon } from '@/components/coming-soon';
import { Screen } from '@/components/screen';

export default function FavouritesScreen() {
  return (
    <Screen>
      <ComingSoon
        title="Favourites"
        note="Tap the heart on any track and it will rest here. Arrives with sign-in (step 3)."
      />
    </Screen>
  );
}
