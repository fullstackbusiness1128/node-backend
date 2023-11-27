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
      codeNum: 2,
    }, { id: 1 });
    await queryInterface.bulkUpdate('companies', {
      codeNum: 1,
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
      codeNum: null,
    }, { id: 1 });
    await queryInterface.bulkUpdate('companies', {
      codeNum: null,
    }, { id: 2 });
  }
};
