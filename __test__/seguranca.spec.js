const apoioTeste = require('./apoioTeste');
let mockListaColaborador = null;
let mockColaborador = null;
let mockQuery = null;
let mockCreateRegistroAcesso = null;
let objetoDone = {};
let mockListaPaciente = null;
let mockPaciente = null;
let mockAxiosGet = null;
let mockRegistrar = () =>
  new Promise((resolve, reject) => {
    resolve({});
  });
let mockVerifyIdToken = jest.fn();

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
  Sequelize: {
    Op: jest.fn(),
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
  Paciente: {
    findAll: () => {
      return mockListaPaciente;
    },
    findOne: (objeto) => {
      if (typeof mockPaciente === 'function') {
        return mockPaciente(objeto);
      }
      return mockPaciente;
    },
    create: () => {
      return new Promise((resolve, reject) => {
        resolve({ idPaciente: 1 });
      });
    },
  },
  HistoricoPaciente: {
    create: () => {
      return new Promise((resolve, reject) => {
        resolve();
      });
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

jest.mock('axios', () => ({ get: () => mockAxiosGet }));

jest.mock('../api/paciente.js', () => ({ registrar: () => mockRegistrar }));

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: () => {
      return mockVerifyIdToken;
    },
  })),
}));

beforeEach(() => {
  mockListaColaborador = null;
  mockColaborador = null;
  mockQuery = null;
  mockCreateRegistroAcesso = null;
  objetoDone = {};
  mockListaPaciente = null;
  mockPaciente = null;
  mockRegistrar = () =>
    new Promise((resolve, reject) => {
      resolve({});
    });
  mockVerifyIdToken = jest.fn();
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

describe('Login paciente interno', () => {
  test('Paciente não existe', async () => {
    const { resposta, res, passport, metodos, done } = carregarAmbiente();

    const req = { body: { tipoLogin: 1 } };
    const usuario = 'teste@teste.com';
    const senha = 'AAbbb12#';

    await metodos.localLogin(req, usuario, senha, done);

    expect(objetoDone.param1 !== undefined).toBeTruthy();
    expect(objetoDone.param1.mensagem !== undefined).toBeTruthy();
  });

  test('Paciente com senha incorreta', async () => {
    const { resposta, res, passport, metodos, done } = carregarAmbiente();

    const req = { body: { tipoLogin: 1 } };
    const usuario = 'teste@teste.com';
    const senha = 'AAbbb12#';

    mockPaciente = { textoSenha: '12345678' };

    await metodos.localLogin(req, usuario, senha, done);

    expect(objetoDone.param1 !== undefined).toBeTruthy();
    expect(objetoDone.param1.mensagem !== undefined).toBeTruthy();
  });

  test('Falha na recuperação do paciente', async () => {
    const { resposta, res, passport, metodos, done } = carregarAmbiente();

    const req = { body: { tipoLogin: 1 } };
    const usuario = 'teste@teste.com';
    const senha = 'AAbbb12#';

    mockPaciente = new Promise((resolve, reject) => {
      reject();
    });

    await metodos.localLogin(req, usuario, senha, done);

    expect(objetoDone.param1 !== undefined).toBeTruthy();
    expect(objetoDone.param1.mensagem !== undefined).toBeTruthy();
  });

  test('Login paciente com sucesso', async () => {
    const { resposta, res, passport, metodos, done } = carregarAmbiente();

    const req = { body: { tipoLogin: 1 } };
    const usuario = 'teste@teste.com';
    const senha = 'AAbbb12#';

    mockPaciente = { textoSenha: 'AAbbb12#' };

    await metodos.localLogin(req, usuario, senha, done);

    expect(objetoDone.param1 == undefined).toBeTruthy();
  });

  test('Login com falha', () => {
    const passport = {
      use: jest.fn(),
      authenticate: (tipo, parametros, funcao) => {
        return () => {
          funcao({ message: '' });
        };
      },
    };

    const { resposta, res, metodos } = carregarAmbiente(passport);

    const req = { body: { tipoLogin: 1 } };
    metodos.loginPacienteInterno(req, res);
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
      body: { tipoLogin: 1 },
      login: (p1, p2, p3) => {
        p3({});
      },
    };
    metodos.loginPacienteInterno(req, res);
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
      body: { tipoLogin: 1 },
      login: (p1, p2, p3) => {
        p3({});
      },
    };

    jest.spyOn(res, 'send');
    metodos.loginPacienteInterno(req, res);
    expect(res.send).toHaveBeenCalled();
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
      body: { tipoLogin: 1 },
      login: (p1, p2, p3) => {
        p3();
      },
    };

    jest.spyOn(res, 'send');
    metodos.loginPacienteInterno(req, res);
    expect(res.send).toHaveBeenCalled();
  });
});

