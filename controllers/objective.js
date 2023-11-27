const { Objective, ObjectiveAccomplishmentScales, ObjectivePos, ObjectiveRoutes, Brand, Pos, RoutePos, Sequelize, Route, User, RouteUser } = require('../sequelize')
const HttpStatus = require("http-status-codes");
const excel = require("exceljs");
const readXlsxFile = require("read-excel-file/node");
const moment = require("moment");
const expensesUtils = require('../services/expenses.utils');
const fs = require("fs");
const Op = Sequelize.Op;
const Fn = Sequelize.fn;

const get_data = async (req_query, is_download_excel) => {
    const { page, itemsPerPage, sortby, sortdesc, filterModel } = req_query;
    console.log(page, itemsPerPage, sortby, sortdesc, filterModel);
    let page_num = page === undefined ? 1 : page;
    let page_limit = itemsPerPage === undefined ? 10 : itemsPerPage;
    let filter = filterModel === undefined ? [] : JSON.parse(filterModel);

    let order_cause = [];
    if (sortby !== undefined) {
        if (sortby === 'brand') {
            order_cause = ['brandId', sortdesc === "true" ? "DESC" : "ASC"];
        }
        else {
            order_cause = [sortby, sortdesc === "true" ? "DESC" : "ASC"];
        }
    }
    else {
        order_cause = ["start_date", "DESC"];
    }

    let where_cause = {};
    let brand_where_cause = {};
    let buffer_values = [];
    filter.map(item => {
        if ((item.columnField === 'name' || item.columnField === 'description') && item.filterValue) {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause['id'] = { [Op.or]: buffer_values }
        }
        if (item.columnField === 'brand') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause['brandId'] = { [Op.or]: buffer_values }
        }

        // checkbox search
        if (item.columnField === 'status' || item.columnField === 'types') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause[item.columnField] = { [Op.or]: buffer_values }
        }

        // range search - from to
        if (item.columnField === 'weight' || item.columnField === 'value') {
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

        if (item.columnField === 'start_date') {
            if (item.filterValue['from'] !== undefined && item.filterValue['to'] !== undefined && item.filterValue['from'] !== '' && item.filterValue['to'] !== '') {
                where_cause.start_date = {
                    [Op.and]: [
                        { [Op.gte]: new Date(item.filterValue['from']) },
                        { [Op.lte]: new Date(item.filterValue['to']) },
                    ]
                }
            }
            else if (item.filterValue['from'] !== undefined && item.filterValue['from'] !== '') {
                where_cause.start_date = { [Op.gte]: new Date(item.filterValue['from']) }
            } else if (item.filterValue['to'] !== undefined && item.filterValue['to'] !== '') {
                where_cause.start_date = { [Op.lte]: new Date(item.filterValue['to']) }
            }
        }
        if (item.columnField === 'end_date') {
            if (item.filterValue['from'] !== undefined && item.filterValue['to'] !== undefined && item.filterValue['from'] !== '' && item.filterValue['to'] !== '') {
                where_cause.end_date = {
                    [Op.and]: [
                        { [Op.gte]: new Date(item.filterValue['from']) },
                        { [Op.lte]: new Date(item.filterValue['to']) },
                    ]
                }
            }
            else if (item.filterValue['from'] !== undefined && item.filterValue['from'] !== '') {
                where_cause.end_date = { [Op.gte]: new Date(item.filterValue['from']) }
            } else if (item.filterValue['to'] !== undefined && item.filterValue['to'] !== '') {
                where_cause.end_date = { [Op.lte]: new Date(item.filterValue['to']) }
            }
        }
        return item;
    })
    console.log(where_cause);

    let query_builder_options = {
        where: where_cause,
        order: [order_cause],
        include: [
            (Object.keys(brand_where_cause).length > 0) ? { model: Brand, where: brand_where_cause } : Brand,
            ObjectiveAccomplishmentScales,
            {
                model: ObjectivePos,
                include: [Pos]
            },
        ]
    }
    const data = await Objective.findAndCountAll(query_builder_options)

    let objective_list = [];
    for (let i = 0; i < data.rows.length; i++) {
        let item = data.rows[i].dataValues;
        objective_list.push(item)
    }
    let total_count = objective_list.length;
    if (!is_download_excel) {
        objective_list = objective_list.slice(page_limit * (page_num - 1), page_limit * page_num);
    }
    return {
        data: objective_list,
        total: total_count,
    };
}

