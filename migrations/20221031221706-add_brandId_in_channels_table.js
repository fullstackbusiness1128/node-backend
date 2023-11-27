'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return Promise.all([
      queryInterface.addColumn('channels', 'brandId',
        {
          type: Sequelize.INTEGER,
          after: "name",
        }),
      queryInterface.addConstraint('channels', {
        fields: ['brandId'],
        type: 'foreign key',
        name: 'channels_brandId_fkey',
        references: {
          table: 'brands',
          field: 'id'
        },
        onDelete: 'set null',
        onUpdate: 'cascade'
      })
    ])
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return Promise.all([
      queryInterface.removeConstraint('channels', 'channels_brandId_fkey'),
      queryInterface.removeColumn('channels', 'brandId'),
    ])
  }
};
