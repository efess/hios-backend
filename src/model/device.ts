import db from '../db';

const device = {
    getDevice: function (deviceId: string): Promise<any[]> {
        return db.query('SELECT * FROM device WHERE id = ?', [deviceId]);
    },
    addDevice: function (tokens: any[]): Promise<any> {
        return db.query(
            'INSERT INTO device (id, type, firstSeen, lastConnect) VALUES (?, ?, ?, ?)',
            tokens
        );
    },
    updateDevice: function (tokens: any[]): Promise<any> {
        return db.query('UPDATE device SET lastConnect = ? WHERE id = ?', tokens);
    }
};

export default device;
