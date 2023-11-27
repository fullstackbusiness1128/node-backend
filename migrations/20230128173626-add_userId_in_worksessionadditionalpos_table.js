'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('worksessionadditionalpos', 'userId',
      {
        type: Sequelize.INTEGER,
        after: "id",
      });
    await queryInterface.addConstraint('worksessionadditionalpos', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'wap_fk_userid',
      references: {
        table: 'users',
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
    await queryInterface.removeConstraint('worksessionadditionalpos', 'wap_fk_userid');
    await queryInterface.removeColumn('worksessionadditionalpos', 'userId');
  }
};
