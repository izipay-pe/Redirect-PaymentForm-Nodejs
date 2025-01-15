var express = require('express');
var router = express.Router();

const checkoutController = require("../controllers/paidController");

router.get('/', checkoutController.home);
router.post('/checkout', checkoutController.formulario);
router.post('/result', checkoutController.paidResult);
router.post('/ipn', checkoutController.ipn);

module.exports = router;
