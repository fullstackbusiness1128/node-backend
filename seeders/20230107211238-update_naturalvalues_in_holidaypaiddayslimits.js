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
      isNatural: true,
    }, { id: 1 });
    await queryInterface.bulkUpdate('holidaypaiddayslimits', {
      isNatural: true,
    }, { id: 6 });
    await queryInterface.bulkUpdate('holidaypaiddayslimits', {
      isNatural: true,
    }, { id: 11 });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkUpdate('holidaypaiddayslimits', {
      isNatural: false,
    }, { id: 1 });
    await queryInterface.bulkUpdate('holidaypaiddayslimits', {
      isNatural: false,
    }, { id: 6 });
    await queryInterface.bulkUpdate('holidaypaiddayslimits', {
      isNatural: false,
    }, { id: 11 });
  }
};
