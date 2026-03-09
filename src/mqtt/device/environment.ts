import envModel from '../../model/environment';
import { checkDevice } from './device';

function onEnvironmentUpdate(data: Buffer, topic: string): void {
    const topicTokens = topic.split('/');
    const deviceId = topicTokens[1];

    const re = /\0/g;
    const str = data.toString().replace(re, '');
    const envData = JSON.parse(str);

    checkDevice(deviceId, 'environment')
        .then(function () {
            const tokens = [
                deviceId,
                new Date().getTime() / 1000,
                isNaN(envData.temp) ? null : envData.temp,
                isNaN(envData.humid) ? null : envData.humid,
                isNaN(envData.pres) ? null : envData.pres / 1000,
                isNaN(envData.motion) ? null : envData.motion
            ];

            envModel.addEvent(tokens)
                .then(function () {}, function (err: any) {
                    console.log('ERROR ' + err);
                });
        }, function (err: any) {
            console.log('ERROR ' + err);
        });
}

const events = [{
    topic: '/device/+/environment',
    topicRegex: /\/device\/.+\/environment/g,
    onEvent: onEnvironmentUpdate
}];

export { events };
