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
    await queryInterface.bulkDelete('expense_types', { id: 7 });
    await queryInterface.bulkInsert('expense_types', [{
      id: 7,
      name: "Compra Muestra de Producto",
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
    await queryInterface.bulkInsert('expense_types', [{
      id: 8,
      name: "Material de Oficina",
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
    await queryInterface.bulkInsert('expense_types', [{
      id: 9,
      name: "Correos y Mensajería",
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('expense_types', { id: 9 });
    await queryInterface.bulkDelete('expense_types', { id: 8 });
    await queryInterface.bulkDelete('expense_types', { id: 7 });
    await queryInterface.bulkInsert('expense_types', [{
      id: 7,
      name: "Otros",
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  }
};
