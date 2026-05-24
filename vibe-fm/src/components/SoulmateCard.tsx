import { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme/tokens';
import { Tag } from './Tag';
import { UserVector, Track } from '../types';
import { findTrackByTitle } from '../lib/trackLookup';

const DIMS = ['TEMPO', 'ENERGY', 'ACOUSTIC', 'INSTRUMENTAL', 'VALENCE'];

const LOCAL_ASSETS: Record<string, any> = {
  'kanye.jpg': require('../../assets/images/pfp/kanye.jpg'),
  'drake.jpg': require('../../assets/images/pfp/drake.jpg'),
  'stvn.jpg': require('../../assets/images/pfp/stvn.jpg'),
};

function SongRow({ title, onPress }: { title: string; track: Track; onPress: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[styles.songRow, hovered && styles.songRowHover]}
    >
      <Text style={[styles.songText, hovered && styles.songTextHover]}>{title}</Text>
      <Text style={styles.songChevron}>{'›'}</Text>
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
  const initials = profile.displayName.split(' ').map((w) => w[0]).join('').slice(0, 2);
  const aligned: string[] = [];
  const diverges: string[] = [];
  const norm = (v: number, i: number) => (i === 0 ? v / 200 : v);
  DIMS.forEach((d, i) => {
    const delta = Math.abs(norm(profile.vector[i], i) - norm(userVector[i], i));
    (delta < 0.15 ? aligned : diverges).push(d);
  });

  const renderAvatar = () => {
    if (profile.avatar) {
      if (profile.avatar.startsWith('local:')) {
        const key = profile.avatar.split(':')[1];
        if (LOCAL_ASSETS[key]) {
          return <Image source={LOCAL_ASSETS[key]} style={styles.avatarImage} />;
        }
      } else {
        return <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />;
      }
    }
    return <View style={styles.avatarPlaceholder}><Text style={styles.initials}>{initials}</Text></View>;
  };

  return (
    <View style={styles.card}>
      {renderAvatar()}
      <Text style={styles.name}>{profile.displayName}</Text>
      <Text style={styles.loc}>{profile.location}</Text>

      <Text style={styles.score}>{score}%</Text>
      <Text style={styles.scoreLabel}>COMPATIBILITY</Text>

      <Text style={styles.section}>SHARED ARTISTS</Text>
      <View style={styles.tagRow}>{profile.topArtists.map((a) => <Tag key={a} label={a} variant="outlined" tint={colors.cyan} />)}</View>

      <Text style={styles.section}>TOP TRACKS</Text>
      <View style={styles.songList}>
        {profile.topSongs.map((s) => {
          const track = findTrackByTitle(s);
          if (track && onTrackPress) {
            return <SongRow key={s} title={s} track={track} onPress={() => onTrackPress(track)} />;
          }
          return <Text key={s} style={styles.songTextPlain}>{s}</Text>;
        })}
      </View>

      <Text style={styles.section}>ALIGNED</Text>
      <View style={styles.tagRow}>{aligned.map((d) => <Tag key={d} label={d} variant="filled" tint={colors.green} />)}</View>

      <Text style={styles.section}>DIVERGES</Text>
      <View style={styles.tagRow}>{diverges.map((d) => <Tag key={d} label={d} variant="outlined" tint={colors.textSecondary} />)}</View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { width: '90%', height: '78%', backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' },
  avatarPlaceholder: { width: 112, height: 112, borderRadius: 56, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 112, height: 112, borderRadius: 56, backgroundColor: colors.surfaceElevated, borderWidth: 2, borderColor: colors.border },
  initials: { color: '#fff', fontSize: 38, fontWeight: '700' },
  name: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginTop: spacing.sm },
  loc: { color: colors.textSecondary, fontSize: 12 },
  score: { color: colors.green, fontFamily: fonts.mono, fontSize: 56, fontWeight: '700', marginTop: spacing.md },
  scoreLabel: { color: colors.green, fontSize: 10, letterSpacing: 3 },
  section: { color: colors.textSecondary, fontSize: 10, letterSpacing: 2, fontWeight: '700', alignSelf: 'flex-start', marginTop: spacing.md },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'flex-start', marginTop: spacing.xs },
  songList: { alignSelf: 'stretch', marginTop: spacing.xs },
  songRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, paddingHorizontal: 10, borderRadius: radius.sm, marginBottom: 4,
    borderWidth: 1, borderColor: 'transparent' },
  songRowHover: { backgroundColor: colors.surfaceElevated, borderColor: colors.cyan },
  songText: { color: colors.textPrimary, fontSize: 13 },
  songTextHover: { color: colors.cyan, fontWeight: '700' },
  songTextPlain: { color: colors.textTertiary, fontSize: 13, paddingVertical: 8, paddingHorizontal: 10 },
  songChevron: { color: colors.cyan, fontSize: 16, fontWeight: '700' },
});
