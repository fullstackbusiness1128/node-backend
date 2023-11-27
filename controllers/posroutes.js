const { Sequelize, Brand, RoutePos, Route, Pos, Survey, RoutePosSurvey } = require('../sequelize')
const excel = require("exceljs");
var _ = require('lodash');
const readXlsxFile = require("read-excel-file/node");
const fs = require("fs");
const HttpStatus = require("http-status-codes");
const { status, weekLetters, periodsCount, weekCount } = require("../models/routePos.model");
const { VISIT_TYPES } = require("../models/routePos.model");
const { convertObjectToSpecific, getObjectValueList } = require("../utils");
const expensesUtils = require("../services/expenses.utils");
const Op = Sequelize.Op;

const get_data = async (req_query, is_download_excel) => {
    const { page, itemsPerPage, sortby, sortdesc, filterModel } = req_query;
    let page_num = page === undefined ? 1 : page;
    let page_limit = itemsPerPage === undefined ? 10 : itemsPerPage;

    let order_cause = [];
    if (sortby !== undefined) {
        if (sortby === "route") {
            order_cause = ['route', 'name', sortdesc === "true" ? "DESC" : "ASC"];
        }
        else if (sortby === "brand") {
            order_cause = ['brand', 'name', sortdesc === "true" ? "DESC" : "ASC"];
        }
        else if (sortby === "pos") {
            order_cause = ['po', 'name', sortdesc === "true" ? "DESC" : "ASC"];
        }
        else {
            order_cause = [sortby, sortdesc === "true" ? "DESC" : "ASC"];
        }
    }
    else {
        order_cause = ["routeId", "ASC"];
        order_cause = [[Sequelize.literal('routeId ASC, posId ASC, brandId ASC, surveyId ASC')]];
    }

    let filter = filterModel === undefined ? [] : JSON.parse(filterModel);
    let where_cause = {};
    let pos_where = {
        isNotRequested: true
    };
    let buffer_values = [];
    filter.map(item => {
        if ((item.columnField === 'route') && item.filterValue) {
            buffer_values = getObjectValueList(item.filterValue);
            if (buffer_values.length > 0) where_cause['routeId'] = { [Op.or]: buffer_values }
        }
        if ((item.columnField === 'brand') && item.filterValue) {
            buffer_values = getObjectValueList(item.filterValue);
            if (buffer_values.length > 0) where_cause['brandId'] = { [Op.or]: buffer_values }
        }
        if ((item.columnField === 'pos') && item.filterValue) {
            buffer_values = getObjectValueList(item.filterValue);
            if (buffer_values.length > 0) where_cause['posId'] = { [Op.or]: buffer_values }
        }
        if ((item.columnField === 'week1') && item.filterValue) {
            buffer_values = getObjectValueList(item.filterValue);
            buffer_values = buffer_values.map(searchitem => {
                return { [Op.like]: `%${searchitem}%` };
            })
            if (buffer_values.length > 0) where_cause['s1'] = { [Op.or]: buffer_values }
        }
        if ((item.columnField === 'week2') && item.filterValue) {
            buffer_values = getObjectValueList(item.filterValue);
            buffer_values = buffer_values.map(searchitem => {
                return { [Op.like]: `%${searchitem}%` };
            })
            if (buffer_values.length > 0) where_cause['s2'] = { [Op.or]: buffer_values }
        }
        if ((item.columnField === 'week3') && item.filterValue) {
            buffer_values = getObjectValueList(item.filterValue);
            buffer_values = buffer_values.map(searchitem => {
                return { [Op.like]: `%${searchitem}%` };
            })
            if (buffer_values.length > 0) where_cause['s3'] = { [Op.or]: buffer_values }
        }
        if ((item.columnField === 'week4') && item.filterValue) {
            buffer_values = getObjectValueList(item.filterValue);
            buffer_values = buffer_values.map(searchitem => {
                return { [Op.like]: `%${searchitem}%` };
            })
            if (buffer_values.length > 0) where_cause['s4'] = { [Op.or]: buffer_values }
        }
        if ((item.columnField === 'status') && item.filterValue) {
            buffer_values = getObjectValueList(item.filterValue);
            if (buffer_values.length > 0) where_cause['status'] = { [Op.or]: buffer_values }
        }
        if ((item.columnField === 'visitType') && item.filterValue) {
            buffer_values = getObjectValueList(item.filterValue);
            if (buffer_values.length > 0) where_cause['visitType'] = { [Op.or]: buffer_values }
        }
        return item;
    })
    let query_builder_options = {
        where: where_cause,
        order: [order_cause],
        include: [
            Brand,
            { model: Pos, where: pos_where },
            Route,
            Survey,
        ]
    }

    const data = await RoutePos.findAndCountAll(query_builder_options)
    let data_list = [];
    let i = 0;
    for (const data_item of data.rows) {
        let push_item = { ...data_item.dataValues };
        push_item.route_label = push_item.route ? push_item.route.name : "";
        push_item.brand_label = push_item.brand ? push_item.brand.name : "";
        push_item.surveyIds = push_item.surveys.map(el => el.id);
        push_item.survey_label = push_item.surveys.map(el => el.name).join(", ");
        push_item.pos_label = push_item.po ? push_item.po.name : "";

        push_item.address_label = "";
        if (push_item.po) {
            push_item.address_label = push_item.po.town + " " + push_item.po.postalCode;
        }
        push_item.visittype_label = "";
        if (push_item.visitType && VISIT_TYPES[push_item.visitType]) {
            push_item.visittype_label = VISIT_TYPES[push_item.visitType];
        }

        push_item.periods_label = "";
        push_item.periods = [];
        for (i = 1; i <= periodsCount; i++) {
            if (push_item["p" + i]) {
                push_item.periods.push(i);
            }
        }
        if (push_item.periods.length > 0) {
            push_item.periods_label = push_item.periods.join(", ");
        }

        push_item.weekdetails = {};
        for (i = 1; i <= weekCount; i++) {
            if (!push_item.weekdetails[i]) {
                push_item.weekdetails[i] = []
            }
            if (push_item["s" + i]) {
                push_item["weeklabel_" + i] = [];
                let weekdaylist = push_item["s" + i].split(",");
                for (let j = 0; j < weekdaylist.length; j++) {
                    let weekday_push_item = {};
                    weekday_push_item[weekdaylist[j]] = weekLetters[weekdaylist[j]];
                    push_item["weeklabel_" + i].push(weekLetters[weekdaylist[j]]);
                    push_item.weekdetails[i].push(weekday_push_item);
                }
            }
            if (push_item["weeklabel_" + i]) {
                push_item["weeklabel_" + i] = push_item["weeklabel_" + i].join(", ");
            }
        }

        data_list.push(push_item);
    }
    filter.map(item => {
        if (item.columnField === 'periods') {
            buffer_values = getObjectValueList(item.filterValue);
            data_list = data_list.filter(data_item => {
                let filtered_data = data_item[item.columnField].filter(selected_item => {
                    if (buffer_values.includes(selected_item.toString())) {
                        return true;
                    }
                })
                if (filtered_data.length > 0) {
                    return true;
                }
            })
        }
        if ((item.columnField === 'survey') && item.filterValue) {
            buffer_values = getObjectValueList(item.filterValue);
            data_list = data_list.filter(data_item => {
                let filtered_data = data_item['surveyIds'].filter(selected_item => {
                    if (buffer_values.includes(selected_item)) {
                        return true;
                    }
                })
                if (filtered_data.length > 0) {
                    return true;
                }
            })
        }
        if (item.columnField === 'address') {
            data_list = data_list.filter(data_item => data_item.address_label.toLowerCase().includes(item.filterValue.toLowerCase()));
        }
    })

    let total_count = data_list.length;
    if (!is_download_excel) {
        data_list = data_list.slice(page_limit * (page_num - 1), page_limit * page_num);
    }

    return {
        data: data_list,
        total: total_count
    }
}

