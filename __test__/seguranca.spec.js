const apoioTeste = require('./apoioTeste');
let mockListaColaborador = null;
let mockColaborador = null;
let mockQuery = null;
let mockCreateRegistroAcesso = null;
let objetoDone = {};

jest.mock('../models/index.js', () => ({
  sequelize: {
    transaction: async (funcao) => {
      return funcao();
    },
    literal: () => '',
    query: (sql) => {
      if (typeof mockQuery === 'function') {
        return mockQuery(sql);
      }
      return mockQuery;
    },
    QueryTypes: {
      SELECT: '',
    },
  },
  Colaborador: {
    findAll: () => {
      return mockListaColaborador;
    },
    findOne: () => {
      return mockColaborador;
    },
    create: () => {
      return new Promise((resolve, reject) => {
        resolve({ idColaborador: 1 });
      });
    },
  },
  HistoricoColaborador: {
    create: () => {
      return new Promise((resolve, reject) => {
        resolve();
      });
    },
  },
  RegistroAcesso: {
    create: (objeto) => {
      if (typeof mockCreateRegistroAcesso === 'function') {
        return mockCreateRegistroAcesso(objeto);
      }
      return mockCreateRegistroAcesso;
    },
  },
}));

const carregarAmbiente = (passportMock) => {
  const seguranca = require('../api/seguranca.js');
  const app = { get: jest.fn(), post: jest.fn() };

  const passport = passportMock || {
    use: jest.fn(),
    authenticate: (tipo, parametros, funcao) => {
      return () => {
        funcao(undefined, {});
      };
    },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  const metodos = seguranca.registrarMetodos(app, jest.fn(), passport);

  const done = (param1, param2, param3) => {
    objetoDone = { param1, param2, param3 };
  };

  return { resposta, res, passport, metodos, done };
};

beforeEach(() => {
  mockListaColaborador = null;
  mockColaborador = null;
  mockQuery = null;
  mockCreateRegistroAcesso = null;
  objetoDone = {};
});

describe('Parte comum', () => {
  test('Registrar método', () => {
    const seguranca = require('../api/seguranca.js');

    const app = apoioTeste.gerarApp();
    jest.spyOn(app, 'get');
    jest.spyOn(app, 'post');

    const passport = {
      use: jest.fn(),
      authenticate: jest.fn(),
    };

    try {
      seguranca.registrarMetodos(app, jest.fn(), passport);
    } catch {}

    expect(app.get).toHaveBeenCalled();
    expect(app.post).toHaveBeenCalled();
  });
});

describe('gerarJWT', () => {
  test('Gerar token', () => {
    const seguranca = require('../api/seguranca.js');

    const token = seguranca.gerarJWT({
      id: 1,
      usuario: 'teste',
      nome: 'Ciclano da Silva',
      nivelUsuario: 3,
    });

    expect(token).toBeDefined();
    expect(token.access_token).toBeDefined();
  });
});

describe('introspect', () => {
  test('Token inválido', () => {
    const seguranca = require('../api/seguranca.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    seguranca.introspect({ params: { token: 'al;asd;lkas;laskdalsk' } }, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Token válido', () => {
    const seguranca = require('../api/seguranca.js');

    const token = seguranca.gerarJWT({
      id: 1,
      usuario: 'teste',
      nome: 'Ciclano da Silva',
      nivelUsuario: 3,
    });

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    seguranca.introspect({ params: { token: token.access_token } }, res);

    expect(res.status).not.toHaveBeenLastCalledWith(400);
  });
});

describe('listarRegistroAcesso', () => {
  test('Data inicio não informada', async () => {
    const seguranca = require('../api/seguranca.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.listarRegistroAcesso({ query: {} }, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Data inicio inválida', async () => {
    const seguranca = require('../api/seguranca.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.listarRegistroAcesso({ query: { dataInicio: null } }, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Data fim não informada', async () => {
    const seguranca = require('../api/seguranca.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.listarRegistroAcesso(
      { query: { dataInicio: '02.02.2020' } },
      res
    );

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Data fim inválida', async () => {
    const seguranca = require('../api/seguranca.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.listarRegistroAcesso(
      { query: { dataInicio: '02.02.2020', dataFim: null } },
      res
    );

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Intervalo de pesquisa superior ao permitido', async () => {
    const seguranca = require('../api/seguranca.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.listarRegistroAcesso(
      { query: { dataInicio: '02.02.2020', dataFim: '02.12.2020' } },
      res
    );

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Lista com erro', async () => {
    const seguranca = require('../api/seguranca.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockQuery = new Promise((resolve) => {
      reject({});
    });

    await seguranca.listarRegistroAcesso(
      { query: { dataInicio: '02.02.2020', dataFim: '02.02.2020' } },
      res
    );

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Lista com sucesso', async () => {
    const seguranca = require('../api/seguranca.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockQuery = new Promise((resolve) => {
      resolve({});
    });

    await seguranca.listarRegistroAcesso(
      { query: { dataInicio: '02.02.2020', dataFim: '02.02.2020' } },
      res
    );

    expect(res.status).not.toHaveBeenLastCalledWith(400);
  });
});

describe('trocarSenhaColaborador', () => {
  test('Usuário não informado', async () => {
    const seguranca = require('../api/seguranca.js');

    const requisicao = { body: {} };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.trocarSenhaColaborador(requisicao, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Senha anterior não informada', async () => {
    const seguranca = require('../api/seguranca.js');

    const requisicao = { body: { usuario: 'teste' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.trocarSenhaColaborador(requisicao, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Senha anterior inválida', async () => {
    const seguranca = require('../api/seguranca.js');

    const requisicao = { body: { usuario: 'teste', senhaAnterior: '1234' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.trocarSenhaColaborador(requisicao, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Senha nova não informada', async () => {
    const seguranca = require('../api/seguranca.js');

    const requisicao = {
      body: { usuario: 'teste', senhaAnterior: 'ABcde12#' },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.trocarSenhaColaborador(requisicao, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Senha nova inválida', async () => {
    const seguranca = require('../api/seguranca.js');

    const requisicao = {
      body: { usuario: 'teste', senhaAnterior: 'ABcde12#', senhaNova: '1234' },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.trocarSenhaColaborador(requisicao, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Senha anterior e nova iguais', async () => {
    const seguranca = require('../api/seguranca.js');

    const requisicao = {
      body: {
        usuario: 'teste',
        senhaAnterior: 'ABcde12#',
        senhaNova: 'ABcde12#',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.trocarSenhaColaborador(requisicao, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Colaborador não encontrado', async () => {
    const seguranca = require('../api/seguranca.js');

    const requisicao = {
      body: {
        usuario: 'teste',
        senhaAnterior: 'ABcde12#',
        senhaNova: 'ABcde13#',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.trocarSenhaColaborador(requisicao, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Senha alterada com sucesso', async () => {
    const seguranca = require('../api/seguranca.js');

    mockColaborador = { update: jest.fn() };

    const requisicao = {
      body: {
        usuario: 'teste',
        senhaAnterior: 'ABcde12#',
        senhaNova: 'ABcde13#',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.trocarSenhaColaborador(requisicao, res);

    expect(res.status).toHaveBeenLastCalledWith(200);
  });

  test('Senha alterada com falha', async () => {
    const seguranca = require('../api/seguranca.js');

    mockColaborador = {
      update: () => {
        throw new Error();
      },
    };

    const requisicao = {
      body: {
        usuario: 'teste',
        senhaAnterior: 'ABcde12#',
        senhaNova: 'ABcde13#',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.trocarSenhaColaborador(requisicao, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });
});

describe('registrarMetodos', () => {
  test('Login com erro', async () => {
    const seguranca = require('../api/seguranca.js');
    const app = { get: jest.fn(), post: jest.fn() };

    const passport = {
      use: jest.fn(),
      authenticate: (tipo, parametros, funcao) => {
        return () => {
          funcao({ message: '' });
        };
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const metodos = seguranca.registrarMetodos(app, jest.fn(), passport);
    const req = { body: {} };
    metodos.login(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Login com sucesso', async () => {
    const seguranca = require('../api/seguranca.js');
    const app = { get: jest.fn(), post: jest.fn() };

    const passport = {
      use: jest.fn(),
      authenticate: (tipo, parametros, funcao) => {
        return () => {
          funcao(undefined, {});
        };
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const metodos = seguranca.registrarMetodos(app, jest.fn(), passport);
    const req = {
      body: {},
      login: (usuario, parametros, funcao) => {
        funcao();
      },
    };
    metodos.login(req, res);
    expect(res.status).not.toHaveBeenLastCalledWith(400);
  });

  test('Login com falha', async () => {
    const seguranca = require('../api/seguranca.js');
    const app = { get: jest.fn(), post: jest.fn() };

    const passport = {
      use: jest.fn(),
      authenticate: (tipo, parametros, funcao) => {
        return () => {
          funcao(undefined, {});
        };
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const metodos = seguranca.registrarMetodos(app, jest.fn(), passport);
    const req = {
      body: {},
      login: (usuario, parametros, funcao) => {
        funcao({ message: 'Erro' });
      },
    };
    metodos.login(req, res);
    expect(res.status).not.toHaveBeenLastCalledWith(400);
  });
});

describe('localLogin', () => {
  test('Tipo de autenticação inválido', async () => {
    const { resposta, res, passport, metodos, done } = carregarAmbiente();

    const req = { body: { tipoLogin: 3 } };
    await metodos.localLogin(req, '', undefined, done);

    expect(objetoDone.param1 !== undefined).toBeTruthy();
    expect(objetoDone.param1.mensagem !== undefined).toBeTruthy();
  });

  test('Colaborador não encontrado', async () => {
    const { resposta, res, passport, metodos, done } = carregarAmbiente();

    mockColaborador = null;
    const req = { body: { tipoLogin: 2 } };
    await metodos.localLogin(req, 'teste', undefined, done);

    expect(objetoDone.param1 !== undefined).toBeTruthy();
    expect(objetoDone.param1.mensagem !== undefined).toBeTruthy();
  });

  test('Colaborador informou senha inválida', async () => {
    const { resposta, res, passport, metodos, done } = carregarAmbiente();

    mockColaborador = { textoSenha: '1234', indicadorAtivo: 'S' };
    const req = { body: { tipoLogin: 2 } };
    await metodos.localLogin(req, 'teste', '4321', done);

    expect(objetoDone.param1 !== undefined).toBeTruthy();
    expect(objetoDone.param1.mensagem !== undefined).toBeTruthy();
  });

  test('Colaborador informou senha válida, mas usuário desativado', async () => {
    const { resposta, res, passport, metodos, done } = carregarAmbiente();

    mockColaborador = { textoSenha: '1234', indicadorAtivo: 'N' };
    const req = { body: { tipoLogin: 2 } };
    await metodos.localLogin(req, 'teste', '1234', done);

    expect(objetoDone.param1 !== undefined).toBeTruthy();
    expect(objetoDone.param1.mensagem !== undefined).toBeTruthy();
  });

  test('Colaborador informou senha válida, usuário ativo e indicador de forçar a troca de senha', async () => {
    const { resposta, res, passport, metodos, done } = carregarAmbiente();

    mockColaborador = {
      textoSenha: '1234',
      indicadorAtivo: 'S',
      indicadorForcarTrocaSenha: 'S',
    };
    mockCreateRegistroAcesso = new Promise((resolve) => {
      resolve();
    });
    const req = { body: { tipoLogin: 2 } };
    await metodos.localLogin(req, 'teste', '1234', done);

    expect(objetoDone.param1 !== undefined).toBeTruthy();
    expect(objetoDone.param1.mensagem !== undefined).toBeTruthy();
  });

  test('Colaborador fez login com sucesso', async () => {
    const { resposta, res, passport, metodos, done } = carregarAmbiente();

    mockColaborador = {
      textoSenha: '1234',
      indicadorAtivo: 'S',
      indicadorForcarTrocaSenha: 'N',
    };
    mockCreateRegistroAcesso = new Promise((resolve) => {
      resolve();
    });
    const req = { body: { tipoLogin: 2 } };
    await metodos.localLogin(req, 'teste', '1234', done);

    expect(objetoDone.param1 == undefined).toBeTruthy();
  });

  test('Colaborador fez login que falhou', async () => {
    const { resposta, res, passport, metodos, done } = carregarAmbiente();

    mockColaborador = {
      textoSenha: '1234',
      indicadorAtivo: 'S',
      indicadorForcarTrocaSenha: 'N',
    };
    mockCreateRegistroAcesso = new Promise((resolve, reject) => {
      reject();
    });
    const req = { body: { tipoLogin: 2 } };
    await metodos.localLogin(req, 'teste', '1234', done);

    expect(objetoDone['param1'] !== undefined).toBeTruthy();
    expect(objetoDone['param1'].mensagem !== undefined).toBeTruthy();
  });
});

describe('validaJWT', () => {
  test('Nível de acesso do usuário é inferior ao nível exigido pelo endpoint', () => {
    const { resposta, res, passport, metodos, done } = carregarAmbiente();

    const req = { nivelUsuarioEndpoint: 2 };
    const jwtPayload = { nivelUsuario: 1 };
    metodos.validaJWT(req, jwtPayload, done);
    expect(objetoDone['param1'] !== undefined).toBeTruthy();
    expect(objetoDone['param1'].mensagem !== undefined).toBeTruthy();
  });

  test('Nível de acesso do usuário é igual ao nível exigido pelo endpoint', () => {
    const { resposta, res, passport, metodos, done } = carregarAmbiente();

    const req = { nivelUsuarioEndpoint: 2 };
    const jwtPayload = { nivelUsuario: 2 };
    metodos.validaJWT(req, jwtPayload, done);
    expect(objetoDone['param1'] == undefined).toBeTruthy();
  });

  test('Nível de acesso do usuário é superior ao nível exigido pelo endpoint', () => {
    const { resposta, res, passport, metodos, done } = carregarAmbiente();

    const req = { nivelUsuarioEndpoint: 2 };
    const jwtPayload = { nivelUsuario: 3 };
    metodos.validaJWT(req, jwtPayload, done);
    expect(objetoDone['param1'] == undefined).toBeTruthy();
  });

  test('Nível de endpoint não parametrizado', () => {
    const { resposta, res, passport, metodos, done } = carregarAmbiente();

    const req = {};
    const jwtPayload = { nivelUsuario: 1 };
    metodos.validaJWT(req, jwtPayload, done);
    expect(objetoDone['param1'] !== undefined).toBeTruthy();
    expect(objetoDone['param1'].mensagem !== undefined).toBeTruthy();
  });

  test('Falha na validação do JWT', () => {
    const { resposta, res, passport, metodos } = carregarAmbiente();

    const req = {};
    const jwtPayload = { nivelUsuario: '1' };
    const done = () => {
      throw new Error();
    };
    metodos.validaJWT(req, jwtPayload, done);
  });
});

describe('loginColaborador', () => {
  test('Autenticação com erro', () => {
    const passport = {
      use: jest.fn(),
      authenticate: (tipo, parametros, funcao) => {
        return () => {
          funcao({ message: '' });
        };
      },
    };

    const { resposta, res, metodos } = carregarAmbiente(passport);

    const req = { body: {} };
    metodos.loginColaborador(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Autenticação com senha resetada', () => {
    const passport = {
      use: jest.fn(),
      authenticate: (tipo, parametros, funcao) => {
        return () => {
          funcao({ message: '', senhaResetada: true });
        };
      },
    };

    const { resposta, res, metodos } = carregarAmbiente(passport);

    const req = { body: {} };
    metodos.loginColaborador(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
    expect(resposta.getResposta().senhaResetada).toBeDefined();
  });

  test('Login com sucesso', () => {
    const passport = {
      use: jest.fn(),
      authenticate: (tipo, parametros, funcao) => {
        return () => {
          funcao(undefined, {});
        };
      },
    };

    const { resposta, res, metodos } = carregarAmbiente(passport);

    const req = {
      body: {},
      login: (param1, param2, param3) => {
        param3();
      },
    };
    metodos.loginColaborador(req, res);
    expect(res.status).not.toHaveBeenLastCalledWith(400);
  });

  test('Login com falha', () => {
    const passport = {
      use: jest.fn(),
      authenticate: (tipo, parametros, funcao) => {
        return () => {
          funcao(undefined, {});
        };
      },
    };

    const { resposta, res, metodos } = carregarAmbiente(passport);

    const req = {
      body: {},
      login: (param1, param2, param3) => {
        param3({ message: 'Falha no login' });
      },
    };
    metodos.loginColaborador(req, res);
    expect(res.status).not.toHaveBeenLastCalledWith(400);
  });
});
