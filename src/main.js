var cfg = require('./config');
var db = require('./db');
var schema = require('./store/schema');
var path = require('path');
var mqtt = require('./mqtt/client');
var tasks = require('./tasks/task');
var wu = require('./tasks/weatherUnderground');
var api = require('./api')

function startTasks(config) {
    tasks.addTask({
        timing: 'interval',
        time: 600000,   // every 10 minutes
                        // key only gives 500 calls per day
                        // 10 minutes means 432 per day (3 API calls per)
        fn: wu.update,
        fnContext: config.weatherUnderground
    });
    tasks.startAll();
}

cfg.load()
    .then((config) => {
        return db.init(config.store)
            .then(schema.upgrade)
            .then(() => mqtt.connect(config.mqtt))
            .then(() => api.start(config))
            .catch((err) => console.log("Server start failure: " + err))
    }, (err) => {
        console.log("Failure loading config, exiting\n" + err);
    })