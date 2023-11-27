const { Product, Family, Brand, Sequelize, sequelize, Static, Products_sub_brands, Pro_sub_brands, Products_sub_families, Pro_sub_families, SubBrands } = require('../sequelize')
const { QueryTypes, where } = require('sequelize');
const HttpStatus = require("http-status-codes");
const excel = require("exceljs");
const readXlsxFile = require("read-excel-file/node");
const moment = require("moment");
const fs = require("fs");
const { title } = require('process');
const { sample, filter } = require('lodash');
const Op = Sequelize.Op;
const Fn = Sequelize.fn;
const expensesUtils = require('../services/expenses.utils');

const create_update_sub_brands = async (pro_id, sub_brands_treeData, parent_brand_id, tree_path) => {
    const sub_brands_map_fn = async (brand_item) => {
        const filtered_brand = await Brand.findOne({ where: { name: brand_item.text } });
        if (filtered_brand) {
            let current_brand_id = filtered_brand.id;
            let new_tree_path = tree_path + current_brand_id + ',';
            await Products_sub_brands.create({
                pro_id,
                brand_id: current_brand_id,
                parent_brand_id,
                tree_path: new_tree_path
            })
            if (brand_item.children && brand_item.children.length > 0) {
                await create_update_sub_brands(pro_id, brand_item.children, current_brand_id, new_tree_path);
            }
        }
    }

    for (let brand_item of sub_brands_treeData) {
        await sub_brands_map_fn(brand_item)
    }
}

const create_update_sub_families = async (pro_id, sub_families_treeData, parent_family_id, tree_path) => {
    const sub_families_map_fn = async (family_item) => {
        const filtered_family = await Family.findOne({ where: { name: family_item.text } });
        if (filtered_family) {
            let current_family_id = filtered_family.id;
            let new_tree_path = tree_path + current_family_id + ',';
            await Products_sub_families.create({
                pro_id,
                family_id: current_family_id,
                parent_family_id,
                tree_path: new_tree_path
            })
            if (family_item.children && family_item.children.length > 0) {
                await create_update_sub_families(pro_id, family_item.children, current_family_id, new_tree_path);
            }
        }
    }

    for (let family_item of sub_families_treeData) {
        await sub_families_map_fn(family_item)
    }
}

const countLeaves = (tree) => {
    console.log(tree);
    console.log(typeof tree === 'object' && !Array.isArray(tree) && tree !== null);
    if (typeof tree === 'object' && !Array.isArray(tree) && tree !== null) {
        let leafcount = 0;
        if (!tree.children || tree.children.length === 0) {
            leafcount++;
        }
        if (tree.children) {
            tree.children = tree.children.map(child => {
                let node = countLeaves(child);
                leafcount += node.leafcount;
                return node;
            })
        }
        return { ...tree, leafcount: leafcount };
    }
    else {
        tree = tree.map(tree_item => {
            return countLeaves(tree_item)
        })
        return tree;
    }
}

// const get_sub_brands_tree_data = (arr) => {
//     let res = [];
//     for (const item of arr) {
//         const parents = item.tree_path.split(",");
//         parents.pop();
//         parents.pop();
//         parents.shift();
//         let curObj = res;
//         for (const fid of parents) {
//             for (let child of curObj)
//                 if (child.brand_id == fid) {
//                     if (!child.children) child.children = [];
//                     curObj = child.children;
//                     break;
//                 }
//         }
//         curObj.push({ ...item, text: item.name });
//     }
//     res = countLeaves(res);
//     return res;
// }

