const { Sequelize, Route, User, ExpenseKilometer, ExpenseType, Liquidation, Static, Brand, Zone, Company } = require('../sequelize')
const HttpStatus = require("http-status-codes");
const excel = require("exceljs");
const fs = require('fs');
const Op = Sequelize.Op;
const expensesUtils = require('../services/expenses.utils');
const { costPerKM } = require('../utils');
const UserDepartments = require('../models/user.model').departments;

const get_km_data = async (req, is_download_excel) => {
    const { page, itemsPerPage, sortby, sortdesc, filterModel } = req.query;
    let page_num = page === undefined ? 1 : page;
    let page_limit = itemsPerPage === undefined ? 10 : itemsPerPage;
    let filter = filterModel === undefined ? [] : JSON.parse(filterModel);
    let fitlerCriteria = {};
    filter.map(item => {
        fitlerCriteria[item.columnField] = item.filterValue;
        return item;
    })

    let order_cause = [];
    if (sortby !== undefined && sortby !== 'km_avg' && sortby !== 'parentId') {
        switch (sortby) {
            case 'username':
                order_cause = ['user', 'name', sortdesc === "true" ? "DESC" : "ASC"];
                break;
            case 'usertype':
                order_cause = ['user', 'role', sortdesc === "true" ? "DESC" : "ASC"];
                break;
            default:
                order_cause = [sortby, sortdesc === "true" ? "DESC" : "ASC"];
                break;
        }
    }
    else {
        order_cause = [[Sequelize.literal('year DESC, month DESC')]];
    }

    let { where_cause } = await expensesUtils.get_chart_criteria(req.user, fitlerCriteria);

    let query_builder_options = {
        where: where_cause,
        order: [order_cause],
        include: [
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
        ],
    }
    const data = await Liquidation.findAndCountAll(query_builder_options)

    let data_list = [];
    for (let i = 0; i < data.rows.length; i++) {
        let item = data.rows[i].dataValues;
        if (item.kmDaysWorked > 0) {
            item.km_avg = (item.km_total / item.kmDaysWorked);
        } else {
            item.km_avg = 0;
        }
        if (item.user !== null && item.user.Parent && item.user.Parent !== null) {
            item.parentId = item.user.Parent.id;
            if (fitlerCriteria.parents && fitlerCriteria.parents.length > 0 && !fitlerCriteria.parents.includes(item.parentId)) {
                continue;
            }
        }
        if (item.user !== null) {
            if (fitlerCriteria.departments && fitlerCriteria.departments.length > 0 && !fitlerCriteria.departments.includes(item.user.department)) {
                continue;
            }
            // if (fitlerCriteria.projects && fitlerCriteria.projects.length > 0 && !fitlerCriteria.projects.includes(item.user.project)) {
            //     continue;
            // }
            if (fitlerCriteria.projects && fitlerCriteria.projects.length > 0) {
                let id_list_brands = expensesUtils.get_brandIds_from_list(item.user.brands);
                let filtered_user_brands = id_list_brands.filter(brand_id => fitlerCriteria.projects.includes(brand_id));
                if (filtered_user_brands.length === 0) {
                    continue;
                }
            }
        }
        data_list.push(item)
    }
    if (sortby !== undefined && (sortby === 'parentId' || sortby === 'km_avg')) {
        if (sortdesc === "false") {
            data_list = data_list.sort((a, b) => (a[sortby] > b[sortby]) ? 1 : ((b[sortby] > a[sortby]) ? -1 : 0))
        }
        else {
            data_list = data_list.sort((a, b) => (a[sortby] < b[sortby]) ? 1 : ((b[sortby] < a[sortby]) ? -1 : 0))
        }
    }
    let total_count = data_list.length;
    if (!is_download_excel) {
        data_list = data_list.slice(page_limit * (page_num - 1), page_limit * page_num);
    }
    return {
        data: data_list,
        total: total_count,
    };
}

