const express = require('express');
const router  = express.Router();

router.use('/', require('./routes/core'));
router.use('/', require('./routes/pip'));
router.use('/', require('./routes/divorce'));
router.use('/', require('./routes/fr'));
router.use('/', require('./routes/timeline'));
router.use('/', require('./routes/questions'));
router.use('/', require('./routes/directions'));
router.use('/', require('./routes/linked-cases'));
router.use('/', require('./routes/reassign-case'));
router.use('/', require('./routes/reserve-case'));
router.use('/', require('./routes/refer-case'));

router.get('/', function (req, res) {
	req.session.destroy();
	res.render('index');
});

module.exports = router;
