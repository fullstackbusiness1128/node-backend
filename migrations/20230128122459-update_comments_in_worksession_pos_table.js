'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.removeColumn('worksession_pos', 'scheduleComments');
    await queryInterface.removeColumn('worksession_pos', 'reasonComments');
    await queryInterface.addColumn('worksession_pos', 'comments',
      {
        type: Sequelize.TEXT,
        after: "scheduleContactPerson",
      });
    await queryInterface.changeColumn('worksession_pos', 'reasonType',
      {
        type: Sequelize.ENUM('PRESENT', 'PHONE', 'SCHEDULED'),
      });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.changeColumn('worksession_pos', 'reasonType',
      {
        type: Sequelize.STRING,
      });
    await queryInterface.removeColumn('worksession_pos', 'comments');
    await queryInterface.addColumn('worksession_pos', 'reasonComments',
      {
        type: Sequelize.TEXT,
        after: "reasonType",
      });
    await queryInterface.addColumn('worksession_pos', 'scheduleComments',
      {
        type: Sequelize.TEXT,
        after: "scheduleContactPerson",
      });
  }
};
