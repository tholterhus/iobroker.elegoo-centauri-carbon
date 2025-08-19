/**
* ioBroker Elegoo Centauri Carbon Adapter
* Monitors Elegoo Centauri Carbon 3D printer via SDCP protocol
**/
'use strict';

const utils = require('@iobroker/adapter-core');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const dgram = require('dgram');
const os = require('os');

class ElegooCentauriCarbon extends utils.Adapter {

constructor(options) {
    super({
        ...options,
        name: 'elegoo-centauri-carbon',
    });

    this.ws = null;
    this.reconnectTimer = null;
    this.pingTimer = null;
    this.statusRequestTimer = null;
    this.discoveryTimer = null;
    this.alertTimers = new Map();
    this.isConnected = false;
    this.lastStatus = {};
    this.alertThresholds = {
        bedCooldownTemp: 40,
        maxTempDiff: 10,
        connectionTimeout: 60000
    };

    this.on('ready', this.onReady.bind(this));
    this.on('stateChange', this.onStateChange.bind(this));
    this.on('unload', this.onUnload.bind(this));
}

/**
 * Initialize adapter
 */
async onReady() {
    this.log.info('Starting Elegoo Centauri Carbon adapter');

    // Initialize adapter configuration
    await this.initializeObjects();

    // Auto-discover printers if enabled
    if (this.config.enableAutoDiscovery) {
        await this.discoverPrinters();
    }

    // Connect to printer
    await this.connectToPrinter();

    // Subscribe to state changes for control
    this.subscribeStates('control.*');
}

/**
 * Create necessary objects and states
 */
async initializeObjects() {
    // Network discovery
    await this.setObjectNotExistsAsync('discovery', {
        type: 'channel',
        common: {
            name: 'Network Discovery'
        },
        native: {}
    });

    await this.setObjectNotExistsAsync('discovery.auto_discovered', {
        type: 'state',
        common: {
            name: 'Auto-discovered Printers',
            type: 'string',
            role: 'json',
            read: true,
            write: false,
        },
        native: {}
    });

    await this.setObjectNotExistsAsync('discovery.last_scan', {
        type: 'state',
        common: {
            name: 'Last Discovery Scan',
            type: 'number',
            role: 'value.time',
            read: true,
            write: false,
        },
        native: {}
    });

    // Alerts and notifications
    await this.setObjectNotExistsAsync('alerts', {
        type: 'channel',
        common: {
            name: 'Alerts and Notifications'
        },
        native: {}
    });

    const alertStates = [
        { id: 'print_complete', name: 'Print Complete Alert', type: 'boolean', role: 'indicator.alarm' },
        { id: 'print_paused', name: 'Print Paused Alert', type: 'boolean', role: 'indicator.alarm' },
        { id: 'print_error', name: 'Print Error Alert', type: 'boolean', role: 'indicator.alarm' },
        { id: 'bed_cooled', name: 'Bed Cooled Down Alert', type: 'boolean', role: 'indicator.alarm' },
        { id: 'connection_lost', name: 'Connection Lost Alert', type: 'boolean', role: 'indicator.alarm' },
        { id: 'last_alert', name: 'Last Alert Message', type: 'string', role: 'text' },
        { id: 'alert_count', name: 'Total Alert Count', type: 'number', role: 'value' }
    ];

    for (const alert of alertStates) {
        await this.setObjectNotExistsAsync('alerts.${alert.id}', {
            type: 'state',
            common: {
                name: alert.name,
                type: alert.type,
                role: alert.role,
                read: true,
                write: false,
            },
            native: {}
        });
    }
    await this.setObjectNotExistsAsync('info', {
        type: 'channel',
        common: {
            name: 'Information'
        },
        native: {}
    });

    await this.setObjectNotExistsAsync('info.connection', {
        type: 'state',
        common: {
            name: 'Connection status',
            type: 'boolean',
            role: 'indicator.connected',
            read: true,
            write: false,
        },
        native: {}
    });

    // Temperature sensors
    await this.setObjectNotExistsAsync('temperature', {
        type: 'channel',
        common: {
            name: 'Temperature'
        },
        native: {}
    });

    const tempStates = [
        { id: 'hotbed', name: 'Hotbed Temperature', unit: '°C' },
        { id: 'nozzle', name: 'Nozzle Temperature', unit: '°C' },
        { id: 'box', name: 'Box Temperature', unit: '°C' },
        { id: 'hotbed_target', name: 'Hotbed Target Temperature', unit: '°C' },
        { id: 'nozzle_target', name: 'Nozzle Target Temperature', unit: '°C' },
        { id: 'box_target', name: 'Box Target Temperature', unit: '°C' }
    ];

    for (const temp of tempStates) {
        await this.setObjectNotExistsAsync('temperature.${temp.id}', {
            type: 'state',
            common: {
                name: temp.name,
                type: 'number',
                role: 'value.temperature',
                unit: temp.unit,
                read: true,
                write: false,
            },
            native: {}
        });
    }

    // Print status
    await this.setObjectNotExistsAsync('print', {
        type: 'channel',
        common: {
            name: 'Print Information'
        },
        native: {}
    });

    const printStates = [
        { id: 'status', name: 'Print Status', type: 'number', role: 'value' },
        { id: 'status_text', name: 'Print Status Text', type: 'string', role: 'text' },
        { id: 'progress', name: 'Print Progress', type: 'number', role: 'value.progress', unit: '%' },
        { id: 'current_layer', name: 'Current Layer', type: 'number', role: 'value' },
        { id: 'total_layers', name: 'Total Layers', type: 'number', role: 'value' },
        { id: 'filename', name: 'Current File', type: 'string', role: 'text' },
        { id: 'print_speed', name: 'Print Speed %', type: 'number', role: 'value', unit: '%' },
        { id: 'current_ticks', name: 'Current Ticks', type: 'number', role: 'value' },
        { id: 'total_ticks', name: 'Total Ticks', type: 'number', role: 'value' }
    ];

    for (const state of printStates) {
        await this.setObjectNotExistsAsync('print.${state.id}', {
            type: 'state',
            common: {
                name: state.name,
                type: state.type,
                role: state.role,
                unit: state.unit || '',
                read: true,
                write: false,
            },
            native: {}
        });
    }

    // Position
    await this.setObjectNotExistsAsync('position', {
        type: 'channel',
        common: {
            name: 'Position'
        },
        native: {}
    });

    const posStates = ['x', 'y', 'z'];
    for (const axis of posStates) {
        await this.setObjectNotExistsAsync('position.${axis}', {
            type: 'state',
            common: {
                name: '${axis.toUpperCase()} Position',
                type: 'number',
                role: 'value',
                unit: 'mm',
                read: true,
                write: false,
            },
            native: {}
        });
    }

    await this.setObjectNotExistsAsync('position.z_offset', {
        type: 'state',
        common: {
            name: 'Z Offset',
            type: 'number',
            role: 'value',
            unit: 'mm',
            read: true,
            write: false,
        },
        native: {}
    });

    // Fan speeds
    await this.setObjectNotExistsAsync('fans', {
        type: 'channel',
        common: {
            name: 'Fan Speeds'
        },
        native: {}
    });

    const fanStates = [
        { id: 'model_fan', name: 'Model Fan Speed', unit: '%' },
        { id: 'auxiliary_fan', name: 'Auxiliary Fan Speed', unit: '%' },
        { id: 'box_fan', name: 'Box Fan Speed', unit: '%' }
    ];

    for (const fan of fanStates) {
        await this.setObjectNotExistsAsync('fans.${fan.id}', {
            type: 'state',
            common: {
                name: fan.name,
                type: 'number',
                role: 'value',
                unit: fan.unit,
                read: true,
                write: false,
            },
            native: {}
        });
    }

    // Camera integration
    await this.setObjectNotExistsAsync('camera', {
        type: 'channel',
        common: {
            name: 'Camera'
        },
        native: {}
    });

    await this.setObjectNotExistsAsync('camera.stream_url', {
        type: 'state',
        common: {
            name: 'Camera Stream URL',
            type: 'string',
            role: 'text.url',
            read: true,
            write: false,
        },
        native: {}
    });

    await this.setObjectNotExistsAsync('camera.stream_enabled', {
        type: 'state',
        common: {
            name: 'Camera Stream Enabled',
            type: 'boolean',
            role: 'indicator',
            read: true,
            write: false,
        },
        native: {}
    });

    await this.setObjectNotExistsAsync('camera.timelapse_status', {
        type: 'state',
        common: {
            name: 'Timelapse Status',
            type: 'number',
            role: 'value',
            read: true,
            write: false,
        },
        native: {}
    });

    // Additional printer stats
    await this.setObjectNotExistsAsync('stats', {
        type: 'channel',
        common: {
            name: 'Printer Statistics'
        },
        native: {}
    });

    const statsStates = [
        { id: 'total_print_time', name: 'Total Print Time', type: 'number', role: 'value.time', unit: 'hours' },
        { id: 'print_error', name: 'Print Error', type: 'string', role: 'text' },
        { id: 'release_film_status', name: 'Release Film Status', type: 'string', role: 'text' },
        { id: 'uv_led_temp', name: 'UV LED Temperature', type: 'number', role: 'value.temperature', unit: '°C' },
        { id: 'remaining_print_time', name: 'Remaining Print Time', type: 'number', role: 'value.time', unit: 'hours' },
        { id: 'remaining_layers', name: 'Remaining Layers', type: 'number', role: 'value' }
    ];

    for (const stat of statsStates) {
        await this.setObjectNotExistsAsync('stats.${stat.id}', {
            type: 'state',
            common: {
                name: stat.name,
                type: stat.type,
                role: stat.role,
                unit: stat.unit || '',
                read: true,
                write: false,
            },
            native: {}
        });
    }
    await this.setObjectNotExistsAsync('lighting', {
        type: 'channel',
        common: {
            name: 'Lighting'
        },
        native: {}
    });

    await this.setObjectNotExistsAsync('lighting.second_light', {
        type: 'state',
        common: {
            name: 'Second Light',
            type: 'boolean',
            role: 'switch.light',
            read: true,
            write: false,
        },
        native: {}
    });

    const rgbStates = ['r', 'g', 'b'];
    for (const color of rgbStates) {
        await this.setObjectNotExistsAsync('lighting.rgb_${color}', {
            type: 'state',
            common: {
                name: 'RGB ${color.toUpperCase()}',
                type: 'number',
                role: 'level.color.rgb',
                min: 0,
                max: 255,
                read: true,
                write: false,
            },
            native: {}
        });
    }

    // Control commands
    await this.setObjectNotExistsAsync('control', {
        type: 'channel',
        common: {
            name: 'Control Commands'
        },
        native: {}
    });

    const controlStates = [
        { id: 'start_print', name: 'Start Print', role: 'button.start' },
        { id: 'pause_print', name: 'Pause Print', role: 'button.pause' },
        { id: 'resume_print', name: 'Resume Print', role: 'button.play' },
        { id: 'cancel_print', name: 'Cancel Print', role: 'button.stop' },
        { id: 'toggle_light', name: 'Toggle Light', role: 'button' },
        { id: 'request_status', name: 'Request Status Update', role: 'button' },
        { id: 'enable_camera', name: 'Enable Camera Stream', role: 'button' },
        { id: 'disable_camera', name: 'Disable Camera Stream', role: 'button' },
        { id: 'discover_printers', name: 'Discover Network Printers', role: 'button' },
        { id: 'clear_alerts', name: 'Clear All Alerts', role: 'button' }
    ];

    for (const control of controlStates) {
        await this.setObjectNotExistsAsync('control.${control.id}', {
            type: 'state',
            common: {
                name: control.name,
                type: 'boolean',
                role: control.role,
                read: false,
                write: true,
            },
            native: {}
        });
    }

    // File to print
    await this.setObjectNotExistsAsync('control.print_file', {
        type: 'state',
        common: {
            name: 'File to Print',
            type: 'string',
            role: 'text',
            read: true,
            write: true,
        },
        native: {}
    });
}

/**
 * Connect to the printer via WebSocket
 */
async connectToPrinter() {
    const host = this.config.host || '192.168.178.34';
    const port = this.config.port || 3030;
    const wsUrl = 'ws://${host}:${port}/websocket';

    this.log.info('Connecting to printer at ${wsUrl}');

    try {
        this.ws = new WebSocket(wsUrl);

        this.ws.on('open', () => {
            this.log.info('Connected to printer');
            this.isConnected = true;
            this.setState('info.connection', true, true);
            this.clearAlert('connection_lost');

            // Start ping timer to keep connection alive
            this.startPingTimer();

            // Start periodic status requests
            this.startStatusRequestTimer();

            // Request initial status and validate SDCP
            this.validateSDCPCompatibility();
        });

        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleMessage(message);
            } catch (error) {
                this.log.error('Error parsing message: ${error.message}');
            }
        });

        this.ws.on('close', () => {
            this.log.warn('WebSocket connection closed');
            this.isConnected = false;
            this.setState('info.connection', false, true);
            this.triggerAlert('connection_lost', 'Connection to printer lost');
            this.stopTimers();
            this.scheduleReconnect();
        });

        this.ws.on('error', (error) => {
            this.log.error('WebSocket error: ${error.message}');
            this.isConnected = false;
            this.setState('info.connection', false, true);
            this.triggerAlert('connection_lost', 'WebSocket error: ${error.message}');
        });

    } catch (error) {
        this.log.error('Failed to connect to printer: ${error.message}');
        this.triggerAlert('connection_lost', 'Failed to connect: ${error.message}');
        this.scheduleReconnect();
    }
}

