'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.removeConstraint('worksession_pos', 'worksession_pos_ibfk_1');
    await queryInterface.removeConstraint('worksession_pos', 'worksession_pos_ibfk_2');
    await queryInterface.removeConstraint('worksession_pos', 'worksession_pos_unique');

    await queryInterface.addConstraint('worksession_pos', {
      fields: ['worksessionId'],
      type: 'foreign key',
      name: 'worksession_pos_ibfk_1',
      references: {
        table: 'worksessions',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('worksession_pos', {
      fields: ['posId'],
      type: 'foreign key',
      name: 'worksession_pos_ibfk_2',
      references: {
        table: 'pos',
        field: 'id'
      },
      onDelete: 'cascade',
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
    await queryInterface.addConstraint('worksession_pos', {
      fields: ['worksessionId', 'posId'],
      type: 'unique',
      name: 'worksession_pos_unique'
    });
  }
};
