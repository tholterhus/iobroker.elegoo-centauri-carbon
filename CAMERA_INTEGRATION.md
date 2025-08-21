# Camera Integration Guide

This guide explains how to integrate the Elegoo Centauri Carbon camera stream into various ioBroker visualization systems.

## Overview

The Elegoo Centauri Carbon adapter provides comprehensive camera integration through:

- **Stream Control**: Enable/disable camera streaming via SDCP commands
- **URL Management**: Automatic detection and provision of MJPEG stream URLs
- **Status Monitoring**: Real-time camera status and timelapse information

## Camera Data Points

### Status Information

```
elegoo-centauri-carbon.0.camera.stream_url      - MJPEG stream URL
elegoo-centauri-carbon.0.camera.stream_enabled  - Stream status (boolean)
elegoo-centauri-carbon.0.camera.timelapse_status - Timelapse recording status
```

### Control Commands

```
elegoo-centauri-carbon.0.control.enable_camera  - Enable camera stream
elegoo-centauri-carbon.0.control.disable_camera - Disable camera stream
```

## Basic Usage

### 1. Enable Camera Stream

```javascript
// Enable camera programmatically
setState('elegoo-centauri-carbon.0.control.enable_camera', true);

// The adapter will:
// 1. Send SDCP command 386 with Enable: 1
// 2. Receive stream URL from printer
// 3. Update camera.stream_url with the URL
// 4. Set camera.stream_enabled to true
```

### 2. Get Stream URL

```javascript
// Read the stream URL
const streamUrl = getState('elegoo-centauri-carbon.0.camera.stream_url').val;
console.log('Camera stream available at:', streamUrl);

// Typical URLs:
// http://192.168.1.100:8080/video_feed
// http://192.168.1.100:8080/stream.mjpg
```

## VIS Integration

### Method 1: Basic Image Widget

```html
<!-- In VIS, create an HTML widget with this content -->
<img id="printer-camera" 
     src="{elegoo-centauri-carbon.0.camera.stream_url}" 
     style="width: 100%; height: auto; max-width: 640px;"
     onerror="this.style.display='none'"
     onload="this.style.display='block'">

<div id="camera-offline" 
     style="display: {elegoo-centauri-carbon.0.camera.stream_enabled;true=='none';false=='block'};">
     Camera offline
</div>
```

### Method 2: Advanced Camera Widget

```html
<div class="camera-container">
    <div class="camera-header">
        <h3>Printer Camera</h3>
        <div class="camera-controls">
            <button onclick="toggleCamera()" id="camera-toggle">
                {elegoo-centauri-carbon.0.camera.stream_enabled;true=='Disable';false=='Enable'} Camera
            </button>
        </div>
    </div>
    
    <div class="camera-view" 
         style="display: {elegoo-centauri-carbon.0.camera.stream_enabled;true=='block';false=='none'};">
        <img src="{elegoo-centauri-carbon.0.camera.stream_url}" 
             style="width: 100%; height: auto; border-radius: 8px;"
             onerror="showCameraError()" 
             onload="hideCameraError()">
        
        <div class="camera-overlay">
            <div class="print-info">
                Print Progress: {elegoo-centauri-carbon.0.print.progress}%<br>
                Layer: {elegoo-centauri-carbon.0.print.current_layer}/{elegoo-centauri-carbon.0.print.total_layers}
            </div>
        </div>
    </div>
    
    <div class="camera-offline" 
         style="display: {elegoo-centauri-carbon.0.camera.stream_enabled;true=='none';false=='flex'};">
        <i class="material-icons">videocam_off</i>
        <p>Camera is disabled</p>
    </div>
</div>

<script>
function toggleCamera() {
    const enabled = vis.states['elegoo-centauri-carbon.0.camera.stream_enabled'];
    if (enabled) {
        vis.setValue('elegoo-centauri-carbon.0.control.disable_camera', true);
    } else {
        vis.setValue('elegoo-centauri-carbon.0.control.enable_camera', true);
    }
}

function showCameraError() {
    document.querySelector('.camera-view img').style.display = 'none';
    // Show error message
}

function hideCameraError() {
    document.querySelector('.camera-view img').style.display = 'block';
}
</script>

<style>
.camera-container {
    background: #f5f5f5;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.camera-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.camera-view {
    position: relative;
}

.camera-overlay {
    position: absolute;
    bottom: 8px;
    left: 8px;
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 8px;
    border-radius: 4px;
    font-size: 12px;
}

.camera-offline {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px;
    color: #666;
}

button {
    background: #2196F3;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
}
</style>
```

## Grafana Integration

### Datasource Configuration

```yaml
# In Grafana, use the ioBroker datasource
- Target: elegoo-centauri-carbon.0.camera.stream_enabled
  Alias: Camera Status
  
- Target: elegoo-centauri-carbon.0.camera.timelapse_status  
  Alias: Timelapse Status
```

### Image Panel Setup

```json
{
  "type": "text",
  "title": "Printer Camera",
  "targets": [
    {
      "target": "elegoo-centauri-carbon.0.camera.stream_url",
      "refId": "A"
    }
  ],
  "options": {
    "content": "<img src=\"${__field.value}\" style=\"width:100%; height:auto;\" />"
  }
}
```

## Node-RED Integration

### Camera Control Flow

