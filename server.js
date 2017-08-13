'use strict';

/*
 * nodejs-express-mongoose
 * Copyright(c) 2015 Madhusudhan Srinivasa <madhums8@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies
 */

require('dotenv').config();

const fs = require('fs');
const join = require('path').join;
const express = require('express');
const mongoose = require('mongoose');




const models = join(__dirname, 'app/models');
const uristring =
    process.env.MONGODB_URI || process.env.MONGOLAB_URI ||
    'mongodb://localhost/test';

// Bootstrap models
fs.readdirSync(models)
    .filter(file => ~file.indexOf('.js'))
    .forEach(file => require(join(models, file)));


console.log('mongodb started on : ' + uristring);
//  var options = { server: { socketOptions: { keepAlive: 1 } } };
mongoose.connect(uristring, function (err, res) {
    if (err) {
        console.log('ERROR connecting to: ' + uristring + '. ' + err);
    } else {
        console.log('Succeeded connected to: ' + uristring);
    }
});

const app = express();
app.set('port', process.env.PORT || 5000);
/**
 * Expose
 */
const home = require('./app/controllers/home');
const tweets = require('./app/controllers/tweets');

app.get('/', home.index);


// tweet routes
app.param('id', tweets.load);
app.get('/tweets', tweets.index);  //GET http://localhost:3000/tweets
app.get('/tweets/user', tweets.loadByUser); // GET http://localhost:3000/tweets/user?id=168234077
app.post('/tweets', tweets.create);
//app.get('/tweets/new', tweets.new);
//app.get('/tweets/:id', tweets.show);
app.get('/tweets/:id/edit', tweets.edit);



/**
 * Error handling
 */

app.use(function (err, req, res, next) {
    // treat as 404
    if (err.message
        && (~err.message.indexOf('not found')
        || (~err.message.indexOf('Cast to ObjectId failed')))) {
        return next();
    }
    console.error(err.stack);
    // error page
    res.status(500).render('500', { error: err.stack });
});

// assume 404 since no middleware responded
app.use(function (req, res, next) {
    res.status(404).render('404', {
        url: req.originalUrl,
        error: 'Not found'
    });
});

// Start server
app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});


module.exports = app;


