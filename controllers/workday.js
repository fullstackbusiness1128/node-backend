const { Sequelize, Company, User, Workday, Holiday, Leave, ExpenseKilometer, Brand } = require('../sequelize')
const HttpStatus = require("http-status-codes");
const excel = require("exceljs");
const fs = require('fs');
const moment = require('moment')
const Op = Sequelize.Op;
const workdayUtils = require('../services/workday.utils');
const logTypes = require('../models/workday').logTypes;
const deviceTypes = require('../models/workday').deviceTypes;
const endStatusTypes = require('../models/workday').endStatus;

const get_extract_data = async (req, is_download_excel) => {
    const { page, itemsPerPage, sortby, sortdesc, filterModel } = req.query;
    let page_num = page === undefined ? 1 : page;
    let page_limit = itemsPerPage === undefined ? 10 : itemsPerPage;
    let filter = filterModel === undefined ? [] : JSON.parse(filterModel);
    let order_cause = [[Sequelize.literal('date DESC, indexNum DESC')]];

    let where_cause = {};
    let username_where_cause = {};
    let buffer_values = [];
    let user_where_cause = await workdayUtils.get_user_where_cause(req.user, true);
    where_cause = { ...user_where_cause };
    filter.map(item => {
        if (item.columnField === 'username') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause['userId'] = { [Op.or]: buffer_values }
        }
        if (item.columnField === 'dni') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause['userId'] = { [Op.or]: buffer_values }
        }
        if (item.columnField === 'date') {
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
    const data = await Workday.findAndCountAll(query_builder_options);

    let tableData = [];
    let parent_list = [];
    let filtered_parent_item = null;
    let mapped_data = {};
    for (const data_item of data.rows) {
        let current_row = data_item.dataValues;
        const {
            startMoment,
            endMoment,
            logType,
            indexNum
        } = current_row;
        let username = "";
        let dni = "";
        let parent_username = "";
        let parentId = "";
        if (current_row.user !== null) {
            username = current_row.user.name + ' ' + current_row.user.surname;
            dni = current_row.user.dni;
            parentId = current_row.user.parent_id;
            if (current_row.user.Parent && current_row.user.Parent !== null) {
                parent_username = current_row.user.Parent.name + ' ' + current_row.user.Parent.surname;
                parentId = current_row.user.Parent.id;
                filtered_parent_item = parent_list.filter(parent_item => parent_item.id === current_row.user.Parent.id);
                if (filtered_parent_item.length === 0) {
                    parent_list.push(current_row.user.Parent.dataValues);
                }
                else {
                    filtered_parent_item = null;
                }
            }
        }
        let dataListPushItem = { startMoment, endMoment, logType, indexNum };
        if (mapped_data[current_row.userId] === undefined) {
            mapped_data[current_row.userId] = {}
        }
        if (mapped_data[current_row.userId][current_row.date] === undefined) {
            mapped_data[current_row.userId][current_row.date] = {
                data_list: [dataListPushItem],
                username,
                parent_username,
                dni,
                parentId,
            }
        } else {
            mapped_data[current_row.userId][current_row.date]['data_list'].push(dataListPushItem);
        }
    }

    for (const [userId, dateListValues] of Object.entries(mapped_data)) {
        for (const [date, valueItem] of Object.entries(dateListValues)) {
            const current_status_of_userdate = workdayUtils.getCurrentStatusOfUserDate(valueItem.data_list);
            tableData.push({
                username: valueItem.username,
                parent_username: valueItem.parent_username,
                dni: valueItem.dni ? valueItem.dni : "",
                parentId: valueItem.parentId,
                date,
                ...current_status_of_userdate
            });
        }
    }

    filter.map(item => {
        if (item.columnField === 'parent_username') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            tableData = tableData.filter(data_item => buffer_values.includes(data_item['parentId']));
        }
        if (item.columnField === 'numberOfPauses') {
            if (item.filterValue['from'] !== undefined && item.filterValue['to'] !== undefined && item.filterValue['from'] !== '' && item.filterValue['to'] !== '') {
                tableData = tableData.filter(data_item => data_item[item.columnField] >= item.filterValue
                ['from'] && data_item[item.columnField] <= item.filterValue
                ['to'])
            }
            else if (item.filterValue['from'] !== undefined && item.filterValue['from'] !== '') {
                tableData = tableData.filter(data_item => data_item[item.columnField] >= item.filterValue
                ['from'])
            } else if (item.filterValue['to'] !== undefined && item.filterValue['to'] !== '') {
                tableData = tableData.filter(data_item => data_item[item.columnField] <= item.filterValue
                ['to'])
            }
        }
    })
    if (sortby !== undefined) {
        if (sortby === "startedAt" || sortby === "endedAt") {
            if (sortdesc === "false") {
                tableData.sort(function (a, b) {
                    var keyA = new Date(a[sortby]),
                        keyB = new Date(b[sortby]);
                    // Compare the 2 dates
                    if (keyA > keyB) return -1;
                    if (keyA < keyB) return 1;
                    return 0;
                });
            }
            else {
                tableData.sort(function (a, b) {
                    var keyA = new Date(a[sortby]),
                        keyB = new Date(b[sortby]);
                    // Compare the 2 dates
                    if (keyA < keyB) return -1;
                    if (keyA > keyB) return 1;
                    return 0;
                });
            }
        } else {
            if (sortdesc === "false") {
                tableData.sort((a, b) => (a[sortby] > b[sortby]) ? 1 : ((b[sortby] > a[sortby]) ? -1 : 0))
            }
            else {
                tableData.sort((a, b) => (a[sortby] < b[sortby]) ? 1 : ((b[sortby] < a[sortby]) ? -1 : 0))
            }
        }
    }

    let total_count = tableData.length;
    if (!is_download_excel) {
        tableData = tableData.slice(page_limit * (page_num - 1), page_limit * page_num);
    }
    return {
        data: tableData,
        total: total_count,
        parent_list,
    }
}

