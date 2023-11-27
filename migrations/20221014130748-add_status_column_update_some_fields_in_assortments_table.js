'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('assortments', { id: Sequelize.INTEGER });
     */
    return Promise.all([
      queryInterface.changeColumn('assortments', 'priority_1', {
        type: Sequelize.ENUM('Yes', 'No'),
        defaultValue: 'Yes'
      }),
      queryInterface.changeColumn('assortments', 'priority_2', {
        type: Sequelize.ENUM('Yes', 'No'),
        defaultValue: 'Yes'
      }),
      queryInterface.changeColumn('assortments', 'novelty', {
        type: Sequelize.ENUM('Yes', 'No'),
        defaultValue: 'Yes'
      }),
      queryInterface.addColumn('assortments', 'status',
        {
          type: Sequelize.ENUM('active', 'inactive'),
          defaultValue: 'active'
        }),
    ])
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('assortments');
     */
    return Promise.all([
      queryInterface.changeColumn('assortments', 'priority_1', {
        type: Sequelize.TINYINT,
        defaultValue: 0
      }),
      queryInterface.changeColumn('assortments', 'priority_2', {
        type: Sequelize.TINYINT,
        defaultValue: 0
      }),
      queryInterface.changeColumn('assortments', 'novelty', {
        type: Sequelize.TINYINT,
        defaultValue: 0
      }),
      queryInterface.removeColumn('assortments', 'status'),
    ])
  }
};
