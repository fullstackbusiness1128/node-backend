const roles = {
    ADMIN: 'admin',
    SUBADMIN: 'subadmin',
    STAFF: 'staff',
    BRAND: 'brand',
    MANAGER: 'manager',
    SUPERVISOR: 'spv',
    GPV: 'gpv',
}

const status = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
}

const departments = [
    'Ventas', 'RRHH', 'Finanzas', 'Trade', 'Operaciones', 'MKT', 'Proyectos'
];

const model = (sequelize, type) => {
    return sequelize.define('user', {

        username: {
            type: type.STRING,
            allowNull: false,
        },

        password: {
            type: type.STRING,
            allowNull: false,
        },

        name: type.STRING,

        surname: type.STRING,

        role: {
            type: type.ENUM({
                values: Object.values(roles)
            }),
            allowNull: false,
            defaultValue: roles.GPV,
        },

        // dep_id: type.INTEGER,

        parent_id: type.INTEGER,

        status: {
            type: type.ENUM({
                values: Object.values(status)
            }),
        },

        residence: type.STRING,

        email: type.STRING,

        phone: type.STRING,

        phone_company: type.STRING,

        dni: type.STRING,

        department: {
            type: type.ENUM({
                values: departments
            }),
            allowNull: false,
            defaultValue: 'Ventas',
        },

        start_date: {
            type: type.DATE,
        },

        end_date: {
            type: type.DATE,
        },

        project: type.STRING,

        companyCode: type.INTEGER,

        discount_km: type.INTEGER,

    }, {
        paranoid: true,
        defaultScope: {
            attributes: { exclude: ['password'] },
        }
    })
}

module.exports = {
    model,
    roles,
    status,
    departments
}