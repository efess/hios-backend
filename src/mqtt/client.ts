import mqtt from 'mqtt';
import { events as smokesEvents } from './device/smokes';
import { events as environmentEvents } from './device/environment';
import { MqttConfig } from '../config';

interface MqttEvent {
    topic: string;
    topicRegex?: RegExp;
    onEvent: (data: Buffer, topic: string) => void;
}

const eventModules: MqttEvent[][] = [smokesEvents, environmentEvents];
const events: MqttEvent[] = eventModules.reduce((arr, evnts) => arr.concat(evnts), [] as MqttEvent[]);

const connect = (config: MqttConfig): void => {
    const url = `mqtt://${config.host}:${config.port}`;
    console.log('mqtt attempting to connect to ' + url);
    const client = mqtt.connect(url);

    client.on('error', function (err) {
        console.log('mqtt can\'t connect: ' + err);
    });

    client.on('connect', function () {
        console.log('mqtt connected');
        events.forEach(event => {
            client.subscribe(event.topic);
        });
    });

    client.on('message', function (topic, data) {
        const evnt = events.find(event => {
            return event.topicRegex
                ? event.topicRegex.test(topic)
                : event.topic === topic;
        });
        if (evnt) {
            evnt.onEvent(data, topic);
        }
    });
};

export default { connect };
