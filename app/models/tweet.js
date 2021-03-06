'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

/**
 * Article Schema
 */

const TweetSchema = new Schema({
    tweet: {
        text: {type: String, default: '', trim: true},
        sentiment: {score: {type: Number}, label: {type: String}},
        hashtags: {type: [String]}
    },
    user: {id: {type: String}, name: {type: String}, party: {type: String}},
    createdAt: {type: Date, default: Date.now}
});

/**
 * Validations
 */

TweetSchema.path('tweet.text').required(true, 'Tweet text cannot be blank');


/**
 * Methods
 */

TweetSchema.methods = {

    /**
     * Save tweet
     */

    uploadAndSave: function (image) {
        const err = this.validateSync();
        if (err && err.toString()) throw new Error(err.toString());
        return this.save();

    },

    /**
     * Add sentiment ranking
     *
     * @param {User} user
     * @param {Object} comment
     * @api private
     */

    addSentiment: function (user, comment) {
        this.comments.push({
            body: comment.body,
            user: user._id
        });

        return this.save();
    }
};

/**
 * Statics
 */

TweetSchema.statics = {

    /**
     * Find article by id
     *
     * @param {ObjectId} id
     * @api private
     */

    load: function (_id) {
        return this.findOne({_id})
        // .populate('user', 'name email username')
        // .populate('comments.user')
            .exec();
    },

    loadByUser: function (userId) {
        return this.find({'user.id': userId})
        // .populate('user', 'name email username')
        // .populate('comments.user')
            .exec();
    },

    loadByName: function (name) {
        return this.find({'user.name': name})
        // .populate('user', 'name email username')
        // .populate('comments.user')
            .exec();
    },

    loadByParty: function (partyName) {
        return this.find({'user.party': partyName})
        // .populate('user', 'name email username')
        // .populate('comments.user')
            .exec();
    },

    loadByPartyWeekly: function (partyName) {
        var start = new Date((new Date().getTime() - (7 * 24 * 60 * 60 * 1000)));
        return this.find({'user.party': partyName, 'createdAt': {$gte: start}});
    },

    loadTweetsToday: function () {
        var start = new Date();
        start.setHours(0, 0, 0, 0);

        var end = new Date();
        end.setHours(23, 59, 59, 999);
        return this.count({createdAt: {$gte: start, $lt: end}});
    },

    loadTweetsTodayByParty: function (party) {
        var start = new Date();
        start.setHours(0, 0, 0, 0);

        var end = new Date();
        end.setHours(23, 59, 59, 999);
        return this.count({createdAt: {$gte: start, $lt: end}, 'user.party': party});
    },

    loadTweetsTodayByUser: function (id) {
        var start = new Date();
        start.setHours(0, 0, 0, 0);

        var end = new Date();
        end.setHours(23, 59, 59, 999);
        return this.count({createdAt: {$gte: start, $lt: end}, 'user.id': id});
    },

    loadMostActiveUsers: function (limit) {
        var start = new Date((new Date().getTime() - (7 * 24 * 60 * 60 * 1000)));
        return this.aggregate([
            {
                $match: {
                    'createdAt': {$gte: start}
                }
            },
            {$group: {_id: "$user.id", count: {$sum: 1}}},
            {$sort: {'count': -1}},
            {$limit: limit}
        ]);
    },

    loadUsersToday: function () {
        var start = new Date();
        start.setHours(0, 0, 0, 0);

        var end = new Date();
        end.setHours(23, 59, 59, 999);
        return this.distinct("user.id", {createdAt: {$gte: start, $lt: end}});

    },
    loadUsersTodayByParty: function (party) {
        var start = new Date();
        start.setHours(0, 0, 0, 0);

        var end = new Date();
        end.setHours(23, 59, 59, 999);
        return this.distinct("user.id", {createdAt: {$gte: start, $lt: end},'user.party': party});

    },

    loadSentimentByParty: function (partyName) {
        return this.find({'user.party': partyName}).select({ 'user.party': 1, 'tweet.sentiment.score': 1, 'tweet.sentiment.label':1});
    },

    loadTrendingHashtags: function () {
        var start = new Date();
        start.setHours(0, 0, 0, 0);

        var end = new Date();
        end.setHours(23, 59, 59, 999);
        return this.find({createdAt: {$gte: start, $lt: end}}).select({'tweet.hashtags': 1, '_id': 0});
    },

    loadTrendingHashtagsByParty: function (party) {
        var start = new Date();
        start.setHours(0, 0, 0, 0);

        var end = new Date();
        end.setHours(23, 59, 59, 999);
        return this.find({createdAt: {$gte: start, $lt: end}, 'user.party':party}).select({'tweet.hashtags': 1, '_id': 0});
    },

    loadTrendingHashtagsByUser: function (id) {
        var start = new Date();
        start.setHours(0, 0, 0, 0);

        var end = new Date();
        end.setHours(23, 59, 59, 999);
        return this.find({createdAt: {$gte: start, $lt: end}, 'user.id': id}).select({'tweet.hashtags': 1, '_id': 0});
    },

    loadTrendingHashtagsWeekly: function () {
        var start = new Date((new Date().getTime() - (7 * 24 * 60 * 60 * 1000)));
        return this.find({'createdAt': {$gte: start}}).select({'tweet.hashtags': 1, '_id': 0});
    },

    findSentimentByQuery: function (query) {
        return this.find(query).select({
            'user.id': 1,
            'tweet.sentiment.label': 1,
            'tweet.sentiment.score': 1,
            createdAt: 1
        });
    },

    getQueryById: function (id) {
        return { 'user.id': id };
    },

    getQueryByParty: function (party) {
        return { 'user.party': party };
    },

    /**
     * List articles
     *
     * @param {Object} options
     * @api private
     */

    list: function (options) {
        const criteria = options.criteria || {};
        const page = options.page || 0;
        const limit = options.limit || 30;
        return this.find(criteria)
        // .populate('user', 'name username') // todo replace with twitter user
            .sort({createdAt: -1})
            .limit(limit)
            .skip(limit * page)
            .exec();
    }
};

mongoose.model('Tweet', TweetSchema);
