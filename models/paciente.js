'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Paciente extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Paciente.init(
    {
      idPaciente: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      nomePaciente: { type: DataTypes.STRING(150), allowNull: false },
      numeroCPF: { type: DataTypes.BIGINT, allowNull: true },
      dataNascimento: { type: DataTypes.DATEONLY, allowNull: true },
      numeroTelefone: { type: DataTypes.BIGINT, allowNull: true },
      enderecoEmail: { type: DataTypes.STRING(255), allowNull: true },
      textoSenha: { type: DataTypes.STRING(8), allowNull: true },
      tipoOrigemCadastro: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'TipoOrigemCadastro', key: 'tipoOrigemCadastro' },
      },
    },
    {
      sequelize,
      timestamps: false,
      freezeTableName: true,
      modelName: 'Paciente',
    }
  );

  return Paciente;
};