/**
 * Validate SDCP compatibility with printer
 */
validateSDCPCompatibility() {
    this.log.info('Validating SDCP compatibility...');
    
    // Send initial command to verify SDCP compatibility
    const testCommand = {
        Id: '',
        Data: {
            Cmd: 0,
            Data: {},
            RequestID: uuidv4(),
            MainboardID: '',
            TimeStamp: Date.now(),
            From: 1
        }
    };

    this.ws.send(JSON.stringify(testCommand));
    
    // Set timeout for SDCP validation
    setTimeout(() => {
        if (!this.lastStatus.validated) {
            this.log.warn('SDCP validation timeout - printer may not be fully compatible');
        }
    }, 5000);
}

/**
 * Discover printers on the local network
 */
async discoverPrinters() {
    this.log.info('Starting network discovery for Elegoo printers...');
    
    const discoveredPrinters = [];
    const networkInterfaces = os.networkInterfaces();
    const promises = [];

    // Scan common network ranges
    for (const [interfaceName, addresses] of Object.entries(networkInterfaces)) {
        if (!addresses) continue;
        
        for (const addr of addresses) {
            if (addr.family === 'IPv4' && !addr.internal) {
                const networkBase = addr.address.split('.').slice(0, 3).join('.');
                promises.push(this.scanNetworkRange(networkBase, discoveredPrinters));
            }
        }
    }

    try {
        await Promise.all(promises);
        
        if (discoveredPrinters.length > 0) {
            this.log.info('Discovered ${discoveredPrinters.length} Elegoo printers');
            await this.setState('discovery.auto_discovered', JSON.stringify(discoveredPrinters), true);
        } else {
            this.log.info('No Elegoo printers discovered on network');
            await this.setState('discovery.auto_discovered', '[]', true);
        }
        
        await this.setState('discovery.last_scan', Date.now(), true);
        
    } catch (error) {
        this.log.error('Network discovery error: ${error.message}');
    }
}

