var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');

var async = require('async');
var mongoose = require('mongoose');

var {body, validationResult} = require('express-validator/check');
var {sanitizeBody} = require('express-validator/filter');

exports.bookinstanceList = function(req, res)
{
    //res.send('NOT IMPLEMENTED: BookInstance list');

    BookInstance.find()
    .populate('book')
    .exec(function (err, list_bookinstances)
    {
        if (err) {return next(err);}
        //Successful, so render
        res.render('bookinstance_list', {title: 'Book Instance List', bookinstance_list: list_bookinstances});
    });
};

//Display detail page for a specific BookInstance
exports.bookinstanceDetail = function(req, res, next)
{
    //res.send('NOT IMPLEMENTED: BookInstance detail: ' + req.params.id);
    var id = mongoose.Types.ObjectId(req.params.id);

    BookInstance.findById(id)
    .populate('book')
    .exec(function (err, bookinstance)
    {
        if (err) return next(err);
        if (bookinstance == null)
        {
            var err = new Error('Book Copy not found');
            err.status = 404;
            return next(err);
        }
        //Successful, so render
        res.render('bookinstance_detail', {title: 'Book Copy Detail', bookinstance: bookinstance});
    });
};

exports.bookinstanceCreateGet = function(req, res, next)
{
    //res.send('NOT IMPLEMENTED: BookInstance create GET');
    Book.find({}, 'title')
    .exec(function(err, books)
    {
        if (err) return next(err);
        //Successful, so render
        res.render('bookinstance_form.jade', {title: 'Create Book Instance', book_list: books});
    });
};

exports.bookinstanceCreatePost = //function(req, res) {res.send('NOT IMPLEMENTED: BookInstance create POST');
[
    //Validate fields
    body('book', 'Book must be specified').isLength({min: 1}).trim(),
    body('imprint', 'Imprint must be specified').isLength({min: 1}).trim(),
    body('due_back', 'Invalid date').optional({checkFalsy: true}).isISO8601(),

    //Sanitize fields
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),

    //Process request after validation and sanitization
    (req, res, next) =>
    {
        //Extract the validation errors from a request
        const errors = validationResult(req);

        //Crete a BookInstance object with escaped and trimmed data
        var bookinstance = new BookInstance(
            {
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back
            }
        );

        if (!errors.isEmpty())
        {
            //There are errors. Render form again with sanitized values and error messages
            Book.find({}, 'title')
            .exec(function(err, books)
            {
                if (err) return next(err);
                //Successful, so render
                res.render('bookinstance_form', {title: 'Create Book Instance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance});
            });
            return;
        }
        else
        {
            //Data from form is valid
            bookinstance.save(function(err)
            {
                if (err) return next(err);
                //Successful - redirect to new record
                res.redirect(bookinstance.url);
            });
        }
    }
];

exports.bookinstanceDeleteGet = function(req, res, next)
{
    //res.send('NOT IMPLEMENTED: BookInstance delete GET');
    var id = mongoose.Types.ObjectId(req.params.id);

    //Get book instance
    BookInstance.findById(id).exec(function(err, bookinstance)
    {
        if (err) return next(err);
        if (bookinstance == null)
        {
            //No results
            res.redirect('/catalog/bookinstances');
        }
        //Success, so render
        res.render('bookinstance_delete', {title: 'Delete Book Copy', bookinstance: bookinstance});
    });
};

exports.bookinstanceDeletePost = function(req, res, next)
{
    //res.send('NOT IMPLEMENTED: BookInstance delete POST');
    var id = mongoose.Types.ObjectId(req.body.copyid);

    BookInstance.findById(id).exec(function(err, bookinstance)
    {
        if (err) return next(err);
        //Success
        BookInstance.findByIdAndRemove(id, function deleteBookInstance(err)
        {
            if (err) return next(err);
            //Success - go to author list
            res.redirect('/catalog/bookinstances');
        });
    });
};

exports.bookinstanceUpdateGet = function(req, res, next)
{
    //res.send('NOT IMPLEMENTED: BookInstance update GET');
    var id = mongoose.Types.ObjectId(req.params.id);

    //Get book instance for form
    async.parallel({
        bookinstance: function(callback)
        {
            BookInstance.findById(id).exec(callback);
        },
        book_list: function(callback)
        {
            Book.find().exec(callback);
        }
    }, function(err, results)
    {
        if (err) return next(err);
        if (results.bookinstance == null)
        {
            //No results
            var err = new Error('Book instance not found');
            err.status = 404;
            return next(err);
        }
        //Success
        res.render('bookinstance_form', {title: 'Update Book Copy', bookinstance: results.bookinstance, book_list: results.book_list});
    });
};

exports.bookinstanceUpdatePost = //function(req, res){res.send('NOT IMPLEMENTED: BookInstance update POST');
[
    //Validate fields
    body('book', 'Book must be specified').isLength({min: 1}).trim(),
    body('imprint', 'Imprint must be specified').isLength({min: 1}).trim(),
    body('due_back', 'Invalid date').optional({checkFalsy: true}).isISO8601(),

    //Sanitize fields
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),

    //Process request after validation and sanitization
    (req, res, next) =>
    {
        var id = mongoose.Types.ObjectId(req.params.id);
        //Extract the validation errors from a request
        const errors = validationResult(req);

        //Create an Author object with escaped/trimmed date and old id
        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: id
        });

        if (!errors.isEmpty())
        {
            Book.find({}, 'title').exec( function(err, books)
            {
                //There are errors. Render form again with sanitized values/errors messages
                res.render('bookinstance_form', {title: 'Update Book Copy', bookinstance: bookinstance, book_list: books, errors: errors.array()});
            });
        }
        else
        {
            //Data from form is valid. Update the record
            BookInstance.findByIdAndUpdate(id, bookinstance, {}, function(err,thecopy)
            {
                if (err) return next(err);
                //Successful - redirect to book instance detail page
                res.redirect(thecopy.url);
            });
        }
    }
];