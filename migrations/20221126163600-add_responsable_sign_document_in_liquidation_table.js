'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('liquidations', { id: Sequelize.INTEGER });
     */
    return Promise.all([
      queryInterface.addColumn('liquidations', 'responsable_sign_document',
        {
          type: Sequelize.INTEGER,
          after: "attachment_document",
        }),
      queryInterface.addConstraint('liquidations', {
        fields: ['responsable_sign_document'],
        type: 'foreign key',
        name: 'liquidations_responsable_sign_document_fkey',
        references: {
          table: 'statics',
          field: 'id'
        },
        onDelete: 'set null',
        onUpdate: 'cascade'
      })
    ]);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('liquidations');
     */
    return Promise.all([
      queryInterface.removeConstraint('liquidations', 'liquidations_responsable_sign_document_fkey'),
      queryInterface.removeColumn('liquidations', 'responsable_sign_document'),
    ]);
  }
};
