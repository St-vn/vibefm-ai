import { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Pressable, ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius, spacing } from '../theme/tokens';
import { Track } from '../types';
import { FingerprintBars } from './FingerprintBars';
import { Tag } from './Tag';

const STAGGER = 80;

function Section({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 260, delay: index * STAGGER }}
    >
      {children}
    </MotiView>
  );
}

export function ResultSheet({ track, onClose }: { track: Track; onClose: () => void }) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const periodMs = Math.max(250, 60000 / Math.max(40, track.tempo));
    const id = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    }, periodMs);
    return () => clearInterval(id);
  }, [track.tempo]);

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <MotiView
        from={{ translateY: 375 }}
        animate={{ translateY: 0 }}
        transition={{ type: 'spring', damping: 50 }}
        style={styles.sheet}
      >
        <View style={styles.handle} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.lg }]}
        >
          <Section index={0}>
            <View style={styles.hero}>
              <Image source={{ uri: track.albumArt }} style={styles.art} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.title}>{track.title}</Text>
                <Text style={styles.artist}>{track.artist}</Text>
                <Text style={styles.album} numberOfLines={1}>{track.album}</Text>
              </View>
              <View style={styles.bpmBox}>
                <Text style={styles.bpm}>{Math.round(track.tempo)}</Text>
                <Text style={styles.bpmLabel}>BPM</Text>
              </View>
            </View>
          </Section>

          <Section index={1}>
            <View style={styles.tagRow}>
              {track.moodLabel && <Tag label={track.moodLabel} variant="filled" tint={colors.purple} />}
              {track.microGenre && <Tag label={track.microGenre} variant="outlined" tint={colors.purple} />}
            </View>
          </Section>

          <Section index={2}>
            <FingerprintBars track={track} />
          </Section>

          <Section index={3}>
            <Text style={styles.desc}>{track.qualitativeDescription}</Text>
          </Section>

          <Section index={4}>
            <View style={styles.streamingRow}>
              <Pressable
                style={[styles.streamBtn, { backgroundColor: '#1DB954' }]}
                onPress={() => Linking.openURL(track.spotifyUrl || `https://open.spotify.com/search/${encodeURIComponent(track.artist + ' ' + track.title)}`)}
              >
                <FontAwesome name="spotify" size={20} color="#000" />
                <Text style={[styles.streamTxt, { color: '#000' }]}>Spotify</Text>
              </Pressable>
              <Pressable
                style={[styles.streamBtn, { backgroundColor: '#FC3C44' }]}
                onPress={() => Linking.openURL(track.appleMusicUrl || `https://music.apple.com/search?term=${encodeURIComponent(track.artist + ' ' + track.title)}`)}
              >
                <Image
                  source={require('../../assets/images/apple-music.png')}
                  style={{ width: 20, height: 20, tintColor: '#fff' }}
                />
                <Text style={[styles.streamTxt, { color: '#fff' }]}>Apple Music</Text>
              </Pressable>
            </View>
          </Section>

          <Section index={5}>
            <View style={styles.profile}>
              <Text style={styles.profileName}>{track.sonicProfile.name || ''}</Text>
              <View style={styles.tagRow}>
                {track.sonicProfile.tags.map((t) => (
                  <Tag key={t} label={t} variant="outlined" tint={colors.purple} />
                ))}
              </View>
            </View>
          </Section>
        </ScrollView>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    borderColor: colors.border, borderWidth: 1, paddingTop: spacing.lg, paddingHorizontal: spacing.lg,
    maxHeight: '85%',
  },
  scrollContent: { paddingTop: spacing.xs },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.textTertiary, alignSelf: 'center', marginBottom: spacing.md },
  hero: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  art: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: colors.surfaceElevated },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  artist: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  album: { color: colors.textTertiary, fontSize: 12, marginTop: 2 },
  bpmBox: { alignItems: 'center' },
  bpm: { color: colors.green, fontFamily: fonts.mono, fontSize: 20, fontWeight: '700' },
  bpmLabel: { color: colors.green, fontSize: 9, letterSpacing: 0.5 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: spacing.sm },
  desc: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginVertical: spacing.md },
  streamingRow: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.sm },
  streamBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: radius.md, gap: 8 },
  streamTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  profile: { marginTop: spacing.sm },
  profileName: { color: colors.purple, fontSize: 13, letterSpacing: 0.5, fontWeight: 'bold', marginBottom: spacing.xs },
});
