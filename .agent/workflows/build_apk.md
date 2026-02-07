---
description: Build the Android APK (Debug)
---

1. Navigate to the android directory
   cd client-app/ClientApp/android

2. Clean the project
// turbo
   ./gradlew clean

3. Build the Debug APK
   ./gradlew assembleDebug

4. Verify the output
   The APK should be in `client-app/ClientApp/android/app/build/outputs/apk/debug/app-debug.apk`
