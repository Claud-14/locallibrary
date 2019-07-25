var express = require('express');
var router = express.Router();

router.get('/', function(req,res)
{
    res.send('<h2>Wiki home page</h2>');
});

router.get('/about', function(req, res)
{
    res.send('<h3>About this wiki</h3><h6>It was created by me! DIO!</h6>');
});

module.exports = router;