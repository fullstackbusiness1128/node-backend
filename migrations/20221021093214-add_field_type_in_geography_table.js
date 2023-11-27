'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('geographies', { id: Sequelize.INTEGER });
     */
    return Promise.all([
      queryInterface.addColumn('geographies', 'type',
        {
          type: Sequelize.ENUM('country', 'state', 'province'),
          defaultValue: 'province'
        }),
    ])
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('geographies');
     */
    return Promise.all([
      queryInterface.removeColumn('geographies', 'type'),
    ])
  }
};
