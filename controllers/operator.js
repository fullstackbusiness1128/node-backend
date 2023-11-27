const { Operator, Sequelize } = require('../sequelize')
const Op = Sequelize.Op;
const Fn = Sequelize.fn;
const expensesUtils = require('../services/expenses.utils');


const Self = {

    index: async function (req, res) {
        const { page, itemsPerPage, sortby, sortdesc, filterModel } = req.query;
        
        let filter = filterModel === undefined ? [] : JSON.parse(filterModel);

        let order_cause = [];
        if (sortby !== undefined) {
            order_cause = [sortby, sortdesc === "true" ? "DESC" : "ASC"];
        }
        else {
            order_cause = ["id", "ASC"];
        }

        let where_cause = {};
        filter.map(item => {
            if ((item.columnField === 'name' || item.columnField === 'description') && item.filterValue) {
                buffer_values = [];
                for (const [key, value] of Object.entries(item.filterValue)) {
                    if (value !== null) buffer_values.push(value);
                }
                if (buffer_values.length > 0) where_cause['id'] = { [Op.or]: buffer_values }
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
        let query_builder_options = {
            where: where_cause,
            order: [order_cause],
        }

        const data = await Operator.findAndCountAll(query_builder_options)

        return res.json({
            data: data.rows,
            total: data.count,
        })
    },

    delete: async function (req, res) {
        const { id } = req.params
        await Operator.destroy({ where: { id } })
        return res.status(200).send()
    },

    update: async function (req, res) {
        const { body, params: { id } } = req
        const data = await Operator.update(body, { where: { id } })
        return res.status(200).json({ data })
    },

    update_rows: async function (req, res) {
        const { data } = req.body;
        if (data && data.length > 0) {
            for (const item of data) {
                console.log(item);
                await Operator.update(item, { where: { id: item.id } })
            }
        }
        return res.status(200).json({ data });
    },

    delete_rows: async function (req, res) {
        const { data } = req.body;
        console.log(data);
        if (data && data.length > 0) {
            for (const id of data) {
                await Operator.destroy({ where: { id } })
            }
        }
        return res.status(200).send()
    },

    create: async function (req, res) {
        const { body } = req
        const data = await Operator.create(body)
        return res.status(200).json({ data })
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
                const data = await Operator.findAll({
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
