import db from '../db';
import * as R from 'ramda';

export default {
    addEvent: function (tokens: any[]): Promise<any> {
        return db.query(
            'INSERT INTO env_events (deviceId, timestamp, temperature, humidity, pressure, motion) VALUES (?, ?, ?, ?, ?, ?)',
            tokens
        );
    },
    getEvents: function (tokens: any[]): Promise<any> {
        return db.query('CALL proc_env_history (?, ?, ?, ?, ?)', tokens)
            .then(R.head);
    },
    getEvent: function (deviceId: string): Promise<any> {
        const timeout = (new Date().getTime() / 1000) - 60;
        return db.query(
            'SELECT * FROM env_events WHERE deviceId = ? AND timestamp > ? ORDER BY timestamp DESC LIMIT 1',
            [deviceId, timeout]
        ).then(R.head);
    }
};