// const get_sub_family_tree_data = (arr) => {
//     let res = [];
//     for (const item of arr) {
//         const parents = item.tree_path.split(",");
//         parents.pop();
//         parents.pop();
//         parents.shift();
//         let curObj = res;
//         for (const fid of parents) {
//             for (let child of curObj)
//                 if (child.family_id == fid) {
//                     if (!child.children) child.children = [];
//                     curObj = child.children;
//                     break;
//                 }
//         }
//         curObj.push({ ...item, text: item.name });
//     }
//     res = countLeaves(res);
//     return res;
// }

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
        else if (sortby === 'family') {
            order_cause = ['familyId', sortdesc === "true" ? "DESC" : "ASC"];
        }
        else {
            order_cause = [sortby, sortdesc === "true" ? "DESC" : "ASC"];
        }
    }
    else {
        order_cause = ["id", "ASC"];
    }

    let where_cause = {};
    let brand_where_cause = {};
    let family_where_cause = {};
    let buffer_values = [];
    filter.map(item => {
        if ((item.columnField === 'name' || item.columnField === 'code' || item.columnField === 'pro_ean' || item.columnField === 'description') && item.filterValue) {
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
            if (buffer_values.length > 0) where_cause.brandId = { [Op.or]: buffer_values }
        }
        if (item.columnField === 'family') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause.familyId = { [Op.or]: buffer_values }
        }

        if (item.columnField === 'units_per_fraction') {
            if (item.filterValue['from'] !== undefined && item.filterValue['to'] !== undefined && item.filterValue['from'] !== '' && item.filterValue['to'] !== '') {
                where_cause.units_per_fraction = {
                    [Op.and]: [
                        { [Op.gte]: item.filterValue['from'] },
                        { [Op.lte]: item.filterValue['to'] },
                    ]
                }
            }
            else if (item.filterValue['from'] !== undefined && item.filterValue['from'] !== '') {
                where_cause.units_per_fraction = { [Op.gte]: item.filterValue['from'] }
            } else if (item.filterValue['to'] !== undefined && item.filterValue['to'] !== '') {
                where_cause.units_per_fraction = { [Op.lte]: item.filterValue['to'] }
            }
        }
        if (item.columnField === 'units_per_box') {
            if (item.filterValue['from'] !== undefined && item.filterValue['to'] !== undefined && item.filterValue['from'] !== '' && item.filterValue['to'] !== '') {
                where_cause.units_per_box = {
                    [Op.and]: [
                        { [Op.gte]: item.filterValue['from'] },
                        { [Op.lte]: item.filterValue['to'] },
                    ]
                }
            }
            else if (item.filterValue['from'] !== undefined && item.filterValue['from'] !== '') {
                where_cause.units_per_box = { [Op.gte]: item.filterValue['from'] }
            } else if (item.filterValue['to'] !== undefined && item.filterValue['to'] !== '') {
                where_cause.units_per_box = { [Op.lte]: item.filterValue['to'] }
            }
        }
        if (item.columnField === 'vat_code') {
            where_cause.vat_code = { [Op.like]: "%" + item.filterValue + "%" };
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
        if (item.columnField === 'status') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause.status = { [Op.or]: buffer_values }
        }
        return item;
    })
    console.log(where_cause);

    let query_builder_options = {
        where: where_cause,
        order: [order_cause],
        include: [
            Static
        ]
    }
    if (Object.keys(brand_where_cause).length > 0) {
        query_builder_options.include.push({ model: Brand, where: brand_where_cause });
    }
    else {
        query_builder_options.include.push(Brand);
    }
    if (Object.keys(family_where_cause).length > 0) {
        query_builder_options.include.push({ model: Family, where: family_where_cause });
    }
    else {
        query_builder_options.include.push(Family);
    }
    if (!is_download_excel) {
        query_builder_options.offset = (parseInt(page_num) - 1) * parseInt(page_limit);
        query_builder_options.limit = parseInt(page_limit);
    }
    const data = await Product.findAndCountAll(query_builder_options)

    let product_list = [];
    for (let i = 0; i < data.rows.length; i++) {
        let product_item = data.rows[i].dataValues;

        let pro_sub_brands = await sequelize.query("SELECT pro_sub_brands.sub_brand_id AS brand_id, pro_sub_brands.pro_id, subbrands.name, subbrands.parentId FROM `pro_sub_brands` LEFT JOIN subbrands ON subbrands.id = pro_sub_brands.sub_brand_id WHERE pro_id = :pro_id ORDER BY pro_sub_brands.id ASC",
            {
                replacements: { pro_id: product_item.id },
                type: QueryTypes.SELECT
            });
        if (pro_sub_brands.length > 0) {
            pro_sub_brands = adjust_pro_sub_brands(pro_sub_brands);
            product_item = { ...product_item, pro_sub_brands: pro_sub_brands };
        }
        else {
            product_item = { ...product_item, pro_sub_brands: [] };
        }

        let sub_brand = [];
        let sub_brand2 = [];
        let sub_brand3 = [];
        if (pro_sub_brands.length > 0) {
            for (const sub_brand_item of pro_sub_brands) {
                sub_brand.push(sub_brand_item.brand_id);
                for (const sub_brand_item2 of sub_brand_item.children) {
                    sub_brand2.push(sub_brand_item2.brand_id);
                    for (const sub_brand_item3 of sub_brand_item2.children) {
                        sub_brand3.push(sub_brand_item3.brand_id);
                    }
                }
            }
        }
        product_item = { ...product_item, sub_brand };
        product_item = { ...product_item, sub_brand2 };
        product_item = { ...product_item, sub_brand3 };

        let pro_sub_families = await sequelize.query("SELECT pro_sub_families.sub_family_id AS family_id, pro_sub_families.pro_id, families.name, families.parentId FROM `pro_sub_families` LEFT JOIN families ON families.id = pro_sub_families.sub_family_id WHERE pro_id = :pro_id ORDER BY pro_sub_families.id ASC",
            {
                replacements: { pro_id: product_item.id },
                type: QueryTypes.SELECT
            });
        if (pro_sub_families.length > 0) {
            pro_sub_families = adjust_pro_sub_families(pro_sub_families);
            product_item = { ...product_item, pro_sub_families: pro_sub_families };
        }
        else {
            product_item = { ...product_item, pro_sub_families: [] };
        }

        let sub_family = [];
        let sub_family2 = [];
        let sub_family3 = [];
        if (pro_sub_families.length > 0) {
            for (const sub_family_item of pro_sub_families) {
                sub_family.push(sub_family_item.family_id);
                for (const sub_family_item2 of sub_family_item.children) {
                    sub_family2.push(sub_family_item2.family_id);
                    for (const sub_family_item3 of sub_family_item2.children) {
                        sub_family3.push(sub_family_item3.family_id);
                    }
                }
            }
        }
        product_item = { ...product_item, sub_family };
        product_item = { ...product_item, sub_family2 };
        product_item = { ...product_item, sub_family3 };
        
        product_list.push(product_item)
    }

    filter.map(item => {
        if ((item.columnField === 'sub_brand1') && item.filterValue) {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            product_list = product_list.filter(product_item => {
                let filtered_data = product_item.sub_brand.filter(item => buffer_values.includes(item));
                if (filtered_data.length > 0) return true;
                return false;
            })
        }
        if ((item.columnField === 'sub_family1') && item.filterValue) {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            product_list = product_list.filter(product_item => {
                let filtered_data = product_item.sub_family.filter(item => buffer_values.includes(item));
                if (filtered_data.length > 0) return true;
                return false;
            })
        }
        if ((item.columnField === 'sub_brand2' || item.columnField === 'sub_brand3' || item.columnField === 'sub_family2' || item.columnField === 'sub_family3') && item.filterValue) {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            product_list = product_list.filter(product_item => {
                let filtered_data = product_item[item.columnField].filter(item => buffer_values.includes(item));
                if (filtered_data.length > 0) return true;
                return false;
            })
        }
    })
    return {
        data: product_list,
        total: data.count,
    };
}

