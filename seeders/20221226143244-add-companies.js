'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    await queryInterface.bulkInsert('companies', [{
      id: 1,
      name: "GENNERA FUERZA DE PROFESIONAL SL.",
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      id: 2,
      name: "GENNERA FUERZA DE VENTA S.L.",
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('companies', { id: 2 });
    await queryInterface.bulkDelete('companies', { id: 1 });
  }
};
