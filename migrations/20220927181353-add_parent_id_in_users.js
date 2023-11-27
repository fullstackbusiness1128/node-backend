'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return Promise.all([
      queryInterface.addColumn('users', 'parent_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true
        }).then(() => {
          queryInterface.addConstraint('users', {
            fields: ['parent_id'],
            type: 'foreign key',
            name: 'users_parent_id_fkey',
            references: {
              table: 'users',
              field: 'id'
            },
            onDelete: 'set null',
            onUpdate: 'cascade'
          })
        }),
    ]);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return Promise.all([
      queryInterface.removeColumn('users', 'parent_id'),
    ]);
  }
};
