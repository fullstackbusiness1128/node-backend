const { Sequelize, User, Holiday, Holidaypublic, Leave, Leavepublic, Holidaystaticdays, Static, Brand, Company } = require('../sequelize')
const HttpStatus = require("http-status-codes");
const excel = require("exceljs");
const fs = require('fs');
const Op = Sequelize.Op;
const staticController = require('./static');
const holidayleavesUtils = require('../services/holidayleaves.utils');
const expensesUtils = require('../services/expenses.utils');
const emailUtils = require('../services/email.utils');
const approvalStatusTypes = require('../models/leave').approvalStatus;
const closeStatusTypes = require('../models/leave').closeStatus;
const UserRoles = require('../models/user.model').roles;
const { holidaysPerYear, staticPublicHolidays } = require('../utils');

const get_data = async (req, is_download_excel) => {
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
                order_cause = ['leaveapprover', 'name', sortdesc === "true" ? "DESC" : "ASC"];
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
    console.log('user_where_cause - ', user_where_cause);
    where_cause = { ...user_where_cause };
    filter.map(item => {
        if (item.columnField === 'date' || item.columnField === 'startDate' || item.columnField === 'endDate' || item.columnField === 'next_review_date') {
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
        if (item.columnField === 'approvalStatus') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                let statusKey = Object.keys(approvalStatusTypes).find(key => approvalStatusTypes[key] === value);
                if (statusKey && value !== null) buffer_values.push(statusKey);
            }
            if (buffer_values.length > 0) where_cause[item.columnField] = { [Op.or]: buffer_values }
        }
        if (item.columnField === 'closeStatus') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                let statusKey = Object.keys(closeStatusTypes).find(key => closeStatusTypes[key] === value);
                if (statusKey && value !== null) buffer_values.push(statusKey);
            }
            if (buffer_values.length > 0) where_cause[item.columnField] = { [Op.or]: buffer_values }
        }
        return item;
    })
    console.log('user_where_cause - ', where_cause);

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
            { model: Leavepublic, order: [["publicholiday", "ASC"]] },
            (Object.keys(approver_where_cause).length > 0) ?
                { model: User, as: "leaveapprover", where: approver_where_cause } :
                { model: User, as: "leaveapprover" },
            {
                model: Static,
                as: "leavedocument"
            },
        ],
    }
    const data = await Leave.findAndCountAll(query_builder_options)

    let data_list = [];
    let parent_list = [];
    let filtered_parent_item = null;
    for (let i = 0; i < data.rows.length; i++) {
        let item = data.rows[i].dataValues;
        if (item.user !== null && item.user.Parent && item.user.Parent !== null) {
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
        item.daysStatus = holidayleavesUtils.get_leavedays_requested(item.startDate, item.endDate, item.leavepublics);
        item.daysrequested = item.daysStatus.request_day;
        item.numberofpublicholidays = item.leavepublics ? item.leavepublics.length : 0;
        item.approvalStatusLabel = approvalStatusTypes[item.approvalStatus] ? approvalStatusTypes[item.approvalStatus] : '';
        item.closeStatusLabel = closeStatusTypes[item.closeStatus] ? closeStatusTypes[item.closeStatus] : '';
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
    let statistics_data = await get_statistics_data(where_cause['userId'] ? { userId: where_cause['userId'] } : {}, isteam);
    return {
        data: data_list,
        total: total_count,
        parent_list,
        statistics_data,
    };
}

const get_statistics_data = async (user_criteria, isteam) => {
    let return_value = {
        daysapproved: 0,
        daysapproved_notarrived: 0,
        incidence_count: 0,
        pendingapproval_lines: 0
    };

    let date = new Date();
    let current_date = new Date().toISOString().slice(0, 10);
    let current_year = date.getFullYear();
    let criteria = {
        ...user_criteria,
    }
    let current_year_criteria = {
        ...criteria,
        startDate: { [Op.gte]: current_year + '-01-01' },
        endDate: { [Op.lte]: current_year + '-12-31' },
    }
    let global_incidence_count = await Leave.count({
        where: {
            ...criteria,
            approvalStatus: "INCIDENCE"
        }
    });
    return_value.incidence_count = global_incidence_count;
    let global_pendingapproval_lines = await Leave.count({
        where: {
            ...criteria,
            approvalStatus: "REGISTERED"
        }
    });
    return_value.pendingapproval_lines = global_pendingapproval_lines;
    let current_year_data = await Leave.findAll({
        where: current_year_criteria,
        include: [
            Leavepublic
        ],
    })
    let user_list = [];
    for (const data_item of current_year_data) {
        const { id, leavepublics, startDate, endDate, approvalStatus, userId } = data_item.dataValues;
        let push_item = { id, leavepublics, startDate, endDate, approvalStatus };
        push_item.daysStatus = holidayleavesUtils.get_leavedays_requested(push_item.startDate, push_item.endDate, push_item.leavepublics);
        push_item.daysrequested = push_item.daysStatus.request_day;
        if (push_item.approvalStatus === "INCIDENCE") {
            // return_value.incidence_count += push_item.daysrequested;
            // return_value.incidence_count ++;
        }
        else if (push_item.approvalStatus === "REGISTERED") {
            // return_value.pendingapproval_lines ++;
        }
        else {
            return_value.daysapproved += push_item.daysrequested;
        }
        if (!user_list.includes(userId)) {
            user_list.push(userId);
        }
    }

    return return_value;
}

const Self = {

    index: async function (req, res) {
        try {
            const leaves_data = await get_data(req);
            let approvalStatusTypesSelect = [];
            for (const item of Object.keys(approvalStatusTypes)) {
                let push_item = {
                    value: item,
                    label: approvalStatusTypes[item]
                }
                approvalStatusTypesSelect.push(push_item);
            }
            let closeStatusTypesSelect = [];
            for (const item of Object.keys(closeStatusTypes)) {
                let push_item = {
                    value: item,
                    label: closeStatusTypes[item]
                }
                closeStatusTypesSelect.push(push_item);
            }

            return res.json({
                data: leaves_data.data,
                total: leaves_data.total,
                parent_list: leaves_data.parent_list,
                staticPublicHolidays,
                approvalStatusTypes,
                approvalStatusTypesSelect,
                closeStatusTypes,
                closeStatusTypesSelect,
                statistics_data: leaves_data.statistics_data,
                user_roles: Object.values(UserRoles),
            })
        } catch (error) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    upsert: async function (req, res) {
        if (!req.user) {
            res.status(401).send('Authorization required');
        } else {
            let { body, params: { id } } = req;
            if (body.approvalStatus === 'APPROVED') {
                body.approverId = req.user.id;
            }
            else {
                body.approverId = null;
            }

            let leaveId = -1;
            if (id === undefined) {
                body = { ...body, userId: req.user.id };
                const data = await Leave.create(body);
                if (data) {
                    leaveId = data.id;
                }
            } else {
                if (id !== undefined && body.documentId) {
                    const current_data = await Leave.findOne({
                        where: { id }
                    })
                    if (current_data && current_data.documentId !== body.documentId) {
                        console.log('upload diffent file');
                        const static_id = current_data.documentId;
                        if (static_id) {
                            await staticController.deleteFile(static_id);
                        }
                    }
                }
                await Leave.update(body, { where: { id } });
                leaveId = id;
            }
            if (leaveId > 0) {
                await Leavepublic.destroy({ where: { leaveId } });
                let new_public_holidays = [];
                for (const holiday_item of body.leavepublics) {
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
                        await Leavepublic.create({
                            leaveId,
                            publicholiday: holiday
                        });
                    }
                }
            }
            if (body.approvalStatus === "INCIDENCE") {
                emailUtils.sendingEmailForIncidence(body.userId, "leaves");
            }

            return res.status(200).json({ leaveId })
        }
    },

    delete: async function (req, res) {
        const { id } = req.params;
        if (id) {
            const current_data = await Leave.findOne({
                where: { id }
            })
            if (current_data && current_data.documentId !== null) {
                await staticController.deleteFile(current_data.documentId);
            }
            await Leave.destroy({ where: { id } })
        }
        return res.status(200).send()
    },

    downloadexcel: async function (req, res) {
        try {
            let leaves_data = await get_data(req, true);
            let data_list = leaves_data.data.map((detail => {
                const result = {
                    ...detail
                }
                result.username = detail.user ? detail.user.username : '';
                result.user_name_surname = detail.user ? detail.user.name + ' ' + detail.user.surname : '';
                result.usertype = detail.user ? detail.user.role : '';
                result.parentName = detail.user && detail.user.Parent ? detail.user.Parent.name + ' ' + detail.user.Parent.surname : '';
                result.approver_name = detail.leaveapprover ? detail.leaveapprover.name + ' ' + detail.leaveapprover.surname : '';
                result.approvalStatus = approvalStatusTypes[result.approvalStatus];
                let holidaypublic_arr = [];
                result.leavepublics.map(item => {
                    holidaypublic_arr.push(item.publicholiday);
                })
                result.leavepublics_arr = holidaypublic_arr.join(", ");
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
                { header: "Festivos", key: "leavepublics_arr" },
                { header: "Abierta / Cerrada", key: "closeStatusLabel" },
                { header: "Fecha siguiente revisión", key: "next_review_date" },
                { header: "Comentarios Usuario", key: "employee_comments" },
                { header: "Comentarios Responsable", key: "responsible_comments" },
                { header: "Aprobado por", key: "approver_name" },
                { header: "estado", key: "approvalStatus" },
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
            datacount = await Leave.count({
                where: criteria,
                logging: console.log
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
                const data = await Leave.findAll({
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
                const data = await Leave.findAll(query_builder_options)
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
                            { model: User, as: "leaveapprover", where: approver_where_cause } :
                            { model: User, as: "leaveapprover" },
                    ],
                }
                const data = await Leave.findAll(query_builder_options)
                for (const item of data) {
                    let push_item = { ...item.dataValues };
                    if (push_item.leaveapprover) {
                        push_item['id'] = push_item.approverId;
                        push_item['title'] = push_item.leaveapprover.name + ' ' + push_item.leaveapprover.surname;
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
}

module.exports = Self