const upsert_routepos = async (item) => {
    let body = _.omit(item, ["id"]);
    let { routeId, posId, surveyIds, brandId } = body;
    let i = 1;
    for (i = 1; i <= weekCount; i++) {
        body['s' + i] = body['s' + i].join(",");
    }
    for (i = 1; i <= periodsCount; i++) {
        body['p' + i] = false;
    }
    body.periods.map(period_item => {
        body['p' + period_item] = true;
    });
    let filtered = await RoutePos.findOne({
        where: {
            routeId, posId, brandId
        }
    });
    let data = null;
    let insertedId = -1;
    if (!filtered) {
        data = await RoutePos.create(body);
        if (data) {
            insertedId = data.id;
        }
    } else {
        data = await RoutePos.update(body, { where: { routeId, posId, brandId } });
        insertedId = filtered.id;
    }
    if (insertedId > 0 && surveyIds.length > 0) {
        await RoutePosSurvey.destroy({ where: { routePosId: insertedId } });
        for (const surveyId of surveyIds) {
            await RoutePosSurvey.create({ routePosId: insertedId, surveyId });
        }
    }
    return data;
}

const get_filter_item = async (isFlag, data) => {
    let where = {};
    let filtered_item = null;
    if (isFlag === "route") {
        const { routeId, routename } = data;
        if (routeId) {
            where = { id: routeId };
        } else {
            where = { name: routename };
        }
        filtered_item = await Route.findOne({ where });
    } else if (isFlag === "brand") {
        const { brandId, brandname } = data;
        if (brandId) {
            where = { id: brandId };
        } else {
            where = { name: brandname };
        }
        filtered_item = await Brand.findOne({ where });
    } else if (isFlag === "survey") {
        let { surveyId, surveyname } = data;
        let survey_list = [];
        if (surveyId) {
            let surveyIds = [];
            if (typeof (surveyId) === "number") {
                surveyIds.push(surveyId);
            } else {
                surveyIds = surveyId.replaceAll(" ", "").split(",");
            }
            if (surveyIds.length > 0) {
                where = { id: { [Op.or]: surveyIds } };
                survey_list = await Survey.findAll({ where });
            }
        } else {
            let surveyNames = surveyname.split(",");
            if (surveyNames.length > 0) {
                where = { name: { [Op.or]: surveyNames } };
                survey_list = await Survey.findAll({ where });
            }
        }
        if (survey_list.length > 0) filtered_item = survey_list.map(item => item.id);
    } else if (isFlag === "pos") {
        const { posId, posname } = data;
        if (posId) {
            where = { id: posId };
        } else {
            where = { name: posname };
        }
        filtered_item = await Pos.findOne({ where });
    }
    return filtered_item;
}

