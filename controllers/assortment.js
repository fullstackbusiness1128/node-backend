const { Product, Brand, Operator, Assortment, AssortmentPos, AssortmentProduct, Pos, Sequelize, sequelize } = require('../sequelize')
const HttpStatus = require("http-status-codes");
const excel = require("exceljs");
const readXlsxFile = require("read-excel-file/node");
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
            order_cause = ['brand_id', sortdesc === "true" ? "DESC" : "ASC"];
        }
        else if (sortby === 'operator') {
            order_cause = ['operator_id', sortdesc === "true" ? "DESC" : "ASC"];
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
    // let product_where_cause = {};
    let operator_where_cause = {};
    let buffer_values = [];
    filter.map(item => {
        if (item.columnField === 'brand') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause['brand_id'] = { [Op.or]: buffer_values }
        }
        // if (item.columnField === 'product') {
        //     product_where_cause.name = { [Op.like]: "%" + item.filterValue + "%" };
        // }
        if (item.columnField === 'operator') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause['operator_id'] = { [Op.or]: buffer_values }
        }
        if ((item.columnField === 'name') && item.filterValue) {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause['id'] = { [Op.or]: buffer_values }
        }

        // string search
        if ((item.columnField === 'id_product_operator') && item.filterValue) {
            where_cause[item.columnField] = { [Op.like]: "%" + item.filterValue + "%" };
        }

        // checkbox search
        if (item.columnField === 'status' || item.columnField === 'returns_accepted' || item.columnField === 'priority_1' || item.columnField === 'priority_2' || item.columnField === 'novelty') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause[item.columnField] = { [Op.or]: buffer_values }
        }

        // range search - from to
        if (item.columnField === 'unit_price_without_vat' || item.columnField === 'returns_max' || item.columnField === 'priority_label') {
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
    console.log(where_cause);

    let query_builder_options = {
        where: where_cause,
        order: [order_cause],
        include: [
            (Object.keys(brand_where_cause).length > 0) ? { model: Brand, where: brand_where_cause } : Brand,
            // (Object.keys(product_where_cause).length > 0) ? { model: Product, where: product_where_cause } : Product,
            Product,
            (Object.keys(operator_where_cause).length > 0) ? { model: Operator, where: operator_where_cause } : Operator,
            {
                model: AssortmentPos,
                include: [
                    { model: Pos, as: 'Pos' }
                ]
            },
        ]
    }

    // if (!is_download_excel) {
    //     query_builder_options.offset = (parseInt(page_num) - 1) * parseInt(page_limit);
    //     query_builder_options.limit = parseInt(page_limit);
    // }
    const data = await Assortment.findAndCountAll(query_builder_options)

    let assortment_list = [];
    for (let i = 0; i < data.rows.length; i++) {
        let item = data.rows[i].dataValues;
        assortment_list.push(item)
    }
    filter.map(item => {
        if (item.columnField === 'product') {
            assortment_list = assortment_list.filter(data_item => {
                let filtered_data = data_item['products'].filter(selected_item => {
                    if (selected_item.dataValues.name.toLowerCase().includes(item.filterValue.toLowerCase())) {
                        return true;
                    }
                })
                console.log(filtered_data.length);
                if (filtered_data.length > 0) {
                    return true;
                }
            })
        }
    })
    let total_count = assortment_list.length;
    if (!is_download_excel) {
        assortment_list = assortment_list.slice(page_limit * (page_num - 1), page_limit * page_num);
    }
    return {
        data: assortment_list,
        total: total_count
    };
}

