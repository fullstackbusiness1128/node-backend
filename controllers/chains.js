const { Chain, Sequelize, Brand } = require('../sequelize')
const excel = require("exceljs");
const Op = Sequelize.Op;
const expensesUtils = require('../services/expenses.utils');

const get_parent_id_list = async (data_id, parent_id_list) => {
    let data = await Chain.findOne({ where: { id: data_id } });
    data = data.dataValues;
    if (data && data.parentId !== null) {
        parent_id_list.push(data.parentId);
        await get_parent_id_list(data.parentId, parent_id_list);
    }
    else if (data && data.parentId === null) {
        parent_id_list.push(0);
    }
    return parent_id_list;
}

const update_tree_path = async (inserted_id) => {
    let parent_id_list = [inserted_id];
    parent_id_list = await get_parent_id_list(inserted_id, parent_id_list);
    let tree_path = parent_id_list.reverse().join(',') + ',';
    await Chain.update({ tree_path }, { where: { id: inserted_id } })
}

const get_data = async (req_query, is_download_excel) => {
    const { page, itemsPerPage, sortby, sortdesc, filterModel } = req_query;
    let page_num = page === undefined ? 1 : page;
    let page_limit = itemsPerPage === undefined ? 10 : itemsPerPage;

    let order_cause = [];
    if (sortby !== undefined) {
        if (sortby === 'parent') {
            order_cause = ['parent', 'name', sortdesc === "true" ? "DESC" : "ASC"];
        }
        else if (sortby === 'brand') {
            order_cause = ['brand', 'name', sortdesc === "true" ? "DESC" : "ASC"];
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
    let parent_where_cause = {};
    let brand_where_cause = {};
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
        if (item.columnField === 'parent') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause['parentId'] = { [Op.or]: buffer_values }
        }
        return item;
    })
    let query_builder_options = {
        where: where_cause,
        order: [order_cause],
        include: [
            (Object.keys(parent_where_cause).length > 0) ? { model: Chain, as: 'parent', where: parent_where_cause } : { model: Chain, as: 'parent' },
            (Object.keys(brand_where_cause).length > 0) ? { model: Brand, where: brand_where_cause } : { model: Brand },
        ]
    }
    if (!is_download_excel) {
        query_builder_options.offset = (parseInt(page_num) - 1) * parseInt(page_limit);
        query_builder_options.limit = parseInt(page_limit);
    }

    const data = await Chain.findAndCountAll(query_builder_options)
    
    return {
        data: data.rows,
        total: data.count,
    }
}

const Self = {

    create: async function (req, res) {
        const { body } = req
        const data = await Chain.create(body)
        if (data) {
            await update_tree_path(data.dataValues.id);
        }
        return res.status(200).json({ data })
    },

    get_parent_list: async function (req, res) {
        const { filter_name } = req.query;
        if (filter_name !== '' && filter_name !== null && filter_name !== undefined) {
            let where_cause = [];
            where_cause.push({ name: { [Op.like]: "%" + filter_name + "%" } });

            let order_cause = [];
            order_cause = ["name", "ASC"];

            const data = await Chain.findAll({
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

    index: async function (req, res) {
        const chains = await get_data(req.query);

        return res.json({
            data: chains.data,
            total: chains.total,
        })
    },

    update: async function (req, res) {
        const { body, params: { id } } = req
        const data = await Chain.update(body, { where: { id } })
        await update_tree_path(id);
        return res.status(200).json({ data })
    },

    delete: async function (req, res) {
        const { id } = req.params
        await Chain.destroy({ where: { id } })
        return res.status(200).send()
    },

    downloadexcel: async function (req, res) {
        try {
            let data_list = await get_data(req.query, true);
            data_list = data_list.data.map((data_detail => {
                const result = {
                    ...data_detail.dataValues
                }
                console.log(result);
                result.brandName = result.brand !== null ? result.brand.name : '';
                result.parentName = result.parent !== null ? result.parent.name : '';
                return result;
            }))
            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("data");
            worksheet.columns = [
                { header: "ID", key: "id" },
                { header: "Name", key: "name" },
                { header: "Brand", key: "brandName" },
                { header: "Parent", key: "parentName" },
                { header: "Description", key: "description" },
            ];
            worksheet.addRows(data_list);
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

    getfilterlist: async function (req, res) {
        const { column, filterValue, isFullText } = req.query;
        let data_list = [];
        if (filterValue !== undefined) {
            if (column === 'name' || column === 'description') {
                let where_cause = {};
                where_cause[column] = { [Op.like]: "%" + filterValue + "%" };
                let order_cause = [];
                order_cause = ["name", "ASC"];
                const data = await Chain.findAll({
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
                const data = await Chain.findAll(query_builder_options)
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
            else if (column === 'parent') {
                let parent_where_cause = {};
                parent_where_cause['name'] = { [Op.like]: "%" + filterValue + "%" };
                let query_builder_options = {
                    include: [
                        (Object.keys(parent_where_cause).length > 0) ? { model: Chain, as: 'parent', where: parent_where_cause } : { model: Chain, as: 'parent' },
                    ]
                }
                const data = await Chain.findAll(query_builder_options)
                for (const item of data) {
                    let push_item = { ...item.dataValues };
                    push_item['id'] = push_item.parentId;
                    push_item['title'] = push_item.parent.name;
                    let filtered_data = data_list.filter(data_item => data_item.parentId === push_item.parentId);
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
