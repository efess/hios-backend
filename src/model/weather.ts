import db from '../db';
import * as R from 'ramda';

export default {
    getLocations: function (): Promise<any> {
        return db.query('SELECT * FROM weather_location')
            .then(R.head);
    },
    setForecast: function (locationId: any, timestamp: number, startDate: number, days: number, json: string): Promise<any> {
        return db.query('DELETE FROM weather_forecast WHERE locationId = ?', [locationId])
            .then(function () {
                return db.query(
                    'INSERT INTO weather_forecast (locationId, timestamp, startDate, days, json) VALUES (?, ?, ?, ?, ?)',
                    [locationId, timestamp, startDate, days, json]
                );
            });
    },
    setNow: function (locationId: any, timestamp: number, json: string): Promise<any> {
        return db.query('DELETE FROM weather_now WHERE locationId = ?', [locationId])
            .then(function () {
                return db.query(
                    'INSERT INTO weather_now (locationId, timestamp, json) VALUES (?, ?, ?)',
                    [locationId, timestamp, json]
                );
            });
    },
    setHourly: function (locationId: any, timestamp: number, date: number, json: string): Promise<any> {
        return db.query('DELETE FROM weather_hourly WHERE locationId = ?', [locationId])
            .then(function () {
                return db.query(
                    'INSERT INTO weather_hourly (locationId, timestamp, date, json) VALUES (?, ?, ?, ?)',
                    [locationId, timestamp, date, json]
                );
            });
    },
    setAstronomy: function (locationId: any, timestamp: number, json: string): Promise<any> {
        return db.query('DELETE FROM weather_astronomy WHERE locationId = ?', [locationId])
            .then(function () {
                return db.query(
                    'INSERT INTO weather_astronomy (locationId, timestamp, json) VALUES (?, ?, ?)',
                    [locationId, timestamp, json]
                );
            });
    },
    getNow: function (locationId: any): Promise<any> {
        return db.query('SELECT * FROM weather_now WHERE locationId = ?', [locationId])
            .then(R.head);
    },
    getForecast: function (locationId: any): Promise<any> {
        return db.query('SELECT * FROM weather_forecast WHERE locationId = ?', [locationId])
            .then(R.head);
    },
    getHourly: function (locationId: any): Promise<any> {
        return db.query('SELECT * FROM weather_hourly WHERE locationId = ?', [locationId])
            .then(R.head);
    },
    getAstronomy: function (locationId: any): Promise<any> {
        return db.query('SELECT * FROM weather_astronomy WHERE locationId = ?', [locationId])
            .then(R.head);
    }
};
