# Installation Guide - Elegoo Centauri Carbon ioBroker Adapter

## Prerequisites

### System Requirements

- ioBroker installation (v4.0.0 or higher)
- Node.js version 14.0.0 or higher
- Elegoo Centauri Carbon 3D printer with firmware 1.1.29 or compatible
- Network connection between ioBroker and the printer

### Network Setup

1. Ensure your Elegoo Centauri Carbon is connected to your local network
1. Note the printer’s IP address (check printer display or router admin panel)
1. Verify that your ioBroker server can reach the printer’s IP address

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
iobroker install https://github.com/tholterhus/ioBroker.elegoo-centauri-carbon.git

# Or using npm
npm install https://github.com/tholterhus/ioBroker.elegoo-centauri-carbon.git
```

#### Option B: Manual Installation

```bash
# Clone the repository
git clone https://github.com/tholterhus/ioBroker.elegoo-centauri-carbon.git

# Navigate to the directory
cd ioBroker.elegoo-centauri-carbon

# Install dependencies
npm install

# Build (if needed)
npm run build

# Link to ioBroker (Linux/macOS)
cd /opt/iobroker
npm install ./path/to/ioBroker.elegoo-centauri-carbon

# Or copy to node_modules (Windows)
# Copy the entire folder to /opt/iobroker/node_modules/iobroker.elegoo-centauri-carbon
```

### Method 3: Development Setup

For developers who want to contribute or modify the adapter:

```bash
# Clone the repository
git clone https://github.com/tholterhus/ioBroker.elegoo-centauri-carbon.git
cd ioBroker.elegoo-centauri-carbon

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
- Enter your printer’s IP address (e.g., `192.168.1.100`)
- Adjust poll interval if needed (default: 10000ms)
- Set reconnection interval (default: 30000ms)
- Enable debug logging if troubleshooting is needed
1. **Test Connection**
- Use the “Test Connection” button in the admin interface
- Check the logs for connection status
- Verify that the connection indicator shows “Connected”
1. **Save and Start**
- Click “Save” to apply configuration
- Start the adapter instance
- Monitor logs for any error messages

### Configuration Parameters

|Parameter             |Description                |Default        |Range/Options     |
|----------------------|---------------------------|---------------|------------------|
|**host**              |Printer IP address         |`192.168.1.100`|Valid IPv4 address|
|**pollInterval**      |Status update interval (ms)|`10000`        |1000-300000       |
|**reconnectInterval** |Reconnection delay (ms)    |`30000`        |5000-300000       |
|**enableDebugLogging**|Enable detailed logging    |`false`        |true/false        |

### Network Configuration

#### Firewall Settings

Ensure the following ports are accessible:

- **Port 80** (HTTP) - For WebSocket connection to printer
- **Port 443** (HTTPS) - If printer uses HTTPS (rare)

#### Router Configuration

- No special router configuration needed for local network access
- Ensure both ioBroker and printer are on the same network segment
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
   wscat -c ws://[PRINTER_IP]/websocket
   # You should connect without authentication
   ```
1. **Status Updates**
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
- Search existing issues: https://github.com/tholterhus/ioBroker.elegoo-centauri-carbon/issues
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

- GitHub Issues: https://github.com/tholterhus/ioBroker.elegoo-centauri-carbon/issues
- ioBroker Forum: https://forum.iobroker.net
- Documentation: https://github.com/tholterhus/ioBroker.elegoo-centauri-carbon/wiki