describe('Trocar senha do paciente', () => {
  test('Email não informado', async () => {
    const seguranca = require('../api/seguranca.js');

    const requisicao = { body: {} };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.trocarSenhaPaciente(requisicao, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Senha anterior não informada', async () => {
    const seguranca = require('../api/seguranca.js');

    const requisicao = { body: { email: 'teste@teste.com' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.trocarSenhaPaciente(requisicao, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Senha anterior inválida', async () => {
    const seguranca = require('../api/seguranca.js');

    const requisicao = {
      body: { email: 'teste@teste.com', senhaAnterior: '12345678' },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.trocarSenhaPaciente(requisicao, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Senha nova não informada', async () => {
    const seguranca = require('../api/seguranca.js');

    const requisicao = {
      body: { email: 'teste@teste.com', senhaAnterior: 'AAbbb12#' },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.trocarSenhaPaciente(requisicao, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Senha nova inválida', async () => {
    const seguranca = require('../api/seguranca.js');

    const requisicao = {
      body: {
        email: 'teste@teste.com',
        senhaAnterior: 'AAbbb12#',
        senhaNova: '12345678',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.trocarSenhaPaciente(requisicao, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Senhas anterior e nova identicas', async () => {
    const seguranca = require('../api/seguranca.js');

    const requisicao = {
      body: {
        email: 'teste@teste.com',
        senhaAnterior: 'AAbbb12#',
        senhaNova: 'AAbbb12#',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.trocarSenhaPaciente(requisicao, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Email não encontrado', async () => {
    const seguranca = require('../api/seguranca.js');

    const requisicao = {
      body: {
        email: 'teste@teste.com',
        senhaAnterior: 'AAbbb12#',
        senhaNova: 'AAbbb13#',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.trocarSenhaPaciente(requisicao, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Falha na recuperação do paciente', async () => {
    const seguranca = require('../api/seguranca.js');

    const requisicao = {
      body: {
        email: 'teste@teste.com',
        senhaAnterior: 'AAbbb12#',
        senhaNova: 'AAbbb13#',
      },
    };

    mockPaciente = new Promise((resolve, reject) => {
      reject();
    });
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.trocarSenhaPaciente(requisicao, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Troca de senha com sucesso', async () => {
    const seguranca = require('../api/seguranca.js');

    const requisicao = {
      body: {
        email: 'teste@teste.com',
        senhaAnterior: 'AAbbb12#',
        senhaNova: 'AAbbb13#',
      },
    };

    mockPaciente = { idPaciente: 1, nomePaciente: 'teste', update: jest.fn() };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.trocarSenhaPaciente(requisicao, res);

    expect(res.status).toHaveBeenLastCalledWith(200);
  });
});

describe('Login Facebook', () => {
  test('Credencial inválida', async () => {
    const seguranca = require('../api/seguranca.js');

    const requisicao = {
      body: {
        credential: '12345678',
      },
    };

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockAxiosGet = new Promise((resolve, reject) => {
      reject();
    });
    await seguranca.loginFacebook(requisicao, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Email encontrado', async () => {
    const seguranca = require('../api/seguranca.js');

    const requisicao = {
      body: {
        credential: '12345678',
      },
    };

    mockPaciente = {};
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockAxiosGet = new Promise((resolve, reject) => {
      resolve({ data: { email: 'teste@teste.com', name: 'Teste' } });
    });

    await seguranca.loginFacebook(requisicao, res);

    expect(resposta.getResposta()).toBeDefined();
  });

  test('Email não encontrado', async () => {
    const seguranca = require('../api/seguranca.js');

    const requisicao = {
      body: {
        credential: '12345678',
      },
    };

    mockPaciente = null;
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockAxiosGet = new Promise((resolve, reject) => {
      resolve({ data: { email: 'teste@teste.com', name: 'Teste' } });
    });

    await seguranca.loginFacebook(requisicao, res);

    expect(resposta.getResposta()).toBeDefined();
  });

  test('Falha na inclusão do email', async () => {
    const seguranca = require('../api/seguranca.js');

    const requisicao = {
      body: {
        credential: '12345678',
      },
    };

    mockRegistrar = () =>
      new Promise((resolve, reject) => {
        resolve(false);
      });

    mockPaciente = null;
    mockRegistrar = false;

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockAxiosGet = new Promise((resolve, reject) => {
      resolve({ data: { email: 'teste@teste.com', name: 'Teste' } });
    });

    await seguranca.loginFacebook(requisicao, res);

    expect(resposta.getResposta()).not.toBeDefined();
  });
});

describe('Login Google', () => {
  test('Credencial inválida', async () => {
    const seguranca = require('../api/seguranca.js');

    mockVerifyIdToken = new Promise((resolve, reject) => {
      reject();
    });

    const requisicao = {
      body: {
        credential: '12345678',
      },
    };

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockAxiosGet = new Promise((resolve, reject) => {
      reject();
    });
    await seguranca.loginGoogle(requisicao, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Email não existe na base', async () => {
    const seguranca = require('../api/seguranca.js');

    mockVerifyIdToken = new Promise((resolve, reject) => {
      resolve({ getPayload: () => ({ email: 'teste@teste.com.br' }) });
    });

    const requisicao = {
      body: {
        credential: '12345678',
      },
    };

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.loginGoogle(requisicao, res);

    expect(resposta.getResposta()).toBeDefined();
  });

  test('Email existe na base', async () => {
    const seguranca = require('../api/seguranca.js');

    mockVerifyIdToken = new Promise((resolve, reject) => {
      resolve({ getPayload: () => ({ email: 'teste@teste.com.br' }) });
    });

    mockPaciente = {};

    const requisicao = {
      body: {
        credential: '12345678',
      },
    };

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.loginGoogle(requisicao, res);

    expect(resposta.getResposta()).toBeDefined();
  });

  test('Email existe na base', async () => {
    const seguranca = require('../api/seguranca.js');

    mockVerifyIdToken = new Promise((resolve, reject) => {
      resolve({ getPayload: () => ({ email: 'teste@teste.com.br' }) });
    });

    mockPaciente = null;
    mockRegistrar = false;

    const requisicao = {
      body: {
        credential: '12345678',
      },
    };

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await seguranca.loginGoogle(requisicao, res);

    expect(resposta.getResposta()).not.toBeDefined();
  });
});
