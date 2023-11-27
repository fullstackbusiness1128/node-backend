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
    await queryInterface.bulkUpdate('holidaypaiddayslimits', {
      limitDays: 4,
    }, { id: 5 });
    await queryInterface.bulkUpdate('holidaypaiddayslimits', {
      limitDays: 2,
    }, { id: 10 });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkUpdate('holidaypaiddayslimits', {
      limitDays: 2,
    }, { id: 5 });
    await queryInterface.bulkUpdate('holidaypaiddayslimits', {
      limitDays: 4,
    }, { id: 10 });
  }
};
