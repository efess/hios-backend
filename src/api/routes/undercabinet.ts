import { Router, Request, Response } from 'express';
import mqtt from 'mqtt';
import { MqttConfig } from '../../config';

const router = Router();

const mqttUrl = (mqttConf: MqttConfig) => `mqtt://${mqttConf.host}:${mqttConf.port}`;

const topics = {
    stateResponse: '/home/kitchen/cabinet/lights/response',
    stateRequest: '/home/kitchen/cabinet/lights/request'
};

router.get('/', function (req: Request, res: Response) {
    res.render('undercabinet', { title: 'Home HIoS - Under cabinet lights' });
});

router.post('/getState', function (req: Request, res: Response) {
    const client = mqtt.connect(mqttUrl(req.config.mqtt));
    client.on('error', function (err) {
        console.log('mqtt failed to connect: ' + err);
    });
    client.on('connect', function () {
        client.subscribe(topics.stateResponse);
        client.publish(topics.stateRequest, Buffer.alloc(0));
    });

    client.on('message', function (topic, data) {
        if (topic === topics.stateResponse) {
            const options = JSON.parse(data.toString());
            res.send({ options: options });
            client.end();
        }
    });
});

router.post('/changeOptions', function (req: Request, res: Response) {
    const client = mqtt.connect(mqttUrl(req.config.mqtt));
    const options = req.body.options || {};

    client.on('connect', function () {
        client.publish('/home/kitchen/cabinet/lights/update', JSON.stringify(options));
        client.end();
    });

    res.send({ status: 'SUCCESS' });
});

export default router;
