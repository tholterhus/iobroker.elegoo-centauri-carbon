/**

- ioBroker Elegoo Centauri Carbon Adapter
- Monitors Elegoo Centauri Carbon 3D printer via SDCP protocol
  */
'use strict';

const utils = require('@iobroker/adapter-core');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

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
    this.isConnected = false;

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

    // Connect to printer
    await this.connectToPrinter();

    // Subscribe to state changes for control
    this.subscribeStates('control.*');
}

/**
 * Create necessary objects and states
 */
async initializeObjects() {
    // Connection status
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
        await this.setObjectNotExistsAsync(`temperature.${temp.id}`, {
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
        await this.setObjectNotExistsAsync(`print.${state.id}`, {
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
        await this.setObjectNotExistsAsync(`position.${axis}`, {
            type: 'state',
            common: {
                name: `${axis.toUpperCase()} Position`,
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
        await this.setObjectNotExistsAsync(`fans.${fan.id}`, {
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

    // Lighting
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
        await this.setObjectNotExistsAsync(`lighting.rgb_${color}`, {
            type: 'state',
            common: {
                name: `RGB ${color.toUpperCase()}`,
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
        { id: 'request_status', name: 'Request Status Update', role: 'button' }
    ];

    for (const control of controlStates) {
        await this.setObjectNotExistsAsync(`control.${control.id}`, {
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
    const wsUrl = `ws://${host}:3030/websocket`;

    this.log.info(`Connecting to printer at ${wsUrl}`);

    try {
        this.ws = new WebSocket(wsUrl);

        this.ws.on('open', () => {
            this.log.info('Connected to printer');
            this.isConnected = true;
            this.setState('info.connection', true, true);

            // Start ping timer to keep connection alive
            this.startPingTimer();

            // Start periodic status requests
            this.startStatusRequestTimer();

            // Request initial status
            this.requestStatus();
        });

        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleMessage(message);
            } catch (error) {
                this.log.error(`Error parsing message: ${error.message}`);
            }
        });

        this.ws.on('close', () => {
            this.log.warn('WebSocket connection closed');
            this.isConnected = false;
            this.setState('info.connection', false, true);
            this.stopTimers();
            this.scheduleReconnect();
        });

        this.ws.on('error', (error) => {
            this.log.error(`WebSocket error: ${error.message}`);
            this.isConnected = false;
            this.setState('info.connection', false, true);
        });

    } catch (error) {
        this.log.error(`Failed to connect to printer: ${error.message}`);
        this.scheduleReconnect();
    }
}

/**
 * Handle incoming messages from printer
 */
handleMessage(message) {
    if (message.Status) {
        // Status update message
        this.updateStates(message.Status);
    } else if (message.Data && message.Data.Cmd !== undefined) {
        // Command response
        this.log.debug(`Received command response: ${JSON.stringify(message)}`);
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

        // Print information
        if (status.PrintInfo) {
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
        this.log.error(`Error updating states: ${error.message}`);
    }
}

/**
 * Convert status code to human-readable text
 SDCP_PRINT_STATUS_IDLE = 0
SDCP_PRINT_STATUS_HOMING = 1
SDCP_PRINT_STATUS_DROPPING = 2
SDCP_PRINT_STATUS_EXPOSURING = 3
SDCP_PRINT_STATUS_LIFTING = 4
SDCP_PRINT_STATUS_PAUSING = 5
SDCP_PRINT_STATUS_PAUSED = 6
SDCP_PRINT_STATUS_STOPPING = 7
SDCP_PRINT_STATUS_STOPPED = 8
SDCP_PRINT_STATUS_COMPLETE = 9
SDCP_PRINT_STATUS_FILE_CHECKING = 10
 */
getStatusText(statusCode) {
    const statusMap = {
        0: 'Idle',
        1: 'Homing',
        2: 'Dropping',
        3: 'Exposuring',
        4: 'Lifting',
        5: 'Pausing',
        6: 'Paused',
        7: 'Stopping',
        8: 'Stopped',
        9: 'Print complete',
        10: 'Paused',
        13: 'Printing',
        16: 'Heating'
    };
    return statusMap[statusCode] || `Unknown Status (${statusCode})`;
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

    this.log.debug(`Sending command: ${JSON.stringify(message)}`);
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
            Filename: filename.startsWith('/local/') ? filename : `/local/${filename}`,
            StartLayer: 0,
            Calibration_switch: 0,
            PrintPlatformType: 0,
            Tlp_Switch: 0
        });
    } catch (error) {
        this.log.error(`Error starting print: ${error.message}`);
    }
}

/**
 * Start ping timer to keep connection alive
 */
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
