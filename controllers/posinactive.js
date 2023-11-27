const { Pos, User, Brand, RoutePosInactive, Route, Static, Chain, RoutePosInactiveBrands, RoutePos } = require('../sequelize')
const Sequelize = require("sequelize");
var _ = require('lodash');
const fs = require("fs");
const Op = Sequelize.Op;
const expensesUtils = require('../services/expenses.utils');
const { getObjectValueList, getAllUserChildren, get_inactive_user_where_cause } = require("../utils");
const { reasonTypes, responsableApprovalStatus, adminApprovalStatus } = require("../models/route_pos_inactive");

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
    let user_where_cause = await get_inactive_user_where_cause(req.user);
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
                model: Static,
                as: "inactivePhoto"
            },
            {
                model: User,
                as: "responsableUser"
            },
            {
                model: User,
                as: "adminUser"
            },
        ],
    }
    const data = await RoutePosInactive.findAndCountAll(query_builder_options)

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
        push_item["reasonTypeLabel"] = reasonTypes[push_item.reasonType] ? reasonTypes[push_item.reasonType] : '';
        push_item["responsableApprovalStatusLabel"] = "";
        if (push_item["responsableApprovalStatus"] !== "PENDING") {
            push_item["responsableApprovalStatusLabel"] = responsableApprovalStatus[push_item.responsableApprovalStatus] ? responsableApprovalStatus[push_item.responsableApprovalStatus] : '';
        }
        push_item["adminApprovalStatusLabel"] = "";
        if (push_item["adminApprovalStatus"] !== "PENDING") {
            push_item["adminApprovalStatusLabel"] = adminApprovalStatus[push_item.adminApprovalStatus] ? adminApprovalStatus[push_item.adminApprovalStatus] : '';
        }
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

module.exports = {

    getfilterlist: async function (req, res) {
        const { column, filterValue, isFullText } = req.query;
        let data_list = [];
        if (filterValue !== undefined) {
            let where_cause = {};
            let user_where_cause = await get_inactive_user_where_cause(req.user);
            where_cause = { ...user_where_cause };
            if (column === "routeId") {
                let relation_where = {};
                relation_where['name'] = { [Op.like]: "%" + filterValue + "%" };
                let order_cause = ['route', "name", "ASC"];
                const data = await RoutePosInactive.findAll({
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
                const data = await RoutePosInactive.findAll({
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
                const data = await RoutePosInactive.findAll({
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
                const data = await RoutePosInactive.findAll({
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

        let reasonTypeValues = generateTypeValues(reasonTypes);
        let responsableApprovalStatusValues = generateTypeValues(responsableApprovalStatus);
        let adminApprovalStatusValues = generateTypeValues(adminApprovalStatus);

        return res.json({
            data: pos_inactive_data.data,
            total: pos_inactive_data.total_count,
            reasonTypeValues,
            responsableApprovalStatusValues,
            adminApprovalStatusValues,
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
        const data = await RoutePosInactive.update(body, { where: { id } });
        if (data && body.adminApprovalStatus && body.adminApprovalStatus === "APPROVED") {
            const filtered_data = await RoutePosInactive.findOne({
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
