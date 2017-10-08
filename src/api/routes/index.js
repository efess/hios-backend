var express = require('express'),
    router = express.Router();

router.use('/undercabinet', require('./undercabinet'));
router.use('/smokes', require('./smokes'));
router.use('/environment', require('./environment'));
router.use('/weather', require('./weather'));

module.exports = router