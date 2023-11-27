const moment = require('moment')
const { Sequelize, User } = require('./sequelize')
const Op = Sequelize.Op;

const Self = {
    costPerKM: 0.236,
    deductAmountPerdayKM: 18,
    holidaysPerYear: 22,
    staticPublicHolidays: [
        "01-01",
        "01-06",
        "08-15",
        "10-12",
        "11-01",
        "12-06",
        "12-08",
        "12-25"
    ],
    spainish_short_month: [
        "ENE",
        "FEB",
        "MAR",
        "ABR",
        "MAY",
        "JUN",
        "JUL",
        "AGO",
        "SEPT",
        "OCT",
        "NOV",
        "DIC",
    ],
    expenseTypeAccountCode: {
        1: 629005230,   // Toll
        2: 629005200,   // Parking
        3: 629005230,   // Peaje
        4: 629005220,   // parking - taxi
        5: 629005220,   // Gasolina
        6: 629005200,   // Dietas
        7: 629000600,   // Compra Muestra de Producto
        8: 629000001,   // Material de Oficina
        9: 629000004,   // Correos y Mensajeria,
        km: 629005210,
        
        gpv_spv_km: 629005210,
        notgspv_km: 629005110,
        
        gpv_spv_travel_hotel: 629005240,
        notgspv_travel_hotel: 629005140,
        
        gpv_spv_peaje: 629005230,
        notgspv_peaje: 629005130,
        
        gpv_spv_parkingfoodtaxi: 629005200,
        notgspv_parkingfoodtaxi: 629005100,
        
        gpv_spv_gasolina: 629005220,
        notgspv_gasolina: 629005120,
        
        gpv_spv_exit: 521000100,
        notgspv_exit: 521000100,
    },

    round2(num) {
        const ret = Math.round(num * 100) / 100
        return isNaN(ret) ? null : ret
    },

    avg(sum, total) {
        return Self.round2(Number(sum) / Number(total))
    },

    pct(a, b) {
        const avg = Self.avg(a, b)
        return avg ? Math.round(avg * 100 * 100) / 100 : null
    },

    capitalize(txt) {
        if (!txt) return txt
        return txt.charAt(0).toUpperCase() + txt.slice(1)
    },

    now() {
        return moment()
    },

    /**
        Converts date to a custom calendar of 2*7*13 = 365 structure.
        Starting first monday of year
     */
    convertDate(date) {
        //finding first monday of year

        function getFirstMondayYear(date) {
            const MONDAY_IDX = 1
            const firstDayYear = moment(date).startOf('year')
            let diff = firstDayYear.day() - MONDAY_IDX
            diff = diff <= 0 ? Math.abs(diff) : 7 - diff
            return moment(firstDayYear).add(diff, 'days')
        }

        const WEEK_SIZE = 7
        const PERIOD_SIZE_DAYS = WEEK_SIZE * 4
        const firstMondayYear = getFirstMondayYear(date)
        const mDate = moment(date)
        const daysDiff = mDate.diff(firstMondayYear, 'days')

        let year, period, week, day

        if (daysDiff >= 0) {
            year = mDate.year()
            period = Math.floor(daysDiff / PERIOD_SIZE_DAYS) + 1
            const mod = daysDiff % PERIOD_SIZE_DAYS
            week = Math.floor(mod / WEEK_SIZE) + 1
            day = mod % WEEK_SIZE

        } else { //daysDiff < 0
            year = mDate.year() - 1
            period = 13
            week = 4
            day = 7 + daysDiff
        }

        return { year, period, week, day }
    },

    getAllUserChildren: async function (userId, childList) {
        let children = await User.findOne({
            where: { id: userId },
            include: [
                { model: User, as: 'Children' }
            ]
        });
        if (children.Children && children.Children.length > 0) {
            for (const child of children.Children) {
                if (!childList.includes(child.id)) {
                    childList.push(child.id);
                    await Self.getAllUserChildren(child.id, childList);
                }
            }
        }
        return childList;
    },

    get_inactive_user_where_cause: async function (user) {
        const { id, role } = user;
        let where_cause = {};
        if (role !== 'admin') {
            let user_list = await Self.getAllUserChildren(id, []);
            if (user_list.length > 0) {
                where_cause['userId'] = { [Op.or]: user_list }
            } else {
                where_cause['userId'] = id;
            }
        }
        return where_cause;
    },

    get_visitdays_user_where_cause: async function (user) {
        const { id, role } = user;
        let where_cause = {};
        if (role !== 'admin') {
            let user_list = await Self.getAllUserChildren(id, []);
            if (user_list.length > 0) {
                where_cause['userId'] = { [Op.or]: user_list }
            } else {
                where_cause['userId'] = id;
            }
        }
        return where_cause;
    },

    get_new_pos_request_user_where_cause: async function (user) {
        const { id, role } = user;
        let where_cause = {};
        if (role !== 'admin') {
            let user_list = await Self.getAllUserChildren(id, []);
            if (user_list.length > 0) {
                where_cause['userId'] = { [Op.or]: user_list }
            } else {
                where_cause['userId'] = id;
            }
        }
        return where_cause;
    },

    /****** 
     *  input -> Object {key1: value1, key2: value2 ...} 
     *  output -> Array [
     *      {value: key1, label: value1}, 
     *      {value: key1, label: value1}, 
     *      ...
     *  ]
     * 
     *******/
    convertObjectToSpecific: function (data) {
        let list = [];
        for (const [key, value] of Object.entries(data)) {
            let push_item = {};
            push_item['value'] = key;
            push_item['label'] = value;
            list.push(push_item);
        }
        return list;
    },

    getObjectValueList: function (data) {
        let list = [];
        for (const [key, value] of Object.entries(data)) {
            if (value !== null) list.push(value);
        }
        return list;
    }

}

module.exports = Self