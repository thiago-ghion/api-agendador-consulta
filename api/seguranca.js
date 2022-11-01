const grupoApi = 'seguranca';
const jwt = require('jsonwebtoken');
const db = require('.././models/index.js');
const logger = require('../util/logger');
const Util = require('../util/Util');
const { OAuth2Client } = require('google-auth-library');
const { registrar } = require('./paciente');
const axios = require('axios');

const SECRET = Buffer.from(process.env.JWT_KEY, 'base64');
const TEMPO_EXPIRACAO = 3000;
const TIPO_ACESSO_PACIENTE_INTERNO = 1;
const TIPO_ACESSO_PACIENTE_EXTERNO = 2;
const TIPO_ACESSO_COLABORADOR = 3;
const CLIENT_ID =
  '483272976648-prjup2c5kf0k8nt35bvq84mcb6dujpl1.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

function registrarMetodos(app, incluirNivelAccesso, passport) {
  const login = (req, res) => {
    req.body.tipoLogin = 1;
    passport.authenticate('local', { session: false }, (err, user, info) => {
      if (err || !user) {
        return res.status(400).send({
          mensagem: err.message,
        });
      }
      req.login(user, { session: false }, (err) => {
        if (err) {
          res.send(err);
        }

        const token = gerarJWT(user, true);
        return res.send(token);
      });
    })(req, res);
  };

  const processarLoginInternoPaciente = async (usuario, senha, done) => {
    logger.info(`Autenticando paciente interno ${usuario}`);
    try {
      const paciente = await db.Paciente.findOne({
        where: { enderecoEmail: usuario },
      });

      if (paciente === null) {
        logger.info(`Usuário/Senha inválido - paciente interno ${usuario}`);
        return done({ mensagem: 'Usuário/Senha inválido' }, null, {});
      }

      if (paciente.textoSenha === senha) {
        logger.info(`Registrando o acesso - paciente interno ${usuario}`);
        await db.RegistroAcesso.create({
          timestampAcesso: db.sequelize.literal('CURRENT_TIMESTAMP'),
          tipoAcesso: TIPO_ACESSO_PACIENTE_INTERNO,
          credencialAcesso: usuario,
        });

        return done(
          null,
          {
            id: paciente.idPaciente,
            usuario: paciente.enderecoEmail,
            nome: paciente.nomePaciente,
            nivelUsuario: 1,
          },
          {}
        );
      } else {
        return done({ mensagem: 'Usuário/Senha inválido' }, null, {});
      }
    } catch (error) {
      logger.error(`Erro na autenticação do paciente interno`, error);
      return done({ mensagem: 'Falha na consulta da autenticação' }, null, {});
    }
  };

  const processarLoginColaborador = async (usuario, senha, done) => {
    logger.info(`Autenticando usuário local ${usuario}`);
    try {
      const colaborador = await db.Colaborador.findOne({
        where: { nomeUsuario: usuario },
      });

      if (colaborador === null) {
        logger.info(`Usuário/Senha inválido - usuário local ${usuario}`);
        return done({ mensagem: 'Usuário/Senha inválido' }, null, {});
      }

      if (
        colaborador.textoSenha === senha &&
        colaborador.indicadorAtivo === 'S'
      ) {
        logger.info(`Registrando o acesso - usuário local ${usuario}`);
        await db.RegistroAcesso.create({
          timestampAcesso: db.sequelize.literal('CURRENT_TIMESTAMP'),
          tipoAcesso: TIPO_ACESSO_COLABORADOR,
          credencialAcesso: usuario,
        });

        if (colaborador.indicadorForcarTrocaSenha === 'S') {
          return done(
            {
              mensagem: 'Usuário deve trocar a senha antes de prosseguir',
              senhaResetada: true,
            },
            null,
            {}
          );
        }

        return done(
          null,
          {
            id: colaborador.idColaborador,
            usuario: colaborador.nomeUsuario,
            nome: colaborador.nomeColaborador,
            nivelUsuario: colaborador.indicadorAdministrador === 'S' ? 3 : 2,
          },
          {}
        );
      } else {
        return done({ mensagem: 'Usuário/Senha inválido' }, null, {});
      }
    } catch (error) {
      logger.error(`Erro na autenticação do usuário local`, error);
      return done({ mensagem: 'Falha na consulta da autenticação' }, null, {});
    }
  };

  const localLogin = async (req, _usuario, senha, done) => {
    const usuario = _usuario.toLocaleLowerCase();

    if (req.body.tipoLogin !== 1 && req.body.tipoLogin !== 2) {
      return done({ mensagem: 'Tipo de autenticação não esperado' }, null, {});
    }

    if (req.body.tipoLogin === 1) {
      return await processarLoginInternoPaciente(usuario, senha, done);
    }

    if (req.body.tipoLogin === 2) {
      return await processarLoginColaborador(usuario, senha, done);
    }
  };

  const LocalStrategy = require('passport-local').Strategy;
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'usuario',
        passwordField: 'senha',
        passReqToCallback: true,
      },
      localLogin
    )
  );

  const validaJWT = (req, jwtPayload, done) => {
    try {
      const nivelUsuarioEndpoint = req.nivelUsuarioEndpoint || 99;

      if (jwtPayload.nivelUsuario < nivelUsuarioEndpoint) {
        logger.info(
          `Usuário não tem acesso para o recurso - ${req.url} - nivelUsuario:${jwtPayload.nivelUsuario} nivelUsuarioEndpoint:${req.nivelUsuarioEndpoint}`,
          jwtPayload
        );
        return done(
          { mensagem: 'Usuário não possui acesso a funcionalidade' },
          null
        );
      }
      return done(null, jwtPayload);
    } catch (error) {
      logger.error('Erro na validação do Token JWT', error);
    }
  };

  const passportJWT = require('passport-jwt');
  const JWTStrategy = passportJWT.Strategy;
  const ExtractJWT = passportJWT.ExtractJwt;

  passport.use(
    new JWTStrategy(
      {
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey: SECRET,
        passReqToCallback: true,
      },
      validaJWT
    )
  );

  const loginURL = `/v1/${grupoApi}/login`;
  app.post(loginURL, (req, res) => {
    login(req, res);
  });
  const loginColaborador = (req, res) => {
    req.body.tipoLogin = 2;
    passport.authenticate('local', { session: false }, (err, user, info) => {
      if (err || !user) {
        if (err.senhaResetada !== undefined) {
          return res.status(400).send({
            mensagem: err.mensagem,
            senhaResetada: true,
          });
        }
        return res.status(400).send({
          mensagem: err.mensagem,
        });
      }
      req.login(user, { session: false }, (err) => {
        if (err) {
          res.send(err);
        }

        const token = gerarJWT(user, true);
        return res.send(token);
      });
    })(req, res);
  };

  const loginPacienteInterno = (req, res) => {
    req.body.tipoLogin = 1;
    passport.authenticate('local', { session: false }, (err, user, info) => {
      if (err || !user) {
        return res.status(400).send({
          mensagem: err.mensagem,
        });
      }
      req.login(user, { session: false }, (err) => {
        if (err) {
          res.send(err);
        }

        const token = gerarJWT(user, true);
        return res.send(token);
      });
    })(req, res);
  };

  app.post(`/v1/${grupoApi}/loginColaborador`, (req, res) => {
    loginColaborador(req, res);
  });

  app.post(`/v1/${grupoApi}/loginPacienteInterno`, (req, res) => {
    loginPacienteInterno(req, res);
  });

  app.post(`/v1/${grupoApi}/trocarSenhaPaciente`, (req, res) => {
    trocarSenhaPaciente(req, res);
  });

  app.post(`/v1/${grupoApi}/trocarSenhaColaborador`, (req, res) => {
    trocarSenhaColaborador(req, res);
  });

  app.post(`/v1/${grupoApi}/oauth/google`, (req, res) => {
    loginGoogle(req, res);
  });

  app.post(`/v1/${grupoApi}/oauth/facebook`, (req, res) => {
    loginFacebook(req, res);
  });

  app.post(`/v1/${grupoApi}/token/introspect/:token`, (req, res) => {
    introspect(req, res);
  });

  const listaAcessoURL = `/v1/${grupoApi}/listaAcesso`;
  incluirNivelAccesso(listaAcessoURL, 3);
  app.get(listaAcessoURL, (req, res) => {
    listarRegistroAcesso(req, res);
  });

  return {
    login,
    localLogin,
    validaJWT,
    loginColaborador,
    loginPacienteInterno,
  };
}

