# Final Deployment Guide - Elegoo Centauri Carbon ioBroker Adapter

## ✅ **Project Status: READY FOR DEPLOYMENT**

All bugs have been fixed and the adapter is production-ready with comprehensive 3D printer monitoring and control capabilities.

## 📋 **Pre-Deployment Checklist**

### **Required Files:**

- ✅ `main.js` - Core adapter logic with SDCP implementation
- ✅ `package.json` - NPM package configuration
- ✅ `io-package.json` - ioBroker adapter metadata
- ✅ `admin/index_m.html` - Admin configuration interface
- ✅ `README.md` - Comprehensive documentation
- ✅ `INSTALL.md` - Installation instructions
- ✅ `.eslintrc.js` - Code style configuration
- ✅ `.gitignore` - Git ignore rules
- ✅ Test files and additional documentation

### **Bug Fixes Verified:**

- ✅ Removed irrelevant fields (release_film_status, uv_led_temp)
- ✅ Time display in human-readable format (hh:mm:ss)
- ✅ Fixed autodiscovery phantom printer issue
- ✅ Admin interface data persistence working
- ✅ Toggle light now properly turns on/off
- ✅ Simplified camera control (single toggle button)
- ✅ Fan controls made writable
- ✅ Time intervals displayed in seconds
- ✅ Fixed text contrast issues
- ✅ Disabled multi-printer support

## 🚀 **Deployment Steps**

### **1. Repository Setup**

```bash
# Clone your repository
git clone https://github.com/tholterhus/iobroker.elegoo-centauri-carbon.git
cd iobroker.elegoo-centauri-carbon

# Verify all files are present
ls -la
# Should show: main.js, package.json, io-package.json, admin/, README.md, etc.
```

### **2. Install Dependencies**

```bash
# Install production dependencies
npm install --production

# For development
npm install
```

### **3. Local Testing**

```bash
# Run ESLint checks
npm run lint

# Run tests
npm test

# Test package structure
npm run test:package
```

### **4. ioBroker Installation**

```bash
# Option A: Install from local directory
cd /opt/iobroker
npm install /path/to/iobroker.elegoo-centauri-carbon

# Option B: Install from GitHub
npm install https://github.com/tholterhus/iobroker.elegoo-centauri-carbon.git
```

### **5. Adapter Configuration**

1. **Create Instance**: ioBroker Admin → Instances → Add Instance
1. **Configure Settings**:
- **Printer IP**: `192.168.178.34` (your printer’s IP)
- **WebSocket Port**: `3030` (default)
- **Camera Port**: `8080` (default)
- **Poll Interval**: `10` seconds
- **Reconnect Interval**: `30` seconds
- **Enable Alerts**: ✓ (recommended)
- **Enable Camera**: ✓ (if available)

### **6. First Connection Test**

1. **Test Connection** button in admin interface
1. Check adapter logs: `iobroker logs elegoo-centauri-carbon.0`
1. Verify states are created in Objects tab
1. Confirm connection status: `info.connection = true`

## 📊 **Monitoring Data Points**

### **Essential Monitoring:**

```
elegoo-centauri-carbon.0.info.connection          → true/false
elegoo-centauri-carbon.0.print.status_text        → "Printing (Active)"
elegoo-centauri-carbon.0.print.progress           → 45%
elegoo-centauri-carbon.0.temperature.hotbed       → 67.5°C
elegoo-centauri-carbon.0.temperature.nozzle       → 115.3°C
elegoo-centauri-carbon.0.stats.remaining_print_time → "02:30:45"
```

### **Alert System:**

```
elegoo-centauri-carbon.0.alerts.print_complete    → Alert when print done
elegoo-centauri-carbon.0.alerts.print_paused      → Alert when paused
elegoo-centauri-carbon.0.alerts.bed_cooled        → Alert when bed ≤40°C
elegoo-centauri-carbon.0.alerts.connection_lost   → Connection issues
```

### **Camera Integration:**

```
elegoo-centauri-carbon.0.camera.stream_url        → http://192.168.178.34:8080/video_feed
elegoo-centauri-carbon.0.camera.stream_enabled    → true/false
elegoo-centauri-carbon.0.control.toggle_camera    → Enable/disable stream
```

## 🎛️ **Control Commands**

### **Print Control:**

```javascript
// Start print (set filename first)
setState('elegoo-centauri-carbon.0.control.print_file', 'model.gcode');
setState('elegoo-centauri-carbon.0.control.start_print', true);

// Print management
setState('elegoo-centauri-carbon.0.control.pause_print', true);
setState('elegoo-centauri-carbon.0.control.resume_print', true);
setState('elegoo-centauri-carbon.0.control.cancel_print', true);
```

### **Hardware Control:**

```javascript
// Toggle printer lighting
setState('elegoo-centauri-carbon.0.control.toggle_light', true);

// Toggle camera stream
setState('elegoo-centauri-carbon.0.control.toggle_camera', true);

// Fan speed control (0-100%)
setState('elegoo-centauri-carbon.0.fans.model_fan', 75);
setState('elegoo-centauri-carbon.0.fans.auxiliary_fan', 50);
setState('elegoo-centauri-carbon.0.fans.box_fan', 80);
```