const getMinMaxDateOfWorkdays = async (user_where_cause) => {
    let currentDate = new Date().toISOString().slice(0, 10);
    let [current_year, current_month, current_date] = currentDate.split("-");
    let odates = {
        minDate: [current_year, "01", "01"].join("-"),
        maxDate: currentDate
    };
    const data = await Workday.findOne({
        attributes: [
            [Sequelize.fn('MIN', Sequelize.col("date")), "minDate"],
            [Sequelize.fn('MAX', Sequelize.col("date")), "maxDate"],
        ],
        where: user_where_cause,
    })
    let dates = {
        minDate: null,
        maxDate: null
    };
    if (data.dataValues) {
        const { minDate, maxDate } = data.dataValues;
        dates = {
            minDate, maxDate
        };
    }
    if (dates.minDate > odates.minDate) {
        odates.minDate = dates.minDate;
    }
    if (dates.maxDate > odates.maxDate) {
        odates.maxDate = dates.maxDate;
    }
    return odates;
}

const get_extract_allusersdata = async (req, is_download_excel) => {
    const { page, itemsPerPage, sortby, sortdesc, filterModel } = req.query;
    let page_num = page === undefined ? 1 : page;
    let page_limit = itemsPerPage === undefined ? 10 : itemsPerPage;
    let filter = filterModel === undefined ? [] : JSON.parse(filterModel);
    let order_cause = [[Sequelize.literal('date DESC, indexNum DESC')]];

    let where_cause = {};
    let workday_where_cause = {};
    let buffer_values = [];
    let user_where_cause = await workdayUtils.get_user_where_cause(req.user, true);
    if (user_where_cause['userId']) {
        where_cause = { id: user_where_cause['userId'] };
    }
    where_cause['status'] = "active";

    let dateCriteria = await getMinMaxDateOfWorkdays(user_where_cause);

    filter.map(item => {
        if (item.columnField === 'username') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause['id'] = { [Op.or]: buffer_values }
        }
        if (item.columnField === 'dni') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause['id'] = { [Op.or]: buffer_values }
        }
        if (item.columnField === 'companyLabel') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause['companyCode'] = { [Op.or]: buffer_values }
        }
        if (item.columnField === 'date') {
            if (item.filterValue['from'] !== undefined && item.filterValue['to'] !== undefined && item.filterValue['from'] !== '' && item.filterValue['to'] !== '') {
                dateCriteria['minDate'] = item.filterValue['from'];
                dateCriteria['maxDate'] = item.filterValue['to'];
                workday_where_cause[item.columnField] = {
                    [Op.and]: [
                        { [Op.gte]: item.filterValue['from'] },
                        { [Op.lte]: item.filterValue['to'] },
                    ]
                }
            }
            else if (item.filterValue['from'] !== undefined && item.filterValue['from'] !== '') {
                dateCriteria['minDate'] = item.filterValue['from'];
                workday_where_cause[item.columnField] = { [Op.gte]: item.filterValue['from'] }
            } else if (item.filterValue['to'] !== undefined && item.filterValue['to'] !== '') {
                dateCriteria['maxDate'] = item.filterValue['to'];
                workday_where_cause[item.columnField] = { [Op.lte]: item.filterValue['to'] }
            }
        }
        return item;
    })
    let workday_association = {
        model: Workday,
        order: [order_cause]
    }
    let query_builder_options = {
        where: where_cause,
        include: [
            {
                model: User,
                as: 'Parent'
            },
            Brand,
            Company,
            workday_association,
        ],
    };
    const data = await User.findAndCountAll(query_builder_options);
    let tableData = [];
    let parent_list = [];
    let filtered_parent_item = null;
    let mapped_data = {};
    for (const data_item of data.rows) {
        let current_row = data_item.dataValues;
        let companyLabel = "";
        let parent_username = "";
        let username = current_row.username;
        let user_name_surname = current_row.name + ' ' + current_row.surname;
        let project_name = current_row.brands ? current_row.brands.map(el => el.name).join(", ") : "";
        let dni = current_row.dni;
        let parentId = current_row.parent_id;

        if (current_row.company) {
            companyLabel = current_row.company.name;
        }
        if (current_row.Parent) {
            parent_username = current_row.Parent.name + ' ' + current_row.Parent.surname;
            parentId = current_row.Parent.id;
            filtered_parent_item = parent_list.filter(parent_item => parent_item.id === current_row.Parent.id);
            if (filtered_parent_item.length === 0) {
                parent_list.push(current_row.Parent.dataValues);
            }
            else {
                filtered_parent_item = null;
            }
        }
        if (mapped_data[current_row.id] === undefined) {
            mapped_data[current_row.id] = {}
            mapped_data[current_row.id] = generate_datelist_bykey(dateCriteria, { username, user_name_surname, project_name, dni, parentId, parent_username, companyLabel });
        }
        for (const workdayItem of current_row.workdays) {
            const {
                startMoment,
                endMoment,
                logType,
                indexNum,
                date,
                userId
            } = workdayItem.dataValues;
            let dataListPushItem = { startMoment, endMoment, logType, indexNum };
            if (mapped_data[userId] && mapped_data[userId][date]) {
                mapped_data[userId][date]['data_list'].push(dataListPushItem);
            }
        }
    }

    for (const [userId, dateListValues] of Object.entries(mapped_data)) {
        for (const [date, valueItem] of Object.entries(dateListValues)) {
            const current_status_of_userdate = workdayUtils.getCurrentStatusOfUserDate(valueItem.data_list);
            tableData.push({
                username: valueItem.username,
                user_name_surname: valueItem.user_name_surname,
                project_name: valueItem.project_name,
                parent_username: valueItem.parent_username,
                dni: valueItem.dni ? valueItem.dni : "",
                parentId: valueItem.parentId,
                companyLabel: valueItem.companyLabel,
                date,
                ...current_status_of_userdate
            });
        }
    }
    filter.map(item => {
        if (item.columnField === 'parent_username') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            tableData = tableData.filter(data_item => buffer_values.includes(data_item['parentId']));
        }
        if (item.columnField === 'numberOfPauses') {
            if (item.filterValue['from'] !== undefined && item.filterValue['to'] !== undefined && item.filterValue['from'] !== '' && item.filterValue['to'] !== '') {
                tableData = tableData.filter(data_item => data_item[item.columnField] >= item.filterValue
                ['from'] && data_item[item.columnField] <= item.filterValue
                ['to'])
            }
            else if (item.filterValue['from'] !== undefined && item.filterValue['from'] !== '') {
                tableData = tableData.filter(data_item => data_item[item.columnField] >= item.filterValue
                ['from'])
            } else if (item.filterValue['to'] !== undefined && item.filterValue['to'] !== '') {
                tableData = tableData.filter(data_item => data_item[item.columnField] <= item.filterValue
                ['to'])
            }
        }
    })
    if (sortby !== undefined) {
        if (sortby === "startedAt" || sortby === "endedAt") {
            if (sortdesc === "false") {
                tableData.sort((a, b) => (a[sortby] - b[sortby]))
            }
            else {
                tableData.sort((a, b) => (b[sortby] - a[sortby]))
            }
        }
        else {
            if (sortdesc === "false") {
                tableData.sort((a, b) => (a[sortby] > b[sortby]) ? 1 : ((b[sortby] > a[sortby]) ? -1 : 0))
            }
            else {
                tableData.sort((a, b) => (a[sortby] < b[sortby]) ? 1 : ((b[sortby] < a[sortby]) ? -1 : 0))
            }
        }
    }
    let total_count = tableData.length;
    if (!is_download_excel) {
        tableData = tableData.slice(page_limit * (page_num - 1), page_limit * page_num);
    }
    return {
        data: tableData,
        total: total_count,
        parent_list,
        mapped_data
    }
}

