const { Route, RouteUser, Geography, User, Zone } = require('../sequelize')
const Sequelize = require("sequelize");
const HttpStatus = require("http-status-codes");
const excel = require("exceljs");
const readXlsxFile = require("read-excel-file/node");
const fs = require("fs");
const Op = Sequelize.Op;

const get_geo_name_stacks = async (geo_id, name_stacks) => {
    let data = await Geography.findOne({ where: { id: geo_id } });
    data = data.dataValues;
    console.log('data - ', data);
    name_stacks.push(data.name);
    if (data && data.parentId !== null && geo_id !== data.parentId) {
        await get_geo_name_stacks(data.parentId, name_stacks);
    }
    return name_stacks;
}

const get_data = async (req_query, is_download_excel) => {
    const { page, itemsPerPage, sortby, sortdesc, filterModel } = req_query;
    let page_num = page === undefined ? 1 : page;
    let page_limit = itemsPerPage === undefined ? 10 : itemsPerPage;

    let order_cause = [];
    if (sortby !== undefined && sortby !== 'country_name' && sortby !== 'state_name' && sortby !== 'province_name') {
        order_cause = [sortby, sortdesc === "true" ? "DESC" : "ASC"];
    }
    else {
        order_cause = ["id", "ASC"];
    }

    let filter = filterModel === undefined ? [] : JSON.parse(filterModel);
    let where_cause = {};
    let zone_where_cause = {};
    let buffer_values = [];
    filter.map(item => {
        if (item.columnField === 'zoneId') {
            zone_where_cause.name = { [Op.like]: "%" + item.filterValue + "%" };
        }
        // string search
        if ((item.columnField === 'name') && item.filterValue) {
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
        return item;
    })
    console.log(where_cause);
    let query_builder_options = {
        where: where_cause,
        order: [order_cause],
        include: [
            Geography,
            (Object.keys(zone_where_cause).length > 0) ? { model: Zone, where: zone_where_cause } : Zone,
            User,
        ]
    }

    const data = await Route.findAndCountAll(query_builder_options)
    let data_list = [];
    for (const data_item of data.rows) {
        let push_item = { ...data_item.dataValues };

        push_item.country = {};
        push_item.state = {};
        push_item.province = {};
        push_item.country_name = "";
        push_item.state_name = "";
        push_item.province_name = "";
        if (push_item.geography !== null) {
            push_item.province_name = '';
            push_item.state_name = '';
            push_item.country_name = '';
            if (push_item.geography !== null) {
                push_item.province_name = push_item.geography.name;
            }

            if (push_item.geography.parentId !== null && push_item.geography.parentId !== push_item.geography.id) {
                push_item.state = await Geography.findOne({ where: { id: push_item.geography.parentId } });
                if (push_item.state !== null) {
                    push_item.state_name = push_item.state.name;
                }
                if (push_item.state.parentId !== null && push_item.state.parentId !== push_item.state.id) {
                    push_item.country = await Geography.findOne({ where: { id: push_item.state.parentId } });
                    if (push_item.country !== null) {
                        push_item.country_name = push_item.country.name;
                    }
                }
            }
            else {
                push_item.state = {};
                push_item.province = {};
            }
        }

        push_item.spv = [];
        push_item.gpvs = [];
        if (push_item.users !== null && push_item.users.length > 0) {
            push_item.spv = push_item.users.filter(user_item => user_item.role === 'spv');
            push_item.gpvs = push_item.users.filter(user_item => user_item.role === 'gpv');
        }
        data_list.push(push_item);
    }

    if (sortby !== undefined && (sortby === 'country_name' || sortby === 'state_name' || sortby === 'province_name')) {
        if (sortdesc === "false") {
            data_list = data_list.sort((a, b) => (a[sortby] > b[sortby]) ? 1 : ((b[sortby] > a[sortby]) ? -1 : 0))
        }
        else {
            data_list = data_list.sort((a, b) => (a[sortby] < b[sortby]) ? 1 : ((b[sortby] < a[sortby]) ? -1 : 0))
        }
    }
    filter.map(item => {
        if (item.columnField === 'country_name' || item.columnField === 'state_name' || item.columnField === 'province_name') {
            data_list = data_list.filter(data_item => data_item[item.columnField].toLowerCase().includes(item.filterValue));
        }
    })
    let total_count = data_list.length;
    if (!is_download_excel) {
        data_list = data_list.slice(page_limit * (page_num - 1), page_limit * page_num);
    }
    const spv_list = await User.findAll({ where: { role: 'spv' } });
    return {
        data: data_list,
        total_count,
        spv_list: spv_list,
    }
}

const getGeographyId = async (country, state, province) => {
    let where = {
        name: country,
        type: 'country',
        parentId: 1.
    }
    const country_data = await Geography.findOne({
        where
    });
    if (!country_data) {
        return null;
    }
    let countryId = country_data.id;
    where = {
        name: state,
        type: "state",
        parentId: countryId
    }
    const state_data = await Geography.findOne({
        where
    });
    if (!state_data) {
        return null;
    }
    let stateId = state_data.id;
    where = {
        name: province,
        type: "province",
        parentId: stateId
    }
    const province_data = await Geography.findOne({
        where
    });
    if (!province_data) {
        return null;
    }
    return province_data.id;
}

module.exports = {

    index: async function (req, res) {
        try {
            const routes = await get_data(req.query);
            return res.json({
                data: routes.data,
                total: routes.total_count,
                spv_list: routes.spv_list,
            })
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    get_gpvs: async function (req, res) {
        const { spv_id } = req.query;
        let where_cause = {
            role: "gpv",
            parent_id: spv_id,
        };
        let filtered_data = await User.findAll({
            where: where_cause,
            order: [["username", "ASC"]],
        })
        res.json({
            data: filtered_data
        });
    },

    create: async function (req, res) {
        const { spvId, gpvIds, ...rest } = req.body;
        const data = await Route.create(rest)
        const users = [...[spvId], ...gpvIds];
        console.log(users);
        if (data.id) {
            let routeId = data.id;
            await RouteUser.destroy({ where: { routeId } })
            for (const userId of users) {
                await RouteUser.create({
                    routeId,
                    userId,
                })
            }
            return res.status(200).json({ data })
        }
        else {
            return res.status(200).json({ error: true })
        }
    },

    update: async function (req, res) {
        const { body, params: { id } } = req
        const { spvId, gpvIds, ...rest } = body;
        const data = await Route.update(body, { where: { id } })
        const users = [...[spvId], ...gpvIds];
        console.log(users);
        if (id) {
            let routeId = id;
            await RouteUser.destroy({ where: { routeId } })
            for (const userId of users) {
                await RouteUser.create({
                    routeId,
                    userId,
                })
            }
            return res.status(200).json({ data })
        }
        else {
            return res.status(200).json({ error: true })
        }
    },

    downloadexcel: async function (req, res) {
        try {
            let route_list = await get_data(req.query, true);
            route_list = route_list.data.map((route_detail => {
                const result = {
                    ...route_detail
                }
                result.spv = route_detail.spv.map(item => item.name);
                result.spv = result.spv.join(', ');

                result.gpvs = route_detail.gpvs.map(item => item.name);
                result.gpvs = result.gpvs.join(', ');

                result.zoneName = route_detail.zone !== null ? route_detail.zone.name : '';
                return result;
            }))
            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("Routes");
            worksheet.columns = [
                { header: "ID", key: "id" },
                { header: "Name", key: "name" },
                { header: "SPV", key: "spv" },
                { header: "Main GPV", key: "gpvs" },
                { header: "Country", key: "country_name" },
                { header: "State", key: "state_name" },
                { header: "Province", key: "province_name" },
                { header: "Zone", key: "zoneName" },
                { header: "Status", key: "status" },
            ];
            worksheet.addRows(route_list);
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

    uploadexcel: async function (req, res) {
        try {
            if (req.file === undefined) {
                res.status(400).send("Please upload an excel file!");
            }
            let path = __basedir + "/resources/uploadstmp/";
            const sample_cols = [
                'name',
                'country',
                'state',
                'province',
                'zone',
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
                    let data_detail = {
                        name: row[titles.indexOf("name")],
                        status: row[titles.indexOf("status")],
                        zone: row[titles.indexOf("zone")],
                        country: row[titles.indexOf("country")],
                        state: row[titles.indexOf("state")],
                        province: row[titles.indexOf("province")],
                    }
                    const filtered_data = await Route.findOne({ where: { name: data_detail.name } });
                    if (filtered_data) {
                        failedRows.push(row);
                        continue;
                    }
                    const filtered_zone_data = await Zone.findOne({ where: { name: data_detail.zone } });
                    if (!filtered_zone_data) {
                        // console.log(row);
                        // console.log(filtered_zone_data);
                        failedRows.push(row);
                        continue;
                    }
                    data_detail.zoneId = filtered_zone_data.id;
                    data_detail.geographyId = await getGeographyId(data_detail.country, data_detail.state, data_detail.province);
                    if (!data_detail.geographyId) {
                        // console.log(row);
                        // console.log(filtered_zone_data);
                        failedRows.push(row);
                        continue;
                    }
                    console.log(data_detail);
                    let filtered_route = await Route.findOne({
                        where: {
                            name: { [Op.like]: data_detail.name }
                        }
                    });
                    if (filtered_route) {
                        let routeId = filtered_route.id;
                        const data = await Route.update(data_detail, { where: { id: routeId } })
                    } else {
                        const is_new = await Route.create(data_detail)
                        if (is_new) {
                            count++;
                        }
                        else {
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
