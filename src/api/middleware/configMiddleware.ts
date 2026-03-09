import { Request, Response, NextFunction } from 'express';
import { Config } from '../../config';

declare global {
    namespace Express {
        interface Request {
            config: Config;
        }
    }
}

export default (config: Config) => (req: Request, res: Response, next: NextFunction): void => {
    req.config = config;
    next();
};