## 🔔 **Alert Automation Examples**

### **Print Completion Notification:**

```javascript
on({id: 'elegoo-centauri-carbon.0.alerts.print_complete'}, (obj) => {
    if (obj.state.val) {
        // Send Telegram notification
        sendTo('telegram', 'send', {
            text: '🎉 3D Print completed successfully!',
            chat_id: 'your_chat_id'
        });
        
        // Play completion sound
        sendTo('sayit', 'tts', {text: 'Print job completed'});
    }
});
```

### **Print Monitoring:**

```javascript
on({id: 'elegoo-centauri-carbon.0.alerts.print_paused'}, (obj) => {
    if (obj.state.val) {
        sendTo('pushover', 'send', {
            message: '⏸️ Print job paused - check printer',
            priority: 1
        });
    }
});

on({id: 'elegoo-centauri-carbon.0.alerts.bed_cooled'}, (obj) => {
    if (obj.state.val) {
        sendTo('telegram', 'send', {
            text: '❄️ Print bed cooled down - safe to remove print'
        });
    }
});
```

## 📱 **VIS Integration Example**

### **Basic Status Widget:**

```html
<div class="printer-status">
    <h3>3D Printer Status</h3>
    <div class="status-info">
        <div class="connection {elegoo-centauri-carbon.0.info.connection;true==connected;false==disconnected}">
            Status: {elegoo-centauri-carbon.0.print.status_text}
        </div>
        <div class="progress">
            Progress: {elegoo-centauri-carbon.0.print.progress}%
        </div>
        <div class="temperature">
            Hotbed: {elegoo-centauri-carbon.0.temperature.hotbed}°C
        </div>
        <div class="time">
            Remaining: {elegoo-centauri-carbon.0.stats.remaining_print_time}
        </div>
    </div>
    
    <div class="camera" style="display: {elegoo-centauri-carbon.0.camera.stream_enabled;true=='block';false=='none'};">
        <img src="{elegoo-centauri-carbon.0.camera.stream_url}" style="width: 100%; max-width: 400px;">
    </div>
    
    <div class="controls">
        <button onclick="vis.setValue('elegoo-centauri-carbon.0.control.pause_print', true)">
            Pause
        </button>
        <button onclick="vis.setValue('elegoo-centauri-carbon.0.control.toggle_camera', true)">
            Toggle Camera
        </button>
    </div>
</div>
```

## 🛠️ **Troubleshooting**

### **Connection Issues:**

```bash
# Check printer IP accessibility
ping 192.168.178.34

# Test WebSocket port
telnet 192.168.178.34 3030

# Check adapter logs
iobroker logs elegoo-centauri-carbon.0 --lines 50
```

### **Common Solutions:**

1. **“Cannot connect”**: Verify printer IP and WebSocket port 3030
1. **“No data updates”**: Check poll interval and printer network settings
1. **“Camera not working”**: Verify camera port 8080 and enable in adapter settings
1. **“Alerts not triggering”**: Ensure `enableAlerts = true` in configuration

### **Debug Mode:**

```bash
# Enable debug logging in adapter settings
# Then check logs for detailed SDCP message flow
iobroker logs elegoo-centauri-carbon.0 --watch
```

## 📈 **Performance Recommendations**

### **Optimal Settings:**

- **Poll Interval**: `10-15 seconds` (balance between responsiveness and network load)
- **Reconnect Interval**: `30 seconds` (sufficient for network recovery)
- **Alert Clear Timeout**: `300 seconds` (5 minutes, prevents spam)

### **Network Optimization:**

- Place ioBroker and printer on same network segment
- Use wired connection for printer if possible
- Monitor network bandwidth if using camera streaming

## 🎯 **Production Readiness Verification**

### **Final Checklist:**

- ✅ Adapter starts without errors
- ✅ WebSocket connection established
- ✅ All data points updating correctly
- ✅ Time displays in hh:mm:ss format
- ✅ Toggle controls working (light, camera)
- ✅ Alerts triggering appropriately
- ✅ Admin interface saves/loads settings
- ✅ Camera integration functional
- ✅ Fan controls available (if supported by printer)
- ✅ No phantom printer discoveries
- ✅ Text properly readable in admin interface

## 🚀 **Go Live!**

The adapter is now **production-ready** with:

- **Professional 3D printer monitoring** with 50+ data points
- **Intelligent alert system** for print completion, errors, and temperature events
- **Camera integration** with MJPEG streaming support
- **Comprehensive control** for print jobs, lighting, and hardware
- **User-friendly admin interface** with proper data persistence
- **Robust SDCP implementation** based on OpenCentauri documentation
- **Time formatting** in human-readable format
- **Single-printer focus** for reliability and simplicity

**Ready to monitor your Elegoo Centauri Carbon like a pro!** 🎉
