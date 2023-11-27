const { Sequelize, User, Holiday, Holidaypublic, Leavepublic, Leave, Brand, Route, Zone, Company, Holidaystaticdays, Holidaypaiddayslimit } = require('../sequelize')
const HttpStatus = require("http-status-codes");
const excel = require("exceljs");
const fs = require('fs');
const Op = Sequelize.Op;
const holidayleavesUtils = require('../services/holidayleaves.utils');
const expensesUtils = require('../services/expenses.utils');
const emailUtils = require('../services/email.utils');
const UserRoles = require('../models/user.model').roles;
const statusTypes = require('../models/holiday').status;
const holidayTypes = require('../models/holiday').holidayTypes;
const paidTypes = require('../models/holiday').paidTypes;
const { holidaysPerYear, staticPublicHolidays } = require('../utils');
const UserDepartments = require('../models/user.model').departments;

const get_data = async (req, is_download_excel, paid_day_limits, isNaturals_paid_day_limits) => {
    const { page, itemsPerPage, sortby, sortdesc, filterModel, isteam } = req.query;
    let page_num = page === undefined ? 1 : page;
    let page_limit = itemsPerPage === undefined ? 10 : itemsPerPage;
    let filter = filterModel === undefined ? [] : JSON.parse(filterModel);

    let order_cause = [];
    if (sortby !== undefined && sortby !== 'daysrequested' && sortby !== 'numberofpublicholidays' && sortby !== 'parentId') {
        switch (sortby) {
            case 'username':
                order_cause = ['user', 'name', sortdesc === "true" ? "DESC" : "ASC"];
                break;
            case 'usertype':
                order_cause = ['user', 'role', sortdesc === "true" ? "DESC" : "ASC"];
                break;
            case 'approvername':
                order_cause = ['hdapprover', 'name', sortdesc === "true" ? "DESC" : "ASC"];
                break;
            default:
                order_cause = [sortby, sortdesc === "true" ? "DESC" : "ASC"];
                break;
        }
    }
    else {
        order_cause = [[Sequelize.literal('date DESC, id DESC')]];
    }

    let where_cause = {};
    let username_where_cause = {};
    let approver_where_cause = {};
    let buffer_values = [];
    let user_where_cause = await holidayleavesUtils.get_user_where_cause(req.user, isteam);
    where_cause = { ...user_where_cause };
    filter.map(item => {
        if (item.columnField === 'date' || item.columnField === 'startDate' || item.columnField === 'endDate') {
            if (item.filterValue['from'] !== undefined && item.filterValue['to'] !== undefined && item.filterValue['from'] !== '' && item.filterValue['to'] !== '') {
                where_cause[item.columnField] = {
                    [Op.and]: [
                        { [Op.gte]: item.filterValue['from'] },
                        { [Op.lte]: item.filterValue['to'] },
                    ]
                }
            }
            else if (item.filterValue['from'] !== undefined && item.filterValue['from'] !== '') {
                where_cause[item.columnField] = { [Op.gte]: item.filterValue['from'] }
            } else if (item.filterValue['to'] !== undefined && item.filterValue['to'] !== '') {
                where_cause[item.columnField] = { [Op.lte]: item.filterValue['to'] }
            }
        }
        if (item.columnField === 'username') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause['userId'] = { [Op.or]: buffer_values }
        }
        if (item.columnField === 'usertype') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) {
                username_where_cause.role = { [Op.or]: buffer_values };
            }
        }
        if (item.columnField === 'approvername') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause['approverId'] = { [Op.or]: buffer_values }
        }
        // string search
        if ((item.columnField === 'employee_comments' || item.columnField === 'responsible_comments' || item.columnField === 'publicholiday_municipality') && item.filterValue) {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause['id'] = { [Op.or]: buffer_values }
        }
        // checkbox search
        if (item.columnField === 'status') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                let statusKey = Object.keys(statusTypes).find(key => statusTypes[key] === value);
                if (statusKey && value !== null) buffer_values.push(statusKey);
            }
            if (buffer_values.length > 0) where_cause[item.columnField] = { [Op.or]: buffer_values }
        }
        if (item.columnField === 'holidayType') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                let statusKey = Object.keys(holidayTypes).find(key => holidayTypes[key] === value);
                if (statusKey && value !== null) buffer_values.push(statusKey);
            }
            if (buffer_values.length > 0) where_cause[item.columnField] = { [Op.or]: buffer_values }
        }
        if (item.columnField === 'paidType') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                let statusKey = Object.keys(paidTypes).find(key => paidTypes[key] === value);
                if (statusKey && value !== null) buffer_values.push(statusKey);
            }
            if (buffer_values.length > 0) where_cause[item.columnField] = { [Op.or]: buffer_values }
        }
        return item;
    })

    let query_builder_options = {
        where: where_cause,
        order: [order_cause],
        include: [
            (Object.keys(username_where_cause).length > 0) ?
                {
                    model: User,
                    where: username_where_cause,
                    include: [
                        {
                            model: User,
                            as: 'Parent'
                        },
                        Brand,
                        Company,
                    ]
                } :
                {
                    model: User,
                    include: [
                        {
                            model: User,
                            as: 'Parent'
                        },
                        Brand,
                        Company,
                    ]
                },
            { model: Holidaypublic, order: [["publicholiday", "ASC"]] },
            (Object.keys(approver_where_cause).length > 0) ?
                { model: User, as: "hdapprover", where: approver_where_cause } :
                { model: User, as: "hdapprover" },
        ],
    }
    const data = await Holiday.findAndCountAll(query_builder_options)

    let data_list = [];
    let parent_list = [];
    let filtered_parent_item = null;
    for (let i = 0; i < data.rows.length; i++) {
        let item = data.rows[i].dataValues;
        item.usercompanyCode = null;
        if (item.user !== null && item.user.Parent && item.user.Parent !== null) {
            item.usercompanyCode = item.user.companyCode;
            item.parentId = item.user.Parent.id;
            filtered_parent_item = parent_list.filter(parent_item => parent_item.id === item.user.Parent.id);
            if (filtered_parent_item.length === 0) {
                parent_list.push(item.user.Parent.dataValues);
            }
            else {
                filtered_parent_item = null;
            }
        }
        else {
            item.parentId = null;
        }
        // item.daysStatus = await holidayleavesUtils.get_holidays_requested(item.startDate, item.endDate, item.holidaypublics, item.userId);
        item.daysStatus = await holidayleavesUtils.get_holidays_requested(item, isNaturals_paid_day_limits);
        item.daysrequested = item.daysStatus.request_day;
        item.numberofpublicholidays = item.holidaypublics ? item.holidaypublics.length : 0;
        item.status_label = statusTypes[item.status] ? statusTypes[item.status] : '';
        item.limit_paid_days = 0;
        if (paid_day_limits[item.usercompanyCode] && item.paidType && paid_day_limits[item.usercompanyCode][item.paidType]) {
            item.limit_paid_days = paid_day_limits[item.usercompanyCode][item.paidType];
        }
        item.holidayTypeLabel = holidayTypes[item.holidayType] ? holidayTypes[item.holidayType] : "";
        item.paidTypeLabel = "";
        if (item.holidayType !== "VACATION") {
            item.paidTypeLabel = paidTypes[item.paidType] ? paidTypes[item.paidType] : "";
        }
        data_list.push(item)
    }
    if (sortby !== undefined && (sortby === 'daysrequested' || sortby === 'numberofpublicholidays' || sortby === 'parentId')) {
        if (sortdesc === "false") {
            data_list = data_list.sort((a, b) => (a[sortby] > b[sortby]) ? 1 : ((b[sortby] > a[sortby]) ? -1 : 0))
        }
        else {
            data_list = data_list.sort((a, b) => (a[sortby] < b[sortby]) ? 1 : ((b[sortby] < a[sortby]) ? -1 : 0))
        }
    }
    filter.map(item => {
        if (item.columnField === 'parentId') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            data_list = data_list.filter(data_item => buffer_values.includes(data_item[item.columnField
            ]));
        }
        if (item.columnField === 'daysrequested' || item.columnField === 'numberofpublicholidays') {
            if (item.filterValue['from'] !== undefined && item.filterValue['to'] !== undefined && item.filterValue['from'] !== '' && item.filterValue['to'] !== '') {
                data_list = data_list.filter(data_item => data_item[item.columnField] >= item.filterValue
                ['from'] && data_item[item.columnField] <= item.filterValue
                ['to'])
            }
            else if (item.filterValue['from'] !== undefined && item.filterValue['from'] !== '') {
                data_list = data_list.filter(data_item => data_item[item.columnField] >= item.filterValue
                ['from'])
            } else if (item.filterValue['to'] !== undefined && item.filterValue['to'] !== '') {
                data_list = data_list.filter(data_item => data_item[item.columnField] <= item.filterValue
                ['to'])
            }
        }
    })
    let total_count = data_list.length;
    if (!is_download_excel) {
        data_list = data_list.slice(page_limit * (page_num - 1), page_limit * page_num);
    }
    let statistics_data = await get_statistics_data(where_cause['userId'] ? { userId: where_cause['userId'] } : {}, isteam, isNaturals_paid_day_limits);
    return {
        data: data_list,
        total: total_count,
        parent_list,
        statistics_data,
    };
}

