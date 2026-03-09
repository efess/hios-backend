import { Router } from 'express';
import undercabinet from './undercabinet';
import smokes from './smokes';
import environment from './environment';
import weather from './weather';

const router = Router();

router.use('/undercabinet', undercabinet);
router.use('/smokes', smokes);
router.use('/environment', environment);
router.use('/weather', weather);

export default router;
