var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');
const validator = require('express-validator');
var async = require('async');


// Display list of all BookInstances
exports.bookinstance_list = function(req, res, next) {

    BookInstance.find()
    .populate('book')
    .exec(function (err, list_bookinstances) {
        if (err) { return next(err); }
        // Successful, so render
        res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {

    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) { return next(err); }
      if (bookinstance==null) { // No results.
          var err = new Error('Book copy not found');
          err.status = 404;
          return next(err);
        }
      // Successful, so render.
      res.render('bookinstance_detail', { title: 'Copy: '+bookinstance.book.title, bookinstance: bookinstance});
    })

};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {

    Book.find({},'title')
    .exec(function (err, books) {
      if (err) { return next(err); }
      // Successful, so render.
      res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books});
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

    // Validate fields.
    validator.body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
    validator.body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
    validator.body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    
    // Sanitize fields.
    validator.sanitizeBody('book').escape(),
    validator.sanitizeBody('imprint').escape(),
    validator.sanitizeBody('status').trim().escape(),
    validator.sanitizeBody('due_back').toDate(),
    
    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validator.validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
          { book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({},'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id , errors: errors.array(), bookinstance: bookinstance });
            });
            return;
        }
        else {
            // Data from form is valid.
            bookinstance.save(function (err) {
                if (err) { return next(err); }
                   // Successful - redirect to new record.
                   res.redirect(bookinstance.url);
                });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {

    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function(err, bookinstance) {
        if (err) { return next(err); }
        // Successful, so render
        res.render('bookinstance_delete', { title: 'Delete Book Instance', bookinstance: bookinstance });
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {

    BookInstance.findByIdAndRemove(req.body.bookinstanceid)
    .exec(function(err, removed) {
        if (err) { return next(err); };
        // Successful, redirect to list of book instances
        res.redirect('/catalog/bookinstances');

    });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res, next) {

    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).exec(callback);
        },
        book_instance: function(callback) {
            BookInstance.findById(req.params.id).populate('book').exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.book_instance==null) { // No results.
            var err = new Error('Book instance not found');
            err.status = 404;
            return next(err);
        }
        // Success.
        res.render('bookinstance_form', { title: 'Update Book Instance', book: results.book_instance.book, bookinstance: results.book_instance });
    });

};

// Handle BookInstance update on POST.
exports.bookinstance_update_post = [

    // Validate fields.
    validator.body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
    validator.body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
    validator.body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    
    // Sanitize fields.
    validator.sanitizeBody('book').escape(),
    validator.sanitizeBody('imprint').escape(),
    validator.sanitizeBody('status').trim().escape(),
    validator.sanitizeBody('due_back').toDate(),
    
    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validator.validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
          { book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({},'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('bookinstance_form', { title: 'Create BookInstance', book: bookinstance.book, selected_book: bookinstance.book._id , errors: errors.array(), bookinstance: bookinstance });
            });
            return;
        }
        else {
            // Data from form is valid. Update bookinstance record.
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, function (err, theinstance) {
                if (err) { return next(err); }
                   // Successful - redirect to new record.
                   res.redirect(theinstance.url);
                });
        }
    }
];


