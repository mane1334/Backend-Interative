package com.clientapp

import android.app.Activity
import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class KioskModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "KioskModule"
    }

    @ReactMethod
    fun startKiosk() {
        val activity = reactApplicationContext.currentActivity
        if (activity != null) {
            activity.runOnUiThread {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    try {
                        activity.startLockTask()
                    } catch (e: Exception) {
                        // Handle exception (e.g., if app is not device owner, pin mode might be used instead)
                    }
                }
                hideSystemUI(activity)
            }
        }
    }

    @ReactMethod
    fun stopKiosk() {
        val activity = reactApplicationContext.currentActivity
        if (activity != null) {
            activity.runOnUiThread {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    try {
                        activity.stopLockTask()
                    } catch (e: Exception) {
                        // Handle exception
                    }
                }
                showSystemUI(activity)
            }
        }
    }

    @ReactMethod
    fun exitApp() {
        val activity = reactApplicationContext.currentActivity
        activity?.finishAffinity()
        System.exit(0)
    }

    private fun hideSystemUI(activity: Activity) {
        val decorView = activity.window.decorView
        val uiOptions = (android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or android.view.View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or android.view.View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or android.view.View.SYSTEM_UI_FLAG_FULLSCREEN)
        decorView.systemUiVisibility = uiOptions
    }

    private fun showSystemUI(activity: Activity) {
        val decorView = activity.window.decorView
        decorView.systemUiVisibility = (android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or android.view.View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or android.view.View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN)
    }
}
