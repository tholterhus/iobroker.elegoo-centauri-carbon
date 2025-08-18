# ioBroker.elegoo-centauri-carbon

![Logo](admin/elegoo-centauri-carbon.png)

[![NPM version](https://img.shields.io/npm/v/iobroker.elegoo-centauri-carbon.svg)](https://www.npmjs.com/package/iobroker.elegoo-centauri-carbon)
[![Downloads](https://img.shields.io/npm/dm/iobroker.elegoo-centauri-carbon.svg)](https://www.npmjs.com/package/iobroker.elegoo-centauri-carbon)
[![Dependency Status](https://img.shields.io/david/yourusername/iobroker.elegoo-centauri-carbon.svg)](https://david-dm.org/yourusername/iobroker.elegoo-centauri-carbon)
[![Known Vulnerabilities](https://snyk.io/test/github/yourusername/ioBroker.elegoo-centauri-carbon/badge.svg)](https://snyk.io/test/github/yourusername/ioBroker.elegoo-centauri-carbon)

[![NPM](https://nodei.co/npm/iobroker.elegoo-centauri-carbon.png?downloads=true)](https://nodei.co/npm/iobroker.elegoo-centauri-carbon/)

## Elegoo Centauri Carbon 3D Printer Adapter for ioBroker

This adapter enables monitoring and control of the Elegoo Centauri Carbon 3D printer through ioBroker using the SDCP (Simple Device Communication Protocol) over WebSocket.

## Features

### Monitoring

- **Real-time Status**: Current print status, progress, layer information with 17+ status codes
- **Temperature Monitoring**: Hotbed, nozzle, and enclosure temperatures with targets
- **Position Tracking**: X, Y, Z coordinates and Z-offset
- **Fan Speed Monitoring**: Model fan, auxiliary fan, and box fan speeds
- **Lighting Status**: RGB lighting and secondary light status
- **Camera Integration**: MJPEG video stream monitoring and control
- **Advanced Statistics**: Total print time, remaining time, UV LED temperature, error reporting
- **Network Discovery**: Automatic discovery of SDCP-compatible printers on local network
- **Smart Alerts**: Automated notifications for print completion, errors, pauses, and temperature events
- **Connection Status**: Real-time connection monitoring with automatic reconnection

### Control

- **Print Control**: Start, pause, resume, and cancel print jobs
- **Status Requests**: Manual status updates
- **Light Control**: Toggle printer lighting
- **Camera Control**: Enable/disable camera streaming
- **Network Discovery**: Manual and automatic printer discovery
- **Alert Management**: Clear individual or all alerts
- **File Selection**: Specify files for printing

### Intelligent Monitoring

- **Status Change Detection**: Automatic alerts when print status changes
- **Temperature Alerts**: Notifications when bed cools down to 40°C or temperature anomalies
- **Error Detection**: Immediate alerts for print failures, pauses, or connection issues
- **Multi-printer Support**: Foundation for monitoring multiple printers (extensible)
- **SDCP Validation**: Automatic compatibility checking with connected devices

### Control

- **Print Control**: Start, pause, resume, and cancel print jobs
- **Status Requests**: Manual status updates
- **Light Control**: Toggle printer lighting
- **File Selection**: Specify files for printing

### Data Points

#### Connection

- `info.connection` - Connection status to printer

#### Temperature

- `temperature.hotbed` - Current hotbed temperature (°C)
- `temperature.nozzle` - Current nozzle temperature (°C)
- `temperature.box` - Current enclosure temperature (°C)
- `temperature.hotbed_target` - Target hotbed temperature (°C)
- `temperature.nozzle_target` - Target nozzle temperature (°C)
- `temperature.box_target` - Target enclosure temperature (°C)

#### Print Information

- `print.status` - Numeric print status code
- `print.status_text` - Human-readable status text
- `print.progress` - Print progress percentage
- `print.current_layer` - Current printing layer
- `print.total_layers` - Total number of layers
- `print.filename` - Currently printing file
- `print.print_speed` - Print speed percentage
- `print.current_ticks` - Current time ticks
- `print.total_ticks` - Total estimated time ticks

#### Position

- `position.x` - X-axis position (mm)
- `position.y` - Y-axis position (mm)
- `position.z` - Z-axis position (mm)
- `position.z_offset` - Z-offset value (mm)

#### Fan Speeds

- `fans.model_fan` - Model cooling fan speed (%)
- `fans.auxiliary_fan` - Auxiliary fan speed (%)
- `fans.box_fan` - Enclosure fan speed (%)

#### Lighting

- `lighting.second_light` - Secondary light status (on/off)
- `lighting.rgb_r` - RGB red component (0-255)
- `lighting.rgb_g` - RGB green component (0-255)
- `lighting.rgb_b` - RGB blue component (0-255)

#### Camera

- `camera.stream_url` - MJPEG camera stream URL
- `camera.stream_enabled` - Camera stream status (on/off)
- `camera.timelapse_status` - Timelapse recording status

#### Statistics

- `stats.total_print_time` - Total printer usage time (hours)
- `stats.remaining_print_time` - Estimated remaining print time (hours)
- `stats.remaining_layers` - Number of layers remaining
- `stats.print_error` - Current print error (if any)
- `stats.release_film_status` - Release film condition
- `stats.uv_led_temp` - UV LED temperature (°C)

#### Network Discovery

- `discovery.auto_discovered` - JSON list of discovered printers on network
- `discovery.last_scan` - Timestamp of last network discovery scan

#### Alerts and Notifications

- `alerts.print_complete` - Print completion alert (boolean)
- `alerts.print_paused` - Print paused alert (boolean)
- `alerts.print_error` - Print error/failure alert (boolean)
- `alerts.bed_cooled` - Bed cooled down alert (≤40°C)
- `alerts.connection_lost` - Connection lost alert (boolean)
- `alerts.last_alert` - Most recent alert message with timestamp
- `alerts.alert_count` - Total number of alerts triggered

#### Control Commands

- `control.start_print` - Start print job (requires file in `control.print_file`)
- `control.pause_print` - Pause current print
- `control.resume_print` - Resume paused print
- `control.cancel_print` - Cancel current print
- `control.toggle_light` - Toggle printer lighting
- `control.enable_camera` - Enable camera streaming
- `control.disable_camera` - Disable camera streaming
- `control.discover_printers` - Trigger network discovery scan
- `control.clear_alerts` - Clear all active alerts
- `control.request_status` - Request immediate status update
- `control.print_file` - File path for printing (e.g., “model.gcode” or “/local/model.gcode”)

## Installation

### From npm (when published)

```bash
npm install iobroker.elegoo-centauri-carbon
```

### From GitHub

```bash
cd /opt/iobroker
npm install https://github.com/tholterhus/iobroker.elegoo-centauri-carbon.git
```

## Configuration

### Basic Setup

1. Install the adapter
1. Create a new instance
1. Configure the printer’s IP address in the adapter settings (default example: 192.168.178.34)
1. Enable auto-discovery to scan for printers on your network (optional)
1. Enable alerts for automated notifications
1. Adjust poll interval if needed (default: 10 seconds)
1. Save and start the adapter

### Network Discovery

The adapter can automatically discover Elegoo Centauri Carbon printers on your local network:

1. Enable “Network Auto-Discovery” in adapter settings
1. Use the “Discover Network Printers” button for manual scans
1. Found printers will be listed in `discovery.auto_discovered`
1. Select discovered printers directly from the admin interface

### Alert System

Inspired by the centauri-carbon-monitor project, the adapter provides intelligent alerts:

- **Print Complete**: Notifies when print jobs finish successfully
- **Print Paused**: Alerts when prints are paused (manual or error)
- **Print Error**: Immediate notification of print failures
- **Bed Cooled**: Alert when print bed cools to 40°C after printing
- **Connection Lost**: Notification when connection to printer is lost
- **Auto-Clear**: Alerts automatically clear after 5 minutes (configurable)

### Network Requirements

- The Elegoo Centauri Carbon must be connected to your local network
- **WebSocket**: The printer’s WebSocket server runs on **port 3030** at `/websocket`
- **Camera Stream**: MJPEG camera stream typically available on port 8080
- No authentication is required for the WebSocket connection
- Ensure your ioBroker instance can reach the printer’s IP address

### Printer Setup

- Ensure your Elegoo Centauri Carbon is updated to firmware version 1.1.29 or compatible
- The printer must be connected to the same network as your ioBroker instance
- Enable network features on the printer if not already active
- Camera must be connected and functional for video streaming features

## Usage

### Basic Monitoring

Once configured, the adapter will automatically:

- Connect to the printer via WebSocket
- Request status updates at the configured interval
- Update all data points with current printer information
- Automatically reconnect if the connection is lost

### Print Control

To start a print job:

1. Set the filename in `control.print_file` (e.g., “my_model.gcode”)
1. Trigger `control.start_print` by setting it to `true`

To control an active print:

- Use `control.pause_print` to pause
- Use `control.resume_print` to resume
- Use `control.cancel_print` to cancel

### Camera Integration

To use the camera features:

1. Enable camera integration in adapter settings
1. Ensure camera is connected to your printer
1. Use `control.enable_camera` to start the video stream
1. The `camera.stream_url` will contain the MJPEG stream URL
1. Access the stream directly via HTTP or integrate with VIS/other visualization tools

**Common Camera URLs:**

- `http://192.168.178.34:8080/video_feed` - Primary MJPEG stream
- `http://192.168.178.34:8080/stream.mjpg` - Alternative stream endpoint
- `http://192.168.178.34/video_feed` - Fallback URL

### Network Discovery

The adapter includes automatic printer discovery inspired by the OpenCentauri project:

1. **Auto-Discovery**: Automatically scans network on startup
1. **Manual Discovery**: Trigger scans via `control.discover_printers`
1. **SDCP Validation**: Verifies printer compatibility during discovery
1. **Multi-Printer Support**: Foundation for monitoring multiple printers

**Discovery Process:**

- Scans common network ranges (192.168.x.x, 10.x.x.x, etc.)
- Tests WebSocket connections on port 3030
- Validates SDCP protocol compatibility
- Saves discovered printers in `discovery.auto_discovered`

### Smart Alert System

Based on the centauri-carbon-monitor functionality:

```javascript
// Print completion alert
on({id: 'elegoo-centauri-carbon.0.alerts.print_complete', change: 'ne'}, (obj) => {
    if (obj.state.val) {
        // Send notification, play sound, etc.
        sendTo('telegram', 'send', {text: 'Print job completed!'});
    }
});

// Bed cooled down alert  
on({id: 'elegoo-centauri-carbon.0.alerts.bed_cooled', change: 'ne'}, (obj) => {
    if (obj.state.val) {
        sendTo('pushover', 'send', {message: 'Print bed has cooled down'});
    }
});
```

### Advanced Features

The adapter supports extended status monitoring including:

- **Print Statistics**: Total runtime, remaining time calculations
- **Error Reporting**: Detailed error codes and descriptions
- **Film Status**: Release film condition monitoring
- **UV LED Monitoring**: Temperature tracking for UV LED systems
- **Enhanced Status Codes**: Support for 17+ different printer states

### Status Codes

The printer reports various status codes:

- `0` - Idle (no print in progress)
- `1` - Preparing
- `2` - Starting
- `3` - Printing
- `4` - Paused (print paused by user or error)
- `5` - Completed
- `6` - Cancelled
- `7` - Error
- `8` - Preparing to Print (warming up, calibrating)
- `9` - Starting Print (homing, priming)
- `10` - Paused
- `11` - Resuming
- `12` - Cancelling
- `13` - Printing (actively printing)
- `14` - Print Complete
- `15` - Print Failed
- `16` - Heating
- `17` - Cooling Down

## SDCP Protocol

This adapter implements the SDCP (Simple Device Communication Protocol) version 3.0 as used by the Elegoo Centauri Carbon. The protocol uses MQTT-like messaging over WebSocket connections.

### Supported Commands

- `0` - Request status update
- `128` - Start print job
- `129` - Pause print
- `130` - Cancel print
- `131` - Resume print
- `386` - Enable/disable camera stream
- `403` - Toggle lighting

### WebSocket Endpoint

The printer’s WebSocket server is available at:

```
ws://[PRINTER_IP]:3030/websocket
```

*Example: ws://192.168.178.34:3030/websocket*

### Connection Management

- No authentication required
- Connection timeout: 60 seconds of inactivity
- Automatic reconnection with configurable interval
- Ping/pong keepalive every 30 seconds

## Troubleshooting

### Connection Issues

1. Verify the printer’s IP address is correct
1. Ensure the printer is powered on and connected to the network
1. Check that no firewall is blocking the connection
1. Try pinging the printer’s IP address
1. Verify the printer’s firmware supports SDCP

### Status Not Updating

1. Check the connection status in `info.connection`
1. Verify the poll interval setting
1. Look at the adapter logs for error messages
1. Try manually requesting status with `control.request_status`

### Print Commands Not Working

1. Ensure the printer is in the correct state for the command
1. Verify file paths are correct (use “/local/” prefix)
1. Check that the file exists on the printer
1. Monitor the adapter logs for command responses

## Development

### Prerequisites

- Node.js 14.x or higher
- ioBroker development environment

### Building

```bash
npm install
npm run build
npm run test
```

### Contributing

1. Fork the repository
1. Create a feature branch
1. Make your changes
1. Add tests if applicable
1. Submit a pull request

## Changelog

### 1.0.0 (2025-08-17)

- Initial release
- Basic monitoring and control features
- SDCP protocol implementation
- WebSocket connection management
- Automatic reconnection
- Multi-language support

## License

MIT License

Copyright (c) 2025 Tim Klima

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the “Software”), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## References

- [OpenCentauri Documentation](https://opencentauri.github.io/OpenCentauri/) - Comprehensive SDCP protocol documentation
- [Centauri Carbon Monitor](https://github.com/sheffieldnikki/centauri-carbon-monitor) - Python monitoring script inspiration
- [SDCP Protocol Documentation](https://github.com/WalkerFrederick/sdcp-centauri-carbon) - SDCP implementation details
- [Elegoo Centauri Carbon Manual](https://www.elegoo.com) - Official printer documentation
- [ioBroker Adapter Development](https://github.com/ioBroker/ioBroker.template) - ioBroker development guidelines

## Support

For support and questions:

- Create an issue on [GitHub](https://github.com/tholterhus/iobroker.elegoo-centauri-carbon/issues)
- Visit the [ioBroker Forum](https://forum.iobroker.net)
- Check the [OpenCentauri Discord](https://discord.gg/t6Cft3wNJ3) for SDCP protocol discussions
- Review the [ioBroker Documentation](https://www.iobroker.net)
