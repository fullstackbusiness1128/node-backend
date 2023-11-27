const { User, Sequelize } = require('../sequelize')
const Op = Sequelize.Op;
const Fn = Sequelize.fn;


module.exports = {


    findById: async function (id) {
        return await User.findOne({
            where: { id },
            include: []
        })
    },

    login: async function (email, password) {
        return await User.findOne({
            where: {
                [Op.and]: [{ email }, { password }, { status: "active" }],
            },
        })
    },

}
