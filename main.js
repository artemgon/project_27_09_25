class House {
    static instance = null;
    
    constructor() {
        if (House.instance) {
            return House.instance;
        }
        
        this.devices = [];
        this.users = [];
        this.temperature = 20;
        this.chatRoom = new HouseChatRoom();
        
        House.instance = this;
    }
    
    static getInstance() {
        if (!House.instance) {
            House.instance = new House();
        }
        return House.instance;
    }
    
    addDevice(device) {
        this.devices.push(device);
    }
    
    addUser(user) {
        this.users.push(user);
        this.chatRoom.addUser(user);
    }
    
    findDevice(name) {
        return this.devices.find(device => device.name === name);
    }
    
    findUser(name) {
        return this.users.find(user => user.name === name);
    }
}

class Device {
    constructor(name) {
        this.name = name;
        this.isOn = false;
        this.observers = [];
    }
    
    addObserver(observer) {
        this.observers.push(observer);
    }
    
    notifyObservers() {
        this.observers.forEach(observer => observer.update(this));
    }
}

class Light extends Device {
    constructor(name) {
        super(name);
    }
    
    turnOn() {
        this.isOn = true;
        this.notifyObservers();
        return `Light ${this.name} turned on`;
    }
    
    turnOff() {
        this.isOn = false;
        this.notifyObservers();
        return `Light ${this.name} turned off`;
    }
}

class Door extends Device {
    constructor(name) {
        super(name);
        this.isLocked = true;
    }
    
    lock() {
        this.isLocked = true;
        this.notifyObservers();
        return `Door ${this.name} locked`;
    }
    
    unlock() {
        this.isLocked = false;
        this.notifyObservers();
        return `Door ${this.name} unlocked`;
    }
}

class TemperatureSensor extends Device {
    constructor(name) {
        super(name);
        this.temperature = 20;
    }
    
    setTemperature(temp) {
        this.temperature = temp;
        this.notifyObservers();
        return `Temperature sensor ${this.name} updated to ${temp}C`;
    }
}

class Command {
    execute() {}
    undo() {}
}

class LightOnCommand extends Command {
    constructor(light) {
        super();
        this.light = light;
    }
    
    execute() {
        return this.light.turnOn();
    }
    
    undo() {
        return this.light.turnOff();
    }
}

class LightOffCommand extends Command {
    constructor(light) {
        super();
        this.light = light;
    }
    
    execute() {
        return this.light.turnOff();
    }
    
    undo() {
        return this.light.turnOn();
    }
}

class DoorLockCommand extends Command {
    constructor(door) {
        super();
        this.door = door;
    }
    
    execute() {
        return this.door.lock();
    }
    
    undo() {
        return this.door.unlock();
    }
}

class DoorUnlockCommand extends Command {
    constructor(door) {
        super();
        this.door = door;
    }
    
    execute() {
        return this.door.unlock();
    }
    
    undo() {
        return this.door.lock();
    }
}

class RemoteControl {
    constructor() {
        this.commands = [];
        this.history = [];
    }
    
    pressButton(command) {
        const result = command.execute();
        this.history.push(command);
        return result;
    }
    
    undo() {
        if (this.history.length > 0) {
            const command = this.history.pop();
            return command.undo();
        }
        return "No commands to undo";
    }
}

class SecurityProxy {
    constructor(command, house) {
        this.command = command;
        this.house = house;
    }
    
    execute() {
        if (this.command instanceof LightOffCommand) {
            const frontDoor = this.house.findDevice('Front Door');
            if (frontDoor && !frontDoor.isLocked) {
                return "Security Warning: Cannot turn off lights while front door is unlocked";
            }
        }
        return this.command.execute();
    }
}

class LogCommand {
    constructor(command) {
        this.command = command;
    }
    
    execute() {
        const house = House.getInstance();
        house.systemLog(`Executing command: ${this.command.constructor.name}`);
        const result = this.command.execute();
        house.systemLog(`Command result: ${result}`);
        return result;
    }
}

class SmartHomeFacade {
    constructor() {
        this.house = House.getInstance();
        this.remote = new RemoteControl();
    }
    
