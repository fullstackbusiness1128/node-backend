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
      queryInterface.addColumn('brands', 'parentId',
        {
          type: Sequelize.INTEGER,
        }),
      queryInterface.addConstraint('brands', {
        fields: ['parentId'],
        type: 'foreign key',
        name: 'brands_parentId_fkey',
        references: {
          table: 'brands',
          field: 'id'
        },
        onDelete: 'set null',
        onUpdate: 'cascade'
      }),
    ]);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return Promise.all([
      queryInterface.removeConstraint('brands', 'brands_parentId_fkey'),
      queryInterface.removeColumn('brands', 'parentId'),
    ]);
  }
};
