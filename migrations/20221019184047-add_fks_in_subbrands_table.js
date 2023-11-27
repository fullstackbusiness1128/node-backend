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
      queryInterface.addConstraint('subbrands', {
        fields: ['brandId'],
        type: 'foreign key',
        name: 'subbrands_brandId_fkey',
        references: {
          table: 'brands',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
      queryInterface.addConstraint('subbrands', {
        fields: ['parentId'],
        type: 'foreign key',
        name: 'subbrands_parentId_fkey',
        references: {
          table: 'subbrands',
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
      queryInterface.removeConstraint('subbrands', 'subbrands_brandId_fkey'),
      queryInterface.removeConstraint('subbrands', 'subbrands_parentId_fkey'),
    ]);
  }
};
