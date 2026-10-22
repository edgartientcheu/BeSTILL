import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Cover } from '@/components/cover';
import { FilePicker } from '@/components/file-picker';
import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { MinTapSize, Radius, Spacing } from '@/constants/theme';
import { CATEGORIES, categoryLabel, formatDuration, type CategoryId, type Track } from '@/data/tracks';
import { useTheme } from '@/hooks/use-theme';
import { checkFiles, deleteTrack, listAllTracks, updateTrack, uploadTrack } from '@/lib/admin';
import { useAuth } from '@/lib/auth';
import { confirm } from '@/lib/confirm';
import { useLibrary } from '@/lib/library';

/** The owner's private page for adding and managing tracks. */
export default function AdminScreen() {
  const theme = useTheme();
  const { ready, user, profile } = useAuth();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/account'));

  let body: React.ReactNode;
  if (!ready || (user && !profile)) body = <ActivityIndicator color={theme.accent} style={styles.loading} />;
  else if (!user) {
    body = (
      <>
        <AppText secondary>Please sign in with the owner account.</AppText>
        <Button label="Sign in" onPress={() => router.push({ pathname: '/auth', params: { next: '/admin' } })} />
      </>
    );
  } else if (!profile?.is_admin) body = <AppText secondary>This page is only for the owner of BE STILL.</AppText>;
  else body = <Manager />;

  return (
    <Screen>
      <IconButton label="Back" onPress={close} style={styles.back}>
        <Ionicons name="chevron-back" size={26} color={theme.textSecondary} />
      </IconButton>
      <AppText variant="title">Your music</AppText>
      {body}
    </Screen>
  );
}

function Manager() {
  const { reload } = useLibrary();
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    listAllTracks()
      .then((t) => setTracks(t))
      .catch((e) => setError(e.message));
  }, [version]);

  const refresh = () => {
    setVersion((v) => v + 1);
    reload(); // the listening side of the app picks up the change too
  };

  return (
    <>
      <UploadForm existing={tracks ?? []} onUploaded={refresh} />
      <View style={styles.section}>
        <AppText variant="heading">Library</AppText>
        {error ? <AppText role="alert">{error}</AppText> : null}
        {tracks === null ? <ActivityIndicator /> : null}
        {tracks?.map((t) => (
          <TrackAdminRow key={t.id} track={t} onChanged={refresh} />
        ))}
      </View>
    </>
  );
}

