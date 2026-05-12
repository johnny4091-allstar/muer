package com.iptvsaas.player

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject

data class Channel(val id: String, val name: String, val streamUrl: String, val category: String)

class CategoryAdapter(
    private val categories: List<String>,
    private val onSelect: (String) -> Unit
) : RecyclerView.Adapter<CategoryAdapter.VH>() {

    private var selectedPos = 0

    inner class VH(view: View) : RecyclerView.ViewHolder(view) {
        val text: TextView = view.findViewById(android.R.id.text1)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val v = LayoutInflater.from(parent.context)
            .inflate(android.R.layout.simple_list_item_1, parent, false)
        return VH(v)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        holder.text.text = categories[position]
        holder.text.setTextColor(
            if (position == selectedPos) 0xFF1D6BFF.toInt() else 0xFFCCCCCC.toInt()
        )
        holder.itemView.setOnClickListener {
            val prev = selectedPos
            selectedPos = holder.adapterPosition
            notifyItemChanged(prev)
            notifyItemChanged(selectedPos)
            onSelect(categories[selectedPos])
        }
    }

    override fun getItemCount() = categories.size
}

class ChannelAdapter(
    private val channels: MutableList<Channel>,
    private val onSelect: (Channel) -> Unit
) : RecyclerView.Adapter<ChannelAdapter.VH>() {

    inner class VH(view: View) : RecyclerView.ViewHolder(view) {
        val text: TextView = view.findViewById(android.R.id.text1)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val v = LayoutInflater.from(parent.context)
            .inflate(android.R.layout.simple_list_item_1, parent, false)
        return VH(v)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        holder.text.text = channels[position].name
        holder.text.setTextColor(0xFFCCCCCC.toInt())
        holder.itemView.setOnClickListener { onSelect(channels[holder.adapterPosition]) }
    }

    override fun getItemCount() = channels.size

    fun updateChannels(newChannels: List<Channel>) {
        channels.clear()
        channels.addAll(newChannels)
        notifyDataSetChanged()
    }
}

class MainActivity : AppCompatActivity() {

    private lateinit var categoryList: RecyclerView
    private lateinit var channelList: RecyclerView

    private val allChannels = mutableListOf<Channel>()
    private val categories = mutableListOf<String>()
    private val filteredChannels = mutableListOf<Channel>()

    private lateinit var categoryAdapter: CategoryAdapter
    private lateinit var channelAdapter: ChannelAdapter

    private val messageReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            when (intent.action) {
                "com.iptvsaas.player.MESSAGE" -> {
                    val msg = intent.getStringExtra("message") ?: return
                    AlertDialog.Builder(this@MainActivity)
                        .setTitle(BuildConfig.APP_NAME)
                        .setMessage(msg)
                        .setPositiveButton("OK", null)
                        .show()
                }
                "com.iptvsaas.player.TERMINATE" -> {
                    finishAffinity()
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        categoryList = findViewById(R.id.category_list)
        channelList = findViewById(R.id.channel_list)

        categoryAdapter = CategoryAdapter(categories) { selectedCategory ->
            val filtered = if (selectedCategory == "All") allChannels
            else allChannels.filter { it.category == selectedCategory }
            channelAdapter.updateChannels(filtered)
        }

        channelAdapter = ChannelAdapter(filteredChannels) { channel ->
            val intent = Intent(this, PlayerActivity::class.java).apply {
                putExtra("stream_url", channel.streamUrl)
                putExtra("title", channel.name)
            }
            startActivity(intent)
        }

        categoryList.layoutManager = LinearLayoutManager(this)
        categoryList.adapter = categoryAdapter

        channelList.layoutManager = LinearLayoutManager(this)
        channelList.adapter = channelAdapter

        // Register broadcast receiver
        val filter = IntentFilter().apply {
            addAction("com.iptvsaas.player.MESSAGE")
            addAction("com.iptvsaas.player.TERMINATE")
        }
        registerReceiver(messageReceiver, filter)

        // Start heartbeat service
        startService(Intent(this, HeartbeatService::class.java))

        // Register device if no token
        CoroutineScope(Dispatchers.Main).launch {
            if (ApiService.getDeviceToken(this@MainActivity) == null) {
                try {
                    ApiService.register(this@MainActivity)
                } catch (e: Exception) {
                    // Ignore registration errors
                }
            }
            loadChannels()
        }
    }

    private suspend fun loadChannels() {
        try {
            val data = withContext(Dispatchers.IO) { ApiService.getLiveChannels() }
            parseChannels(data)
        } catch (e: Exception) {
            Toast.makeText(this, "Failed to load channels", Toast.LENGTH_SHORT).show()
        }
    }

    private fun parseChannels(data: JSONObject) {
        allChannels.clear()
        categories.clear()

        val channelsArray = data.optJSONArray("channels") ?: return

        val categorySet = linkedSetOf("All")

        for (i in 0 until channelsArray.length()) {
            val item = channelsArray.optJSONObject(i) ?: continue
            val channel = Channel(
                id = item.optString("stream_id"),
                name = item.optString("name"),
                streamUrl = item.optString("stream_url"),
                category = item.optString("category_name", "General")
            )
            allChannels.add(channel)
            categorySet.add(channel.category)
        }

        categories.addAll(categorySet)
        categoryAdapter.notifyDataSetChanged()

        filteredChannels.clear()
        filteredChannels.addAll(allChannels)
        channelAdapter.notifyDataSetChanged()
    }

    override fun onDestroy() {
        super.onDestroy()
        unregisterReceiver(messageReceiver)
    }
}
