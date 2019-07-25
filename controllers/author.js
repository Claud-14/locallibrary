var Author = require('../models/author');
var Book = require('../models/book');

var async = require('async');
var mongoose = require('mongoose');

const {body, validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter');

//Display list of all Authors
exports.authorList = function(req, res)
{
    //res.send('NOT IMPLEMENTED: Author list');

    Author.find()
    .sort([['family_name', 'ascending']])
    .exec(function (err, list_authors)
    {
        if (err) {return next(err);}
        //Successful, so render
        res.render('author_list', {title: 'Author List', author_list: list_authors});
    });
};

//Display detail page for a specific Author
exports.authorDetail = function(req, res, next)
{
    //res.send('NOT IMPLEMENTED: Author detail: ' + req.params.id);
    var id = mongoose.Types.ObjectId(req.params.id);

    async.parallel(
    {
        author: function(callback)
        {
            Author.findById(id)
            .exec(callback)
        },
        authors_books: function(callback)
        {
            Book.find({'author': id}, 'title summary')
            .exec(callback)
        }
    }, function(err, results)
    {
        if (err) return next(err)
        if (results.author == null)
        {
            var err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        //Succesful, so render
        res.render('author_detail', {title: 'Author Detail', author: results.author, author_books: results.authors_books});
    });
};

//Display Author create form on GET
exports.authorCreateGet = function(req, res, next)
{
    //res.send('NOT IMPLEMENTED: Author create GET');

    res.render('author_form', {title: 'Create Author'});
};

//Handle Author create on POST
exports.authorCreatePost = //function(req, res) {//res.send('NOT IMPLEMENTED: Author create POST');
[
    //Validate fields
    body('first_name').isLength({min: 1}).trim().withMessage('First name must be specified.')
    .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').isLength({min: 1}).trim().withMessage('Family name must be specified')
    .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_birth', 'Invalid date of birth').optional({checkFalsy: true}).isISO8601(),
    body('date_death', 'Invalid date of death').optional({checkFalsy: true}).isISO8601(),

    //Sanitize fields
    sanitizeBody('first_name').escape(),
    sanitizeBody('family_name').escape(),
    sanitizeBody('date_birth').toDate(),
    sanitizeBody('date_death').toDate(),

    //Process request after validation and sanitization
    (req, res, next) =>
    {
        //Extract the validation errors from a request
        const errors = validationResult(req);

        if (!errors.isEmpty())
        {
            //There are errors. Render form again with sanitized values/errors messages.
            res.render('author_form', {title: 'Create Author', author: req.body, errors: errors.array()});
            return;
        }
        else
        {
            //Data from form is valid
            //Create an Author object with escaped and trimmed data
            var author = new Author(
                {
                    first_name: req.body.first_name,
                    family_name: req.body.family_name,
                    date_birth: req.body.date_birth,
                    date_death: req.body.date_death
                }
            );
            author.save(function(err)
            {
                if (err) return next(err)
                //Sucessful - redirect to new author record
                res.redirect(author.url);
            });
        }
    }
];

//Display Author delete form on GET
exports.authorDeleteGet = function(req, res)
{
    //res.send('NOT IMPLEMENTED: Author delete GET')
    var id = mongoose.Types.ObjectId(req.params.id);

    async.parallel(
    {
        author: function(callback)
        {
            Author.findById(id).exec(callback);
        },
        author_books: function(callback)
        {
            Book.find({'author': id}).exec(callback);
        },
    },
    function(err, results)
    {
        if (err) return next(err);
        if (results.author == null)
        {
            //No results
            res.redirect('/catalog/authors/');
        }
        //Successful, so render
        res.render('author_delete', {title: 'Delete Author', author: results.author, author_books: results.author_books});
    });
};

//Handle Author delete on POST
exports.authorDeletePost = function(req, res)
{
    //res.send('NOT IMPLEMENTED: Author delete POST');
    var id = mongoose.Types.ObjectId(req.body.authorid);

    async.parallel(
    {
        author: function(callback)
        {
            Author.findById(id).exec(callback);
        },
        authors_books:function(callback)
        {
            Book.find({'author': id}).exec(callback);
        }
    }, function(err, results)
    {
        if (err) return next(err);
        //Success
        if (results.authors_books.length > 0)
        {
            //Author has books. Render in same wway as for GET route
            res.render('author_delete', {title: 'Delete Author', author: results.author, author_books: results.authors_books});
            return;
        }
        else
        {
            //Author has no books. Delete object and redirect to the list of authors
            Author.findByIdAndRemove(id, function deleteAuthor(err)
            {
                if (err) return next(err);
                //Success - go to author list
                res.redirect('/catalog/authors/');
            });
        }
    });
};

//Display Author update form on GET
exports.authorUpdateGet = function(req,res, next)
{
    //res.send('NOT IMPLEMENTED: Author update GET');
    var id = mongoose.Types.ObjectId(req.params.id);

    //Get author for form
    Author.findById(id).exec(function(err, author)
    {
        if (err) return next(err);
        if (author == null)
        {
            //No results
            var err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        //Success
        res.render('author_form', {title: 'Update Author', author: author});
    });
};

//Handle Author update on POST
exports.authorUpdatePost = //function(req, res){res.send('NOT IMPLEMENTED: Author update POST');
[
    //Validate fields
    body('family_name').isLength({min: 1}).trim().withMessage('Family name must be specified.')
    .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('first_name').isLength({min: 1}).trim().withMessage('First name must be specified')
    .isAlphanumeric().withMessage('First name has non_alphanumeric characters'),
    body('date_birth', 'Invalid date of birth').optional({checkFalsy: true}).isISO8601(),
    body('date_death', 'Invalid date of death').optional({checkFalsy: true}).isISO8601(),

    //Sanitize fields
    sanitizeBody('family_name').escape(),
    sanitizeBody('first_name').escape(),
    sanitizeBody('date_birth').toDate(),
    sanitizeBody('date_death').toDate(),

    //Process request after validation and sanitization
    (req, res, next) =>
    {
        var id = mongoose.Types.ObjectId(req.params.id);
        //Extract the validation errors from a request
        const errors = validationResult(req);

        //Create an Author object with escaped/trimmed date and old id
        var author = new Author({
            family_name: req.body.family_name,
            first_name: req.body.first_name,
            date_birth: req.body.date_birth,
            date_death: req.body.date_death,
            _id: id
        });

        if (!errors.isEmpty())
        {
            //There are errors. Render form again with sanitized values/error messages
            res.render('author_form', {title: 'Update Author', author: author, errors: errors.array()});
            return;
        }
        else
        {
            //Data from form is valid. Update the record
            Author.findByIdAndUpdate(id, author, {}, function(err, theauthor)
            {
                if (err) return next(err);
                //Successful - redirect to author detail page
                res.redirect(theauthor.url);
            });
        }
    }
];