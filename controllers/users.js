const { Sequelize, User, Route, RouteUser, UsersProjects, Brand, Company, Staticpendingholidays } = require('../sequelize')
const _ = require("lodash");
const HttpStatus = require("http-status-codes");
const excel = require("exceljs");
const readXlsxFile = require("read-excel-file/node");
const fs = require("fs");
const moment = require("moment");
const UserRoles = require('../models/user.model').roles;
const UserStatus = require('../models/user.model').status;
const UserDepartments = require('../models/user.model').departments;
const Op = Sequelize.Op;
const Fn = Sequelize.fn;
const gennera_user_default_password = 'gennera';

const get_data = async (req_query, is_download_excel) => {
    const { page, itemsPerPage, sortby, sortdesc, filterModel } = req_query;
    let page_num = page === undefined ? 1 : page;
    let page_limit = itemsPerPage === undefined ? 10 : itemsPerPage;
    let filter = filterModel === undefined ? [] : JSON.parse(filterModel);
    let order_cause = [];
    if (sortby !== undefined) {
        if (sortby === 'parent_user_name') {
            order_cause = ['Parent', 'username', sortdesc === "true" ? "DESC" : "ASC"];
        }
        else {
            order_cause = [sortby, sortdesc === "true" ? "DESC" : "ASC"];
        }
    }
    else {
        order_cause = ["id", "ASC"];
    }

    let where_cause = {};
    let where_parent_cause = [];
    let where_route_cause = [];
    let buffer_values = [];
    filter.map(item => {
        if (item.columnField === 'parent_user_name') {
            where_parent_cause.push({ 'username': { [Op.like]: "%" + item.filterValue + "%" } });
        }
        if (item.columnField === 'route_value') {
            where_route_cause.push({ name: { [Op.like]: "%" + item.filterValue + "%" } });
        }

        // string search
        if ((item.columnField === 'username' || item.columnField === 'name' || item.columnField === 'surname' || item.columnField === 'residence' || item.columnField === 'email' || item.columnField === 'phone' || item.columnField === 'phone_company' || item.columnField === 'dni') && item.filterValue) {
            where_cause[item.columnField] = { [Op.like]: "%" + item.filterValue + "%" };
        }

        // checkbox search
        if (
            item.columnField === 'status'
            || item.columnField === 'role'
            || item.columnField === 'department'
            || item.columnField === 'companyCode'
        ) {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause[item.columnField] = { [Op.or]: buffer_values }
        }

        // range search - from to
        if (item.columnField === 'discount_km') {
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

        if (item.columnField === 'start_date' || item.columnField === 'end_date') {
            if (item.filterValue['from'] !== undefined && item.filterValue['to'] !== undefined && item.filterValue['from'] !== '' && item.filterValue['to'] !== '') {
                where_cause[item.columnField] = {
                    [Op.and]: [
                        { [Op.gte]: new Date(item.filterValue['from']) },
                        { [Op.lte]: new Date(item.filterValue['to']) },
                    ]
                }
            }
            else if (item.filterValue['from'] !== undefined && item.filterValue['from'] !== '') {
                where_cause[item.columnField] = { [Op.gte]: new Date(item.filterValue['from']) }
            } else if (item.filterValue['to'] !== undefined && item.filterValue['to'] !== '') {
                where_cause[item.columnField] = { [Op.lte]: new Date(item.filterValue['to']) }
            }
        }

        return item;
    })

    let parent_association = {
        model: User,
        as: 'Parent',
    }
    if (where_parent_cause.length > 0) {
        parent_association['where'] = where_parent_cause;
    }
    let route_association = {
        model: Route
    }
    if (where_route_cause.length > 0) {
        route_association['where'] = where_route_cause;
    }

    const data_count = await User.findAll({
        where: where_cause,
        order: [order_cause],
        include: [
            parent_association,
            route_association,
            Brand,
            Company,
            Staticpendingholidays
        ],
    })

    let query_builder_options = {
        where: where_cause,
        order: [order_cause],
        include: [
            parent_association,
            route_association,
            Brand,
            Company,
            Staticpendingholidays
        ],
    }

    const data = await User.findAndCountAll(query_builder_options);

    let data_list = [];
    for (let i = 0; i < data.rows.length; i++) {
        let item = data.rows[i].dataValues;
        item.companylabel = item.company ? item.company.name : "";
        data_list.push(item);
    }
    filter.map(item => {
        if (item.columnField === 'project') {
            data_list = data_list.filter(data_item => {
                if (data_item.brands.length > 0 && data_item.brands.filter(brandItem => brandItem.name.toLowerCase().includes(item.filterValue.toLowerCase())).length > 0) {
                    return true;
                }
                return false;
            })
        }
    })

    let total_count = data_list.length;
    if (!is_download_excel) {
        data_list = data_list.slice(page_limit * (page_num - 1), page_limit * page_num);
    }

    return {
        data: data_list,
        total: total_count,
    }
}

const check_duplication = async (data) => {
    if (!data.dni || !data.email || !data.username) {
        return { success: true, message: "" };
    }
    let criteria = {
        [Op.or]: [
            { dni: data.dni },
            { email: data.email },
            { username: data.username },
        ]
    };
    if (data.id) {
        criteria["id"] = { [Op.not]: data.id };
    }
    let count = await User.count({ where: criteria });
    if (count > 0) {
        return { success: false, message: "Ya existe un usuario con estos datos" }
    }
    return { success: true, message: "" };
}

const Self = {

    get_parent_list: async function (req, res) {
        const { parent_name } = req.query;
        let data = [];
        let order_cause = [];
        order_cause = ["username", "ASC"];
        console.log('parent_nameparent_name - ', parent_name === 'null');
        if (parent_name !== '' && parent_name !== null && parent_name !== undefined) {
            let where_cause = [];
            where_cause.push({ username: { [Op.like]: "%" + parent_name + "%" } });

            data = await User.findAll({
                where: where_cause,
                order: [order_cause],
            })
        }
        else if (parent_name !== undefined && (parent_name === null || parent_name === 'null' || parent_name === '')) {
            data = await User.findAll({
                order: [order_cause],
                offset: 0,
                limit: 1000,
            })
        }
        return res.json({
            data: data,
        })
    },

    index: async function (req, res) {
        const users = await get_data(req.query);

        const dep_data = UserDepartments;
        const route_data = await Route.findAll();
        const user_data = await User.findAll();
        const company_data = await Company.findAll();

        return res.json({
            data: users.data,
            total: users.total,
            user_roles: UserRoles,
            dep_data: dep_data,
            user_status: UserStatus,
            route_data: route_data,
            user_list: user_data,
            company_data,
        })
    },

    create: async function (req, res) {
        const { body } = req;
        const data = _.omit(body, ["routes", "brands"]);
        const routes = body.routes;
        const brands = body.brands;

        let is_check_duplication = await check_duplication(data);
        if (is_check_duplication.success) {
            const result = await User.create({ ...data, password: gennera_user_default_password })
            if (Array.isArray(routes)) {
                for (const route_id of routes) {
                    await RouteUser.create({ routeId: route_id, userId: result.id })
                }
            } else {
                await RouteUser.create({ routeId: routes, userId: result.id })
            }
            if (Array.isArray(brands)) {
                for (const brandId of brands) {
                    await UsersProjects.create({ brandId: brandId, userId: result.id })
                }
            } else {
                await UsersProjects.create({ brandId: brands, userId: result.id })
            }
            return res.status(200).json({ success: true, result })
        } else {
            return res.status(200).json(is_check_duplication);
        }
    },

    update: async function (req, res) {
        const { body, params: { id } } = req;
        const data = _.omit(body, ["routes", "brands", "additional_static_pendingholiday_value", "additional_static_pendingholiday_year"]);
        const routes = body.routes;
        const brands = body.brands;
        const additional_static_pendingholiday_value = body.additional_static_pendingholiday_value;
        const additional_static_pendingholiday_year = body.additional_static_pendingholiday_year;

        let is_check_duplication = await check_duplication(data);
        if (is_check_duplication.success) {
            const result = await User.update(data, { where: { id } })
            await RouteUser.destroy({ where: { userId: id } });
            if (Array.isArray(routes)) {
                for (const route_id of routes) {
                    await RouteUser.create({ routeId: route_id, userId: id })
                }
            } else {
                await RouteUser.create({ routeId: routes, userId: id })
            }

            await UsersProjects.destroy({ where: { userId: id } });
            if (Array.isArray(brands)) {
                for (const brandId of brands) {
                    await UsersProjects.create({ brandId: brandId, userId: id })
                }
            } else {
                await UsersProjects.create({ brandId: brands, userId: id })
            }

            if (additional_static_pendingholiday_year && additional_static_pendingholiday_value !== undefined) {
                let filtered = await Staticpendingholidays.findOne({
                    where: {
                        userId: id,
                        appliedYear: additional_static_pendingholiday_year
                    }
                });
                if (filtered) {
                    const data_id = filtered.id;
                    await Staticpendingholidays.update({
                        pendingholidays: additional_static_pendingholiday_value
                    }, { where: { id: data_id } });
                } else {
                    await Staticpendingholidays.create({
                        userId: id,
                        appliedYear: additional_static_pendingholiday_year,
                        pendingholidays: additional_static_pendingholiday_value
                    });
                }
            }
            return res.status(200).json({ success: true, result })
        } else {
            return res.status(200).json(is_check_duplication);
        }
    },

    delete: async function (req, res) {
        const { id } = req.params
        await User.destroy({ where: { id } })
        return res.status(200).send()
    },

    resetpassword: async function (req, res) {
        const { id } = req.params

        const result = await User.update({ password: gennera_user_default_password }, { where: { id } })

        return res.status(200).json({ result })
    },

    downloadexcel: async function (req, res) {
        try {
            let user_list = await get_data(req.query, true);
            user_list = user_list.data.map((user_detail => {
                const result = {
                    ...user_detail
                }
                result.parent_user_name = user_detail.Parent !== null ? user_detail.Parent.username : '';
                result.start_date = user_detail.start_date ? moment(moment.utc(user_detail.start_date, "H:m:s").toDate()).format("DD/MM/YYYY") : '';
                result.end_date = user_detail.end_date ? moment(moment.utc(user_detail.end_date, "H:m:s").toDate()).format("DD/MM/YYYY") : '';
                if (user_detail.routes && user_detail.routes.length > 0) {
                    result.route_value = user_detail.routes
                        .map((elem) => {
                            return elem.name;
                        })
                        .join(",");
                }
                result.brand_names = result.brands.map((item) => item.name).join(", ");
                return result;
            }))
            console.log(user_list);
            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("Users");
            worksheet.columns = [
                { header: "ID", key: "id" },
                { header: "UserName", key: "username" },
                { header: "Name", key: "name" },
                { header: "SurName", key: "surname" },
                { header: "Email", key: "email" },
                { header: "Phone", key: "phone" },
                { header: "PhoneCompany", key: "phone_company" },
                { header: "DNI", key: "dni" },
                { header: "Residence", key: "residence" },
                { header: "Company", key: "companylabel" },
                { header: "Role", key: "role" },
                { header: "Department", key: "department" },
                { header: "Start Date", key: "start_date" },
                { header: "End Date", key: "end_date" },
                { header: "Project", key: "brand_names" },
                { header: "DiscountKM", key: "discount_km" },
                { header: "Parent", key: "parent_user_name" },
                { header: "Routes", key: "route_value" },
                { header: "Status", key: "status" },
            ];
            worksheet.addRows(user_list);
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

    get_projects: async function (req, res) {
        const { filter_name } = req.query;
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
        console.log(query_builder_options);
        const data = await Brand.findAll(query_builder_options);
        return res.json({ data });
    },

    get_staticpendingholidays: async function (req, res) {
        const { userId, year } = req.query;
        let data = {};
        if (userId && year) {
            let where = {};
            where["appliedYear"] = year;
            where["userId"] = userId;
            console.log(where);
            data = await Staticpendingholidays.findOne({
                where
            });
        }
        return res.json({ data });
    },

    uploadexcel: async function (req, res) {
        try {
            if (req.file === undefined) {
                res.status(400).send("Please upload an excel file!");
            }
            let path = __basedir + "/resources/uploadstmp/";
            const sample_cols = [
                'username',
                'name',
                'surname',
                'email',
                'phone',
                'phonecompany',
                'dni',
                'residence',
                'company',
                'role',
                'department',
                'start_date',
                'end_date',
                'project',
                'discountkm',
                'parent',
                'routes',
                'status',
            ];
            readXlsxFile(path + req.file.filename).then(async (rows) => {
                fs.unlink(path + req.file.filename, (err) => {
                    if (err) throw err;
                });
                let titles = rows[0];
                let original_titles = rows[0];
                titles = titles.map(title => {
                    return title.replaceAll(" ", "_").toLowerCase();
                })
                // check the excel file's format (column list)
                let is_valid_excel_file = true;
                sample_cols.map(sample_col => {
                    let filtered = titles.filter(title => sample_col === title);
                    if (filtered.length === 0) {
                        console.log(sample_col, titles);
                        is_valid_excel_file = false;
                    }
                    return sample_col;
                })
                if (!is_valid_excel_file) {
                    return res.json({
                        success: false,
                        invalidFile: false,
                        message: "The uploaded file is invalid. Please check the column list. Their columns' name should be matched with every data-table's columns."
                    });
                }

                rows.shift();
                let count = 0;
                const failedRows = [];
                for (const row of rows) {
                    console.log('id - ', row[titles.indexOf("id")]);
                    let data_detail = {
                        username: row[titles.indexOf("username")],
                        name: row[titles.indexOf("name")],
                        surname: row[titles.indexOf("surname")],
                        email: row[titles.indexOf("email")],
                        phone: row[titles.indexOf("phone")],
                        phonecompany: row[titles.indexOf("phonecompany")],
                        dni: row[titles.indexOf("dni")],
                        residence: row[titles.indexOf("residence")],
                        role: row[titles.indexOf("role")].toLowerCase(),
                        discountkm: row[titles.indexOf("discountkm")] ? row[titles.indexOf("discountkm")] : 0,
                        status: row[titles.indexOf("status")],
                        department: row[titles.indexOf("department")],
                        company: row[titles.indexOf("company")],
                        parent: row[titles.indexOf("parent")],
                        routes: row[titles.indexOf("routes")],
                        start_date: row[titles.indexOf("start_date")],
                        end_date: row[titles.indexOf("end_date")],
                    }
                    if (data_detail.start_date) {
                        if (typeof (data_detail.start_date) === 'string') {
                            data_detail.start_date = moment(data_detail.start_date, "DD/MM/YYYY").toDate();
                        } else {
                            data_detail.start_date = new Date(Math.round((data_detail.start_date - 25569) * 86400 * 1000));
                        }
                    }
                    if (data_detail.end_date) {
                        if (typeof (data_detail.end_date) === 'string') {
                            data_detail.end_date = moment(data_detail.end_date, "DD/MM/YYYY").toDate();
                        } else {
                            data_detail.end_date = new Date(Math.round((data_detail.end_date - 25569) * 86400 * 1000));
                        }
                    }
                    if (!data_detail.start_date || !data_detail.end_date) {
                        console.log(data_detail.start_date, data_detail.end_date);
                        failedRows.push(row);
                        continue;
                    }
                    let dep_exists = UserDepartments.filter(depItem => depItem === data_detail.department);
                    if (dep_exists.length !== 0) {
                        // console.log('dep_exists - ', dep_exists);
                        // failedRows.push(row);
                        // continue;
                        data_detail.department = dep_exists[0];
                    }

                    let filtered_company = await Company.findOne({
                        where: { name: data_detail.company }
                    })
                    if (!filtered_company) {
                        console.log('filtered_company - ', filtered_company);
                        failedRows.push(row);
                        continue;
                    }
                    data_detail.companyCode = filtered_company.id;

                    if (row[titles.indexOf("project")]) {
                        let brands = row[titles.indexOf("project")].split(",");
                        const filtered_brands = await Brand.findAll({
                            where: {
                                name: {
                                    [Op.or]: brands
                                }
                            }
                        })
                        if (filtered_brands.length > 0) {
                            data_detail.projects = filtered_brands.map(item => item.id);
                        }
                        // else {
                        //     console.log('filtered_brands - ', filtered_brands);
                        //     failedRows.push(row);
                        //     continue;
                        // }
                    }

                    console.log('data_detail.parent - ', data_detail.parent, data_detail.parent === null);
                    if (data_detail.parent && data_detail.parent !== null) {
                        let filtered_parent = await User.findOne({
                            where: { username: { [Op.like]: data_detail.parent } },
                        })
                        if (filtered_parent) {
                            // console.log('filtered_parent - ', filtered_parent, data_detail.parent);
                            // failedRows.push(row);
                            // continue;
                            data_detail.parent_id = filtered_parent.id;
                        }
                    } else {
                        data_detail.parent_id = null;
                    }

                    if (data_detail.routes && data_detail.routes !== null) {
                        let filtered_route = await Route.findOne({
                            where: { name: data_detail.routes }
                        })
                        if (filtered_route) {
                            // console.log('filtered_route - ', filtered_route);
                            // failedRows.push(row);
                            // continue;
                            data_detail.routeId = filtered_route.id;
                        }
                    }

                    // const is_check_duplication = await check_duplication(data_detail);
                    // let is_check_duplication = { success: true };
                    let filtered_user = await User.findOne({
                        where: {
                            username: { [Op.like]: data_detail.username }
                        }
                    });
                    if (filtered_user) {
                        // console.log('is_check_duplication.success - ', is_check_duplication.success);
                        // failedRows.push(row);
                        // continue;
                        let userId = filtered_user.id;
                        const result = await User.update(data_detail, { where: { id: userId } })
                        if (result) {
                            if (data_detail.routeId) {
                                await RouteUser.destroy({ where: { userId: userId } });
                                await RouteUser.create({ routeId: data_detail.routeId, userId: result.id })
                            }
                            if (data_detail.projects && data_detail.projects.length > 0) {
                                await UsersProjects.destroy({ where: { userId: userId } });
                                for (const brandId of data_detail.projects) {
                                    await UsersProjects.create({ brandId: brandId, userId: result.id })
                                }
                            }
                        }
                    } else {
                        const result = await User.create({ ...data_detail, password: gennera_user_default_password });
                        if (result) {
                            count++;
                            if (data_detail.routeId) {
                                await RouteUser.create({ routeId: data_detail.routeId, userId: result.id })
                            }
                            if (data_detail.projects && data_detail.projects.length > 0) {
                                for (const brandId of data_detail.projects) {
                                    await UsersProjects.create({ brandId: brandId, userId: result.id })
                                }
                            }
                        } else {
                            console.log(data_detail.username);
                            failedRows.push(row);
                        }
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

}

module.exports = Self
