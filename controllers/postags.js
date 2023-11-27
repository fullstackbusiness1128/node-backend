const { Pos, Postaglabel, Postags, Brand, Chain, Channel, Geography, Zone } = require('../sequelize')
const Sequelize = require("sequelize");
const HttpStatus = require("http-status-codes");
const excel = require("exceljs");
const readXlsxFile = require("read-excel-file/node");
const fs = require("fs");
const Op = Sequelize.Op;
const expensesUtils = require('../services/expenses.utils');

const get_data = async (req_query, is_download_excel) => {
    const { page, itemsPerPage, sortby, sortdesc, filterModel } = req_query;
    let page_num = page === undefined ? 1 : page;
    let page_limit = itemsPerPage === undefined ? 10 : itemsPerPage;
    let order_cause = [];
    if (sortby) {
        if (sortby === 'brand') {
            order_cause = ['brand', 'name', sortdesc === "true" ? "DESC" : "ASC"];
        } else {
            order_cause = [sortby, sortdesc === "true" ? "DESC" : "ASC"];
        }
    }
    else {
        order_cause = ["id", "ASC"];
    }

    let filter = filterModel === undefined ? [] : JSON.parse(filterModel);
    let where_cause = {};
    let brand_where_cause = {};
    let buffer_values = [];
    filter.map(item => {
        if (item.columnField === 'brand') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) brand_where_cause['id'] = { [Op.or]: buffer_values }
        }
        if ((item.columnField === 'name' || item.columnField === 'description') && item.filterValue) {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause['id'] = { [Op.or]: buffer_values }
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

    let query_builder_options = {
        where: where_cause,
        order: [order_cause],
        include: [
            (Object.keys(brand_where_cause).length > 0) ? { model: Brand, where: brand_where_cause } : Brand,
            Pos
        ],
    }
    const data = await Postaglabel.findAndCountAll(query_builder_options)

    let data_list = [];
    for (const data_item of data.rows) {
        let push_item = { ...data_item.dataValues };
        data_list.push(push_item);
    }

    let total_count = data_list.length;
    if (!is_download_excel) {
        data_list = data_list.slice(page_limit * (page_num - 1), page_limit * page_num);
    }
    return {
        data: data_list,
        total_count,
    }
}

const get_data_item = async function (labelId) {
    const data = await Postaglabel.findOne({
        where: { id: labelId },
        include: [
            Brand,
            Pos
        ]
    })
    if (data) {
        return data.dataValues;
    }
    return null;
}

module.exports = {

    getfilterlist: async function (req, res) {
        const { column, filterValue, isFullText } = req.query;
        let data_list = [];
        if (filterValue !== undefined) {
            if (column === 'name' || column === 'description') {
                let where_cause = {};
                where_cause[column] = { [Op.like]: "%" + filterValue + "%" };
                let order_cause = [];
                order_cause = ["name", "ASC"];
                const data = await Postaglabel.findAll({
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
                        (Object.keys(brand_where_cause).length > 0) ? { model: Brand, where: brand_where_cause } : { model: Brand },
                    ]
                }
                const data = await Postaglabel.findAll(query_builder_options)
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
            else if (column === 'selectablebrands') {
                let brand_where_cause = {};
                if (filterValue && filterValue !== '' && filterValue !== 'null') {
                    brand_where_cause['name'] = { [Op.like]: "%" + filterValue + "%" };
                }
                let query_builder_options = {
                    where: brand_where_cause,
                    order: [["name", "ASC"]]
                }
                data_list = await Brand.findAll(query_builder_options)
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
        try {
            const poses = await get_data(req.query);
            return res.json({
                data: poses.data,
                total: poses.total_count,
            })
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    getitem: async function (req, res) {
        const { labelId } = req.params
        data = await get_data_item(labelId);
        return res.status(200).json({ data })
    },

    upsert: async function (req, res) {
        const { body, params: { id } } = req;
        console.log(id, body);
        let data = null;
        if (id) {
            data = await Postaglabel.update(body, { where: { id } })
        } else {
            data = await Postaglabel.create(body)
        }
        return res.status(200).json()
    },

    delete: async function (req, res) {
        const { id } = req.params
        await Postaglabel.destroy({ where: { id } })
        return res.status(200).send()
    },

    copydata: async function (req, res) {
        const { body, params: { oldId } } = req
        console.log(oldId);
        let old_data = await Postaglabel.findOne({
            where: { id: oldId },
            include: [
                Pos, Brand
            ]
        });
        if (old_data !== null) {
            old_data = old_data.dataValues;
            console.log(old_data);
            const {
                pos,
                brand,
                id,
                createdAt,
                updatedAt,
                name,
                ...rest
            } = old_data;
            let new_data = { ...rest, name: name + ' copy' };
            console.log(new_data);
            const data = await Postaglabel.create(new_data);
            if (data) {
                const newlabelId = data.id;
                for (const pos_item of pos) {
                    let push_item = {
                        labelId: newlabelId,
                        posId: pos_item.id,
                    }
                    await Postags.create(push_item);
                }
                return res.status(200).json({ data })
            }
        }
        return res.status(200).json({ success: false })
    },

    downloadexcelposes: async function (req, res) {
        try {
            let labelItem = await get_data_item(req.params.labelId);
            console.log(labelItem);
            let pos_list = [];
            if (labelItem) {
                pos_list = labelItem.pos;
            }
            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("data");
            worksheet.columns = [
                { header: "IdPOS", key: "id" },
                { header: "Name", key: "name" },
                { header: "Status", key: "status" },
            ];
            worksheet.addRows(pos_list);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=" + "data.xlsx"
            );
            return workbook.xlsx.write(res).then(() => res.status(200).send());
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    uploadexcelIdposperlabel: async function (req, res) {
        try {
            const { labelId } = req.params;
            console.log(req.file);
            if (req.file === undefined) {
                res.status(400).send("Please upload an excel file!");
            }
            let path = __basedir + "/resources/uploadstmp/";
            readXlsxFile(path + req.file.filename).then(async (rows) => {
                fs.unlink(path + req.file.filename, (err) => {
                    if (err) throw err;
                });
                let titles = rows[0];
                let original_titles = rows[0];
                titles = titles.map(title => {
                    return title.replaceAll(" ", "").toLowerCase();
                })
                // check the excel file's format (column list)
                let is_valid_excel_file = true;
                let filtered_id = titles.filter(title => "idpos" === title);
                let filtered_name = titles.filter(title => "name" === title);
                if (filtered_id.length === 0 && filtered_name.length === 0) {
                    is_valid_excel_file = false;
                }
                if (!is_valid_excel_file) {
                    return res.json({
                        success: false,
                        invalidFile: false,
                        message: "The uploaded file is invalid. Please check the column list. Their columns' name should be IdPOS or Name"
                    });
                }

                rows.shift();
                let count = 0;
                const failedRows = [];
                await Postags.destroy({ where: { labelId } });
                for (const row of rows) {
                    let data_detail = {
                        labelId,
                        posId: row[titles.indexOf("idpos")],
                        name: row[titles.indexOf("name")],
                    }
                    let filtered_pos = null;
                    if (filtered_id.length > 0) {
                        filtered_pos = await Pos.findOne({ where: { id: data_detail.posId } });
                    } else {
                        filtered_pos = await Pos.findOne({ where: { name: data_detail.name } });
                        if (filtered_pos) {
                            data_detail['posId'] = filtered_pos.id;
                        }
                    }
                    if (!filtered_pos) {
                        failedRows.push(row);
                        continue;
                    }
                    console.log(data_detail);
                    const is_new = await Postags.create(data_detail)
                    if (is_new) {
                        count++;
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

}