function UploadForm({ existing, onUploaded }: { existing: Track[]; onUploaded: () => void }) {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryId>('prayer');
  const [isFree, setIsFree] = useState(false);
  const [publish, setPublish] = useState(true);
  const [audio, setAudio] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: 'error' | 'ok' } | null>(null);
  const [formKey, setFormKey] = useState(0); // resets the file pickers after an upload

  async function submit() {
    setMessage(null);
    if (!title.trim()) return setMessage({ text: 'Please give the track a title.', tone: 'error' });
    const problem = checkFiles(audio, cover);
    if (problem || !audio) return setMessage({ text: problem ?? '', tone: 'error' });
    setBusy(true);
    try {
      const track = await uploadTrack({ title, description, category, isFree, publish, audio, cover }, existing);
      setMessage({
        text: `“${track.title}” is uploaded${track.published ? ' and live in the app' : ' as a draft'}.`,
        tone: 'ok',
      });
      setTitle('');
      setDescription('');
      setAudio(null);
      setCover(null);
      setFormKey((k) => k + 1);
      onUploaded();
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'Upload failed.', tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.surface }]} key={formKey}>
      <AppText variant="heading">Add a track</AppText>
      <TextField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Morning Peace" />
      <TextField
        label="Description (optional)"
        value={description}
        onChangeText={setDescription}
        placeholder="One gentle sentence"
        multiline
      />

      <View style={styles.group}>
        <AppText variant="label">Category</AppText>
        <View role="radiogroup" style={styles.chips}>
          {CATEGORIES.map((c) => (
            <Choice key={c.id} label={c.label} selected={category === c.id} onPress={() => setCategory(c.id)} />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <AppText variant="label">Who can listen?</AppText>
        <View role="radiogroup" style={styles.chips}>
          <Choice label="Paid (subscribers)" selected={!isFree} onPress={() => setIsFree(false)} />
          <Choice label="Free preview" selected={isFree} onPress={() => setIsFree(true)} />
        </View>
      </View>

      <FilePicker
        label="Recording (MP3 or M4A)"
        accept=".mp3,.m4a,audio/mpeg,audio/mp4"
        file={audio}
        onChange={(f) => {
          setAudio(f);
          setMessage(null);
        }}
      />
      <FilePicker
        label="Cover image (optional)"
        accept=".jpg,.jpeg,.png,.webp,image/*"
        file={cover}
        onChange={(f) => {
          setCover(f);
          setMessage(null);
        }}
      />

      <View style={styles.switchRow}>
        <AppText style={styles.flex}>Publish now (otherwise it stays a hidden draft)</AppText>
        <Switch
          value={publish}
          onValueChange={setPublish}
          accessibilityLabel="Publish now"
          trackColor={{ true: theme.accent, false: theme.border }}
          thumbColor={theme.surface}
          {...{ activeThumbColor: theme.surface }} // web: the knob colour when on
        />
      </View>

      {message ? (
        <AppText
          role={message.tone === 'error' ? 'alert' : 'status'}
          style={{ color: message.tone === 'error' ? theme.text : theme.accent }}>
          {message.text}
        </AppText>
      ) : null}
      <Button
        label={busy ? 'Uploading… this can take a minute' : 'Upload track'}
        icon="upload-cloud"
        onPress={submit}
        disabled={busy}
      />
    </View>
  );
}

function TrackAdminRow({ track, onChanged }: { track: Track; onChanged: () => void }) {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await action();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const ok = await confirm(
      `Delete “${track.title}”?`,
      'The recording and cover are removed for good and it disappears from everyone’s app.',
      'Delete',
    );
    if (ok) act(() => deleteTrack(track));
  }

  return (
    <View style={[styles.row, { backgroundColor: theme.surface, opacity: busy ? 0.6 : 1 }]}>
      <View style={styles.rowTop}>
        <Cover track={track} size={48} radius={Radius.sm} />
        <View style={styles.flex}>
          <AppText variant="label" numberOfLines={1}>
            {track.title}
          </AppText>
          <AppText variant="caption" secondary>
            {categoryLabel(track.category)} · {formatDuration(track.duration_seconds)} ·{' '}
            {track.is_free ? 'Free' : 'Paid'} · {track.published ? 'Live' : 'Draft'}
            {track.audio_path ? '' : ' · placeholder'}
          </AppText>
        </View>
      </View>
      <View style={styles.actions}>
        <Button
          label={track.published ? 'Hide' : 'Publish'}
          variant="secondary"
          disabled={busy}
          onPress={() => act(() => updateTrack(track.id, { published: !track.published }))}
        />
        <Button
          label={track.is_free ? 'Make paid' : 'Make free'}
          variant="secondary"
          disabled={busy}
          onPress={() => act(() => updateTrack(track.id, { is_free: !track.is_free }))}
        />
        <Button label="Delete" variant="quiet" disabled={busy} onPress={remove} />
      </View>
      {error ? <AppText role="alert">{error}</AppText> : null}
    </View>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      role="radio"
      aria-checked={selected}
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.choice,
        {
          backgroundColor: selected ? theme.accent : theme.background,
          borderColor: selected ? theme.accent : theme.border,
        },
      ]}>
      <AppText variant="label" style={{ color: selected ? theme.onAccent : theme.text }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  back: { marginLeft: -12, marginBottom: -Spacing.md },
  loading: { marginTop: Spacing.xl },
  section: { gap: Spacing.sm },
  card: { borderRadius: Radius.md, padding: Spacing.lg, gap: Spacing.md },
  group: { gap: Spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  choice: {
    minHeight: MinTapSize - 4,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flex: { flex: 1 },
  row: { borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