const introspect = (req, res) => {
  jwt.verify(req.params.token, SECRET, (err, decoded) => {
    if (err) {
      res
        .status(400)
        .send({ mensagem: 'Efetue o login novamente, a sessão expirou' });
      return;
    }
    res.send(decoded);
  });
};

function gerarJWT(user, interno) {
  const token = jwt.sign(
    {
      id: user.id,
      usuario: user.usuario,
      nome: user.nome,
      nivelUsuario: user.nivelUsuario,
      isInterno: interno,
    },
    SECRET,
    {
      expiresIn: TEMPO_EXPIRACAO,
    }
  );
  return {
    id: user.id,
    usuario: user.usuario,
    nome: user.nome,
    nivelUsuario: user.nivelUsuario,
    isInterno: interno,
    access_token: token,
  };
}

const trocarSenhaColaborador = async (req, res) => {
  if (req.body.usuario === undefined) {
    res.status(400).send({ mensagem: 'Usuário não informado' });
    return false;
  }

  if (req.body.senhaAnterior === undefined) {
    res
      .status(400)
      .send({ mensagem: 'Senha anterior não foi informada', campo: 1 });
    return false;
  }

  if (!Util.isSenhaValida(req.body.senhaAnterior)) {
    res
      .status(400)
      .send({ mensagem: 'Senha anterior está no formato incorreto', campo: 1 });
    return false;
  }

  if (req.body.senhaNova === undefined) {
    res
      .status(400)
      .send({ mensagem: 'Senha nova não foi informada', campo: 2 });
    return false;
  }

  if (!Util.isSenhaValida(req.body.senhaNova)) {
    res
      .status(400)
      .send({ mensagem: 'Senha nova está no formato incorreto', campo: 2 });
    return false;
  }

  if (req.body.senhaNova === req.body.senhaAnterior) {
    res.status(400).send({
      mensagem: 'Senha nova e anterior são iguais, informe outra senha',
      campo: 2,
    });
    return false;
  }

  try {
    const colaborador = await db.Colaborador.findOne({
      where: {
        nomeUsuario: req.body.usuario.toLocaleLowerCase(),
        textoSenha: req.body.senhaAnterior,
      },
    });

    if (colaborador === null) {
      res.status(400).send({ mensagem: 'Usuário não encontrado' });
      return;
    }

    await db.sequelize.transaction(async (t) => {
      const resposta = {
        id: colaborador.idColaborador,
        nome: colaborador.nomeColaborador,
      };

      await colaborador.update(
        { textoSenha: req.body.senhaNova, indicadorForcarTrocaSenha: 'N' },
        { transaction: t }
      );

      await db.HistoricoColaborador.create(
        {
          timestampHistorico: db.sequelize.literal('CURRENT_TIMESTAMP'),
          textoTipoAcao: 'A',
          idColaborador: colaborador.idColaborador,
          nomeColaborador: colaborador.nomeColaborador,
          nomeUsuario: colaborador.nomeUsuario,
          indicadorAdministrador: colaborador.indicadorAdministrador,
          indicadorAtivo: colaborador.indicadorAtivo,
          indicadorForcarTrocaSenha: 'N',
          textoSenha: req.body.senhaNova,
        },
        { transaction: t }
      );

      res.status(200).send(resposta);
    });
  } catch (error) {
    logger.error('Falha na alteração da senha do colaborador', error);
    res
      .status(400)
      .send({ mensagem: 'Falha na alteração da senha do colaborador' });
  }
};