const adjust_pro_sub_brands = (data) => {
    let result = [];
    let vis = [];
    let paths = [];
    for (let item of data) vis[item.brand_id] = true;
    let new_data = [];
    for (let item of data) {
        if (!vis[item.parentId] && !paths[item.parentId]) {
            paths[item.parentId] = [result.length];
            let obj = {};
            obj.brand_id = item.parentId;
            obj.children = [];
            result.push(obj);
        }
    }
    while (data.length) {
        new_data = [];
        for (let item of data) {
            if (paths[item.parentId]) {
                let cur = result;
                for (let pos of paths[item.parentId]) {
                    cur = cur[pos].children;
                }
                cur.push({
                    ...item,
                    children: [],
                });
                paths[item.brand_id] = paths[item.parentId].slice();
                paths[item.brand_id].push(cur.length - 1);
            } else {
                new_data.push(item);
            }
        }
        data = new_data;
    }
    result = countLeaves(result);
    if (result.length > 0) {
        result = result[0].children;
    }
    return result;
};

const adjust_pro_sub_families = (data) => {
    let result = [];
    let vis = [];
    let paths = [];
    for (let item of data) vis[item.family_id] = true;
    let new_data = [];
    for (let item of data) {
        if (!vis[item.parentId] && !paths[item.parentId]) {
            paths[item.parentId] = [result.length];
            let obj = {};
            obj.family_id = item.parentId;
            obj.children = [];
            result.push(obj);
        }
    }
    while (data.length) {
        new_data = [];
        for (let item of data) {
            if (paths[item.parentId]) {
                let cur = result;
                for (let pos of paths[item.parentId]) {
                    cur = cur[pos].children;
                }
                cur.push({
                    ...item,
                    children: [],
                });
                paths[item.family_id] = paths[item.parentId].slice();
                paths[item.family_id].push(cur.length - 1);
            } else {
                new_data.push(item);
            }
        }
        data = new_data;
    }
    result = countLeaves(result);
    if (result.length > 0) {
        result = result[0].children;
    }
    return result;
};

