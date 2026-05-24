# vibe.fm — Technical Stack Document

**Target:** React Native / Expo Managed Workflow (Continuous Native Generation) + Python Offline Analysis
**Status:** Production-Ready Architecture
**Version:** 1.3 (Security Hardened)

This document defines the strict environment constraints for frontend capture, API integrations, and the offline Python analysis pipeline.

---

## Section 1: Mobile Frontend Architecture (Expo CNG)

The mobile application is built using Expo SDK 51.0.0+ utilizing Continuous Native Generation (CNG). 

### JavaScript / Expo Dependencies

| Package | Version Range | Purpose |
|---|---|---|
| `expo` | `^51.0.0` | Core framework |
| `@siteed/audio-studio` | `^3.0.2` | Real-time PCM mic capture |
| `expo-haptics` | `~13.0.1` | BPM-synced haptic feedback |
| `expo-location` | `~17.0.1` | GPS reverse geocoding |
| `expo-file-system` | `~17.0.1` | Local file management (WAV parsing) |
| `react-native-reanimated` | `~3.10.1` | 60fps animations |

---

## Section 2: Live Integration Layer & Safeguards

### External API Targets

#### 1. Shazam via RapidAPI (`apidojo/shazam`)
- **Input:** Base64 PCM.
- **Safeguard:** For file uploads, use `expo-file-system` to read the file and **manually trim the first 59 characters** of the resulting Base64 string. 
    - *Logic:* 44 bytes (WAV header) * 1.33 (Base64 overhead) ≈ 59 characters. This ensures the header is stripped to avoid HTTP 204 errors.

#### 4. LLM Routing Engine (OpenRouter - Gemini Flash 2.5)
- **Safeguard:** **CRITICAL:** You must enforce `response_format: { "type": "json_object" }` in the API payload and instruct the model to return ONLY JSON to prevent parsing crashes.

### Section 4: Mobile Hardware Safeguards

**iOS Haptic Conflict Resolution:**
The iOS Taptic engine is disabled during active recording. To ensure the BPM pulse fires reliably:
- Use a `setInterval` poller to verify that the hardware status has transitioned to `disconnected` before triggering `Haptics.impactAsync`.
- Do not rely solely on the `stopRecording` promise resolution, as the OS may still be holding the hardware lock.