/**
 * Scan a network range for SDCP-compatible printers
 */
async scanNetworkRange(networkBase, discoveredPrinters) {
    const scanPromises = [];
    
    // Scan common IP range (1-254)
    for (let i = 1; i <= 254; i++) {
        const ip = '${networkBase}.${i}';
        scanPromises.push(this.testPrinterConnection(ip, discoveredPrinters));
    }

    await Promise.allSettled(scanPromises);
}

/**
 * Test connection to potential printer
 */
async testPrinterConnection(ip, discoveredPrinters) {
    return new Promise((resolve) => {
        const port = this.config.port || 3030;
        const wsUrl = 'ws://${ip}:${port}/websocket';
        
        const testWs = new WebSocket(wsUrl, { handshakeTimeout: 2000 });
        
        const timeout = setTimeout(() => {
            testWs.terminate();
            resolve(false);
        }, 3000);

        testWs.on('open', () => {
            // Send SDCP test command
            const testCommand = {
                Id: '',
                Data: {
                    Cmd: 1, // Get device attributes
                    Data: {},
                    RequestID: uuidv4(),
                    MainboardID: '',
                    TimeStamp: Date.now(),
                    From: 1
                }
            };
            
            testWs.send(JSON.stringify(testCommand));
        });

        testWs.on('message', (data) => {
            try {
                const response = JSON.parse(data.toString());
                
                // Check if response contains SDCP-like structure
                if (response.Data || response.Status) {
                    const printerInfo = {
                        ip: ip,
                        port: port,
                        discovered: new Date().toISOString(),
                        wsUrl: wsUrl
                    };
                    
                    // Try to extract device information
                    if (response.MainboardID) {
                        printerInfo.mainboardId = response.MainboardID;
                    }
                    
                    discoveredPrinters.push(printerInfo);
                    this.log.info('Discovered Elegoo printer at ${ip}:${port}');
                }
            } catch (e) {
                // Not a valid SDCP response
            }
            
            clearTimeout(timeout);
            testWs.close();
            resolve(true);
        });

        testWs.on('error', () => {
            clearTimeout(timeout);
            resolve(false);
        });

        testWs.on('close', () => {
            clearTimeout(timeout);
            resolve(false);
        });
    });
}

