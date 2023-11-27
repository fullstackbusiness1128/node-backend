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
    await queryInterface.bulkInsert('holidaypaiddayslimits', [{
      id: 1,
      companyId: 1,
      paidType: "MARRIAGE",
      limitDays: 15,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      id: 2,
      companyId: 1,
      paidType: "BIRTHORADOPTIONOFCHILD",
      limitDays: 4,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      id: 3,
      companyId: 1,
      paidType: "CHANGEHABITUALADDRESS",
      limitDays: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      id: 4,
      companyId: 1,
      paidType: "MARRIEDRELATIVES",
      limitDays: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      id: 5,
      companyId: 1,
      paidType: "DEATHILLNESSHOSPITALFAMILY",
      limitDays: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      id: 6,
      companyId: 2,
      paidType: "MARRIAGE",
      limitDays: 15,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      id: 7,
      companyId: 2,
      paidType: "BIRTHORADOPTIONOFCHILD",
      limitDays: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      id: 8,
      companyId: 2,
      paidType: "CHANGEHABITUALADDRESS",
      limitDays: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      id: 9,
      companyId: 2,
      paidType: "MARRIEDRELATIVES",
      limitDays: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      id: 10,
      companyId: 2,
      paidType: "DEATHILLNESSHOSPITALFAMILY",
      limitDays: 4,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      id: 11,
      companyId: 10001,
      paidType: "MARRIAGE",
      limitDays: 10,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      id: 12,
      companyId: 10001,
      paidType: "BIRTHORADOPTIONOFCHILD",
      limitDays: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      id: 13,
      companyId: 10001,
      paidType: "CHANGEHABITUALADDRESS",
      limitDays: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      id: 14,
      companyId: 10001,
      paidType: "MARRIEDRELATIVES",
      limitDays: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      id: 15,
      companyId: 10001,
      paidType: "DEATHILLNESSHOSPITALFAMILY",
      limitDays: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },], {});
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('holidaypaiddayslimits', { id: 1 });
    await queryInterface.bulkDelete('holidaypaiddayslimits', { id: 2 });
    await queryInterface.bulkDelete('holidaypaiddayslimits', { id: 3 });
    await queryInterface.bulkDelete('holidaypaiddayslimits', { id: 4 });
    await queryInterface.bulkDelete('holidaypaiddayslimits', { id: 5 });
    await queryInterface.bulkDelete('holidaypaiddayslimits', { id: 6 });
    await queryInterface.bulkDelete('holidaypaiddayslimits', { id: 7 });
    await queryInterface.bulkDelete('holidaypaiddayslimits', { id: 8 });
    await queryInterface.bulkDelete('holidaypaiddayslimits', { id: 9 });
    await queryInterface.bulkDelete('holidaypaiddayslimits', { id: 10 });
    await queryInterface.bulkDelete('holidaypaiddayslimits', { id: 11 });
    await queryInterface.bulkDelete('holidaypaiddayslimits', { id: 12 });
    await queryInterface.bulkDelete('holidaypaiddayslimits', { id: 13 });
    await queryInterface.bulkDelete('holidaypaiddayslimits', { id: 14 });
    await queryInterface.bulkDelete('holidaypaiddayslimits', { id: 15 });
  }
};
