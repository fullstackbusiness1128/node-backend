const { Pos, User, Brand, RoutePosInactive, Route, Static, Chain, RoutePos, RoutePosRequestVisitday, RoutePosRequestVisitdayBrands } = require('../sequelize')
const Sequelize = require("sequelize");
var _ = require('lodash');
const fs = require("fs");
const Op = Sequelize.Op;
const expensesUtils = require('../services/expenses.utils');
const { getObjectValueList, get_visitdays_user_where_cause, convertObjectToSpecific } = require("../utils");
const { responsableApprovalStatus, adminApprovalStatus } = require("../models/route_pos_request_visitday");
const { DAYS_ARR, DAYS_DICT, weekLetters, periodsCount, weekCount } = require("../models/routePos.model");

const get_data = async (req, is_download_excel) => {
    const { page, itemsPerPage, sortby, sortdesc, filterModel } = req.query;
    let page_num = page === undefined ? 1 : page;
    let page_limit = itemsPerPage === undefined ? 10 : itemsPerPage;
    let order_cause = ["id", "DESC"];
    if (sortby && sortby !== 'pos_detail') {
        if (sortby === 'routeId') {
            order_cause = ['route', 'name', sortdesc === "true" ? "DESC" : "ASC"];
        }
        else if (sortby === 'userId') {
            order_cause = ['user', 'name', sortdesc === "true" ? "DESC" : "ASC"];
        }
        else {
            order_cause = [sortby, sortdesc === "true" ? "DESC" : "ASC"];
        }
    }

    let filter = filterModel === undefined ? [] : JSON.parse(filterModel);
    let where_cause = {};
    let user_where_cause = await get_visitdays_user_where_cause(req.user);
    where_cause = { ...user_where_cause };
    let buffer_values = [];
    filter.map(item => {
        if (!item.filterValue) return item;
        // range search - from to
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
        if (item.columnField === 'routeId' || item.columnField === 'userId' || item.columnField === 'reasonType' || item.columnField === 'responsableApprovalStatus' || item.columnField === 'adminApprovalStatus') {
            buffer_values = getObjectValueList(item.filterValue);
            if (buffer_values.length > 0) where_cause[item.columnField] = { [Op.or]: buffer_values }
        }
        if (item.columnField === 'pos_detail') {
            buffer_values = getObjectValueList(item.filterValue);
            if (buffer_values.length > 0) where_cause['posId'] = { [Op.or]: buffer_values }
        }
        if (item.columnField === 'gpvComments' || item.columnField === 'responsableComments' || item.columnField === 'adminComments') {
            buffer_values = getObjectValueList(item.filterValue);
            if (buffer_values.length > 0) where_cause['id'] = { [Op.or]: buffer_values }
        }
        return item;
    })

    let query_builder_options = {
        where: where_cause,
        order: [order_cause],
        include: [
            Route,
            {
                model: Pos,
                include: [Chain]
            },
            User,
            Brand,
            {
                model: User,
                as: "responsableRVUser"
            },
            {
                model: User,
                as: "adminRVUser"
            },
        ],
    }
    const data = await RoutePosRequestVisitday.findAndCountAll(query_builder_options)

    let data_list = [];
    for (const data_item of data.rows) {
        let push_item = { ...data_item.dataValues };
        push_item["pos_detail"] = "";
        if (push_item.po) {
            let details = [];
            if (push_item.po.chain) {
                details.push(push_item.po.chain.name);
            }
            details.push(push_item.po.town);
            details.push(push_item.po.postalCode);
            details.push(push_item.po.address);
            push_item["pos_detail"] = details.join(", ");
        }
        push_item["brandsLabel"] = "";
        push_item["brandsLabel"] = push_item.brands.map(el => el.name).join(", ");
        push_item["responsableApprovalStatusLabel"] = "";
        if (push_item["responsableApprovalStatus"] !== "PENDING") {
            push_item["responsableApprovalStatusLabel"] = responsableApprovalStatus[push_item.responsableApprovalStatus] ? responsableApprovalStatus[push_item.responsableApprovalStatus] : '';
        }
        push_item["adminApprovalStatusLabel"] = "";
        if (push_item["adminApprovalStatus"] !== "PENDING") {
            push_item["adminApprovalStatusLabel"] = adminApprovalStatus[push_item.adminApprovalStatus] ? adminApprovalStatus[push_item.adminApprovalStatus] : '';
        }
        push_item["new_visitdays"] = [];
        push_item["new_setted_weeks"] = [];
        push_item["new_setted_weeks_label"] = "";
        for (let i = 1; i <= weekCount; i++) {
            if (!push_item[`w${i}`]) continue;
            let weekArr = push_item[`w${i}`].split(",");
            if (weekArr.length > 0) {
                push_item["new_visitdays"] = weekArr;
                push_item["new_setted_weeks"].push(i);
            }
        }
        push_item["new_setted_weeks_label"] = push_item["new_setted_weeks"].join(", ");
        push_item["new_visitdays_label"] = [];
        if (push_item["new_visitdays"].length > 0) {
            for (let j = 0; j < push_item["new_visitdays"].length; j++) {
                let weekday_push_item = {};
                weekday_push_item[push_item["new_visitdays"][j]] = weekLetters[push_item["new_visitdays"][j]];
                push_item["new_visitdays_label"].push(weekLetters[push_item["new_visitdays"][j]]);
            }
            push_item["new_visitdays_label"] = push_item["new_visitdays_label"].join(", ")
        }
        let brandIds = push_item.brands.map(el => el.id);
        let { currentPeriods, currentWeeks, currentDays, currentPeriodsLabel, currentWeeksLabel, currentDaysLabel } = await get_current_route_pos_data(push_item["routeId"], push_item["posId"], brandIds);
        push_item = { ...push_item, currentPeriods, currentWeeks, currentDays, currentPeriodsLabel, currentWeeksLabel, currentDaysLabel }

        data_list.push(push_item);
    }
    if (sortby !== undefined && (sortby === 'pos_detail')) {
        if (sortdesc === "false") {
            data_list = data_list.sort((a, b) => (a[sortby] > b[sortby]) ? 1 : ((b[sortby] > a[sortby]) ? -1 : 0))
        }
        else {
            data_list = data_list.sort((a, b) => (a[sortby] < b[sortby]) ? 1 : ((b[sortby] < a[sortby]) ? -1 : 0))
        }
    }
    filter.map(item => {
        if (item.columnField === 'brands') {
            buffer_values = getObjectValueList(item.filterValue);
            data_list = data_list.filter(data_item => {
                let filtered_data = data_item[item.columnField].filter(selected_item => {
                    if (buffer_values.includes(selected_item.id)) return true;
                })
                if (filtered_data.length > 0) return true;
            })
        }
        if (item.columnField === "new_setted_weeks" || item.columnField === "new_visitdays" || item.columnField === "currentDays" || item.columnField === "currentWeeks" || item.columnField === "currentPeriods") {
            buffer_values = getObjectValueList(item.filterValue);
            data_list = data_list.filter(data_item => {
                let filtered_data = data_item[item.columnField].filter(selected_item => {
                    if (buffer_values.includes(selected_item.toString())) return true;
                })
                if (filtered_data.length > 0) return true;
            })
        }
    })

    let pending_responsable_rows = data_list.filter(el => el.responsableApprovalStatus === "PENDING");
    let pending_admin_rows = data_list.filter(el => el.adminApprovalStatus === "PENDING");
    let total_count = data_list.length;
    if (!is_download_excel) {
        data_list = data_list.slice(page_limit * (page_num - 1), page_limit * page_num);
    }
    return {
        data: data_list,
        total_count,
        pendingCountResponsable: pending_responsable_rows.length,
        pendingCountAdmin: pending_admin_rows.length,
    }
}

