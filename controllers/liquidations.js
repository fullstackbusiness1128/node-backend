const { Sequelize, Route, User, Liquidation, Static, Brand, ExpenseOther, ExpenseType, Company } = require('../sequelize')
const staticController = require('./static');
const HttpStatus = require("http-status-codes");
const excel = require("exceljs");
var PizZip = require('pizzip');
var Docxtemplater = require('docxtemplater');
var fs = require('fs-extra');
var path = require('path');
const libre = require('libreoffice-convert');
var archiver = require('archiver');

const Op = Sequelize.Op;
const Fn = Sequelize.fn;
const expensesUtils = require('../services/expenses.utils');
const emailUtils = require('../services/email.utils');
const UserRoles = require('../models/user.model').roles;
const { costPerKM } = require('../utils');

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
    if (sortby !== undefined && sortby !== 'totalKM' && sortby !== 'total_approved_amount' && sortby !== 'parentId') {
        switch (sortby) {
            case 'username':
                order_cause = ['user', 'name', sortdesc === "true" ? "DESC" : "ASC"];
                break;
            case 'usertype':
                order_cause = ['user', 'role', sortdesc === "true" ? "DESC" : "ASC"];
                break;
            case 'approvername':
                order_cause = ['lqapprover', 'name', sortdesc === "true" ? "DESC" : "ASC"];
                break;
            default:
                order_cause = [sortby, sortdesc === "true" ? "DESC" : "ASC"];
                break;
        }
    }
    else {
        order_cause = [[Sequelize.literal('year DESC, month DESC')]];
    }

    let [cur_y, cur_m] = new Date().toISOString().slice(0, 7).split("-");
    let where_cause = {};
    if (isteam === "team") {
        where_cause = {
            [Op.or]: [
                [{ year: { [Op.lt]: cur_y } }],
                [
                    { year: cur_y },
                    { month: { [Op.lte]: parseInt(cur_m) } }
                ]
            ]
        };
    } else {
        let user_end_date_same_cur_date = false;
        if (req.user.end_date) {
            let [user_end_y, user_end_m] = new Date(req.user.end_date).toISOString().slice(0, 7).split("-");
            if (user_end_y === cur_y && user_end_m === cur_m) {
                user_end_date_same_cur_date = true;
            }
        }
        if (user_end_date_same_cur_date) {
            where_cause = {
                [Op.or]: [
                    [{ year: { [Op.lt]: cur_y } }],
                    [
                        { year: cur_y },
                        { month: { [Op.lte]: parseInt(cur_m) } }
                    ]
                ]
            };
        } else {
            where_cause = {
                [Op.or]: [
                    [{ year: { [Op.lt]: cur_y } }],
                    [
                        { year: cur_y },
                        { month: { [Op.lt]: parseInt(cur_m) } }
                    ]
                ]
            };
        }
    }
    let username_where_cause = {};
    let approver_where_cause = {};
    let buffer_values = [];
    let user_where_cause = await expensesUtils.get_user_where_cause(req.user, isteam);
    where_cause = { ...where_cause, ...user_where_cause };
    filter.map(item => {
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
        if ((item.columnField === 'gpv_comment' || item.columnField === 'spv_comment') && item.filterValue) {
            where_cause[item.columnField] = { [Op.like]: "%" + item.filterValue + "%" };
        }

        // checkbox search
        if (item.columnField === 'status') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause[item.columnField] = { [Op.or]: buffer_values }
        }

        // range search - from to
        if (item.columnField === 'year' || item.columnField === 'month' || item.columnField === 'km_total' || item.columnField === 'km_pending_approval' || item.columnField === 'expense_total' || item.columnField === 'expense_pending_approval') {
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
            (Object.keys(approver_where_cause).length > 0) ?
                { model: User, as: "lqapprover", where: approver_where_cause } :
                { model: User, as: "lqapprover" },
            {
                model: Static,
                as: "lqdocument"
            },
            {
                model: Static,
                as: "responsabledocument"
            },
        ],
    }
    const data = await Liquidation.findAndCountAll(query_builder_options)

    let data_list = [];
    let parent_list = [];
    let filtered_parent_item = null;
    let user_list = [];
    let filtered_user_item = null;
    for (let i = 0; i < data.rows.length; i++) {
        let item = data.rows[i].dataValues;
        item.km_total_currency = item.km_total * costPerKM;
        item.km_pendingapproval_currency = item.km_pending_approval * costPerKM;
        item.total_approved_amount = item.km_total_currency + item.expense_total;
        if (item.user !== null && item.user.Parent && item.user.Parent !== null) {
            filtered_user_item = user_list.filter(user_item => user_item.id === item.user.id);
            if (filtered_user_item.length === 0) {
                user_list.push({ ...item.user.dataValues, title: item.user.name + ' ' + item.user.surname });
            }
            else {
                filtered_user_item = null;
            }
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
        function getFileExt(filename) {
            let ext = filename.split(".");
            if (ext.length > 0) {
                return ext[ext.length - 1];
            }
            return "pdf";
        }
        item.lqdocumentext = null;
        item.responsabledocumentext = null;
        if (item.lqdocument && item.lqdocument.file) {
            item.lqdocumentext = getFileExt(item.lqdocument.file);
        }
        if (item.responsabledocument && item.responsabledocument.file) {
            item.responsabledocumentext = getFileExt(item.responsabledocument.file);
        }
        data_list.push(item);
    }
    if (sortby !== undefined && (sortby === 'parentId' || sortby === 'total_approved_amount')) {
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
        else if (item.columnField === 'total_approved_amount') {
            if (item.filterValue['from'] !== undefined && item.filterValue['to'] !== undefined && item.filterValue['from'] !== '' && item.filterValue['to'] !== '') {
                data_list = data_list.filter(data_item => data_item[item.columnField] >= item.filterValue['from'] && data_item[item.columnField] <= item.filterValue['to'])
            }
            else if (item.filterValue['from'] !== undefined && item.filterValue['from'] !== '') {
                data_list = data_list.filter(data_item => data_item[item.columnField] >= item.filterValue['from'])
            } else if (item.filterValue['to'] !== undefined && item.filterValue['to'] !== '') {
                data_list = data_list.filter(data_item => data_item[item.columnField] <= item.filterValue['to'])
            }
        }
    })
    let total_count = data_list.length;
    let statistics_data_liquidation = await get_statistics_data_liquidation(where_cause['userId'] ? { userId: where_cause['userId'] } : {});
    if (!is_download_excel) {
        data_list = data_list.slice(page_limit * (page_num - 1), page_limit * page_num);
    }
    return {
        data: data_list,
        total: total_count,
        parent_list,
        user_list,
        statistics_data_liquidation
    };
}