/**
 * Handle incoming messages from printer
 */
handleMessage(message) {
    // Mark SDCP as validated on first valid response
    this.lastStatus.validated = true;

    if (message.Status) {
        // Status update message
        this.processStatusUpdate(message.Status);
        this.updateStates(message.Status);
    } else if (message.Data && message.Data.Cmd !== undefined) {
        // Command response
        this.handleCommandResponse(message);
        this.log.debug('Received command response: ${JSON.stringify(message)}');
    }
}

/**
 * Process status updates and trigger alerts
 */
processStatusUpdate(status) {
    const currentStatus = status.PrintInfo?.Status;
    const currentStatusText = this.getStatusText(currentStatus);
    const previousStatus = this.lastStatus.printStatus;
    
    // Check for status changes that should trigger alerts
    if (previousStatus !== undefined && previousStatus !== currentStatus) {
        this.handleStatusChange(previousStatus, currentStatus, currentStatusText);
    }

    // Check temperature-based alerts
    if (status.TempOfHotbed !== undefined) {
        this.checkTemperatureAlerts(status.TempOfHotbed, 'hotbed');
    }

    // Update last known status
    this.lastStatus = {
        ...this.lastStatus,
        printStatus: currentStatus,
        hotbedTemp: status.TempOfHotbed,
        timestamp: Date.now()
    };
}