const generateTypeValues = (objArr) => {
    let data = [];
    for (const [key, value] of Object.entries(objArr)) {
        let push_item = {
            value: key,
            label: value
        }
        data.push(push_item);
    }
    return data;
}

const get_current_route_pos_data = async (routeId, posId, brandIds) => {
    let retValue = {
        currentPeriods: [],
        currentPeriodsLabel: "",
        currentWeeks: [],
        currentWeeksLabel: "",
        currentDays: [],
        currentDaysLabel: "",
    }
    const route_pos_data = await RoutePos.findAll({
        where: {
            routeId, posId
        },
        include: [
            { model: Brand, where: { id: { [Op.or]: brandIds } } }
        ]
    })
    let i = 0, j = 0;
    for (const item of route_pos_data) {
        let dataItem = item.dataValues;
        for (i = 1; i <= periodsCount; i++) {
            if (dataItem["p" + i] && !retValue.currentPeriods.includes(i)) {
                retValue.currentPeriods.push(i);
            }
        }
        for (i = 1; i <= weekCount; i++) {
            if (dataItem["s" + i]) {
                if (!retValue.currentWeeks.includes(i)) {
                    retValue.currentWeeks.push(i);
                }
                let weekdaylist = dataItem["s" + i].split(",");
                for (j = 0; j < weekdaylist.length; j++) {
                    if (!retValue.currentDays.includes(weekdaylist[j])) {
                        retValue.currentDays.push(weekdaylist[j]);
                    }
                }
            }
        }
    }
    if (retValue.currentPeriods.length > 0) {
        retValue.currentPeriodsLabel = retValue.currentPeriods.join(", ");
    }
    if (retValue.currentWeeks.length > 0) {
        retValue.currentWeeksLabel = retValue.currentWeeks.join(", ");
    }
    if (retValue.currentDays.length > 0) {
        let weeklabellist = [];
        for (const weekItem of retValue.currentDays) {
            weeklabellist.push(weekLetters[weekItem]);
        }
        retValue.currentDaysLabel = weeklabellist.join(", ");
    }
    return retValue;
}