const generate_datelist_bykey = (dateCriteria, data) => {
    let value = {};
    if (dateCriteria.minDate && dateCriteria.maxDate) {
        let start_loop = new Date(dateCriteria.minDate);
        let end_loop = new Date(dateCriteria.maxDate);
        for (let d = start_loop; d <= end_loop; d.setDate(d.getDate() + 1)) {
            let cur_date = new Date(d).toISOString().slice(0, 10);
            value[cur_date] = { ...data, data_list: [] };
        }
        return value;
    } else {
        return null;
    }
}

const Self = {

    getdataperdate: async function (req, res) {
        const { id } = req.user;
        const { logdate } = req.query;
        let data = [];
        let holiday_count = 0;
        let leave_count = 0;
        if (id && logdate) {
            await workdayUtils.setEndLastDateWorkday(id, logdate);
            const datalist = await Workday.findAll({
                where: {
                    userId: id,
                    date: logdate
                },
                order: [["indexNum", "ASC"]],
            })
            for (const item of datalist) {
                let push_item = { ...item.dataValues };
                push_item.duration = workdayUtils.get_duration(push_item.startMoment, push_item.endMoment);
                push_item.logTypeLabel = logTypes[push_item.logType] ? logTypes[push_item.logType] : "";
                data.push(push_item);
            }
            let holiday_leave_where = {
                userId: id,
                startDate: { [Op.lte]: logdate },
                endDate: { [Op.gte]: logdate }
            }
            holiday_count = await Holiday.count({
                where: {
                    ...holiday_leave_where,
                    // status: "APPROVED"
                },
            });
            leave_count = await Leave.count({
                where: {
                    ...holiday_leave_where,
                    // approvalStatus: "APPROVED"
                },
            });
        }
        return res.json({
            logTypes,
            deviceTypes,
            endStatusTypes,
            data,
            holiday_count,
            leave_count,
            isWorkableToday: holiday_count === 0 && leave_count === 0
        })
    },

    logworkday: async function (req, res) {
        const { id } = req.user;
        const { body } = req;
        console.log(body);
        let data = [];
        if (id) {
            const { isStarted, isPaused, logDate, currentDate, endableMoment } = body;
            // let endableMoment = moment(logDate + " 23:59:59").format("YYYY-MM-DD HH:mm:ss");
            let logUTCdatetime = moment(currentDate).format("YYYY-MM-DD HH:mm:ss");
            const registered_data = await Workday.findAll({
                where: {
                    userId: id,
                    date: logDate
                },
                order: [["indexNum", "ASC"]],
            })

            let final_item = null;
            if (registered_data.length > 0) {
                final_item = registered_data[registered_data.length - 1].dataValues;
            }

            let newUpdateId = -1;
            if (isStarted) {
                let push_item = {
                    userId: id,
                    indexNum: final_item !== null ? final_item.indexNum + 1 : 0,
                    date: logDate,
                    startMoment: logUTCdatetime,
                    endableMoment: endableMoment,
                    logType: isPaused ? "PAUSE" : "WORK",
                    endStatus: "NO",
                }
                /** insert device information (devicetype, geolocation) **/
                if (final_item !== null) {
                    const updated = await Workday.update({ endMoment: logUTCdatetime, endableMoment }, { where: { id: final_item.id } })
                    newUpdateId = final_item.id;
                    if (final_item.endStatus === "NO") {
                        const inserted = await Workday.create(push_item);
                        newUpdateId = inserted.id;
                    }
                } else {
                    const inserted = await Workday.create(push_item);
                    newUpdateId = inserted.id;
                }
            } else if (final_item !== null) {
                const updated = await Workday.update({ endMoment: logUTCdatetime, endableMoment, endStatus: "YES" }, { where: { id: final_item.id } })
                newUpdateId = final_item.id;
            }
            console.log('newUpdateId - ', newUpdateId);
        }
        return res.json({
            data,
        })
    },

    getextract: async function (req, res) {
        // const workday_data = await get_extract_data(req);
        const workday_allusersdata = await get_extract_allusersdata(req);
        return res.json({
            // data: workday_data.data,
            // total: workday_data.total,
            // parent_list: workday_data.parent_list,
            // mapped_data: workday_data.mapped_data,
            data: workday_allusersdata.data,
            total: workday_allusersdata.total,
            parent_list: workday_allusersdata.parent_list,
            mapped_data: workday_allusersdata.mapped_data,
        })
    },

    getfilterlist: async function (req, res) {
        const { column, filterValue, isFullText } = req.query;
        let data_list = [];
        if (filterValue !== undefined) {
            let user_where_cause = await workdayUtils.get_user_where_cause(req.user, true);
            if (column === 'username' || column === 'parent_username') {
                let username_where_cause = {};
                username_where_cause = {
                    [Op.or]: [
                        { "name": { [Op.like]: "%" + filterValue + "%" } },
                        { "surname": { [Op.like]: "%" + filterValue + "%" } },
                    ]
                }
                let where_cause = { ...user_where_cause };
                if (user_where_cause['userId']) {
                    where_cause = { id: user_where_cause['userId'] };
                }
                where_cause[Op.or] = [
                    { "name": { [Op.like]: "%" + filterValue + "%" } },
                    { "surname": { [Op.like]: "%" + filterValue + "%" } },
                ];
                let query_builder_options = {
                    where: where_cause,
                    include: [
                        {
                            model: User,
                            as: 'Parent'
                        }
                    ],
                }
                const data = await User.findAll(query_builder_options)
                for (const item of data) {
                    let push_item = { ...item.dataValues };
                    if (column === 'username') {
                        push_item['id'] = push_item.id;
                        push_item['title'] = push_item.name + ' ' + push_item.surname;
                        let filtered_data = data_list.filter(data_item => data_item.id === push_item.id);
                        if (filtered_data.length === 0) {
                            data_list.push(push_item);
                        }
                    } else {
                        if (item.Parent) {
                            let parentItem = item.Parent;
                            push_item['id'] = parentItem.id;
                            push_item['title'] = parentItem.name + ' ' + parentItem.surname;
                            let filtered_data = data_list.filter(data_item => data_item.id === push_item.id);
                            if (filtered_data.length === 0) {
                                data_list.push(push_item);
                            }
                        }
                    }
                }
            } else if (column === 'dni') {
                let username_where_cause = {};
                username_where_cause['dni'] = { [Op.like]: "%" + filterValue + "%" };
                let where_cause = { ...user_where_cause };
                let query_builder_options = {
                    where: where_cause,
                    include: [
                        {
                            model: User,
                            where: username_where_cause,
                            include: [
                                {
                                    model: User,
                                    as: 'Parent'
                                }
                            ]
                        }
                    ],
                }
                const data = await Workday.findAll(query_builder_options)
                for (const item of data) {
                    let push_item = { ...item.dataValues };
                    push_item['id'] = push_item.userId;
                    push_item['title'] = push_item.user.dni;
                    let filtered_data = data_list.filter(data_item => data_item.userId === push_item.userId);
                    if (filtered_data.length === 0) {
                        data_list.push(push_item);
                    }
                }
            } else if (column === 'companyLabel') {
                let where_cause = {};
                where_cause['name'] = { [Op.like]: "%" + filterValue + "%" };
                let query_builder_options = {
                    where: where_cause,
                }
                const data = await Company.findAll(query_builder_options)
                for (const item of data) {
                    let push_item = { ...item.dataValues };
                    push_item['id'] = push_item.id;
                    push_item['title'] = push_item.name;
                    let filtered_data = data_list.filter(data_item => data_item.id === push_item.id);
                    if (filtered_data.length === 0) {
                        data_list.push(push_item);
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

    downloadexcel: async function (req, res) {
        try {
            // let extract_data = await get_extract_data(req, true);
            let extract_data = await get_extract_allusersdata(req, true);
            let data_list = extract_data.data.map((detail => {
                const result = {
                    ...detail
                }
                result.hours_worked = workdayUtils.get_duration_format(result.hours_worked * 1000);
                result.hours_paused = workdayUtils.get_duration_format(result.hours_paused * 1000);
                result.startedAt = result.startedAt ? moment.utc(result.startedAt).format("YYYY-MM-DD HH:mm:ss") : "";
                result.endedAt = result.endedAt ? moment.utc(result.endedAt).format("YYYY-MM-DD HH:mm:ss") : "";
                return result;
            }))
            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("data");
            let columns = [
                { header: "Fecha", key: "date" },
                { header: "Horas Trabajadas", key: "hours_worked" },
                { header: "Comienzo", key: "startedAt" },
                { header: "Final", key: "endedAt" },
                { header: "Número de pausas", key: "numberOfPauses" },
                { header: "Horas Pausadas", key: "hours_paused" },
            ];
            if (req.user.role !== 'gpv' && req.user.role !== 'staff') {
                let insert_cols = [
                    { header: "Nombre de usuario", key: "username" },
                    { header: "Nombre Apellido", key: "user_name_surname" },
                    { header: "Proyecto", key: "project_name" },
                    { header: "DNI", key: "dni" },
                    { header: "Responsable", key: "parent_username" },
                    { header: "Compañía", key: "companyLabel" },
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

    downloadexcelfulldetail: async function (req, res) {
        const { page, itemsPerPage, sortby, sortdesc, filterModel } = req.query;
        let page_num = page === undefined ? 1 : page;
        let page_limit = itemsPerPage === undefined ? 10 : itemsPerPage;
        let filter = filterModel === undefined ? [] : JSON.parse(filterModel);
        let order_cause = [[Sequelize.literal('date DESC, userId DESC, indexNum DESC')]];

        let where_cause = {};
        let username_where_cause = {
            status: "active"
        };
        let buffer_values = [];
        let user_where_cause = await workdayUtils.get_user_where_cause(req.user, true);
        where_cause = { ...user_where_cause };
        filter.map(item => {
            if (item.columnField === 'username') {
                buffer_values = [];
                for (const [key, value] of Object.entries(item.filterValue)) {
                    if (value !== null) buffer_values.push(value);
                }
                if (buffer_values.length > 0) where_cause['userId'] = { [Op.or]: buffer_values }
            }
            if (item.columnField === 'dni') {
                buffer_values = [];
                for (const [key, value] of Object.entries(item.filterValue)) {
                    if (value !== null) buffer_values.push(value);
                }
                if (buffer_values.length > 0) where_cause['userId'] = { [Op.or]: buffer_values }
            }
            if (item.columnField === 'date') {
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
                            Company
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
                            Company
                        ]
                    },
            ],
        }
        const extract_data = await Workday.findAndCountAll(query_builder_options);

        let data_list = extract_data.rows.map((detail => {
            const result = {
                ...detail.dataValues
            }
            result.username = "";
            result.user_name_surname = "";
            result.dni = "";
            result.parent_username = "";
            result.companyLabel = "";
            result.parentId = "";
            result.project_name = "";
            if (result.user !== null) {
                result.project_name = result.user.brands ? result.user.brands.map(el => el.name).join(", ") : "";
                result.username = result.user.username;
                result.user_name_surname = result.user.name + ' ' + result.user.surname;
                result.dni = result.user.dni;
                result.parentId = result.user.parent_id;
                if (result.user.Parent && result.user.Parent !== null) {
                    result.parent_username = result.user.Parent.name + ' ' + result.user.Parent.surname;
                }
                if (result.user.company) {
                    result.companyLabel = result.user.company.name;
                }
            }
            result.logTypeLabel = logTypes[result.logType] ? logTypes[result.logType] : "";
            result.duration = workdayUtils.get_duration(result.startMoment, result.endMoment);
            result.startMoment = moment.utc(result.startMoment).format("YYYY-MM-DD HH:mm:ss");
            result.endMoment = result.endMoment ? moment.utc(result.endMoment).format("YYYY-MM-DD HH:mm:ss") : "";
            return result;
        }))

        filter.map(item => {
            if (item.columnField === 'parent_username') {
                buffer_values = [];
                for (const [key, value] of Object.entries(item.filterValue)) {
                    if (value !== null) buffer_values.push(value);
                }
                data_list = data_list.filter(data_item => buffer_values.includes(data_item['parentId']));
            }
        })

        let workbook = new excel.Workbook();
        let worksheet = workbook.addWorksheet("data");
        let columns = [
            { header: "ID", key: "id" },
            { header: "Fecha", key: "date" },
            { header: "Tipo", key: "logTypeLabel" },
            { header: "Tiempo Total", key: "duration" },
            { header: "Inicio", key: "startMoment" },
            { header: "Final", key: "endMoment" },
        ];
        if (req.user.role !== 'gpv' && req.user.role !== 'staff') {
            let insert_cols = [
                { header: "Nombre de usuario", key: "username" },
                { header: "Nombre Apellido", key: "user_name_surname" },
                { header: "Proyecto", key: "project_name" },
                { header: "DNI", key: "dni" },
                { header: "Responsable", key: "parent_username" },
                { header: "Compañía", key: "companyLabel" },
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
    },

    checkhaskmdatafortoday: async function (req, res) {
        const { userId, curdate } = req.params;
        console.log(userId, curdate);
        let data = { success: false };
        if (userId && curdate) {
            let km_count_fortoday = await ExpenseKilometer.count({
                where: {
                    date: new Date(curdate),
                    userId,
                },
                logging: console.log
            });
            console.log(km_count_fortoday);
            if (km_count_fortoday > 0) {
                data.success = true;
            }
        }
        return res.json(data);
    }

}

module.exports = Self
