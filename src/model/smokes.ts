import db from '../db';
import * as R from 'ramda';

const smokes = {
    addEvent: function (tokens: any[]): Promise<any> {
        return db.query(
            'INSERT INTO smokes_events (deviceId, timestamp, probe0, probe1, probe2, probe3, fanState) VALUES (?, ?, ?, ?, ?, ?, ?)',
            tokens
        );
    },
    newSmokesDevice: function (tokens: any[]): Promise<any> {
        return db.query('INSERT INTO smokes (deviceId, grillTarget, meatTarget) VALUES (?,?,?)', tokens);
    },
    getSmokesDevice: function (deviceId: string): Promise<any> {
        return db.query('SELECT * FROM smokes WHERE deviceId = ?', [deviceId]).then(R.head);
    },
    getEvents: function (tokens: any[]): Promise<any> {
        return db.query('CALL temps (?, ?, ?, ?, ?)', tokens).then(R.head);
    },
    getEvent: function (deviceId: string): Promise<any> {
        const timeout = (new Date().getTime() / 1000) - 60;
        return db.query(
            'SELECT * FROM smokes_events WHERE deviceId = ? AND timestamp > ? ORDER BY timestamp DESC LIMIT 1',
            [deviceId, timeout]
        ).then(R.head);
    },
    setSmokerOptions: function (tokens: any[]): Promise<any> {
        return db.query(
            'UPDATE smokes SET smokerTarget = ?, fanPulse = ? WHERE deviceId = ?',
            tokens
        ).then(R.head);
    },
    getSmokerOptions: function (deviceId?: string): Promise<any> {
        return db.query('SELECT * FROM smokes WHERE deviceId = ?', [deviceId]).then(R.head);
    },
    getExistingSessions: function (deviceId: string): Promise<any[]> {
        return db.query(
            'SELECT * FROM smokes_session WHERE end <= 0 AND deviceId = ? ORDER BY start',
            [deviceId]
        );
    },
    getPreviousSessions: function (deviceId: string): Promise<any[]> {
        return db.query(
            'SELECT * FROM smokes_session WHERE end > 0 AND deviceId = ? ORDER BY end',
            [deviceId]
        );
    },
    getSession: function (deviceId: string, tableId: number): Promise<any[]> {
        return db.query(
            'SELECT * FROM smokes_session WHERE end > 0 AND deviceId = ? AND tableId = ? ORDER BY end',
            [deviceId, tableId]
        );
    },
    createSession: function (tokens: any[]): Promise<any> {
        return db.query(
            'INSERT INTO smokes_session (deviceId, start, end, name, target, smokerType, description, probeId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            tokens
        );
    },
    updateSession: function (tokens: any[]): Promise<any> {
        return db.query(
            'UPDATE smokes_session SET end = ?, meat = ?, smokerType = ?, description = ? WHERE tableId = ? (?, ?, ?, ?, ?)',
            tokens
        );
    },
    closeSession: function (tokens: any[]): Promise<any> {
        return db.query('UPDATE smokes_session SET end = ?, description = ? WHERE tableId = ?', tokens);
    },
    updateProbeTarget: function (deviceId: string, probeId: number, target: number): Promise<any> {
        return db.query(
            'UPDATE smokes_session SET target = ? WHERE deviceId = ? AND probeId = ?',
            [target, deviceId, probeId]
        );
    },
    getEventsByTimeRange: function (deviceId: string, fromTime: number, toTime: number): Promise<any[]> {
        return db.query(
            'SELECT * FROM smokes_events WHERE deviceId = ? AND timestamp >= ? AND timestamp <= ? ORDER BY timestamp',
            [deviceId, fromTime, toTime]
        );
    }
};

export default smokes;
