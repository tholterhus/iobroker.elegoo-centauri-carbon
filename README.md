# ioBroker.elegoo-centauri-carbon

![Logo](admin/elegoo-centauri-carbon.png)

[![NPM version](https://img.shields.io/npm/v/iobroker.elegoo-centauri-carbon.svg)](https://www.npmjs.com/package/iobroker.elegoo-centauri-carbon)
[![Downloads](https://img.shields.io/npm/dm/iobroker.elegoo-centauri-carbon.svg)](https://www.npmjs.com/package/iobroker.elegoo-centauri-carbon)
[![Dependency Status](https://img.shields.io/david/yourusername/iobroker.elegoo-centauri-carbon.svg)](https://david-dm.org/yourusername/iobroker.elegoo-centauri-carbon)
[![Known Vulnerabilities](https://snyk.io/test/github/tholterhus/ioBroker.elegoo-centauri-carbon/badge.svg)](https://snyk.io/test/github/tholterhus/ioBroker.elegoo-centauri-carbon)


## Elegoo Centauri Carbon 3D Printer Adapter for ioBroker

This adapter enables monitoring and control of the Elegoo Centauri Carbon 3D printer through ioBroker using the SDCP (Simple Device Communication Protocol) over WebSocket.

## Features

### Monitoring

- **Real-time Status**: Current print status, progress, layer information
- **Temperature Monitoring**: Hotbed, nozzle, and enclosure temperatures with targets
- **Position Tracking**: X, Y, Z coordinates and Z-offset
- **Fan Speed Monitoring**: Model fan, auxiliary fan, and box fan speeds
- **Lighting Status**: RGB lighting and secondary light status
- **Connection Status**: Real-time connection monitoring with automatic reconnection

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

#### Control Commands

- `control.start_print` - Start print job (requires file in `control.print_file`)
- `control.pause_print` - Pause current print
- `control.resume_print` - Resume paused print
- `control.cancel_print` - Cancel current print
- `control.toggle_light` - Toggle printer lighting
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
npm install https://github.com/yourusername/ioBroker.elegoo-centauri-carbon.git
```

## Configuration

### Basic Setup

1. Install the adapter
1. Create a new instance
1. Configure the printer’s IP address in the adapter settings
1. Adjust poll interval if needed (default: 10 seconds)
1. Save and start the adapter

### Network Requirements

- The Elegoo Centauri Carbon must be connected to your local network
- The printer’s WebSocket server runs on port 3030 at `/websocket` (default)
- No authentication is required for the WebSocket connection
- Ensure your ioBroker instance can reach the printer’s IP address

### Printer Setup

- Ensure your Elegoo Centauri Carbon is updated to firmware version 1.1.29 or compatible
- The printer must be connected to the same network as your ioBroker instance
- Enable network features on the printer if not already active

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

### Status Codes

The printer reports various status codes:

- `0` - Idle (no print in progress)
- `8` - Preparing to Print (warming up, calibrating)
- `9` - Starting Print (homing, priming)
- `10` - Paused (print paused by user or error)
- `13` - Printing (actively printing)

## SDCP Protocol

This adapter implements the SDCP (Simple Device Communication Protocol) version 3.0 as used by the Elegoo Centauri Carbon. The protocol uses MQTT-like messaging over WebSocket connections.

### Supported Commands

- `0` - Request status update
- `128` - Start print job
- `129` - Pause print
- `130` - Cancel print
- `131` - Resume print
- `403` - Toggle lighting

### WebSocket Endpoint

The printer’s WebSocket server is available at:

```
ws://[PRINTER_IP]:3030/websocket
```

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
- Code and underlying logic entire created by AI (Claude) with absolutely minimal human intervention

## License

MIT License

Copyright (c) 2025 [Your Name]

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

- [SDCP Protocol Documentation](https://github.com/WalkerFrederick/sdcp-centauri-carbon)
- [Elegoo Centauri Carbon Manual](https://www.elegoo.com)
- [ioBroker Adapter Development](https://github.com/ioBroker/ioBroker.template)
- [OpenCentauri Project](https://github.com/search?q=opencentauri)

## Support

For support and questions:

- Create an issue on [GitHub](https://github.com/yourusername/ioBroker.elegoo-centauri-carbon/issues)
- Visit the [ioBroker Forum](https://forum.iobroker.net)
- Check the [ioBroker Documentation](https://www.iobroker.net)
