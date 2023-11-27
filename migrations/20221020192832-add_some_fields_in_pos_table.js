'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return Promise.all([
      queryInterface.addColumn('pos', 'latitude',
        {
          type: Sequelize.STRING
        }),
      queryInterface.addColumn('pos', 'longitude',
        {
          type: Sequelize.STRING
        }),
      queryInterface.addColumn('pos', 'comments',
        {
          type: Sequelize.STRING
        }),
      queryInterface.addColumn('pos', 'chainId',
        {
          type: Sequelize.INTEGER,
        }),
      queryInterface.addColumn('pos', 'subChainId',
        {
          type: Sequelize.INTEGER,
        }),
      queryInterface.addColumn('pos', 'channelId',
        {
          type: Sequelize.INTEGER,
        }),
      queryInterface.addColumn('pos', 'subChannelId',
        {
          type: Sequelize.INTEGER,
        }),
      queryInterface.addColumn('pos', 'status',
        {
          type: Sequelize.ENUM('active', 'inactive'),
          defaultValue: 'active'
        }),
      queryInterface.addConstraint('pos', {
        fields: ['chainId'],
        type: 'foreign key',
        name: 'pos_chainId_fkey',
        references: {
          table: 'chains',
          field: 'id'
        },
        onDelete: 'set null',
        onUpdate: 'cascade'
      }),
      queryInterface.addConstraint('pos', {
        fields: ['subChainId'],
        type: 'foreign key',
        name: 'pos_subChainId_fkey',
        references: {
          table: 'chains',
          field: 'id'
        },
        onDelete: 'set null',
        onUpdate: 'cascade'
      }),
      queryInterface.addConstraint('pos', {
        fields: ['channelId'],
        type: 'foreign key',
        name: 'pos_channelId_fkey',
        references: {
          table: 'channels',
          field: 'id'
        },
        onDelete: 'set null',
        onUpdate: 'cascade'
      }),
      queryInterface.addConstraint('pos', {
        fields: ['subChannelId'],
        type: 'foreign key',
        name: 'pos_subChannelId_fkey',
        references: {
          table: 'channels',
          field: 'id'
        },
        onDelete: 'set null',
        onUpdate: 'cascade'
      }),
    ])
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return Promise.all([
      queryInterface.removeConstraint('pos', 'pos_chainId_fkey'),
      queryInterface.removeConstraint('pos', 'pos_subChainId_fkey'),
      queryInterface.removeConstraint('pos', 'pos_channelId_fkey'),
      queryInterface.removeConstraint('pos', 'pos_subChannelId_fkey'),
      queryInterface.removeColumn('pos', 'latitude'),
      queryInterface.removeColumn('pos', 'longitude'),
      queryInterface.removeColumn('pos', 'comments'),
      queryInterface.removeColumn('pos', 'chainId'),
      queryInterface.removeColumn('pos', 'subChainId'),
      queryInterface.removeColumn('pos', 'channelId'),
      queryInterface.removeColumn('pos', 'subChannelId'),
      queryInterface.removeColumn('pos', 'status'),
    ])
  }
};
