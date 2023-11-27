const { Brand, SubBrands, Sequelize } = require('../sequelize')
const Op = Sequelize.Op;
const Fn = Sequelize.fn;
const expensesUtils = require('../services/expenses.utils');


const Self = {

    index: async function (req, res) {
        const { page, itemsPerPage, sortby, sortdesc, filterModel } = req.query;
        let page_num = page === undefined ? 1 : page;
        let page_limit = itemsPerPage === undefined ? 10 : itemsPerPage;

        let filter = filterModel === undefined ? [] : JSON.parse(filterModel);

        let order_cause = [];
        if (sortby !== undefined) {
            if (sortby === 'brand') {
                order_cause = ['brand', 'name', sortdesc === "true" ? "DESC" : "ASC"];
            }
            else if (sortby === 'parent') {
                order_cause = ['parent', 'name', sortdesc === "true" ? "DESC" : "ASC"];
            }
            else if (sortby === 'subbrand_name') {
                order_cause = ['name', sortdesc === "true" ? "DESC" : "ASC"];
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
        let parent_where_cause = {};
        filter.map(item => {
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
            if ((item.columnField === 'subbrand_name' || item.columnField === 'description') && item.filterValue) {
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
            offset: (parseInt(page_num) - 1) * parseInt(page_limit),
            limit: parseInt(page_limit),
            include: [
                (Object.keys(brand_where_cause).length > 0) ? { model: Brand, where: brand_where_cause } : Brand,
                (Object.keys(parent_where_cause).length > 0) ? { model: SubBrands, as: 'parent', where: parent_where_cause } : { model: SubBrands, as: 'parent' },
            ]
        }

        const data = await SubBrands.findAndCountAll(query_builder_options)

        return res.json({
            data: data.rows,
            total: data.count,
        })
    },

    get_parent_list: async function (req, res) {
        const { filter_name } = req.query;
        if (filter_name !== '' && filter_name !== null && filter_name !== undefined) {
            let where_cause = [];
            where_cause.push({ name: { [Op.like]: "%" + filter_name + "%" } });

            let order_cause = [];
            order_cause = ["name", "ASC"];

            const data = await SubBrands.findAll({
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

    update: async function (req, res) {
        const { body, params: { id } } = req
        const data = await SubBrands.update(body, { where: { id } })
        return res.status(200).json({ data })
    },

    create: async function (req, res) {
        const { body } = req
        const data = await SubBrands.create(body)
        return res.status(200).json({ data })
    },

    delete: async function (req, res) {
        const { id } = req.params
        await SubBrands.destroy({ where: { id } })
        return res.status(200).send()
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
                const data = await SubBrands.findAll({
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
                const data = await SubBrands.findAll(query_builder_options)
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
                        (Object.keys(parent_where_cause).length > 0) ? { model: SubBrands, as: 'parent', where: parent_where_cause } : { model: SubBrands, as: 'parent' },
                    ]
                }
                const data = await SubBrands.findAll(query_builder_options)
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
