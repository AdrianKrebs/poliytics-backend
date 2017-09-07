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


require('./app/models/tweet');
require('./app/models/user');
require('./app/models/mention');

const uristring =
    process.env.MONGODB_URI || process.env.MONGOLAB_URI ||
    'mongodb://localhost/test';


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
require('./config/routes')(app);
app.set('port', process.env.PORT || 5000);
// set views path, template engine and default layout
app.set('views', './app/views');
app.set('view engine', 'jade');


// Start server
app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});


module.exports = app;