const get_weekday_symbol_list = (data) => {
    let weekdays = data.replaceAll(" ", "").split(",");
    let return_value = [];
    weekdays.map(day_item => {
        let day_symbol = Object.keys(weekLetters).find(key => weekLetters[key] === day_item);
        if (day_symbol) {
            return_value.push(day_symbol);
        }
    })
    return return_value;
}

const Self = {

    index: async function (req, res) {
        const data = await get_data(req.query);
        let statusValues = Object.values(status);
        let visitTypes = [];
        for (const [key, value] of Object.entries(VISIT_TYPES)) {
            visitTypes.push({
                label: value,
                value: key,
            })
        }
        let weekdays = convertObjectToSpecific(weekLetters);
        return res.json({
            data: data.data,
            total: data.total,
            weekdays,
            statusValues,
            periodsCount,
            visitTypes,
            weekCount
        })
    },

    upsert: async function (req, res) {
        let { body } = req;
        let data = await upsert_routepos(body);
        return res.json({ data });
    },

    delete: async function (req, res) {
        for (const [key, value] of Object.entries(req.params)) {
            if (isNaN(parseInt(value))) {
                req.params[key] = null;
            } else {
                req.params[key] = parseInt(value);
            }
        }
        const { routeId, posId, brandId, surveyId } = req.params;
        if (routeId && posId && brandId && surveyId) {
            await RoutePos.destroy({ where: { routeId, posId, brandId, surveyId } });
        }
        return res.status(200).send()
    },

    downloadexcel: async function (req, res) {
        try {
            let posroutes = await get_data(req.query, true);
            posroutes = posroutes.data.map((data_detail => {
                const result = {
                    ...data_detail
                }
                result.surveyIds_label = result.surveyIds.join(", ");
                return result;
            }))
            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("POS Route");
            worksheet.columns = [
                { header: "ID Ruta", key: "routeId" },
                { header: "Ruta Nombre", key: "route_label" },
                { header: "Marca Nombre", key: "brand_label" },
                { header: "Tipo Visita", key: "visittype_label" },
                { header: "ID Formulario", key: "surveyIds_label" },
                { header: "Formulario Nombre", key: "survey_label" },
                { header: "ID POS", key: "posId" },
                { header: "POS Nombre", key: "pos_label" },
                { header: "Dirección", key: "address_label" },
                { header: "Períodos", key: "periods_label" },
                { header: "Semana 1", key: "weeklabel_1" },
                { header: "Semana 2", key: "weeklabel_2" },
                { header: "Semana 3", key: "weeklabel_3" },
                { header: "Semana 4", key: "weeklabel_4" },
                { header: "estado", key: "status" },
            ];
            worksheet.addRows(posroutes);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=" + "Users.xlsx"
            );
            return workbook.xlsx.write(res).then(() => res.status(200).send());
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    uploadexcel: async function (req, res) {
        try {
            if (req.file === undefined) {
                res.status(400).send("Please upload an excel file!");
            }
            let path = __basedir + "/resources/uploadstmp/";
            const required_cols = [
                'visittype',
                'periods',
                'week1',
                'week2',
                'week3',
                'week4',
                'status',
            ];
            const sample_id_cols = [
                'idroute',
                'idbrand',
                'idform',
                'idpos',
            ];
            const sample_name_cols = [
                'routename',
                'brandname',
                'formname',
                'posname',
            ];
            readXlsxFile(path + req.file.filename).then(async (rows) => {
                fs.unlink(path + req.file.filename, (err) => {
                    if (err) throw err;
                });
                let titles = rows[0];
                let original_titles = rows[0];
                titles = titles.map(title => {
                    return title.replaceAll(" ", "").toLowerCase();
                })
                let is_valid_excel_file = true;
                required_cols.map(sample_col => {
                    let filtered = titles.filter(title => sample_col === title);
                    if (filtered.length === 0) {
                        is_valid_excel_file = false;
                    }
                    return sample_col;
                })
                let filtered_id_cols = titles.filter(title => title === "idroute");
                if (filtered_id_cols.length > 0) {
                    sample_id_cols.map(sample_col => {
                        let filtered = titles.filter(title => sample_col === title);
                        if (filtered.length === 0) {
                            is_valid_excel_file = false;
                        }
                        return sample_col;
                    })
                } else {
                    sample_name_cols.map(sample_col => {
                        let filtered = titles.filter(title => sample_col === title);
                        if (filtered.length === 0) {
                            is_valid_excel_file = false;
                        }
                        return sample_col;
                    })
                }
                if (!is_valid_excel_file) {
                    return res.json({
                        success: false,
                        invalidFile: false,
                        message: "The uploaded file is invalid. Please check the column list. Their columns' name should be matched  in English. Following like this - [IDRoute, RouteName, IDBrand, BrandName, IDForm, FormName, IDPOS, POSName, VisitType, Periods, Week1, Week2, Week3, Week4, Status] "
                    });
                }

                rows.shift();
                let count = 0;
                const failedRows = [];
                for (const row of rows) {
                    let data_detail = {
                        routeId: row[titles.indexOf("idroute")],
                        routename: row[titles.indexOf("routename")],
                        brandId: row[titles.indexOf("idbrand")],
                        brandname: row[titles.indexOf("brandname")],
                        surveyId: row[titles.indexOf("idform")],
                        surveyname: row[titles.indexOf("formname")],
                        posId: row[titles.indexOf("idpos")],
                        posname: row[titles.indexOf("posname")],
                        visitType: row[titles.indexOf("visittype")],
                        periods: row[titles.indexOf("periods")],
                        week1: row[titles.indexOf("week1")],
                        week2: row[titles.indexOf("week2")],
                        week3: row[titles.indexOf("week3")],
                        week4: row[titles.indexOf("week4")],
                        status: row[titles.indexOf("status")],
                    }
                    const filtered_route = await get_filter_item("route", data_detail);
                    if (filtered_route === null) {
                        failedRows.push(row);
                        continue;
                    }
                    const filtered_brand = await get_filter_item("brand", data_detail);
                    if (filtered_brand === null) {
                        failedRows.push(row);
                        continue;
                    }
                    const filtered_survey = await get_filter_item("survey", data_detail);
                    if (filtered_survey === null) {
                        failedRows.push(row);
                        continue;
                    }
                    const filtered_pos = await get_filter_item("pos", data_detail);
                    if (filtered_pos === null) {
                        failedRows.push(row);
                        continue;
                    }
                    data_detail.periods = data_detail.periods ? data_detail.periods.replaceAll(" ", "").split(",") : [];
                    data_detail["s1"] = data_detail.week1 ? get_weekday_symbol_list(data_detail.week1) : [];
                    data_detail["s2"] = data_detail.week2 ? get_weekday_symbol_list(data_detail.week2) : [];
                    data_detail["s3"] = data_detail.week3 ? get_weekday_symbol_list(data_detail.week3) : [];
                    data_detail["s4"] = data_detail.week4 ? get_weekday_symbol_list(data_detail.week4) : [];
                    let current_visit_type = "PRESENT";
                    for (const [typekey, typevalue] of Object.entries(VISIT_TYPES)) {
                        if (data_detail.visitType === typevalue) {
                            current_visit_type = typekey;
                            break;
                        }
                    }
                    let upsert_data = {
                        routeId: filtered_route.id,
                        brandId: filtered_brand.id,
                        surveyIds: filtered_survey,
                        posId: filtered_pos.id,
                        visitType: current_visit_type,
                        periods: data_detail.periods,
                        s1: data_detail.s1,
                        s2: data_detail.s2,
                        s3: data_detail.s3,
                        s4: data_detail.s4,
                        status: data_detail.status,
                    }
                    let upsert_status = await upsert_routepos(upsert_data);
                    if (upsert_status) {
                        count++;
                    }
                    else {
                        failedRows.push(row);
                    }
                }
                if (failedRows.length > 0) {
                    res.json({
                        success: false,
                        insertedRowCount: count,
                        failedRows: failedRows,
                        titles: original_titles,
                    });
                } else {
                    res.json({ success: true, insertedRowCount: count });
                }
            })
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    getfilterlist: async function (req, res) {
        const { column, filterValue, isFullText } = req.query;
        let data_list = [];
        if (filterValue !== undefined) {
            if (column === 'route' || column === 'brand' || column === 'survey' || column === 'pos') {
                let where_cause = {};
                where_cause['name'] = { [Op.like]: "%" + filterValue + "%" };
                let order_cause = [];
                order_cause = ["name", "ASC"];
                let data = [];
                if (column === 'route') {
                    data = await Route.findAll({
                        where: where_cause,
                        order: [order_cause],
                    })
                } else if (column === 'brand') {
                    data = await Brand.findAll({
                        where: where_cause,
                        order: [order_cause],
                    })
                } else if (column === 'survey') {
                    data = await Survey.findAll({
                        where: where_cause,
                        order: [order_cause],
                    })
                } else if (column === 'pos') {
                    data = await Pos.findAll({
                        where: where_cause,
                        order: [order_cause],
                    })
                }
                for (const item of data) {
                    let push_item = { ...item.dataValues };
                    if (isFullText) {
                        push_item['title'] = push_item['name'];
                    }
                    else {
                        push_item['title'] = expensesUtils.generateShortText(push_item['name'], filterValue);
                    }
                    data_list.push(push_item);
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