const get_otherexpenses_data = async (req, is_download_excel) => {
    const userId = req.user.id;
    const { page, itemsPerPage, sortby, sortdesc, filterModel } = req.query;
    let page_num = page === undefined ? 1 : page;
    let page_limit = itemsPerPage === undefined ? 10 : itemsPerPage;
    let filter = filterModel === undefined ? [] : JSON.parse(filterModel);
    let fitlerCriteria = {};
    filter.map(item => {
        fitlerCriteria[item.columnField] = item.filterValue;
        return item;
    })

    let order_cause = [];
    if (sortby !== undefined && sortby !== 'transport_total' && sortby !== 'parentId') {
        switch (sortby) {
            case 'username':
                order_cause = ['user', 'name', sortdesc === "true" ? "DESC" : "ASC"];
                break;
            case 'usertype':
                order_cause = ['user', 'role', sortdesc === "true" ? "DESC" : "ASC"];
                break;
            default:
                order_cause = [sortby, sortdesc === "true" ? "DESC" : "ASC"];
                break;
        }
    }
    else {
        order_cause = [[Sequelize.literal('year DESC, month DESC')]];
    }

    let { where_cause } = await expensesUtils.get_chart_criteria(req.user, fitlerCriteria);

    let query_builder_options = {
        where: where_cause,
        order: [order_cause],
        include: [
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
        ],
    }
    const data = await Liquidation.findAndCountAll(query_builder_options)

    let data_list = [];
    let parent_list = [];
    let filtered_parent_item = null;
    for (let i = 0; i < data.rows.length; i++) {
        let item = data.rows[i].dataValues;
        if (item.kmDaysWorked > 0) {
            item.km_avg = (item.km_total / item.kmDaysWorked);
        } else {
            item.km_avg = 0;
        }
        // item.transport_total = item.transport_total + item.km_total * costPerKM;
        // item.expense_total = item.expense_total + item.km_total * costPerKM;
        item.transport_total = item.transport_total;
        item.expense_total = item.expense_total;
        if (item.user !== null && item.user.Parent && item.user.Parent !== null) {
            item.parentId = item.user.Parent.id;
            if (fitlerCriteria.parents && fitlerCriteria.parents.length > 0 && !fitlerCriteria.parents.includes(item.parentId)) {
                continue;
            }
        }
        if (item.user !== null) {
            if (fitlerCriteria.departments && fitlerCriteria.departments.length > 0 && !fitlerCriteria.departments.includes(item.user.department)) {
                continue;
            }
            // if (fitlerCriteria.projects && fitlerCriteria.projects.length > 0 && !fitlerCriteria.projects.includes(item.user.project)) {
            //     continue;
            // }
            if (fitlerCriteria.projects && fitlerCriteria.projects.length > 0) {
                let id_list_brands = expensesUtils.get_brandIds_from_list(item.user.brands);
                let filtered_user_brands = id_list_brands.filter(brand_id => fitlerCriteria.projects.includes(brand_id));
                if (filtered_user_brands.length === 0) {
                    continue;
                }
            }
        }
        data_list.push(item)
    }
    if (sortby !== undefined && (sortby === 'parentId' || sortby === 'transport_total')) {
        if (sortdesc === "false") {
            data_list = data_list.sort((a, b) => (a[sortby] > b[sortby]) ? 1 : ((b[sortby] > a[sortby]) ? -1 : 0))
        }
        else {
            data_list = data_list.sort((a, b) => (a[sortby] < b[sortby]) ? 1 : ((b[sortby] < a[sortby]) ? -1 : 0))
        }
    }
    let total_count = data_list.length;
    if (!is_download_excel) {
        data_list = data_list.slice(page_limit * (page_num - 1), page_limit * page_num);
    }
    return {
        data: data_list,
        total: total_count,
        parent_list,
    };
}

