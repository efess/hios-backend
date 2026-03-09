import { Router, Request, Response } from 'express';
import smokesModel from '../../model/smokes';
import * as R from 'ramda';
import mqtt from 'mqtt';
import base64 from 'base64-js';
import { MqttConfig } from '../../config';

const router = Router();

const mqttUrl = (mqttConf: MqttConfig) => `mqtt://${mqttConf.host}:${mqttConf.port}`;
const _probeArray = [0, 1, 2, 3];
const _testDeviceId = '31316536-6633-3939-2d64-6362372d3436';

function strToArrayBuffer(arrayBuffer: ArrayBuffer, offset: number, str: string, length: number): void {
    const uint8view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < length && i < str.length; i++) {
        uint8view[i + offset] = str.charCodeAt(i);
    }
}

const sendDeviceUpdate = (mqttConf: MqttConfig) => (devConfig: any): void => {
    const buffer = new ArrayBuffer(64);
    const uint8view = new Uint8Array(buffer);
    const uint16view = new Uint16Array(buffer);

    let byteCounter = 0;

    const probes = devConfig.probes;
    const grillProbe = R.find(R.propEq(0, 'probeId') as any)(probes);
    const grillTarget = (grillProbe && (grillProbe as any).target) || 0;

    function setProbeProps(probeId: number, name: string, enabled: number, target: number): void {
        strToArrayBuffer(buffer, byteCounter, name, 16);
        byteCounter += 16;
        uint16view[byteCounter / 2] = target;
        byteCounter += 2;
        uint8view[byteCounter++] = probeId;
        uint8view[byteCounter++] = enabled;
    }

    for (let i = 1; i < 4; i++) {
        const probe = R.find(R.propEq(i, 'probeId') as any)(probes);
        if (!probe) {
            setProbeProps(i, '', 0, 0);
        } else {
            setProbeProps(i, (probe as any).name, 1, (probe as any).target);
        }
    }

    uint16view[byteCounter / 2] = grillTarget;
    byteCounter += 2;
    uint8view[byteCounter++] = devConfig.options.fanPulse;

    const base64Str = base64.fromByteArray(uint8view.subarray(0, byteCounter));

    const client = mqtt.connect(mqttUrl(mqttConf));
    client.publish('/home/outside/smoker/stoker/config/update', base64Str);
};

function getDeviceConfig(deviceId: string): Promise<any> {
    const config: any = {};
    return Promise.all([
        smokesModel.getExistingSessions(deviceId).then(function (data: any) {
            config.probes = data;
        }),
        smokesModel.getSmokerOptions(deviceId).then(function (data: any) {
            config.options = data;
        })
    ]).then(function () {
        return config;
    });
}

function handleProbeUpdate(deviceId: string, config: any): Promise<any> {
    return getDeviceConfig(deviceId)
        .then(sendDeviceUpdate(config.mqtt));
}

router.get('/', function (req: Request, res: Response) {
    res.render('smoker', { title: 'Home HIoS - Smoker Stoker' });
});

router.get('/history', function (req: Request, res: Response) {
    res.render('smokerHistory', { title: 'Home HIoS - Smoker Stoker - History' });
});

router.post('/updateProbeTarget', function (req: Request, res: Response) {
    const deviceId = req.body.deviceId || _testDeviceId;
    let target = parseInt(req.body.target || 0);
    const probeId = req.body.probeId || 0;

    if (!probeId) {
        res.send('Missing probeid');
        return;
    }

    if (target < 50 || target > 1000) {
        target = 0;
    }

    smokesModel.updateProbeTarget(deviceId, probeId, target)
        .then(function () {
            handleProbeUpdate(deviceId, req.config);
            res.send({ status: 'SUCCESS' });
        }, function (err: any) {
            res.send('Error: ' + err);
        });
});

router.post('/closeSession', function (req: Request, res: Response) {
    const tokens = [
        req.body.end || new Date().getTime(),
        req.body.description || '',
        req.body.tableId || 0
    ];

    smokesModel.closeSession(tokens)
        .then(function () {
            res.send({ status: 'SUCCESS' });
        }, function (err: any) {
            res.send('Error: ' + err);
        });
});

router.post('/newSession', function (req: Request, res: Response) {
    if (!req.body.probeId) {
        res.send('Missing probeid');
        return;
    }
    if (req.body.probeId === 0) {
        res.send('Cannot add session for probeId 0');
        return;
    }
    const deviceId = req.body.deviceId || _testDeviceId;
    const tokens = [
        deviceId,
        new Date().getTime(),
        0,
        req.body.meat || 'Some meat',
        req.body.target || 0,
        'Char-Griller AKORN',
        req.body.description || '',
        req.body.probeId
    ];

    smokesModel.createSession(tokens)
        .then(function () {
            handleProbeUpdate(deviceId, req.config);
            res.send({ status: 'SUCCESS' });
        }, function (err: any) {
            res.send('Error: ' + err);
        });
});

