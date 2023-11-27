const { Sequelize, User, Workday } = require('../sequelize')
const Op = Sequelize.Op;
const Fn = Sequelize.fn;
const { getAllUserChildren } = require('../utils');
const moment = require('moment')

const Self = {

    get_user_where_cause: async function (user, isIncludeMe) {
        const { id, role } = user;
        let where_cause = {};
        let buffer_values = [];
        if (user.role === 'gpv' || user.role === 'staff') {
            where_cause['userId'] = id;
        }
        else if (role !== 'admin' && role !== 'subadmin') {
            let user_list = await getAllUserChildren(id, []);
            if (user_list.length > 0) {
                if (isIncludeMe) {
                    user_list.push(id);
                }
                where_cause['userId'] = { [Op.or]: user_list }
            } else {
                where_cause['userId'] = id;
            }
        }
        return where_cause;
    },

    get_duration: function (startMoment, endMoment) {
        if (startMoment && endMoment) {
            let startTime = moment(startMoment);
            let endTime = moment(endMoment);
            var duration = moment.duration(endTime.diff(startTime));
            let f = moment.utc(duration.asMilliseconds()).format("HH:mm:ss");
            return f;
        }
        return null;
    },

    setEndLastDateWorkday: async function (userId, logdate) {
        const data = await Workday.findOne({
            where: {
                userId,
                date: { [Op.lt]: logdate }
            },
            order: [[Sequelize.literal('date DESC, indexNum DESC')]],
        })
        if (data && data.endStatus === "NO") {
            const update_data = await Workday.update({
                endStatus: "YES",
                endMoment: data.endableMoment
            }, { where: { id: data.id } })
            return update_data;
        }
        return false;
    },

    get_duration_format(milliseconds) {
        let b = Math.abs(milliseconds);
        var s = Math.floor((b / 1000) % 60);
        var m = Math.floor((b / 1000 / 60) % 60);
        var h = Math.floor((b / (1000 * 60 * 60)) % 24);
        let f = moment({h, m, s}).format("HH:mm:ss");
        return f;
    },

    get_duration: function (startMoment, endMoment) {
        if (startMoment && endMoment) {
            let startTime = moment(startMoment);
            let endTime = moment(endMoment);
            var duration = moment.duration(endTime.diff(startTime));
            let f = this.get_duration_format(duration.asMilliseconds());
            return f;
        }
        return null;
    },

    getSecFromDuration(duration) {
        if (duration) {
            let hours, mins, secs;
            [hours, mins, secs] = duration.split(":").slice(-3).map(n => parseInt(n, 10));
            return hours * 3600 + mins * 60 + secs;
        }
        return 0;
    },

    getCurrentStatusOfUserDate: function (dataList) {
        let hours_worked = 0;
        let hours_paused = 0;
        let numberOfPauses = 0;
        let startedAt = "";
        let endedAt = "";
        let lastStatus = "WORK";
        if (dataList.length > 0) {
            dataList.sort(function (a, b) {
                var keyA = a.indexNum,
                    keyB = b.indexNum;
                // Compare the 2 dates
                if (keyA < keyB) return 1;
                if (keyA > keyB) return -1;
                return 0;
            });
            startedAt = dataList[dataList.length - 1].startMoment;
            endedAt = dataList[0].endMoment;
            lastStatus = dataList[0].logType;
            for (const item of dataList) {
                let duration = this.get_duration(item.startMoment, item.endMoment);
                if (duration !== null) {
                    if (item.logType === "WORK") {
                        hours_worked += this.getSecFromDuration(duration);
                    } else if (item.logType === "PAUSE") {
                        hours_paused += this.getSecFromDuration(duration);
                        numberOfPauses++;
                    }
                }
            }
        }
        return {
            hours_worked,
            hours_paused,
            numberOfPauses,
            startedAt,
            endedAt,
            lastStatus,
        }
    },

}

module.exports = Self