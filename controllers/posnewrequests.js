const { Pos, User, Brand, Route, Static, Chain, RoutePos, RoutePosSurvey, PosNewRequest, Survey, PosAttachment, PosNewRequestBrands } = require('../sequelize')
const Sequelize = require("sequelize");
var _ = require('lodash');
const fs = require("fs");
const Op = Sequelize.Op;
const expensesUtils = require('../services/expenses.utils');
const { getObjectValueList, get_new_pos_request_user_where_cause, convertObjectToSpecific } = require("../utils");
const staticController = require('./static');
const { responsableApprovalStatus, adminApprovalStatus } = require("../models/pos_new_request");
const { DAYS_ARR, DAYS_DICT, weekLetters, periodsCount, weekCount } = require("../models/routePos.model");

const get_data = async (req, is_download_excel) => {
    const { page, itemsPerPage, sortby, sortdesc, filterModel } = req.query;
    let page_num = page === undefined ? 1 : page;
    let page_limit = itemsPerPage === undefined ? 10 : itemsPerPage;
    let order_cause = ["id", "DESC"];
    if (sortby && sortby !== 'chainname') {
        if (sortby === 'routeId') {
            order_cause = ['route', 'name', sortdesc === "true" ? "DESC" : "ASC"];
        }
        else if (sortby === 'userId') {
            order_cause = ['user', 'name', sortdesc === "true" ? "DESC" : "ASC"];
        }
        else if (
            sortby === 'name'
            || sortby === 'town'
            || sortby === 'postalCode'
            || sortby === 'address'
            || sortby === 'addressObservation'
            || sortby === 'contact'
            || sortby === 'email'
            || sortby === 'phone'
            || sortby === 'phone2'
            || sortby === 'fiscalName'
            || sortby === 'vatNumber'
            || sortby === 'fiscalTown'
            || sortby === 'fiscalPostalCode'
            || sortby === 'fiscalAddress'
        ) {
            order_cause = ['po', sortby, sortdesc === "true" ? "DESC" : "ASC"];
        }
        else {
            order_cause = [sortby, sortdesc === "true" ? "DESC" : "ASC"];
        }
    }

    let filter = filterModel === undefined ? [] : JSON.parse(filterModel);
    let where_cause = {};
    let user_where_cause = await get_new_pos_request_user_where_cause(req.user);
    where_cause = { ...user_where_cause };
    let buffer_values = [];
    filter.map(item => {
        if (!item.filterValue) return item;
        if (item.columnField === 'routeId' || item.columnField === 'userId' || item.columnField === 'responsableApprovalStatus' || item.columnField === 'adminApprovalStatus') {
            buffer_values = getObjectValueList(item.filterValue);
            if (buffer_values.length > 0) where_cause[item.columnField] = { [Op.or]: buffer_values }
        }
        if (item.columnField === 'name'
            || item.columnField === 'town'
            || item.columnField === 'postalCode'
            || item.columnField === "address"
            || item.columnField === "addressObservation"
            || item.columnField === "contact"
            || item.columnField === "email"
            || item.columnField === "phone"
            || item.columnField === "phone2"
            || item.columnField === "fiscalName"
            || item.columnField === "vatNumber"
            || item.columnField === "fiscalTown"
            || item.columnField === "fiscalPostalCode"
            || item.columnField === "fiscalAddress"
        ) {
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
            User,
            Route,
            {
                model: Pos,
                include: [
                    Chain,
                    { model: Static, as: "posAttachments" }
                ]
            },
            Brand,
            {
                model: User,
                as: "responsablePNRUser"
            },
            {
                model: User,
                as: "adminPNRUser"
            },
        ],
    }
    const data = await PosNewRequest.findAndCountAll(query_builder_options)

    let data_list = [];
    for (const data_item of data.rows) {
        let push_item = { ...data_item.dataValues };
        push_item["responsableApprovalStatusLabel"] = "";
        if (push_item["responsableApprovalStatus"] !== "PENDING") {
            push_item["responsableApprovalStatusLabel"] = responsableApprovalStatus[push_item.responsableApprovalStatus] ? responsableApprovalStatus[push_item.responsableApprovalStatus] : '';
        }
        push_item["adminApprovalStatusLabel"] = "";
        if (push_item["adminApprovalStatus"] !== "PENDING") {
            push_item["adminApprovalStatusLabel"] = adminApprovalStatus[push_item.adminApprovalStatus] ? adminApprovalStatus[push_item.adminApprovalStatus] : '';
        }
        push_item["chainname"] = "";
        push_item["chainId"] = "";
        if (push_item.po && push_item.po.chain) {
            push_item["chainname"] = push_item.po.chain.name;
            push_item["chainId"] = push_item.po.chain.id;
        }

        push_item["brandsLabel"] = "";
        push_item["brandsLabel"] = push_item.brands.map(el => el.name).join(", ");
        push_item.brands = await Promise.all(push_item.brands.map(async (el) => {
            console.log(el.id, push_item.routeId, push_item.posId);
            let updateItem = { ...el.dataValues };
            const routePosItem = await RoutePos.findOne({
                where: {
                    routeId: push_item.routeId,
                    posId: push_item.posId,
                    brandId: el.id,
                },
                include: [Survey]
            })
            if (routePosItem) {
                updateItem["surveys"] = routePosItem.surveys;
                updateItem["surveysLabel"] = routePosItem.surveys.map(surel => surel.name).join(", ");
            }
            return updateItem;
        }));
        let brandIds = push_item.brands.map(el => el.id);
        let { currentPeriods, currentWeeks, currentDays, currentPeriodsLabel, currentWeeksLabel, currentDaysLabel } = await get_current_route_pos_data(push_item["routeId"], push_item["posId"], brandIds);
        push_item = { ...push_item, currentPeriods, currentWeeks, currentDays, currentPeriodsLabel, currentWeeksLabel, currentDaysLabel }

        data_list.push(push_item);
    }
    if (sortby !== undefined && (sortby === 'chainname')) {
        if (sortdesc === "false") {
            data_list = data_list.sort((a, b) => (a[sortby] > b[sortby]) ? 1 : ((b[sortby] > a[sortby]) ? -1 : 0))
        }
        else {
            data_list = data_list.sort((a, b) => (a[sortby] < b[sortby]) ? 1 : ((b[sortby] < a[sortby]) ? -1 : 0))
        }
    }
    filter.map(item => {
        if (item.columnField === 'chainname') {
            buffer_values = getObjectValueList(item.filterValue);
            data_list = data_list.filter(data_item => buffer_values.includes(data_item.chainId));
        }
        if (item.columnField === 'brands') {
            buffer_values = getObjectValueList(item.filterValue);
            data_list = data_list.filter(data_item => {
                let filtered_data = data_item[item.columnField].filter(selected_item => {
                    if (buffer_values.includes(selected_item.id)) return true;
                })
                if (filtered_data.length > 0) return true;
            })
        }
        if (item.columnField === "currentDays" || item.columnField === "currentWeeks" || item.columnField === "currentPeriods") {
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
            let user_where_cause = await get_new_pos_request_user_where_cause(req.user);
            where_cause = { ...user_where_cause };
            if (column === "routeId") {
                let relation_where = {};
                relation_where['name'] = { [Op.like]: "%" + filterValue + "%" };
                let order_cause = ['route', "name", "ASC"];
                const data = await PosNewRequest.findAll({
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
                const data = await PosNewRequest.findAll({
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
            else if (column === "chainname") {
                let fullData = await get_data(req, true);
                fullData = fullData.data;
                let filtered_data = fullData.filter(el => el[column].toLowerCase().includes(filterValue))
                for (const item of filtered_data) {
                    let push_item = {
                        id: item.chainId,
                        title: item[column]
                    };
                    let filtered = data_list.filter(data_item => data_item.id === push_item.id);
                    if (filtered.length === 0) {
                        data_list.push(push_item);
                    }
                }
            }
            else if (column === "name"
                || column === "town"
                || column === "postalCode"
                || column === "address"
                || column === "addressObservation"
                || column === "contact"
                || column === "email"
                || column === "phone"
                || column === "phone2"
                || column === "fiscalName"
                || column === "vatNumber"
                || column === "fiscalTown"
                || column === "fiscalPostalCode"
                || column === "fiscalAddress"
            ) {
                let relation_where = {};
                relation_where[column] = { [Op.like]: "%" + filterValue + "%" };
                let order_cause = ['po', "name", "ASC"];
                const data = await PosNewRequest.findAll({
                    where: where_cause,
                    order: [order_cause],
                    include: [
                        (Object.keys(relation_where).length > 0) ? { model: Pos, where: relation_where } : Pos
                    ]
                })
                for (const item of data) {
                    let push_item = {
                        id: item.dataValues.posId,
                        title: item.dataValues.po[column],
                    }
                    let filtered_data = data_list.filter(data_item => data_item.id === push_item.id);
                    if (filtered_data.length === 0) {
                        data_list.push(push_item);
                    }
                }
            }
            else if (column === "brands") {
                let relation_where = {};
                relation_where['name'] = { [Op.like]: "%" + filterValue + "%" };
                const data = await PosNewRequest.findAll({
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
                const data = await PosNewRequest.findAll({
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
        const pos_new_requests = await get_data(req);
        let responsableApprovalStatusValues = generateTypeValues(responsableApprovalStatus);
        let adminApprovalStatusValues = generateTypeValues(adminApprovalStatus);
        let weekdays = convertObjectToSpecific(weekLetters);
        const chain_list = await Chain.findAll({
            where: { parentId: { [Op.is]: null } },
            order: [['name', 'ASC']],
        });
        const brandList = await Brand.findAll({
            where: { status: "active" },
            order: [["name", "ASC"]]
        })
        const surveyList = await Survey.findAll({
            where: { active: true },
            order: [["name", "ASC"]]
        })
        return res.json({
            data: pos_new_requests.data,
            total: pos_new_requests.total_count,
            responsableApprovalStatusValues,
            adminApprovalStatusValues,
            weekdays,
            periodsCount,
            weekCount,
            chain_list,
            brandList,
            surveyList,
            pendingCountResponsable: pos_new_requests.pendingCountResponsable,
            pendingCountAdmin: pos_new_requests.pendingCountAdmin,
        })
    },

    update: async function (req, res) {
        let { body, params: { id } } = req;
        let { brandSurveys, routeId, posId, attachments, attachmentIdList, currentDays, currentPeriods, currentWeeks } = body;
        brandSurveys = _.uniqBy(brandSurveys, "id");
        if (body.responsableApprovalStatus && body.responsableApprovalStatus !== "PENDING") {
            body.responsableId = req.user.id;
        } else if (body.adminApprovalStatus && body.adminApprovalStatus !== "PENDING") {
            body.adminId = req.user.id;
        }
        let { gpvComments, responsableId, responsableApprovalStatus, responsableComments, adminId, adminApprovalStatus, adminComments } = body;
        // console.log(body);
        if (id) {
            let update_request_data = {};
            if (body.responsableApprovalStatus) {
                update_request_data = { gpvComments, responsableId, responsableApprovalStatus, responsableComments };
            } else if (body.adminApprovalStatus) {
                update_request_data = { gpvComments, adminId, adminApprovalStatus, adminComments };
            }
            const updateRequestStatus = await PosNewRequest.update(update_request_data, { where: { id } });
            console.log(updateRequestStatus);
            let posData = body.po;
            // if adminapproed, update isnotrequested, isrequestapproved
            if (body.adminApprovalStatus && body.adminApprovalStatus === "APPROVED") {
                posData["isNotRequested"] = true;
                posData["isRequestApproved"] = true;
            } else {
                posData["isNotRequested"] = false;
                posData["isRequestApproved"] = false;
            }
            await Pos.update(posData, { where: { id: posId } });

            let originalList = await PosAttachment.findAll({ where: { posId } });
            originalList = originalList.map(el => el.dataValues.attachmentId);
            console.log('originalList - ', originalList);
            let attachmentKeepList = attachments.map(el => el.static !== null && el.static.id);
            console.log('attachmentKeepList - ', attachmentKeepList);
            console.log('attachmentIdList - ', attachmentIdList);
            if (Object.keys(attachmentIdList).length > 0) {
                for (const [attachmentIndex, value] of Object.entries(attachmentIdList)) {
                    attachmentKeepList[attachmentIndex] = value;
                }
            }
            attachmentKeepList = attachmentKeepList.filter(el => el !== false);
            console.log('attachmentKeepList - ', attachmentKeepList);
            for (const originalAttachmentId of originalList) {
                if (!attachmentKeepList.includes(originalAttachmentId)) {
                    await staticController.deleteImage(originalAttachmentId);
                }
            }
            if (attachmentKeepList.length > 0) {
                await PosAttachment.destroy({ where: { posId } });
                let orderIndex = 1;
                for (const attachmentId of attachmentKeepList) {
                    await PosAttachment.create({ posId, attachmentId, orderIndex });
                    orderIndex++;
                }
            }

            await RoutePos.destroy({ where: { routeId, posId } });
            await PosNewRequestBrands.destroy({ where: { posNewRequestedId: id } });
            for (const brandItem of brandSurveys) {
                let createRoutePosData = {
                    routeId, posId, brandId: brandItem.id, visitType: "PRESENT",
                }
                for (i = 1; i <= periodsCount; i++) createRoutePosData[`p${i}`] = false;
                for (const activePeriodIndex of currentPeriods) {
                    createRoutePosData[`p${activePeriodIndex}`] = true;
                }
                for (const activeWeekIndex of currentWeeks) {
                    createRoutePosData[`s${activeWeekIndex}`] = currentDays.join(",");
                }
                const inserted_routepos_data = await RoutePos.create(createRoutePosData);
                if (inserted_routepos_data) {
                    const routePosId = inserted_routepos_data.id;
                    for (const surveyId of brandItem.surveys) {
                        await RoutePosSurvey.create({
                            routePosId,
                            surveyId
                        })
                    }
                }
            }
            for (const brandItem of brandSurveys) {
                await PosNewRequestBrands.create({ posNewRequestedId: id, brandId: brandItem.id });
            }
            return res.json({ posId })
        }

        return res.status(200).json({ success: false })
    },

}
