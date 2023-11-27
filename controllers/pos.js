const { Pos, Chain, Channel, Geography, Zone } = require('../sequelize')
const Sequelize = require("sequelize");
const HttpStatus = require("http-status-codes");
const excel = require("exceljs");
const readXlsxFile = require("read-excel-file/node");
const fs = require("fs");
const VISIT_TYPES = require('../models/pos.model').VISIT_TYPES;
const Op = Sequelize.Op;
const expensesUtils = require('../services/expenses.utils');

const get_geo_name_stacks = async (geo_id, name_stacks) => {
    let data = await Geography.findOne({ where: { id: geo_id } });
    data = data.dataValues;
    console.log('data - ', data);
    name_stacks.push(data.name);
    if (data && data.parentId !== null && geo_id !== data.parentId) {
        await get_geo_name_stacks(data.parentId, name_stacks);
    }
    return name_stacks;
}

const get_data = async (req_query, is_download_excel) => {
    const { page, itemsPerPage, sortby, sortdesc, filterModel } = req_query;
    let page_num = page === undefined ? 1 : page;
    let page_limit = itemsPerPage === undefined ? 10 : itemsPerPage;

    let order_cause = [];
    if (sortby !== undefined && sortby !== 'country_name' && sortby !== 'state_name' && sortby !== 'province_name') {
        order_cause = [sortby, sortdesc === "true" ? "DESC" : "ASC"];
    }
    else {
        order_cause = ["id", "ASC"];
    }

    let filter = filterModel === undefined ? [] : JSON.parse(filterModel);
    let where_cause = {
        isNotRequested: true
    };
    let chain_where_cause = {};
    let subchain_where_cause = {};
    let channel_where_cause = {};
    let subchannel_where_cause = {};
    let zone_where_cause = {};
    let buffer_values = [];
    filter.map(item => {
        if (item.columnField === 'chainId') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) chain_where_cause['id'] = { [Op.or]: buffer_values }
        }
        if (item.columnField === 'subChainId') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) subchain_where_cause['id'] = { [Op.or]: buffer_values }
        }
        if (item.columnField === 'channelId') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) channel_where_cause['id'] = { [Op.or]: buffer_values }
        }
        if (item.columnField === 'subChannelId') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) subchannel_where_cause['id'] = { [Op.or]: buffer_values }
        }
        if (item.columnField === 'zoneId') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            if (buffer_values.length > 0) zone_where_cause['id'] = { [Op.or]: buffer_values }
        }
        if ((item.columnField === 'name'
            || item.columnField === 'address'
            || item.columnField === 'postalCode'
            || item.columnField === 'town'
            || item.columnField === 'phone'
            || item.columnField === 'phone2'
            || item.columnField === 'contact'
            || item.columnField === 'comments') && item.filterValue) {
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
    console.log(where_cause);
    let query_builder_options = {
        where: where_cause,
        order: [order_cause],
        include: [
            (Object.keys(chain_where_cause).length > 0) ? { model: Chain, where: chain_where_cause } : { model: Chain },
            (Object.keys(subchain_where_cause).length > 0) ? { model: Chain, as: "subchain", where: subchain_where_cause } : { model: Chain, as: "subchain" },
            (Object.keys(channel_where_cause).length > 0) ? { model: Channel, where: channel_where_cause } : { model: Channel },
            (Object.keys(subchannel_where_cause).length > 0) ? { model: Channel, as: "subchannel", where: subchannel_where_cause } : { model: Channel, as: "subchannel" },
            Geography,
            (Object.keys(zone_where_cause).length > 0) ? { model: Zone, where: zone_where_cause } : Zone,
        ]
    }

    const data = await Pos.findAndCountAll(query_builder_options)
    let data_list = [];
    for (const data_item of data.rows) {
        let push_item = { ...data_item.dataValues };

        if (push_item.geography !== null) {
            push_item.province_name = '';
            push_item.state_name = '';
            push_item.country_name = '';
            if (push_item.geography !== null) {
                push_item.province_name = push_item.geography.name;
            }

            if (push_item.geography.parentId !== null && push_item.geography.parentId !== push_item.geography.id) {
                push_item.state = await Geography.findOne({ where: { id: push_item.geography.parentId } });
                if (push_item.state !== null) {
                    push_item.state_name = push_item.state.name;
                }
                if (push_item.state.parentId !== null && push_item.state.parentId !== push_item.state.id) {
                    push_item.country = await Geography.findOne({ where: { id: push_item.state.parentId } });
                    if (push_item.country !== null) {
                        push_item.country_name = push_item.country.name;
                    }
                }
            }
            else {
                push_item.state = {};
                push_item.province = {};
            }
        }
        else {
            push_item.country = {};
            push_item.state = {};
            push_item.province = {};
            push_item.country_name = "";
            push_item.state_name = "";
            push_item.province_name = "";
        }
        data_list.push(push_item);
    }

    if (sortby !== undefined && (sortby === 'country_name' || sortby === 'state_name' || sortby === 'province_name')) {
        if (sortdesc === "false") {
            data_list = data_list.sort((a, b) => (a[sortby] > b[sortby]) ? 1 : ((b[sortby] > a[sortby]) ? -1 : 0))
        }
        else {
            data_list = data_list.sort((a, b) => (a[sortby] < b[sortby]) ? 1 : ((b[sortby] < a[sortby]) ? -1 : 0))
        }
    }
    filter.map(item => {
        if (item.columnField === 'province_name') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            data_list = data_list.filter(data_item => buffer_values.includes(data_item['geographyId']))
        }
        if (item.columnField === 'state_name') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            data_list = data_list.filter(data_item => {
                if (data_item['state'].dataValues) {
                    return buffer_values.includes(data_item['state'].dataValues.id);
                }
                return false;
            })
        }
        if (item.columnField === 'country_name') {
            buffer_values = [];
            for (const [key, value] of Object.entries(item.filterValue)) {
                if (value !== null) buffer_values.push(value);
            }
            data_list = data_list.filter(data_item => {
                if (data_item['country'].dataValues) {
                    return buffer_values.includes(data_item['country'].dataValues.id);
                }
                return false;
            })
        }
    })
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

    query: async function (req, res) {
        const { q } = req.body

        const data = await Pos.findAll({
            where: {
                opt: {
                    [Op.like]: `%${q}%`
                }
            },
            limit: 500,
        })
        return res.json({ data })
    },

    get_zones: async function (req, res) {
        const { filter_name } = req.query;
        console.log(filter_name);

        let where_cause = {
            name: { [Op.like]: "%" + filter_name + "%" },
        };
        let filtered_data = await Zone.findAll({
            where: where_cause,
            order: [["name", "ASC"]],
        })

        res.json({
            data: filtered_data
        });
    },

    get_geographies: async function (req, res) {
        const { filter_name } = req.query;
        console.log(filter_name);

        let where_cause = {
            name: { [Op.like]: "%" + filter_name + "%" },
            type: "province"
        };
        let filtered_data = await Geography.findAll({
            where: where_cause,
            order: [["name", "ASC"]],
            include: [
                { model: Geography, as: "parent" }
            ]
        })
        let data = [];
        for (const item of filtered_data) {
            let push_item = { ...item.dataValues };
            let name_stacks = [push_item.name];
            if (push_item.parent !== null) {
                name_stacks.push(push_item.parent.dataValues.name);
                name_stacks = await get_geo_name_stacks(push_item.parent.dataValues.parentId, name_stacks);
            }
            console.log(name_stacks);
            push_item.label = name_stacks.join(', ');
            data.push(push_item);
        }

        res.json({
            data: data
        });
    },

    create: async function (req, res) {
        const { body } = req
        const data = await Pos.create(body)
        return res.status(200).json({ data })
    },

    update: async function (req, res) {
        const { body, params: { id } } = req
        const data = await Pos.update(body, { where: { id } })
        return res.status(200).json({ data })
    },

    index: async function (req, res) {
        try {
            const poses = await get_data(req.query);
            const chain_list = await Chain.findAll({
                where: { parentId: { [Op.is]: null } },
                order: [['name', 'ASC']],
            });
            const sub_chain_list = await Chain.findAll({
                where: { parentId: { [Op.ne]: null } },
                order: [['tree_path', 'ASC'], ['name', 'ASC']],
            });
            const channel_list = await Channel.findAll({
                where: { parentId: { [Op.is]: null } },
                order: [['name', 'ASC']],
            });
            const sub_channel_list = await Channel.findAll({
                where: { parentId: { [Op.ne]: null } },
                order: [['tree_path', 'ASC'], ['name', 'ASC']],
            });
            return res.json({
                data: poses.data,
                total: poses.total_count,
                visitTypes: Object.values(VISIT_TYPES),
                chain_list: chain_list,
                sub_chain_list: sub_chain_list,
                channel_list: channel_list,
                sub_channel_list: sub_channel_list,
            })
        } catch (error) {
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        }
    },

    downloadexcel: async function (req, res) {
        try {
            let pos_list = await get_data(req.query, true);
            pos_list = pos_list.data.map((pos_detail => {
                const result = {
                    ...pos_detail
                }
                result.zoneName = pos_detail.zone !== null ? pos_detail.zone.name : '';
                result.chainName = pos_detail.chain !== null ? pos_detail.chain.name : '';
                result.subChainName = pos_detail.subchain !== null ? pos_detail.subchain.name : '';
                result.ChannelName = pos_detail.channel !== null ? pos_detail.channel.name : '';
                result.subChannelName = pos_detail.subchannel !== null ? pos_detail.subchannel.name : '';
                return result;
            }))
            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("data");
            worksheet.columns = [
                { header: "ID", key: "id" },
                { header: "Name", key: "name" },
                { header: "Address", key: "address" },
                { header: "CP", key: "postalCode" },
                { header: "Town", key: "town" },
                // { header: "Type", key: "visitType" },
                { header: "Country", key: "country_name" },
                { header: "State", key: "state_name" },
                { header: "Province", key: "province_name" },
                { header: "Zone", key: "zoneName" },
                { header: "Latitude", key: "latitude" },
                { header: "Longitude", key: "longitude" },
                { header: "Phone", key: "phone" },
                { header: "Phone Time", key: "phone2" },
                { header: "Contact Person", key: "contact" },
                { header: "Comments", key: "comments" },
                { header: "Chain", key: "chainName" },
                { header: "SubChain", key: "subChainName" },
                { header: "Channel", key: "ChannelName" },
                { header: "SubChannel", key: "subChannelName" },
                { header: "Status", key: "status" },
            ];
            worksheet.addRows(pos_list);
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

    uploadexcel: async function (req, res) {
        try {
            console.log(req.file);
            if (req.file === undefined) {
                res.status(400).send("Please upload an excel file!");
            }
            let path = __basedir + "/resources/uploadstmp/";
            const sample_cols = [
                'name',
                'address',
                'cp',
                'town',
                // 'type',
                'country',
                'state',
                'province',
                'zone',
                'latitude',
                'longitude',
                'phone',
                'phone_time',
                'contact_person',
                'comments',
                'chain',
                'subchain',
                'channel',
                'subchannel',
                'status',
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
                    let pos_detail = {
                        name: row[titles.indexOf("name")],
                        address: row[titles.indexOf("address")],
                        cp: row[titles.indexOf("cp")],
                        town: row[titles.indexOf("town")],
                        // type: row[titles.indexOf("type")],
                        zoneId: row[titles.indexOf("zone")],
                        latitude: row[titles.indexOf("latitude")],
                        longitude: row[titles.indexOf("longitude")],
                        phone: row[titles.indexOf("phone")],
                        phone2: row[titles.indexOf("phone_time")],
                        contact: row[titles.indexOf("contact_person")],
                        comments: row[titles.indexOf("comments")],
                        chainId: row[titles.indexOf("chain")],
                        subChainId: row[titles.indexOf("subchain")],
                        channelId: row[titles.indexOf("channel")],
                        subChannelId: row[titles.indexOf("subchannel")],

                        status: row[titles.indexOf("status")],
                    }
                    const filtered_pos = await Pos.findOne({ where: { name: pos_detail.name } });
                    if (filtered_pos !== null) {
                        failedRows.push(row);
                        continue;
                    }
                    if (pos_detail.zoneId !== null) {
                        const filtered_zone = await Zone.findOne({ where: { name: pos_detail.zoneId } });
                        if (filtered_zone !== null) {
                            pos_detail.zoneId = filtered_zone.id;
                        }
                    }
                    if (pos_detail.chainId !== null) {
                        const filtered_chain = await Chain.findOne({ where: { name: pos_detail.chainId } });
                        if (filtered_chain !== null) {
                            pos_detail.chainId = filtered_chain.id;
                        }
                    }
                    if (pos_detail.subChainId !== null) {
                        const filtered_subChain = await Chain.findOne({ where: { name: pos_detail.subChainId } });
                        if (filtered_subChain !== null) {
                            pos_detail.subChainId = filtered_subChain.id;
                        }
                    }
                    if (pos_detail.channelId !== null) {
                        const filtered_channel = await Channel.findOne({ where: { name: pos_detail.channelId } });
                        if (filtered_channel !== null) {
                            console.log('filtered_channel - ', filtered_channel.id);
                            pos_detail.channelId = filtered_channel.id;
                        }
                    }
                    if (pos_detail.subChannelId !== null) {
                        const filtered_subChannel = await Channel.findOne({ where: { name: pos_detail.subChannelId } });
                        if (filtered_subChannel !== null) {
                            pos_detail.subChannelId = filtered_subChannel.id;
                        }
                    }

                    if (row[titles.indexOf("province")] !== null && row[titles.indexOf("state")] !== null && row[titles.indexOf("country")] !== null) {
                        const filtered_province = await Geography.findOne({
                            where: {
                                name: row[titles.indexOf("province")],
                                type: "province"
                            },
                            include: [
                                {
                                    model: Geography,
                                    as: "parent",
                                    where: {
                                        name: row[titles.indexOf("state")],
                                        type: "state"
                                    }
                                }
                            ]
                        });
                        if (filtered_province !== null) {
                            let geographyId = filtered_province.id;
                            console.log('filtered_province - ', filtered_province.parent);
                            if (filtered_province.parent !== null) {
                                const filtered_country = await Geography.findOne({
                                    where: { id: filtered_province.parent.parentId }
                                });
                                if (filtered_country !== null && filtered_country.name === row[titles.indexOf("country")]) {
                                    pos_detail.geographyId = geographyId;
                                }
                            }
                        }
                    }

                    console.log(pos_detail);
                    const is_new = await Pos.create(pos_detail)
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

    getfilterlist: async function (req, res) {
        const { column, filterValue, isFullText } = req.query;
        let data_list = [];
        if (filterValue !== undefined) {
            if (column === 'name' || column === 'address' || column === 'postalCode' || column === 'town' || column === 'phone' || column === 'phone2' || column === 'contact' || column === 'comments') {
                let where_cause = {};
                where_cause[column] = { [Op.like]: "%" + filterValue + "%" };
                let order_cause = [];
                order_cause = ["name", "ASC"];
                const data = await Pos.findAll({
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
            else if (column === 'chainId' || column === 'subChainId') {
                let where_cause = {};
                where_cause['name'] = { [Op.like]: "%" + filterValue + "%" };
                if (column === 'chainId') {
                    where_cause['parentId'] = { [Op.is]: null };
                }
                else {
                    where_cause['parentId'] = { [Op.ne]: null };
                }
                const chain_list = await Chain.findAll({
                    where: where_cause,
                    order: [['name', 'ASC']],
                });
                for (const item of chain_list) {
                    let push_item = { ...item.dataValues };
                    push_item['title'] = push_item['name'];
                    data_list.push(push_item);
                }
            }
            else if (column === 'channelId' || column === 'subChannelId') {
                let where_cause = {};
                where_cause['name'] = { [Op.like]: "%" + filterValue + "%" };
                if (column === 'channelId') {
                    where_cause['parentId'] = { [Op.is]: null };
                }
                else {
                    where_cause['parentId'] = { [Op.ne]: null };
                }
                const channel_list = await Channel.findAll({
                    where: where_cause,
                    order: [['name', 'ASC']],
                });
                for (const item of channel_list) {
                    let push_item = { ...item.dataValues };
                    push_item['title'] = push_item['name'];
                    data_list.push(push_item);
                }
            }
            else if (column === 'zoneId') {
                let where_cause = {};
                where_cause['name'] = { [Op.like]: "%" + filterValue + "%" };
                const data = await Zone.findAll({
                    where: where_cause,
                    order: [['name', 'ASC']],
                });
                for (const item of data) {
                    let push_item = { ...item.dataValues };
                    push_item['title'] = push_item['name'];
                    data_list.push(push_item);
                }
            }
            else if (column === 'country_name' || column === 'state_name' || column === 'province_name') {
                let where_cause = {};
                if (column === 'country_name') {
                    where_cause['type'] = 'country';
                }
                else if (column === 'state_name') {
                    where_cause['type'] = 'state';
                }
                else {
                    where_cause['type'] = 'province';
                }
                where_cause['name'] = { [Op.like]: "%" + filterValue + "%" };
                const data = await Geography.findAll({
                    where: where_cause,
                    order: [['name', 'ASC']],
                });
                for (const item of data) {
                    let push_item = { ...item.dataValues };
                    push_item['title'] = push_item['name'];
                    data_list.push(push_item);
                }
            }
            // else if (column === 'brands') {
            //     let brand_where_cause = {};
            //     brand_where_cause['name'] = { [Op.like]: "%" + filterValue + "%" };
            //     let query_builder_options = {
            //         include: [
            //             (Object.keys(brand_where_cause).length > 0) ? { model: Brand, where: brand_where_cause } : { model: Brand },
            //         ]
            //     }
            //     const data = await BrandZones.findAll(query_builder_options)
            //     for (const item of data) {
            //         let push_item = {
            //             id: item.dataValues.brandId,
            //             title: item.dataValues.brand.name,
            //         }
            //         let filtered_data = data_list.filter(data_item => data_item.id === push_item.id);
            //         if (filtered_data.length === 0) {
            //             data_list.push(push_item);
            //         }
            //     }
            // }
            // else if (column === 'province') {
            //     let query_builder_options = {
            //         include: [
            //             Geography
            //         ]
            //     }
            //     const data = await ZoneGeography.findAll(query_builder_options)
            //     for (const item of data) {
            //         console.log(item.dataValues.geography);
            //         let push_item = {
            //             id: item.dataValues.geographyId,
            //         }
            //         push_item.title = await expensesUtils.getFullGeography(item.dataValues.geography);
            //         let filtered_data = data_list.filter(data_item => data_item.id === push_item.id);
            //         if (filtered_data.length === 0) {
            //             data_list.push(push_item);
            //         }
            //     }
            //     if (filterValue !== '') {
            //         data_list = data_list.filter(item => item.title.toLowerCase().includes(filterValue.toLowerCase()));
            //     }
            // }
            if (filterValue === '' || filterValue === null) {
                data_list = data_list.slice(0, 100);
            }
        }
        return res.json({
            data: data_list,
        })
    },

}