router.post('/getHistory', function (req: Request, res: Response) {
    const deviceId = req.body.deviceId || _testDeviceId;
    smokesModel.getPreviousSessions(deviceId)
        .then(function (data: any) {
            res.json(data);
        }, function (err: any) {
            res.send('Error: ' + err);
        });
});

router.post('/getSessions', function (req: Request, res: Response) {
    const deviceId = req.body.deviceId || _testDeviceId;
    let options: any = {};
    let sessions: any[] = [];

    Promise.all([
        smokesModel.getSmokerOptions(deviceId)
            .then(function (data: any) { options = data; }),
        smokesModel.getExistingSessions(deviceId)
            .then(function (data: any[]) {
                if (!R.any(R.propEq(0, 'probeId') as any, data)) {
                    const smokerSession = {
                        probeId: 0,
                        start: 0,
                        end: 0,
                        target: 225,
                        name: 'Smoker'
                    };
                    data.unshift(smokerSession);

                    const tokens = [
                        deviceId,
                        smokerSession.start,
                        smokerSession.end,
                        smokerSession.name,
                        smokerSession.target,
                        'Char-Griller AKORN',
                        '',
                        smokerSession.probeId
                    ];
                    smokesModel.createSession(tokens).then(function () {}, function (err: any) {
                        console.log('error creating default smoker session: ' + err);
                    });
                }
                sessions = data;
            })
    ]).then(function () {
        res.json({ sessions: sessions, options: options });
    }, function (err: any) {
        res.send('Error: ' + err);
    });
});

router.post('/getSmokerSession', function (req: Request, res: Response) {
    const deviceId = req.body.deviceId || _testDeviceId;
    const sessionId = req.body.sessionId || 0;

    smokesModel.getSession(deviceId, sessionId)
        .then(function (data: any[]) {
            res.send(JSON.stringify({ session: R.head(data || []) }));
        }, function (err: any) {
            res.send('Error: ' + err);
        });
});

router.post('/getHistoryEntryEvents', function (req: Request, res: Response) {
    const deviceId = req.body.deviceId || _testDeviceId;
    const sessionId = parseInt(req.body.sessionId || 0);

    if (!sessionId) {
        res.status(400).send('Missing sessionId');
        return;
    }

    smokesModel.getSession(deviceId, sessionId)
        .then(function (sessions: any[]) {
            const session = R.head(sessions || []);
            if (!session) {
                res.status(404).send('Session not found');
                return;
            }

            const fromTime = session.start / 1000;
            const toTime = session.end / 1000;

            return smokesModel.getEventsByTimeRange(deviceId, fromTime, toTime)
                .then(function (data: any[]) {
                    const response: any = {
                        probeDetail: _probeArray.map(function () { return { history: { data: [] }, current: {} }; })
                    };
                    const probes = response.probeDetail;

                    data.forEach(function (event: any) {
                        probes[0].history.data.push({ timestamp: event.timestamp, temp: event.probe0, target: event.probe0Target });
                        probes[1].history.data.push({ timestamp: event.timestamp, temp: event.probe1 });
                        probes[2].history.data.push({ timestamp: event.timestamp, temp: event.probe2 });
                        probes[3].history.data.push({ timestamp: event.timestamp, temp: event.probe3 });
                    });

                    res.json(response);
                });
        })
        .catch(function (err: any) {
            res.status(500).send('Error: ' + err);
        });
});

