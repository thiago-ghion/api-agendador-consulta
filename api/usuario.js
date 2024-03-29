const grupoApi = 'usuario';
const db = require('.././models/index.js');
const logger = require('../util/logger.js');
const Util = require('../util/Util');

const registrarMetodos = (app, incluirNivelAccesso) => {
  const consultarURL = `/v1/${grupoApi}/consultar`;
  incluirNivelAccesso(consultarURL, 3);
  app.get(consultarURL, (req, res) => {
    consultar(req, res);
  });

  const listarURL = `/v1/${grupoApi}/listar`;
  incluirNivelAccesso(listarURL, 3);
  app.get(listarURL, (req, res) => {
    listar(req, res);
  });

  const registrarURL = `/v1/${grupoApi}/registrar`;
  incluirNivelAccesso(registrarURL, 3);
  app.post(registrarURL, (req, res) => {
    registrar(req, res);
  });

  const alterarURL = `/v1/${grupoApi}/alterar`;
  incluirNivelAccesso(alterarURL, 3);
  app.post(alterarURL, (req, res) => {
    alterar(req, res);
  });

  const resetarSenhaURL = `/v1/${grupoApi}/resetarSenha`;
  incluirNivelAccesso(resetarSenhaURL, 3);
  app.post(resetarSenhaURL, (req, res) => {
    resetarSenha(req, res);
  });
};

const consultar = async (req, res) => {
  const idUsuario = req.query.idUsuario;

  if (idUsuario === undefined) {
    res.status(400).send({ mensagem: 'ID do usuário não informado' });
    return;
  }

  try {
    const colaborador = await db.Colaborador.findOne({
      where: {
        idColaborador: req.query.idUsuario,
      },
    });

    if (colaborador === null) {
      res.status(400).send({ mensagem: 'Usuário não encontrado' });
      return;
    }

    res.send({
      idUsuario: colaborador.idColaborador,
      nomeUsuario: colaborador.nomeUsuario,
      nomeColaborador: colaborador.nomeColaborador,
      isUsuarioAtivo: colaborador.indicadorAtivo,
      isUsuarioAdministrador: colaborador.indicadorAdministrador,
    });
  } catch (error) {
    logger.error('Falha na consulta de usuário', error);
    res.status(400).send({ mensagem: 'Falha na consulta de usuário' });
  }
};

const listar = async (req, res) => {
  try {
    const colaboradores = await db.Colaborador.findAll({
      order: [['idColaborador', 'ASC']],
    });

    res.send(
      colaboradores.map((item) => {
        return {
          idUsuario: item.idColaborador,
          nomeUsuario: item.nomeUsuario,
          nomeColaborador: item.nomeColaborador,
          indicadorAdministrador: item.indicadorAdministrador,
          indicadorAtivo: item.indicadorAtivo,
        };
      })
    );
  } catch (error) {
    logger.error('Falha na consulta de usuário', error);
    res.status(400).send({ mensagem: 'Falha na consulta de usuário' });
  }
};

const isSenhaValida = (senha, res) => {
  if (senha === undefined || senha === '') {
    res
      .status(400)
      .send({ mensagem: 'Senha do usuário não foi preenchida', campo: 3 });
    return false;
  }

  if (!Util.isSenhaValida(senha)) {
    res.status(400).send({
      mensagem:
        'Senha do usuário deve conter 2 letras maiúsculas, 3 minúsculas, 2 números e 1 símbolo especial',
      campo: 3,
    });
    return false;
  }
  return true;
};

const isColaboradorValido = (req, res, validaInclusao) => {
  const { nomeColaborador, nomeUsuario, isUsuarioAdministrador, senha } =
    req.body;

  if (validaInclusao) {
    if (nomeUsuario === undefined || nomeUsuario === '') {
      res
        .status(400)
        .send({ mensagem: 'Nome do usuário não foi preenchido', campo: 1 });
      return false;
    }

    const patternUsuario = '^[a-zA-Z0-9]{5,15}$';

    if (!nomeUsuario.match(patternUsuario)) {
      res.status(400).send({
        mensagem: 'Nome do usuário está no formato incorreto',
        campo: 1,
      });
      return false;
    }
  }

  if (nomeColaborador === undefined || nomeColaborador === '') {
    res
      .status(400)
      .send({ mensagem: 'Nome do colaborador não foi preenchido', campo: 2 });
    return false;
  }

  if (isUsuarioAdministrador === undefined || isUsuarioAdministrador === '') {
    res.status(400).send({
      mensagem: 'Indicador de perfil de administrador não foi preenchido',
    });
    return false;
  }

  if (isUsuarioAdministrador !== 'S' && isUsuarioAdministrador !== 'N') {
    res
      .status(400)
      .send({ mensagem: 'Indicador de perfil de administrador inválido' });
    return false;
  }

  if (validaInclusao) {
    if (!isSenhaValida(senha, res)) {
      return false;
    }
  }

  return true;
};

