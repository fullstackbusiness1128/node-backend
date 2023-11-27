const { Pos, Brand, SubBrands, BrandOnePage, BrandOnepagePos, Static, Sequelize } = require('../sequelize')
const Op = Sequelize.Op;
const Fn = Sequelize.fn;
const excel = require("exceljs");
const readXlsxFile = require("read-excel-file/node");
const fs = require("fs");
const expensesUtils = require('../services/expenses.utils');
var _ = require("lodash");
const staticController = require('./static');

const get_data = async (req, is_download_excel) => {
    const { page, itemsPerPage, sortby, sortdesc, filterModel, isteam } = req.query;
    let page_num = page === undefined ? 1 : page;
    let page_limit = itemsPerPage === undefined ? 10 : itemsPerPage;
    let filter = filterModel === undefined ? [] : JSON.parse(filterModel);

    let order_cause = ["brandId", "ASC"];
    if (sortby !== undefined) {
        switch (sortby) {
            case 'brand':
                order_cause = ['brand', 'name', sortdesc === "true" ? "DESC" : "ASC"];
                break;
            default:
                order_cause = [sortby, sortdesc === "true" ? "DESC" : "ASC"];
                break;
        }
    }

    let where_cause = {};
    let buffer_values = [];
    filter.map(item => {
        if (item.columnField === 'brand') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause['brandId'] = { [Op.or]: buffer_values }
        }
        if (item.columnField === 'description') {
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
        // range search - from to
        if (item.columnField === 'startDate' || item.columnField === 'endDate') {
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

        return item;
    })

    let query_builder_options = {
        where: where_cause,
        order: [order_cause],
        include: [
            Brand,
            {
                model: Static,
                as: "onepagePdfFile"
            },
            { model: BrandOnepagePos, include: [Pos] },
        ],
    }
    const data = await BrandOnePage.findAndCountAll(query_builder_options)

    let data_list = [];
    for (let i = 0; i < data.rows.length; i++) {
        let item = data.rows[i].dataValues;
        data_list.push(item)
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

const get_data_item = async function (dataId) {
    const data = await BrandOnePage.findOne({
        where: { id: dataId },
        include: [
            Brand,
            {
                model: Static,
                as: "onepagePdfFile"
            },
            { model: BrandOnepagePos, include: [Pos] },
        ]
    })
    if (data) {
        return data.dataValues;
    }
    return null;
}

const Self = {

    index: async function (req, res) {
        const fetch_data = await get_data(req);
        return res.json({
            data: fetch_data.data,
            total: fetch_data.total,
        })
    },

    upsert: async function (req, res) {
        const { body } = req;
        const { id } = req.params;
        let data = null;
        if (body) {
            // let filtered_data = await BrandOnePage.findOne({ where: { brandId: body.brandId } });
            // let dataId = id;
            // if (filtered_data) {
            //     dataId = filtered_data.id;
            // }
            // console.log(dataId);
            if (id) {
                // let updatedata = _.omit(body, ["id"]);
                data = await BrandOnePage.update(body, { where: { id: id } });
            } else {
                data = await BrandOnePage.create(body);
            }
        }
        return res.status(200).json({ data })
    },

    getfilterlist: async function (req, res) {
        const { column, filterValue, isFullText } = req.query;
        let data_list = [];
        if (filterValue !== undefined) {
            if (column === 'description') {
                let where_cause = {};
                where_cause[column] = { [Op.like]: "%" + filterValue + "%" };
                let order_cause = [];
                order_cause = [column, "ASC"];
                const data = await BrandOnePage.findAll({
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
                const data = await BrandOnePage.findAll(query_builder_options)
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

    delete: async function (req, res) {
        const { id } = req.params
        let filtered_data = await BrandOnePage.findOne({ where: { id } });
        if (filtered_data) {
            let staticId = filtered_data.pdfFile;
            if (staticId) {
                await staticController.deleteFile(staticId);
            }
            await BrandOnePage.destroy({ where: { id } })
        }
        return res.status(200).send()
    },

    copydata: async function (req, res) {
        let retVal = {
            success: false,
            message: "Failed !",
            data: null,
        }

        const { id } = req.params;
        const { brandIds } = req.body;
        if (id && brandIds) {
            console.log(id, brandIds);
            let filtered_data = await BrandOnePage.findOne({
                where: { id },
                include: [
                    BrandOnepagePos
                ]
            });
            if (filtered_data) {
                console.log(filtered_data);
                let copydata = filtered_data.dataValues;
                let brandOnePageData = _.omit(copydata, ["id", "brandId", "brand_onepage_pos"]);
                let pos_data = copydata["brand_onepage_pos"];
                if (pos_data.length > 0) {
                    pos_data = pos_data.map(el => el.dataValues.posId);
                }
                console.log(brandOnePageData);
                console.log(pos_data);
                retVal.success = true;
                retVal.message = "Success !";
                for (const newBrandId of brandIds) {
                    let search = await BrandOnePage.count({
                        where: { brandId: newBrandId }
                    })
                    if (search === 0) {
                        let createData = {
                            brandId: newBrandId,
                            ...brandOnePageData
                        }
                        console.log('createdata - ', createData);
                        let inserted = await BrandOnePage.create(createData);
                        if (inserted) {
                            for (const posId of pos_data) {
                                await BrandOnepagePos.create({
                                    brandOnePageId: inserted.id,
                                    posId,
                                })
                            }
                        }
                    }
                }
            }
        }

        return res.json(retVal);
    },

    downloadexcelposes: async function (req, res) {
        let dataItem = await get_data_item(req.params.dataId);
        console.log(dataItem);
        let pos_list = [];
        if (dataItem && dataItem.brand_onepage_pos && dataItem.brand_onepage_pos.length > 0) {
            pos_list = dataItem.brand_onepage_pos.map((el) => {
              return { id: el.posId, name: el.po.name, status: el.status };
            });
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
    },
    
    uploadexcelIdposperbrand: async function (req, res) {
        try {
            const { brandOnePageId } = req.params;
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
                await BrandOnepagePos.destroy({ where: { brandOnePageId } });
                for (const row of rows) {
                    let data_detail = {
                        brandOnePageId,
                        posId: row[titles.indexOf("idpos")],
                        name: row[titles.indexOf("name")],
                        status: row[titles.indexOf("status")],
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
                    const is_new = await BrandOnepagePos.create(data_detail)
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

module.exports = Self
