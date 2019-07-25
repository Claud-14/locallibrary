var express = require("express");
var router = express.Router();
var mongoose = require('mongoose');
var Schema = mongoose.Schema; //Define schema

var mongoDB = 'mongodb://127.0.0.1/test2'; //Set up default mongoose connection
mongoose.connect(mongoDB, { useNewUrlParser: true });
var db = mongoose.connection; //Get the default connection
//Bind connection to error event (to get notification in the console of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var SomeModelSchema = new Schema(
    {
        a_string: String, //enum match maxlength minlength
        a_date: { type: Date, default: Date.now() },
        a_number: { type: Number, min: -99, required: true } //min max
    }
);

//Compile model from schema
var SomeModel = mongoose.model('SomeModel', SomeModelSchema);

router.get('/', function(req,res)
{
    res.render('jadeTest');
});

router.get('/get', function(req, res, next)
{
    SomeModel.find(function(err, objs)
    {
        if (err) return handleError(err);
        res.send(`<h1 style='font-family: "Trebuchet MS";'>Hi c:</h1><p> ${objs} </p>`);
    });
});

//GET the object provided in the URL, the RegExp matches any word after the get/
//' /get/([A-Za-z0-9_]*) '
router.get('/get/:name', function(req, res, next)
{
    let obj_name = req.params.name;//req.url.slice(5);
    SomeModel.findOne({ 'a_string': obj_name }, 'a_string a_date a_number', function(err, obj)
    {
        if (err) return handleError(err);
        res.set('Content-Type', 'text/html');
        res.send(`<h3>Name: ${obj_name}</h3> <ul><li>Date: ${obj.a_date}</li><li>Number: ${obj.a_number}</li></ul>`);
    });
});

//GET (but actually post) a new object into the database
router.get('/post/:name', function(req, res, next)
{
    let obj_name = req.params.name;//req.url.slice(5);
    let instance = new SomeModel({ a_string: obj_name, a_number: Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER)) });
    console.log(JSON.stringify(instance));
    instance.save(function (err)
    {
        if (err) return handleError(err);
        console.log("error: " + err);
    });
    res.redirect(`/dbtest/get/${instance.a_string}`);
});

module.exports = router;