module.exports = {

    getfilterlist: async function (req, res) {
        const { column, filterValue, isFullText } = req.query;
        let data_list = [];
        if (filterValue !== undefined) {
            let where_cause = {};
            let user_where_cause = await get_visitdays_user_where_cause(req.user);
            where_cause = { ...user_where_cause };
            if (column === "routeId") {
                let relation_where = {};
                relation_where['name'] = { [Op.like]: "%" + filterValue + "%" };
                let order_cause = ['route', "name", "ASC"];
                const data = await RoutePosRequestVisitday.findAll({
                    where: where_cause,
                    order: [order_cause],
                    include: [
                        (Object.keys(relation_where).length > 0) ? { model: Route, where: relation_where } : Route
                    ]
                })
                for (const item of data) {
                    let push_item = {
                        id: item.dataValues.routeId,
                        title: item.dataValues.route.name,
                    }
                    let filtered_data = data_list.filter(data_item => data_item.id === push_item.id);
                    if (filtered_data.length === 0) {
                        data_list.push(push_item);
                    }
                }
            }
            else if (column === "userId") {
                let relation_where = [];
                relation_where.push({
                    [Op.or]: [
                        { name: { [Op.like]: "%" + filterValue + "%" } },
                        { surname: { [Op.like]: "%" + filterValue + "%" } },
                    ]
                })
                let order_cause = ['user', "name", "ASC"];
                const data = await RoutePosRequestVisitday.findAll({
                    where: where_cause,
                    order: [order_cause],
                    include: [
                        (relation_where.length > 0) ? { model: User, where: relation_where } : User
                    ]
                })
                for (const item of data) {
                    let push_item = {
                        id: item.dataValues.userId,
                        title: `${item.dataValues.user.name} ${item.dataValues.user.surname}`,
                    }
                    let filtered_data = data_list.filter(data_item => data_item.id === push_item.id);
                    if (filtered_data.length === 0) {
                        data_list.push(push_item);
                    }
                }
            }
            else if (column === "pos_detail") {
                let fullData = await get_data(req, true);
                fullData = fullData.data;
                let filtered_data = fullData.filter(el => el.pos_detail.toLowerCase().includes(filterValue))
                for (const item of filtered_data) {
                    let push_item = {
                        id: item.posId,
                        title: item.pos_detail
                    };
                    let filtered = data_list.filter(data_item => data_item.id === push_item.id);
                    if (filtered.length === 0) {
                        data_list.push(push_item);
                    }
                }
            }
            else if (column === "brands") {
                let relation_where = {};
                relation_where['name'] = { [Op.like]: "%" + filterValue + "%" };
                const data = await RoutePosRequestVisitday.findAll({
                    where: where_cause,
                    include: [
                        (Object.keys(relation_where).length > 0) ? { model: Brand, where: relation_where } : Brand
                    ]
                })
                for (const item of data) {
                    for (const brandItem of item.dataValues.brands) {
                        let push_item = {
                            id: brandItem.dataValues.id,
                            title: brandItem.dataValues.name,
                        }
                        let filtered_data = data_list.filter(data_item => data_item.id === push_item.id);
                        if (filtered_data.length === 0) {
                            data_list.push(push_item);
                        }
                    }
                }
            }
            else if (column === "gpvComments" || column === "responsableComments" || column === "adminComments") {
                where_cause[column] = { [Op.like]: "%" + filterValue + "%" };
                const data = await RoutePosRequestVisitday.findAll({
                    where: where_cause,
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
            if (filterValue === '' || filterValue === null) {
                data_list = data_list.slice(0, 100);
            }
        }
        return res.json({
            data: data_list,
        })
    },

    index: async function (req, res) {
        const pos_inactive_data = await get_data(req);
        let responsableApprovalStatusValues = generateTypeValues(responsableApprovalStatus);
        let adminApprovalStatusValues = generateTypeValues(adminApprovalStatus);
        let weekdays = convertObjectToSpecific(weekLetters);
        return res.json({
            data: pos_inactive_data.data,
            total: pos_inactive_data.total_count,
            responsableApprovalStatusValues,
            adminApprovalStatusValues,
            weekdays,
            periodsCount,
            weekCount,
            pendingCountResponsable: pos_inactive_data.pendingCountResponsable,
            pendingCountAdmin: pos_inactive_data.pendingCountAdmin,
        })
    },

    update: async function (req, res) {
        let { body, params: { id } } = req;
        if (body.responsableApprovalStatus && body.responsableApprovalStatus !== "PENDING") {
            body.responsableId = req.user.id;
        } else if (body.adminApprovalStatus && body.adminApprovalStatus !== "PENDING") {
            body.adminId = req.user.id;
        }
        const data = await RoutePosRequestVisitday.update(body, { where: { id } });
        if (data && body.adminApprovalStatus && body.adminApprovalStatus === "APPROVED") {
            const filtered_data = await RoutePosRequestVisitday.findOne({
                where: { id: body.id },
                include: [
                    Brand
                ]
            })
            const { id, routeId, posId, brands } = filtered_data;
            for (const brandItem of brands) {
                let criteria = {
                    routeId, posId, brandId: brandItem.id
                }
                await RoutePos.update({ status: "inactive" }, { where: criteria });
            }

        }
        return res.status(200).json({ data })
    },

}
