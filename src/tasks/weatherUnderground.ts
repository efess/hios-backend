import * as https from 'https';
import weatherDb from '../model/weather';
import * as R from 'ramda';
import { WeatherUndergroundConfig } from '../config';

const apiHost = 'api.wunderground.com';

function getRequest(path: string): Promise<any> {
    return new Promise(function (resolve, reject) {
        const url = 'https://' + apiHost + '/' + path;
        const req = https.get(url, function (response) {
            let body = '';
            response.on('data', function (chunk) {
                body += chunk;
            });
            response.on('end', function () {
                try {
                    const json = JSON.parse(body);
                    resolve(json);
                } catch (e) {
                    reject(e);
                }
            });
            response.on('error', function (e) {
                reject(e);
            });
        });

        req.on('error', function (e) {
            reject(e);
        });
    });
}

function needsAstronomyUpdate(config: WeatherUndergroundConfig, location: any): Promise<boolean> {
    return weatherDb.getAstronomy(location.tableId)
        .then(function (data: any) {
            if (!data) {
                return true;
            }
            const currentRecord = new Date();
            currentRecord.setTime(data.timestamp * 1000);
            currentRecord.setHours(0, 0, 0, 0);

            const now = new Date();
            now.setHours(0, 0, 0, 0);
            return now.getTime() !== currentRecord.getTime();
        }, function () {
            console.log('Error retrieving astronomy');
            return false;
        });
}

function updateLocation(config: WeatherUndergroundConfig, location: any): Promise<any> {
    return needsAstronomyUpdate(config, location).then(function (getAstro: boolean) {
        return Promise.all([
            getRequest(['api', config.apiKey, 'conditions/q', location.api_url].join('/')),
            getRequest(['api', config.apiKey, 'forecast10day/q', location.api_url].join('/')),
            getRequest(['api', config.apiKey, 'hourly/q', location.api_url].join('/')),
            getAstro ? getRequest(['api', config.apiKey, 'astronomy/q', location.api_url].join('/')) : Promise.resolve(null)
        ]).then(function (data: any[]) {
            const now = (new Date().getTime() / 1000);
            return Promise.all([
                weatherDb.setNow(location.tableId, now, JSON.stringify(data[0].current_observation)),
                weatherDb.setForecast(location.tableId, now, now, 10, JSON.stringify(data[1].forecast)),
                weatherDb.setHourly(location.tableId, now, now, JSON.stringify(data[2].hourly_forecast)),
                data[3] ? weatherDb.setAstronomy(location.tableId, now, JSON.stringify(data[3])) : Promise.resolve()
            ]);
        }, function (err: any) {
            console.log('Error updating weather location: ' + err);
        });
    });
}

function updateLocations(config: WeatherUndergroundConfig, locations: any): Promise<any> {
    if (locations && locations.tableId) {
        locations = [locations];
    }
    if (!locations || !locations.length) {
        return Promise.resolve();
    }
    return updateLocation(config, R.head(locations))
        .then(updateLocations.bind(null, config, R.tail(locations)));
}

function update(config: WeatherUndergroundConfig): Promise<any> {
    return weatherDb.getLocations()
        .then(function (locations: any) {
            return updateLocations(config, locations);
        });
}

export default { update: update };
