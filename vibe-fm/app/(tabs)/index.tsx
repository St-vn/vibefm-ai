import { View, Pressable, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useState, useRef } from 'react';
import { useAudioRecorder, type AudioDataEvent, type RecordingConfig } from '@siteed/expo-audio-studio';
import * as DocumentPicker from 'expo-document-picker';
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
  const pcmChunks = useRef<string[]>([]);
  const addScan = useStore((s) => s.addScan);
  const { startRecording, stopRecording } = useAudioRecorder();

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
    pcmChunks.current = [];
    setPhase('listening');

    const config: RecordingConfig = {
      sampleRate: 44100,
      channels: 1,
      encoding: 'pcm_16bit',
      interval: 100,
      onAudioStream: async (event: AudioDataEvent) => {
        if (typeof event.data === 'string') {
          pcmChunks.current.push(event.data);
          setAmp(Math.min(1, event.data.length / 20000));
        }
      },
    };

    try {
      await startRecording(config);
      setTimeout(async () => {
        try {
          await stopRecording();
        } catch {
          // ignore stop errors; proceed with whatever was captured
        }
        await processBase64(pcmChunks.current.join(''));
      }, RECORD_MS);
    } catch (e) {
      setError('Could not identify');
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
      let all: Uint8Array;
      if (Platform.OS === 'web') {
        const buf = await (await fetch(uri)).arrayBuffer();
        all = new Uint8Array(buf);
      } else {
        const FileSystem = require('expo-file-system');
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        all = base64ToBytes(base64);
      }
      // Strip the 44-byte WAV header at the BYTE level before base64 (never trim the base64 string).
      const pcm = all.length > WAV_HEADER_BYTES ? all.subarray(WAV_HEADER_BYTES) : all;
      await processBase64(bytesToBase64(pcm));
    } catch (e) {
      setError('Could not read file');
      setPhase('idle');
    }
  }

  const handlePress = source === 'mic' ? handleMicScan : handleUpload;

  return (
    <View style={styles.c}>
      <View style={styles.top}><SourceToggle value={source} onChange={setSource} /></View>

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