/**
 * Handle printer status changes and trigger appropriate alerts
 */
handleStatusChange(previousStatus, currentStatus, statusText) {
    this.log.info('Status changed from ${this.getStatusText(previousStatus)} to ${statusText}');

    switch (currentStatus) {
        case 4: // Paused
        case 10: // Paused
            this.triggerAlert('print_paused', 'Print job paused: ${statusText}');
            break;
            
        case 5: // Completed 
        case 14: // Print Complete
            this.triggerAlert('print_complete', 'Print job completed successfully');
            break;
            
        case 6: // Cancelled
        case 7: // Error
        case 15: // Print Failed
            this.triggerAlert('print_error', 'Print job failed or cancelled: ${statusText}');
            break;
    }
}

/**
 * Check temperature-based alerts
 */
checkTemperatureAlerts(currentTemp, sensor) {
    const previousTemp = this.lastStatus['${sensor}Temp'];
    const cooldownThreshold = this.alertThresholds.bedCooldownTemp;

    // Bed cooled down alert
    if (sensor === 'hotbed' && previousTemp !== undefined) {
        if (previousTemp > cooldownThreshold && currentTemp <= cooldownThreshold) {
            this.triggerAlert('bed_cooled', 'Bed has cooled down to ${currentTemp}°C');
        }
    }

    // Temperature anomaly detection
    if (previousTemp !== undefined) {
        const tempDiff = Math.abs(currentTemp - previousTemp);
        if (tempDiff > this.alertThresholds.maxTempDiff) {
            this.log.warn('Large temperature change detected on ${sensor}: ${tempDiff}°C');
        }
    }
}

