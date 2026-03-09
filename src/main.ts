import config from './config';
import db from './db';
import schema from './store/schema';
import mqttClient from './mqtt/client';
import tasks from './tasks/task';
import wu from './tasks/weatherUnderground';
import api from './api';

function startTasks(cfg: typeof config): void {
    tasks.addTask({
        timing: 'interval',
        time: 600000,
        fn: wu.update,
        fnContext: cfg.weatherUnderground
    });
    tasks.startAll();
}

config.load()
    .then((cfg) => {
        return db.init(cfg.store)
            .then(schema.upgrade)
            .then(() => mqttClient.connect(cfg.mqtt))
            .then(() => api.start(cfg))
            .catch((err) => console.log('Server start failure: ' + err));
    }, (err) => {
        console.log('Failure loading config, exiting\n' + err);
    });