const Self = {

    index: async function (req, res) {
        try {
            const products = await get_data(req.query);
            return res.json({
                data: products.data,
                total: products.total
            })
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },
    
    uploadexcel: async function (req, res) {
        try {
            console.log(req.file);
            if (req.file === undefined) {
                res.status(400).send("Please upload an excel file!");
            }
            let path = __basedir + "/resources/uploadstmp/";
            const sample_cols = [
                'product_name', 'id_product_brand', 'ean', 'description', 'brand', 'family', 'units_per_fraction', 'units_per_box', 'vat', 'start_date', 'end_date', 'status',
            ];
            console.log('----- starting upload excel file for updating products -----');
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
                    let product_detail = {
                        name: row[titles.indexOf("product_name")],
                        id_product_brand: row[titles.indexOf("id_product_brand")],
                        pro_ean: row[titles.indexOf("ean")],
                        description: row[titles.indexOf("description")],
                        units_per_fraction: row[titles.indexOf("units_per_fraction")],
                        units_per_box: row[titles.indexOf("units_per_box")],
                        vat_code: row[titles.indexOf("vat")],
                        start_date: row[titles.indexOf("start_date")],
                        end_date: row[titles.indexOf("end_date")],
                        status: row[titles.indexOf("status")],
                    }
                    const filtered_product = await Product.findOne({ where: { name: product_detail.name } });
                    if (filtered_product !== null) {
                        failedRows.push(row);
                        continue;
                    }
                    const filtered_brand = await Brand.findOne({ where: { name: row[titles.indexOf("brand")] } });
                    if (filtered_brand !== null) {
                        console.log('filtered_brand - ', filtered_brand.id);
                        product_detail.brandId = filtered_brand.id;
                    }
                    const filtered_family = await Family.findOne({ where: { name: row[titles.indexOf("family")] } });
                    if (filtered_family !== null) {
                        console.log('filtered_family - ', filtered_family.id);
                        product_detail.familyId = filtered_family.id;
                    }
                    if (product_detail.start_date) {
                        product_detail.start_date = moment(product_detail.start_date, "DD/MM/YYYY").toDate();
                    }
                    if (product_detail.end_date) {
                        product_detail.end_date = moment(product_detail.end_date, "DD/MM/YYYY").toDate();
                    }

                    // console.log(product_detail);
                    const is_new = await Product.create(product_detail)
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

    downloadexcel: async function (req, res) {
        try {
            let products = await get_data(req.query, true);
            product_list = products.data.map((product_detail => {
                const result = {
                    ...product_detail
                }
                result.brand_name = product_detail.brand ? product_detail.brand.name : '';
                result.family_name = product_detail.family ? product_detail.family.name : '';
                result.start_date = product_detail.start_date ? moment(moment.utc(product_detail.start_date, "H:m:s").toDate()).format("DD/MM/YYYY") : '';
                result.end_date = product_detail.end_date ? moment(moment.utc(product_detail.end_date, "H:m:s").toDate()).format("DD/MM/YYYY") : '';
                return result;
            }))
            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("Products");
            worksheet.columns = [
                { header: "ID", key: "id" },
                { header: "Product Name", key: "name" },
                { header: "ID Product Brand", key: "code" },
                { header: "EAN", key: "pro_ean" },
                { header: "Description", key: "description" },
                { header: "Brand", key: "brand_name" },
                { header: "Family", key: "family_name" },
                { header: "Units per Fraction", key: "units_per_fraction" },
                { header: "Units per Box", key: "units_per_box" },
                { header: "VAT", key: "vat_code" },
                { header: "Start Date", key: "start_date" },
                { header: "End Date", key: "end_date" },
                { header: "status", key: "status" },
            ];
            worksheet.addRows(product_list);
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

    get_brand_list: async function (req, res) {
        const { filter_name } = req.query;
        if (filter_name !== '' && filter_name !== null && filter_name !== undefined) {
            let where_cause = [];
            where_cause.push({ name: { [Op.like]: "%" + filter_name + "%" } });
            where_cause.push({ status: 'active' })

            let order_cause = [];
            order_cause = ["name", "ASC"];

            const data = await Brand.findAll({
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

    get_family_list: async function (req, res) {
        const { filter_name } = req.query;
        if (filter_name !== '' && filter_name !== null && filter_name !== undefined) {
            let where_cause = [];
            where_cause.push({ name: { [Op.like]: "%" + filter_name + "%" } });

            let order_cause = [];
            order_cause = ["name", "ASC"];

            const data = await Family.findAll({
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

    create: async function (req, res) {
        const { id, sub_brand, sub_brand2, sub_brand3, sub_family, sub_family2, sub_family3, ...rest } = req.body
        let newProduct = { ...rest };
        const data = await Product.create(newProduct)
        console.log(data);
        if (data && data.id) {
            let pro_id = data.id;
            await Pro_sub_brands.destroy({ where: { pro_id: pro_id } })
            // let whole_sub_brands = [...sub_brand, ...sub_brand2, ...sub_brand3];
            let whole_sub_brands = [sub_brand, sub_brand2, sub_brand3];
            console.log(whole_sub_brands);
            for (const item of whole_sub_brands) {
                if (!Array.isArray(item)) {
                    await Pro_sub_brands.create({
                        pro_id,
                        sub_brand_id: item,
                    })
                }
            }
            await Pro_sub_families.destroy({ where: { pro_id: pro_id } })
            // let whole_sub_families = [...sub_family, ...sub_family2, ...sub_family3];
            let whole_sub_families = [sub_family, sub_family2, sub_family3];
            console.log(whole_sub_families);
            for (const item of whole_sub_families) {
                if (!Array.isArray(item)) {
                    await Pro_sub_families.create({
                        pro_id,
                        sub_family_id: item,
                    })
                }
            }
        }
        return res.status(200).json({ data })
    },

    update: async function (req, res) {
        const { body, params: { id } } = req;
        const { sub_brand, sub_brand2, sub_brand3, sub_family, sub_family2, sub_family3, ...rest } = body
        let updateProduct = { ...rest };
        const data = await Product.update(updateProduct, { where: { id } })
        if (id) {
            let pro_id = id;
            await Pro_sub_brands.destroy({ where: { pro_id: pro_id } })
            // let whole_sub_brands = [...sub_brand, ...sub_brand2, ...sub_brand3];
            let whole_sub_brands = [sub_brand, sub_brand2, sub_brand3];
            console.log('whole_sub_brands - ', whole_sub_brands);
            for (const item of whole_sub_brands) {
                if (!Array.isArray(item)) {
                    await Pro_sub_brands.create({
                        pro_id,
                        sub_brand_id: item,
                    })
                }
            }
            await Pro_sub_families.destroy({ where: { pro_id: pro_id } })
            // let whole_sub_families = [...sub_family, ...sub_family2, ...sub_family3];
            let whole_sub_families = [sub_family, sub_family2, sub_family3];
            console.log(whole_sub_families);
            for (const item of whole_sub_families) {
                if (!Array.isArray(item)) {
                    await Pro_sub_families.create({
                        pro_id,
                        sub_family_id: item,
                    })
                }
            }
        }
        return res.status(200).json({ data })
    },

    delete: async function (req, res) {
        const { id } = req.params
        await Product.destroy({ where: { id } })
        return res.status(200).send()
    },

    getBrands: async function (req, res) {
        let { parent_ids, is_main_brand, brandId } = req.query;
        let data = [];
        let where_cause = {};
        parent_ids = parent_ids.split(',');
        console.log(parent_ids);
        if (parent_ids.length > 0 && parent_ids[0] !== '') {
            let buffer_values = [];
            parent_ids.map(parent_id => {
                if (parent_id > 0) {
                    buffer_values.push(parent_id);
                }
                else {
                    buffer_values.push(null);
                }
                return parent_id;
            })
            console.log(buffer_values);
            if (buffer_values.length === 1 && buffer_values[0] === null) {
                where_cause['parentId'] = { [Op.is]: buffer_values[0] };
            }
            else if (buffer_values.length === 1 && buffer_values[0] !== null) {
                where_cause['parentId'] = buffer_values[0];
            }
            else if (buffer_values.length > 1) where_cause['parentId'] = { [Op.or]: buffer_values }
            if (brandId !== undefined) {
                where_cause['brandId'] = brandId;
            }
            console.log(where_cause);

            let order_cause = [];
            order_cause = ["name", "ASC"];

            if (is_main_brand !== undefined) {
                data = await Brand.findAll({
                    where: where_cause,
                    order: [order_cause],
                })
            }
            else {
                data = await SubBrands.findAll({
                    where: where_cause,
                    order: [order_cause],
                })
            }
        }

        return res.json({
            data: data,
        })
    },

    getfamilies: async function (req, res) {
        let { parent_ids, brandId } = req.query;
        console.log(parent_ids, brandId);
        let data = [];
        let where_cause = {};
        parent_ids = parent_ids.split(',');
        console.log(parent_ids);
        if (parent_ids.length > 0 && parent_ids[0] !== '') {
            let buffer_values = [];
            parent_ids.map(parent_id => {
                if (parent_id > 0) {
                    buffer_values.push(parent_id);
                }
                else {
                    buffer_values.push(null);
                }
                return parent_id;
            })
            console.log(buffer_values);
            if (buffer_values.length === 1 && buffer_values[0] === null) {
                where_cause['parentId'] = { [Op.is]: buffer_values[0] };
            }
            else if (buffer_values.length === 1 && buffer_values[0] !== null) {
                where_cause['parentId'] = buffer_values[0];
            }
            else if (buffer_values.length > 1) where_cause['parentId'] = { [Op.or]: buffer_values }
            if (brandId !== undefined) {
                where_cause['brandId'] = brandId;
            }
            console.log(where_cause);

            let order_cause = [];
            order_cause = ["name", "ASC"];

            data = await Family.findAll({
                where: where_cause,
                order: [order_cause],
            })
        }

        return res.json({
            data: data,
        })
    },

    getfilterlist: async function (req, res) {
        const { column, filterValue, isFullText } = req.query;
        let data_list = [];
        if (filterValue !== undefined) {
            if (column === 'name' || column === 'code' || column === 'pro_ean' || column === 'description') {
                let where_cause = {};
                where_cause[column] = { [Op.like]: "%" + filterValue + "%" };
                let order_cause = [];
                order_cause = ["name", "ASC"];
                const data = await Product.findAll({
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
                const data = await Product.findAll(query_builder_options)
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
            else if (column === 'family') {
                let family_where_cause = {};
                family_where_cause['name'] = { [Op.like]: "%" + filterValue + "%" };
                let query_builder_options = {
                    include: [
                        (Object.keys(family_where_cause).length > 0) ? { model: Family, where: family_where_cause } : Family,
                    ]
                }
                const data = await Product.findAll(query_builder_options)
                for (const item of data) {
                    let push_item = { ...item.dataValues };
                    push_item['id'] = push_item.familyId;
                    push_item['title'] = push_item.family.name;
                    let filtered_data = data_list.filter(data_item => data_item.familyId === push_item.familyId);
                    if (filtered_data.length === 0) {
                        data_list.push(push_item);
                    }
                }
            }
            else if (column === 'sub_brand1') {
                let where_cause = {};
                where_cause['name'] = { [Op.like]: "%" + filterValue + "%" };
                where_cause['parentId'] = { [Op.is]: null };
                let order_cause = [];
                order_cause = ["name", "ASC"];
                const data = await SubBrands.findAll({
                    where: where_cause,
                    order: [order_cause],
                })
                for (const item of data) {
                    let push_item = { ...item.dataValues };
                    push_item['id'] = push_item.id;
                    push_item['title'] = push_item.name;
                    data_list.push(push_item);
                }
            }
            else if (column === 'sub_brand2') {
                let where_cause = {};
                where_cause['parentId'] = { [Op.is]: null };
                const data = await SubBrands.findAll({
                    where: where_cause,
                })
                let parentIds = [];
                for (const level_one of data) {
                    parentIds.push(level_one.id);
                }
                where_cause = {};
                where_cause['parentId'] = { [Op.or]: parentIds };
                where_cause['name'] = { [Op.like]: "%" + filterValue + "%" };
                const data_level2 = await SubBrands.findAll({
                    where: where_cause,
                })
                for (const item of data_level2) {
                    let push_item = { ...item.dataValues };
                    push_item['id'] = push_item.id;
                    push_item['title'] = push_item.name;
                    data_list.push(push_item);
                }
            }
            else if (column === 'sub_brand3') {
                let where_cause = {};
                where_cause['parentId'] = { [Op.is]: null };
                const data = await SubBrands.findAll({
                    where: where_cause,
                })
                let parentIds = [];
                for (const level_one of data) {
                    parentIds.push(level_one.id);
                }
                where_cause = {};
                where_cause['parentId'] = { [Op.or]: parentIds };
                const data_level2 = await SubBrands.findAll({
                    where: where_cause,
                })
                parentIds = [];
                for (const level_two of data_level2) {
                    parentIds.push(level_two.id);
                }
                console.log(parentIds);
                where_cause = {};
                where_cause['parentId'] = { [Op.or]: parentIds };
                where_cause['name'] = { [Op.like]: "%" + filterValue + "%" };
                const data_level3 = await SubBrands.findAll({
                    where: where_cause,
                })
                for (const level_three of data_level3) {
                    let push_item = { ...level_three.dataValues };
                    push_item['id'] = push_item.id;
                    push_item['title'] = push_item.name;
                    data_list.push(push_item);
                }
            }
            else if (column === 'sub_family1') {
                let where_cause = {};
                where_cause['parentId'] = { [Op.is]: null };
                const data = await Family.findAll({
                    where: where_cause,
                })
                let parentIds = [];
                for (const level_one of data) {
                    parentIds.push(level_one.id);
                }
                where_cause = {};
                where_cause['parentId'] = { [Op.or]: parentIds };
                where_cause['name'] = { [Op.like]: "%" + filterValue + "%" };
                const data_level2 = await Family.findAll({
                    where: where_cause,
                })
                for (const item of data_level2) {
                    let push_item = { ...item.dataValues };
                    push_item['id'] = push_item.id;
                    push_item['title'] = push_item.name;
                    data_list.push(push_item);
                }
            }
            else if (column === 'sub_family2') {
                let where_cause = {};
                where_cause['parentId'] = { [Op.is]: null };
                const data = await Family.findAll({
                    where: where_cause,
                })
                let parentIds = [];
                for (const level_one of data) {
                    parentIds.push(level_one.id);
                }
                where_cause = {};
                where_cause['parentId'] = { [Op.or]: parentIds };
                const data_level2 = await Family.findAll({
                    where: where_cause,
                })
                parentIds = [];
                for (const level_two of data_level2) {
                    parentIds.push(level_two.id);
                }
                console.log(parentIds);
                where_cause = {};
                where_cause['parentId'] = { [Op.or]: parentIds };
                where_cause['name'] = { [Op.like]: "%" + filterValue + "%" };
                const data_level3 = await Family.findAll({
                    where: where_cause,
                })
                for (const level_three of data_level3) {
                    let push_item = { ...level_three.dataValues };
                    push_item['id'] = push_item.id;
                    push_item['title'] = push_item.name;
                    data_list.push(push_item);
                }
            }
            else if (column === 'sub_family3') {
                let where_cause = {};
                where_cause['parentId'] = { [Op.is]: null };
                const data = await Family.findAll({
                    where: where_cause,
                })
                let parentIds = [];
                for (const level_one of data) {
                    parentIds.push(level_one.id);
                }
                where_cause = {};
                where_cause['parentId'] = { [Op.or]: parentIds };
                const data_level2 = await Family.findAll({
                    where: where_cause,
                })
                parentIds = [];
                for (const level_two of data_level2) {
                    parentIds.push(level_two.id);
                }
                where_cause = {};
                where_cause['parentId'] = { [Op.or]: parentIds };
                const data_level3 = await Family.findAll({
                    where: where_cause,
                })
                parentIds = [];
                for (const level_three of data_level3) {
                    parentIds.push(level_three.id);
                }
                console.log(parentIds);
                where_cause = {};
                where_cause['parentId'] = { [Op.or]: parentIds };
                where_cause['name'] = { [Op.like]: "%" + filterValue + "%" };
                const data_level4 = await Family.findAll({
                    where: where_cause,
                })
                for (const level_four of data_level4) {
                    let push_item = { ...level_four.dataValues };
                    push_item['id'] = push_item.id;
                    push_item['title'] = push_item.name;
                    data_list.push(push_item);
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
