'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const {wrap: async} = require('co');
const Tweet = mongoose.model('Tweet');
const assign = Object.assign;
const R = require('ramda');
const Rx = require('rxjs');
const users = require('../data/paralament-list.json');
const https = require('https');
const request = require('request');


/**
 * Load
 */


exports.getCouncillor = function (req, res) {
    const id = req.params.id;
    request({
            headers: {'content-type': 'application/json'},
            url: 'http://ws-old.parlament.ch/councillors/'+id,
            method: 'GET'
        }, function (error, response) {
            if (!error && response.statusCode == 200) {
                var obj = JSON.parse(response.body);
                res.json({
                    data: obj,
                });
            }
            else {
                console.log(error);
            }
        }
    );

}

exports.getFaction = function (req, res) {
    const id = req.params.id;
    request({
            headers: {'content-type': 'application/json'},
            url: 'http://ws-old.parlament.ch/factions/'+id,
            method: 'GET'
        }, function (error, response) {
            if (!error && response.statusCode == 200) {
                var obj = JSON.parse(response.body);
                res.json({
                    data: obj,
                });
            }
            else {
                console.log(error);
            }
        }
    );

}