/**
 * Trigger an alert
 */
async triggerAlert(alertType, message) {
    this.log.warn('ALERT [${alertType.toUpperCase()}]: ${message}');
    
    try {
        await this.setState('alerts.${alertType}', true, true);
        await this.setState('alerts.last_alert', '[${new Date().toISOString()}] ${alertType}: ${message}', true);
        
        // Increment alert counter
        const currentCount = await this.getStateAsync('alerts.alert_count');
        const newCount = (currentCount?.val || 0) + 1;
        await this.setState('alerts.alert_count', newCount, true);

        // Auto-clear alert after timeout
        if (this.alertTimers.has(alertType)) {
            clearTimeout(this.alertTimers.get(alertType));
        }
        
        const timeout = setTimeout(async () => {
            await this.clearAlert(alertType);
            this.alertTimers.delete(alertType);
        }, this.config.alertClearTimeout || 300000); // 5 minutes default
        
        this.alertTimers.set(alertType, timeout);
        
    } catch (error) {
        this.log.error('Error triggering alert: ${error.message}');
    }
}

/**
 * Clear a specific alert
 */
async clearAlert(alertType) {
    try {
        await this.setState('alerts.${alertType}', false, true);
        this.log.debug('Cleared alert: ${alertType}');
    } catch (error) {
        this.log.error('Error clearing alert: ${error.message}');
    }
}

/**
 * Clear all alerts
 */
async clearAllAlerts() {
    const alertTypes = ['print_complete', 'print_paused', 'print_error', 'bed_cooled', 'connection_lost'];
    
    for (const alertType of alertTypes) {
        await this.clearAlert(alertType);
        
        if (this.alertTimers.has(alertType)) {
            clearTimeout(this.alertTimers.get(alertType));
            this.alertTimers.delete(alertType);
        }
    }
    
    this.log.info('All alerts cleared');
}

/**
 * Handle command responses, especially camera stream URLs
 */
handleCommandResponse(message) {
    const cmd = message.Data.Cmd;
    const data = message.Data.Data;

    if (cmd === 386 && data && data.StreamUrl) {
        // Camera stream URL response
        this.setState('camera.stream_url', data.StreamUrl, true);
        this.setState('camera.stream_enabled', true, true);
        this.log.info('Camera stream enabled: ${data.StreamUrl}');
    } else if (cmd === 386 && data && data.Enable === 0) {
        // Camera disabled
        this.setState('camera.stream_enabled', false, true);
        this.log.info('Camera stream disabled');
    }
}

/**
 * Update ioBroker states with printer status
 */