const trocarSenhaPaciente = async (req, res) => {
  if (req.body.email === undefined) {
    res.status(400).send({ mensagem: 'Email não informado' });
    return false;
  }

  if (req.body.senhaAnterior === undefined) {
    res
      .status(400)
      .send({ mensagem: 'Senha anterior não foi informada', campo: 1 });
    return false;
  }

  if (!Util.isSenhaValida(req.body.senhaAnterior)) {
    res
      .status(400)
      .send({ mensagem: 'Senha anterior está no formato incorreto', campo: 1 });
    return false;
  }

  if (req.body.senhaNova === undefined) {
    res
      .status(400)
      .send({ mensagem: 'Senha nova não foi informada', campo: 2 });
    return false;
  }

  if (!Util.isSenhaValida(req.body.senhaNova)) {
    res
      .status(400)
      .send({ mensagem: 'Senha nova está no formato incorreto', campo: 2 });
    return false;
  }

  if (req.body.senhaNova === req.body.senhaAnterior) {
    res.status(400).send({
      mensagem: 'Senha nova e anterior são iguais, informe outra senha',
      campo: 2,
    });
    return false;
  }

  try {
    const paciente = await db.Paciente.findOne({
      where: {
        enderecoEmail: req.body.email.toLocaleLowerCase(),
        textoSenha: req.body.senhaAnterior,
        tipoOrigemCadastro: 2,
      },
    });

    if (paciente === null) {
      res.status(400).send({ mensagem: 'Email não encontrado' });
      return;
    }

    await db.sequelize.transaction(async (t) => {
      const resposta = {
        id: paciente.idPaciente,
        nome: paciente.nomePaciente,
      };

      await paciente.update(
        { textoSenha: req.body.senhaNova },
        { transaction: t }
      );

      await db.HistoricoPaciente.create(
        {
          timestampHistorico: db.sequelize.literal('CURRENT_TIMESTAMP'),
          textoTipoAcao: 'A',
          idPaciente: paciente.idPaciente,
          numeroPaciente: paciente.numeroPaciente,
          nomePaciente: paciente.nomePaciente,
          numeroCPF: paciente.numeroCPF,
          dataNascimento: paciente.dataNascimento,
          numeroTelefone: paciente.numeroTelefone,
          enderecoEmail: Util.formatarMinusculo(paciente.enderecoEmail),
          tipoOrigemCadastro: paciente.tipoOrigemCadastro,
          textoSenha: paciente.textoSenha,
        },
        { transaction: t }
      );

      res.status(200).send(resposta);
    });
  } catch (error) {
    logger.error('Falha na alteração da senha do paciente', error);
    res
      .status(400)
      .send({ mensagem: 'Falha na alteração da senha do paciente' });
  }
};