    leaveHome() {
        const results = [];
        
        const livingRoomLight = this.house.findDevice('Living Room Light');
        if (livingRoomLight) {
            const command = new LogCommand(new SecurityProxy(new LightOffCommand(livingRoomLight), this.house));
            results.push(this.remote.pressButton(command));
        }
        
        const frontDoor = this.house.findDevice('Front Door');
        if (frontDoor) {
            const command = new LogCommand(new DoorLockCommand(frontDoor));
            results.push(this.remote.pressButton(command));
        }
        
        this.house.systemLog("Left home mode activated");
        return results;
    }
    
    arriveHome() {
        const results = [];
        
        const frontDoor = this.house.findDevice('Front Door');
        if (frontDoor) {
            const command = new LogCommand(new DoorUnlockCommand(frontDoor));
            results.push(this.remote.pressButton(command));
        }
        
        const livingRoomLight = this.house.findDevice('Living Room Light');
        if (livingRoomLight) {
            const command = new LogCommand(new LightOnCommand(livingRoomLight));
            results.push(this.remote.pressButton(command));
        }
        
        this.house.systemLog("Arrived home mode activated");
        return results;
    }
}

class HeatingStrategy {
    heat() {}
}

class EcoMode extends HeatingStrategy {
    heat() {
        return "Eco mode: Heating to 18C";
    }
}

class ComfortMode extends HeatingStrategy {
    heat() {
        return "Comfort mode: Heating to 22C";
    }
}

class HeatingSystem {
    constructor() {
        this.strategy = new EcoMode();
    }
    
    setStrategy(strategy) {
        this.strategy = strategy;
    }
    
    heat() {
        return this.strategy.heat();
    }
    
    update(device) {
        if (device instanceof TemperatureSensor) {
            if (device.temperature < 18) {
                this.setStrategy(new ComfortMode());
                House.getInstance().systemLog(`Heating system activated: ${this.heat()}`);
            } else {
                this.setStrategy(new EcoMode());
            }
        }
    }
}

class User {
    constructor(name) {
        this.name = name;
    }
    
    sendMessage(to, message) {
        const house = House.getInstance();
        house.chatRoom.sendMessage(this, to, message);
    }
    
    receiveMessage(from, message) {
        const house = House.getInstance();
        house.chatRoom.displayMessage(from, message, this.name);
    }
}

class HouseChatRoom {
    constructor() {
        this.users = [];
    }
    
    addUser(user) {
        this.users.push(user);
    }
    
    sendMessage(from, to, message) {
        if (to === 'all') {
            this.users.forEach(user => {
                if (user.name !== from.name) {
                    user.receiveMessage(from.name, message);
                }
            });
            this.displayMessage(from.name, message, 'all');
        } else {
            const recipient = this.users.find(user => user.name === to);
            if (recipient) {
                recipient.receiveMessage(from.name, message);
                this.displayMessage(from.name, message, to);
            }
        }
    }
    
    displayMessage(from, message, to) {
        const house = House.getInstance();
        house.chatLog(`[${from} -> ${to}]: ${message}`);
    }
}

class OldDevice {
    constructor(name) {
        this.name = name;
    }
    
    oldTurnOn() {
        return `Old device ${this.name} activated`;
    }
    
    oldTurnOff() {
        return `Old device ${this.name} deactivated`;
    }
}

class DeviceAdapter extends Device {
    constructor(oldDevice) {
        super(oldDevice.name);
        this.oldDevice = oldDevice;
    }
    
    turnOn() {
        this.isOn = true;
        this.notifyObservers();
        return this.oldDevice.oldTurnOn();
    }
    
    turnOff() {
        this.isOn = false;
        this.notifyObservers();
        return this.oldDevice.oldTurnOff();
    }
}

House.prototype.systemLog = function(message) {
    const logElement = document.getElementById('systemLog');
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry log-info';
    logEntry.textContent = `[${timestamp}] ${message}`;
    logElement.appendChild(logEntry);
    logElement.scrollTop = logElement.scrollHeight;
    console.log(`[SYSTEM] ${message}`);
};

House.prototype.chatLog = function(message) {
    const chatElement = document.getElementById('chatLog');
    const messageElement = document.createElement('div');
    messageElement.className = 'message user';
    messageElement.textContent = message;
    chatElement.appendChild(messageElement);
    chatElement.scrollTop = chatElement.scrollHeight;
    console.log(`[CHAT] ${message}`);
};