async updateStates(status) {
    try {
        // Temperature states
        await this.setState('temperature.hotbed', status.TempOfHotbed, true);
        await this.setState('temperature.nozzle', status.TempOfNozzle, true);
        await this.setState('temperature.box', status.TempOfBox, true);
        await this.setState('temperature.hotbed_target', status.TempTargetHotbed, true);
        await this.setState('temperature.nozzle_target', status.TempTargetNozzle, true);
        await this.setState('temperature.box_target', status.TempTargetBox, true);

        // Position states
        if (status.CurrenCoord) {
            const coords = status.CurrenCoord.split(',').map(parseFloat);
            if (coords.length >= 3) {
                await this.setState('position.x', coords[0], true);
                await this.setState('position.y', coords[1], true);
                await this.setState('position.z', coords[2], true);
            }
        }
        await this.setState('position.z_offset', status.ZOffset, true);

        // Fan speeds
        if (status.CurrentFanSpeed) {
            await this.setState('fans.model_fan', status.CurrentFanSpeed.ModelFan, true);
            await this.setState('fans.auxiliary_fan', status.CurrentFanSpeed.AuxiliaryFan, true);
            await this.setState('fans.box_fan', status.CurrentFanSpeed.BoxFan, true);
        }

        // Lighting
        if (status.LightStatus) {
            await this.setState('lighting.second_light', status.LightStatus.SecondLight === 1, true);
            if (status.LightStatus.RgbLight && status.LightStatus.RgbLight.length >= 3) {
                await this.setState('lighting.rgb_r', status.LightStatus.RgbLight[0], true);
                await this.setState('lighting.rgb_g', status.LightStatus.RgbLight[1], true);
                await this.setState('lighting.rgb_b', status.LightStatus.RgbLight[2], true);
            }
        }

        // Camera and timelapse
        if (status.TimeLapseStatus !== undefined) {
            await this.setState('camera.timelapse_status', status.TimeLapseStatus, true);
        }

        // Additional statistics (if available)
        if (status.TotalPrintTime) {
            // Convert from milliseconds to hours
            const totalHours = Math.round((status.TotalPrintTime / (1000 * 60 * 60)) * 100) / 100;
            await this.setState('stats.total_print_time', totalHours, true);
        }

        if (status.UVLedTemp !== undefined) {
            await this.setState('stats.uv_led_temp', status.UVLedTemp, true);
        }

        if (status.PrintError) {
            await this.setState('stats.print_error', status.PrintError, true);
        }

        if (status.ReleaseFilmStatus) {
            await this.setState('stats.release_film_status', status.ReleaseFilmStatus, true);
        }

        // Calculate remaining time and layers if print info is available
        if (status.PrintInfo) {
            const printInfo = status.PrintInfo;
            
            // Calculate remaining layers
            const remainingLayers = printInfo.TotalLayer - printInfo.CurrentLayer;
            await this.setState('stats.remaining_layers', remainingLayers, true);
            
            // Calculate remaining time (rough estimate based on progress)
            if (printInfo.TotalTicks > 0 && printInfo.CurrentTicks > 0) {
                const remainingTicks = printInfo.TotalTicks - printInfo.CurrentTicks;
                // Assuming ticks are in milliseconds, convert to hours
                const remainingHours = Math.round((remainingTicks / (1000 * 60 * 60)) * 100) / 100;
                await this.setState('stats.remaining_print_time', remainingHours, true);
            }
        }
            const printInfo = status.PrintInfo;
            await this.setState('print.status', printInfo.Status, true);
            await this.setState('print.status_text', this.getStatusText(printInfo.Status), true);
            await this.setState('print.progress', printInfo.Progress, true);
            await this.setState('print.current_layer', printInfo.CurrentLayer, true);
            await this.setState('print.total_layers', printInfo.TotalLayer, true);
            await this.setState('print.filename', printInfo.Filename, true);
            await this.setState('print.print_speed', printInfo.PrintSpeedPct, true);
            await this.setState('print.current_ticks', printInfo.CurrentTicks, true);
            await this.setState('print.total_ticks', printInfo.TotalTicks, true);
        }

    } catch (error) {
        this.log.error('Error updating states: ${error.message}');
    }
}

/**
 * Convert status code to human-readable text
 */
getStatusText(statusCode) {
    const statusMap = {
        0: 'Idle',
        1: 'Preparing',
        2: 'Starting',
        3: 'Printing',
        4: 'Paused',
        5: 'Completed',
        6: 'Cancelled',
        7: 'Error',
        8: 'Preparing to Print',
        9: 'Starting Print', 
        10: 'Paused',
        11: 'Resuming',
        12: 'Cancelling',
        13: 'Printing (Active)',
        14: 'Print Complete',
        15: 'Print Failed',
        16: 'Heating',
        17: 'Cooling Down'
    };
    return statusMap[statusCode] || 'Unknown Status (${statusCode})';
}

/**
 * Send command to printer
 */
sendCommand(cmd, data = {}) {
    if (!this.isConnected || !this.ws) {
        this.log.warn('Cannot send command - not connected to printer');
        return;
    }

    const message = {
        Id: '',
        Data: {
            Cmd: cmd,
            Data: data,
            RequestID: uuidv4(),
            MainboardID: '',
            TimeStamp: Date.now(),
            From: 1
        }
    };

    this.log.debug('Sending command: ${JSON.stringify(message)}');
    this.ws.send(JSON.stringify(message));
}

/**
 * Request status update from printer
 */
requestStatus() {
    this.sendCommand(0);
}

/**
 * Handle state changes for control commands
 */