```json
[
    {
        "id": "camera-enable",
        "type": "inject",
        "name": "Enable Camera",
        "props": [
            {
                "p": "payload",
                "v": "true",
                "vt": "bool"
            }
        ],
        "wires": [["camera-control"]]
    },
    {
        "id": "camera-control", 
        "type": "ioBroker out",
        "name": "Camera Control",
        "topic": "elegoo-centauri-carbon.0.control.enable_camera",
        "wires": []
    },
    {
        "id": "camera-status",
        "type": "ioBroker in",
        "name": "Camera Status",
        "topic": "elegoo-centauri-carbon.0.camera.stream_enabled",
        "wires": [["camera-notification"]]
    },
    {
        "id": "camera-notification",
        "type": "function",
        "name": "Camera Notification",
        "func": "if (msg.payload) {\n    msg.payload = 'Camera stream enabled';\n} else {\n    msg.payload = 'Camera stream disabled';\n}\nreturn msg;",
        "wires": [["telegram-out"]]
    }
]
```

## Troubleshooting

### Common Issues

#### 1. Camera Stream Not Working

```bash
# Check if camera is physically connected
# Verify camera port in adapter settings (default: 8080)

# Test direct access to camera
curl -I http://192.168.1.100:8080/video_feed
```

#### 2. Stream URL Empty

```javascript
// Check adapter logs for SDCP command responses
// Command 386 should return StreamUrl in response

// Manually enable camera
setState('elegoo-centauri-carbon.0.control.enable_camera', true);

// Wait for response and check URL
setTimeout(() => {
    const url = getState('elegoo-centauri-carbon.0.camera.stream_url').val;
    console.log('Stream URL:', url);
}, 2000);
```

#### 3. VIS Widget Not Showing Stream

```javascript
// Verify data binding syntax
// Use: {elegoo-centauri-carbon.0.camera.stream_url}
// Not: #{elegoo-centauri-carbon.0.camera.stream_url}

// Check browser developer console for CORS errors
// Some browsers may block MJPEG streams
```

### Network Configuration

#### CORS Headers (if needed)

```nginx
# If using nginx proxy for camera stream
location /camera {
    proxy_pass http://printer-ip:8080;
    
    # Add CORS headers
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
    add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
}
```

#### Firewall Rules

```bash
# Allow camera port on printer
sudo ufw allow from 192.168.1.0/24 to any port 8080

# Or specific IP
sudo ufw allow from [IOBROKER_IP] to any port 8080
```

## Advanced Features

### Automatic Stream Recording

```javascript
// Start recording when print begins
on({id: 'elegoo-centauri-carbon.0.print.status', change: 'ne'}, (obj) => {
    const status = obj.state.val;
    const statusText = getState('elegoo-centauri-carbon.0.print.status_text').val;
    
    if (statusText === 'Printing (Active)') {
        // Enable camera for print monitoring
        setState('elegoo-centauri-carbon.0.control.enable_camera', true);
        
        // Start timelapse if supported
        // This would need additional SDCP commands
    } else if (statusText === 'Print Complete' || statusText === 'Idle') {
        // Disable camera to save bandwidth
        setState('elegoo-centauri-carbon.0.control.disable_camera', true);
    }
});
```

### Stream Quality Monitoring

```javascript
// Monitor camera stream health
setInterval(() => {
    const streamEnabled = getState('elegoo-centauri-carbon.0.camera.stream_enabled').val;
    const streamUrl = getState('elegoo-centauri-carbon.0.camera.stream_url').val;
    
    if (streamEnabled && streamUrl) {
        // Test stream accessibility
        const img = new Image();
        img.onload = () => {
            log('Camera stream healthy');
            setState('elegoo-centauri-carbon.0.camera.health', true);
        };
        img.onerror = () => {
            log('Camera stream unhealthy', 'warn');
            setState('elegoo-centauri-carbon.0.camera.health', false);
        };
        img.src = streamUrl + '?t=' + Date.now(); // Cache busting
    }
}, 60000); // Check every minute
```

## Security Considerations

### Network Security

- **Local Network Only**: Keep camera streams on local network
- **VPN Access**: Use VPN for remote access instead of port forwarding
- **Authentication**: Consider adding authentication proxy if exposing externally

### Privacy

- **Auto-disable**: Automatically disable camera when not printing
- **Access Logging**: Log who accesses camera streams
- **Secure Storage**: Don’t store camera URLs in persistent storage

## Performance Optimization

### Bandwidth Management

```javascript
// Adaptive camera control based on network conditions
const adaptiveCamera = {
    enable: () => {
        const printStatus = getState('elegoo-centauri-carbon.0.print.status_text').val;
        const networkLoad = getState('system.adapter.elegoo-centauri-carbon.0.memHeapUsed').val;
        
        if (printStatus === 'Printing (Active)' && networkLoad < 100) {
            setState('elegoo-centauri-carbon.0.control.enable_camera', true);
        }
    },
    
    disable: () => {
        setState('elegoo-centauri-carbon.0.control.disable_camera', true);
    }
};
```

### Stream Caching

```javascript
// Cache stream URL to reduce repeated requests
let cachedStreamUrl = null;
let cacheExpiry = 0;

function getCachedStreamUrl() {
    const now = Date.now();
    
    if (cachedStreamUrl && now < cacheExpiry) {
        return cachedStreamUrl;
    }
    
    cachedStreamUrl = getState('elegoo-centauri-carbon.0.camera.stream_url').val;
    cacheExpiry = now + (5 * 60 * 1000); // Cache for 5 minutes
    
    return cachedStreamUrl;
}
```

This comprehensive camera integration allows you to monitor your 3D printer visually while leveraging all the status information provided by the adapter for a complete printing monitoring solution.