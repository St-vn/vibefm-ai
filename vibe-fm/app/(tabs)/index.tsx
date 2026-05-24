import { View, Pressable, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useState } from 'react';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { colors, spacing } from '../../src/theme/tokens';
import { WaveformRing } from '../../src/components/WaveformRing';
import { SourceToggle } from '../../src/components/SourceToggle';
import { ResultSheet } from '../../src/components/ResultSheet';
import { runScan } from '../../src/lib/scanPipeline';
import { bytesToBase64, base64ToBytes } from '../../src/lib/base64';
import { useStore } from '../../src/data/store';
import { Track } from '../../src/types';

const WAV_HEADER_BYTES = 44;

const RECORD_MS = 5000;

export default function Capture() {
  const [source, setSource] = useState<'mic' | 'file'>('mic');
  const [phase, setPhase] = useState<'idle' | 'listening' | 'processing'>('idle');
  const [result, setResult] = useState<Track | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amp, setAmp] = useState(0);
  const addScan = useStore((s) => s.addScan);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  async function processBase64(base64: string) {
    setPhase('processing');
    const res = await runScan(base64);
    if (res.ok) {
      addScan(res.track);
      setResult(res.track);
    } else {
      setError(res.reason);
    }
    setPhase('idle');
  }

  async function handleMicScan() {
    if (phase !== 'idle') return;
    setError(null);
    setResult(null);
    setPhase('listening');

    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        {
          isMeteringEnabled: true,
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          ios: {
            extension: '.wav',
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
          },
        },
        (status) => {
          if (status.metering !== undefined) {
            // metering is in dB (-160 to 0)
            const amplitude = Math.max(0, 1 + status.metering / 60);
            setAmp(amplitude);
          }
        },
        100
      );

      setRecording(newRecording);

      setTimeout(async () => {
        try {
          await newRecording.stopAndUnloadAsync();
          const uri = newRecording.getURI();
          
          if (uri) {
            if (Platform.OS === 'web') {
              const buf = await (await fetch(uri)).arrayBuffer();
              const pcm = new Uint8Array(buf);
              await processBase64(bytesToBase64(pcm));
            } else {
              // Skip the 44-byte WAV header at the native level to get RAW PCM!
              const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64' as any,
                position: Platform.OS === 'ios' ? 44 : 0,
              });
              await processBase64(base64);
            }
          }
        } catch (e) {
          console.error("Recording processing error:", e);
          setError('Could not process recording');
          setPhase('idle');
        }
      }, RECORD_MS);
    } catch (e) {
      setError('Could not start recording');
      setPhase('idle');
    }
  }

  async function handleUpload() {
    if (phase !== 'idle') return;
    setError(null);
    setResult(null);

    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
      if (picked.canceled || !picked.assets?.[0]) return;

      setPhase('processing');
      const uri = picked.assets[0].uri;
      // expo-file-system File API is native-only; on web read the blob URI via fetch.
      if (Platform.OS === 'web') {
        const buf = await (await fetch(uri)).arrayBuffer();
        const pcm = new Uint8Array(buf);
        await processBase64(bytesToBase64(pcm));
      } else {
        const isWav = picked.assets[0].name.toLowerCase().endsWith('.wav');
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64' as any,
          position: isWav ? 44 : 0,
        });
        await processBase64(base64);
      }
    } catch (e) {
      setError('Could not read file');
      setPhase('idle');
    }
  }

  const handlePress = source === 'mic' ? handleMicScan : handleUpload;

  return (
    <View style={styles.c}>
      {/* Upload button removed due to API tech stack constraints */}

      <Pressable onPress={handlePress} disabled={phase !== 'idle'}>
        <WaveformRing active={phase === 'listening'} amplitude={amp} />
      </Pressable>

      {phase === 'listening' && <Text style={styles.hint}>Listening…</Text>}
      {phase === 'processing' && <ActivityIndicator color={colors.cyan} style={{ marginTop: spacing.lg }} />}
      {phase === 'idle' && !result && !error && (
        <Text style={styles.hint}>{source === 'mic' ? 'Tap to Scan' : 'Tap to Upload'}</Text>
      )}

      {error && (
        <View style={styles.errorSheet}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={handlePress}><Text style={styles.retry}>Retry</Text></Pressable>
        </View>
      )}

      {result && <ResultSheet track={result} onClose={() => setResult(null)} />}
    </View>
  );
}
const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  top: { position: 'absolute', top: 80 },
  hint: { color: colors.textSecondary, letterSpacing: 0.5, marginTop: spacing.xl, fontSize: 11 },
  errorSheet: {
    position: 'absolute', bottom: 40, backgroundColor: colors.surface, borderColor: colors.border,
    borderWidth: 1, borderRadius: 16, padding: spacing.lg, alignItems: 'center'
  },
  errorText: { color: colors.textPrimary, marginBottom: spacing.sm },
  retry: { color: colors.cyan, letterSpacing: 0.5, fontWeight: '700' },
});
