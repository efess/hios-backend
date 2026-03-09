import device from '../../model/device';

function checkDevice(deviceId: string, type: string): Promise<any> {
    if (!deviceId) {
        return Promise.reject('Bad device');
    }

    return device.getDevice(deviceId)
        .then(function (deviceObj: any[]) {
            if (!deviceObj || !deviceObj.length) {
                return device.addDevice([deviceId, type, new Date(), new Date()]);
            } else {
                return device.updateDevice([new Date(), deviceId]);
            }
        });
}

export { checkDevice };
