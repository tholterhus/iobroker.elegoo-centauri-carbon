# Installation Guide - Elegoo Centauri Carbon ioBroker Adapter

## Prerequisites

### System Requirements

- ioBroker installation (v4.0.0 or higher)
- Node.js version 14.0.0 or higher
- Elegoo Centauri Carbon 3D printer with firmware 1.1.29 or compatible
- Network connection between ioBroker and the printer

### Network Setup

1. Ensure your Elegoo Centauri Carbon is connected to your local network
1. Note the printer’s IP address (example: 192.168.178.34)
1. Verify that your ioBroker server can reach the printer’s IP address
1. Optional: Enable auto-discovery to find printers automatically

## Installation Methods

### Method 1: From ioBroker Admin Interface (Recommended when published)

1. Open your ioBroker Admin interface
1. Go to the “Adapters” tab
1. Search for “elegoo-centauri-carbon”
1. Click the “+” button to install
1. Wait for installation to complete

### Method 2: From GitHub (Development/Testing)

#### Option A: Using ioBroker CLI

```bash
# Navigate to ioBroker directory
cd /opt/iobroker

# Install from GitHub
iobroker install https://github.com/yourusername/ioBroker.elegoo-centauri-carbon.git

# Or using npm
npm install https://github.com/yourusername/ioBroker.elegoo-centauri-carbon.git
```

#### Option B: Manual Installation

```bash
# Clone the repository
git clone https://github.com/tholterhus/iobroker.elegoo-centauri-carbon.git

# Navigate to the directory
cd iobroker.elegoo-centauri-carbon

# Install dependencies
npm install

# Build (if needed)
npm run build

# Link to ioBroker (Linux/macOS)
cd /opt/iobroker
npm install ./path/to/iobroker.elegoo-centauri-carbon

# Or copy to node_modules (Windows)
# Copy the entire folder to /opt/iobroker/node_modules/iobroker.elegoo-centauri-carbon
```

### Method 3: Development Setup

For developers who want to contribute or modify the adapter:

```bash
# Clone the repository
git clone https://github.com/tholterhus/iobroker.elegoo-centauri-carbon.git
cd iobroker.elegoo-centauri-carbon

# Install dependencies
npm install

# Install development dependencies
npm install --only=dev

# Run tests
npm test

# Start in development mode
npm start
```

## Configuration

### Initial Setup

1. **Create Adapter Instance**
- Open ioBroker Admin interface
- Go to “Instances” tab
- Click the “+” button next to “elegoo-centauri-carbon”
- A new instance will be created
1. **Configure Connection**
- Click the wrench icon next to the new instance
- Enter your printer’s IP address (e.g., `192.168.178.34`)
- Set WebSocket port (default: 3030)
- Set camera port if using camera (default: 8080)
- Enable auto-discovery if desired
- Enable alerts for automated notifications
- Adjust poll interval if needed (default: 10000ms)
- Set reconnection interval (default: 30000ms)
- Enable debug logging if troubleshooting is needed
1. **Test Discovery and Connection**
- Use the “Scan Network Now” button to discover printers
- Use the “Test Connection” button in the admin interface
- Check the logs for connection status and discovered devices
- Verify that the connection indicator shows “Connected”
1. **Save and Start**
- Click “Save” to apply configuration
- Start the adapter instance
- Monitor logs for any error messages

### Configuration Parameters

### Configuration Parameters

|Parameter              |Description                  |Default         |Range/Options     |
|-----------------------|-----------------------------|----------------|------------------|
|**host**               |Printer IP address           |`192.168.178.34`|Valid IPv4 address|
|**port**               |WebSocket port               |`3030`          |1-65535           |
|**cameraPort**         |Camera stream port           |`8080`          |1-65535           |
|**pollInterval**       |Status update interval (ms)  |`10000`         |1000-300000       |
|**reconnectInterval**  |Reconnection delay (ms)      |`30000`         |5000-300000       |
|**enableCamera**       |Enable camera integration    |`true`          |true/false        |
|**enableAutoDiscovery**|Enable network auto-discovery|`true`          |true/false        |
|**enableAlerts**       |Enable alert system          |`true`          |true/false        |
|**alertClearTimeout**  |Alert auto-clear time (ms)   |`300000`        |60000-3600000     |
|**enableDebugLogging** |Enable detailed logging      |`false`         |true/false        |

### Network Configuration

#### Firewall Settings

Ensure the following ports are accessible:

- **Port 3030** (WebSocket) - For SDCP communication with printer
- **Port 8080** (HTTP) - For MJPEG camera stream (if using camera)
- **Port 443** (HTTPS) - If printer uses HTTPS (rare)

