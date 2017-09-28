'use strict';

const mongoose = require('mongoose');
const moment = require('moment');

const MentionSchema = new mongoose.Schema({
    tweetId: { type: String },
    twitterUserId: { type: String },
    createdAt: { type: Date }
});

MentionSchema.path('tweetId').required(true, 'tweetId may not be null!');
MentionSchema.path('twitterUserId').required(true, 'twitterUserId may not be null!');
MentionSchema.path('createdAt').required(true, 'createdAt may not be null');

MentionSchema.methods = {
    uploadAndSave: function () {
        const error = this.validateSync();
        if (error && error.toString()) {
            throw new Error(error.toString());
        } else {
            return this.save();
        }
    }
};

MentionSchema.statics = {

    findByQuery: function (query) {
        return this.find(query).exec();
    },

    countByQuery: function (query) {
        return this.count(query);
    },

    getQueryById: function (id) {
        return { twitterUserId: id };
    },

    getQueryByIds: function (ids) {
        return { twitterUserId: { $in: ids } };
    },

    getQueryTodayById: function (id) {
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        return {
            twitterUserId: id,
            createdAt: { $gte: start, $lt: end }
        };
    },

    getMentionsCountLastWeek: function () {
        const start = moment(new Date()).add(-7, 'days').toDate();
        return this.aggregate([{
                $match: {
                    'createdAt': { $gte: start }
                }
            }, {
                $group: { _id: '$twitterUserId', count: { $sum: 1 } }
            }
        ]);
    },

};

mongoose.model('Mention', MentionSchema);