onStateChange(id, state) {
    if (state && state.ack === false && state.val === true) {
        const stateName = id.split('.').pop();

        switch (stateName) {
            case 'request_status':
                this.requestStatus();
                break;
            case 'pause_print':
                this.sendCommand(129);
                break;
            case 'resume_print':
                this.sendCommand(131);
                break;
            case 'cancel_print':
                this.sendCommand(130);
                break;
            case 'toggle_light':
                this.sendCommand(403, {
                    LightStatus: {
                        SecondLight: true,
                        RgbLight: [0, 0, 0]
                    }
                });
                break;
            case 'start_print':
                this.handleStartPrint();
                break;
            case 'enable_camera':
                this.enableCameraStream();
                break;
            case 'disable_camera':
                this.disableCameraStream();
                break;
            case 'discover_printers':
                this.discoverPrinters();
                break;
            case 'clear_alerts':
                this.clearAllAlerts();
                break;
        }

        // Reset button state
        this.setState(id, false, true);
    }
}

/**
 * Handle start print command
 */
async handleStartPrint() {
    try {
        const fileState = await this.getStateAsync('control.print_file');
        const filename = fileState ? fileState.val : '';
        
        if (!filename) {
            this.log.warn('No file specified for printing');
            return;
        }

        this.sendCommand(128, {
            Filename: filename.startsWith('/local/') ? filename : '/local/${filename}',
            StartLayer: 0,
            Calibration_switch: 0,
            PrintPlatformType: 0,
            Tlp_Switch: 0
        });
    } catch (error) {
        this.log.error('Error starting print: ${error.message}');
    }
}

/**
 * Enable camera stream
 */
enableCameraStream() {
    this.sendCommand(386, { Enable: 1 });
    this.log.info('Enabling camera stream...');
}

/**
 * Disable camera stream
 */
disableCameraStream() {
    this.sendCommand(386, { Enable: 0 });
    this.log.info('Disabling camera stream...');
    this.setState('camera.stream_enabled', false, true);
    this.setState('camera.stream_url', '', true);
}

/**
 * Get camera stream URL (for external access)
 */
getCameraStreamUrl() {
    const host = this.config.host || '192.168.1.100';
    const port = this.config.cameraPort || 8080;
    
    // Common MJPEG stream endpoints for Elegoo printers
    const possibleEndpoints = [
        'http://${host}:${port}/video_feed',
        'http://${host}:${port}/stream.mjpg',
        'http://${host}:${port}/mjpeg',
        'http://${host}/video_feed',
        'http://${host}/stream.mjpg'
    ];
    
    return possibleEndpoints[0]; // Return first option, can be configured
}
startPingTimer() {
    this.pingTimer = setInterval(() => {
        if (this.isConnected && this.ws) {
            this.ws.ping();
        }
    }, 30000); // Ping every 30 seconds
}

/**
 * Start periodic status request timer
 */
startStatusRequestTimer() {
    this.statusRequestTimer = setInterval(() => {
        this.requestStatus();
    }, this.config.pollInterval || 10000); // Default 10 seconds
}

/**
 * Stop all timers
 */
stopTimers() {
    if (this.pingTimer) {
        clearInterval(this.pingTimer);
        this.pingTimer = null;
    }
    if (this.statusRequestTimer) {
        clearInterval(this.statusRequestTimer);
        this.statusRequestTimer = null;
    }
    if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
    }
}

/**
 * Schedule reconnection attempt
 */
scheduleReconnect() {
    if (this.reconnectTimer) {
        return;
    }

    this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.log.info('Attempting to reconnect to printer');
        this.connectToPrinter();
    }, 30000); // Retry after 30 seconds
}

/**
 * Cleanup on adapter unload
 */
onUnload(callback) {
    try {
        this.log.info('Cleaning up adapter');
        this.isConnected = false;
        this.stopTimers();

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        callback();
    } catch (e) {
        callback();
    }
}


}

// @ts-ignore parent is a valid property on module
if (module.parent) {
// Export the constructor in compact mode
/**
* @param {Partial<ioBroker.AdapterOptions>} [options={}]
*/
module.exports = (options) => new ElegooCentauriCarbon(options);
} else {
// Otherwise start the instance directly
new ElegooCentauriCarbon();
}