#### Router Configuration

- No special router configuration needed for local network access
- Ensure both ioBroker and printer are on the same network segment
- Example setup: ioBroker at 192.168.178.10, Printer at 192.168.178.34
- For remote access, configure port forwarding if needed (not recommended for security)

## Verification

### Check Installation

1. **Adapter Status**
   
   ```bash
   # Check if adapter is installed
   iobroker list adapters | grep elegoo-centauri-carbon
   
   # Check instance status
   iobroker status
   ```
1. **Log Verification**
   
   ```bash
   # View adapter logs
   iobroker logs elegoo-centauri-carbon.0
   
   # Or check log file directly
   tail -f /opt/iobroker/log/iobroker.log | grep elegoo-centauri-carbon
   ```
1. **Object Tree**
- Open ioBroker Admin → Objects
- Navigate to `elegoo-centauri-carbon.0`
- Verify all objects are created:
  - `info.connection`
  - `temperature.*`
  - `print.*`
  - `position.*`
  - `fans.*`
  - `lighting.*`
  - `control.*`

### Test Functionality

1. **Connection Test**
   
   ```bash
   # Test WebSocket connection manually (optional)
   # Install wscat: npm install -g wscat
   wscat -c ws://192.168.178.34:3030/websocket
   # You should connect without authentication
   ```
1. **Camera Stream Test**
   
   ```bash
   # Test camera stream (if enabled)
   curl -I http://192.168.178.34:8080/video_feed
   # Should return HTTP 200 with content-type: multipart/x-mixed-replace
   ```
- Check that `info.connection` shows `true`
- Verify temperature values are updating
- Confirm print status is being reported correctly
1. **Control Commands**
- Set `control.request_status` to `true`
- Check logs for command transmission
- Verify printer responds with status update

## Troubleshooting Installation

### Common Issues

#### 1. Installation Fails

```bash
# Clear npm cache
npm cache clean --force

# Reinstall with verbose output
npm install --verbose

# Check Node.js version
node --version  # Should be >= 14.0.0
```

#### 2. Permission Issues (Linux)

```bash
# Fix ownership
sudo chown -R iobroker:iobroker /opt/iobroker/node_modules/iobroker.elegoo-centauri-carbon

# Fix permissions
chmod -R 755 /opt/iobroker/node_modules/iobroker.elegoo-centauri-carbon
```

#### 3. Dependencies Not Found

```bash
# Install missing dependencies
cd /opt/iobroker/node_modules/iobroker.elegoo-centauri-carbon
npm install

# Or force reinstall all dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 4. Adapter Not Starting

- Check ioBroker logs: `iobroker logs`
- Verify configuration is valid
- Ensure printer IP is accessible
- Check for port conflicts

#### 5. Connection Issues

- Ping the printer: `ping [PRINTER_IP]`
- Check printer network settings
- Verify printer firmware version
- Test WebSocket manually with `wscat`

### Getting Help

1. **Check Logs First**
- Enable debug logging in adapter configuration
- Review logs for specific error messages
- Note any recurring patterns
1. **GitHub Issues**
- Search existing issues: https://github.com/yourusername/ioBroker.elegoo-centauri-carbon/issues
- Create new issue with:
  - ioBroker version
  - Node.js version
  - Adapter version
  - Complete error logs
  - Printer firmware version
1. **ioBroker Community**
- ioBroker Forum: https://forum.iobroker.net
- Discord: https://discord.gg/iobroker

## Uninstallation

### Remove Adapter Instance

```bash
# Stop and delete instance
iobroker stop elegoo-centauri-carbon.0
iobroker del elegoo-centauri-carbon.0
```

### Uninstall Adapter

```bash
# Remove adapter
iobroker uninstall elegoo-centauri-carbon

# Or using npm
npm uninstall iobroker.elegoo-centauri-carbon
```

### Clean Removal

```bash
# Remove all traces (Linux/macOS)
rm -rf /opt/iobroker/node_modules/iobroker.elegoo-centauri-carbon
rm -rf /opt/iobroker/iobroker-data/files/elegoo-centauri-carbon.admin
```

## Next Steps

After successful installation:

1. Review the <README.md> for usage instructions
1. Explore available data points in the Objects tab
1. Set up visualizations using ioBroker VIS or other tools
1. Configure notifications for print completion/errors
1. Create automation rules based on printer status

## Support

For installation support:

- GitHub Issues: https://github.com/yourusername/ioBroker.elegoo-centauri-carbon/issues
- ioBroker Forum: https://forum.iobroker.net
- Documentation: https://github.com/yourusername/ioBroker.elegoo-centauri-carbon/wiki