function updateStatus() {
    const house = House.getInstance();
    const statusElement = document.getElementById('homeStatus');
    
    let statusHTML = `
        <div class="status-item">Temperature: ${house.temperature}C</div>
        <div class="status-item">Users at home: ${house.users.length}</div>
        <div class="status-item">Active devices: ${house.devices.filter(d => d.isOn).length}</div>
    `;
    
    statusElement.innerHTML = statusHTML;
}

function updateDevices() {
    const house = House.getInstance();
    const devicesElement = document.getElementById('devicesStatus');
    
    let devicesHTML = '';
    house.devices.forEach(device => {
        const status = device.isOn ? 'ON' : 'OFF';
        const lockStatus = device.isLocked !== undefined ? 
            (device.isLocked ? 'LOCKED' : 'UNLOCKED') : '';
        const tempStatus = device.temperature !== undefined ? 
            `${device.temperature}C` : '';
            
        devicesHTML += `
            <div class="device-item">
                <strong>${device.name}</strong><br>
                Status: ${status} ${lockStatus} ${tempStatus}
            </div>
        `;
    });
    
    devicesElement.innerHTML = devicesHTML;
}

function simulateDay() {
    const house = House.getInstance();
    house.systemLog("Starting day simulation...");
    
    setTimeout(() => {
        const facade = new SmartHomeFacade();
        facade.arriveHome();
        updateDevices();
    }, 1000);
    
    setTimeout(() => {
        const john = house.findUser('John');
        if (john) {
            john.sendMessage('all', 'Good morning everyone!');
        }
    }, 2000);
    
    setTimeout(() => {
        const tempSensor = house.findDevice('Temperature Sensor');
        if (tempSensor) {
            tempSensor.setTemperature(16);
        }
    }, 3000);
    
    setTimeout(() => {
        const mary = house.findUser('Mary');
        if (mary) {
            mary.sendMessage('John', 'The house is getting cold!');
        }
    }, 4000);
    
    setTimeout(() => {
        const facade = new SmartHomeFacade();
        facade.leaveHome();
        updateDevices();
    }, 5000);
}

function initApp() {
    const house = House.getInstance();
    
    const livingRoomLight = new Light('Living Room Light');
    const frontDoor = new Door('Front Door');
    const tempSensor = new TemperatureSensor('Temperature Sensor');
    
    const oldThermostat = new OldDevice('Old Thermostat');
    const adaptedThermostat = new DeviceAdapter(oldThermostat);
    
    house.addDevice(livingRoomLight);
    house.addDevice(frontDoor);
    house.addDevice(tempSensor);
    house.addDevice(adaptedThermostat);
    
    const john = new User('John');
    const mary = new User('Mary');
    
    house.addUser(john);
    house.addUser(mary);
    
    const heatingSystem = new HeatingSystem();
    tempSensor.addObserver(heatingSystem);
    
    document.getElementById('arriveHomeBtn').addEventListener('click', () => {
        const facade = new SmartHomeFacade();
        facade.arriveHome();
        updateDevices();
    });
    
    document.getElementById('leaveHomeBtn').addEventListener('click', () => {
        const facade = new SmartHomeFacade();
        facade.leaveHome();
        updateDevices();
    });
    
    document.getElementById('simulateDayBtn').addEventListener('click', simulateDay);
    
    document.getElementById('sendChatBtn').addEventListener('click', () => {
        const messageInput = document.getElementById('messageInput');
        const userSelect = document.getElementById('userSelect');
        const message = messageInput.value;
        
        if (message) {
            const john = house.findUser('John');
            if (john) {
                john.sendMessage(userSelect.value, message);
            }
            messageInput.value = '';
        }
    });
    
    const userSelect = document.getElementById('userSelect');
    userSelect.innerHTML = '<option value="all">All Users</option>';
    house.users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.name;
        option.textContent = user.name;
        userSelect.appendChild(option);
    });
    
    updateStatus();
    updateDevices();
    
    house.systemLog("Smart Home System initialized");
    house.systemLog(`Devices: ${house.devices.length}`);
    house.systemLog(`Users: ${house.users.length}`);
}

document.addEventListener('DOMContentLoaded', initApp);