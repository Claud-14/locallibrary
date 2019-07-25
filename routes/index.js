var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/'/*/ \/ / The white-space counts and the regexp will try to match it*/, function(req, res, next) {
  //res.render('index', { title: 'Express' });
  res.redirect('/catalog');
});

module.exports = router;