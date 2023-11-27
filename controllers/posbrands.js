const { Pos, Postaglabel, Postags, Brand, Posbrands } = require('../sequelize')
const Sequelize = require("sequelize");
var _ = require('lodash');
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
        }
        else if (sortby === 'pos') {
            order_cause = ['po', 'name', sortdesc === "true" ? "DESC" : "ASC"];
        }
        else {
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
            if (buffer_values.length > 0) where_cause['brandId'] = { [Op.or]: buffer_values }
        }
        if (item.columnField === 'pos') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause['posId'] = { [Op.or]: buffer_values }
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
    const data = await Posbrands.findAndCountAll(query_builder_options)

    let data_list = [];
    for (const data_item of data.rows) {
        let push_item = { ...data_item.dataValues };
        console.log(push_item.id);
        push_item['idposbrand'] = push_item.po.id + "" + push_item.brand.id;
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

module.exports = {

    getfilterlist: async function (req, res) {
        const { column, filterValue, isFullText } = req.query;
        let data_list = [];
        if (filterValue !== undefined) {
            if (column === 'pos') {
                let pos_where_cause = {};
                pos_where_cause['name'] = { [Op.like]: "%" + filterValue + "%" };
                let order_cause = [];
                order_cause = ["name", "ASC"];
                const data = await Posbrands.findAll({
                    include: [
                        (Object.keys(pos_where_cause).length > 0) ? { model: Pos, where: pos_where_cause } : { model: Pos },
                    ]
                })
                for (const item of data) {
                    let push_item = {
                        id: item.dataValues.posId,
                        title: item.dataValues.po.name,
                    }
                    let filtered_data = data_list.filter(data_item => data_item.id === push_item.id);
                    if (filtered_data.length === 0) {
                        data_list.push(push_item);
                    }
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
                const data = await Posbrands.findAll(query_builder_options)
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

    delete: async function (req, res) {
        const { id } = req.params
        await Posbrands.destroy({ where: { id } })
        return res.status(200).send()
    },

    downloadexcel: async function (req, res) {
        try {
            let data_list = await get_data(req.query, true);
            data_list = data_list.data.map((data_detail => {
                const result = {
                    ...data_detail
                }
                result.posname = data_detail.po !== null ? data_detail.po.name : '';
                result.brandname = data_detail.brand !== null ? data_detail.brand.name : '';
                return result;
            }))
            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("data");
            worksheet.columns = [
                { header: "Id POS", key: "posId" },
                { header: "POS NAME", key: "posname" },
                { header: "Id Brand", key: "brandId" },
                { header: "BRAND NAME", key: "brandname" },
                { header: "IDPOSBRAND", key: "idposbrand" },
            ];
            worksheet.addRows(data_list);
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

    uploadexcel: async function (req, res) {
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
                let filtered_name = titles.filter(title => "posname" === title);
                if (filtered_id.length === 0 && filtered_name.length === 0) {
                    is_valid_excel_file = false;
                }
                if (!is_valid_excel_file) {
                    return res.json({
                        success: false,
                        invalidFile: false,
                        message: "The uploaded file is invalid. Please check the column list. Their columns' name should be Id POS, Id Brand or Pos Name, Brand Name"
                    });
                }

                rows.shift();
                let count = 0;
                const failedRows = [];
                for (const row of rows) {
                    let data_detail = {
                        posId: row[titles.indexOf("idpos")],
                        posname: row[titles.indexOf("posname")],
                        brandId: row[titles.indexOf("idbrand")],
                        brandname: row[titles.indexOf("brandname")],
                    }
                    let filtered_pos = null;
                    let filtered_brand = null;
                    if (filtered_id.length > 0) {
                        filtered_pos = await Pos.findOne({ where: { id: data_detail.posId } });
                        filtered_brand = await Brand.findOne({ where: { id: data_detail.brandId } });
                    } else {
                        filtered_pos = await Pos.findOne({ where: { name: data_detail.posname } });
                        if (filtered_pos) {
                            data_detail['posId'] = filtered_pos.id;
                        }
                        filtered_brand = await Brand.findOne({ where: { name: data_detail.brandname } });
                        if (filtered_brand) {
                            data_detail['brandId'] = filtered_brand.id;
                        }
                    }
                    if (!filtered_pos || !filtered_brand) {
                        failedRows.push(row);
                        continue;
                    }
                    const filtered_current_data = await Posbrands.findOne({
                        where: {
                            posId: data_detail.posId,
                            brandId: data_detail.brandId
                        }
                    })
                    console.log(filtered_current_data);
                    if (!filtered_current_data) {
                        const is_new = await Posbrands.create(data_detail)
                        if (is_new) {
                            count++;
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

}
