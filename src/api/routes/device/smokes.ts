import { Router } from 'express';
import device from '../../../model/device';

const router = Router();

function checkDevice(deviceId: string): Promise<any> {
    if (!deviceId) {
        return Promise.reject('Bad device');
    }

    return device.getDevice(deviceId)
        .then(function (deviceObj: any[]) {
            if (!deviceObj || !deviceObj.length) {
                return device.addDevice([deviceId, 'smokes', new Date(), new Date()]);
            } else {
                return device.updateDevice([new Date(), deviceId]);
            }
        });
}

export default router;
