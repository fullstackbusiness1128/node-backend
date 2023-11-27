'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    await queryInterface.bulkUpdate('companies', {
      vatCode: "B-67859413",
      docTemplateName: "liquidation_sign_template_1.docx",
    }, { id: 1 });
    await queryInterface.bulkUpdate('companies', {
      vatCode: "B-66158049",
      docTemplateName: "liquidation_sign_template_2.docx",
    }, { id: 2 });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkUpdate('companies', {
      vatCode: null,
      docTemplateName: null,
    }, { id: 1 });
    await queryInterface.bulkUpdate('companies', {
      vatCode: null,
      docTemplateName: null,
    }, { id: 2 });
  }
};
