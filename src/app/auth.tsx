import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const theme = useTheme();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { signIn, signUp, signInWithGoogle, configured } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const finish = () => {
    // Only follow in-app paths, never an outside address.
    if (next?.startsWith('/') && !next.startsWith('//')) router.replace(next as Href);
    else if (router.canGoBack()) router.back();
    else router.replace('/account');
  };

  async function submit() {
    setError(null);
    setNotice(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Please enter your email address.');
    if (password.length < 8) return setError('Your password needs at least 8 characters.');
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        finish();
      } else {
        const { needsConfirmation } = await signUp(email, password);
        if (needsConfirmation) {
          setNotice('Almost there. We sent you an email: tap the link inside to confirm, then sign in here.');
          setMode('signin');
        } else finish();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    try {
      await signInWithGoogle(); // the browser leaves for Google and comes back signed in
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <Screen>
      <IconButton label="Close" onPress={finish} style={styles.close}>
        <Ionicons name="close" size={26} color={theme.textSecondary} />
      </IconButton>

      <View style={styles.header}>
        <AppText variant="title">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</AppText>
        <AppText secondary>
          {mode === 'signin'
            ? 'Sign in to your quiet place.'
            : 'Save your favourites and keep your library on every device.'}
        </AppText>
      </View>

      {!configured ? (
        <AppText secondary role="alert">
          Accounts aren’t connected yet. Add the Supabase keys to .env (see README).
        </AppText>
      ) : null}

      <Button label="Continue with Google" icon="globe" variant="secondary" onPress={google} disabled={busy} />

      <View style={styles.divider}>
        <View style={[styles.line, { backgroundColor: theme.border }]} />
        <AppText variant="caption" secondary>
          or with email
        </AppText>
        <View style={[styles.line, { backgroundColor: theme.border }]} />
      </View>

      <View style={styles.form}>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          inputMode="email"
          returnKeyType="next"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          textContentType={mode === 'signin' ? 'password' : 'newPassword'}
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        {error ? (
          <AppText role="alert" style={{ color: theme.text }}>
            {error}
          </AppText>
        ) : null}
        {notice ? (
          <AppText role="status" style={{ color: theme.accent }}>
            {notice}
          </AppText>
        ) : null}
        <Button
          label={busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          onPress={submit}
          disabled={busy}
        />
      </View>

      <Button
        variant="quiet"
        label={mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}
        onPress={() => {
          setMode(mode === 'signin' ? 'signup' : 'signin');
          setError(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  close: { marginLeft: -12, marginBottom: -Spacing.md },
  header: { gap: Spacing.xs },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  form: { gap: Spacing.md },
});
