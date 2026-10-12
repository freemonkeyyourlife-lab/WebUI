# Android wrapper notes

We use a Capacitor or Cordova wrapper around the local WebUI to create a simple Android app that connects to a locally running K.I.T.T. backend over the local network.

Constraints
- Android apps cannot directly host the backend for heavy inference; the backend must be running on a local PC or server reachable via Wi-Fi or USB reverse-tunneling.
- For full offline operation on Android you would need to cross-compile models for Android and run inference on-device (advanced).

Steps
1. Build the WebUI as a PWA or static assets.
2. Create a Capacitor project and point the web assets to the built site or the local host URL.
3. Build the Android APK via Android Studio.

This is optional and can be implemented after the desktop installers are stable.
