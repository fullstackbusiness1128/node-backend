const { User, UserBrand, Photo, sequelize, Sequelize } = require('../sequelize')
const Roles = require('../models/user.model').roles
const photoController = require('../controllers/photo')
const Op = Sequelize.Op;


module.exports = {


    index: async function(req, res) {

        const userId = req.params.userId;
        const user = await User.findOne({
            where: {
                id: userId
            }
        })
        if(!user) return res.status(403).send('user not found')

        let alerts = null

        if([Roles.GPV].includes(user.role)) {

        }

        if([Roles.ADMIN, Roles.SUPERVISOR].includes(user.role)) {

        }

        res.status(200).json({
            data: alerts
        })

    }


}
