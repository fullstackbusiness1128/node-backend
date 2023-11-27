'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.removeConstraint('worksession_surveys', 'worksession_surveys_ibfk_1');
    await queryInterface.removeConstraint('worksession_surveys', 'worksession_survey_unique');
    await queryInterface.removeColumn('worksession_surveys', 'worksessionPosId');

    await queryInterface.addColumn('worksession_surveys', 'worksessionPosBrandId',
      {
        type: Sequelize.INTEGER,
        after: "id",
      });
    await queryInterface.addConstraint('worksession_surveys', {
      fields: ['worksessionPosBrandId'],
      type: 'foreign key',
      name: 'ws_fk_worksessionPosBrandId',
      references: {
        table: 'worksession_pos_brands',
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
    await queryInterface.removeConstraint('worksession_surveys', 'ws_fk_worksessionPosBrandId');
    await queryInterface.removeColumn('worksession_surveys', 'worksessionPosBrandId');

    await queryInterface.addColumn('worksession_surveys', 'worksessionPosId',
      {
        type: Sequelize.INTEGER,
        after: "id",
      });
    await queryInterface.addConstraint('worksession_surveys', {
      fields: ['worksessionPosId'],
      type: 'foreign key',
      name: 'worksession_surveys_ibfk_1',
      references: {
        table: 'worksession_pos',
        field: 'id'
      },
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    await queryInterface.addConstraint('worksession_surveys', {
      fields: ['worksessionPosId', 'surveyId'],
      type: 'unique',
      name: "worksession_survey_unique"
    });
  }
};
