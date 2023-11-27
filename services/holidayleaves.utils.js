const { Sequelize, User, Leave, Leavepublic, Staticpendingholidays, Holidaystaticdays } = require('../sequelize')
const util = require('util')
const Op = Sequelize.Op;
const Fn = Sequelize.fn;
const { costPerKM, holidaysPerYear, staticPublicHolidays, getAllUserChildren } = require('../utils');
const expensesUtils = require('./expenses.utils');
const moment = require('moment')

const Self = {

    get_user_where_cause: async function (user, isteam) {
        const { id, role } = user;
        let where_cause = {};
        let buffer_values = [];
        if (user.role === 'gpv' || (isteam && isteam === 'my')) {
            where_cause['userId'] = id;
        }
        else if (role !== 'admin' && role !== 'subadmin') {
            let user_list = await getAllUserChildren(id, []);
            if (user_list.length > 0) {
                where_cause['userId'] = { [Op.or]: user_list }
            } else {
                where_cause['userId'] = id;
            }
        }
        return where_cause;
    },

    get_user_where_cause_in_users: async function (user, isteam) {
        const { id, role } = user;
        let where_cause = {};
        let buffer_values = [];
        if (user.role === 'gpv' || (isteam && isteam === 'my')) {
            where_cause['userId'] = id;
        }
        else if (role !== 'admin' && role !== 'subadmin') {
            let user_list = await getAllUserChildren(id, []);
            if (user_list.length > 0) {
                user_list.push(id);
                where_cause['userId'] = { [Op.or]: user_list }
            } else {
                where_cause['userId'] = id;
            }
        }
        return where_cause;
    },

    workday_count: function (start, end) {
        var first = start.clone().endOf('week'); // end of first week
        var last = end.clone().startOf('week'); // start of last week
        var days = last.diff(first, 'days') * 5 / 7; // this will always multiply of 7
        var wfirst = first.day() - start.day(); // check first week
        if (start.day() == 0) --wfirst; // -1 if start with sunday 
        var wlast = end.day() - last.day(); // check last week
        if (end.day() == 6) --wlast; // -1 if end with saturday
        return wfirst + Math.floor(days) + wlast; // get the total
    }, //              ^ EDIT: if days count less than 7 so no decimal point

    get_leavedays_requested: function (startDate, endDate, holidaypublics) {
        let date1 = new Date(startDate);
        let date2 = new Date(endDate);
        // To calculate the time difference of two dates
        let Difference_In_Time = date2.getTime() - date1.getTime();
        // To calculate the no. of days between two dates
        let days_count = Difference_In_Time / (1000 * 3600 * 24) + 1;
        let request_day = this.workday_count(moment(startDate), moment(endDate));

        let public_holiday_count = holidaypublics ? holidaypublics.length : 0;
        holidaypublics.map(holiday_item => {
            let day = moment(holiday_item.publicholiday).day();
            if (!(day >= 1 && day <= 5)) {
                public_holiday_count--;
            }
            return holiday_item;
        })
        let value = {
            days: days_count,
            weekend_count: days_count - request_day,
            public_holiday_count,
            request_day: request_day - public_holiday_count
        }
        return value;
    },

    get_leavedays_count_intheperiod: async function (start_date, end_date, userId) {
        let where_cause = {
            userId: userId,
            approvalStatus: "APPROVED",
            [Op.or]: [
                {
                    startDate: { [Op.gte]: start_date },
                    endDate: { [Op.lte]: end_date },
                },
                {
                    startDate: { [Op.lte]: start_date },
                    endDate: { [Op.gte]: start_date },
                },
                {
                    startDate: { [Op.lte]: end_date },
                    endDate: { [Op.gte]: end_date },
                },
            ]
        };
        let leaves = await Leave.findAll({
            where: where_cause,
            include: [
                { model: Leavepublic, order: [["publicholiday", "ASC"]] },
            ]
        });
        let duplicatedDaysCount = 0;
        for (const leave_item of leaves) {
            const { startDate, endDate, leavepublics } = leave_item;
            let start_loop = new Date(startDate);
            let end_loop = new Date(endDate);
            for (let d = start_loop; d <= end_loop; d.setDate(d.getDate() + 1)) {
                let cur_date = new Date(d).toISOString().slice(0, 10);
                let filtered_public_holiday = leavepublics.filter(l_public_holiday => l_public_holiday.publicholiday === cur_date);
                if (cur_date >= start_date && cur_date <= end_date && filtered_public_holiday.length === 0) {
                    duplicatedDaysCount++;
                }
            }
        }
        return duplicatedDaysCount;
    },

    // get_holidays_requested: async function (startDate, endDate, holidaypublics, userId) {
    get_holidays_requested: async function (holidayItem, isNaturals_paid_day_limits) {
        const { companyCode } = holidayItem.user.dataValues;
        let selected_is_natural = false;
        if (holidayItem['holidayType'] && holidayItem['holidayType'] !== 'VACATION' && holidayItem['paidType']) {
            if (companyCode && isNaturals_paid_day_limits[companyCode]) {
                selected_is_natural = isNaturals_paid_day_limits[companyCode][holidayItem['paidType']];
            } else {
                let firstKey = Object.keys(isNaturals_paid_day_limits)[0];
                selected_is_natural = isNaturals_paid_day_limits[firstKey][holidayItem['paidType']];
            }
        } else {
            selected_is_natural = false;
        }
        if (selected_is_natural) {
            let date1 = new Date(holidayItem.startDate);
            let date2 = new Date(holidayItem.endDate);
            // To calculate the time difference of two dates
            let Difference_In_Time = date2.getTime() - date1.getTime();
            // To calculate the no. of days between two dates
            let days_count = Difference_In_Time / (1000 * 3600 * 24) + 1;
            let request_day = this.workday_count(moment(holidayItem.startDate), moment(holidayItem.endDate));
            let public_holiday_count = holidayItem.holidaypublics ? holidayItem.holidaypublics.length : 0;
            holidayItem.holidaypublics.map(holiday_item => {
                let day = moment(holiday_item.publicholiday).day();
                if (!(day >= 1 && day <= 5)) {
                    public_holiday_count--;
                }
                return holiday_item;
            })
            let leavedays_count_in_the_period = 0;
            leavedays_count_in_the_period = await this.get_leavedays_count_intheperiod(holidayItem.startDate, holidayItem.endDate, holidayItem.userId);
            // request_day = request_day - public_holiday_count - leavedays_count_in_the_period > 0 ? request_day - public_holiday_count - leavedays_count_in_the_period : 0;
            let value = {
                days: days_count,
                weekend_count: days_count - request_day,
                public_holiday_count,
                leavedays_count_in_the_period,
                request_day: days_count
            }
            return value;
        } else {
            let date1 = new Date(holidayItem.startDate);
            let date2 = new Date(holidayItem.endDate);
            // To calculate the time difference of two dates
            let Difference_In_Time = date2.getTime() - date1.getTime();
            // To calculate the no. of days between two dates
            let days_count = Difference_In_Time / (1000 * 3600 * 24) + 1;
            let request_day = this.workday_count(moment(holidayItem.startDate), moment(holidayItem.endDate));

            let public_holiday_count = holidayItem.holidaypublics ? holidayItem.holidaypublics.length : 0;
            holidayItem.holidaypublics.map(holiday_item => {
                let day = moment(holiday_item.publicholiday).day();
                if (!(day >= 1 && day <= 5)) {
                    public_holiday_count--;
                }
                return holiday_item;
            })
            let leavedays_count_in_the_period = 0;
            leavedays_count_in_the_period = await this.get_leavedays_count_intheperiod(holidayItem.startDate, holidayItem.endDate, holidayItem.userId);
            request_day = request_day - public_holiday_count - leavedays_count_in_the_period > 0 ? request_day - public_holiday_count - leavedays_count_in_the_period : 0;
            let value = {
                days: days_count,
                weekend_count: days_count - request_day,
                public_holiday_count,
                leavedays_count_in_the_period,
                request_day
            }
            return value;
        }
    },

    get_diff_dates_between_twodates: function (start_date, end_date) {
        let date1 = new Date(start_date);
        let date2 = new Date(end_date);
        // To calculate the time difference of two dates
        let Difference_In_Time = date2.getTime() - date1.getTime();
        // To calculate the no. of days between two dates
        let days_count = Difference_In_Time / (1000 * 3600 * 24) + 1;
        return days_count;
    },

    get_diff_monthcounts_between_twodates: function (start_date, end_date) {
        let date1 = new Date(start_date);
        let date2 = new Date(end_date);
        let month1 = date1.getFullYear() * 12 + date1.getMonth();
        let month2 = date2.getFullYear() * 12 + date2.getMonth();
        return Math.abs(month1 - month2);
    },

    // ###--- last formular --### (cur_date - start_date) / 364
    // get_holiday_pending_of_year: async function (user_criteria, current_year) {
    //     const userData = await User.findAll({
    //         where: { ...user_criteria },
    //         include: [
    //             { model: Staticpendingholidays, }
    //         ]
    //     });
    //     let holiday_pending_per_this_year = {};
    //     let divider = 364;
    //     for (const user_item of userData) {
    //         let item = user_item.dataValues;
    //         let additional_pending_holidays = 0;
    //         let filtered_aphd = item.staticpendingholidays.filter(aphd_item => aphd_item.dataValues.appliedYear === current_year - 1);
    //         if (filtered_aphd.length > 0) {
    //             additional_pending_holidays = filtered_aphd[0].dataValues.pendingholidays;
    //         }
    //         if (!item.start_date) {
    //             holiday_pending_per_this_year[item.id] = 0;
    //         }
    //         else {
    //             let startDate = current_year + "-01-01";
    //             let endDate = current_year + "-12-31";
    //             let startYear = parseInt(startDate.split('-')[0]);
    //             let endYear = parseInt(endDate.split('-')[0]);
    //             let difference = 365;
    //             if (item.start_date && !item.end_date) {
    //                 startDate = new Date(item.start_date).toISOString().slice(0, 10);
    //                 endDate = current_year + "-12-31";
    //                 startYear = parseInt(startDate.split('-')[0]);
    //                 endYear = parseInt(endDate.split('-')[0]);
    //             } else if (item.start_date && item.end_date) {
    //                 startDate = new Date(item.start_date).toISOString().slice(0, 10);
    //                 endDate = new Date(item.end_date).toISOString().slice(0, 10);
    //                 startYear = parseInt(startDate.split('-')[0]);
    //                 endYear = parseInt(endDate.split('-')[0]);
    //             }
    //             if (startYear === current_year && endYear === current_year) {
    //                 difference = this.get_diff_dates_between_twodates(startDate, endDate);
    //             } else if (startYear === current_year && endYear !== current_year) {
    //                 difference = this.get_diff_dates_between_twodates(startDate, current_year + '-12-31');
    //             } else if (startYear !== current_year && endYear === current_year) {
    //                 difference = this.get_diff_dates_between_twodates(current_year + '-01-01', endDate);
    //             } else if (startYear < current_year && current_year < endYear) {
    //                 difference = this.get_diff_dates_between_twodates(current_year + '-01-01', current_year + '-12-31');
    //             } else {
    //                 difference = 0;
    //             }
    //             holiday_pending_per_this_year[item.id] = Math.floor(difference * holidaysPerYear / divider) + additional_pending_holidays;
    //         }
    //     }
    //     return holiday_pending_per_this_year;
    // },

    get_current_additional_pendingholidays: async function (user_criteria, current_year) {
        const userData = await User.findAll({
            where: { ...user_criteria },
            include: [
                { model: Staticpendingholidays, }
            ]
        });
        let current_additional_pendingholidays = {};
        for (const user_item of userData) {
            let item = user_item.dataValues;
            if (!current_additional_pendingholidays[item.id]) {
                current_additional_pendingholidays[item.id] = {
                    current_pending_holidays: 0,
                    additional_pending_holidays: 0
                };
            }
            let additional_pending_holidays = 0;
            let filtered_aphd = item.staticpendingholidays.filter(aphd_item => aphd_item.dataValues.appliedYear === current_year - 1);
            if (filtered_aphd.length > 0) {
                additional_pending_holidays = filtered_aphd[0].dataValues.pendingholidays;
            }
            if (!item.start_date) {
                current_additional_pendingholidays[item.id]['current_pending_holidays'] = 0;
                current_additional_pendingholidays[item.id]['additional_pending_holidays'] = additional_pending_holidays;
            }
            else {
                let startDate = current_year + "-01-10";
                let endDate = current_year + "-12-31";
                let currentDate = new Date().toISOString().slice(0, 10);
                // let currentDate = "2023-12-02"
                let startYear = parseInt(startDate.split('-')[0]);
                let endYear = parseInt(endDate.split('-')[0]);
                let difference = 365;
                if (item.start_date && !item.end_date) {
                    startDate = new Date(item.start_date).toISOString().slice(0, 10);
                    endDate = current_year + "-12-31";
                    startYear = parseInt(startDate.split('-')[0]);
                    endYear = parseInt(endDate.split('-')[0]);
                } else if (item.start_date && item.end_date) {
                    startDate = new Date(item.start_date).toISOString().slice(0, 10);
                    endDate = new Date(item.end_date).toISOString().slice(0, 10);
                    if (endDate > currentDate) {
                        endDate = currentDate;
                    }
                    startYear = parseInt(startDate.split('-')[0]);
                    endYear = parseInt(endDate.split('-')[0]);
                }
                if (startYear === current_year && endYear === current_year) {
                    difference = this.get_diff_monthcounts_between_twodates(startDate, endDate);
                } else if (startYear === current_year && endYear !== current_year) {
                    difference = this.get_diff_monthcounts_between_twodates(startDate, endDate);
                } else if (startYear !== current_year && endYear === current_year) {
                    difference = this.get_diff_monthcounts_between_twodates(current_year + '-01-10', endDate);
                } else if (startYear < current_year && current_year < endYear) {
                    difference = this.get_diff_monthcounts_between_twodates(current_year + '-01-10', endDate);
                } else {
                    difference = 0;
                }
                // current_additional_pendingholidays[item.id] = Math.round((difference) * (holidaysPerYear / 12)) + additional_pending_holidays;
                current_additional_pendingholidays[item.id]['current_pending_holidays'] = Math.round((difference) * (holidaysPerYear / 12));
                current_additional_pendingholidays[item.id]['additional_pending_holidays'] = additional_pending_holidays;
            }
        }
        return current_additional_pendingholidays;
    },

    get_holiday_pending_of_current_year: async function (user_criteria, current_year) {
        const userData = await User.findAll({
            where: { ...user_criteria },
            include: [
                { model: Staticpendingholidays, }
            ]
        });
        let holiday_pending_per_this_year = {};
        let divider = 364;
        for (const user_item of userData) {
            let item = user_item.dataValues;
            let additional_pending_holidays = 0;
            let filtered_aphd = item.staticpendingholidays.filter(aphd_item => aphd_item.dataValues.appliedYear === current_year - 1);
            if (filtered_aphd.length > 0) {
                additional_pending_holidays = filtered_aphd[0].dataValues.pendingholidays;
            }
            if (!item.start_date) {
                holiday_pending_per_this_year[item.id] = 0;
            }
            else {
                let startDate = current_year + "-01-10";
                let endDate = current_year + "-12-31";
                let currentDate = new Date().toISOString().slice(0, 10);
                // let currentDate = "2023-12-02"
                let startYear = parseInt(startDate.split('-')[0]);
                let endYear = parseInt(endDate.split('-')[0]);
                let difference = 365;
                if (item.start_date && !item.end_date) {
                    startDate = new Date(item.start_date).toISOString().slice(0, 10);
                    endDate = current_year + "-12-31";
                    startYear = parseInt(startDate.split('-')[0]);
                    endYear = parseInt(endDate.split('-')[0]);
                } else if (item.start_date && item.end_date) {
                    startDate = new Date(item.start_date).toISOString().slice(0, 10);
                    endDate = new Date(item.end_date).toISOString().slice(0, 10);
                    if (endDate > currentDate) {
                        endDate = currentDate;
                    }
                    startYear = parseInt(startDate.split('-')[0]);
                    endYear = parseInt(endDate.split('-')[0]);
                }
                if (startYear === current_year && endYear === current_year) {
                    difference = this.get_diff_monthcounts_between_twodates(startDate, endDate);
                } else if (startYear === current_year && endYear !== current_year) {
                    difference = this.get_diff_monthcounts_between_twodates(startDate, endDate);
                } else if (startYear !== current_year && endYear === current_year) {
                    difference = this.get_diff_monthcounts_between_twodates(current_year + '-01-10', endDate);
                } else if (startYear < current_year && current_year < endYear) {
                    difference = this.get_diff_monthcounts_between_twodates(current_year + '-01-10', endDate);
                } else {
                    difference = 0;
                }
                holiday_pending_per_this_year[item.id] = Math.round((difference) * (holidaysPerYear / 12)) + additional_pending_holidays;
            }
        }
        return holiday_pending_per_this_year;
    },

    get_holiday_pending_of_notcurrent_year: async function (user_criteria, current_year) {
        const userData = await User.findAll({
            where: { ...user_criteria },
            include: [
                { model: Staticpendingholidays, }
            ]
        });
        let holiday_pending_per_this_year = {};
        let divider = 364;
        for (const user_item of userData) {
            let item = user_item.dataValues;
            let additional_pending_holidays = 0;
            let filtered_aphd = item.staticpendingholidays.filter(aphd_item => aphd_item.dataValues.appliedYear === current_year);
            if (filtered_aphd.length > 0) {
                additional_pending_holidays = filtered_aphd[0].dataValues.pendingholidays;
            }
            if (additional_pending_holidays > 0) {
                holiday_pending_per_this_year[item.id] = additional_pending_holidays;
            } else {
                if (!item.start_date) {
                    holiday_pending_per_this_year[item.id] = 0;
                }
                else {
                    let startDate = current_year + "-01-10";
                    let endDate = current_year + "-12-31";
                    let startYear = parseInt(startDate.split('-')[0]);
                    let endYear = parseInt(endDate.split('-')[0]);
                    let difference = 365;
                    if (item.start_date && !item.end_date) {
                        startDate = new Date(item.start_date).toISOString().slice(0, 10);
                        endDate = current_year + "-12-31";
                        startYear = parseInt(startDate.split('-')[0]);
                        endYear = parseInt(endDate.split('-')[0]);
                    } else if (item.start_date && item.end_date) {
                        startDate = new Date(item.start_date).toISOString().slice(0, 10);
                        endDate = new Date(item.end_date).toISOString().slice(0, 10);
                        startYear = parseInt(startDate.split('-')[0]);
                        endYear = parseInt(endDate.split('-')[0]);
                    }
                    if (startYear === current_year && endYear === current_year) {
                        difference = this.get_diff_monthcounts_between_twodates(startDate, endDate);
                    } else if (startYear === current_year && endYear !== current_year) {
                        difference = this.get_diff_monthcounts_between_twodates(startDate, current_year + '-12-31');
                    } else if (startYear !== current_year && endYear === current_year) {
                        difference = this.get_diff_monthcounts_between_twodates(current_year + '-01-10', endDate);
                    } else if (startYear < current_year && current_year < endYear) {
                        difference = this.get_diff_monthcounts_between_twodates(current_year + '-01-10', current_year + '-12-31');
                    } else {
                        difference = 0;
                    }
                    holiday_pending_per_this_year[item.id] = Math.round((difference + 1) * (holidaysPerYear / 12));
                }
            }
        }
        return holiday_pending_per_this_year;
    },

    generate_datelist_for_calendarusers: function (users, start_date, end_date, holiday_data, leave_data, companyHolidayStaticdays) {
        let [start_date_year, start_date_month] = start_date.split("-");
        let [end_date_year, end_date_month] = end_date.split("-");
        let start_loop = new Date(start_date_year, parseInt(start_date_month) - 1, 1);
        let end_loop = new Date(end_date_year, parseInt(end_date_month) - 1, moment(end_date, "YYYY-MM").daysInMonth());
        let daysOfPeriod = [];
        let monthsOfPeriod = [];
        let lastNumberOfWorkingPeople = {};
        for (let d = start_loop; d <= end_loop; d.setDate(d.getDate() + 1)) {
            let push_date = new Date(d).toISOString().slice(0, 10);
            daysOfPeriod.push(push_date);
            lastNumberOfWorkingPeople[push_date] = 0;
            let [cur_year, cur_month, cur_date] = push_date.split("-");
            if (!monthsOfPeriod.includes(cur_year + "-" + cur_month)) {
                monthsOfPeriod.push(cur_year + "-" + cur_month);
            }
        }
        let data = [];
        for (const userItem of users) {
            let push_item = {
                user: userItem.dataValues,
                holiday_count: 0,
                leaves_count: 0,
                route_name: userItem.route_name,
                project_name: userItem.project_name,
                zone_name: userItem.zone_name,
                companyCode: userItem.dataValues.companyCode
            };
            push_item.dates = {};
            for (const dateItem of daysOfPeriod) {
                let date_properties = {
                    isWeekend: false,
                    isStaticPublicHoliday: false,
                    isActive: false,
                    isHolidayApproved: false,
                    isHolidayPendingApproval: false,
                    isUserPublicHoliday: false,
                    isPaidLeave: false,
                    isLeaveOpened: false,
                    isLeaveClosed: false,
                    isWorking: true
                }
                let day = moment(dateItem).day();
                if (!(day >= 1 && day <= 5)) {
                    date_properties.isWeekend = true;
                }

                if (staticPublicHolidays.includes(dateItem.slice(5))) {
                    date_properties.isStaticPublicHoliday = true;
                }

                if (companyHolidayStaticdays[push_item.companyCode]) {
                    if (companyHolidayStaticdays[push_item.companyCode].includes(dateItem)) {
                        date_properties.isStaticPublicHoliday = true;
                    }
                }

                date_properties.isActive = this.isCheckActiveUser(userItem, dateItem);
                let isCurrentDateHolidayAndLeaves = 0;
                if (holiday_data[userItem.dataValues.id]) {
                    for (const holiday_item of holiday_data[userItem.dataValues.id]) {
                        let current_holiday_user_data = holiday_item;
                        if (holiday_item.holidaypublics.includes(dateItem)) {
                            date_properties.isUserPublicHoliday = true;
                        }
                        if (current_holiday_user_data.startDate <= dateItem && current_holiday_user_data.endDate >= dateItem) {
                            if (current_holiday_user_data.holidayType === "VACATION") {
                                if (current_holiday_user_data.status === "APPROVED") {
                                    date_properties.isHolidayApproved = true;
                                } else if (current_holiday_user_data.status === "PENDINGAPPROVAL") {
                                    date_properties.isHolidayPendingApproval = true;
                                }
                            } else {
                                date_properties.isPaidLeave = true;
                            }
                            if (!date_properties.isWeekend && !date_properties.isUserPublicHoliday && !date_properties.isStaticPublicHoliday) {
                                push_item.holiday_count++;
                                isCurrentDateHolidayAndLeaves++;
                            }
                        }
                    }
                }
                if (leave_data[userItem.dataValues.id]) {
                    for (const leave_item of leave_data[userItem.dataValues.id]) {
                        let current_leave_user_data = leave_item;
                        if (leave_item.leavepublics.includes(dateItem)) {
                            date_properties.isUserPublicHoliday = true;
                        }
                        if (current_leave_user_data.startDate <= dateItem && current_leave_user_data.endDate >= dateItem) {
                            if (current_leave_user_data.closeStatus === "OPENED") {
                                date_properties.isLeaveOpened = true;
                            } else if (current_leave_user_data.closeStatus === "CLOSED") {
                                date_properties.isLeaveClosed = true;
                            }
                            if (!date_properties.isWeekend && !date_properties.isUserPublicHoliday && !date_properties.isStaticPublicHoliday) {
                                push_item.leaves_count++;
                                isCurrentDateHolidayAndLeaves++;
                            }
                        }
                    }
                }
                if (isCurrentDateHolidayAndLeaves === 2) {
                    push_item.holiday_count--;
                }
                date_properties.isWorking = date_properties.isActive && !date_properties.isHolidayApproved && !date_properties.isHolidayPendingApproval && !date_properties.isPaidLeave && !date_properties.isLeaveClosed && !date_properties.isLeaveOpened && !date_properties.isStaticPublicHoliday && !date_properties.isUserPublicHoliday;
                if (date_properties.isWeekend) {
                    lastNumberOfWorkingPeople[dateItem] = "";
                } else if (date_properties.isWorking) {
                    lastNumberOfWorkingPeople[dateItem]++;
                }
                push_item.dates[dateItem] = date_properties;
            }
            data.push(push_item);
        }
        data.push(lastNumberOfWorkingPeople)
        return { data, daysOfPeriod, monthsOfPeriod, lastNumberOfWorkingPeople };
    },

    isCheckActiveUser: function (userItem, checkDate) {
        if (userItem.start_date && userItem.end_date) {
            let start_date = new Date(userItem.start_date).toISOString().slice(0, 10);
            let end_date = new Date(userItem.end_date).toISOString().slice(0, 10);
            if (!(start_date <= checkDate && checkDate <= end_date)) {
                return false;
            }
        } else if (userItem.start_date) {
            let start_date = new Date(userItem.start_date).toISOString().slice(0, 10);
            if (start_date >= checkDate) {
                return false;
            }
        } else if (userItem.end_date) {
            let end_date = new Date(userItem.end_date).toISOString().slice(0, 10);
            if (checkDate >= end_date) {
                return false;
            }
        }
        return true;
    },

    optimizeHolidayData: function (holidayData) {
        let data = {};
        for (const dataItem of holidayData) {
            let data_item = dataItem.dataValues;
            if (!data[data_item.userId]) {
                data[data_item.userId] = [];
            }
            let push_item = {
                startDate: data_item.startDate,
                endDate: data_item.endDate,
                status: data_item.status,
                holidayType: data_item.holidayType,
                paidType: data_item.paidType,
                holidaypublics: [],
            }
            for (const holidaypublic of data_item.holidaypublics) {
                push_item.holidaypublics.push(holidaypublic.dataValues.publicholiday);
            }
            data[data_item.userId].push(push_item);
        }
        return data;
    },

    optimizeLeaveData: function (leaveData) {
        let data = {};
        for (const dataItem of leaveData) {
            let data_item = dataItem.dataValues;
            if (!data[data_item.userId]) {
                data[data_item.userId] = [];
            }
            let push_item = {
                startDate: data_item.startDate,
                endDate: data_item.endDate,
                closeStatus: data_item.closeStatus,
                leavepublics: [],
            }
            for (const holidaypublic of data_item.leavepublics) {
                push_item.leavepublics.push(holidaypublic.dataValues.publicholiday);
            }
            data[data_item.userId].push(push_item);
        }
        return data;
    },

    get_holidaystaticdays_intheperiod: async function (filterPeriod) {
        let [end_date_year, end_date_month] = filterPeriod['end_date'].split('-');
        let { firstDay, lastDay } = expensesUtils.getFirstAndLastDayOfMonth(end_date_year, end_date_month);
        let where_cause = {};
        where_cause['date'] = {
            [Op.and]: [
                { [Op.gte]: filterPeriod['start_date'] + '-01' },
                { [Op.lte]: lastDay },
            ]
        };
        let data = await Holidaystaticdays.findAll({
            where: where_cause,
        });
        let mappeddata = {};
        for (const item of data) {
            let push_item = {
                ...item.dataValues
            };
            if (!mappeddata[push_item.companyId]) {
                mappeddata[push_item.companyId] = [];
            }
            mappeddata[push_item.companyId].push(push_item.date);
        }
        return mappeddata;
    }

}

module.exports = Self