router.post('/getSmokerSessionEvents', function (req: Request, res: Response) {
    const deviceId = req.body.deviceId || _testDeviceId;
    const recordLimit = parseInt(req.body.limit || 100);
    const gran = parseInt(req.body.gran || 3600);

    const now = (new Date().getTime() / 1000);
    const fromTime = (now - (now % gran)) - (100 * gran);
    const toTime = now;
    const response: any = {
        probeDetail: _probeArray.map(function () { return { history: { data: [], gran: gran }, current: {} }; })
    };

    const tokens = [deviceId, fromTime, toTime, gran, req.body.limit || 100];

    smokesModel.getEvents(tokens).then(function (data: any[]) {
        const timeMap = data.reduce(function (arr: any, hist: any) {
            arr[hist.timestamp] = hist;
            return arr;
        }, {});
        const probes = response.probeDetail;

        for (let i = 0; i < recordLimit; i++) {
            const exp = fromTime + (i * gran);
            const hist = timeMap[exp];
            if (!hist) {
                probes[0].history.data.push({ timestamp: exp, temp: 0, target: 0 });
                probes[1].history.data.push({ timestamp: exp, temp: 0, target: 0 });
                probes[2].history.data.push({ timestamp: exp, temp: 0, target: 0 });
                probes[3].history.data.push({ timestamp: exp, temp: 0, target: 0 });
            } else {
                probes[0].history.data.push({ timestamp: hist.timestamp, temp: hist.probe0, target: hist.probe0Target });
                probes[1].history.data.push({ timestamp: hist.timestamp, temp: hist.probe1, target: hist.probe1Target });
                probes[2].history.data.push({ timestamp: hist.timestamp, temp: hist.probe2, target: hist.probe2Target });
                probes[3].history.data.push({ timestamp: hist.timestamp, temp: hist.probe3, target: hist.probe3Target });
            }
        }
    }).then(function () {
        res.send(JSON.stringify(response));
    }, function (err: any) {
        res.send('Error: ' + err);
    });
});

router.post('/getSmokerStatus', function (req: Request, res: Response) {
    const deviceId = req.body.deviceId || _testDeviceId;
    const recordLimit = parseInt(req.body.limit || 100);
    const gran = parseInt(req.body.gran || 3600);

    const now = (new Date().getTime() / 1000);
    const fromTime = (now - (now % gran)) - (100 * gran);
    const toTime = now;
    const response: any = {
        probeDetail: _probeArray.map(function () { return { history: { data: [], gran: gran } }; })
    };

    const tokens = [deviceId, fromTime, toTime, gran, req.body.limit || 100];

    Promise.all([
        smokesModel.getSmokerOptions(deviceId)
            .then(function (data: any) { response.options = data; }),
        smokesModel.getEvents(tokens).then(function (data: any[]) {
            const timeMap = data.reduce(function (arr: any, hist: any) {
                arr[hist.timestamp] = hist;
                return arr;
            }, {});
            const probes = response.probeDetail;

            for (let i = 0; i < recordLimit; i++) {
                const exp = fromTime + (i * gran);
                const hist = timeMap[exp];
                if (!hist) {
                    probes[0].history.data.push({ timestamp: exp, temp: 0, target: 0 });
                    probes[1].history.data.push({ timestamp: exp, temp: 0, target: 0 });
                    probes[2].history.data.push({ timestamp: exp, temp: 0, target: 0 });
                    probes[3].history.data.push({ timestamp: exp, temp: 0, target: 0 });
                } else {
                    probes[0].history.data.push({ timestamp: hist.timestamp, temp: hist.probe0, target: hist.probe0Target });
                    probes[1].history.data.push({ timestamp: hist.timestamp, temp: hist.probe1, target: hist.probe1Target });
                    probes[2].history.data.push({ timestamp: hist.timestamp, temp: hist.probe2, target: hist.probe2Target });
                    probes[3].history.data.push({ timestamp: hist.timestamp, temp: hist.probe3, target: hist.probe3Target });
                }
            }
        }),
        smokesModel.getExistingSessions(deviceId).then(function (data: any[]) {
            if (!R.any(R.propEq(0, 'probeId') as any, data)) {
                const smokerSession = {
                    probeId: 0,
                    start: 0,
                    end: 0,
                    target: 225,
                    name: 'Smoker'
                };
                data.unshift(smokerSession);

                const tokens2 = [
                    deviceId,
                    smokerSession.start,
                    smokerSession.end,
                    smokerSession.name,
                    smokerSession.target,
                    'Char-Griller AKORN',
                    '',
                    smokerSession.probeId
                ];
                smokesModel.createSession(tokens2).then(function () {}, function (err: any) {
                    console.log('error creating default smoker session: ' + err);
                });
            }
            response.sessions = data;
        }),
        smokesModel.getEvent(deviceId).then(function (data: any) {
            _probeArray.forEach(function (probeId) {
                const strProbeId = 'probe' + probeId;
                response.probeDetail[probeId].current = data && {
                    timestamp: data.timestamp,
                    temp: data[strProbeId],
                    target: data[strProbeId + 'Target'],
                    fanstate: data.fanstate
                } || {};
            });
        })
    ]).then(function () {
        res.send(JSON.stringify(response));
    }, function (err: any) {
        res.send('Error: ' + err);
    });
});

export default router;
