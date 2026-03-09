import smokesModel from '../../model/smokes';
import { checkDevice } from './device';

const events = [{
    topic: '/home/outside/smoker/stoker/state',
    onEvent: function (data: Buffer): void {
        const deviceId = '11e6f399-dcb7-4651-a585-34e2059163e5';
        console.log(data);

        const smokerUpdate = JSON.parse(data.toString());
        checkDevice(deviceId, 'smokes')
            .then(function () {
                return smokesModel.getSmokesDevice(deviceId).then(function (smokesDevice: any) {
                    if (!smokesDevice) {
                        return smokesModel.newSmokesDevice([deviceId, 0, 0]);
                    } else {
                        return Promise.resolve(smokesDevice);
                    }
                });
            }).then(function () {
                const tokens = [
                    deviceId,
                    new Date().getTime() / 1000,
                    isNaN(smokerUpdate.probe0) ? null : smokerUpdate.probe0,
                    isNaN(smokerUpdate.probe1) ? null : smokerUpdate.probe1,
                    isNaN(smokerUpdate.probe2) ? null : smokerUpdate.probe2,
                    isNaN(smokerUpdate.probe3) ? null : smokerUpdate.probe3,
                    smokerUpdate.fanState
                ];
                smokesModel.addEvent(tokens)
                    .then(function () {}, function (err: any) {
                        console.log('ERROR ' + err);
                    });
            }, function (err: any) {
                console.log('ERROR ' + err);
            });
    }
}];

export { events };
