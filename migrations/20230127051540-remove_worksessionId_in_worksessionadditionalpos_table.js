'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.removeColumn('worksessionadditionalpos', 'worksessionId');
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.addColumn('worksessionadditionalpos', 'worksessionId',
      {
        type: Sequelize.INTEGER,
        after: "id",
      });
    await queryInterface.addConstraint('worksessionAdditionalPos', {
      fields: ['worksessionId'],
      type: 'foreign key',
      name: 'fkey_wap_worksessionId',
      references: {
        table: 'worksessions',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  }
};
