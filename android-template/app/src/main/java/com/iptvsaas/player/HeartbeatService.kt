package com.iptvsaas.player

import android.app.AlertDialog
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.widget.Toast
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class HeartbeatService : Service() {

    companion object {
        private const val CHANNEL_ID = "heartbeat_channel"
        private const val NOTIFICATION_ID = 1
        private const val HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000L // 2 minutes
    }

    private val serviceScope = CoroutineScope(Dispatchers.Default + Job())

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())
        startHeartbeatLoop()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                BuildConfig.APP_NAME,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "${BuildConfig.APP_NAME} background service"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(BuildConfig.APP_NAME)
            .setContentText("${BuildConfig.APP_NAME} running")
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }

    private fun startHeartbeatLoop() {
        serviceScope.launch {
            while (true) {
                try {
                    val response = ApiService.heartbeat(this@HeartbeatService)
                    handleCommands(response.commands)
                } catch (e: Exception) {
                    // Ignore heartbeat errors, retry next cycle
                }
                delay(HEARTBEAT_INTERVAL_MS)
            }
        }
    }

    private fun handleCommands(commands: List<DeviceCommand>) {
        for (command in commands) {
            when (command.type) {
                "MESSAGE" -> {
                    val message = command.payload ?: "Message from admin"
                    // Broadcast to main thread for UI
                    val intent = Intent("com.iptvsaas.player.MESSAGE").apply {
                        putExtra("message", message)
                    }
                    sendBroadcast(intent)
                }
                "RESTART" -> {
                    val intent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                    }
                    intent?.let { startActivity(it) }
                }
                "TERMINATE" -> {
                    val intent = Intent("com.iptvsaas.player.TERMINATE")
                    sendBroadcast(intent)
                    stopSelf()
                }
            }
        }
    }
}
