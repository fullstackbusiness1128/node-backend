const { BrandZones, Brand, Zone, Geography, ZoneGeography, Sequelize } = require('../sequelize')
const excel = require("exceljs");
const readXlsxFile = require("read-excel-file/node");
const fs = require("fs");
const HttpStatus = require("http-status-codes");
const Op = Sequelize.Op;
const expensesUtils = require('../services/expenses.utils');

const get_data = async (req_query, is_download_excel) => {
    const { page, itemsPerPage, sortby, sortdesc, filterModel } = req_query;
    let page_num = page === undefined ? 1 : page;
    let page_limit = itemsPerPage === undefined ? 10 : itemsPerPage;

    let order_cause = [];
    if (sortby !== undefined) {
        order_cause = [sortby, sortdesc === "true" ? "DESC" : "ASC"];
    }
    else {
        order_cause = ["id", "ASC"];
    }

    let filter = filterModel === undefined ? [] : JSON.parse(filterModel);
    let where_cause = {};
    // let geo_where_cause = {};
    filter.map(item => {
        if ((item.columnField === 'name') && item.filterValue) {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause['id'] = { [Op.or]: buffer_values }
        }
        return item;
    })
    let query_builder_options = {
        where: where_cause,
        order: [order_cause],
        include: [
            Brand,
            Geography,
            // (Object.keys(geo_where_cause).length > 0) ? { model: Geography, where: geo_where_cause } : Geography,
        ]
    }

    const data = await Zone.findAndCountAll(query_builder_options)
    let data_list = [];
    for (const data_item of data.rows) {
        let push_item = { ...data_item.dataValues };
        let geographies = [];
        for (const geography_item of push_item.geographies) {
            let geo_push_item = { ...geography_item.dataValues };
            geo_push_item.state_name = '';
            geo_push_item.country_name = '';
            geo_push_item.province_name = geography_item.name;
            geo_push_item.province = geography_item.dataValues;
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
            geographies.push(geo_push_item);
        }
        push_item.geography_list = geographies;
        data_list.push(push_item);
    }
    filter.map(item => {
        if (item.columnField === 'brands') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            data_list = data_list.filter(data_item => {
                let filtered_data = data_item[item.columnField].filter(selected_item => {
                    if (buffer_values.includes(selected_item.dataValues.id)) {
                        return true;
                    }
                })
                if (filtered_data.length > 0) {
                    return true;
                }
            })
        }
        if (item.columnField === 'province') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            data_list = data_list.filter(data_item => {
                let filtered_data = data_item['geographies'].filter(selected_item => {
                    if (buffer_values.includes(selected_item.dataValues.id)) {
                        return true;
                    }
                })
                if (filtered_data.length > 0) {
                    return true;
                }
            })
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

const get_geographies = async () => {
    let where_cause = {
        type: "province"
    };
    let filtered_data = await Geography.findAll({
        where: where_cause,
        order: [["name", "ASC"]],
        include: [
            { model: Geography, as: "parent" }
        ]
    })
    let data = [];
    for (const item of filtered_data) {
        let push_item = { ...item.dataValues };
        let name_stacks = [push_item.name];
        if (push_item.parent !== null) {
            name_stacks.push(push_item.parent.dataValues.name);
            name_stacks = await get_geo_name_stacks(push_item.parent.dataValues.parentId, name_stacks);
        }
        console.log(name_stacks);
        push_item.label = name_stacks.join(', ');
        data.push(push_item);
    }
    return data;
}

const Self = {

    index: async function (req, res) {
        const data = await get_data(req.query);

        const brand_data = await Brand.findAll({
            where: { status: "active" },
            order: [["name", "ASC"]],
        })

        const geographies = await get_geographies();

        return res.json({
            data: data.data,
            total: data.total,
            brand_list: brand_data,
            geographies,
        })
    },

    create: async function (req, res) {
        const { name, geographyIds, brandIds } = req.body
        const data = await Zone.create({ name })
        if (data) {
            let zoneId = data.id;
            await BrandZones.destroy({ where: { zoneId } })
            for (const brandId of brandIds) {
                await BrandZones.create({
                    zoneId,
                    brandId
                })
            }
            await ZoneGeography.destroy({ where: { zoneId } })
            for (const geographyId of geographyIds) {
                await ZoneGeography.create({
                    zoneId,
                    geographyId
                })
            }
        }
        return res.status(200).json({ data })
    },

    update: async function (req, res) {
        const { body, params: { id } } = req;
        const { name, geographyIds, brandIds } = body;
        const data = await Zone.update({ name }, { where: { id } })
        await BrandZones.destroy({ where: { zoneId: id } })
        for (const brandId of brandIds) {
            await BrandZones.create({
                zoneId: id,
                brandId
            })
        }
        await ZoneGeography.destroy({ where: { zoneId: id } })
        for (const geographyId of geographyIds) {
            await ZoneGeography.create({
                zoneId: id,
                geographyId
            })
        }
        return res.status(200).json({ data })
    },

    downloadexcel: async function (req, res) {
        try {
            let zone_list = await get_data(req.query, true);
            zone_list = zone_list.data.map((zone_detail => {
                const result = {
                    ...zone_detail
                }
                result.brand_name = result.brands ? result.brands.map((item) => item.name).join(',') : '';
                let province_value = [];
                result.geography_list.map(geo_item => {
                    province_value.push(geo_item.province_name + ', ' + geo_item.state_name + ', ' + geo_item.country_name)
                })
                province_value = province_value.join(' / ');
                result.province_value = province_value;
                return result;
            }))
            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("data");
            worksheet.columns = [
                { header: "ID", key: "id" },
                { header: "Name", key: "name" },
                { header: "Brand", key: "brand_name" },
                // { header: "Country", key: "country_name" },
                // { header: "State", key: "state_name" },
                // { header: "Province", key: "province_name" },
                { header: "Province", key: "province_value" },
            ];
            worksheet.addRows(zone_list);
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
            const sample_cols = [
                'name',
                'brand',
                // 'country',
                // 'state',
                // 'province',
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
                    }
                    const filtered_data = await Zone.findOne({ where: { name: data_detail.name } });
                    if (filtered_data !== null) {
                        failedRows.push(row);
                        continue;
                    }

                    // if (row[titles.indexOf("province")] !== null && row[titles.indexOf("state")] !== null && row[titles.indexOf("country")] !== null) {
                    //     const filtered_province = await Geography.findOne({
                    //         where: {
                    //             name: row[titles.indexOf("province")],
                    //             type: "province"
                    //         },
                    //         include: [
                    //             {
                    //                 model: Geography,
                    //                 as: "parent",
                    //                 where: {
                    //                     name: row[titles.indexOf("state")],
                    //                     type: "state"
                    //                 }
                    //             }
                    //         ]
                    //     });
                    //     if (filtered_province !== null) {
                    //         let geographyId = filtered_province.id;
                    //         console.log('filtered_province - ', filtered_province.parent);
                    //         if (filtered_province.parent !== null) {
                    //             const filtered_country = await Geography.findOne({
                    //                 where: { id: filtered_province.parent.parentId }
                    //             });
                    //             if (filtered_country !== null && filtered_country.name === row[titles.indexOf("country")]) {
                    //                 data_detail.geographyId = geographyId;
                    //             }
                    //         }
                    //     }
                    // }

                    // console.log(data_detail);
                    const is_new = await Zone.create(data_detail)
                    if (is_new) {
                        count++;
                        if (row[titles.indexOf("brand")] !== null) {
                            let brand_name_list = row[titles.indexOf("brand")].split(',');
                            let brandIds = [];
                            for (const brand_name of brand_name_list) {
                                const filtered_brand = await Brand.findOne({ where: { name: brand_name } });
                                if (filtered_brand !== null) {
                                    brandIds.push(filtered_brand.id)
                                }
                            }
                            await BrandZones.destroy({ where: { brandId: is_new.id } })
                            for (const brandId of brandIds) {
                                await BrandZones.create({
                                    zoneId: is_new.id,
                                    brandId
                                })
                            }
                        }
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
            if (column === 'name' || column === 'description') {
                let where_cause = {};
                where_cause[column] = { [Op.like]: "%" + filterValue + "%" };
                let order_cause = [];
                order_cause = ["name", "ASC"];
                const data = await Zone.findAll({
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
            else if (column === 'brands') {
                let brand_where_cause = {};
                brand_where_cause['name'] = { [Op.like]: "%" + filterValue + "%" };
                let query_builder_options = {
                    include: [
                        (Object.keys(brand_where_cause).length > 0) ? { model: Brand, where: brand_where_cause } : { model: Brand },
                    ]
                }
                const data = await BrandZones.findAll(query_builder_options)
                for (const item of data) {
                    let push_item = {
                        id: item.dataValues.brandId,
                        title: item.dataValues.brand.name,
                    }
                    let filtered_data = data_list.filter(data_item => data_item.id === push_item.id);
                    if (filtered_data.length === 0) {
                        data_list.push(push_item);
                    }
                }
            }
            else if (column === 'province') {
                let query_builder_options = {
                    include: [
                        Geography
                    ]
                }
                const data = await ZoneGeography.findAll(query_builder_options)
                for (const item of data) {
                    console.log(item.dataValues.geography);
                    let push_item = {
                        id: item.dataValues.geographyId,
                    }
                    push_item.title = await expensesUtils.getFullGeography(item.dataValues.geography);
                    let filtered_data = data_list.filter(data_item => data_item.id === push_item.id);
                    if (filtered_data.length === 0) {
                        data_list.push(push_item);
                    }
                }
                if (filterValue !== '') {
                    data_list = data_list.filter(item => item.title.toLowerCase().includes(filterValue.toLowerCase()));
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
