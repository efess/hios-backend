import express from 'express';
import cookieParser from 'cookie-parser';
import * as path from 'path';
import { Config } from '../config';
import configMiddleware from './middleware/configMiddleware';
import routes from './routes';

const app = express();

function startServer(config: Config) {
    app.use(express.static(path.join(__dirname, '../public')));

    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(cookieParser());

    const port = process.env.PORT || config.listenPort || 3000;
    app.use(express.static(config.publicDir));
    app.use(configMiddleware(config));
    app.use(routes);

    console.log('REST API is listening on port ' + port);
    return app.listen(port as number);
}

export default {
    start: startServer
};
