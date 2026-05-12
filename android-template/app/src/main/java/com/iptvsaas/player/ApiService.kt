package com.iptvsaas.player

import android.content.Context
import android.os.Build
import android.provider.Settings
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

data class HeartbeatResponse(
    val commands: List<DeviceCommand>
)

data class DeviceCommand(
    val type: String,
    val payload: String?
)

object ApiService {

    private val portalUrl = BuildConfig.PORTAL_URL

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .build()

    private val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()

    private const val PREFS_NAME = "iptvsaas_prefs"
    private const val KEY_DEVICE_TOKEN = "device_token"

    fun getDeviceId(context: Context): String {
        return Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID) ?: "unknown"
    }

    fun getDeviceToken(context: Context): String? {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_DEVICE_TOKEN, null)
    }

    private fun saveDeviceToken(context: Context, token: String) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_DEVICE_TOKEN, token)
            .apply()
    }

    suspend fun register(context: Context) = withContext(Dispatchers.IO) {
        val deviceId = getDeviceId(context)
        val body = JSONObject().apply {
            put("deviceId", deviceId)
            put("model", Build.MODEL)
            put("appVersion", BuildConfig.VERSION_NAME)
        }.toString().toRequestBody(JSON_MEDIA_TYPE)

        val request = Request.Builder()
            .url("$portalUrl/api/device/register")
            .post(body)
            .build()

        client.newCall(request).execute().use { response ->
            if (response.isSuccessful) {
                val json = JSONObject(response.body?.string() ?: "{}")
                val token = json.optString("token")
                if (token.isNotEmpty()) {
                    saveDeviceToken(context, token)
                }
            }
        }
    }

    suspend fun heartbeat(context: Context): HeartbeatResponse = withContext(Dispatchers.IO) {
        val token = getDeviceToken(context) ?: return@withContext HeartbeatResponse(emptyList())
        val deviceId = getDeviceId(context)

        val body = JSONObject().apply {
            put("deviceId", deviceId)
        }.toString().toRequestBody(JSON_MEDIA_TYPE)

        val request = Request.Builder()
            .url("$portalUrl/api/device/heartbeat")
            .addHeader("Authorization", "Bearer $token")
            .post(body)
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) return@withContext HeartbeatResponse(emptyList())
            val json = JSONObject(response.body?.string() ?: "{}")
            val commandsArray = json.optJSONArray("commands") ?: return@withContext HeartbeatResponse(emptyList())
            val commands = mutableListOf<DeviceCommand>()
            for (i in 0 until commandsArray.length()) {
                val cmd = commandsArray.getJSONObject(i)
                commands.add(DeviceCommand(
                    type = cmd.optString("type"),
                    payload = cmd.optString("payload").takeIf { it.isNotEmpty() }
                ))
            }
            HeartbeatResponse(commands)
        }
    }

    suspend fun reportError(context: Context, type: String, streamUrl: String?) = withContext(Dispatchers.IO) {
        val token = getDeviceToken(context) ?: return@withContext
        val deviceId = getDeviceId(context)

        val body = JSONObject().apply {
            put("deviceId", deviceId)
            put("errorType", type)
            streamUrl?.let { put("streamUrl", it) }
        }.toString().toRequestBody(JSON_MEDIA_TYPE)

        val request = Request.Builder()
            .url("$portalUrl/api/device/errors")
            .addHeader("Authorization", "Bearer $token")
            .post(body)
            .build()

        client.newCall(request).execute().use { /* fire and forget */ }
    }

    suspend fun getLiveChannels(): JSONObject = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url("$portalUrl/api/xtream/live")
            .get()
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) return@withContext JSONObject()
            JSONObject(response.body?.string() ?: "{}")
        }
    }
}
