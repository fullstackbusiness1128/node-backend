const moment = require('moment')
const { Brand, SubBrands, Static, Sequelize } = require('../sequelize')
const YN_types = require('../models/brand.model').yn_type;
const BrandStatus = require('../models/brand.model').status;
const Op = Sequelize.Op;
const Fn = Sequelize.fn;


const Self = {

    index: async function (req, res) {
        const { page, itemsPerPage, sortby, sortdesc, filterModel } = req.query;

        let page_num = page === undefined ? 1 : page;
        let page_limit = itemsPerPage === undefined ? 10 : itemsPerPage;

        let filter = filterModel === undefined ? [] : JSON.parse(filterModel);

        let order_cause = [];
        if (sortby !== undefined) {
            if (sortby === 'parent') {
                order_cause = ['parent', 'name', sortdesc === "true" ? "DESC" : "ASC"];
            }
            else {
                order_cause = [sortby, sortdesc === "true" ? "DESC" : "ASC"];
            }
        }
        else {
            order_cause = ["id", "ASC"];
        }

        let where_cause = {};
        let parent_where_cause = {};
        let buffer_values = [];
        console.log('filter - ', filter);
        filter.map(item => {
            if (item.columnField === 'name' && item.filterValue) {
                buffer_values = [];
                for (const [key, value] of Object.entries(item.filterValue)) {
                    if (value !== null) buffer_values.push(value);
                }
                if (buffer_values.length > 0) where_cause['id'] = { [Op.or]: buffer_values }
            }
            if (item.columnField === 'description') {
                where_cause.description = { [Op.like]: "%" + item.filterValue + "%" };
            }
            if (item.columnField === 'parent') {
                parent_where_cause.name = { [Op.like]: "%" + item.filterValue + "%" };
            }
            // checkbox search
            if (
                item.columnField === 'status'
                || item.columnField === 'module_info'
                || item.columnField === 'module_sales'
                || item.columnField === 'module_actions'
                || item.columnField === 'platform_photos'
                || item.columnField === 'platform_reporting'
                || item.columnField === 'platform_training'
            ) {
                buffer_values = [];
                for (const [key, value] of Object.entries(item.filterValue)) {
                    if (value !== null) buffer_values.push(value);
                }
                if (buffer_values.length > 0) where_cause[item.columnField] = { [Op.or]: buffer_values }
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
            return item;
        })
        // const total_count = await Brand.count({
        //     where: where_cause,
        // });
        console.log('where_cause - ', where_cause);
        const data = await Brand.findAndCountAll({
            where: where_cause,
            offset: (parseInt(page_num) - 1) * parseInt(page_limit),
            limit: parseInt(page_limit),
            order: [order_cause],
            include: [
                Static,
                (Object.keys(parent_where_cause).length > 0) ? { model: Brand, as: 'parent', where: parent_where_cause } : { model: Brand, as: 'parent' },
            ]
        })
        // console.log(data);
        return res.json({
            data: data.rows,
            total: data.count,
            yn_type: YN_types,
            brand_status: BrandStatus,
        })
    },

    delete: async function (req, res) {
        const { id } = req.params
        await Brand.destroy({ where: { id } })
        return res.status(200).send()
    },


    update: async function (req, res) {
        const { body, params: { id } } = req
        const data = await Brand.update(body, { where: { id } })
        return res.status(200).json({ data })
    },

    create: async function (req, res) {
        const { body } = req
        const data = await Brand.create(body)
        return res.status(200).json({ data })
    },

    get_parent_list: async function (req, res) {
        const { filter_name, editting_id } = req.query;
        console.log('editting_id - ', editting_id);
        if (filter_name !== '' && filter_name !== null && filter_name !== undefined) {
            let where_cause = [];
            where_cause.push({ name: { [Op.like]: "%" + filter_name + "%" } });
            if (editting_id !== undefined) {
                where_cause.push({ id: { [Op.not]: editting_id } });
            }

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

    get_tree: async function (req, res) {
        const { page, itemsPerPage, sortby, sortdesc, filterModel } = req.query;

        let page_num = page === undefined ? 1 : page;
        let page_limit = itemsPerPage === undefined ? 10 : itemsPerPage;

        let filter = filterModel === undefined ? [] : JSON.parse(filterModel);

        let order_cause = [];
        if (sortby !== undefined) {
            if (sortby === 'brand_name') {
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
        let parent_where_cause = {};
        let child_where_cause = {};
        filter.map(item => {
            if (item.columnField === 'brand_name' && item.filterValue) {
                where_cause.name = { [Op.like]: "%" + item.filterValue + "%" };
            }
            if (item.columnField === 'parent_name') {
                parent_where_cause.name = { [Op.like]: "%" + item.filterValue + "%" };
            }
            if (item.columnField === 'sub_name') {
                child_where_cause.name = { [Op.like]: "%" + item.filterValue + "%" };
            }
            return item;
        })

        console.log('where_cause - ', where_cause);
        const data = await SubBrands.findAndCountAll({
            where: where_cause,
            order: [order_cause],
            include: [
                (Object.keys(parent_where_cause).length > 0) ? { model: SubBrands, as: 'parent', where: parent_where_cause } : { model: SubBrands, as: 'parent' },
                (Object.keys(child_where_cause).length > 0) ? { model: SubBrands, as: 'children', where: child_where_cause } : { model: SubBrands, as: 'children' },
            ]
        })
        let data_list = [];
        for (const data_item of data.rows) {
            if (data_item.children.length > 0) {
                for (const child of data_item.children) {
                    let item = {
                        brand_name: data_item.name,
                        parent_name: data_item.parent !== null ? data_item.parent.name : '',
                    }
                    item.sub_name = child.name;
                    data_list.push(item);
                }
            }
            else {
                let item = {
                    brand_name: data_item.name,
                    parent_name: data_item.parent !== null ? data_item.parent.name : '',
                    sub_name: '',
                }
                data_list.push(item);
            }
        }

        return res.json({
            data: data_list.slice(page_limit * (page_num - 1), page_limit * page_num),
            total: data.count,
        })
    },

    getfilterlist: async function (req, res) {
        const { column, filterValue, isFullText } = req.query;
        let data_list = [];
        if (filterValue !== undefined) {
            let where_cause = {};
            where_cause[column] = { [Op.like]: "%" + filterValue + "%" };
            let order_cause = [];
            order_cause = ["name", "ASC"];
            const data = await Brand.findAll({
                where: where_cause,
                order: [order_cause],
            })
            for (const item of data) {
                let push_item = { ...item.dataValues };
                push_item['title'] = push_item.name;
                data_list.push(push_item);
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
