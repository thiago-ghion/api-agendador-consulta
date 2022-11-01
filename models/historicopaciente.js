'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class HistoricoPaciente extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  HistoricoPaciente.init(
    {
      timestampHistorico: {
        type: DataTypes.DATE,
        primaryKey: true,
        allowNull: false,
      },
      idPaciente: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      textoTipoAcao: { type: DataTypes.STRING(1), allowNull: false },
      nomePaciente: { type: DataTypes.STRING(150), allowNull: false },
      numeroCPF: { type: DataTypes.BIGINT, allowNull: true },
      dataNascimento: { type: DataTypes.DATE, allowNull: true },
      numeroTelefone: { type: DataTypes.BIGINT, allowNull: true },
      enderecoEmail: { type: DataTypes.STRING(255), allowNull: true },
      textoSenha: { type: DataTypes.STRING(8), allowNull: true },
      tipoOrigemCadastro: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      timestamps: false,
      freezeTableName: true,
      modelName: 'HistoricoPaciente',
    }
  );
  return HistoricoPaciente;
};