const Self = {

    index: async function (req, res) {
        try {
            const objectives = await get_data(req.query);
            return res.json({
                data: objectives.data,
                total: objectives.total
            })
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    create: async function (req, res) {
        const { body } = req
        const data = await Objective.create(body)
        return res.status(200).json({ data })
    },

    update: async function (req, res) {
        const { body, params: { id } } = req
        const data = await Objective.update(body, { where: { id } })
        return res.status(200).json({ data })
    },

    saveGoData: async function (req, res) {
        const { objectiveId, scales, objective_salesType } = req.body;
        console.log(objectiveId, scales, objective_salesType);
        const data = await Objective.update({ salesTypes: objective_salesType }, { where: { id: objectiveId } });

        await ObjectiveAccomplishmentScales.destroy({ where: { objectiveId } })
        let orderNum = 1;
        for (const scale_item of scales) {
            let data = {
                objectiveId,
                orderNum,
                fromValue: scale_item.fromValue,
                toValue: scale_item.toValue,
                accomplishedValue: scale_item.accomplishedValue,
            }
            await ObjectiveAccomplishmentScales.create(data);
            orderNum++;
        }
        return res.status(200).json({ objectiveId });
    },

    downloadexcel: async function (req, res) {
        try {
            const objectives = await get_data(req.query);
            let data_list = objectives.data.map((detail => {
                const result = {
                    ...detail
                }
                result.brand_name = detail.brand ? detail.brand.name : '';
                result.start_date = detail.start_date ? moment(moment.utc(detail.start_date, "H:m:s").toDate()).format("DD/MM/YYYY") : '';
                result.end_date = detail.end_date ? moment(moment.utc(detail.end_date, "H:m:s").toDate()).format("DD/MM/YYYY") : '';
                return result;
            }))
            console.log(data_list);

            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("data");
            worksheet.columns = [
                { header: "ID", key: "id" },
                { header: "Brand Name", key: "brand_name" },
                { header: "Types", key: "types" },
                { header: "Objective Name", key: "name" },
                { header: "Description", key: "description" },
                { header: "Weight", key: "weight" },
                { header: "Value", key: "value" },
                { header: "Status", key: "status" },
                { header: "Start Date", key: "start_date" },
                { header: "End Date", key: "end_date" },
            ];
            worksheet.addRows(data_list);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=" + "Objectives.xlsx"
            );
            return workbook.xlsx.write(res).then(() => res.status(200).send());
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    downloadExcelPOSObjectiveAll: async function (req, res) {
        try {
            const objectives = await get_data(req.query);
            let data_list = [];
            objectives.data.map((detail => {
                detail.objective_pos.map(pos_item => {
                    let push_item = {
                        id_objective: detail.id,
                        objective_name: detail.name,
                        id_pos: pos_item.posId,
                        pos_name: pos_item.po.name,
                        value: pos_item.value
                    }
                    data_list.push(push_item);
                })
                return detail;
            }))
            console.log(data_list);

            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("data");
            worksheet.columns = [
                { header: "Id Objective", key: "id_objective" },
                { header: "Objective Name", key: "objective_name" },
                { header: "IdPOS", key: "id_pos" },
                { header: "POS Name", key: "pos_name" },
                { header: "Value", key: "value" },
            ];
            worksheet.addRows(data_list);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=" + "Objectives.xlsx"
            );
            return workbook.xlsx.write(res).then(() => res.status(200).send());
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    downloadexcelIDPOSwithObjective: async function (req, res) {
        try {
            const { id } = req.params;
            let query_builder_options = {
                where: { objectiveId: id },
                order: [["posId", "ASC"]],
                include: [
                    Objective,
                    Pos
                ]
            }
            const data = await ObjectivePos.findAll(query_builder_options);
            console.log(data);

            let pos_list = [];
            for (let i = 0; i < data.length; i++) {
                let record = data[i].dataValues;
                record.objectiveName = record.objective.name;
                record.posName = record.po.name;
                pos_list.push(record);
            }
            console.log(pos_list);

            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("data");
            worksheet.columns = [
                { header: "ID Objective", key: "objectiveId" },
                { header: "Objective Name", key: "objectiveName" },
                { header: "ID POS", key: "posId" },
                { header: "POS Name", key: "posName" },
                { header: "Value", key: "value" },
            ];
            worksheet.addRows(pos_list);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=" + "products.xlsx"
            );
            return workbook.xlsx.write(res).then(() => res.status(200).send());
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    uploadexcelIDPOSwithObjective: async function (req, res) {
        try {
            const { objectiveId } = req.params;
            console.log(objectiveId, req.file);
            const filteredObjective = await Objective.findOne({ where: { id: objectiveId } });
            if (req.file === undefined || filteredObjective === null) {
                res.status(400).send("Please upload an excel file!");
            }
            let path = __basedir + "/resources/uploadstmp/";

            console.log('----- starting upload excel file for updating assortments -----');
            readXlsxFile(path + req.file.filename).then(async (rows) => {
                fs.unlink(path + req.file.filename, (err) => {
                    if (err) throw err;
                });
                let titles = rows[0];
                let original_titles = rows[0];
                titles = titles.map(title => {
                    if (title !== null) return title.replaceAll(" ", "_").toLowerCase();
                })
                // check the excel file's format (column list)
                let is_data = 'ID';
                if (filteredObjective.types === 'Sales') {
                    if (titles.filter(title => title === 'value').length > 0 && titles.filter(title => title === 'id_pos').length > 0) {
                        is_data = 'ID';
                    }
                    else if (titles.filter(title => title === 'value').length > 0 && titles.filter(title => title === 'pos_name').length > 0) {
                        is_data = 'NAME';
                    }
                    else {
                        return res.json({
                            success: false,
                            invalidFile: false,
                            message: "The uploaded file is invalid. Please check the column list. Their columns' name should be ID POS, Value or POS Name or Value."
                        });
                    }
                }
                else {
                    if (titles.filter(title => title === 'id_pos').length > 0) {
                        is_data = 'ID';
                    }
                    else if (titles.filter(title => title === 'pos_name').length > 0) {
                        is_data = 'NAME';
                    }
                    else {
                        return res.json({
                            success: false,
                            invalidFile: false,
                            message: "The uploaded file is invalid. Please check the column list. Their columns' name should be ID POS or POS Name."
                        });
                    }
                }

                rows.shift();
                let count = 0;
                const failedRows = [];
                for (const row of rows) {
                    let row_validation = true;
                    row.map(cell => {
                        if (cell === null) {
                            row_validation = false;
                        }
                    })
                    if (!row_validation) {
                        failedRows.push(row);
                        continue;
                    }

                    let objective_pos = {};
                    if (is_data === 'ID') {
                        objective_pos = {
                            posId: row[titles.indexOf("id_pos")],
                            value: row[titles.indexOf("value")],
                        }
                        const filtered_pos = await Pos.findOne({ where: { id: objective_pos.posId } });
                        if (filtered_pos === null) {
                            failedRows.push(row);
                            continue;
                        }
                        const filtered_objective_pos = await ObjectivePos.findOne({
                            where: {
                                objectiveId: objectiveId,
                                posId: objective_pos.posId,
                            }
                        })
                        if (filtered_objective_pos === null) {
                            await ObjectivePos.create({
                                objectiveId: objectiveId,
                                posId: objective_pos.posId,
                                value: objective_pos.value,
                            })
                        }
                        else {
                            await ObjectivePos.update({
                                value: objective_pos.value,
                            }, { where: { id: filtered_objective_pos.id } })
                        }
                        count++;
                    }
                    else if (is_data === 'NAME') {
                        objective_pos = {
                            posName: row[titles.indexOf("pos_name")],
                            value: row[titles.indexOf("value")],
                        }
                        const filtered_pos = await Pos.findOne({ where: { name: objective_pos.posName } });
                        if (filtered_pos === null) {
                            failedRows.push(row);
                            continue;
                        }
                        const filtered_objective_pos = await ObjectivePos.findOne({
                            where: {
                                objectiveId: objectiveId,
                                posId: filtered_pos.id,
                            }
                        })
                        if (filtered_objective_pos === null) {
                            await ObjectivePos.create({
                                objectiveId: objectiveId,
                                posId: filtered_pos.id,
                                value: objective_pos.value,
                            })
                        }
                        else {
                            await ObjectivePos.update({
                                value: objective_pos.value,
                            }, { where: { id: filtered_objective_pos.id } });
                        }
                        count++;
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

    copydata: async function (req, res) {
        const { body, params: { oldId } } = req
        console.log(oldId);
        let old_data = await Objective.findOne({
            where: { id: oldId },
            include: [
                ObjectiveAccomplishmentScales,
                ObjectivePos,
            ]
        });
        if (old_data !== null) {
            old_data = old_data.dataValues;
            console.log(old_data);
            const { objective_accomplishment_scales, objective_pos, id, createdAt, updatedAt, name, ...rest } = old_data;
            let newObjectiveData = { ...rest, name: name + ' copy' };
            console.log(newObjectiveData);
            const data = await Objective.create(newObjectiveData);
            if (data) {
                const newObjectiveId = data.id;
                for (const scale of objective_accomplishment_scales) {
                    console.log(scale.dataValues);
                    const { id, objectiveId, createdAt, updatedAt, ...rest } = scale.dataValues;
                    let newScaleItem = { ...rest, objectiveId: newObjectiveId };
                    await ObjectiveAccomplishmentScales.create(newScaleItem);
                }
                console.log(objective_pos);
                for (const pos of objective_pos) {
                    console.log(pos.dataValues);
                    const { id, objectiveId, createdAt, updatedAt, ...rest } = pos.dataValues;
                    let newPosItem = { ...rest, objectiveId: newObjectiveId };
                    await ObjectivePos.create(newPosItem);
                }
                return res.status(200).json({ data })
            }
        }
        return res.status(200).json({ success: false })
    },

    get_route_objective_data: async function (req, res) {
        const { objectiveId } = req.params;
        console.log(objectiveId);
        try {
            let selected_row = await Objective.findOne({ where: { id: objectiveId } });
            let returnValue = {};
            if (selected_row !== null) {
                let brandId = selected_row.brandId;
                let targetValue = selected_row.value;
                // RoutePos
                let route_pos_data = await RoutePos.findAll({
                    attributes: ['routeId', 'brandId', [Fn('COUNT', 'route_pos.posId'), 'posCount']],
                    where: { brandId: brandId },
                    group: ['routeId'],
                    include: [Route]
                })
                // console.log(route_pos_data);
                let objective_routes = [];
                let total_brand_pos_count = 0;
                for (const route_pos_item of route_pos_data) {
                    let push_item = { ...route_pos_item.dataValues };
                    push_item.route_name = '';
                    if (push_item.route) {
                        push_item.route_name = push_item.route.name;
                    }
                    // let route_users = await RouteUser.findAll({
                    //     where: { routeId: push_item.routeId },
                    //     include: [User]
                    // })
                    // console.log('pushitem - ', route_users);
                    let route_users = await Route.findOne({
                        where: { id: push_item.routeId },
                        include: [User]
                    })
                    console.log(route_users.users);
                    if (route_users.users !== null && route_users.users.length > 0) {
                        push_item.spv = route_users.users.filter(user_item => user_item.role === 'spv');
                        push_item.gpvs = route_users.users.filter(user_item => user_item.role === 'gpv');
                        push_item.spv_name = push_item.spv.map(item => item.name).join(',');
                        push_item.gpv_name = push_item.gpvs.map(item => item.name).join(',');
                    }
                    objective_routes.push(push_item);
                    total_brand_pos_count += push_item.posCount;
                }

                for (let i = 0; i < objective_routes.length; i++) {
                    let routeId = objective_routes[i].routeId;
                    let posCount = objective_routes[i].posCount;
                    let filtered_obj_route = await ObjectiveRoutes.findOne({ where: { objectiveId, routeId } });
                    let value = 0;
                    if (filtered_obj_route === null) {
                        value = targetValue * (posCount / total_brand_pos_count);
                        let upsert_item = {
                            objectiveId,
                            routeId,
                            posCount,
                            value,
                        };
                        const inserted_data = await ObjectiveRoutes.create(upsert_item);
                        objective_routes[i].value = value;
                        objective_routes[i].id = inserted_data.id;
                    }
                    else {
                        objective_routes[i].value = filtered_obj_route.value;
                        objective_routes[i].id = filtered_obj_route.id;
                    }
                }
                returnValue.data = objective_routes;
                returnValue.total_brand_pos_count = total_brand_pos_count;
            }
            else {
                returnValue.success = false;
            }
            return res.json(returnValue);
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    get_pos_objective_data: async function (req, res) {
        const { objectiveId } = req.params;
        console.log(objectiveId);
        try {
            let selected_row = await Objective.findOne({
                where: { id: objectiveId },
                include: [
                    {
                        model: ObjectivePos,
                        include: [Pos]
                    },
                ]
            });
            console.log(selected_row);
            let returnValue = {};
            if (selected_row !== null) {
                returnValue.data = selected_row;
            }
            else {
                returnValue.success = false;
            }
            return res.json(returnValue);
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    save_route_objective_value: async function (req, res) {
        const { body, params: { id } } = req
        // console.log(body, id);
        let obj_route_update_data = {
            value: body.value,
        }
        const data = await ObjectiveRoutes.update(obj_route_update_data, { where: { id } })
        let updated_value = body.value * body.total_brand_pos_count / body.posCount;
        let update_obj_calc_value = {
            value: updated_value
        }
        const status = await Objective.update(update_obj_calc_value, { where: { id: body.objectiveId } })
        const objdata = await Objective.findOne({ where: { id: body.objectiveId } })
        return res.status(200).json({ objdata })
    },

    downloadexcelObjectiveRoutes: async function (req, res) {
        try {
            const { id } = req.params;
            let query_builder_options = {
                where: { objectiveId: id },
                order: [["id", "ASC"]],
                include: [
                    Objective,
                    Route
                ]
            }
            const data = await ObjectiveRoutes.findAll(query_builder_options);
            console.log(data);

            let data_list = [];
            for (let i = 0; i < data.length; i++) {
                let record = data[i].dataValues;
                record.objectiveName = record.objective.name;
                record.routeName = record.route.name;
                data_list.push(record);
            }
            console.log(data_list);

            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("data");
            worksheet.columns = [
                { header: "ID Objective", key: "objectiveId" },
                { header: "Objective Name", key: "objectiveName" },
                { header: "ID Route", key: "routeId" },
                { header: "Route Name", key: "routeName" },
                { header: "Value", key: "value" },
            ];
            worksheet.addRows(data_list);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=" + "objectives_routes.xlsx"
            );
            return workbook.xlsx.write(res).then(() => res.status(200).send());
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    uploadexcelObjectiveRoutes: async function (req, res) {
        try {
            const { objectiveId } = req.params;
            console.log(objectiveId, req.file);
            if (req.file === undefined) {
                res.status(400).send("Please upload an excel file!");
            }
            let path = __basedir + "/resources/uploadstmp/";

            console.log('----- starting upload excel file for updating assortments -----');
            readXlsxFile(path + req.file.filename).then(async (rows) => {
                fs.unlink(path + req.file.filename, (err) => {
                    if (err) throw err;
                });
                let titles = rows[0];
                let original_titles = rows[0];
                titles = titles.map(title => {
                    if (title !== null) return title.replaceAll(" ", "_").toLowerCase();
                })
                // check the excel file's format (column list)
                let is_data = 'ID';
                if (titles.filter(title => title === 'value').length > 0 && titles.filter(title => title === 'id_route').length > 0) {
                    is_data = 'ID';
                }
                else if (titles.filter(title => title === 'value').length > 0 && titles.filter(title => title === 'route_name').length > 0) {
                    is_data = 'NAME';
                }
                else {
                    return res.json({
                        success: false,
                        invalidFile: false,
                        message: "The uploaded file is invalid. Please check the column list. Their columns' name should be ID Objective, ID Route, Value or Objective Name, Route Name, Value."
                    });
                }

                rows.shift();
                let count = 0;
                const failedRows = [];
                for (const row of rows) {
                    let row_validation = true;
                    row.map(cell => {
                        if (cell === null) {
                            row_validation = false;
                        }
                    })
                    if (!row_validation) {
                        failedRows.push(row);
                        continue;
                    }

                    let objective_route = {};
                    if (is_data === 'ID') {
                        objective_route = {
                            routeId: row[titles.indexOf("id_route")],
                            value: row[titles.indexOf("value")],
                        }
                        const filtered_route = await Route.findOne({ where: { id: objective_route.routeId } });
                        if (filtered_route === null) {
                            failedRows.push(row);
                            continue;
                        }
                        const filtered_objective_route = await ObjectiveRoutes.findOne({
                            where: {
                                objectiveId: objectiveId,
                                routeId: objective_route.routeId,
                            }
                        })
                        if (filtered_objective_route === null) {
                            await ObjectiveRoutes.create({
                                objectiveId: objectiveId,
                                routeId: objective_route.routeId,
                                value: objective_route.value,
                            })
                        }
                        else {
                            await ObjectiveRoutes.update({
                                value: objective_route.value,
                            }, { where: { id: filtered_objective_route.id } })
                        }
                        count++;
                    }
                    else if (is_data === 'NAME') {
                        objective_route = {
                            routeName: row[titles.indexOf("route_name")],
                            value: row[titles.indexOf("value")],
                        }
                        const filtered_route = await Route.findOne({ where: { name: objective_route.routeName } });
                        if (filtered_route === null) {
                            failedRows.push(row);
                            continue;
                        }
                        const filtered_objective_route = await ObjectiveRoutes.findOne({
                            where: {
                                objectiveId: objectiveId,
                                routeId: filtered_route.id,
                            }
                        })
                        if (filtered_objective_route === null) {
                            await ObjectiveRoutes.create({
                                objectiveId: objectiveId,
                                routeId: filtered_route.id,
                                value: objective_route.value,
                            })
                        }
                        else {
                            await ObjectiveRoutes.update({
                                value: objective_route.value,
                            }, { where: { id: filtered_objective_route.id } });
                        }
                        count++;
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

    get_selectable_brands: async function (req, res) {
        const { filter_name, target } = req.query;
        if (filter_name !== '' && filter_name !== null && filter_name !== undefined) {
            let where_cause = [];
            where_cause.push({ name: { [Op.like]: "%" + filter_name + "%" } });
            where_cause.push({ status: 'active' })
            where_cause.push({ module_info: { [Op.not]: 'No' } })
            where_cause.push({ module_sales: { [Op.not]: 'No' } })
            where_cause.push({ module_actions: { [Op.not]: 'No' } })

            let order_cause = [];
            order_cause = ["name", "ASC"];

            let data = [];

            data = await Brand.findAll({
                where: where_cause,
                order: [order_cause],
            })

            return res.json({
                data: data,
            })
        }
        else {
            return res.json({
                data: [],
            })
        }
    },

    getfilterlist: async function (req, res) {
        const { column, filterValue, isFullText } = req.query;
        let data_list = [];
        if (filterValue !== undefined) {
            if (column === 'name' || column === 'description') {
                let where_cause = {};
                where_cause[column] = { [Op.like]: "%" + filterValue + "%" };
                let order_cause = [];
                order_cause = ["name", "ASC"];
                const data = await Objective.findAll({
                    where: where_cause,
                    order: [order_cause],
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
            else if (column === 'brand') {
                let brand_where_cause = {};
                brand_where_cause['name'] = { [Op.like]: "%" + filterValue + "%" };
                let query_builder_options = {
                    include: [
                        (Object.keys(brand_where_cause).length > 0) ? { model: Brand, where: brand_where_cause } : Brand,
                    ]
                }
                const data = await Objective.findAll(query_builder_options)
                for (const item of data) {
                    let push_item = { ...item.dataValues };
                    push_item['id'] = push_item.brandId;
                    push_item['title'] = push_item.brand.name;
                    let filtered_data = data_list.filter(data_item => data_item.brandId === push_item.brandId);
                    if (filtered_data.length === 0) {
                        data_list.push(push_item);
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
