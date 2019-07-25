var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');

var async = require('async');
var mongoose = require('mongoose');

const {body, validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter');

exports.index = function(req, res)
{
    //res.send('NOT IMPLEMENTED: Site Home Page');

    async.parallel({
        book_count: function(callback)
        {
            Book.countDocuments({}, callback); //Pass an empty object as match condition to find all documents of this collection
        },
        book_instance_count: function(callback)
        {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count: function(callback)
        {
            BookInstance.countDocuments({}, callback);
        },
        author_count: function(callback)
        {
            Author.countDocuments({}, callback);
        },
        genre_count: function(callback)
        {
            Genre.countDocuments({}, callback);
        }
    }, function(err,results)
    {
        res.render('index', { title: 'Local Library Home', error: err, data: results})
    });
};

exports.bookList = function(req, res)
{
    //res.send('NOT IMPLEMENTED: Book list');

    Book.find({}, 'title author')
    .populate('author', 'family_name first_name', Author)
    .exec(function (err, list_books)
    {
        if (err) {return next(err);}
        //Successful, so render
        res.render('book_list', {title: 'Book List', book_list: list_books});
    })
};

//Display detail page for a specific book
exports.bookDetail = function(req, res, next)
{
    //res.send('NOT IMPLEMENTED: Book detail: ' + req.params.id);
    var id = mongoose.Types.ObjectId(req.params.id);

    async.parallel(
    {
        book: function(callback)
        {
            Book.findById(id)
            .populate('author', 'family_name first_name', Author) //If I only type 'author' it doesn't work
            .populate('genre')
            .exec(callback);
        },
        book_instance: function(callback)
        {
            BookInstance.find({'book': id})
            .exec(callback);
        },
    }, function(err, results)
    {
        if (err) return next(err);
        if (results.book == null)
        {
            var err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        //Successful, so render
        res.render('book_detail', {title: 'Book Detail', book: results.book, book_instances: results.book_instance});
    });
};

exports.bookCreateGet = function(req, res, next)//function(req, res){res.send('NOT IMPLEMENTED: Book create GET');
{
    //Get all authors and genres. which we can use for addint to our book
    async.parallel(
    {
        authors: function(callback)
        {
            Author.find(callback);
        },
        genres: function(callback)
        {
            Genre.find(callback);
        }
    }, function(err, results)
    {
        if (err) return next(err);
        res.render('book_form', {title: 'Create Book', authors: results.authors, genres: results.genres});
    });
};

exports.bookCreatePost = //function(req, res) {res.send('NOT IMPLEMENTED: Book create POST');
[
    //Convert the genre to an array
    (req, res, next) =>
    {
        if (!(req.body.genre instanceof Array))
        {
            if (typeof req.body.genre === 'undefined')
                req.body.genre = [];
            else
                req.body.genre = new Array(req.body.genre);
        }
        next();
    },
    /* *Hope this works* From what I understand I don't have to do an array conversion to author since I want it to be undefined if the field is left empty.
    The book model requires an array of authors but I don't know if that array can be empty*/
    (req, res, next) =>
    {
        if (!(req.body.author instanceof Array))
        {
            if (typeof req.body.author === 'undefined')
                req.body.author = [];
            else
                req.body.author = new Array(req.body.author);
        }
        next();
    },

    //Validate fields
    body('title', 'Title must not be empty.').isLength({min:1}).trim(),//.isAlphanumeric().withMessage("Oh God please no!"),
    //body('author', 'Author must not be empty.').isLength({min:1}).trim(), for author I need whatever genre uses
    body('summary', 'Summary must not be empty.').isLength({min:1}).trim(),
    body('isbn', 'ISBN must not be empty.').isLength({min:1}).trim(),

    //Sanitize fields (using wildcard)
    //sanitizeBody('*').escape(), this erases my arrays for some reason (now I know it does when it is first)
    //sanitizeBody('title').escape(),
    //sanitizeBody('summary').escape(),
    //sanitizeBody('isbn').escape(),
    sanitizeBody('genre.*').escape(),
    sanitizeBody('author.*').escape(),
    sanitizeBody('*').escape(),

    //Process request after validation and sanitization
    (req, res, next) =>
    {
        //Extract the validation errros from a request
        let errrs = validationResult(req).array();

        if (!req.body.author || req.body.author.length === 0)
            errrs.push({msg: "No authors were selected", param: "author", value: req.body.author});

        const errors = JSON.parse(JSON.stringify(errrs));

        //Create a Book object with escaped and trimmed data
        var book = new Book(
        {
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre,
        });
        
        if (!errors || errors.length !== 0)
        {
            //There are errors. Render form again with sanitized values/error messages
            console.log(errors);
            
            //Get all authors and genres for form
            async.parallel(
            {
                authors: function(callback)
                {
                    Author.find(callback);
                },
                genres: function(callback)
                {
                    Genre.find(callback);
                }
            }, function(err, results)
            {
                if (err) return next(err);

                //Mark our selected genres as checked
                for (let i = 0; i < results.genres.length; i++)
                {
                    if (book.genre.indexOf(results.genres[i]._id) > -1)
                    {
                        results.genres[i].checked = 'true';
                    }
                }
                //Mark our selected authors as selected
                for (let i = 0; i < results.authors.length; i++)
                {
                    if (book.author.indexOf(results.authors[i]._id) > -1)
                    {
                        results.authors[i].checked = 'true';
                    }
                }
                res.render('book_form', {title: 'Create Book', authors: results.authors, genres: results.genres, book: book, errors: errors});
            });
            return;
        }
        else
        {
            //Data from form is valid. Save book
            book.save(function(err)
            {
                if (err) return next(err);
                //successful - redirect to new book record
                res.redirect(book.url);
            });
        }
    }
];

exports.bookDeleteGet = function(req, res, next)
{
    //res.send('NOT IMPLEMENTED: Book delete GET');
    var id = mongoose.Types.ObjectId(req.params.id);

    async.parallel(
        {
            book: function(callback)
            {
                Book.findById(id)
                .populate('author', 'family_name first_name', Author)
                .exec(callback);
            },
            book_copies: function(callback)
            {
                BookInstance.find({'book': id}).exec(callback);
            }
        }, function(err, results)
        {
            if (err) return next(err);
            if (results.book == null)
            {
                //No results
                res.redirect('/catalog/books/');
            }
            //Successful, so render
            res.render('book_delete', {title: 'Delete Book', book: results.book, book_copies: results. book_copies});
        });
};

exports.bookDeletePost = function(req, res, next)
{
    //res.send('NOT IMPLEMENTED: Book delete POST');
    var id = mongoose.Types.ObjectId(req.body.bookid);

    async.parallel(
        {
            book: function(callback)
            {
                Book.findById(id)
                .populate('author', 'family_name first_name', Author)
                .exec(callback);
            },
            book_copies: function(callback)
            {
                BookInstance.find({'book': id}).exec(callback);
            }
        }, function(err, results)
        {
            if (err) return next(err);
            //Success
            if (results.book_copies.length > 0)
            {
                //Book has copies. Render in same way as for GET route
                res.render('book_delete', {title: 'Delete Book', book: results.book, book_copies: results.book_copies});
            }
            else
            {
                //Book has no copies. Delete object and redirect to the list of books
                Book.findByIdAndRemove(id, function deleteBook(err)
                {
                    if (err) return next(err);
                    //Succes - go to book list
                    res.redirect('/catalog/books/');
                });
            }
        });
};

exports.bookUpdateGet = function(req, res, next)
{
    //res.send('NOT IMPLEMENTED: Book update GET');
    var id = mongoose.Types.ObjectId(req.params.id);

    //Get book, authors and genres for form
    async.parallel({
        book: function(callback)
        {
            Book.findById(id).populate('author', 'first_name family_name', Author).populate('genre').exec(callback);
        },
        authors: function(callback)
        {
            Author.find(callback);
        },
        genres: function(callback)
        {
            Genre.find(callback);
        },
    }, function(err, results)
    {
        if (err) return next(err);
        if (results.book == null)
        {
            //No results
            var err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        //Success
        //Mark our selected authors as checked
        for (var all_a_iter = 0; all_a_iter < results.authors.length; all_a_iter++)
            for (var book_a_iter = 0; book_a_iter < results.book.author.length; book_a_iter++)
                if (results.authors[all_a_iter]._id.toString() == results.book.author[book_a_iter]._id.toString())
                    results.authors[all_a_iter].checked = true;
        
        //Mark our selected genres as checked
        for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++)
            for (var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++)
                if (results.genres[all_g_iter]._id.toString() == results.book.genre[book_g_iter]._id.toString())
                    results.genres[all_g_iter].checked = 'true';
        
        res.render('book_form', {title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book});
    });
};

exports.bookUpdatePost = 
[
    //res.send('NOT IMPLEMENTED: Book update POST');

    //Convert the genre to an array
    (req, res, next) =>
    {
        if (!(req.body.genre instanceof Array))
        {
            if (typeof req.body.genre === 'undefined')
                req.body.genre = [];
            else
                req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    //Convert the author to an array
    (req, res, next) =>
    {
        if (!(req.body.author instanceof Array))
        {
            if (typeof req.body.author === 'undefined')
                req.body.author = [];
            else
                req.body.author = new Array(req.body.author);
        }
        next();
    },

    //Validate fields
    body('title', 'Title must not be empty.').isLength({min: 1}).trim(),
    body('summary', 'Summary must not be empty.').isLength({min: 1}).trim(),
    body('isbn', 'ISBN must not be empty').isLength({min: 1}).trim(),

    //Sanitize fields
    sanitizeBody('title').escape(),
    sanitizeBody('author.*').escape(),
    sanitizeBody('summary').escape(),
    sanitizeBody('isbn').escape(),
    sanitizeBody('genre.*').escape(),

    //Process request after validation and sanitization
    (req, res, next) =>
    {
        //Extract the validation erros from a request
        const errors = validationResult(req);

        //Create a Book object with escaped/trimmed data and old id
        var book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: (typeof req.body.genre === 'undefined') ? [] : req.body.genre,
            _id: req.params.id //This is required, or a new ID will be assigned!
        });

        if (book.author.length === 0)
        {
            //console.log(errors.errors);
            var i = 0;
            for (let err of errors.errors)
                i++;
            errors.errors[i] = {msg: "No authors were selected", param: "author", value: req.body.author};
        }

        if (!errors.isEmpty())
        {
            //There are errors. Render form again with sanitized values/error messages

            //Get all authors and genres for form
            async.parallel
            ({
                authors: function(callback)
                {
                    Author.find(callback);
                },
                genres: function(callback)
                {
                    Genre.find(callback);
                },
            }, function(err, results)
            {
                if (err) return next(err);

                //Mark our selected authors as checked
                for (let i = 0; i < results.authors.length; i++)
                {
                    if (book.author.indexOf(results.authors[i]._id) > -1)
                        results.authors[i].checked = 'true';
                }
                //Mark our selected genres as checked
                for (let i = 0; i < results.genres.length; i++)
                {
                    if (book.genre.indexOf(results.genres[i]._id) > -1)
                        results.genres[i].checked = 'true';
                }
                res.render('book_form', {title: 'Update Book', authors: results.authors, genres: results.genres, book: book, errors: errors.array()});
            });
            return;
        }
        else
        {
            //Data from form is valid. Update the record
            Book.findByIdAndUpdate(mongoose.Types.ObjectId(req.params.id), book, {}, function(err, thebook)
            {
                if (err) return next(err);
                //Successful - redirect to book detail page
                res.redirect(thebook.url);
            });
        }
    }
];