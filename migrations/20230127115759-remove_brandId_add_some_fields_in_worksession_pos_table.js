'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.removeColumn('worksession_pos', 'brandId');
    await queryInterface.addColumn('worksession_pos', 'reasonType',
      {
        type: Sequelize.STRING,
        after: "visitType",
      });
    await queryInterface.addColumn('worksession_pos', 'reasonComments',
      {
        type: Sequelize.TEXT,
        after: "reasonType",
      });
    await queryInterface.addColumn('worksession_pos', 'scheduleDateTime',
      {
        type: Sequelize.DATE,
        after: "reasonComments",
      });
    await queryInterface.addColumn('worksession_pos', 'scheduleContactPerson',
      {
        type: Sequelize.STRING,
        after: "scheduleDateTime",
      });
    await queryInterface.addColumn('worksession_pos', 'scheduleComments',
      {
        type: Sequelize.TEXT,
        after: "scheduleContactPerson",
      });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('worksession_pos', 'scheduleComments');
    await queryInterface.removeColumn('worksession_pos', 'scheduleContactPerson');
    await queryInterface.removeColumn('worksession_pos', 'scheduleDateTime');
    await queryInterface.removeColumn('worksession_pos', 'reasonComments');
    await queryInterface.removeColumn('worksession_pos', 'reasonType');
    await queryInterface.addColumn('worksession_pos', 'brandId',
      {
        type: Sequelize.INTEGER,
        after: "posId",
      });
    await queryInterface.addConstraint('worksession_pos', {
      fields: ['brandId'],
      type: 'foreign key',
      name: 'worksession_pos_brandId_fkey',
      references: {
        table: 'brands',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  }
};
