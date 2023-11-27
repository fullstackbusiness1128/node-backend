'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('pos', 'photoId',
      {
        type: Sequelize.INTEGER,
      });
    await queryInterface.addConstraint('pos', {
      fields: ['photoId'],
      type: 'foreign key',
      name: 'pos_fk_photoId',
      references: {
        table: 'statics',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeConstraint('pos', 'pos_fk_photoId');
    await queryInterface.removeColumn('pos', 'photoId');
  }
};