const registrar = async (req, res) => {
  try {
    if (isColaboradorValido(req, res, true)) {
      const colaborador = await db.Colaborador.findOne({
        where: {
          nomeUsuario: req.body.nomeUsuario.toLowerCase(),
        },
      });

      if (colaborador !== null) {
        res.status(400).send({ mensagem: 'Nome de usuário já existe' });
        return;
      }

      await db.sequelize.transaction(async (t) => {
        const resultado = await db.Colaborador.create(
          {
            nomeColaborador: req.body.nomeColaborador,
            nomeUsuario: req.body.nomeUsuario.toLowerCase(),
            indicadorAdministrador: req.body.isUsuarioAdministrador,
            indicadorAtivo: 'S',
            indicadorForcarTrocaSenha: 'N',
            textoSenha: req.body.senha,
          },
          { transaction: t }
        );

        const resposta = {
          idUsuario: resultado.idColaborador,
          nomeUsuario: resultado.nomeUsuario,
          nomeColaborador: resultado.nomeColaborador,
          isUsuarioAtivo: resultado.indicadorAtivo,
          isUsuarioAdministrador: resultado.indicadorAdministrador,
        };

        await db.HistoricoColaborador.create(
          {
            timestampHistorico: db.sequelize.literal('CURRENT_TIMESTAMP'),
            textoTipoAcao: 'I',
            idColaborador: resultado.idColaborador,
            nomeColaborador: req.body.nomeColaborador,
            nomeUsuario: req.body.nomeUsuario.toLowerCase(),
            indicadorAdministrador: req.body.isUsuarioAdministrador,
            indicadorAtivo: 'S',
            indicadorForcarTrocaSenha: 'N',
            textoSenha: req.body.senha,
          },
          { transaction: t }
        );

        res.status(201).send(resposta);
      });
    }
  } catch (err) {
    res.status(400).send({ mensagem: 'Falha na inclusão do usuário' });
  }
};

const alterar = async (req, res) => {
  try {
    if (isColaboradorValido(req, res, false)) {
      const colaborador = await db.Colaborador.findOne({
        where: {
          idColaborador: req.body.idUsuario,
        },
      });

      if (colaborador === null) {
        res.status(400).send({ mensagem: 'Usuário não encontrado' });
        return;
      }

      await db.sequelize.transaction(async (t) => {
        await colaborador.update(
          {
            nomeColaborador: req.body.nomeColaborador,
            indicadorAdministrador: req.body.isUsuarioAdministrador,
            indicadorAtivo: req.body.isUsuarioAtivo,
          },
          { transaction: t }
        );

        const resposta = {
          idUsuario: colaborador.idColaborador,
          nomeUsuario: colaborador.nomeUsuario,
          nomeColaborador: colaborador.nomeColaborador,
          isUsuarioAtivo: colaborador.indicadorAtivo,
          isUsuarioAdministrador: colaborador.indicadorAdministrador,
        };

        await db.HistoricoColaborador.create(
          {
            timestampHistorico: db.sequelize.literal('CURRENT_TIMESTAMP'),
            textoTipoAcao: 'A',
            idColaborador: colaborador.idColaborador,
            nomeColaborador: colaborador.nomeColaborador,
            nomeUsuario: colaborador.nomeUsuario,
            indicadorAdministrador: colaborador.indicadorAdministrador,
            indicadorAtivo: colaborador.indicadorAtivo,
            indicadorForcarTrocaSenha: colaborador.indicadorForcarTrocaSenha,
            textoSenha: colaborador.textoSenha,
          },
          { transaction: t }
        );

        res.send(resposta);
      });
    }
  } catch (err) {
    res.status(400).send({ mensagem: 'Falha na alteração do usuário' });
  }
};

const resetarSenha = async (req, res) => {
  try {
    const colaborador = await db.Colaborador.findOne({
      where: {
        idColaborador: req.body.idUsuario,
      },
    });

    if (colaborador === null) {
      res.status(400).send({ mensagem: 'Usuário não encontrado' });
      return;
    }

    if (!isSenhaValida(req.body.senha, res)) {
      res.status(400).send({ mensagem: 'Senha fora do padrão' });
      return;
    }

    await db.sequelize.transaction(async (t) => {
      await colaborador.update(
        {
          textoSenha: req.body.senha,
          indicadorForcarTrocaSenha: 'S',
        },
        { transaction: t }
      );

      const resposta = {
        idUsuario: colaborador.idColaborador,
        nomeUsuario: colaborador.nomeUsuario,
        nomeColaborador: colaborador.nomeColaborador,
        isUsuarioAtivo: colaborador.indicadorAtivo,
        isUsuarioAdministrador: colaborador.indicadorAdministrador,
      };

      await db.HistoricoColaborador.create(
        {
          timestampHistorico: db.sequelize.literal('CURRENT_TIMESTAMP'),
          textoTipoAcao: 'A',
          idColaborador: colaborador.idColaborador,
          nomeColaborador: colaborador.nomeColaborador,
          nomeUsuario: colaborador.nomeUsuario,
          indicadorAdministrador: colaborador.indicadorAdministrador,
          indicadorAtivo: colaborador.indicadorAtivo,
          indicadorForcarTrocaSenha: colaborador.indicadorForcarTrocaSenha,
          textoSenha: colaborador.textoSenha,
        },
        { transaction: t }
      );

      res.send(resposta);
    });
  } catch (error) {
    logger.error('Falha na reinicialização da senha do usuário', error);
    res
      .status(400)
      .send({ mensagem: 'Falha na reinicialização da senha do usuário' });
  }
};

module.exports = {
  registrarMetodos,
  consultar,
  listar,
  registrar,
  alterar,
  resetarSenha,
  isSenhaValida,
  isColaboradorValido,
};
