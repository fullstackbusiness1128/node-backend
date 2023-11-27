const { Sequelize, Route, User, ExpenseOther, ExpenseType, Liquidation, Static, Holiday, Leave, Brand, Company } = require('../sequelize')
const HttpStatus = require("http-status-codes");
const excel = require("exceljs");
const Op = Sequelize.Op;
const expensesUtils = require('../services/expenses.utils');
const UserRoles = require('../models/user.model').roles;
const emailUtils = require('../services/email.utils');

const get_data = async (req, is_download_excel) => {
    if (!req.user) {
        return res.status(401).send('Authorization required');
    }
    const userId = req.user.id;
    const { page, itemsPerPage, sortby, sortdesc, filterModel, isteam } = req.query;
    let page_num = page === undefined ? 1 : page;
    let page_limit = itemsPerPage === undefined ? 10 : itemsPerPage;
    let filter = filterModel === undefined ? [] : JSON.parse(filterModel);

    let order_cause = [];
    if (sortby !== undefined && sortby !== 'totalKM' && sortby !== 'parentId') {
        switch (sortby) {
            case 'username':
                order_cause = ['user', 'name', sortdesc === "true" ? "DESC" : "ASC"];
                break;
            case 'usertype':
                order_cause = ['user', 'role', sortdesc === "true" ? "DESC" : "ASC"];
                break;
            case 'route':
                order_cause = ['route', 'name', sortdesc === "true" ? "DESC" : "ASC"];
                break;
            case 'approvername':
                order_cause = ['otherapprover', 'name', sortdesc === "true" ? "DESC" : "ASC"];
                break;
            default:
                order_cause = [sortby, sortdesc === "true" ? "DESC" : "ASC"];
                break;
        }
    }
    else {
        order_cause = ["date", "desc"];
    }

    let where_cause = {};
    let username_where_cause = {};
    let route_where_cause = {};
    let approver_where_cause = {};
    let buffer_values = [];
    let user_where_cause = await expensesUtils.get_user_where_cause(req.user, isteam);
    where_cause = { ...user_where_cause };
    filter.map(item => {
        if (item.columnField === 'userId') {
            where_cause['userId'] = item.filterValue;
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
        if (item.columnField === 'route') {
            route_where_cause.name = { [Op.like]: "%" + item.filterValue + "%" };
        }
        if (item.columnField === 'approvername') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause['approverId'] = { [Op.or]: buffer_values }
        }
        // string search
        if ((item.columnField === 'gpv_comment' || item.columnField === 'spv_comment' || item.columnField === 'description') && item.filterValue) {
            where_cause[item.columnField] = { [Op.like]: "%" + item.filterValue + "%" };
        }

        // checkbox search
        if (item.columnField === 'approvalStatus' || item.columnField === 'expenseTypeId') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause[item.columnField] = { [Op.or]: buffer_values }
        }

        // range search - from to
        if (item.columnField === 'amount') {
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

        if (item.columnField === 'date') {
            if (item.filterValue['from'] !== undefined && item.filterValue['to'] !== undefined && item.filterValue['from'] !== '' && item.filterValue['to'] !== '') {
                where_cause.date = {
                    [Op.and]: [
                        { [Op.gte]: new Date(item.filterValue['from']) },
                        { [Op.lte]: new Date(item.filterValue['to']) },
                    ]
                }
            }
            else if (item.filterValue['from'] !== undefined && item.filterValue['from'] !== '') {
                where_cause.date = { [Op.gte]: new Date(item.filterValue['from']) }
            } else if (item.filterValue['to'] !== undefined && item.filterValue['to'] !== '') {
                where_cause.date = { [Op.lte]: new Date(item.filterValue['to']) }
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
            (Object.keys(route_where_cause).length > 0) ? { model: Route, where: route_where_cause } : Route,
            ExpenseType,
            (Object.keys(approver_where_cause).length > 0) ?
                { model: User, as: "otherapprover", where: approver_where_cause } :
                { model: User, as: "otherapprover" },
            {
                model: Static,
            },
        ]
    }
    const data = await ExpenseOther.findAndCountAll(query_builder_options)

    let data_list = [];
    let whole_amount = 0;
    let parent_list = [];
    let filtered_parent_item = null;
    for (let i = 0; i < data.rows.length; i++) {
        let item = data.rows[i].dataValues;
        if (!item.user) continue;
        whole_amount += item.amount;
        if (item.user !== null && item.user.Parent && item.user.Parent !== null) {
            item.parent_username = item.user.Parent.name;
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
            item.parent_username = '';
            item.parentId = null;
        }
        data_list.push(item)
    }
    if (sortby !== undefined && (sortby === 'parentId')) {
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
    })
    let total_count = data_list.length;
    if (!is_download_excel) {
        data_list = data_list.slice(page_limit * (page_num - 1), page_limit * page_num);
    }
    let statistics_data1_other_expenses = await get_statistics_data1_other_expenses(where_cause['userId'] ? { userId: where_cause['userId'] } : {});
    return {
        data: data_list,
        total: total_count,
        whole_amount,
        statistics_data1_other_expenses,
        parent_list,
    };
}

const get_statistics_data1_other_expenses = async (user_criteria) => {
    let return_value = {
        current_pending_approval_lines: 0,
        current_incidence_lines: 0,
        current_totalAmount: 0,
        avg_totalAmount_last6M: 0,
    };
    const difference_length = 6;
    let date = new Date();
    let current_year = date.getFullYear();
    let current_month = date.getMonth() + 1;
    let rest_end_year = current_year;
    let rest_end_month = current_month;
    if (current_month - 1 > 0) {
        rest_end_month = current_month - 1;
    }
    else {
        rest_end_year--;
        rest_end_month = 12 + (current_month - 1);
    }

    let rest_start_year = current_year;
    let rest_start_month = current_month;
    if (current_month - difference_length > 0) {
        rest_start_month = current_month - difference_length;
    }
    else {
        rest_start_year--;
        rest_start_month = 12 + (current_month - difference_length);
    }

    let current_month_first_last_date = expensesUtils.getFirstAndLastDayOfMonth(current_year, current_month);
    let { firstDay, lastDay } = current_month_first_last_date;

    return_value.current_pending_approval_lines = await ExpenseOther.count({
        where: {
            ...user_criteria,
            approvalStatus: {
                [Op.or]: ['Pendiente Aprobación', 'Pendiente']
            }
        }
    })
    return_value.current_incidence_lines = await ExpenseOther.count({
        where: {
            ...user_criteria,
            approvalStatus: 'Incidencia'
        }
    })

    const current_month_data = await ExpenseOther.findAll({
        where: {
            ...user_criteria,
            date: {
                [Op.and]: [
                    { [Op.gte]: new Date(firstDay) },
                    { [Op.lte]: new Date(lastDay) },
                ]
            }
        }
    })
    if (current_month_data) {
        for (const item of current_month_data) {
            return_value.current_totalAmount += item.dataValues.amount;
        }
    }

    let rest_criteria = {
        ...user_criteria,
    }
    if (rest_start_year === rest_end_year) {
        rest_criteria = {
            ...rest_criteria,
            year: { [Op.eq]: rest_start_year },
            month: {
                [Op.and]: [
                    { [Op.lte]: rest_end_month },
                    { [Op.gte]: rest_start_month },
                ]
            }
        }
    }
    else {
        rest_criteria = {
            ...rest_criteria,
            [Op.or]: [
                {
                    [Op.and]: {
                        year: { [Op.eq]: rest_end_year },
                        month: {
                            [Op.and]: [
                                { [Op.lte]: rest_end_month },
                                { [Op.gte]: 1 },
                            ]
                        }
                    }
                },
                {
                    [Op.and]: {
                        year: { [Op.eq]: rest_start_year },
                        month: {
                            [Op.and]: [
                                { [Op.lte]: 12 },
                                { [Op.gte]: rest_start_month },
                            ]
                        }
                    }
                },
            ]
        }
    }
    const rest_month_data = await Liquidation.findAll({
        where: rest_criteria,
    })
    let month_distinct = {};
    if (rest_month_data) {
        for (const item of rest_month_data) {
            return_value.avg_totalAmount_last6M += item.dataValues.expense_total;
            if (!month_distinct[item.dataValues.userId]) {
                month_distinct[item.dataValues.userId] = [];
            }
            if (item.dataValues.otherExpensesDataCount > 0 && !month_distinct[item.dataValues.userId].includes(item.dataValues.month)) {
                month_distinct[item.dataValues.userId].push(item.dataValues.month);
            }
        }
    }
    console.log(month_distinct);
    let month_count = 0;
    for (const [userId, month_list] of Object.entries(month_distinct)) {
        month_count += month_list.length;
    }
    console.log(return_value.avg_totalAmount_last6M, month_count);
    if (month_count > 0) {
        return_value.avg_totalAmount_last6M = (return_value.avg_totalAmount_last6M / month_count).toFixed(2);
    }
    // return_value.avg_totalAmount_last6M = (return_value.avg_totalAmount_last6M / 6).toFixed(2);
    return return_value;
}

const Self = {

    index: async function (req, res) {
        try {
            const oe_data = await get_data(req);
            const expenseTypes = await ExpenseType.findAll({
                order: [['id', 'ASC']]
            })
            const selecteable_routes = await expensesUtils.get_selectable_routes(req.user.id);
            return res.json({
                data: oe_data.data,
                total: oe_data.total,
                whole_amount: oe_data.whole_amount,
                statistics_data1_other_expenses: oe_data.statistics_data1_other_expenses,
                parent_list: oe_data.parent_list,
                expenseTypes,
                user_roles: Object.values(UserRoles),
                selecteable_routes
            })
        } catch (error) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    create: async function (req, res) {
        if (!req.user) {
            res.status(401).send('Authorization required');
        } else {
            let { body } = req
            body = { ...body, userId: req.user.id };
            const data = await expensesUtils.generateLiquidation('others', body);
            return res.status(200).json({ data })
        }
    },

    update: async function (req, res) {
        if (!req.user) {
            res.status(401).send('Authorization required');
        } else {
            let { body, params: { id } } = req
            if (body.approvalStatus === 'Aprobado' || body.approvalStatus === 'Incidencia') {
                body.approverId = req.user.id;
            }
            else {
                body.approverId = null;
            }
            const data = await expensesUtils.generateLiquidation('others', body);
            if (body.approvalStatus === "Incidencia") {
                emailUtils.sendingEmailForIncidence(body.userId, "oe");
            }
            return res.status(200).json({ data })
        }
    },

    delete: async function (req, res) {
        const { id } = req.params;
        const batch_data = await ExpenseOther.findOne({ where: { id } });
        if (batch_data) {
            console.log(batch_data);
            let date_value = batch_data.dataValues.date;
            date_value = date_value.split('-');
            let update_credentials = {
                current_year: date_value[0],
                current_month: date_value[1],
                current_userId: batch_data.dataValues.userId,
            }
            await ExpenseOther.destroy({ where: { id } })
            await expensesUtils.updateCurrentLiquidation("oe", update_credentials);
        }
        return res.status(200).send()
    },

    get_initial_data: async function (req, res) {
        const { date, routeId, userId } = req.params;
        let data = null;
        let isLiquidationApprovedCount = 0;
        if (date && date !== "undefined" && routeId !== undefined) {
            let current_user_id = req.user.id;
            if (userId !== undefined) {
                current_user_id = userId;
            }
            let where_cause = {
                date: new Date(date),
                routeId,
                userId: current_user_id
            }
            const current_other_data = await ExpenseOther.findOne({
                where: where_cause,
                include: [
                    {
                        model: User,
                        include: [
                            {
                                model: User,
                                as: 'Parent'
                            }
                        ]
                    },
                    Route,
                    ExpenseType,
                    { model: User, as: "otherapprover" },
                    {
                        model: Static,
                    },
                ]
            });
            data = current_other_data;
            let other_user_where = {
                date: new Date(date),
                routeId,
                userId: { [Op.not]: current_user_id }
            }
            const other_user_oe_data = await ExpenseOther.findAndCountAll({
                where: other_user_where,
            })

            let current_selected_date = date.split('-');
            if (current_selected_date.length === 3) {
                let current_year = current_selected_date[0];
                let current_month = current_selected_date[1];
                isLiquidationApprovedCount = await Liquidation.count({
                    where: {
                        year: current_year,
                        month: current_month,
                        userId: current_user_id,
                        status: "Aprobada"
                    }
                });
            }

            let isDateOnHolidayLeave = false;
            const holiday_count = await Holiday.count({
                where: {
                    userId: current_user_id,
                    startDate: { [Op.lte]: date },
                    endDate: { [Op.gte]: date },
                },
            })
            const leave_count = await Leave.count({
                where: {
                    userId: current_user_id,
                    startDate: { [Op.lte]: date },
                    endDate: { [Op.gte]: date },
                },
            })
            isDateOnHolidayLeave = holiday_count > 0 || leave_count > 0;
            return res.status(200).json({
                data,
                other_users_data_count: other_user_oe_data.count,
                isLiquidationApprovedCount,
                isDateOnHolidayLeave
            })
        }
        else {
            return res.status(200).json({ data })
        }
    },

    downloadexcel: async function (req, res) {
        try {
            let km_data = await get_data(req, true);
            let data_list = km_data.data.map((detail => {
                const result = {
                    ...detail
                }
                result.username = detail.user ? detail.user.username : '';
                result.user_name_surname = detail.user ? `${detail.user.surname}, ${detail.user.name}` : '';
                result.usertype = detail.user ? detail.user.role : '';
                result.parentName = detail.user && detail.user.Parent ? detail.user.Parent.name + ' ' + detail.user.Parent.surname : '';
                result.route_name = detail.route ? detail.route.name : '';
                result.approver_name = detail.otherapprover ? detail.otherapprover.name + ' ' + detail.otherapprover.surname : '';
                result.expensetype_name = detail.expense_type ? detail.expense_type.name : '';
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
                { header: "Ruta", key: "route_name" },
                { header: "Tipo de gasto", key: "expensetype_name" },
                { header: "Descripcion", key: "description" },
                { header: "Importe", key: "amount" },
                { header: "estado", key: "approvalStatus" },
                { header: "Comentarios Usuario", key: "gpv_comment" },
                { header: "Comentarios Responsable", key: "spv_comment" },
                { header: "Aprobado por", key: "approver_name" },
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
                "attachment; filename=" + "otherexpenses.xlsx"
            );
            return workbook.xlsx.write(res).then(() => res.status(200).send());
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    getfilterlist: async function (req, res) {
        let { isteam } = req.params;
        const { column, filterValue, isFullText } = req.query;
        let data_list = [];
        if (filterValue !== undefined) {
            let user_where_cause = await expensesUtils.get_user_where_cause(req.user, isteam);
            if (column === 'username' || column === 'parentId') {
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
                const data = await ExpenseOther.findAll(query_builder_options)
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
                            { model: User, as: "otherapprover", where: approver_where_cause } :
                            { model: User, as: "otherapprover" },
                    ],
                }
                const data = await ExpenseOther.findAll(query_builder_options)
                for (const item of data) {
                    let push_item = { ...item.dataValues };
                    if (push_item.otherapprover) {
                        push_item['id'] = push_item.approverId;
                        push_item['title'] = push_item.otherapprover.name + ' ' + push_item.otherapprover.surname;
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
