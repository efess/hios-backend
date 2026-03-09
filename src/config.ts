import * as fs from 'fs';

export interface StoreParams {
    host: string;
    user: string;
    password: string;
    database: string;
}

export interface StoreConfig {
    type: string;
    params: StoreParams;
}

export interface MqttConfig {
    host: string;
    port: number | string;
}

export interface WeatherUndergroundConfig {
    apiKey?: string;
}

export interface Config {
    load: () => Promise<Config>;
    store: StoreConfig;
    mqtt: MqttConfig;
    weatherUnderground: WeatherUndergroundConfig;
    publicDir: string;
    listenPort: number;
    [key: string]: any;
}

const localConfig = 'local_config.json';

function _applyEnvVar(obj: Record<string, any>, prop: string, env: string | undefined): void {
    if (typeof env !== 'undefined') {
        obj[prop] = env;
    }
}

function applyEnvVars(): void {
    _applyEnvVar(config.store.params, 'host', process.env.STORE_HOST);
    _applyEnvVar(config.store.params, 'user', process.env.STORE_USER);
    _applyEnvVar(config.store.params, 'database', process.env.STORE_DB);
    _applyEnvVar(config.store.params, 'password', process.env.STORE_PASS);
    _applyEnvVar(config.mqtt as Record<string, any>, 'host', process.env.MQTT_HOST);
    _applyEnvVar(config.mqtt as Record<string, any>, 'port', process.env.MQTT_PORT);
    _applyEnvVar(config.weatherUnderground as Record<string, any>, 'apiKey', process.env.WU_KEY);
}

const config: Config = {
    load: function (): Promise<Config> {
        return new Promise(function (resolve) {
            fs.readFile(localConfig, 'utf8', function (err, data) {
                if (!err) {
                    const cfgObj = JSON.parse(data);
                    Object.keys(cfgObj).forEach((key) => {
                        if (key === 'load') return;
                        const val = cfgObj[key];
                        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                            Object.assign((config as any)[key], val);
                        } else {
                            (config as any)[key] = val;
                        }
                    });
                }
                applyEnvVars();
                resolve(config);
            });
        });
    },
    store: {
        type: 'mysql',
        params: {
            user: 'foo',
            password: 'bar',
            database: 'hios',
            host: 'localhost'
        }
    },
    mqtt: {
        host: 'localhost',
        port: 1883
    },
    weatherUnderground: {},
    publicDir: 'public/',
    listenPort: 3000
};

applyEnvVars();

export default config;