const get_statistics_data = async (user_criteria, isteam, isNaturals_paid_day_limits) => {
    let return_value = {
        daysapproved: 0,
        daysapproved_notarrived: 0,
        current_holidaypending: 0,
        last_holidaypending: 0,
        dayspendingapproval: 0,
        incidence_count: 0,
    };
    let date = new Date();
    let current_date = new Date().toISOString().slice(0, 10);
    let current_year = date.getFullYear();
    let last_year = current_year - 1;
    let criteria = {
        ...user_criteria,
        // status: {
        //     [Op.or]: ['PENDINGAPPROVAL', 'APPROVED']
        // },
    }
    let global_incidence_count = await Holiday.count({
        where: {
            ...criteria,
            status: "INCIDENCE"
        }
    });
    return_value.incidence_count = global_incidence_count;
    let current_year_criteria = {
        ...criteria,
        startDate: { [Op.gte]: current_year + '-01-01' },
        endDate: { [Op.lte]: current_year + '-12-31' },
    }
    let current_year_data = await Holiday.findAll({
        where: current_year_criteria,
        include: [
            User,
            Holidaypublic
        ],
    })
    let user_list = [];
    for (const data_item of current_year_data) {
        const { id, holidaypublics, startDate, endDate, status, userId } = data_item.dataValues;
        let push_item = { id, holidaypublics, startDate, endDate, status, userId };
        // push_item.daysStatus = await holidayleavesUtils.get_holidays_requested(push_item.startDate, push_item.endDate, push_item.holidaypublics, push_item.userId);
        push_item.daysStatus = await holidayleavesUtils.get_holidays_requested(data_item.dataValues, isNaturals_paid_day_limits);
        push_item.daysrequested = push_item.daysStatus.request_day;
        if (push_item.status === "PENDINGAPPROVAL") {
            return_value.dayspendingapproval += push_item.daysrequested;
        }
        else if (push_item.status === "INCIDENCE") {
            // return_value.incidence_count += push_item.daysrequested;
            // return_value.incidence_count++;
        }
        else if (push_item.status === "APPROVED") {
            if (current_date >= push_item.endDate) {
                return_value.daysapproved += push_item.daysrequested;
            } else {
                return_value.daysapproved_notarrived += push_item.daysrequested;
            }
        }
        if (!user_list.includes(userId)) {
            user_list.push(userId);
        }
    }
    let current_additional_pendingholidays = await holidayleavesUtils.get_current_additional_pendingholidays(user_criteria['userId'] ? { id: user_criteria['userId'] } : {}, current_year);
    for (const [userId, holidays_per_year_value] of Object.entries(current_additional_pendingholidays)) {
        if (isteam === 'my') {
            return_value.current_holidaypending += holidays_per_year_value['current_pending_holidays'] + holidays_per_year_value['additional_pending_holidays'];
        } else {
            if (user_list.includes(parseInt(userId))) {
                return_value.current_holidaypending += holidays_per_year_value['current_pending_holidays'] + holidays_per_year_value['additional_pending_holidays'];
            }
        }
    }
    // return_value.current_holidaypending = return_value.current_holidaypending - return_value.daysapproved > 0 ? return_value.current_holidaypending - return_value.daysapproved : 0;
    return_value.current_holidaypending = return_value.current_holidaypending - return_value.daysapproved;

    if (isteam === 'my') {
        let last_year_criteria = {
            ...criteria,
            startDate: { [Op.gte]: last_year + '-01-01' },
            endDate: { [Op.lte]: last_year + '-12-31' },
        }
        let last_year_data = await Holiday.findAll({
            where: last_year_criteria,
            include: [
                User,
                Holidaypublic
            ],
        })
        user_list = [];
        let last_daysapproved = 0;
        for (const data_item of last_year_data) {
            const { id, holidaypublics, startDate, endDate, status, userId } = data_item.dataValues;
            let push_item = { id, holidaypublics, startDate, endDate, status, userId };
            // push_item.daysStatus = await holidayleavesUtils.get_holidays_requested(push_item.startDate, push_item.endDate, push_item.holidaypublics, push_item.userId);
            push_item.daysStatus = await holidayleavesUtils.get_holidays_requested(data_item.dataValues, isNaturals_paid_day_limits);
            push_item.daysrequested = push_item.daysStatus.request_day;
            if (push_item.status === "APPROVED") {
                last_daysapproved += push_item.daysrequested;
            }
            if (!user_list.includes(userId)) {
                user_list.push(userId);
            }
        }
        let last_additional_pendingholidays = await holidayleavesUtils.get_current_additional_pendingholidays(user_criteria['userId'] ? { id: user_criteria['userId'] } : {}, last_year);
        if (current_additional_pendingholidays[user_criteria['userId']] && current_additional_pendingholidays[user_criteria['userId']]['additional_pending_holidays']) {
            return_value.last_holidaypending = current_additional_pendingholidays[user_criteria['userId']]['additional_pending_holidays'] - return_value.daysapproved;
        } else {
            return_value.last_holidaypending = last_additional_pendingholidays[user_criteria['userId']]['current_pending_holidays'] - last_daysapproved;
        }
    }
    return return_value;
}

