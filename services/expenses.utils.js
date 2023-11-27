const { Sequelize, ExpenseKilometer, ExpenseOther, ExpenseType, Liquidation, User, Route, Geography, Brand, Company } = require('../sequelize')
const util = require('util')
const moment = require('moment')
const Op = Sequelize.Op;
const Fn = Sequelize.fn;
const { costPerKM, deductAmountPerdayKM, expenseTypeAccountCode, spainish_short_month, getAllUserChildren } = require('../utils');

const Self = {

    // calcPerDayKMfromTotalKM(totalKM) {
    //     return totalKM > deductAmountPerdayKM ? (totalKM - deductAmountPerdayKM) : 0;
    // },

    calcPerDayKMfromTotalKM(totalKM, discount_km) {
        let val = discount_km ? discount_km : 0;
        return totalKM > val ? (totalKM - val) : 0;
    },

    calcPerDayKMfromSumTotalKM(totalKM, kmDaysWorked) {
        return totalKM > deductAmountPerdayKM * kmDaysWorked ? (totalKM - deductAmountPerdayKM * kmDaysWorked) : 0;
    },

    get_selectable_routes: async function (userId) {
        let where_cause = [];
        where_cause.push({ id: userId })
        let route_where_cause = [];
        route_where_cause.push({ status: 'active' })

        let order_cause = [];
        order_cause = ["name", "ASC"];

        let data = [];

        data = await User.findOne({
            where: where_cause,
            order: [order_cause],
            include: [
                { model: Route, where: route_where_cause }
            ]
        })
        return data && data.routes !== null ? data.routes : [];
    },

    generateShortText(text, searchString) {
        let cut_size = 20;
        if (text.length > cut_size) {
            let startIndex = text.indexOf(searchString);
            let start1 = startIndex - cut_size >= 0 ? startIndex - 10 : 0;
            let start2 = startIndex;
            let end1 = startIndex + searchString.length;
            let end2 = end1 + cut_size > text.length - 1 ? text.length - 1 : end1 + cut_size;
            let prepend = text.slice(start1, start2);
            let append = text.slice(end1, end2);
            if (start1 > 0) {
                prepend = '...' + prepend;
            }
            if (end2 < text.length - 1) {
                append = append + '...';
            }
            return prepend + searchString + append;
        }
        return text;
    },

    getFullGeography: async function (geography_item) {
        let geo_push_item = { ...geography_item.dataValues };
        geo_push_item.country_name = '';
        geo_push_item.state_name = '';
        geo_push_item.province_name = geography_item.name;
        geo_push_item.state = {};
        geo_push_item.country = {};
        if (geography_item.parentId !== null && geography_item.parentId !== geography_item.id) {
            geo_push_item.state = await Geography.findOne({ where: { id: geography_item.parentId } });
            if (geo_push_item.state !== null) {
                geo_push_item.state_name = geo_push_item.state.name;
            }
            if (geo_push_item.state.parentId !== null && geo_push_item.state.parentId !== geo_push_item.state.id) {
                geo_push_item.country = await Geography.findOne({ where: { id: geo_push_item.state.parentId } });
                if (geo_push_item.country !== null) {
                    geo_push_item.country_name = geo_push_item.country.name;
                }
            }
        }
        return geo_push_item.province_name + ',' + geo_push_item.state_name + ',' + geo_push_item.country_name;
    },

    getFirstAndLastDayOfMonth: function (year, month) {
        date = new Date(
            year + "-" + month + "-02"
        );
        var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        firstDay = firstDay.toISOString().slice(0, 10);
        lastDay = lastDay.toISOString().slice(0, 10);
        return { firstDay, lastDay };
    },

    currency_format(val) {
        const formatter = new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "EUR",
        });
        return formatter.format(val);
    },

    updateCurrentLiquidation: async function (is_flag, data) {
        const { current_year, current_month, current_userId } = data;
        let liquidation_data = {
            year: current_year,
            month: current_month,
            userId: current_userId,
            km_total: 0,
            km_incidence_total: 0,
            km_pending_approval: 0,
            expense_total: 0,
            expense_incidence_total: 0,
            expense_pending_approval: 0,
            status: 'Pdte Aprob Gastos',
            kmDaysWorked: 0,
            kmDataCount: 0,
            otherExpensesDaysWorked: 0,
            otherExpensesDataCount: 0,
            food_total: 0,
            transport_total: 0,
            lodgment_total: 0,
            otherexpenses_total: 0,
        }
        let status_count = {
            pending: 0,
            incidence: 0,
            approved: 0
        }
        const km_datas = await ExpenseKilometer.findAndCountAll({
            where: Sequelize.and(
                Sequelize.where(Sequelize.col('userId'), current_userId),
                Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('date')), current_year),
                Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('date')), current_month),
            ),
            include: [
                User
            ]
        })
        let work_day_list = [];
        let km_data_count = 0;
        for (const km_item of km_datas.rows) {
            let item = km_item.dataValues;
            if (item.approvalStatus === 'Pendiente' || item.approvalStatus === 'Pendiente Aprobación') {
                // liquidation_data.km_pending_approval += this.calcPerDayKMfromTotalKM(Math.abs(item.endKM - item.startKM));
                liquidation_data.km_pending_approval += this.calcPerDayKMfromTotalKM(Math.abs(item.endKM - item.startKM), item.user.dataValues.discount_km);
                status_count.pending++;
            }
            else if (item.approvalStatus === 'Incidencia') {
                // liquidation_data.km_incidence_total += this.calcPerDayKMfromTotalKM(Math.abs(item.endKM - item.startKM));
                liquidation_data.km_incidence_total += this.calcPerDayKMfromTotalKM(Math.abs(item.endKM - item.startKM), item.user.dataValues.discount_km);
                status_count.incidence++;
            }
            else if (item.approvalStatus === 'Aprobado') {
                // liquidation_data.km_total += this.calcPerDayKMfromTotalKM(Math.abs(item.endKM - item.startKM));
                liquidation_data.km_total += this.calcPerDayKMfromTotalKM(Math.abs(item.endKM - item.startKM), item.user.dataValues.discount_km);
                status_count.approved++;
            }
            let filtered_work_day = work_day_list.filter(day => day === item.date);
            if (filtered_work_day.length === 0) {
                work_day_list.push(item.date);
            }
            km_data_count++;
        }
        liquidation_data.kmDaysWorked = work_day_list.length;
        liquidation_data.kmDataCount = km_data_count;
        const other_datas = await ExpenseOther.findAndCountAll({
            where: Sequelize.and(
                Sequelize.where(Sequelize.col('userId'), current_userId),
                Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('date')), current_year),
                Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('date')), current_month),
            )
        })
        work_day_list = [];
        oe_data_count = 0;
        for (const other_item of other_datas.rows) {
            let item = other_item.dataValues;
            if (item.approvalStatus === 'Pendiente' || item.approvalStatus === 'Pendiente Aprobación') {
                liquidation_data.expense_pending_approval += item.amount;
                status_count.pending++;
            }
            else if (item.approvalStatus === 'Incidencia') {
                liquidation_data.expense_incidence_total += item.amount;
                status_count.incidence++;
            }
            else if (item.approvalStatus === 'Aprobado') {
                liquidation_data.expense_total += item.amount;
                status_count.approved++;
                if (item.expenseTypeId === 1) { // Lodgment
                    liquidation_data.lodgment_total += item.amount;
                } else if (item.expenseTypeId === 6) { // Food
                    liquidation_data.food_total += item.amount;
                } else if (item.expenseTypeId === 7 || item.expenseTypeId === 8 || item.expenseTypeId === 9) { // Other - Compra Muestra de Producto, Material de Oficina, Correos y Mensajeria
                    liquidation_data.otherexpenses_total += item.amount;
                }
                else {
                    liquidation_data.transport_total += item.amount;
                }
            }
            let filtered_work_day = work_day_list.filter(day => day === item.date);
            if (filtered_work_day.length === 0) {
                work_day_list.push(item.date);
            }
            oe_data_count++;
        }
        liquidation_data.otherExpensesDaysWorked = work_day_list.length;
        liquidation_data.otherExpensesDataCount = oe_data_count;

        if (status_count.pending > 0) {
            liquidation_data.status = 'Pdte Aprob Gastos';
        } else if (status_count.incidence > 0) {
            liquidation_data.status = 'Pdte Aprob Gastos';
        } else {
            liquidation_data.status = 'Pdte Firma Empleado';
        }
        if (km_datas.count === 0 && other_datas.count === 0) {
            await Liquidation.destroy({
                where: {
                    year: liquidation_data.year,
                    month: liquidation_data.month,
                    userId: liquidation_data.userId
                }
            })
        }
        else {
            let filtered_liquidation_data = await Liquidation.findOne({
                where: {
                    year: liquidation_data.year,
                    month: liquidation_data.month,
                    userId: liquidation_data.userId
                }
            });
            if (filtered_liquidation_data) {
                const data = await Liquidation.update(liquidation_data, { where: { id: filtered_liquidation_data.id } });
            }
            else {
                liquidation_data = await Liquidation.create(liquidation_data);
            }
        }
        return liquidation_data;
    },

    generateLiquidation: async function (is_flag, current_data) {
        let batch_data = null;
        if (current_data.id === undefined) {
            if (is_flag === 'km') {
                batch_data = await ExpenseKilometer.create(current_data);
            }
            else {
                batch_data = await ExpenseOther.create(current_data)
            }
            if (batch_data) {
                let date_value = batch_data.dataValues.date;
                date_value = date_value.toISOString().slice(0, 10);
                date_value = date_value.split('-');
                let update_credentials = {
                    current_year: date_value[0],
                    current_month: date_value[1],
                    current_userId: batch_data.dataValues.userId,
                }
                await this.updateCurrentLiquidation(is_flag, update_credentials);
            }
        }
        else {
            let prev_data = null;
            let new_update_data = null;
            if (is_flag === 'km') {
                prev_data = await ExpenseKilometer.findOne({
                    where: { id: current_data.id }
                })
                new_update_data = await ExpenseKilometer.update(current_data, { where: { id: current_data.id } })
            }
            else {
                prev_data = await ExpenseOther.findOne({
                    where: { id: current_data.id }
                })
                new_update_data = await ExpenseOther.update(current_data, { where: { id: current_data.id } })
            }
            if (prev_data) {
                let date_value = prev_data.dataValues.date;
                date_value = date_value.split('-');
                let prev_update_credentials = {
                    current_year: date_value[0],
                    current_month: date_value[1],
                    current_userId: prev_data.dataValues.userId,
                }
                await this.updateCurrentLiquidation(is_flag, prev_update_credentials);
            }
            if (new_update_data) {
                new_update_data = current_data;
                let date_value = new_update_data.date;
                date_value = date_value.split('-');
                let new_update_credentials = {
                    current_year: date_value[0],
                    current_month: date_value[1],
                    current_userId: new_update_data.userId,
                }
                await this.updateCurrentLiquidation(is_flag, new_update_credentials);
            }
            batch_data = new_update_data;
        }
        return batch_data;
    },

    getDailyDetailKM: async function (criteria) {
        let where_cause = {
            [Op.or]: []
        };
        for (const criteria_item of criteria) {
            const current_start_end_date = this.getFirstAndLastDayOfMonth(criteria_item.year, criteria_item.month);
            where_cause[Op.or].push({
                userId: criteria_item.userId,
                date: {
                    [Op.and]: [
                        { [Op.gte]: new Date(current_start_end_date.firstDay) },
                        { [Op.lte]: new Date(current_start_end_date.lastDay) },
                    ]
                }
            })
        }
        let daily_data = await ExpenseKilometer.findAll({
            where: where_cause,
            order: [["userId", "ASC"], ["date", "ASC"]],
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
                Route,
                { model: User, as: "approver" }
            ],
        })

        let data_list = [];
        for (let i = 0; i < daily_data.length; i++) {
            let item = daily_data[i].dataValues;
            item.totalKM = Math.abs(item.startKM - item.endKM);
            item.username = item.user.name + ' ' + item.user.surname;
            item.usertype = item.user.role;
            item.routename = item.route ? item.route.name : "";
            item.parentName = '';
            item.approverName = '';
            if (item.user !== null && item.user.Parent && item.user.Parent !== null) {
                item.parentName = item.user.Parent.name + ' ' + item.user.Parent.surname;
            }
            if (item.approver !== null) {
                item.approverName = item.approver.name + ' ' + item.approver.surname;
            }
            item.companyName = "";
            if (item.user && item.user.company) {
                item.companyName = item.user.company.name;
            }
            data_list.push(item);
        }
        return data_list;
    },

    getDailyDetailOE: async function (criteria) {
        let where_cause = {
            [Op.or]: []
        };
        for (const criteria_item of criteria) {
            const current_start_end_date = this.getFirstAndLastDayOfMonth(criteria_item.year, criteria_item.month);
            where_cause[Op.or].push({
                userId: criteria_item.userId,
                date: {
                    [Op.and]: [
                        { [Op.gte]: new Date(current_start_end_date.firstDay) },
                        { [Op.lte]: new Date(current_start_end_date.lastDay) },
                    ]
                }
            })
        }
        let daily_data = await ExpenseOther.findAll({
            where: where_cause,
            order: [["userId", "ASC"], ["date", "ASC"]],
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
                Route,
                ExpenseType,
                { model: User, as: "otherapprover" }
            ],
        })

        let data_list = [];
        for (let i = 0; i < daily_data.length; i++) {
            let item = daily_data[i].dataValues;
            item.username = item.user.name + ' ' + item.user.surname;
            item.usertype = item.user.role;
            item.routename = item.route ? item.route.name : '';
            item.parentName = '';
            item.approverName = '';
            if (item.user !== null && item.user.Parent && item.user.Parent !== null) {
                item.parentName = item.user.Parent.name + ' ' + item.user.Parent.surname;
            }
            if (item.otherapprover !== null) {
                item.approverName = item.otherapprover.name + ' ' + item.otherapprover.surname;
            }
            item.expenseTypeName = '';
            if (item.expense_type !== null) {
                item.expenseTypeName = item.expense_type.name;
            }
            item.companyName = "";
            if (item.user && item.user.company) {
                item.companyName = item.user.company.name;
            }
            data_list.push(item);
        }
        return data_list;
    },

    get_chart_criteria: async function (user, criteria) {
        const userId = user.id;
        let where_cause = {};
        let buffer_values = [];
        let start_date = criteria.start_date.split("-");
        let end_date = criteria.end_date.split("-");
        let start_date_year = parseInt(start_date[0]);
        let start_date_month = parseInt(start_date[1]);
        let end_date_year = parseInt(end_date[0]);
        let end_date_month = parseInt(end_date[1]);
        let start_end_date_criteria = [
            {
                [Op.and]: {
                    year: { [Op.eq]: start_date_year },
                    month: {
                        [Op.and]: [
                            { [Op.lte]: start_date_year === end_date_year ? end_date_month : 12 },
                            { [Op.gte]: start_date_month },
                        ]
                    }
                }
            },
            {
                [Op.and]: {
                    year: { [Op.eq]: end_date_year },
                    month: {
                        [Op.and]: [
                            { [Op.lte]: end_date_month },
                            { [Op.gte]: start_date_year === end_date_year ? start_date_month : 1 },
                        ]
                    }
                }
            },
        ];
        let middle_years = [];
        let i = 0;
        for (i = start_date_year + 1; i <= end_date_year - 1; i++) {
            middle_years.push(i);
        }
        if (middle_years.length > 0) {
            where_cause = {
                [Op.or]: [
                    ...start_end_date_criteria,
                    {
                        year: {
                            [Op.and]: [
                                { [Op.gte]: middle_years[0] },
                                { [Op.lte]: middle_years[middle_years.length - 1] },
                            ]
                        }
                    }
                ]
            }
        } else {
            where_cause = {
                [Op.or]: start_end_date_criteria
            }
        }
        if (criteria.users && criteria.users.length > 0) {
            where_cause['userId'] = { [Op.or]: criteria.users }
        }
        else {
            if (user.role === 'gpv') {
                where_cause['userId'] = userId;
            }
            else if (user.role !== 'admin' && user.role !== 'subadmin') {
                let user_list = await getAllUserChildren(userId, []);
                if (user_list.length > 0) {
                    user_list.push(userId);
                    where_cause['userId'] = { [Op.or]: user_list }
                } else {
                    where_cause['userId'] = userId;
                }
            }
        }

        return {
            start_date_year,
            start_date_month,
            end_date_year,
            end_date_month,
            where_cause,
        }
    },

    get_brandIds_from_list: function (brands) {
        let list = [];
        for (const brandItem of brands) {
            list.push(brandItem.dataValues.id);
        }
        return list;
    },

    get_chart_data_km: async function (user, criteria, isAverage) {
        let colors = ["#0000ff", "#00ff00", "#ff0000", "#00ffff", "#ffff00", "#ff00ff"];
        let { start_date_year, start_date_month, end_date_year, end_date_month, where_cause } = await this.get_chart_criteria(user, criteria);

        let liquidationdata = await Liquidation.findAll({
            attributes: ["year", "month", "userId", "km_total", "expense_total", "kmDaysWorked", "otherExpensesDaysWorked"],
            where: where_cause,
            order: [['year', 'ASC'], ['month', 'ASC']],
            include: [
                {
                    model: User,
                    include: [
                        {
                            model: User,
                            as: 'Parent'
                        },
                        Brand
                    ]
                },
            ],
        })

        let data_values = {}
        let data_counts = {};
        let i = 0;
        let j = 0;
        let dataSeries = [];
        for (i = start_date_year; i <= end_date_year; i++) {
            let series_push_item = {
                name: i,
                data: [],
            }
            data_values[i] = {}
            data_counts[i] = {}
            for (j = 1; j <= 12; j++) {
                if (i === end_date_year && j <= end_date_month) {
                    data_values[i][j] = 0;
                    data_counts[i][j] = 0;
                }
                if (i >= start_date_year && i < end_date_year) {
                    data_values[i][j] = 0;
                    data_counts[i][j] = 0;
                }
            }
            dataSeries.push(series_push_item);
        }

        let data_list = [];
        for (let i = 0; i < liquidationdata.length; i++) {
            let item = liquidationdata[i].dataValues;
            if (item.user !== null && item.user.Parent && item.user.Parent !== null) {
                item.parentId = item.user.Parent.id;
                if (criteria.parents.length > 0 && !criteria.parents.includes(item.parentId)) {
                    continue;
                }
            }
            if (item.user !== null) {
                if (criteria.departments.length > 0 && !criteria.departments.includes(item.user.department)) {
                    continue;
                }
                // if (criteria.projects.length > 0 && !criteria.projects.includes(item.user.project)) {
                //     continue;
                // }
                if (criteria.projects && criteria.projects.length > 0) {
                    let id_list_brands = Self.get_brandIds_from_list(item.user.brands);
                    let filtered_user_brands = id_list_brands.filter(brand_id => criteria.projects.includes(brand_id));
                    if (filtered_user_brands.length === 0) {
                        continue;
                    }
                }
            }

            if (item.kmDaysWorked > 0) {
                // item.km_avg = (item.km_total / item.kmDaysWorked);
                item.km_avg = (item.km_total);
            } else {
                item.km_avg = 0;
            }
            data_values[item.year][item.month] += item.km_avg;
            data_counts[item.year][item.month]++;
            data_list.push(item);
        }

        if (isAverage) {
            for (const [key_year, value_year] of Object.entries(data_values)) {
                for (const [key_month, value_month] of Object.entries(value_year)) {
                    if (data_counts[key_year][key_month] !== 0) {
                        data_values[key_year][key_month] /= data_counts[key_year][key_month];
                    }
                }
            }
        }

        let yaxis_max_value = 0;
        i = 0;
        for (const [key_year, value_year] of Object.entries(data_values)) {
            for (const [key_month, value_month] of Object.entries(value_year)) {
                dataSeries[i].data.push(data_values[key_year][key_month].toFixed(2));
                if (yaxis_max_value < data_values[key_year][key_month]) {
                    yaxis_max_value = data_values[key_year][key_month];
                }
            }
            i++;
        }
        if (yaxis_max_value === 0) {
            yaxis_max_value = 100;
        }

        let labels = spainish_short_month;
        let yaxis = [
            {
                title: {
                    // text: 'Temperature'
                },
                max: yaxis_max_value,
            }
        ];
        return {
            dataSeries,
            labels,
            yaxis,
            colors
        }
    },

    get_chart_data_oe: async function (user, criteria, isAverage) {
        let colors = ["#0000ff", "#00ff00", "#ff0000", "#00ffff", "#ffff00", "#ff00ff"];
        let { start_date_year, start_date_month, end_date_year, end_date_month, where_cause } = await this.get_chart_criteria(user, criteria);

        let liquidationdata = await Liquidation.findAll({
            attributes: ["year", "month", "userId", "km_total", "expense_total", "kmDaysWorked", "otherExpensesDaysWorked"],
            where: where_cause,
            order: [['year', 'ASC'], ['month', 'ASC']],
            include: [
                {
                    model: User,
                    include: [
                        {
                            model: User,
                            as: 'Parent'
                        },
                        Brand
                    ]
                },
            ],
        })

        let data_values = {}
        let data_counts = {};
        let i = 0;
        let j = 0;
        let dataSeries = [];
        for (i = start_date_year; i <= end_date_year; i++) {
            let series_push_item = {
                name: i,
                data: [],
            }
            data_values[i] = {}
            data_counts[i] = {}
            for (j = 1; j <= 12; j++) {
                if (i === end_date_year && j <= end_date_month) {
                    data_values[i][j] = 0;
                    data_counts[i][j] = 0;
                }
                if (i >= start_date_year && i < end_date_year) {
                    data_values[i][j] = 0;
                    data_counts[i][j] = 0;
                }
            }
            dataSeries.push(series_push_item);
        }
        let data_list = [];
        for (let i = 0; i < liquidationdata.length; i++) {
            let item = liquidationdata[i].dataValues;
            if (item.user !== null && item.user.Parent && item.user.Parent !== null) {
                item.parentId = item.user.Parent.id;
                if (criteria.parents.length > 0 && !criteria.parents.includes(item.parentId)) {
                    continue;
                }
            }
            if (item.user !== null) {
                if (criteria.departments.length > 0 && !criteria.departments.includes(item.user.department)) {
                    continue;
                }
                // if (criteria.projects.length > 0 && !criteria.projects.includes(item.user.project)) {
                //     continue;
                // }
                if (criteria.projects.length > 0) {
                    let id_list_brands = Self.get_brandIds_from_list(item.user.brands);
                    let filtered_user_brands = id_list_brands.filter(brand_id => criteria.projects.includes(brand_id));
                    if (filtered_user_brands.length === 0) {
                        continue;
                    }
                }
            }

            // item.expense_total = item.expense_total + item.km_total * costPerKM;
            item.expense_total = item.expense_total;
            data_values[item.year][item.month] += item.expense_total;
            data_counts[item.year][item.month]++;
            data_list.push(item);
        }

        if (isAverage) {
            for (const [key_year, value_year] of Object.entries(data_values)) {
                for (const [key_month, value_month] of Object.entries(value_year)) {
                    if (data_counts[key_year][key_month] !== 0) {
                        data_values[key_year][key_month] /= data_counts[key_year][key_month];
                    }
                }
            }
        }

        let yaxis_max_value = 0;
        i = 0;
        for (const [key_year, value_year] of Object.entries(data_values)) {
            for (const [key_month, value_month] of Object.entries(value_year)) {
                dataSeries[i].data.push(data_values[key_year][key_month].toFixed(2));
                if (yaxis_max_value < data_values[key_year][key_month]) {
                    yaxis_max_value = data_values[key_year][key_month];
                }
            }
            i++;
        }
        if (yaxis_max_value === 0) {
            yaxis_max_value = 100;
        }

        let labels = [
            "ENE",
            "FEB",
            "MAR",
            "ABR",
            "MAY",
            "JUN",
            "JUL",
            "AGO",
            "SEPT",
            "OCT",
            "NOV",
            "DIC",
        ];
        let yaxis = [
            {
                title: {
                    // text: 'Temperature'
                },
                max: yaxis_max_value,
            }
        ];
        return {
            dataSeries,
            labels,
            yaxis,
            colors
        }
    },

    get_prev_rest_year_month: function (current_year, current_month) {
        const difference_length = 6;
        let prev_date_year = current_year;
        let prev_date_month = current_month;
        if (current_month - 1 > 0) {
            prev_date_month = current_month - 1;
        }
        else {
            prev_date_year--;
            prev_date_month = 12 + (current_month - 1);
        }

        let rest_date_year = current_year;
        let rest_date_month = current_month;
        if (current_month - difference_length > 0) {
            rest_date_month = current_month - difference_length;
        }
        else {
            rest_date_year--;
            rest_date_month = 12 + (current_month - difference_length);
        }
        return {
            current_date: { year: current_year, month: current_month },
            prev_date: { year: prev_date_year, month: prev_date_month },
            rest_date: { year: rest_date_year, month: rest_date_month }
        }
    },

    get_user_where_cause: async function (user, isteam) {
        const { id, role } = user;
        let where_cause = {};
        let buffer_values = [];
        if (user.role === 'gpv' || (isteam && isteam === 'my')) {
            where_cause['userId'] = id;
        }
        else if (role !== 'admin' && role !== 'subadmin') {
            let user_list = await getAllUserChildren(id, []);
            if (user_list.length > 0) {
                where_cause['userId'] = { [Op.or]: user_list }
            } else {
                where_cause['userId'] = id;
            }
        }
        return where_cause;
    },

    get_where_cause_in_users: async function (user) {
        const { id, role } = user;
        let where_cause = {};
        let buffer_values = [];
        if (user.role === 'gpv') {
            where_cause['id'] = id;
        }
        else if (role !== 'admin' && role !== 'subadmin') {
            let user_list = await getAllUserChildren(id, []);
            if (user_list.length > 0) {
                user_list.push(id);
                where_cause['id'] = { [Op.or]: user_list }
            } else {
                where_cause['id'] = id;
            }
        }
        return where_cause;
    },

    get_where_cause: async function (user, date_credentials) {
        const { current_date, prev_date, rest_date } = date_credentials;
        let where_cause = {};
        let buffer_values = [];
        const userId = user.id;
        if (user.role === 'gpv') {
            where_cause['userId'] = userId;
        }
        else if (user.role !== 'admin' && user.role !== 'subadmin') {
            let user_list = await getAllUserChildren(userId, []);
            if (user_list.length > 0) {
                user_list.push(userId);
                where_cause['userId'] = { [Op.or]: user_list }
            } else {
                where_cause['userId'] = userId;
            }
        }
        let rest_criteria = {
            ...where_cause,
        }
        if (rest_date.year === current_date.year) {
            rest_criteria = {
                ...rest_criteria,
                year: { [Op.eq]: rest_date.year },
                month: {
                    [Op.and]: [
                        { [Op.lte]: current_date.month },
                        { [Op.gte]: rest_date.month },
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
                            year: { [Op.eq]: current_date.year },
                            month: {
                                [Op.and]: [
                                    { [Op.lte]: current_date.month },
                                    { [Op.gte]: 1 },
                                ]
                            }
                        }
                    },
                    {
                        [Op.and]: {
                            year: { [Op.eq]: rest_date.year },
                            month: {
                                [Op.and]: [
                                    { [Op.lte]: 12 },
                                    { [Op.gte]: rest_date.month },
                                ]
                            }
                        }
                    },
                ]
            }
        }
        return rest_criteria;
    },

    get_toptitles_data_km: async function (user, criteria) {
        let date_credentials = this.get_prev_rest_year_month(criteria.cur_year, criteria.cur_month);
        let where_cause = await this.get_where_cause(user, date_credentials);

        let username_where_cause = {};
        if (criteria.username !== undefined) {
            username_where_cause.name = { [Op.like]: "%" + criteria.username + "%" };
        }
        let data = await Liquidation.findAll({
            attributes: ["year", "month", "userId", "km_total", "expense_total", "kmDaysWorked", "otherExpensesDaysWorked"],
            where: where_cause,
            order: [['year', 'ASC'], ['month', 'ASC']],
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
        })
        let data_list = [];
        let current_month_data = [];
        let prev_month_data = [];
        for (const data_item of data) {
            let push_item = data_item.dataValues;
            if (push_item.user !== null && push_item.user.Parent && push_item.user.Parent !== null) {
                push_item.parentId = push_item.user.Parent.id;
                if (criteria.parentIds !== undefined && !criteria.parentIds.includes(push_item.parentId)) {
                    continue;
                }
            }
            if (push_item.kmDaysWorked > 0) {
                push_item.km_avg = (push_item.km_total / push_item.kmDaysWorked);
            } else {
                push_item.km_avg = 0;
            }
            data_list.push(push_item);
            if (push_item.year === date_credentials.current_date.year && push_item.month === date_credentials.current_date.month) {
                current_month_data.push(push_item);
            } else if (push_item.year === date_credentials.prev_date.year && push_item.month === date_credentials.prev_date.month) {
                prev_month_data.push(push_item);
            }
        }

        let return_value = {
            avg_km: {
                cur_month: 0,
                prev_month: 0,
                avg_rest: 0
            },
            total_km: {
                cur_month: 0,
                prev_month: 0,
                avg_rest: 0
            }
        }
        for (const data_item of current_month_data) {
            return_value.avg_km.cur_month += data_item.km_avg;
            return_value.total_km.cur_month += data_item.km_total;
        }
        for (const data_item of prev_month_data) {
            return_value.avg_km.prev_month += data_item.km_avg;
            return_value.total_km.prev_month += data_item.km_total;
        }
        for (const data_item of data_list) {
            if (data_item.month === date_credentials.current_date.month) {
                continue;
            }
            return_value.avg_km.avg_rest += data_item.km_avg;
            return_value.total_km.avg_rest += data_item.km_total;
        }
        return return_value;
    },

    get_toptitles_data_oe: async function (user, criteria) {
        let date_credentials = this.get_prev_rest_year_month(criteria.cur_year, criteria.cur_month);
        let where_cause = await this.get_where_cause(user, date_credentials);

        let username_where_cause = {};
        if (criteria.username !== undefined) {
            username_where_cause.name = { [Op.like]: "%" + criteria.username + "%" };
        }
        let data = await Liquidation.findAll({
            attributes: ["year", "month", "userId", "km_total", "kmDaysWorked", "expense_total", "lodgment_total", "transport_total", "otherexpenses_total", "food_total", "otherExpensesDaysWorked"],
            where: where_cause,
            order: [['year', 'ASC'], ['month', 'ASC']],
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
        })
        let data_list = [];
        let current_month_data = [];
        let prev_month_data = [];
        for (const data_item of data) {
            let push_item = data_item.dataValues;
            if (push_item.user !== null && push_item.user.Parent && push_item.user.Parent !== null) {
                push_item.parentId = push_item.user.Parent.id;
                if (criteria.parentIds !== undefined && !criteria.parentIds.includes(push_item.parentId)) {
                    continue;
                }
            }

            push_item.transport_total = push_item.transport_total + push_item.km_total * costPerKM;
            push_item.expense_total = push_item.expense_total + push_item.km_total * costPerKM;
            if (push_item.otherExpensesDaysWorked > 0) {
                push_item.oe_avg = (push_item.expense_total / push_item.otherExpensesDaysWorked);
            } else {
                push_item.oe_avg = 0;
            }
            data_list.push(push_item);
            if (push_item.year === date_credentials.current_date.year && push_item.month === date_credentials.current_date.month) {
                current_month_data.push(push_item);
            } else if (push_item.year === date_credentials.prev_date.year && push_item.month === date_credentials.prev_date.month) {
                prev_month_data.push(push_item);
            }
        }

        let return_value = {
            total: {
                cur_month: 0,
                prev_month: 0,
                avg_rest: 0
            },
            food: {
                cur_month: 0,
                prev_month: 0,
                avg_rest: 0
            },
            transport: {
                cur_month: 0,
                prev_month: 0,
                avg_rest: 0
            },
            hotels: {
                cur_month: 0,
                prev_month: 0,
                avg_rest: 0
            },
            others: {
                cur_month: 0,
                prev_month: 0,
                avg_rest: 0
            },
        }
        for (const data_item of current_month_data) {
            return_value.total.cur_month += data_item.expense_total;
            return_value.food.cur_month += data_item.food_total;
            return_value.transport.cur_month += data_item.transport_total;
            return_value.hotels.cur_month += data_item.lodgment_total;
            return_value.others.cur_month += data_item.otherexpenses_total;
        }
        for (const data_item of prev_month_data) {
            return_value.total.prev_month += data_item.expense_total;
            return_value.food.prev_month += data_item.food_total;
            return_value.transport.prev_month += data_item.transport_total;
            return_value.hotels.prev_month += data_item.lodgment_total;
            return_value.others.prev_month += data_item.otherexpenses_total;
        }
        let month_list = [];
        for (const data_item of data_list) {
            if (data_item.month === date_credentials.current_date.month) {
                continue;
            }
            return_value.total.avg_rest += data_item.expense_total;
            return_value.food.avg_rest += data_item.food_total;
            return_value.transport.avg_rest += data_item.transport_total;
            return_value.hotels.avg_rest += data_item.lodgment_total;
            return_value.others.avg_rest += data_item.otherexpenses_total;
            if (!month_list.includes(data_item.month)) {
                month_list.push(data_item.month);
            }
        }
        if (month_list.length > 0) {
            return_value.total.avg_rest = (return_value.total.avg_rest / month_list.length);
            return_value.food.avg_rest = (return_value.food.avg_rest / month_list.length);
            return_value.transport.avg_rest = (return_value.transport.avg_rest / month_list.length);
            return_value.hotels.avg_rest = (return_value.hotels.avg_rest / month_list.length);
            return_value.others.avg_rest = (return_value.others.avg_rest / month_list.length);
        }
        return return_value;
    },

    getExpenseSageAccountCode: function (expenseType, userItem) {
        if (userItem) {
            let returnCode = "";
            let expenseTypeId = expenseType;
            if (expenseType !== "km" && expenseType !== "exit" && expenseType !== "PARKINGFOODTAXI") {
                expenseTypeId = parseInt(expenseType);
            }
            if (expenseTypeId === 1) {
                if (userItem.role === "gpv" || userItem.role === "spv") {
                    returnCode = expenseTypeAccountCode["gpv_spv_travel_hotel"];
                } else {
                    returnCode = expenseTypeAccountCode["notgspv_travel_hotel"];
                }
            }
            // Peaje/Toll
            else if (expenseTypeId === 3) {
                if (userItem.role === "gpv" || userItem.role === "spv") {
                    returnCode = expenseTypeAccountCode["gpv_spv_peaje"];
                } else {
                    returnCode = expenseTypeAccountCode["notgspv_peaje"];
                }
            }
            // Parking/Food/Taxi - Aparcamiento/Dietas/Taxi expenseTypeId === 2 || expenseTypeId === 4 || expenseTypeId === 6
            else if (expenseTypeId === "PARKINGFOODTAXI") {
                if (userItem.role === "gpv" || userItem.role === "spv") {
                    returnCode = expenseTypeAccountCode["gpv_spv_parkingfoodtaxi"];
                } else {
                    returnCode = expenseTypeAccountCode["notgspv_parkingfoodtaxi"];
                }
            }
            // Gasolina 
            else if (expenseTypeId === 5) {
                if (userItem.role === "gpv" || userItem.role === "spv") {
                    returnCode = expenseTypeAccountCode["gpv_spv_gasolina"];
                } else {
                    returnCode = expenseTypeAccountCode["notgspv_gasolina"];
                }
            }
            else if (expenseTypeId === "km") {
                if (userItem.role === "gpv" || userItem.role === "spv") {
                    returnCode = expenseTypeAccountCode["gpv_spv_km"];
                } else {
                    returnCode = expenseTypeAccountCode["notgspv_km"];
                }
            }
            else if (expenseTypeId === "exit") {
                if (userItem.role === "gpv" || userItem.role === "spv") {
                    returnCode = expenseTypeAccountCode["gpv_spv_exit"];
                } else {
                    returnCode = expenseTypeAccountCode["notgspv_exit"];
                }
            } else if (expenseTypeAccountCode[expenseTypeId]) {
                returnCode = expenseTypeAccountCode[expenseTypeId];
            }
            return returnCode;
        }
        return "";
    },

    getSageData: async function (user, year, month, companyCode) {
        let { firstDay, lastDay } = Self.getFirstAndLastDayOfMonth(year, month);
        let currentFirstDate = firstDay;
        let currentLastDate = lastDay;
        const lq_data = await Liquidation.findAll({
            where: {
                year,
                month,
                status: "Aprobada"
            },
            order: [[[Sequelize.literal('userId ASC')]]],
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
        })
        let optimized_lq_data = {};
        let filteredUserIds = [];
        for (const lq_item of lq_data) {
            let item = lq_item.dataValues;
            if (!optimized_lq_data[item.userId]) {
                optimized_lq_data[item.userId] = {
                    ...item
                };
            }
            if (!filteredUserIds.includes(item.userId)) {
                filteredUserIds.push(item.userId);
            }
            optimized_lq_data[item.userId].cost = item.km_total * costPerKM + item.expense_total;
        }
        const km_data = await ExpenseKilometer.findAll({
            where: Sequelize.and(
                Sequelize.where(Sequelize.col('approvalStatus'), "Aprobado"),
                Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('date')), year),
                Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('date')), month),
                Sequelize.where(Sequelize.col('userId'), Sequelize.or(filteredUserIds)),
            ),
            order: [[[Sequelize.literal('userId ASC, date ASC')]]],
            include: [{ model: User, include: [Company] }],
        })
        let optimized_km_data = {};
        for (const km_item of km_data) {
            let item = km_item.dataValues;
            if (!optimized_km_data[item.userId]) {
                optimized_km_data[item.userId] = { ...item };
                optimized_km_data[item.userId].totalCost = 0;
            }
            optimized_km_data[item.userId].totalKM = Self.calcPerDayKMfromTotalKM(Math.abs(item.endKM - item.startKM), item.user.dataValues.discount_km);
            optimized_km_data[item.userId].cost = optimized_km_data[item.userId].totalKM * costPerKM;
            optimized_km_data[item.userId].totalCost += optimized_km_data[item.userId].cost;
            optimized_km_data[item.userId].userEndDate = null;
            if (optimized_km_data[item.userId].user.dataValues.end_date) {
                optimized_km_data[item.userId].userEndDate = new Date(optimized_km_data[item.userId].user.dataValues.end_date).toISOString().slice(0, 10);
            }
        }
        const oe_data = await ExpenseOther.findAll({
            where: Sequelize.and(
                Sequelize.where(Sequelize.col('approvalStatus'), "Aprobado"),
                Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('date')), year),
                Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('date')), month),
                Sequelize.where(Sequelize.col('userId'), Sequelize.or(filteredUserIds)),
            ),
            order: [[[Sequelize.literal('userId ASC, date ASC')]]],
            include: [{ model: User, include: [Company] }, ExpenseType],
        })
        let optimized_oe_data = {};
        for (const oe_item of oe_data) {
            let item = oe_item.dataValues;
            if (!optimized_oe_data[item.userId]) {
                optimized_oe_data[item.userId] = { ...item };
                optimized_oe_data[item.userId].totalCostPerExpenseType = {};
            }
            let groupByExpenseTypeId = item.expenseTypeId;
            if (item.expenseTypeId === 2 || item.expenseTypeId === 4 || item.expenseTypeId === 6) {
                groupByExpenseTypeId = "PARKINGFOODTAXI";
            }
            if (groupByExpenseTypeId && !optimized_oe_data[item.userId].totalCostPerExpenseType[groupByExpenseTypeId]) {
                optimized_oe_data[item.userId].totalCostPerExpenseType[groupByExpenseTypeId] = 0;
            }
            optimized_oe_data[item.userId].totalCostPerExpenseType[groupByExpenseTypeId] += item.amount;
            optimized_oe_data[item.userId].userEndDate = null;
            if (optimized_oe_data[item.userId].user.dataValues.end_date) {
                optimized_oe_data[item.userId].userEndDate = new Date(optimized_oe_data[item.userId].user.dataValues.end_date).toISOString().slice(0, 10);
            }
        }
        let seat_num = {};
        let data = [];
        for (const [userId, lq_item] of Object.entries(optimized_lq_data)) {
            let maxDate = "";
            if (optimized_km_data[userId]) {
                let push_item = {};
                push_item['userId'] = userId;
                const { user } = optimized_km_data[userId];
                push_item.company_code = "";
                push_item.user_company_code = user.dataValues.companyCode;
                if (user.dataValues.company) {
                    push_item.company_code = user.dataValues.company.codeNum;
                    if (!seat_num[push_item.company_code]) {
                        seat_num[push_item.company_code] = {};
                    }
                }
                push_item.payment_charge = "D";
                push_item.account_code = Self.getExpenseSageAccountCode("km", user);
                push_item.document_account = user.username;
                push_item.commentary = Self.get_short_commentary(user, year, month);
                let printDate = currentLastDate;
                if (optimized_km_data[userId].userEndDate && currentLastDate > optimized_km_data[userId].userEndDate) {
                    printDate = optimized_km_data[userId].userEndDate;
                }
                push_item.date = moment(printDate).format("DD/MM/YYYY");
                if (maxDate === "") {
                    maxDate = printDate;
                } else if (maxDate < printDate) {
                    maxDate = printDate;
                }
                push_item.amount = optimized_km_data[userId].totalCost;
                data.push(push_item);
            }
            if (optimized_oe_data[userId]) {
                for (const [oe_expensetypeId, optimized_oe_type_value] of Object.entries(optimized_oe_data[userId].totalCostPerExpenseType)) {
                    let push_item = {};
                    push_item['userId'] = userId;
                    const { user, expenseTypeId } = optimized_oe_data[userId];
                    push_item.company_code = "";
                    push_item.user_company_code = user.dataValues.companyCode;
                    if (user.dataValues.company) {
                        push_item.company_code = user.dataValues.company.codeNum;
                        if (!seat_num[push_item.company_code]) {
                            seat_num[push_item.company_code] = {};
                        }
                    }
                    push_item.payment_charge = "D";
                    push_item.document_account = user.username;
                    push_item.commentary = Self.get_short_commentary(user, year, month);

                    let printDate = currentLastDate;
                    if (optimized_oe_data[userId].userEndDate && currentLastDate > optimized_oe_data[userId].userEndDate) {
                        printDate = optimized_oe_data[userId].userEndDate;
                    }
                    push_item.date = moment(printDate).format("DD/MM/YYYY");
                    if (maxDate === "") {
                        maxDate = printDate;
                    } else if (maxDate < printDate) {
                        maxDate = printDate;
                    }

                    push_item.expenseTypeId = oe_expensetypeId;
                    push_item.account_code = Self.getExpenseSageAccountCode(oe_expensetypeId, user);
                    push_item.amount = optimized_oe_type_value;
                    data.push(push_item);
                }
            }
            const { user } = lq_item;
            let push_item = {};
            push_item['userId'] = userId;
            push_item.company_code = "";
            push_item.user_company_code = user.dataValues.companyCode;
            if (user.dataValues.company) {
                push_item.company_code = user.dataValues.company.codeNum;
                if (!seat_num[push_item.company_code]) {
                    seat_num[push_item.company_code] = {};
                }
            }
            push_item.payment_charge = "H";
            push_item.account_code = Self.getExpenseSageAccountCode("exit", user);
            push_item.document_account = user.username;
            push_item.commentary = Self.get_short_commentary(user, year, month);
            push_item.date = moment(maxDate).format("DD/MM/YYYY");
            push_item.amount = lq_item.cost;
            data.push(push_item);

            for (const [companyCode, values] of Object.entries(seat_num)) {
                if (Object.keys(seat_num[companyCode]).length === 0) {
                    seat_num[companyCode][userId] = 1;
                } else {
                    if (!seat_num[companyCode][userId]) {
                        seat_num[companyCode][userId] = parseInt(Math.max(...Object.values(seat_num[companyCode]))) + 1;
                    }
                }
            }
        }
        if (companyCode && companyCode !== 'null' && companyCode !== undefined) {
            data = data.filter(data_item => data_item.user_company_code === parseInt(companyCode));
        }
        return { data, seat_num };
    },

    get_short_commentary: function (user, year, month) {
        let commentary = "Liq Gasto " + user.name + " " + user.surname + " " + spainish_short_month[parseInt(month) - 1] + year;
        if (commentary.length > 39) {
            commentary = "Liq Gasto " + user.name + " " + spainish_short_month[parseInt(month) - 1] + year;
        }
        return commentary;
    },

    get_pdf_criteria: async function (criteria) {
        let where_cause = {};
        let start_date = criteria.start_date.split("-");
        let end_date = criteria.end_date.split("-");
        let start_date_year = parseInt(start_date[0]);
        let start_date_month = parseInt(start_date[1]);
        let end_date_year = parseInt(end_date[0]);
        let end_date_month = parseInt(end_date[1]);
        let start_end_date_criteria = [
            {
                [Op.and]: {
                    year: { [Op.eq]: start_date_year },
                    month: {
                        [Op.and]: [
                            { [Op.lte]: start_date_year === end_date_year ? end_date_month : 12 },
                            { [Op.gte]: start_date_month },
                        ]
                    }
                }
            },
            {
                [Op.and]: {
                    year: { [Op.eq]: end_date_year },
                    month: {
                        [Op.and]: [
                            { [Op.lte]: end_date_month },
                            { [Op.gte]: start_date_year === end_date_year ? start_date_month : 1 },
                        ]
                    }
                }
            },
        ];
        let middle_years = [];
        let i = 0;
        for (i = start_date_year + 1; i <= end_date_year - 1; i++) {
            middle_years.push(i);
        }
        if (middle_years.length > 0) {
            where_cause = {
                [Op.or]: [
                    ...start_end_date_criteria,
                    {
                        year: {
                            [Op.and]: [
                                { [Op.gte]: middle_years[0] },
                                { [Op.lte]: middle_years[middle_years.length - 1] },
                            ]
                        }
                    }
                ]
            }
        } else {
            where_cause = {
                [Op.or]: start_end_date_criteria
            }
        }

        return {
            start_date_year,
            start_date_month,
            end_date_year,
            end_date_month,
            where_cause,
        }
    },

}

module.exports = Self