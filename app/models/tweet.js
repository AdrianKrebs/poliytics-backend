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
    tweet: {text: {type: String, default: '', trim: true}, sentiment: {score: {type: Number}, label: {type: String}}},
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
