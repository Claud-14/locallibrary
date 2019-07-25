var genre_controller = require('../controllers/genre');
const { router } = require("./catalog");
///GENRE ROUTES///
router.get('/genre/create', genre_controller.genreCreateGet);
router.post('/genre/create', genre_controller.genreCreatePost);
router.get('/genre/:id/delete', genre_controller.genreDeleteGet);
router.post('/genre/:id/delete', genre_controller.genreDeletePost);
router.get('/genre/:id/update', genre_controller.genrerUpdateGet);
router.post('/genre/:id/update', genre_controller.genreUpdatePost);
router.get('/genre/:id', genre_controller.genreDetail);
router.get('/genre', genre_controller.genreList);
