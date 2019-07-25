var express = require('express');
var router = express.Router();

//Require controller modules
var book_controller = require('../controllers/book');
var author_controller = require('../controllers/author');
var genre_controller = require('../controllers/genre');
var bookinstance_controller = require('../controllers/bookinstance');

///BOOK ROUTES///

router.get('/', book_controller.index);

//GET request for creating a Book. Note This must come before routes that displaay Book (uses id)
router.get('/book/create', book_controller.bookCreateGet);

router.post('/book/create', book_controller.bookCreatePost);

router.get('/book/:id/delete', book_controller.bookDeleteGet);

router.post('/book/:id/delete', book_controller.bookDeletePost);

router.get('/book/:id/update', book_controller.bookUpdateGet);

router.post('/book/:id/update', book_controller.bookUpdatePost);

router.get('/book/:id', book_controller.bookDetail);

router.get('/books', book_controller.bookList);

///AUTHOR ROUTES///

router.get('/author/create', author_controller.authorCreateGet);

router.post('/author/create', author_controller.authorCreatePost);

router.get('/author/:id/delete', author_controller.authorDeleteGet);

router.post('/author/:id/delete', author_controller.authorDeletePost);

router.get('/author/:id/update', author_controller.authorUpdateGet);

router.post('/author/:id/update', author_controller.authorUpdatePost);

router.get('/author/:id', author_controller.authorDetail);

router.get('/authors', author_controller.authorList);

///GENRE ROUTES///

router.get('/genre/create', genre_controller.genreCreateGet);

router.post('/genre/create', genre_controller.genreCreatePost);

router.get('/genre/:id/delete', genre_controller.genreDeleteGet);

router.post('/genre/:id/delete', genre_controller.genreDeletePost);

router.get('/genre/:id/update', genre_controller.genreUpdateGet);

router.post('/genre/:id/update', genre_controller.genreUpdatePost);

router.get('/genre/:id', genre_controller.genreDetail);

router.get('/genres', genre_controller.genreList);

///BOOKINSTANCE ROUTES///

router.get('/bookinstance/create', bookinstance_controller.bookinstanceCreateGet);

router.post('/bookinstance/create', bookinstance_controller.bookinstanceCreatePost);

router.get('/bookinstance/:id/delete', bookinstance_controller.bookinstanceDeleteGet);

router.post('/bookinstance/:id/delete', bookinstance_controller.bookinstanceDeletePost);

router.get('/bookinstance/:id/update', bookinstance_controller.bookinstanceUpdateGet);

router.post('/bookinstance/:id/update', bookinstance_controller.bookinstanceUpdatePost);

router.get('/bookinstance/:id', bookinstance_controller.bookinstanceDetail);

router.get('/bookinstances', bookinstance_controller.bookinstanceList);

module.exports = router;