const loginFacebook = async (req, res) => {
  try {
    const check = await axios.get(
      `https://graph.facebook.com/me?fields=name,email&access_token=${req.body.credential}`
    );

    logger.info(`Autenticando paciente OAuth Facebook ${check.data.email}`);

    let paciente = await db.Paciente.findOne({
      where: { enderecoEmail: check.data.email },
    });

    if (paciente === null) {
      const req = {
        token: { nivelUsuario: 0 },
        body: {
          enderecoEmail: check.data.email,
          nomePaciente: check.data.name,
        },
      };

      paciente = await registrar(req, res);

      if (!paciente) {
        return;
      }
    }

    await db.RegistroAcesso.create({
      timestampAcesso: db.sequelize.literal('CURRENT_TIMESTAMP'),
      tipoAcesso: TIPO_ACESSO_PACIENTE_EXTERNO,
      credencialAcesso: check.data.email,
    });

    const user = {
      id: paciente.idPaciente,
      usuario: check.data.email,
      nome: check.data.name,
      nivelUsuario: 1,
    };

    const token = gerarJWT(user, false);
    return res.send(token);
  } catch (error) {
    logger.error(`Erro na autenticação do paciente interno`, error);
    res.status(400).send({ mensagem: 'Falha na consulta da autenticação' });
  }
};

const loginGoogle = async (req, res) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: req.body.credential,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();

    logger.info(`Autenticando paciente OAuth Google ${payload.email}`);

    let paciente = await db.Paciente.findOne({
      where: { enderecoEmail: payload.email },
    });

    if (paciente === null) {
      const req = {
        token: { nivelUsuario: 0 },
        body: { enderecoEmail: payload.email, nomePaciente: payload.name },
      };

      paciente = await registrar(req, res);

      if (!paciente) {
        return;
      }
    }

    await db.RegistroAcesso.create({
      timestampAcesso: db.sequelize.literal('CURRENT_TIMESTAMP'),
      tipoAcesso: TIPO_ACESSO_PACIENTE_EXTERNO,
      credencialAcesso: payload.email,
    });

    const user = {
      id: paciente.idPaciente,
      usuario: payload.email,
      nome: payload.name,
      nivelUsuario: 1,
    };

    const token = gerarJWT(user, false);
    return res.send(token);
  } catch (error) {
    logger.error(`Erro na autenticação do paciente interno`, error);
    res.status(400).send({ mensagem: 'Falha na consulta da autenticação' });
  }
};

const listarRegistroAcesso = async (req, res) => {
  try {
    if (req.query.dataInicio === undefined || req.query.dataInicio === 'null') {
      res
        .status(400)
        .send({ mensagem: 'Data início da pesquisa não foi informada' });
      return;
    }

    if (req.query.dataFim === undefined || req.query.dataFim === 'null') {
      res
        .status(400)
        .send({ mensagem: 'Data fim da pesquisa não foi informada' });
      return;
    }

    try {
      if (Util.quantidadeDias(req.query.dataInicio, req.query.dataFim) > 30) {
        res.status(400).send({
          mensagem: 'Consulta deve ter o intervalo máximo de 30 dias',
        });
        return;
      }
    } catch (error) {
      res.status(400).send({ mensagem: error.message });
      return;
    }

    const lista = await db.sequelize.query(
      `
      SELECT  A."timestampAcesso", 
              A."tipoAcesso" , 
              B."textoTipoAcesso", 
              A."credencialAcesso" 
      FROM "RegistroAcesso" A, 
           "TipoAcesso" B
      WHERE A."timestampAcesso" BETWEEN '${Util.converterEmDataInvertida(
        req.query.dataInicio
      )}T00:00:00.000-03:00' 
      AND  '${Util.converterEmDataInvertida(
        req.query.dataFim
      )}T23:59:59.999-03:00'
      AND   A."tipoAcesso"  = B."tipoAcesso"
      `,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    res.send(lista);
  } catch (error) {
    logger.error('Falha na lista de acessos', error);
    res.status(400).send({ mensagem: 'Falha na consulta da lista de acessos' });
  }
};

module.exports = {
  registrarMetodos,
  gerarJWT,
  introspect,
  listarRegistroAcesso,
  trocarSenhaColaborador,
  trocarSenhaPaciente,
  loginFacebook,
  loginGoogle,
};