const get_holidaypaiddaylimits = async () => {
    let data = {};
    const list = await Holidaypaiddayslimit.findAll();
    for (const item of list) {
        const { companyId, paidType, limitDays } = item.dataValues;
        if (!data[companyId]) {
            data[companyId] = {};
        }
        if (!data[companyId][paidType]) {
            data[companyId][paidType] = limitDays;
        }
    }
    return data;
}

const get_isnatural_holidaypaiddaylimits = async () => {
    let data = {};
    const list = await Holidaypaiddayslimit.findAll();
    for (const item of list) {
        const { companyId, paidType, isNatural } = item.dataValues;
        if (!data[companyId]) {
            data[companyId] = {};
        }
        if (!data[companyId][paidType]) {
            data[companyId][paidType] = isNatural;
        }
    }
    return data;
}

const get_default_holidaypaiddaylimits = async () => {
    let data = {};
    for (const [key, value] of Object.entries(paidTypes)) {
        data[key] = 0;
    }
    return data;
}

const Self = {

    index: async function (req, res) {
        let paid_day_limits = await get_holidaypaiddaylimits();
        let isNaturals_paid_day_limits = await get_isnatural_holidaypaiddaylimits();
        let default_paid_day_limits = await get_default_holidaypaiddaylimits();
        const holiday_data = await get_data(req, false, paid_day_limits, isNaturals_paid_day_limits);
        let statusTypesSelect = [];
        for (const item of Object.keys(statusTypes)) {
            let push_item = {
                value: item,
                label: statusTypes[item]
            }
            statusTypesSelect.push(push_item);
        }
        let holidayTypesSelect = [];
        for (const item of Object.keys(holidayTypes)) {
            let push_item = {
                value: item,
                label: holidayTypes[item]
            }
            holidayTypesSelect.push(push_item);
        }
        let paidTypesSelect = [];
        for (const item of Object.keys(paidTypes)) {
            let push_item = {
                value: item,
                label: paidTypes[item]
            }
            paidTypesSelect.push(push_item);
        }
        return res.json({
            data: holiday_data.data,
            total: holiday_data.total,
            parent_list: holiday_data.parent_list,
            statusTypes: statusTypes,
            statusTypesSelect: statusTypesSelect,
            holidayTypes,
            holidayTypesSelect,
            paidTypes,
            paidTypesSelect,
            paid_day_limits: paid_day_limits[req.user.companyCode] ? paid_day_limits[req.user.companyCode] : default_paid_day_limits,
            isNaturals_paid_day_limits: isNaturals_paid_day_limits[req.user.companyCode] ? isNaturals_paid_day_limits[req.user.companyCode] : {},
            statistics_data: holiday_data.statistics_data,
            user_roles: Object.values(UserRoles),
            staticPublicHolidays
        })
    },

    upsert: async function (req, res) {
        if (!req.user) {
            res.status(401).send('Authorization required');
        } else {
            let { body, params: { id } } = req;
            if (body.status === 'APPROVED' || body.status === 'INCIDENCE') {
                body.approverId = req.user.id;
            }
            else {
                body.approverId = null;
            }

            let holidayId = -1;
            if (id === undefined) {
                body = { ...body, userId: req.user.id };
                const data = await Holiday.create(body);
                if (data) {
                    holidayId = data.id;
                }
            } else {
                await Holiday.update(body, { where: { id } });
                holidayId = id;
            }
            if (holidayId > 0) {
                await Holidaypublic.destroy({ where: { holidayId } });
                let new_public_holidays = [];
                for (const holiday_item of body.holidaypublics) {
                    if (!new_public_holidays.includes(holiday_item.publicholiday)) {
                        new_public_holidays.push(holiday_item.publicholiday);
                    }
                }
                if (new_public_holidays.length > 0) {
                    new_public_holidays = new_public_holidays.sort(function (a, b) {
                        var c = new Date(a);
                        var d = new Date(b);
                        return c - d;
                    });
                    for (const holiday of new_public_holidays) {
                        await Holidaypublic.create({
                            holidayId,
                            publicholiday: holiday
                        });
                    }
                }
            }
            if (body.status === "INCIDENCE") {
                emailUtils.sendingEmailForIncidence(body.userId, "holiday");
            }

            return res.status(200).json({ holidayId })
        }
    },

    delete: async function (req, res) {
        const { id } = req.params
        await Holiday.destroy({ where: { id } })
        return res.status(200).send()
    },

    downloadexcel: async function (req, res) {
        try {
            let paid_day_limits = await get_holidaypaiddaylimits();
            let isNaturals_paid_day_limits = await get_isnatural_holidaypaiddaylimits();
            let holiday_data = await get_data(req, true, paid_day_limits, isNaturals_paid_day_limits);
            let data_list = holiday_data.data.map((detail => {
                const result = {
                    ...detail
                }
                result.username = detail.user ? detail.user.username : '';
                result.user_name_surname = detail.user ? detail.user.name + ' ' + detail.user.surname : '';
                result.usertype = detail.user ? detail.user.role : '';
                result.parentName = detail.user && detail.user.Parent ? detail.user.Parent.name + ' ' + detail.user.Parent.surname : '';
                result.approver_name = detail.hdapprover ? detail.hdapprover.name + ' ' + detail.hdapprover.surname : '';
                result.status = statusTypes[result.status];
                let holidaypublic_arr = [];
                result.holidaypublics.map(item => {
                    holidaypublic_arr.push(item.publicholiday);
                })
                result.holidaypublics_arr = holidaypublic_arr.join(", ");
                result.project_name = result.user.brands ? result.user.brands.map(el => el.name).join(", ") : "";
                result.companyName = "";
                if (detail.user && detail.user.company) {
                    result.companyName = detail.user.company.name;
                }
                return result;
            }))
            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("data");
            let columns = [
                { header: "Fecha", key: "date" },
                { header: "Días Solicitados", key: "daysrequested" },
                { header: "Fecha de inicio", key: "startDate" },
                { header: "Fecha final", key: "endDate" },
                { header: "Municipio Festivo", key: "publicholiday_municipality" },
                { header: "Num días Festivos", key: "numberofpublicholidays" },
                { header: "Festivos", key: "holidaypublics_arr" },
                { header: "Comentarios Usuario", key: "employee_comments" },
                { header: "Comentarios Responsable", key: "responsible_comments" },
                { header: "Aprobado por", key: "approver_name" },
                { header: "estado", key: "status" },
            ];
            if (req.user.role !== 'gpv') {
                let insert_cols = [
                    { header: "Nombre de usuario", key: "username" },
                    { header: "Nombre Apellido", key: "user_name_surname" },
                    { header: "Proyecto", key: "project_name" },
                    { header: "Rol", key: "usertype" },
                    { header: "Compañía", key: "companyName" },
                    { header: "Responsable", key: "parentName" },
                ];
                columns = [...columns.slice(0, 1), ...insert_cols, ...columns.slice(1)]
            }
            worksheet.columns = columns;
            worksheet.addRows(data_list);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=" + "KM.xlsx"
            );
            return workbook.xlsx.write(res).then(() => res.status(200).send());
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    checkselectabledates: async function (req, res) {
        const { startDate, endDate, id } = req.params;
        let datacount = 0;
        let holidaystaticdays = [];
        if (req.user) {
            let userId = req.user.id;
            let criteria = {
                userId,
                [Op.or]: [
                    {
                        [Op.and]: {
                            startDate: { [Op.lte]: startDate },
                            endDate: { [Op.gte]: startDate },
                        }
                    },
                    {
                        [Op.and]: {
                            startDate: { [Op.lte]: endDate },
                            endDate: { [Op.gte]: endDate },
                        }
                    },
                    {
                        [Op.and]: {
                            startDate: { [Op.gte]: startDate },
                            endDate: { [Op.lte]: endDate },
                        }
                    },
                ]
            }
            if (id) {
                criteria = {
                    ...criteria,
                    id: { [Op.not]: id }
                }
            }
            datacount = await Holiday.count({
                where: criteria,
            })
            if (req.user.companyCode) {
                let othercriteria = {
                    date: {
                        [Op.and]: [
                            { [Op.gte]: startDate },
                            { [Op.lte]: endDate },
                        ]
                    },
                    companyId: req.user.companyCode,
                };
                holidaystaticdays = await Holidaystaticdays.findAll({
                    where: othercriteria,
                    order: [["date", "ASC"]],
                })
                if (holidaystaticdays.length > 0) {
                    holidaystaticdays = holidaystaticdays.map(item => item.date);
                }
            }
        }

        return res.status(200).json({
            success: datacount > 0 ? false : true,
            holidaystaticdays
        });
    },

    getfilterlist: async function (req, res) {
        let { isteam } = req.params;
        const { column, filterValue, isFullText } = req.query;
        let data_list = [];
        if (filterValue !== undefined) {
            let user_where_cause = await holidayleavesUtils.get_user_where_cause(req.user, isteam);
            if (column === 'publicholiday_municipality' || column === 'employee_comments' || column === 'responsible_comments') {
                let where_cause = { ...user_where_cause };
                where_cause[column] = { [Op.like]: "%" + filterValue + "%" };
                let order_cause = [];
                order_cause = ["id", "DESC"];
                const data = await Holiday.findAll({
                    where: where_cause,
                    order: [order_cause],
                })
                for (const item of data) {
                    let push_item = { ...item.dataValues };
                    if (isFullText) {
                        push_item['title'] = push_item[column];
                    }
                    else {
                        push_item['title'] = expensesUtils.generateShortText(push_item[column], filterValue);
                    }
                    data_list.push(push_item);
                }
            }
            else if (column === 'username' || column === 'parentId') {
                let username_where_cause = {};
                username_where_cause['name'] = { [Op.like]: "%" + filterValue + "%" };
                let where_cause = { ...user_where_cause };
                let query_builder_options = {
                    where: where_cause,
                    include: [
                        (Object.keys(username_where_cause).length > 0) ?
                            {
                                model: User,
                                where: username_where_cause,
                                include: [
                                    {
                                        model: User,
                                        as: 'Parent'
                                    }
                                ]
                            } :
                            {
                                model: User,
                                include: [
                                    {
                                        model: User,
                                        as: 'Parent'
                                    }
                                ]
                            },
                    ],
                }
                const data = await Holiday.findAll(query_builder_options)
                for (const item of data) {
                    let push_item = { ...item.dataValues };
                    if (column === 'username') {
                        push_item['id'] = push_item.userId;
                        push_item['title'] = push_item.user.name + ' ' + push_item.user.surname;
                        let filtered_data = data_list.filter(data_item => data_item.userId === push_item.userId);
                        if (filtered_data.length === 0) {
                            data_list.push(push_item);
                        }
                    } else {
                        if (item.user && item.user.Parent) {
                            let parentItem = item.user.Parent;
                            push_item['id'] = parentItem.id;
                            push_item['title'] = parentItem.name + ' ' + parentItem.surname;
                            let filtered_data = data_list.filter(data_item => data_item.id === push_item.id);
                            if (filtered_data.length === 0) {
                                data_list.push(push_item);
                            }
                        }
                    }
                }
            }
            else if (column === 'approvername') {
                let approver_where_cause = {};
                approver_where_cause['name'] = { [Op.like]: "%" + filterValue + "%" };
                let where_cause = { ...user_where_cause };
                let query_builder_options = {
                    where: where_cause,
                    include: [
                        (Object.keys(approver_where_cause).length > 0) ?
                            { model: User, as: "hdapprover", where: approver_where_cause } :
                            { model: User, as: "hdapprover" },
                    ],
                }
                const data = await Holiday.findAll(query_builder_options)
                for (const item of data) {
                    let push_item = { ...item.dataValues };
                    if (push_item.hdapprover) {
                        push_item['id'] = push_item.approverId;
                        push_item['title'] = push_item.hdapprover.name + ' ' + push_item.hdapprover.surname;
                        let filtered_data = data_list.filter(data_item => data_item.approverId === push_item.approverId);
                        if (filtered_data.length === 0) {
                            data_list.push(push_item);
                        }
                    }
                }
            }
            if (filterValue === '' || filterValue === null) {
                data_list = data_list.slice(0, 100);
            }
        }
        return res.json({
            data: data_list,
        })
    },

    get_calendar_search_params: async function (req, res) {
        if (!req.user) {
            res.status(401).send('Authorization required');
        } else {
            let data = {};
            data['departments'] = UserDepartments;
            let user_where_cause = await holidayleavesUtils.get_user_where_cause(req.user, "team");
            let where_cause = {};
            if (Object.keys(user_where_cause).length > 0) {
                let key = Object.keys(user_where_cause)[0];
                where_cause["id"] = user_where_cause[key];
            }
            const users_data = await User.findAll({
                where: where_cause,
                model: User,
                include: [
                    {
                        model: User,
                        as: 'Parent'
                    },
                    Brand,
                    { model: Route, include: [Zone] }
                ]
            })
            let parents = [];
            let projects = [];
            let routes = [];
            let userlist = [];
            for (const user_item of users_data) {
                let item = user_item.dataValues;
                // if (item.project !== null && !projects.includes(item.project)) {
                //     projects.push(item.project)
                // }
                if (item.Parent !== null && parents.filter(parent_item => parent_item.id === item.Parent.id).length === 0) {
                    let parent_item = item.Parent.dataValues;
                    parent_item.username = parent_item.name + ' ' + parent_item.surname;
                    parents.push(parent_item);
                }
                item.username = item.name + ' ' + item.surname;
                if (item.routes && item.routes.length > 0) {
                    item.routes.map(route_item => {
                        routes.push(route_item);
                    })
                }
                userlist.push(item);
            }
            data['parents'] = parents;
            // data['projects'] = projects;
            data['projects'] = await Self.get_projects("");
            data['zones'] = await Self.get_zones("");
            data['userlist'] = userlist;
            data['routes'] = routes;
            data['companies'] = await Company.findAll();
            try {
                return res.json({
                    ...data
                })
            } catch (error) {
                console.log(error);
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
            }
        }
    },

    get_zones: async function (filter_name) {
        let where = {};
        let limit = { offset: 0, limit: 100 };
        let query_builder_options = {}
        if (filter_name) {
            where["name"] = { [Op.like]: `%${filter_name}%` };
            query_builder_options["where"] = where;
        } else {
            query_builder_options["offset"] = limit.offset;
            query_builder_options["limit"] = limit.limit;
        }
        const data = await Zone.findAll(query_builder_options);
        return data;
    },

    get_projects: async function (filter_name) {
        let where = {};
        let limit = { offset: 0, limit: 100 };
        let query_builder_options = {}
        if (filter_name) {
            where["name"] = { [Op.like]: `%${filter_name}%` };
            query_builder_options["where"] = where;
        } else {
            query_builder_options["offset"] = limit.offset;
            query_builder_options["limit"] = limit.limit;
        }
        const data = await Brand.findAll(query_builder_options);
        return data;
    },

    get_calendar_data: async function (req, res) {
        const userId = req.user.id;
        const { sortby, sortdesc, filterModel } = req.query;
        let filter = filterModel === undefined ? [] : JSON.parse(filterModel);
        let order_cause = [];
        if (sortby !== undefined && sortby === "username") {
            order_cause = [[Sequelize.literal(`name ${sortdesc === "true" ? "DESC" : "ASC"}, surname ${sortdesc === "true" ? "DESC" : "ASC"}`)]];
        } else {
            order_cause = [[Sequelize.literal('name ASC, surname ASC')]];
        }
        let user_where_cause = await holidayleavesUtils.get_user_where_cause(req.user, "team");
        let where_cause = {};
        let seeall = false;
        filter.map(item => {
            if (item.columnField === "seeall" && item.filterValue === true) {
                seeall = true;
            }
        })
        if (!seeall && Object.keys(user_where_cause).length > 0) {
            let key = Object.keys(user_where_cause)[0];
            where_cause["id"] = user_where_cause[key];
        }
        let buffer_values = [];
        let filterPeriod = {
            start_date: "2022-01",
            end_date: "2022-12"
        };
        let filterProjects = null;
        let filterZones = null;
        let filterRoutes = null;
        filter.map(item => {
            if (item.columnField === "companyId") {
                buffer_values = [];
                for (const search_item of item.filterValue) {
                    if (search_item !== null) buffer_values.push({ [Op.like]: search_item });
                }
                if (buffer_values.length > 0) where_cause['companyCode'] = { [Op.or]: buffer_values }
            }
            if (item.columnField === "department") {
                buffer_values = [];
                for (const search_item of item.filterValue) {
                    if (search_item !== null) buffer_values.push({ [Op.like]: search_item });
                }
                if (buffer_values.length > 0) where_cause[item.columnField] = { [Op.or]: buffer_values }
            }
            if (item.columnField === "parents") {
                buffer_values = [];
                for (const [key, value] of Object.entries(item.filterValue)) {
                    if (value !== null) buffer_values.push(value);
                }
                if (buffer_values.length > 0) where_cause["parent_id"] = { [Op.or]: buffer_values }
            }
            if (item.columnField === "users") {
                buffer_values = [];
                for (const [key, value] of Object.entries(item.filterValue)) {
                    if (value !== null) buffer_values.push(value);
                }
                if (buffer_values.length > 0) where_cause["id"] = { [Op.or]: buffer_values }
            }
            if (item.columnField === "start_date" || item.columnField === "end_date") {
                filterPeriod[item.columnField] = item.filterValue;
            }
            if (item.columnField === "activeUser" && item.filterValue) {
                where_cause["start_date"] = { [Op.lte]: new Date() };
                where_cause["end_date"] = { [Op.gte]: new Date() };
            }
            if (item.columnField === "projects" && item.filterValue) {
                filterProjects = item.filterValue;
            }
            if (item.columnField === "zones" && item.filterValue) {
                filterZones = item.filterValue;
            }
            if (item.columnField === "routes" && item.filterValue) {
                filterRoutes = item.filterValue;
            }
        })
        const users_data = await User.findAll({
            where: where_cause,
            order: [order_cause],
            model: User,
            include: [
                {
                    model: User,
                    as: 'Parent'
                },
                Brand,
                { model: Route, include: [Zone] }
            ],
        })
        let where_data_cause = {};
        buffer_values = [];
        let filtered_user_list = [];
        for (const userItem of users_data) {
            if (filterProjects && filterProjects.length > 0) {
                let user_projects_ids = [];
                for (const brandItem of userItem.dataValues.brands) {
                    user_projects_ids.push(brandItem.dataValues.id);
                }
                let filtered_user_brands = user_projects_ids.filter(brand_id => filterProjects.includes(brand_id));
                if (filtered_user_brands.length === 0) {
                    continue;
                }
            }
            if (filterZones && filterZones.length > 0) {
                let user_zone_ids = [];
                for (const user_route_item of userItem.dataValues.routes) {
                    if (user_route_item.zone) {
                        user_zone_ids.push(user_route_item.zone.id);
                    }
                }
                let filtered_user_zones = user_zone_ids.filter(zone_id => filterZones.includes(zone_id));
                if (filtered_user_zones.length === 0) {
                    continue;
                }
            }
            if (filterRoutes && filterRoutes.length > 0) {
                let user_route_ids = [];
                for (const user_route_item of userItem.dataValues.routes) {
                    user_route_ids.push(user_route_item.id);
                }
                let filtered_user_routes = user_route_ids.filter(routeId => filterRoutes.includes(routeId));
                if (filtered_user_routes.length === 0) {
                    continue;
                }
            }
            buffer_values.push(userItem.id);
            let push_item = {
                ...userItem,
                route_name: userItem.routes.map(route_item => route_item.name).join(", "),
                project_name: userItem.brands.map(brand_item => brand_item.name).join(", "),
                zone_name: "",
                zones: [],
            };
            if (userItem.routes && userItem.routes.length > 0) {
                userItem.routes.map(route_item => {
                    if (route_item.zone) {
                        push_item.zones.push(route_item.zone.name);
                    }
                })
                push_item.zone_name = push_item.zones.join(", ");
            }
            filtered_user_list.push(push_item);
        }
        if (buffer_values.length > 0) {
            where_data_cause["userId"] = { [Op.or]: buffer_values };
        }
        let query_builder_options_holidays = {
            where: where_data_cause,
            include: [
                { model: Holidaypublic, order: [["publicholiday", "ASC"]] }
            ]
        }
        let holiday_data = await Holiday.findAll(query_builder_options_holidays);
        holiday_data = holidayleavesUtils.optimizeHolidayData(holiday_data);

        let query_builder_options_leaves = {
            where: where_data_cause,
            include: [
                { model: Leavepublic, order: [["publicholiday", "ASC"]] }
            ]
        }
        let leave_data = await Leave.findAll(query_builder_options_leaves)
        leave_data = holidayleavesUtils.optimizeLeaveData(leave_data);

        let companyHolidayStaticdays = await holidayleavesUtils.get_holidaystaticdays_intheperiod(filterPeriod);

        let { data, daysOfPeriod, monthsOfPeriod, lastNumberOfWorkingPeople } = holidayleavesUtils.generate_datelist_for_calendarusers(filtered_user_list, filterPeriod["start_date"], filterPeriod["end_date"], holiday_data, leave_data, companyHolidayStaticdays);

        if (sortby !== undefined && (sortby === 'holiday_count' || sortby === 'leaves_count' || sortby === 'zone_name' || sortby === 'project_name' || sortby === 'route_name')) {
            if (sortdesc === "false") {
                data = data.sort((a, b) => (a[sortby] > b[sortby]) ? 1 : ((b[sortby] > a[sortby]) ? -1 : 0))
            }
            else {
                data = data.sort((a, b) => (a[sortby] < b[sortby]) ? 1 : ((b[sortby] < a[sortby]) ? -1 : 0))
            }
        }
        filter.map(item => {
            if (item.columnField === 'holiday_count' || item.columnField === 'leaves_count') {
                if (item.filterValue['from'] !== undefined && item.filterValue['to'] !== undefined && item.filterValue['from'] !== '' && item.filterValue['to'] !== '') {
                    data = data.filter(data_item => data_item[item.columnField] >= item.filterValue
                    ['from'] && data_item[item.columnField] <= item.filterValue
                    ['to'])
                }
                else if (item.filterValue['from'] !== undefined && item.filterValue['from'] !== '') {
                    data = data.filter(data_item => data_item[item.columnField] >= item.filterValue
                    ['from'])
                } else if (item.filterValue['to'] !== undefined && item.filterValue['to'] !== '') {
                    data = data.filter(data_item => data_item[item.columnField] <= item.filterValue
                    ['to'])
                }
            }
        })

        return res.json({
            users_data,
            data,
            daysOfPeriod,
            monthsOfPeriod,
            lastNumberOfWorkingPeople
        })
    },

    get_leavedays_count_intheperiod: async function (req, res) {
        const { startDate, endDate, userId } = req.params;
        let leavedays_count_in_the_period = 0;
        if (startDate && endDate && userId) {
            leavedays_count_in_the_period = await holidayleavesUtils.get_leavedays_count_intheperiod(startDate, endDate, userId);
        }
        res.json({ leavedays_count_in_the_period });
    }
}

module.exports = Self
