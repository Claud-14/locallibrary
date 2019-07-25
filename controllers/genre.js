var Genre = require('../models/genre');
var Book = require('../models/book');

var async = require('async');
var mongoose = require('mongoose');
const {body, validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter');

exports.genreList = function(req, res)
{
    //res.send('NOT IMPLEMENTED: Genre list');

    Genre.find()
    .sort([['name', 'ascending']])
    .exec(function (err, list_genres)
    {
        if (err) return next(err);

        res.render('genre_list.jade', {title: 'Genre List', genre_list: list_genres});
    });
};

//Display detail page for a specific Genre
exports.genreDetail = function(req, res, next)
{
    //res.send('NOT IMPLEMENTED: Genre detail: ' + req.params.id);
    var id = mongoose.Types.ObjectId(req.params.id);

    async.parallel(
    {
        genre: function(callback)
        {
            Genre.findById(id)
            .exec(callback);
        },

        genre_books: function(callback)
        {
            Book.find({'genre': id})
            .exec(callback);
        },
    }, function(err, results)
    {
        if (err) {console.log(err); return next(err);}
        if (results.genre == null) //No results
        {
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        //Successful, so render
        res.render('genre_detail', {title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books});
    });
}

exports.genreCreateGet = function(req, res, next)
{
    //res.send('NOT IMPLEMENTED: Genre create GET');

    res.render('genre_form', {title: 'Create Genre'});
};

exports.genreCreatePost = //function(req, res, next) = {res.send('NOT IMPLEMENTED: Genre create POST');}
[
    //Validate that the name field is not empty
    body('name', 'Genre name required').isLength({min: 1}).trim(),

    //Sanitize (escape) the name field
    sanitizeBody('name').escape(),

    //Process request after validation and sanitization
    (req, res, next) =>
    {
        //Extract the validation errors from a request
        const errors = validationResult(req);

        //Create a genre object with escaped and trimmed data
        var genre = new Genre(
            {name: req.body.name}
        );

        if (!errors.isEmpty())
        {
            //There are errors. Render the form again with sanitized values/error messages
            res.render('genre_form', {title: 'Create Genre', genre: genre, errors: errors.array()});
            return;
        }
        else
        {
            //Data from form is valid
            //Check if Genre with same name already exists
            Genre.findOne({'name': req.body.name})
            .exec(function(err, found_genre)
            {
                if (err) return next(err);

                if (found_genre)
                {
                    //Genre exists, redirect to its detail page.
                    res.redirect(found_genre.url);
                }
                else
                {
                    genre.save(function(err)
                    {
                        if (err) return next(err);
                        //Genre saved. Redirect to genre detail page
                        res.redirect(genre.url);
                    });
                }
            });
        }
    }
];

exports.genreDeleteGet = function(req, res, next)
{
    //res.send('NOT IMPLEMENTED: Genre delete GET');
    var id = mongoose.Types.ObjectId(req.params.id);

    async.parallel(
    {
        genre: function(callback)
        {
            Genre.findById(id).exec(callback);
        },
        genre_books: function(callback)
        {
            Book.find({'genre': id}).exec(callback);
        }
    }, function(err, results)
    {
        if (err) return next(err);
        if (results.genre == null)
        {
            //No results
            res.redirect('/catalog/genres/');
        }
        //Successful, so render
        res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books});
    });
    
};

exports.genreDeletePost = function(req, res)
{
    //res.send('NOT IMPLEMENTED: Genre delete POST');
    var id = mongoose.Types.ObjectId(req.body.genreid)

    async.parallel({
        genre: function(callback)
        {
            Genre.findById(id).exec(callback);
        },
        genre_books: function(callback)
        {
            Book.find({'genre': id}).exec(callback);
        }
    }, function(err, results)
    {
        if (err) return next(err);
        //Success
        if (results.genre_books.length > 0)
        {
            //Genre has books. Render is same way as for GET route
            res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books});
        }
        else
        {
            //Genre has no books. Delete object and redirect to the list of genres
            Genre.findByIdAndRemove(id, function deleteGenre(err)
            {
                if (err) return next(err);
                //Success - go to genre list
                res.redirect('/catalog/genres/');
            });
        }
    });
};

exports.genreUpdateGet = function(req, res, next)
{
    //res.send('NOT IMPLEMENTED: Genre update GET');
    var id = mongoose.Types.ObjectId(req.params.id);

    //Get genre for form
    Genre.findById(id).exec(function(err, genre)
    {
        if (err) return next(err);
        if (genre == null)
        {
            //No results
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        //Success
        res.render('genre_form', {title: 'Update Genre', genre: genre});
    });
};

exports.genreUpdatePost = //function(req, res){res.send('NOT IMPLEMENTED: Genre update POST');
[
    //Validate fields
    body('name', 'Genre name required').isLength({min: 1}).trim(),

    //Sanitize fields
    sanitizeBody('name').escape(),

    //Proces request after validation and sanitization
    (req, res, next) =>
    {
        var id = mongoose.Types.ObjectId(req.params.id);
        //Extract the validation errors from a request
        const errors = validationResult(req);

        //Create an Genre object with escaped/trimmed date and old id
        var genre = new Genre({
            name: req.body.name,
            _id: id
        });

        if (!errors.isEmpty())
        {
            //There are errors. Render form again with sanitized values
            res.render('genre_form', {title: 'Update Genre', genre: genre, errors: errors.arrays()});
            return;
        }
        else
        {
            //Data from form is valid. Update the record
            Genre.findByIdAndUpdate(id, genre, {}, function(err, thegenre)
            {
                if (err) return next(err);
                //Successful - redirect to author detail page
                res.redirect(thegenre.url);
            });
        }
    }
];