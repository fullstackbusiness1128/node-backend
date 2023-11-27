const { Sequelize, User, Holidaystaticdays, Company } = require('../sequelize')
const HttpStatus = require("http-status-codes");
const excel = require("exceljs");
const fs = require('fs');
const Op = Sequelize.Op;
const holidayTypes = require('../models/holidaystaticdays').holidayTypes;

const get_data = async (req, is_download_excel) => {
    const { page, itemsPerPage, sortby, sortdesc, filterModel, isteam } = req.query;
    let page_num = page === undefined ? 1 : page;
    let page_limit = itemsPerPage === undefined ? 10 : itemsPerPage;
    let filter = filterModel === undefined ? [] : JSON.parse(filterModel);

    let order_cause = [];
    if (sortby !== undefined) {
        order_cause = [sortby, sortdesc === "true" ? "DESC" : "ASC"];
    }
    else {
        order_cause = [[Sequelize.literal('id DESC')]];
    }

    let where_cause = {};
    let company_where_cause = {};
    let buffer_values = [];

    filter.map(item => {
        if (item.columnField === 'date') {
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
        // string search
        if ((item.columnField === 'description') && item.filterValue) {
            where_cause[item.columnField] = { [Op.like]: `%${item.filterValue}%` };
        }
        // checkbox search
        if (item.columnField === 'companyId' || item.columnField === 'holidayType') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                buffer_values.push(value);
            }
            if (buffer_values.length > 0) where_cause[item.columnField] = { [Op.or]: buffer_values }
        }
        return item;
    })

    let query_builder_options = {
        where: where_cause,
        order: [order_cause],
        include: [
            (Object.keys(company_where_cause).length > 0) ?
                { model: Company, where: company_where_cause, } :
                { model: Company, },
        ],
    }
    const data = await Holidaystaticdays.findAndCountAll(query_builder_options)

    let data_list = [];
    for (let i = 0; i < data.rows.length; i++) {
        let item = data.rows[i].dataValues;
        item.type_label = holidayTypes[item.holidayType] ? holidayTypes[item.holidayType] : '';
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

const Self = {

    index: async function (req, res) {
        const holiday_data = await get_data(req);
        let holidayTypesSelect = [];
        for (const item of Object.keys(holidayTypes)) {
            let push_item = {
                value: item,
                label: holidayTypes[item]
            }
            holidayTypesSelect.push(push_item);
        }
        const companies = await Company.findAll();
        return res.json({
            data: holiday_data.data,
            total: holiday_data.total,
            holidayTypes: holidayTypes,
            holidayTypesSelect: holidayTypesSelect,
            companies
        })
    },

    upsert: async function (req, res) {
        let { body, params: { id } } = req;
        let dataId = null;
        if (id === undefined) {
            body = { ...body, userId: req.user.id };
            const data = await Holidaystaticdays.create(body);
            if (data) {
                dataId = data.id;
            }
        } else {
            await Holidaystaticdays.update(body, { where: { id } });
            dataId = id;
        }

        return res.status(200).json({ dataId })
    },

    delete: async function (req, res) {
        const { id } = req.params
        await Holidaystaticdays.destroy({ where: { id } })
        return res.status(200).send()
    },

    downloadexcel: async function (req, res) {
        try {
            let datas = await get_data(req, true);
            let data_list = datas.data.map((detail => {
                const result = {
                    ...detail
                }
                result.company_label = '';
                if (result.company) {
                    result.company_label = result.company.name;
                }
                return result;
            }))
            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("data");
            let columns = [
                { header: "Compañía", key: "company_label" },
                { header: "Fecha", key: "date" },
                { header: "Tipo", key: "type_label" },
                { header: "Descripcion", key: "description" },
            ];
            worksheet.columns = columns;
            worksheet.addRows(data_list);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=" + "KM.xlsx"
            );
            return workbook.xlsx.write(res).then(() => res.status(200).send());
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    checkduplication: async function (req, res) {
        const { companyId, date } = req.query;
        console.log(companyId, date);
        let data = { isduplicated: true };
        if (companyId && date) {
            const datacount = await Holidaystaticdays.count({
                where: {
                    companyId,
                    date
                }
            });
            if (datacount > 0) {
                data.isduplicated = true;
            } else {
                data.isduplicated = false;
            }
        }
        return res.status(200).json(data);
    },

}

module.exports = Self
