'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('holidays', 'paidType',
      {
        type: Sequelize.ENUM('MARRIAGE', 'BIRTHORADOPTIONOFCHILD', 'CHANGEHABITUALADDRESS', 'MARRIEDRELATIVES', 'DEATHILLNESSHOSPITALFAMILY'),
        after: "status",
      });
    await queryInterface.addColumn('holidays', 'holidayType',
      {
        type: Sequelize.ENUM('VACATION', 'PAIDLEAVE'),
        defaultValue: 'VACATION',
        after: "status",
      });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('holidays', 'holidayType');
    await queryInterface.removeColumn('holidays', 'paidType');
  }
};
