# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# Keep React Native modules
-keep class com.securify.app.NfcModule { *; }
-keep class com.securify.app.TrackingModule { *; }
-keep class com.securify.app.GeolocationModule { *; }
-keep class com.securify.app.TrackingPackage { *; }

# Keep all React Native bridge methods
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
}

# Keep NFC classes
-keep class android.nfc.** { *; }
-keep class android.nfc.tech.** { *; }