const Self = {

    index: async function (req, res) {
        try {
            const assortments = await get_data(req.query);
            return res.json({
                data: assortments.data,
                total: assortments.total
            })
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    getitem: async function (req, res) {
        const { assortmentId } = req.params;
        console.log(assortmentId);
        try {
            const data = await Assortment.findOne({
                where: { id: assortmentId },
                include: [
                    Brand,
                    Product,
                    Operator,
                    {
                        model: AssortmentPos,
                        include: [
                            { model: Pos, as: 'Pos' }
                        ]
                    },
                ]
            })
            console.log(data);
            return res.json({ data })
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    downloadexcel: async function (req, res) {
        try {
            let assortments = await get_data(req.query, true);
            let assortment_list = assortments.data.map((detail => {
                const result = {
                    ...detail
                }
                result.brand_name = detail.brand ? detail.brand.name : '';
                result.product_name = detail.product ? detail.product.name : '';
                result.operator_name = detail.operator ? detail.operator.name : '';
                return result;
            }))
            console.log(assortment_list);
            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("assortments");
            worksheet.columns = [
                { header: "ID", key: "id" },
                { header: "Name", key: "name" },
                // { header: "ID Brand", key: "brand_id" },
                { header: "Brand Name", key: "brand_name" },
                // { header: "ID Product", key: "product_id" },
                // { header: "Product Name", key: "product_name" },
                // { header: "ID Operator", key: "operator_id" },
                { header: "Operator Name", key: "operator_name" },
                // { header: "Status", key: "status" },
                // { header: "ID Product Operator", key: "id_product_operator" },
                // { header: "Unit price without VAT", key: "unit_price_without_vat" },
                // { header: "Returns Accepted", key: "returns_accepted" },
                // { header: "Returns Max", key: "returns_max" },
                // { header: "Priority Label", key: "priority_label" },
                // { header: "Priority 1", key: "priority_1" },
                // { header: "Priority 2", key: "priority_2" },
                // { header: "Novelty", key: "novelty" },
            ];
            worksheet.addRows(assortment_list);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=" + "assortments.xlsx"
            );
            return workbook.xlsx.write(res).then(() => res.status(200).send());
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    downloadexcel_idposperassortments: async function (req, res) {
        const { assortmentId } = req.params;
        console.log(assortmentId);
        try {
            const data = await AssortmentPos.findAll({
                where: { assortmentId },
                include: [
                    Assortment,
                    { model: Pos, as: "Pos" }
                ]
            });
            let data_list = data.map((detail => {
                const result = {
                    ...detail.dataValues
                }
                result.assortment_name = result.assortment ? result.assortment.dataValues.name : '';
                result.pos_name = result.Pos ? result.Pos.dataValues.name : '';
                result.status = result.Pos ? result.Pos.dataValues.status : '';
                return result;
            }))
            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("pos_per_assortments");
            worksheet.columns = [
                { header: "ID Assortment", key: "assortmentId" },
                { header: "Assortment Name", key: "assortment_name" },
                { header: "ID POS", key: "posId" },
                { header: "POS Name", key: "pos_name" },
                { header: "Status", key: "status" },
            ];
            worksheet.addRows(data_list);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=" + "assortments.xlsx"
            );
            return workbook.xlsx.write(res).then(() => res.status(200).send());
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    downloadexcel_idproductperassortments: async function (req, res) {
        const { assortmentId } = req.params;
        console.log(assortmentId);
        try {
            const data = await Assortment.findOne({
                where: { id: assortmentId },
                include: [
                    Product,
                ]
            });
            let data_list = data.products.map((detail => {
                const result = {
                    ...detail.dataValues
                }
                result['id_product_operator'] = data.dataValues['id_product_operator'];
                result['unit_price_without_vat'] = data.dataValues['unit_price_without_vat'];
                result['returns_accepted'] = data.dataValues['returns_accepted'];
                result['returns_max'] = data.dataValues['returns_max'];
                result['priority_label'] = data.dataValues['priority_label'];
                result['priority_1'] = data.dataValues['priority_1'];
                result['priority_2'] = data.dataValues['priority_2'];
                result['novelty'] = data.dataValues['novelty'];
                result.assortmentId = data.dataValues.id;
                result.assortment_name = data.dataValues.name;
                return result;
            }))
            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("pos_per_assortments");
            worksheet.columns = [
                { header: "ID Assortment", key: "assortmentId" },
                { header: "Assortment Name", key: "assortment_name" },
                { header: "ID Product", key: "id" },
                { header: "Product Name", key: "name" },
                { header: "Status", key: "status" },
                { header: "ID Product Operator", key: "id_product_operator" },
                { header: "Unit price without VAT", key: "unit_price_without_vat" },
                { header: "Returns Accepted", key: "returns_accepted" },
                { header: "Returns Max", key: "returns_max" },
                { header: "Priority Label", key: "priority_label" },
                { header: "Priority 1", key: "priority_1" },
                { header: "Priority 2", key: "priority_2" },
                { header: "Novelty", key: "novelty" },
            ];
            worksheet.addRows(data_list);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=" + "assortments.xlsx"
            );
            return workbook.xlsx.write(res).then(() => res.status(200).send());
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
                'name',
                'brand_name',
                // 'product_name',
                'operator_name',
                // 'status',
                // 'id_product_operator',
                // 'unit_price_without_vat',
                // 'returns_accepted',
                // 'returns_max',
                // 'priority_label',
                // 'priority_1',
                // 'priority_2',
                // 'novelty',
            ];
            console.log('----- starting upload excel file for updating assortments -----');
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
                        message: "The uploaded file is invalid. Please check the column list. Required Columns - name,brand name,operator name"
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
                    console.log(row_validation);
                    let assortment_detail = {
                        name: row[titles.indexOf("name")],
                        // brand_name: row[titles.indexOf("brand_name")],
                        // product_name: row[titles.indexOf("product_name")],
                        // operator_name: row[titles.indexOf("operator_name")],
                        // status: row[titles.indexOf("status")],
                        // id_product_operator: row[titles.indexOf("id_product_operator")],
                        // unit_price_without_vat: row[titles.indexOf("unit_price_without_vat")],
                        // returns_accepted: row[titles.indexOf("returns_accepted")],
                        // returns_max: row[titles.indexOf("returns_max")],
                        // priority_label: row[titles.indexOf("priority_label")],
                        // priority_1: row[titles.indexOf("priority_1")],
                        // priority_2: row[titles.indexOf("priority_2")],
                        // novelty: row[titles.indexOf("novelty")],
                    }
                    const filtered_assortment = await Assortment.findOne({ where: { name: assortment_detail.name } });
                    if (filtered_assortment !== null) {
                        failedRows.push(row);
                        continue;
                    }

                    const filtered_brand = await Brand.findOne({ where: { name: row[titles.indexOf("brand_name")] } });
                    if (filtered_brand !== null) {
                        console.log('filtered_brand - ', filtered_brand.id);
                        assortment_detail.brand_id = filtered_brand.id;
                    }
                    // const filtered_product = await Product.findOne({ where: { name: row[titles.indexOf("product_name")] } });
                    // if (filtered_product !== null) {
                    //     console.log('filtered_product - ', filtered_product.id);
                    //     assortment_detail.product_id = filtered_product.id;
                    // }
                    const filtered_operator = await Operator.findOne({ where: { name: row[titles.indexOf("operator_name")] } });
                    if (filtered_operator !== null) {
                        console.log('filtered_operator - ', filtered_operator.id);
                        assortment_detail.operator_id = filtered_operator.id;
                    }

                    // if (assortment_detail.brand_id === undefined || assortment_detail.product_id === undefined || assortment_detail.operator_id === undefined) {
                    if (assortment_detail.brand_id === undefined || assortment_detail.operator_id === undefined) {
                        failedRows.push(row);
                        continue;
                    }

                    let insert_status = await Assortment.findOne({
                        where: {
                            brand_id: assortment_detail.brand_id,
                            // product_id: assortment_detail.product_id,
                            operator_id: assortment_detail.operator_id
                        }
                    });
                    console.log('insert_status - ', insert_status);
                    if (insert_status) {
                        failedRows.push(row);
                        continue;
                    }
                    else {
                        const is_new = await Assortment.create(assortment_detail)
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

    uploadexcelIdposperassortments: async function (req, res) {
        const { assortmentId } = req.params;
        try {
            console.log(req.file);
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
                    return title.replaceAll(" ", "_").toLowerCase();
                })
                // check the excel file's format (column list)
                let is_data = 'ID';
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

                    let assortment_pos = {};
                    if (is_data === 'ID') {
                        assortment_pos = {
                            assortmentId,
                            posId: row[titles.indexOf("id_pos")],
                        }
                        const filtered_assortment = await Assortment.findOne({ where: { id: assortment_pos.assortmentId } });
                        const filtered_pos = await Pos.findOne({ where: { id: assortment_pos.posId } });
                        if (filtered_assortment === null || filtered_pos === null) {
                            failedRows.push(row);
                            continue;
                        }
                        const filtered_assortment_pos = await AssortmentPos.findOne({
                            where: {
                                assortmentId: assortment_pos.assortmentId,
                                posId: assortment_pos.posId,
                            }
                        })
                        if (filtered_assortment_pos === null) {
                            await AssortmentPos.create({
                                assortmentId: assortment_pos.assortmentId,
                                posId: assortment_pos.posId,
                            })
                        }
                        count++;
                    }
                    else if (is_data === 'NAME') {
                        assortment_pos = {
                            assortmentId,
                            posName: row[titles.indexOf("pos_name")],
                        }
                        const filtered_assortment = await Assortment.findOne({ where: { id: assortment_pos.assortmentId } });
                        const filtered_pos = await Pos.findOne({ where: { name: assortment_pos.posName } });
                        if (filtered_assortment === null || filtered_pos === null) {
                            failedRows.push(row);
                            continue;
                        }
                        console.log('filtered_assortment.id - ', filtered_assortment.id);
                        console.log('filtered_pos.id - ', filtered_pos.id);
                        const filtered_assortment_pos = await AssortmentPos.findOne({
                            where: {
                                assortmentId: filtered_assortment.id,
                                posId: filtered_pos.id,
                            }
                        })
                        if (filtered_assortment_pos === null) {
                            await AssortmentPos.create({
                                assortmentId: filtered_assortment.id,
                                posId: filtered_pos.id,
                            })
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

    uploadexcelIdproductperassortments: async function (req, res) {
        const { assortmentId } = req.params;
        try {
            console.log(req.file);
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
                    return title.replaceAll(" ", "_").toLowerCase();
                })
                // check the excel file's format (column list)
                let is_data = 'ID';
                if (titles.filter(title => title === 'id_product').length > 0) {
                    is_data = 'ID';
                }
                else if (titles.filter(title => title === 'product_name').length > 0) {
                    is_data = 'NAME';
                }
                else {
                    return res.json({
                        success: false,
                        invalidFile: false,
                        message: "The uploaded file is invalid. Please check the column list. Their columns' name should be ID Product or Product Name."
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

                    let assortment_pro = {};
                    if (is_data === 'ID') {
                        assortment_pro = {
                            assortmentId,
                            productId: row[titles.indexOf("id_product")],
                        }
                        const filtered_assortment = await Assortment.findOne({ where: { id: assortment_pro.assortmentId } });
                        const filtered_pro = await Product.findOne({ where: { id: assortment_pro.productId } });
                        if (filtered_assortment === null || filtered_pro === null) {
                            failedRows.push(row);
                            continue;
                        }
                        const filtered_assortment_pro = await AssortmentProduct.findOne({
                            where: {
                                assortmentId: assortment_pro.assortmentId,
                                productId: assortment_pro.productId,
                            }
                        })
                        if (filtered_assortment_pro === null) {
                            await AssortmentProduct.create({
                                assortmentId: assortment_pro.assortmentId,
                                productId: assortment_pro.productId,
                            })
                        }
                        count++;
                    }
                    else if (is_data === 'NAME') {
                        assortment_pro = {
                            assortmentId,
                            proName: row[titles.indexOf("product_name")],
                        }
                        const filtered_assortment = await Assortment.findOne({ where: { id: assortment_pro.assortmentId } });
                        const filtered_pro = await Product.findOne({ where: { name: assortment_pro.proName } });
                        if (filtered_assortment === null || filtered_pro === null) {
                            failedRows.push(row);
                            continue;
                        }
                        console.log('filtered_assortment.id - ', filtered_assortment.id);
                        console.log('filtered_pro.id - ', filtered_pro.id);
                        const filtered_assortment_pro = await AssortmentProduct.findOne({
                            where: {
                                assortmentId: filtered_assortment.id,
                                productId: filtered_pro.id,
                            }
                        })
                        if (filtered_assortment_pro === null) {
                            await AssortmentProduct.create({
                                assortmentId: filtered_assortment.id,
                                productId: filtered_pro.id,
                            })
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
    get_search_list: async function (req, res) {
        const { filter_name, target } = req.query;
        if (filter_name !== '' && filter_name !== null && filter_name !== undefined) {
            let where_cause = [];
            where_cause.push({ name: { [Op.like]: "%" + filter_name + "%" } });
            where_cause.push({ status: 'active' })

            let order_cause = [];
            order_cause = ["name", "ASC"];

            let data = [];

            if (target === 'operator') {
                data = await Operator.findAll({
                    where: where_cause,
                    order: [order_cause],
                })
            }
            else if (target === 'brand') {
                data = await Brand.findAll({
                    where: where_cause,
                    order: [order_cause],
                })
            }
            else if (target === 'product') {
                data = await Product.findAll({
                    where: where_cause,
                    order: [order_cause],
                })
            }

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
        const { id, brand_id, productIds, operator_id, ...rest } = req.body
        let newAssortment = { brand_id, operator_id, ...rest };
        let insert_status = await Assortment.findOne({ where: { brand_id: brand_id, operator_id: operator_id } });
        console.log(insert_status);
        if (insert_status) {
            return res.status(200).json({ success: false, message: "We can't create new assortment at this time. Please check the selected Brand, Operator again." })
        }
        else {
            const data = await Assortment.create(newAssortment)
            if (data) {
                let assortmentId = data.id;
                for (const productId of productIds) {
                    const data = await AssortmentProduct.create({
                        assortmentId: assortmentId,
                        productId,
                    })
                }
            }
            return res.status(200).json({ data })
        }
    },

    update: async function (req, res) {
        const { body, params: { id } } = req;
        let assortmentId = id;
        const { brand_id, productIds, operator_id, ...rest } = req.body
        let updateAssortment = { brand_id, operator_id, ...rest };
        let update_status = await Assortment.findOne({
            where: {
                brand_id: brand_id, operator_id: operator_id,
                id: { [Op.not]: id }
            }
        });
        if (update_status) {
            return res.status(200).json({ success: false, message: "We can't create new assortment at this time. Please check the selected Brand, Operator again." })
        }
        else {
            const data = await Assortment.update(updateAssortment, { where: { id } })
            await AssortmentProduct.destroy({ where: { assortmentId } })
            for (const productId of productIds) {
                const data = await AssortmentProduct.create({
                    assortmentId: assortmentId,
                    productId,
                })
            }
            return res.status(200).json({ data })
        }
    },

    delete: async function (req, res) {
        const { id } = req.params
        await Assortment.destroy({ where: { id } })
        return res.status(200).send()
    },

    getfilterlist: async function (req, res) {
        const { column, filterValue, isFullText } = req.query;
        let data_list = [];
        if (filterValue !== undefined) {
            if (column === 'name') {
                let where_cause = {};
                where_cause[column] = { [Op.like]: "%" + filterValue + "%" };
                let order_cause = [];
                order_cause = ["name", "ASC"];
                const data = await Assortment.findAll({
                    where: where_cause,
                    order: [order_cause],
                })
                for (const item of data) {
                    let push_item = { ...item.dataValues };
                    push_item['title'] = push_item[column];
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
                const data = await Assortment.findAll(query_builder_options)
                for (const item of data) {
                    let push_item = { ...item.dataValues };
                    push_item['id'] = push_item.brand_id;
                    push_item['title'] = push_item.brand.name;
                    let filtered_data = data_list.filter(data_item => data_item.brand_id === push_item.brand_id);
                    if (filtered_data.length === 0) {
                        data_list.push(push_item);
                    }
                }
            }
            else if (column === 'operator') {
                let operator_where_cause = {};
                operator_where_cause['name'] = { [Op.like]: "%" + filterValue + "%" };
                let query_builder_options = {
                    include: [
                        (Object.keys(operator_where_cause).length > 0) ? { model: Operator, where: operator_where_cause } : Operator,
                    ]
                }
                const data = await Assortment.findAll(query_builder_options)
                for (const item of data) {
                    let push_item = { ...item.dataValues };
                    push_item['id'] = push_item.operator_id;
                    push_item['title'] = push_item.operator.name;
                    let filtered_data = data_list.filter(data_item => data_item.operator_id === push_item.operator_id);
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