const get_statistics_data_liquidation = async (user_criteria) => {
    let return_value = {
        current_pending_signature_lines: 0,
        current_incidence_lines: 0,
        current_total_amount: 0,
        avg_total_amount_last6M: 0,
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

    return_value.current_pending_signature_lines = await Liquidation.count({
        where: {
            ...user_criteria,
            status: 'Pdte Firma Empleado'
        }
    })
    return_value.current_incidence_lines = await Liquidation.count({
        where: {
            ...user_criteria,
            status: 'Incidencia'
        }
    })

    const current_month_data = await Liquidation.findAll({
        where: {
            ...user_criteria,
            year: current_year,
            month: current_month
        }
    })
    if (current_month_data) {
        for (const item of current_month_data) {
            let data_item = item.dataValues;
            // return_value.current_total_amount += data_item.km_total * costPerKM + data_item.expense_total;
            return_value.current_total_amount += (data_item.km_total + data_item.km_incidence_total + data_item.km_pending_approval) * costPerKM + (data_item.expense_total + data_item.expense_incidence_total + data_item.expense_pending_approval);
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
            let data_item = item.dataValues;
            return_value.avg_total_amount_last6M += data_item.km_total * costPerKM + data_item.expense_total;
            if (!month_distinct[item.dataValues.userId]) {
                month_distinct[item.dataValues.userId] = [];
            }
            if (!month_distinct[item.dataValues.userId].includes(item.dataValues.month)) {
                month_distinct[item.dataValues.userId].push(item.dataValues.month);
            }
        }
    }
    let month_count = 0;
    for (const [userId, month_list] of Object.entries(month_distinct)) {
        month_count += month_list.length;
    }
    if (month_count > 0) {
        return_value.avg_total_amount_last6M = (return_value.avg_total_amount_last6M / month_count).toFixed(2);
    }

    // return_value.avg_total_amount_last6M = (return_value.avg_total_amount_last6M / 6).toFixed(2);
    return return_value;
}

/********** convert docx to pdf with libreoffice **********/
function convertToPdf(inputDocFilePathWithFileName, outputDocFilePathWithFileName, callback) {
    try {
        const file = fs.readFileSync(inputDocFilePathWithFileName);
        libre.convert(file, "pdf", undefined, (err, done) => {
            if (err) {
                callback(err);
                console.log(`Error converting file: ${err}`);
            }
            fs.writeFileSync(outputDocFilePathWithFileName, done);
            callback(null, { filename: outputDocFilePathWithFileName });
        });
    } catch (error) {
        callback(error);
        console.log(error);
        return;
    }
}

const Self = {

    index: async function (req, res) {
        const lq_data = await get_data(req);
        const companies = await Company.findAll();
        return res.json({
            data: lq_data.data,
            total: lq_data.total,
            statistics_data_liquidation: lq_data.statistics_data_liquidation,
            parent_list: lq_data.parent_list,
            user_list: lq_data.user_list,
            user_roles: Object.values(UserRoles),
            companies,
        })
    },

    update: async function (req, res) {
        if (!req.user) {
            res.status(401).send('Authorization required');
        } else {
            let { body, params: { id } } = req
            if (body.attachment_document && (body.status === 'Pdte Firma Empleado' || body.status === 'Incidencia')) {
                body.status = 'Pdte Firma Responsable';
                const current_data = await Liquidation.findOne({
                    where: { id }
                })
                if (current_data) {
                    const static_id = current_data.attachment_document;
                    if (static_id) {
                        await staticController.deleteImage(static_id);
                    }
                }
            }
            if (body.status === 'Incidencia' || body.status === 'Aprobada') {
                body.approverId = req.user.id;
            }
            else {
                body.approverId = null;
            }
            if (body.status === "Incidencia") {
                emailUtils.sendingEmailForIncidence(body.userId, "lq");
            }
            const data = await Liquidation.update(body, { where: { id } })
            return res.status(200).json({ data })
        }
    },

    downloaddoctemplate: async function (req, res) {
        const { id } = req.params;
        try {
            let liquidation_data = await Liquidation.findOne({
                where: { id },
                include: [
                    {
                        model: User,
                        include: [
                            {
                                model: User,
                                as: 'Parent'
                            },
                            Company
                        ]
                    },
                ]
            });
            if (!liquidation_data) res.json({ success: false });

            liquidation_data = liquidation_data.dataValues;
            let date = new Date(liquidation_data.year + "-" + liquidation_data.month + "-02");
            let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
            let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            firstDay = firstDay.toISOString().slice(0, 10);
            lastDay = lastDay.toISOString().slice(0, 10);
            let month_letter_list = [
                'Enero',
                'Febrero',
                'Marzo',
                'Abril',
                'Mayo',
                'Junio',
                'Julio',
                'Agosto',
                'Septiembre',
                'Octubre',
                'Noviembre',
                'Diciembre',
            ]
            let doc_data = {
                year: liquidation_data.year,
                month: liquidation_data.month,
                user_name: '',
                user_surname: '',
                user_dni: '',
                parent_name: '',
                // user: liquidation_data.user.dataValues,
                // parent: liquidation_data.user.dataValues.Parent,
                km_total: liquidation_data.km_total,
                km_total_price: expensesUtils.currency_format((costPerKM * liquidation_data.km_total)),
                lodgment_data: [],
                food_data: [],
                other_data: [],
                transport_data: [],
                lodgment_sum: 0,
                transport_sum: 0,
                food_sum: 0,
                otherexpenses_sum: 0,
                total_sum: 0,
                companyCode: 1,
                vatCode: null
            }
            doc_data.month = month_letter_list[doc_data.month - 1];
            // doc_data.transport_sum = doc_data.km_total_price;

            let templateName = `../template/liquidation_sign_template_1.docx`;
            if (liquidation_data.user) {
                let user_item = liquidation_data.user.dataValues;
                doc_data.user_name = user_item.name;
                doc_data.user_surname = user_item.surname;
                doc_data.user_dni = user_item.dni === null ? '' : user_item.dni;
                if (user_item.Parent) {
                    doc_data.parent_name = user_item.Parent.dataValues.name + ' ' + user_item.Parent.dataValues.surname;
                }
                doc_data.companyCode = user_item.companyCode;
                if (user_item.company) {
                    templateName = `../template/${user_item.company.docTemplateName}`;
                    doc_data.vatCode = user_item.company.vatCode;
                }
            }

            let where_cause = {
                userId: liquidation_data.userId,
                date: {
                    [Op.and]: [
                        { [Op.gte]: firstDay },
                        { [Op.lte]: lastDay }
                    ]
                },
            }
            let lodgment_data = await ExpenseOther.findAll({
                where: {
                    ...where_cause,
                    expenseTypeId: 1,
                }
            })
            for (const lodgment of lodgment_data) {
                const { description, date, amount } = lodgment.dataValues;
                let item = { date, amount, description: description === null ? '' : description }
                item.amount = expensesUtils.currency_format(item.amount);
                doc_data.lodgment_sum += amount;
                doc_data.lodgment_data.push(item);
            }
            let food_data = await ExpenseOther.findAll({
                where: {
                    ...where_cause,
                    expenseTypeId: 6,
                }
            })
            for (const food of food_data) {
                const { description, date, amount } = food.dataValues;
                let item = { date, amount, description: description === null ? '' : description }
                item.amount = expensesUtils.currency_format(item.amount);
                doc_data.food_sum += amount;
                doc_data.food_data.push(item);
            }
            let other_data = await ExpenseOther.findAll({
                where: {
                    ...where_cause,
                    // expenseTypeId: 7,
                    expenseTypeId: {
                        [Op.or]: [
                            7, // Other - Compra Muestra de Producto
                            8, // Other - Material de Oficina
                            9, // Other - Correos y Mensajeria
                        ]
                    }
                },
                include: [
                    ExpenseType
                ],
            })
            for (const other_item of other_data) {
                const { description, date, amount, expenseTypeId } = other_item.dataValues;
                let item = {
                    date,
                    amount,
                    description: description === null ? '' : description, expenseTypeId,
                    expenseTypeName: ""
                }
                if (other_item.dataValues.expense_type) {
                    item.expenseTypeName = other_item.dataValues.expense_type.name;
                }
                item.amount = expensesUtils.currency_format(item.amount);
                doc_data.otherexpenses_sum += amount;
                doc_data.other_data.push(item);
            }
            let transport_where = {
                userId: liquidation_data.userId,
                date: {
                    [Op.and]: [
                        { [Op.gte]: new Date(firstDay) },
                        { [Op.lte]: new Date(lastDay) }
                    ]
                },
                expenseTypeId: {
                    [Op.and]: [
                        { [Op.not]: 1 }, // Lodgment
                        { [Op.not]: 6 }, // Food
                        { [Op.not]: 7 }, // Other - Compra Muestra de Producto
                        { [Op.not]: 8 }, // Other - Material de Oficina
                        { [Op.not]: 9 }, // Other - Correos y Mensajeria
                    ]
                }
            }
            let transport_data = await ExpenseOther.findAll({
                attributes: ["id", [Fn('COUNT', Sequelize.col('expense_other.id')), 'num_bills'], [Fn('SUM', Sequelize.col('amount')), 'total_amount_per_type']],
                where: transport_where,
                group: ['expenseTypeId'],
                order: [['expenseTypeId', 'ASC']],
                include: [
                    ExpenseType
                ],
            })
            for (const transport_item of transport_data) {
                let item = {
                    num_bills: transport_item.dataValues.num_bills,
                    total_amount_per_type: transport_item.dataValues.total_amount_per_type,
                    expenseTypeName: '',
                }
                if (transport_item.dataValues.expense_type) {
                    item.expenseTypeName = transport_item.dataValues.expense_type.name;
                }
                doc_data.transport_sum += item.total_amount_per_type;
                item.total_amount_per_type = expensesUtils.currency_format(item.total_amount_per_type);
                doc_data.transport_data.push(item);
            }
            doc_data.total_sum = expensesUtils.currency_format(doc_data.lodgment_sum + doc_data.transport_sum + doc_data.food_sum + doc_data.otherexpenses_sum + (costPerKM * liquidation_data.km_total));
            doc_data.lodgment_sum = expensesUtils.currency_format(doc_data.lodgment_sum);
            doc_data.transport_sum = expensesUtils.currency_format(doc_data.transport_sum);
            doc_data.food_sum = expensesUtils.currency_format(doc_data.food_sum);
            doc_data.otherexpenses_sum = expensesUtils.currency_format(doc_data.otherexpenses_sum);


            //Load the docx file as a binary
            var content = fs.readFileSync(path.resolve(__dirname, templateName), 'binary');
            var zip = new PizZip(content);
            var doc = new Docxtemplater();
            doc.loadZip(zip);
            doc.setData(doc_data);
            try {
                // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
                doc.render()
            }
            catch (error) {
                var e = {
                    message: error.message,
                    name: error.name,
                    stack: error.stack,
                    properties: error.properties,
                }
                console.log(JSON.stringify({ error: e }));
                // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
                throw error;
            }
            const buf = doc.getZip().generate({ type: "nodebuffer" });
            const dir = __basedir + "/resources/downloadstmp";
            if (!fs.existsSync(dir)) fs.mkdirSync(dir);
            const download_filename = "/resources/downloadstmp/liquidation-sign-" + id + ".docx";
            const file = __basedir + download_filename;
            fs.writeFileSync(file, buf);

            convertToPdf(file, file.slice(0, -4) + "pdf", (err, result) => {
                if (err) {
                    console.log(err);
                    return res
                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .json({ err, success: false });
                }
                res.setHeader(
                    "Content-disposition",
                    "attachment; filename=liquidation_to_sign.pdf"
                );
                const filestream = fs.createReadStream(result.filename);
                filestream.pipe(res);
            });
        } catch (error) {
            console.log(error);
            res
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .json({ success: false, error });
        }
    },

    updatedocument: async function (req, res) {
        if (!req.user) {
            res.status(401).send('Authorization required');
        } else {
            let { body, params: { id } } = req
            const current_data = await Liquidation.findOne({
                where: { id }
            })
            if (current_data) {
                const static_id = current_data.attachment_document;
                if (static_id) {
                    await staticController.deleteImage(static_id);
                }
            }
            if (body.attachment_document) {
                body.status = 'Pdte Firma Responsable';
            }
            const data = await Liquidation.update(body, { where: { id } })
            return res.status(200).json({ data })
        }
    },

    updateresponsablesigneddocument: async function (req, res) {
        if (!req.user) {
            res.status(401).send('Authorization required');
        } else {
            let { body, params: { id } } = req
            const current_data = await Liquidation.findOne({
                where: { id }
            })
            if (current_data) {
                const static_id = current_data.responsable_sign_document;
                if (static_id) {
                    await staticController.deleteImage(static_id);
                }
            }
            const data = await Liquidation.update(body, { where: { id } })
            return res.status(200).json({ success: true })
        }
    },

    deleteDocument: async function (req, res) {
        let { params: { id } } = req
        const current_data = await Liquidation.findOne({
            where: { id }
        })
        if (current_data) {
            const static_id = current_data.attachment_document;
            if (static_id) {
                await staticController.deleteFile(static_id);
            }
        }
        let body = {
            status: 'Pdte Firma Empleado'
        }
        const data = await Liquidation.update(body, { where: { id } })
        return res.status(200).json({ data })
    },

    deleteResponsibleSignedDocument: async function (req, res) {
        let { params: { id } } = req
        const current_data = await Liquidation.findOne({
            where: { id }
        })
        if (current_data) {
            const static_id = current_data.responsable_sign_document;
            if (static_id) {
                await staticController.deleteFile(static_id);
            }
        }
        return res.status(200).json({ success: true })
    },

    downloadexcelsage: async function (req, res) {
        const { year, month, companyCode } = req.params;
        let sage_data = await expensesUtils.getSageData(req.user, year, month, companyCode);
        let seat_num = sage_data.seat_num;
        let data_list = sage_data.data.map((detail => {
            const result = {
                ...detail
            }
            result.amount = Number(parseFloat(result.amount).toFixed(2)).toLocaleString("es", {
                minimumFractionDigits: 2
            });
            if (seat_num && seat_num[result.company_code] && seat_num[result.company_code][result.userId]) {
                result.seat_num = seat_num[result.company_code][result.userId];
            } else {
                result.seat_num = 1;
            }
            return result;
        }))
        let workbook = new excel.Workbook();
        let worksheet = workbook.addWorksheet("data");
        let columns = [
            { header: "CódigoEmpresa", key: "company_code" },
            { header: "CargoAbono", key: "payment_charge" },
            { header: "CodigoCuenta", key: "account_code" },

            { header: "Contrapartida", key: "others" },
            // { header: "NumeroPeriodo", key: "others" },
            { header: "Asiento", key: "seat_num" },
            { header: "TipoDocumento", key: "others" },

            { header: "DocumentoConta", key: "document_account" },
            { header: "Comentario", key: "commentary" },
            { header: "FechaAsiento", key: "date" },
            { header: "ImporteAsiento", key: "amount" },
        ];

        worksheet.columns = columns;
        worksheet.addRows(data_list);
        const cell = worksheet.getColumn(10);
        cell.eachCell((c, rowNumber) => { c.numFmt = '#,##0'; });
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
                const data = await Liquidation.findAll(query_builder_options)
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
                            { model: User, as: "lqapprover", where: approver_where_cause } :
                            { model: User, as: "lqapprover" },
                    ],
                }
                const data = await Liquidation.findAll(query_builder_options)
                for (const item of data) {
                    let push_item = { ...item.dataValues };
                    if (push_item.lqapprover) {
                        push_item['id'] = push_item.approverId;
                        push_item['title'] = push_item.lqapprover.name + ' ' + push_item.lqapprover.surname;
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

    downloadpdf: async function (req, res) {
        let { body } = req;
        console.log(body);
        let criteria = await expensesUtils.get_pdf_criteria({ start_date: body.start_year + '-' + body.start_month, end_date: body.end_year + '-' + body.end_month });
        let where_cause = { ...criteria.where_cause };
        let folder_name_users = '';
        if (body.users && body.users.length > 0) {
            where_cause['userId'] = { [Op.or]: body.users };
            folder_name_users = '_' + body.users.join("");
        }
        let user_where_cause = {};
        let folder_name_companycode = '';
        if (body.companyCode) {
            user_where_cause['companyCode'] = body.companyCode;
            folder_name_companycode = '_' + body.companyCode;
        }
        console.log(where_cause);
        let query_builder_options = {
            where: where_cause,
            include: [
                (Object.keys(user_where_cause).length > 0) ?
                    {
                        model: User,
                        where: user_where_cause,
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
                {
                    model: Static,
                    as: "responsabledocument"
                },
            ],
        }
        const data = await Liquidation.findAll(query_builder_options);
        let originalFilePath = __basedir + '/assets/files/';
        let copyPath = __basedir + "/resources/downloadpdf/";
        if (!fs.existsSync(copyPath)) {
            console.log('Directory not found.');
            fs.mkdirSync(copyPath);
        }

        let folder_name = new Date().valueOf() + '_' + body.start_year + '_' + body.start_month + '_' + body.end_year + '_' + body.end_month + folder_name_users + folder_name_companycode;
        console.log(folder_name);
        if (!fs.existsSync(copyPath + folder_name)) {
            console.log('Directory not found.');
            fs.mkdirSync(copyPath + folder_name);
        }
        let copiedfiles = [];
        for (const dataItem of data) {
            let item = dataItem.dataValues;
            if (item.responsabledocument && item.user) {
                let filenames = item.responsabledocument.dataValues.file.split('.');
                let file_ext = filenames[filenames.length - 1];
                if (file_ext === 'pdf') {
                    let new_file_name = item.user.name.replace(' ', '_') + '_' + item.user.surname.replace(' ', '_') + '_' + item.year + '_' + item.month + '.' + file_ext;
                    let original_file = item.responsabledocument.dataValues.file;
                    console.log(original_file, new_file_name);
                    if (fs.existsSync(originalFilePath + '/' + original_file)) {
                        console.log('fileDirectory found.');
                        fs.copySync(path.resolve(originalFilePath, original_file), path.resolve(copyPath + folder_name, new_file_name));
                        copiedfiles.push(new_file_name);
                    }
                }
            }
        }
        if (copiedfiles.length > 0) {
            var zipArchive = archiver('zip', {
                gzip: true,
                zlib: { level: 9 } // Sets the compression level.
            });
            var output = fs.createWriteStream(path.join(copyPath, folder_name + '.zip'));
            zipArchive.pipe(output);
            await zipArchive.directory(copyPath + folder_name, folder_name);
            await zipArchive.finalize();
            fs.rmSync(copyPath + folder_name, { recursive: true, force: true });
            res.setHeader(
                "Content-disposition",
                "attachment; filename=" + folder_name + ".zip"
            );
            const filestream = fs.createReadStream(copyPath + folder_name + ".zip");
            filestream.pipe(res);
        } else {
            res.status(HttpStatus.OK).json({ message: "File not found." });
        }
    },

    downloadexcel: async function (req, res) {
        try {
            let lq_data = await get_data(req, true);
            let data_list = lq_data.data.map((detail => {
                const result = {
                    ...detail
                }
                result.username = detail.user ? detail.user.username : '';
                result.user_name_surname = detail.user ? `${detail.user.surname}, ${detail.user.name}` : '';
                result.usertype = detail.user ? detail.user.role : '';
                result.parentName = detail.user && detail.user.Parent ? detail.user.Parent.name + ' ' + detail.user.Parent.surname : '';
                result.project_name = result.user.brands ? result.user.brands.map(el => el.name).join(", ") : "";

                result.km_total_currency = Number(parseFloat(result.km_total_currency).toFixed(2)).toLocaleString("es", {
                    minimumFractionDigits: 2
                });
                result.km_pendingapproval_currency = Number(parseFloat(result.km_pendingapproval_currency).toFixed(2)).toLocaleString("es", {
                    minimumFractionDigits: 2
                });
                result.expense_total = Number(parseFloat(result.expense_total).toFixed(2)).toLocaleString("es", {
                    minimumFractionDigits: 2
                });
                result.expense_pending_approval = Number(parseFloat(result.expense_pending_approval).toFixed(2)).toLocaleString("es", {
                    minimumFractionDigits: 2
                });
                result.total_approved_amount = Number(parseFloat(result.total_approved_amount).toFixed(2)).toLocaleString("es", {
                    minimumFractionDigits: 2
                });
                result.approver_name = detail.lqapprover ? detail.lqapprover.name + ' ' + detail.lqapprover.surname : '';
                result.companyName = "";
                if (detail.user && detail.user.company) {
                    result.companyName = detail.user.company.name;
                }
                return result;
            }))
            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("data");
            let columns = [
                { header: "Año", key: "year" },
                { header: "Mes", key: "month" },
                { header: "KM Aprobados(€)", key: "km_total_currency" },
                { header: "KM Aprobados(KM)", key: "km_total" },
                { header: "KM Pdte Aprob(€)", key: "km_pendingapproval_currency" },
                { header: "KM Pdte Aprob(KM)", key: "km_pending_approval" },
                { header: "Otros gastos Aprobados", key: "expense_total" },
                { header: "Otros gastos Pdte Aprob", key: "expense_pending_approval" },
                { header: "Total Importe(€)", key: "total_approved_amount" },
                { header: "Comentarios Usuario", key: "gpv_comment" },
                { header: "Comentarios Responsable", key: "spv_comment" },
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
                columns = [...columns.slice(0, 2), ...insert_cols, ...columns.slice(2)]
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

}

module.exports = Self
