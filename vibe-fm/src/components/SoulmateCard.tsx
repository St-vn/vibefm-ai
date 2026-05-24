import { useState } from 'react';
import { View, Text, ImageBackground, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, radius, spacing } from '../theme/tokens';
import { Tag } from './Tag';
import { UserVector, Track } from '../types';
import { findTrackByTitle } from '../lib/trackLookup';

const DIMS = ['TEMPO', 'ENERGY', 'ACOUSTIC', 'INSTRUMENTAL', 'VALENCE'];
const MAX_CHIPS = 4;
const DEFAULT_AVATAR =
  'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi.pinimg.com%2F736x%2F81%2F8a%2F1b%2F818a1b89a57c2ee0fb7619b95e11aebd.jpg&f=1&nofb=1&ipt=128fdde9dc857f823db76d46472bc094f791f6bab75af41f2a39a5c6c110ced6';

const LOCAL_ASSETS: Record<string, any> = {
  'kanye.jpg': require('../../assets/images/pfp/kanye.jpg'),
  'drake.jpg': require('../../assets/images/pfp/drake.jpg'),
  'stvn.jpg': require('../../assets/images/pfp/stvn.jpg'),
};

function resolveAvatar(avatar?: string) {
  if (avatar) {
    if (avatar.startsWith('local:')) {
      const key = avatar.split(':')[1];
      if (LOCAL_ASSETS[key]) return LOCAL_ASSETS[key];
    } else {
      return { uri: avatar };
    }
  }
  return { uri: DEFAULT_AVATAR };
}

function SongChip({ title, onPress }: { title: string; track: Track; onPress: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[styles.chip, hovered && styles.chipHover]}
    >
      <Text numberOfLines={1} style={[styles.chipText, hovered && styles.chipTextHover]}>{title}</Text>
      <Text style={styles.chipChevron}>{'›'}</Text>
    </Pressable>
  );
}

export function SoulmateCard({ profile, score, userVector, onTrackPress }:
  {
    profile: UserVector;
    score: number;
    userVector: [number, number, number, number, number];
    onTrackPress?: (track: Track) => void;
  }) {
  const aligned: string[] = [];
  const diverges: string[] = [];
  const norm = (v: number, i: number) => (i === 0 ? v / 200 : v);
  DIMS.forEach((d, i) => {
    const delta = Math.abs(norm(profile.vector[i], i) - norm(userVector[i], i));
    (delta < 0.15 ? aligned : diverges).push(d);
  });

  const songs = profile.topSongs.slice(0, MAX_CHIPS);

  return (
    <ImageBackground source={resolveAvatar(profile.avatar)} resizeMode="cover" style={styles.card} imageStyle={styles.imageRadius}>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.45, 1]}
        style={styles.scrim}
      >
        <View style={styles.content}>
          <View style={styles.identityRow}>
            <View style={styles.identityLeft}>
              <Text style={styles.name} numberOfLines={1}>{profile.displayName}</Text>
              <Text style={styles.loc}>{profile.location}</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.score}>{score}%</Text>
              <Text style={styles.scoreLabel}>MATCH</Text>
            </View>
          </View>

          <Text style={styles.section}>SHARED ARTISTS</Text>
          <View style={styles.tagRow}>
            {profile.topArtists.map((a) => <Tag key={a} label={a} variant="outlined" tint={colors.cyan} />)}
          </View>

          <Text style={styles.section}>TOP TRACKS</Text>
          <View style={styles.chipWrap}>
            {songs.map((s) => {
              const track = findTrackByTitle(s);
              if (track && onTrackPress) {
                return <SongChip key={s} title={s} track={track} onPress={() => onTrackPress(track)} />;
              }
              return (
                <View key={s} style={[styles.chip, styles.chipPlain]}>
                  <Text numberOfLines={1} style={styles.chipTextPlain}>{s}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.dimRow}>
            <View style={styles.dimCol}>
              <Text style={styles.section}>ALIGNED</Text>
              <View style={styles.tagRow}>
                {aligned.map((d) => <Tag key={d} label={d} variant="filled" tint={colors.green} />)}
              </View>
            </View>
            <View style={styles.dimCol}>
              <Text style={styles.section}>DIVERGES</Text>
              <View style={styles.tagRow}>
                {diverges.map((d) => <Tag key={d} label={d} variant="outlined" tint={colors.textSecondary} />)}
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}
const styles = StyleSheet.create({
  card: { width: '90%', height: '82%', borderRadius: radius.lg, overflow: 'hidden',
    backgroundColor: colors.surfaceElevated, justifyContent: 'flex-end' },
  imageRadius: { borderRadius: radius.lg },
  scrim: { justifyContent: 'flex-end', paddingTop: 80 },
  content: { padding: spacing.lg },
  identityRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  identityLeft: { flex: 1, marginRight: spacing.md },
  name: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  loc: { color: colors.textPrimary, opacity: 0.85, fontSize: 13, marginTop: 2 },
  scoreBox: { alignItems: 'flex-end' },
  score: { color: colors.green, fontFamily: fonts.mono, fontSize: 40, fontWeight: '800' },
  scoreLabel: { color: colors.green, fontSize: 10, letterSpacing: 3, marginTop: -4 },
  section: { color: colors.textPrimary, opacity: 0.7, fontSize: 10, letterSpacing: 2, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.xs },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)',
    borderColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderRadius: radius.pill,
    paddingVertical: 6, paddingHorizontal: 12, marginRight: 8, marginBottom: 8, maxWidth: '100%' },
  chipHover: { backgroundColor: 'rgba(6,182,212,0.25)', borderColor: colors.cyan },
  chipPlain: { opacity: 0.5 },
  chipText: { color: colors.textPrimary, fontSize: 13, flexShrink: 1 },
  chipTextHover: { color: colors.cyan, fontWeight: '700' },
  chipTextPlain: { color: colors.textPrimary, fontSize: 13, flexShrink: 1 },
  chipChevron: { color: colors.cyan, fontSize: 15, fontWeight: '700', marginLeft: 6 },
  dimRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  dimCol: { flex: 1, marginRight: spacing.sm },
});
