'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('route_pos_inactives', 'date',
      {
        type: Sequelize.DATEONLY,
        after: "id",
      });
    await queryInterface.addColumn('route_pos_inactives', 'responsableId',
      {
        type: Sequelize.INTEGER,
        after: "responsableComments",
      });
    await queryInterface.addColumn('route_pos_inactives', 'adminId',
      {
        type: Sequelize.INTEGER,
        after: "adminComments",
      });
    await queryInterface.addConstraint('route_pos_inactives', {
      fields: ['responsableId'],
      type: 'foreign key',
      name: 'rpi_fk_responsableId',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('route_pos_inactives', {
      fields: ['adminId'],
      type: 'foreign key',
      name: 'rpi_fk_adminId',
      references: {
        table: 'users',
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
    await queryInterface.removeConstraint('route_pos_inactives', 'rpi_fk_adminId');
    await queryInterface.removeConstraint('route_pos_inactives', 'rpi_fk_responsableId');
    await queryInterface.removeColumn('route_pos_inactives', 'adminId');
    await queryInterface.removeColumn('route_pos_inactives', 'responsableId');
    await queryInterface.removeColumn('route_pos_inactives', 'date');
  }
};