const Self = {

    getKMdata: async function (req, res) {
        try {
            if (!req.user) {
                return res.status(401).send('Authorization required');
            }
            const km_data = await get_km_data(req);
            return res.json({
                data: km_data.data,
                total: km_data.total,
            })
        } catch (error) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    kmdownloadexcel: async function (req, res) {
        try {
            let km_data = await get_km_data(req, true);
            let data_list = km_data.data.map((detail => {
                const result = {
                    ...detail
                }
                result.userId = detail.user ? detail.user.id : '';
                result.username = detail.user ? detail.user.name + ' ' + detail.user.surname : '';
                result.usertype = detail.user ? detail.user.role : '';
                result.parentName = detail.user && detail.user.Parent ? detail.user.Parent.name + ' ' + detail.user.Parent.surname : '';
                result.companyName = "";
                if (detail.user && detail.user.company) {
                    result.companyName = detail.user.company.name;
                }
                return result;
            }))
            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("data");
            worksheet.columns = [
                { header: "ID User", key: "userId" },
                { header: "UserName", key: "username" },
                { header: "Role", key: "usertype" },
                { header: "Compañía", key: "companyName" },
                { header: "ParentUserName", key: "parentName" },
                { header: "Year", key: "year" },
                { header: "Month", key: "month" },
                { header: "TotalKM", key: "km_total" },
                { header: "AVG KM", key: "km_avg" },
            ];
            worksheet.addRows(data_list);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=" + "analysisKM.xlsx"
            );
            return workbook.xlsx.write(res).then(() => res.status(200).send());
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    kmdownloadexceldailydetail: async function (req, res) {
        try {
            let km_data = await get_km_data(req, true);
            let criteria = [];
            let data_list = km_data.data.map((detail => {
                let push_item = {
                    userId: detail.userId,
                    year: detail.year,
                    month: detail.month,
                }
                criteria.push(push_item);
                return detail;
            }))
            let daily_data = await expensesUtils.getDailyDetailKM(criteria);

            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("data");
            worksheet.columns = [
                { header: "ID User", key: "userId" },
                { header: "UserName", key: "username" },
                { header: "Role", key: "usertype" },
                { header: "Compañía", key: "companyName" },
                { header: "ParentUserName", key: "parentName" },
                { header: "Date", key: "date" },
                { header: "RouteName", key: "routename" },
                { header: "totalKM", key: "totalKM" },
                { header: "startKM", key: "startKM" },
                { header: "endKM", key: "endKM" },
                { header: "approvalStatus", key: "approvalStatus" },
                { header: "GPV comments", key: "gpv_comment" },
                { header: "SPV comments", key: "spv_comment" },
                { header: "approverName", key: "approverName" },
            ];
            worksheet.addRows(daily_data);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=" + "analysisKMDetail.xlsx"
            );
            return workbook.xlsx.write(res).then(() => res.status(200).send());
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    getOtherExpensesdata: async function (req, res) {
        try {
            if (!req.user) {
                return res.status(401).send('Authorization required');
            }
            const oe_data = await get_otherexpenses_data(req);
            return res.json({
                data: oe_data.data,
                total: oe_data.total,
            })
        } catch (error) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    otherexpensesdownloadexcel: async function (req, res) {
        try {
            let oe_data = await get_otherexpenses_data(req, true);
            let data_list = oe_data.data.map((detail => {
                const result = {
                    ...detail
                }
                result.userId = detail.user ? detail.user.id : '';
                result.username = detail.user ? detail.user.name + ' ' + detail.user.surname : '';
                result.usertype = detail.user ? detail.user.role : '';
                result.parentName = detail.user && detail.user.Parent ? detail.user.Parent.name + ' ' + detail.user.Parent.surname : '';
                result.companyName = "";
                if (detail.user && detail.user.company) {
                    result.companyName = detail.user.company.name;
                }
                return result;
            }))
            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("data");
            worksheet.columns = [
                { header: "ID User", key: "userId" },
                { header: "UserName", key: "username" },
                { header: "Role", key: "usertype" },
                { header: "Compañía", key: "companyName" },
                { header: "ParentUserName", key: "parentName" },
                { header: "Year", key: "year" },
                { header: "Month", key: "month" },
                { header: "TotalExpenses", key: "expense_total" },
                { header: "Food", key: "food_total" },
                { header: "Transport", key: "transport_total" },
                { header: "Hotels", key: "lodgment_total" },
                { header: "Others", key: "otherexpenses_total" },
            ];
            worksheet.addRows(data_list);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=" + "analysisKM.xlsx"
            );
            return workbook.xlsx.write(res).then(() => res.status(200).send());
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    oedownloadexceldailydetail: async function (req, res) {
        try {
            let km_data = await get_otherexpenses_data(req, true);
            let criteria = [];
            let data_list = km_data.data.map((detail => {
                let push_item = {
                    userId: detail.userId,
                    year: detail.year,
                    month: detail.month,
                }
                criteria.push(push_item);
                return detail;
            }))
            let daily_data = await expensesUtils.getDailyDetailOE(criteria);

            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("data");
            worksheet.columns = [
                { header: "ID User", key: "userId" },
                { header: "UserName", key: "username" },
                { header: "Role", key: "usertype" },
                { header: "Compañía", key: "companyName" },
                { header: "ParentUserName", key: "parentName" },
                { header: "Date", key: "date" },
                { header: "RouteName", key: "routename" },
                { header: "ExpenseType", key: "expenseTypeName" },
                { header: "Description", key: "description" },
                { header: "Amount", key: "amount" },
                { header: "approvalStatus", key: "approvalStatus" },
                { header: "GPV comments", key: "gpv_comment" },
                { header: "SPV comments", key: "spv_comment" },
                { header: "approverName", key: "approverName" },
            ];
            worksheet.addRows(daily_data);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=" + "analysisOEDetail.xlsx"
            );
            return workbook.xlsx.write(res).then(() => res.status(200).send());
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    get_chart_data_km: async function (req, res) {
        if (!req.user) {
            res.status(401).send('Authorization required');
        } else {
            try {
                let chart_data = await expensesUtils.get_chart_data_km(req.user, req.body, false);
                return res.json({
                    ...chart_data
                })
            } catch (error) {
                console.log(error);
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
            }
        }
    },

    get_chart_data_km_avg: async function (req, res) {
        if (!req.user) {
            res.status(401).send('Authorization required');
        } else {
            try {
                let chart_data = await expensesUtils.get_chart_data_km(req.user, req.body, true);
                return res.json({
                    ...chart_data
                })
            } catch (error) {
                console.log(error);
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
            }
        }
    },

    get_chart_data_oe: async function (req, res) {
        if (!req.user) {
            res.status(401).send('Authorization required');
        } else {
            try {
                let chart_data = await expensesUtils.get_chart_data_oe(req.user, req.body, false);
                return res.json({
                    ...chart_data
                })
            } catch (error) {
                console.log(error);
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
            }
        }
    },

    get_chart_data_oe_avg: async function (req, res) {
        if (!req.user) {
            res.status(401).send('Authorization required');
        } else {
            try {
                let chart_data = await expensesUtils.get_chart_data_oe(req.user, req.body, true);
                return res.json({
                    ...chart_data
                })
            } catch (error) {
                console.log(error);
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
            }
        }
    },

    get_toptitles_data_km: async function (req, res) {
        if (!req.user) {
            res.status(401).send('Authorization required');
        } else {
            try {
                const body = req.body;
                let data = await expensesUtils.get_toptitles_data_km(req.user, body);
                return res.json({
                    ...data
                })
            } catch (error) {
                console.log(error);
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
            }
        }
    },

    get_toptitles_data_oe: async function (req, res) {
        if (!req.user) {
            res.status(401).send('Authorization required');
        } else {
            const body = req.body;
            let data = await expensesUtils.get_toptitles_data_oe(req.user, body);
            try {
                return res.json({
                    ...data
                })
            } catch (error) {
                console.log(error);
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
            }
        }
    },

    get_projects: async function (filter_name) {
        let where = {};
        let limit = { offset: 0, limit: 100 };
        let query_builder_options = {}
        if (filter_name) {
            console.log('filter_name - ', filter_name);
            where["name"] = { [Op.like]: `%${filter_name}%` };
            query_builder_options["where"] = where;
        } else {
            query_builder_options["offset"] = limit.offset;
            query_builder_options["limit"] = limit.limit;
        }
        const data = await Brand.findAll(query_builder_options);
        return data;
    },
    
    get_projects_list: async function (req, res) {
        const { filter_name } = req.query;
        const data = await Self.get_projects(filter_name);
        return res.json({ data });
    },

    get_zones: async function (filter_name) {
        let where = {};
        let limit = { offset: 0, limit: 100 };
        let query_builder_options = {}
        if (filter_name) {
            console.log('filter_name - ', filter_name);
            where["name"] = { [Op.like]: `%${filter_name}%` };
            query_builder_options["where"] = where;
        } else {
            query_builder_options["offset"] = limit.offset;
            query_builder_options["limit"] = limit.limit;
        }
        const data = await Zone.findAll(query_builder_options);
        return data;
    },
    
    get_zone_list: async function (req, res) {
        const { filter_name } = req.query;
        const data = await Self.get_zones(filter_name);
        return res.json({ data });
    },

    get_search_params: async function (req, res) {
        if (!req.user) {
            res.status(401).send('Authorization required');
        } else {
            let data = {};
            data['departments'] = UserDepartments;
            let user_where_cause = await expensesUtils.get_where_cause_in_users(req.user);
            console.log(user_where_cause);
            const users_data = await User.findAll({
                where: user_where_cause,
                model: User,
                include: [
                    {
                        model: User,
                        as: 'Parent'
                    }
                ]
            })
            let parents = [];
            let projects = [];
            let userlist = [];
            for (const user_item of users_data) {
                let item = user_item.dataValues;
                // if (item.project !== null && !projects.includes(item.project)) {
                //     projects.push(item.project)
                // }
                if (item.Parent !== null && parents.filter(parent_item => parent_item.id === item.Parent.id).length === 0) {
                    let parent_item = item.Parent.dataValues;
                    parent_item.username = parent_item.name + ' ' + parent_item.surname;
                    parents.push(parent_item);
                }
                item.username = item.name + ' ' + item.surname;
                userlist.push(item);
            }
            data['parents'] = parents;
            // data['projects'] = projects;
            data['projects'] = await Self.get_projects("");
            data['userlist'] = userlist;
            try {
                return res.json({
                    ...data
                })
            } catch (error) {
                console.log(error);
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
            }
        }
    },

}

module.exports = Self
