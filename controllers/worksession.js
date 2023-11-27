
const { BrandPromos, BrandPromosPos, BrandOnePage, BrandOnepagePos, Worksession, Route, Survey, User, RoutePos, WorksessionPos, WorksessionSurvey, WorksessionSurveyResponse, Static, Brand, Pos, Sequelize, Chain, Postaglabel, Channel, Worksessionadditionalpos, RouteUser, Worksessionposbrand, RoutePosInactive, RoutePosInactiveBrands, RoutePosRequestVisitday, RoutePosRequestVisitdayBrands, PosAttachment, PosNewRequest, PosNewRequestBrands, RoutePosSurvey } = require('../sequelize')
const Op = Sequelize.Op;
const literal = Sequelize.literal;
const utils = require('../utils.js')
const moment = require('moment')
const procedures = require('../sql/procedures')
const { DAYS_ARR, DAYS_DICT, weekLetters, periodsCount, weekCount } = require("../models/routePos.model")
const { VISIT_TYPES } = require("../models/routePos.model");
const { REASON_TYPES } = require("../models/worksessionPos.model");
const { reasonTypes } = require("../models/route_pos_inactive");

const surveyController = require('./survey')

const _ = require('lodash')


const Self = {

    async user(req, res) {
        const userId = req.params.id

        const ret = await Self._find({
            [Op.and]: [
                literal('DATE(createdAt) = CURDATE()'),
                { userId },
            ]
        })

        return res.json(ret)
    },

    find: async function (req, res) {
        const { id } = req.params;
        const { isOrdered } = req.query;
        const ret = await Self._find({ id }, isOrdered)
        return res.json(ret)
    },

    async init(req, res) {
        const { user } = req;
        let data = await Worksession.create({ userId: user.id, date: literal('CURDATE()') })
        const ret = await Self._find({ id: data.id })
        return res.json(ret)
    },

    async start(req, res) {
        const { id } = req.params;
        await Worksession.update({ startTime: literal('NOW()') }, { where: { id } });
        return res.status(200).send()
    },

    async _find(where, isOrdered) {
        const include = [
            WorksessionPos,
        ]
        const data = await Worksession.findOne({
            where,
            include
        })
        const meta = await Self._getSessionMeta(data, isOrdered)
        let user_route = null;
        if (data) {
            const { userId } = data;
            user_route = await User.findOne({
                where: { id: userId },
                include: [
                    Route
                ]
            });
            if (user_route.routes) {
                user_route = user_route.routes;
            }
        }
        return { meta, data, visitTypes: VISIT_TYPES, user_route }
    },

    async _getSessionMeta(data, isOrdered) {
        let routePos = []
        let additionalPOSdata = []
        let mergedPosData = [];
        if (data) {
            const { userId } = data
            const today = utils.now()
            // toRecoverPos = await Self.getPosToRecover(userId, today, data) //available pos to recover
            const { posData, additionaldata } = await Self.getDayPos(userId, today, data) //pos from route
            routePos = Self.optimizedPosList(posData);
            additionalPOSdata = Self.optimizedPosList(additionaldata);
            mergedPosData = await Self.mergeOriginalAdditionalPosData(posData, additionaldata, data, isOrdered);
        }
        return { routePos, additionalPOSdata, mergedPosData }
    },

    async getDayPos(userId, date, data) {
        const { week, period, day } = utils.convertDate(date)
        const days = [day]
        let routeIds = [];
        if (userId) {
            let route_users = await RouteUser.findAll({ where: { userId } });
            routeIds = route_users.map(el => el.routeId);
        }
        return Self.findPosToVisit(userId, routeIds, null, period, week, days, data)
    },

    get_frequency_label(frequencyStatus) {
        const { frequency_status, activePeriodsCount, activeWeeksCount, minActiveWeekDaysCount } = frequencyStatus;
        let value = "Anual";
        if (frequency_status) {
            switch (frequency_status) {
                case "ANNUALY":
                    value = "Anual";
                    break;
                case "SIX_MONTHLY":
                    value = "Semestral";
                    break;
                case "THREE_MONTHLY":
                    value = "Trimestral";
                    break;
                case "BI_MONTHLY":
                    value = "Bimensual";
                    break;
                case "MONTHLY":
                    value = "Mensual";
                    break;
                case "FORTNIGHTLY":
                    value = "Quincenal";
                    break;
                case "WEEKLY":
                    value = "Semanal";
                    break;
            }
            if (frequency_status === "WEEKLY" && minActiveWeekDaysCount > 1) {
                value = `Semanal X ${minActiveWeekDaysCount}`;
            }
        }
        return value;
    },

    activeWeekdaysCount(weekvalues) {
        let value = 0;
        if (!weekvalues) return value;
        if (typeof (weekvalues) === "string") {
            value = weekvalues.split(",").length;
        } else {
            weekvalues.map(el => {
                if (el === true) value++;
            })
        }
        return value;
    },

    get_posbrand_frequency_status(route_pos_brand_item) {
        const { routeId, posId, brandId } = route_pos_brand_item;
        let frequency_status = "";
        let activePeriodsCount = 0;
        let activeWeeksCount = 0;
        let minActiveWeekDaysCount = 8;
        let i = 0, j = 0;
        for (i = 1; i <= periodsCount; i++) {
            if (route_pos_brand_item[`p${i}`] && route_pos_brand_item[`p${i}`] === true) {
                activePeriodsCount++;
            }
        }
        for (i = 1; i <= weekCount; i++) {
            let currentWeeklyDaysCount = Self.activeWeekdaysCount(route_pos_brand_item[`s${i}`]);
            if (route_pos_brand_item[`s${i}`] && currentWeeklyDaysCount !== 0) {
                activeWeeksCount++;
                if (currentWeeklyDaysCount < minActiveWeekDaysCount) {
                    minActiveWeekDaysCount = currentWeeklyDaysCount;
                }
            }
        }
        if (activePeriodsCount === 1) {
            frequency_status = "ANNUALY";
        } else if (activePeriodsCount >= 2 && activePeriodsCount < 4) {
            frequency_status = "SIX_MONTHLY";
        } else if (activePeriodsCount >= 4 && activePeriodsCount < 6) {
            frequency_status = "THREE_MONTHLY";
        } else if (activePeriodsCount >= 6 && activePeriodsCount < periodsCount) {
            frequency_status = "BI_MONTHLY";
        } else if (activePeriodsCount === periodsCount) {
            frequency_status = "MONTHLY";
        }
        if (frequency_status === "MONTHLY") {
            if (activeWeeksCount <= 3) {
                frequency_status = "FORTNIGHTLY";
            } else {
                frequency_status = "WEEKLY";
            }
        }
        if (minActiveWeekDaysCount > 7) minActiveWeekDaysCount = 0;
        return { frequency_status, activePeriodsCount, activeWeeksCount, minActiveWeekDaysCount };
    },

    async findPosToVisit(userId, routeId, brandId, period, week, daysArr, worksessionData) {
        const weekTableName = `s${week}`
        const periodTableName = `p${period}`
        let routeWhere = !routeId ? {} : { routeId: { [Op.or]: routeId } }
        let brandWhere = !brandId ? {} : { brandId }
        let daysLike = daysArr.reduce((prev, val) => {
            const dayStr = DAYS_ARR[val]
            prev[Op.like] = `%${dayStr}%`
            return prev
        }, {})
        let posData = [];
        let pos_query_builder_options = {
            where: {
                [periodTableName]: {
                    [Op.eq]: true
                },
                [weekTableName]: {
                    ...daysLike
                },
                ...routeWhere,
                ...brandWhere
            },
            include: [
                {
                    model: Brand,
                    include: [Static]
                },
                {
                    model: Pos,
                    include: [Chain, Postaglabel]
                },
                {
                    model: Route,
                    include: [
                        { model: User }
                    ]
                }
            ]
        }
        const staticsPosData = await RoutePos.findAll(pos_query_builder_options);
        for (const item of staticsPosData) {
            let push_item = { ...item.dataValues };
            push_item.isAdditional = false;
            push_item.frequencyStatus = Self.get_posbrand_frequency_status(push_item);
            push_item.frequency_label = Self.get_frequency_label(push_item.frequencyStatus);
            posData.push(push_item);
        }
        let additionaldata = [];
        if (worksessionData) {
            let worksessionDate = worksessionData.dataValues.date;
            const additionalData = await Worksessionadditionalpos.findAll({
                where: {
                    userId,
                    date: worksessionDate
                },
            });
            let additionalCriteria = [];
            let additionalRows = [];
            for (const additionalItem of additionalData) {
                const { routeId, posId, brandId, id, date } = additionalItem.dataValues;
                additionalCriteria.push({ routeId, posId, brandId });
                if (additionalRows.findIndex(el => (el.id === id)) < 0) {
                    additionalRows.push({ routeId, posId, brandId, id, date });
                }
            }
            if (additionalCriteria.length > 0) {
                let additionalWhere = additionalCriteria.length === 0 ? {} : { [Op.or]: additionalCriteria };
                let additional_pos_query_build_options = {
                    where: {
                        ...additionalWhere,
                    },
                    include: [
                        {
                            model: Brand,
                            include: [Static]
                        },
                        {
                            model: Pos,
                            include: [Chain, Postaglabel]
                        },
                        {
                            model: Route,
                            include: [
                                { model: User }
                            ]
                        }
                    ]
                }
                const additionalPOS = await RoutePos.findAll(additional_pos_query_build_options);
                for (const item of additionalPOS) {
                    let push_item = { ...item.dataValues };
                    push_item.isAdditional = true;
                    push_item.frequencyStatus = Self.get_posbrand_frequency_status(push_item);
                    push_item.frequency_label = Self.get_frequency_label(push_item.frequencyStatus);
                    push_item.additionalId = null;

                    let searchIndex = additionalRows.findIndex(el => {
                        if (el.routeId === push_item.routeId && el.posId === push_item.posId && el.brandId === push_item.brandId && el.date === worksessionDate) {
                            return true;
                        }
                        return false;
                    })
                    if (searchIndex >= 0) {
                        push_item.additionalId = additionalRows[searchIndex].id;
                    }

                    additionaldata.push(push_item);
                }
            }
        }
        return { posData, additionaldata };
    },

    optimizedPosList: function (routePos) {
        let pos_list = [];
        routePos.map(item => {
            if (item.route && item.po && item.brand) {
                let searchIndex = pos_list.findIndex(el => {
                    if (el.routeId === item.routeId && el.posId === item.posId && el.visitType === item.visitType) {
                        return true;
                    }
                    return false;
                })
                if (searchIndex >= 0) {
                    pos_list[searchIndex].brand_list.push({
                        ...item.brand.dataValues,
                        frequency_label: item.frequency_label,
                        frequencyStatus: item.frequencyStatus
                    });
                    if (item.additionalId) {
                        pos_list[searchIndex].additionalIds.push(item.additionalId);
                    }
                } else {
                    let push_item = _.omit(item, ["brandId", "brand", "frequency_label", "frequencyStatus", "additionalId"]);
                    push_item.brand_list = [{
                        ...item.brand.dataValues,
                        frequency_label: item.frequency_label,
                        frequencyStatus: item.frequencyStatus,
                    }];
                    push_item.additionalIds = [];
                    if (item.additionalId) {
                        push_item.additionalIds.push(item.additionalId);
                    }
                    pos_list.push(push_item);
                }
            }
            return item;
        })
        return pos_list;
    },

    mergeOriginalAdditionalPosData: async function (posData, additionalData, worksessionData, isOrdered) {
        let mergedData = [];
        let originalPosData = Self.optimizedPosList(posData);
        let additionalPosData = Self.optimizedPosList(additionalData);
        mergedData = originalPosData;
        for (const additionalItem of additionalPosData) {
            const { routeId, posId, visitType, brand_list } = additionalItem;
            let filtered_index = mergedData.findIndex(el => el.routeId === routeId && el.posId === posId && el.visitType === visitType);
            if (filtered_index >= 0) {
                let brand_list_ids = mergedData[filtered_index].brand_list.map(el => el.id);
                brand_list.map(el => {
                    if (!brand_list_ids.includes(el.id)) {
                        mergedData[filtered_index].brand_list.push(el);
                    }
                })
            } else {
                mergedData.push(additionalItem);
            }
        }
        // get current rows' status
        let worksessionId = null;
        if (worksessionData) {
            worksessionId = worksessionData.id;
        }
        // let currentMoment = Self.convertLocalTime(moment(new Date()).utc().format("YYYY-MM-DD HH:mm:ss"));
        let currentMoment = moment(new Date()).utc().format("YYYY-MM-DD HH:mm:ss");
        for (let i = 0; i < mergedData.length; i++) {
            let status = {
                isOrdered: false,
                isVisited: false,
                isScheduled: false,
                isCompleted: false,
                statusValue: "PENDING", // POSITIVE || NEGATIVE(INCOMPLETE) || PENDING || RECOVER
                scheduleDateTime: null,
                originalScheduleDateTime: null,
            }
            if (worksessionId) {
                const { routeId, posId, visitType } = mergedData[i];
                let criteria = { worksessionId, routeId, posId, visitType };
                let filtered_worksessionPos_record = await WorksessionPos.findOne({
                    where: criteria
                })
                if (filtered_worksessionPos_record) {
                    const { isCompleted, isScheduled, scheduleDateTime } = filtered_worksessionPos_record;
                    status.isOrdered = true;
                    status.isCompleted = isCompleted;
                    status.isVisited = isCompleted;
                    status.isScheduled = isScheduled;
                    if (!isCompleted) {
                        status.statusValue = "NEGATIVE_INCOMPLETE";
                    } else {
                        status.statusValue = "POSITIVE";
                    }
                    if (scheduleDateTime) {
                        status.originalScheduleDateTime = scheduleDateTime;
                        status.scheduleDateTime = moment(new Date(scheduleDateTime)).utc().format("YYYY-MM-DD HH:mm:ss");
                        if (isScheduled && scheduleDateTime && status.scheduleDateTime > currentMoment) {
                            status.statusValue = "POSITIVE";
                        }
                    }
                } else {
                    status.statusValue = "PENDING";
                }
            }
            mergedData[i]['status'] = status;
        }
        let filteredData = [];
        if (isOrdered && isOrdered === 'true') {
            filteredData = [...filteredData, ...mergedData.filter(el => !el.status.isVisited && el.visitType === "AGENDA" && el.status.isScheduled)];
            // sort by hour
            filteredData = filteredData.sort((a, b) => (a.status['scheduleDateTime'] > b.status['scheduleDateTime']) ? 1 : ((b.status['scheduleDateTime'] > a.status['scheduleDateTime']) ? -1 : 0))

            filteredData = [...filteredData, ...mergedData.filter(el => !el.status.isVisited && el.visitType === "AGENDA" && !el.status.isScheduled)];
            filteredData = [...filteredData, ...mergedData.filter(el => !el.status.isVisited && el.visitType === "SCHEDULED")];
            filteredData = [...filteredData, ...mergedData.filter(el => !el.status.isVisited && el.visitType === "PRESENT" || el.visitType === "PHONE")];
            filteredData = [...filteredData, ...mergedData.filter(el => el.status.isVisited)];
        } else {
            filteredData = mergedData;
        }
        return filteredData;
    },

    removeadditionalitems: async function (req, res) {
        const { additionalIds } = req.body;
        let status = false;
        if (additionalIds && additionalIds.length > 0) {
            status = await Worksessionadditionalpos.destroy({ where: { id: { [Op.or]: additionalIds } } });
        }
        return res.json({ success: status });
    },

    _getIsAlreadyAdded: async function (record, selectedDate, user) {
        let isAlreadyAdded = false;
        const { id } = user;
        if (record && selectedDate && id) {
            const { routeId, posId, brandId } = record;
            let where = {
                userId: id,
                date: selectedDate,
                routeId, posId, brandId
            }
            let alreadyCount = await Worksessionadditionalpos.count({ where });
            isAlreadyAdded = alreadyCount > 0 ? true : false;
        }
        return isAlreadyAdded;
    },

    optimizeAdditionalPosList: async function (srcData, responseData, selectedDate, user) {
        for (const dataItem of srcData) {
            let push_item = { ...dataItem.dataValues };
            push_item['route_name'] = push_item.route ? push_item.route.name : "";
            push_item['brand_name'] = push_item.brand ? push_item.brand.name : "";
            push_item['pos_name'] = push_item.po ? push_item.po.name : "";
            push_item['pos_town'] = push_item.po ? push_item.po.town : "";
            push_item['pos_postalcode'] = push_item.po ? push_item.po.postalCode : "";
            push_item['pos_address'] = push_item.po ? push_item.po.address : "";
            push_item['chain_name'] = push_item.po && push_item.po.chain ? push_item.po && push_item.po.chain.name : "";
            push_item['channel_name'] = push_item.po && push_item.po.channel ? push_item.po && push_item.po.channel.name : "";
            push_item['recover'] = false;
            push_item['lastVisit'] = null;
            push_item['alreadyAdded'] = await Self._getIsAlreadyAdded(push_item, selectedDate, user);
            let filtered = responseData.filter(item => item.routeId === push_item.routeId && item.posId === push_item.posId && item.brandId === push_item.brandId);
            if (filtered.length > 0) continue;
            push_item['rowKey'] = [push_item.routeId, push_item.posId, push_item.brandId].join(",");
            responseData.push(push_item);
        }
        return responseData;
    },

    generateadditionalpos: async function (req, res) {
        let order_cause = [];
        order_cause = [[Sequelize.literal('routeId ASC, posId ASC, brandId ASC')]];

        const { selectedDate, selectedPOS, selectedRoutes } = req.body;
        let responseData = [];
        let data = null;
        if (selectedDate && selectedRoutes.length > 0) {
            let routeIds = selectedRoutes.map(el => el.id);
            data = await RoutePos.findAll({
                where: {
                    routeId: {
                        [Op.or]: routeIds
                    }
                },
                order: [order_cause],
                include: [
                    Route,
                    { model: Pos, include: [Chain, Channel] },
                    Brand
                ],
            })
            responseData = await Self.optimizeAdditionalPosList(data, responseData, selectedDate, req.user);
        }
        if (selectedDate && selectedPOS) {
            let criteria = [];
            selectedPOS.map(el => {
                const { routeId, posId, brandId } = el;
                criteria.push({
                    routeId, posId, brandId
                });
            })
            data = await RoutePos.findAll({
                where: {
                    [Op.or]: criteria
                },
                order: [order_cause],
                include: [
                    Route,
                    { model: Pos, include: [Chain, Channel] },
                    Brand
                ],
            })
            responseData = await Self.optimizeAdditionalPosList(data, responseData, selectedDate, req.user);
        }
        return res.json({ data: responseData });
    },

    addselections: async function (req, res) {
        const { selectedRowKeys, worksessionId, selectedDate } = req.body;
        const userId = req.user.id;
        let selectedRows = [];
        let isAdded = true;
        if (selectedRowKeys && selectedDate) {
            selectedRowKeys.map(el => {
                let [routeId, posId, brandId] = el.split(",");
                if (routeId && posId && brandId) {
                    selectedRows.push({ routeId, posId, brandId });
                }
                return el;
            })
            if (selectedRows.length > 0) {
                let criteria = {};
                for (const row of selectedRows) {
                    const { routeId, posId, brandId } = row;
                    criteria = Object.assign({}, {
                        userId, routeId, posId, brandId,
                        date: selectedDate
                    });
                    let filtered = await Worksessionadditionalpos.count({
                        where: criteria
                    });
                    if (filtered === 0) {
                        const inserted = await Worksessionadditionalpos.create({ userId, routeId, posId, brandId, date: selectedDate });
                        isAdded = isAdded && inserted && inserted.id > 0;
                    }
                }
            }
        }
        return res.json({ success: isAdded });
    },

    get_search_list: async function (req, res) {
        const { target, filter_name } = req.params;
        let data = [];
        if (target && target === "route" && filter_name) {
            let where_cause = {};
            if (filter_name !== "null") {
                where_cause["name"] = { [Op.like]: `%${filter_name}%` };
            }
            data = await Route.findAll({
                where: where_cause,
                order: [["name", "ASC"]],
            });
        } else if (target && target === "posfilter" && filter_name) {
            let where_cause = {};
            if (filter_name !== "null") {
                where_cause["name"] = { [Op.like]: `%${filter_name}%` };
            }
            let query_build_options = {
                include: [Brand, Route]
            };
            if (Object.keys(where_cause).length > 0) {
                query_build_options.include.push({ model: Pos, where: where_cause });
            } else {
                query_build_options.include.push({ model: Pos });
            }
            const posdata = await RoutePos.findAll(query_build_options);
            for (const posItem of posdata) {
                let push_item = { ...posItem.dataValues };
                const { posId, routeId, brandId } = push_item;
                push_item.name = "";
                push_item.id = null;
                if (posId && routeId && brandId) {
                    push_item.id = [routeId, posId, brandId].join(",");
                    push_item.name = [push_item.route ? push_item.route.name : "", push_item.po ? push_item.po.name : "", push_item.brand ? push_item.brand.name : ""].join(" / ");
                }
                data.push(push_item);
            }
        }
        if (!filter_name || filter_name === "null") {
            data = data.slice(0, 100);
        }
        return res.json({ data });
    },

    posinitialize: async function (req, res) {
        const { routeId, posId, visitType, worksessionId, brand_list } = req.body;
        let data = null;
        if (routeId && posId && visitType) {
            let filtered = await WorksessionPos.findOne({
                where: { worksessionId, routeId, posId, visitType }
            })
            if (!filtered) {
                filtered = await WorksessionPos.create({
                    worksessionId,
                    routeId,
                    posId,
                    visitType,
                })
            }
            let brandIds = brand_list.map(el => el.id);
            if (filtered && brandIds.length > 0) {
                let worksessionPosId = filtered.id;
                for (const brandId of brandIds) {
                    let push_item = {
                        worksessionPosId, brandId
                    };
                    let searchItems = await Worksessionposbrand.findAll({ where: push_item });
                    if (searchItems.length === 0) {
                        await Worksessionposbrand.create(push_item);
                    }
                }
            }
            data = filtered;
        }
        return res.json({ data });
    },

    async getPos(req, res) {
        const { user } = req;
        const { worksessionPosId } = req.params;
        let data = null

        const worksessionPos = await WorksessionPos.findOne({
            where: { id: worksessionPosId },
            include: [
                { model: Pos, include: [Chain, Channel] },
                Worksession,
                { model: Brand, include: [Static] }
            ]
        })
        data = worksessionPos;
        let worksessionPosBrands = [];
        if (worksessionPos && worksessionPos.brands) {
            const { routeId, posId, visitType } = worksessionPos;
            for (const worksessionPosBrandItem of worksessionPos.brands) {
                let brandPushItem = { ...worksessionPosBrandItem.dataValues };
                const { id } = worksessionPosBrandItem;
                let routePosItem = await RoutePos.findOne({
                    where: { routeId, posId, visitType, brandId: id },
                    include: [Survey]
                });
                brandPushItem['surveys'] = routePosItem.surveys;
                worksessionPosBrands.push(brandPushItem);
            }
        }
        return res.json({ data, reasonTypes: REASON_TYPES, worksessionPosBrands })
    },

    async saveschedule(req, res) {
        const { worksessionPosId } = req.params;
        const formData = req.body;
        let result = null;
        if (worksessionPosId && formData) {
            const { isScheduled, reasonType, scheduleDateTime, scheduleContactPerson, comments } = formData;
            let saveData = {};
            if (!formData.isScheduled) {
                saveData = {
                    isScheduled,
                    reasonType,
                    scheduleContactPerson: null,
                    scheduleDateTime: null,
                    comments
                };
            } else {
                saveData = {
                    isScheduled,
                    reasonType: null,
                    scheduleContactPerson,
                    scheduleDateTime,
                    comments
                };
            }
            result = await WorksessionPos.update(saveData, { where: { id: worksessionPosId } });
        }
        return res.json({ result });
    },

    async getonepagepdfs(req, res) {
        const { posId } = req.params;
        let data = [];
        let records = [];
        if (posId) {
            records = await BrandOnepagePos.findAll({
                where: {
                    posId
                },
                include: [
                    {
                        model: BrandOnePage,
                        include: [
                            Brand,
                            {
                                model: Static,
                                as: "onepagePdfFile"
                            },
                        ]
                    }
                ]
            })
            for (const onePagePosItem of records) {
                if (onePagePosItem.brand_onepage) {
                    data.push(onePagePosItem.brand_onepage);
                }
            }
        }
        return res.json({ data, records });
    },

    async getpromospdfs(req, res) {
        const { posId } = req.params;
        let data = [];
        let records = [];
        if (posId) {
            records = await BrandPromosPos.findAll({
                where: {
                    posId
                },
                include: [
                    {
                        model: BrandPromos,
                        include: [
                            Brand,
                            {
                                model: Static,
                                as: "promosPdfFile"
                            },
                        ]
                    }
                ]
            })
            console.log(records);
            for (const promosPosItem of records) {
                if (promosPosItem.brand_promo) {
                    data.push(promosPosItem.brand_promo);
                }
            }
        }
        return res.json({ data, records });
    },

    async savepos(req, res) {
        const { posId } = req.params;
        let data = req.body;
        console.log(posId, data);
        let retVal = null;
        if (posId && data) {
            data = await Pos.update(data, { where: { id: posId } });
        }
        return res.json({ success: data });
    },

    async getbasedata(req, res) {
        const { isFlag } = req.query;
        if (isFlag === "chainlist") {
            const chain_list = await Chain.findAll({
                where: { parentId: { [Op.is]: null } },
                order: [['name', 'ASC']],
            });
            return res.json({ chain_list });
        } else if (isFlag === "reasonTypes") {
            return res.json({ reasonTypes })
        } else if (isFlag === "weekdays") {
            let weekdays = utils.convertObjectToSpecific(weekLetters);
            return res.json({ weekdays, weekCount })
        } else if (isFlag === "newpos") {
            const chain_list = await Chain.findAll({
                where: { parentId: { [Op.is]: null } },
                order: [['name', 'ASC']],
            });
            let weekdays = utils.convertObjectToSpecific(weekLetters);
            const brandList = await Brand.findAll({
                where: { status: "active" },
                order: [["name", "ASC"]]
            })
            const surveyList = await Survey.findAll({
                where: { active: true },
                order: [["name", "ASC"]]
            })
            return res.json({ chain_list, weekdays, weekCount, periodsCount, brandList, surveyList });
        } else if (isFlag === "searchbrand") {
            const { filterValue } = req.query;
            let where_cause = {
                name: { [Op.like]: `%${filterValue}%` },
                status: "active"
            }
            const data = await Brand.findAll({
                where: where_cause
            })
            return res.json({ data });
        }
        return res.json({ success: false });
    },

    async getCurrentInactiveData(req, res) {
        const { userId, routeId, posId } = req.params;
        if (userId && routeId && posId) {
            const inactiveData = await RoutePosInactive.findOne({
                where: {
                    userId, routeId, posId
                },
                include: [
                    Brand,
                    {
                        model: Static,
                        as: "inactivePhoto"
                    }
                ]
            });
            return res.json({ inactiveData })
        }
        return res.json({ success: false });
    },

    async saveinactivedata(req, res) {
        const { routePosInactiveId } = req.params;
        let body = req.body;
        console.log(body);
        const { reasonType, gpvComments, brands, userId, routeId, posId, photoId, date } = body;
        let route_pos_inactive_data = {
            reasonType, gpvComments, userId, routeId, posId, photoId, date
        }
        if (routePosInactiveId) {
            const updatedData = await RoutePosInactive.update(route_pos_inactive_data, { where: { id: routePosInactiveId } });
            if (updatedData) {
                await RoutePosInactiveBrands.destroy({ where: { routePosInactiveId } });
                for (const brandId of brands) {
                    await RoutePosInactiveBrands.create({
                        routePosInactiveId,
                        brandId
                    });
                }
            }
        } else {
            const createdData = await RoutePosInactive.create(route_pos_inactive_data);
            if (createdData) {
                let insertedId = createdData.id;
                for (const brandId of brands) {
                    await RoutePosInactiveBrands.create({
                        routePosInactiveId: insertedId,
                        brandId
                    });
                }
            }
            return res.json({ data: createdData });
        }
        return res.json({ success: false });
    },

    async savechangepos(req, res) {
        const { posId } = req.params;
        let body = req.body;
        let data = null;
        if (posId && body) {
            data = await Pos.update(body, { where: { id: posId } });
        }
        return res.json({ data });
    },

    async getCurrentRequestVisitDays(req, res) {
        const { userId, routeId, posId } = req.params;
        if (userId && routeId && posId) {
            let requestVisitDays = await RoutePosRequestVisitday.findOne({
                where: {
                    userId, routeId, posId
                },
                include: [
                    Brand,
                ]
            });
            if (requestVisitDays) {
                requestVisitDays = requestVisitDays.dataValues;
                requestVisitDays["visitdays"] = [];
                requestVisitDays["settedWeeks"] = [];
                for (let i = 1; i <= weekCount; i++) {
                    if (!requestVisitDays[`w${i}`]) continue;
                    let weekArr = requestVisitDays[`w${i}`].split(",");
                    if (weekArr.length > 0) {
                        requestVisitDays["visitdays"] = weekArr;
                        requestVisitDays["settedWeeks"].push(i);
                    }
                }
            }
            return res.json({ requestVisitDays })
        }
        return res.json({ success: false });
    },

    async saverequestvisitdays(req, res) {
        const { routePosRequestVisitdayId } = req.params;
        let body = req.body;
        const { userId, routeId, posId, date, gpvComments, brands, visitdays, settedWeeks } = body;
        let route_pos_request_visit_days = _.omit(body, ["visitdays", "settedWeeks", "id"]);
        let visitdays_value = visitdays.join(",");
        for (let i = 1; i <= weekCount; i++) {
            route_pos_request_visit_days[`w${i}`] = null;
        }
        for (const weekNum of settedWeeks) {
            route_pos_request_visit_days[`w${weekNum}`] = visitdays_value;
        }
        console.log(body);
        console.log(route_pos_request_visit_days);
        if (routePosRequestVisitdayId) {
            const updatedData = await RoutePosRequestVisitday.update(route_pos_request_visit_days, { where: { id: routePosRequestVisitdayId } });
            if (updatedData) {
                await RoutePosRequestVisitdayBrands.destroy({ where: { routePosRequestVisitdayId } });
                for (const brandId of brands) {
                    await RoutePosRequestVisitdayBrands.create({
                        routePosRequestVisitdayId,
                        brandId
                    });
                }
            }
        } else {
            const createdData = await RoutePosRequestVisitday.create(route_pos_request_visit_days);
            if (createdData) {
                let insertedId = createdData.id;
                for (const brandId of brands) {
                    await RoutePosRequestVisitdayBrands.create({
                        routePosRequestVisitdayId: insertedId,
                        brandId
                    });
                }
            }
            return res.json({ data: createdData });
        }
        return res.json({ success: false });
    },

    async createnewpos(req, res) {
        let body = req.body;
        let { name, brandSurveys, visitdays, settedWeeks, periods, gpvComments, attachmentIdList, routeId } = body;
        brandSurveys = _.uniqBy(brandSurveys, "id");
        let i = 0, j = 0;
        let error_log = { success: false };
        if (name) {
            // create pos isNotRequested - false, isRequestApproved - false
            let posData = _.omit(body, ["routeId", "brandSurveys", "visitdays", "settedWeeks", "periods", "gpvComments", "attachmentIdList"]);
            posData["isNotRequested"] = false;
            posData["isRequestApproved"] = false;
            const filtered_pos = await Pos.findOne({ where: { name: posData.name } });

            error_log.message = "Name duplicated !";
            if (filtered_pos) return res.json(error_log);

            const createdPos = await Pos.create(posData);
            error_log.message = "the creation of POS was failed !";
            if (!createdPos) return res.json(error_log);

            let newPosId = createdPos.id;
            // add attachments
            let orderIndex = 1;
            for (const attachmentId of attachmentIdList) {
                await PosAttachment.create({ posId: newPosId, attachmentId, orderIndex });
                orderIndex++;
            }
            // with created pos and brandIds, create row - route_pos 
            //  type - present, periods, visitdays, weeks
            for (const brandItem of brandSurveys) {
                let createRoutePosData = {
                    routeId, posId: newPosId, brandId: brandItem.id, visitType: "PRESENT",
                }
                for (i = 1; i <= periodsCount; i++) createRoutePosData[`p${i}`] = false;
                for (const activePeriodIndex of periods) {
                    createRoutePosData[`p${activePeriodIndex}`] = true;
                }
                for (const activeWeekIndex of settedWeeks) {
                    createRoutePosData[`s${activeWeekIndex}`] = visitdays.join(",");
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

            // create row - pos_new_requests and pos_new_request_brands
            let createPosNewRequestData = {
                userId: req.user.id,
                routeId,
                posId: newPosId,
                gpvComments
            }
            const pos_new_request_data = await PosNewRequest.create(createPosNewRequestData);
            if (pos_new_request_data) {
                let posNewRequestedId = pos_new_request_data.id;
                for (const brandItem of brandSurveys) {
                    await PosNewRequestBrands.create({ posNewRequestedId, brandId: brandItem.id });
                }
            }
            return res.json({ posId: newPosId })
        }
        return res.json(error_log);
    },

    /****** CHECKING ******/

    async getPosToRecover(userId, date, data) {
        // todo: merge with completed pos in last 10 days
        const { week, period } = utils.convertDate(date)
        const days = [0, 1, 2, 3, 4, 5, 6] //all week
        return Self.findPosToVisit(userId, null, null, period, week, days, data)
    },

    async initPos(req, res) {
        const { worksessionId, posId } = req.params;
        const { body, user } = req;
        const ret = await WorksessionPos.create({
            posId,
            worksessionId,
            ...(body || {})
        })
        const worksessionPos = await WorksessionPos.findOne({
            where: { id: ret.id },
            include: [Pos, Worksession]
        })

        const meta = await Self._getPosMeta(posId, user.id, worksessionPos.worksession.date, worksessionPos.id)
        const data = {
            worksessionPos,
            ...meta
        }

        return res.json({ data })
    },

    async getSurveyPos(req, res) {
        const { worksessionId, posId, surveyId } = req.params;

        const ret = await Self._getWorksessionSurveyData(worksessionId, surveyId, posId)

        return res.json(ret)
    },

    async _getWorksessionSurveyData(worksessionId, surveyId, posId) {

        const surveyInclude = surveyController.getSurveyInclude()



        const data = await WorksessionSurvey.findOne({
            where: { surveyId },
            include: [
                {
                    model: WorksessionSurveyResponse,
                    required: false
                },

                {
                    model: Survey,
                    include: surveyInclude,
                    required: false
                },
                {
                    model: WorksessionPos,
                    required: true,
                    where: {
                        worksessionId,
                        posId
                    }
                }
            ]
        })
        const meta = {
            prev: {} //last completed survey
        }

        return { data, meta }
    },

    async initSurveyPos(req, res) {
        const { worksessionId, posId, surveyId } = req.params;
        const wp = await WorksessionPos.findOne({
            where: { worksessionId, posId }
        })

        await WorksessionSurvey.create({
            worksessionPosId: wp.id,
            surveyId
        })

        const ret = await Self._getWorksessionSurveyData(worksessionId, surveyId, posId)

        return res.json(ret)

    },

    async getPosBrands(posId, userId, date) {

        const { day, period, week } = utils.convertDate(date)
        const dayStr = DAYS_ARR[day]
        const weekTableName = `s${week}`
        const periodTableName = `p${period}`

        return await Brand.findAll({
            include: [
                Static,
                Survey,
                {
                    model: RoutePos,
                    where: {
                        posId,
                        [periodTableName]: {
                            [Op.eq]: true
                        },
                        [weekTableName]: {
                            [Op.like]: `%${dayStr}%`
                        }
                    },
                    include: {
                        model: Route,
                        include: {
                            model: User,
                            where: { id: userId }
                        }
                    }
                }
            ]
        })

    },


    _getPosMeta: async function (posId, userId, date, worksessionPosId) {

        const responses = await Brand.findAll({
            include: [
                {
                    model: Survey,
                    required: true,
                    include: [{
                        model: WorksessionSurvey,
                        where: { isCompleted: true },
                        required: true,
                        include: [
                            {
                                model: WorksessionPos,
                                required: true,
                                where: { id: worksessionPosId },
                            }]
                    }]
                }
            ]
        })


        return {
            brands: {
                routes: await Self.getPosBrands(posId, userId, date),
                responses,
            }
        }
    },

}

module.exports = Self
