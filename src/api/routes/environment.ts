import { Router, Request, Response } from 'express';
import envModel from '../../model/environment';

const router = Router();

router.post('/status', function (req: Request, res: Response) {
    const deviceId = req.body.deviceId;
    const response: any = {};

    envModel.getEvent(deviceId)
        .then(function (data: any) {
            response.current = data;
        })
        .then(function () {
            res.send(JSON.stringify(response));
        }, function (err: any) {
            res.send('Error: ' + err);
        });
});

router.post('/current', function (req: Request, res: Response) {
    const deviceId = req.body.deviceId;
    const response: any = {};

    envModel.getEvent(deviceId)
        .then(function (data: any) {
            response.current = data;
        })
        .then(function () {
            res.send(JSON.stringify(response));
        }, function (err: any) {
            res.send('Error: ' + err);
        });
});

router.post('/history', function (req: Request, res: Response) {
    const deviceId = req.body.deviceId;
    const recordLimit = parseInt(req.body.limit || 100);
    const gran = parseInt(req.body.gran || 3600);
    const now = parseInt(req.body.time || (new Date().getTime() / 1000));

    const fromTime = (now - (now % gran)) - (recordLimit * gran);
    const toTime = now;
    const response: any = {};

    const tokens = [deviceId, fromTime, toTime, gran, recordLimit];

    envModel.getEvents(tokens).then(function (data: any[]) {
        response.history = [];

        const timedData = data.reduce((arr: any, row: any) => {
            arr[row.timestamp] = row;
            return arr;
        }, {});

        for (let i = 0; i < recordLimit; i++) {
            const exp = fromTime + (i * gran);
            const point = timedData[exp];
            if (point) {
                response.history.push(point);
            } else {
                response.history.push({ timestamp: exp, temperature: null, humidity: null, pressure: null, motion: null });
            }
        }
    }).then(function () {
        res.send(JSON.stringify(response));
    }, function (err: any) {
        res.send('Error: ' + err);
    });
});

export default router;
