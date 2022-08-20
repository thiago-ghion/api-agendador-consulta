const apoioTeste = require('./apoioTeste');
let mockListaColaborador = null;
let mockColaborador = null;

jest.mock('../models/index.js', () => ({
  sequelize: {
    transaction: async (funcao) => {
      return funcao();
    },
    literal: () => '',
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
}));

beforeEach(() => {
  mockListaColaborador = null;
  mockColaborador = null;
});

describe('Parte comum', () => {
  test('Registrar método', () => {
    const usuario = require('../api/usuario.js');

    const app = apoioTeste.gerarApp();
    jest.spyOn(app, 'get');
    jest.spyOn(app, 'post');

    try {
      usuario.registrarMetodos(app, jest.fn());
    } catch {}

    expect(app.get).toHaveBeenCalled();
    expect(app.post).toHaveBeenCalled();
  });
});

describe('Método consultar', () => {
  test('ID do colaborador não informado', async () => {
    const usuario = require('../api/usuario.js');

    const req = { query: {} };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await usuario.consultar(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Colaborador não existe', async () => {
    const usuario = require('../api/usuario.js');

    const req = { query: { idUsuario: 1 } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockColaborador = new Promise((resolve) => {
      resolve(null);
    });

    await usuario.consultar(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Colaborador existe', async () => {
    const usuario = require('../api/usuario.js');

    const req = { query: { idUsuario: 1 } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockColaborador = new Promise((resolve) => {
      resolve({
        idColaborador: 1,
        nomeUsuario: '',
        nomeColaborador: '',
        indicadorAtivo: 'S',
        indicadorAdministrador: 'S',
      });
    });

    await usuario.consultar(req, res);

    expect(resposta.getResposta()).toBeDefined();
  });

  test('Falha na consulta', async () => {
    const usuario = require('../api/usuario.js');

    const req = { query: { idUsuario: 1 } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockColaborador = new Promise((resolve, reject) => {
      reject();
    });

    await usuario.consultar(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });
});

describe('Método listar', () => {
  test('Nenhum colaborador registrado', async () => {
    const usuario = require('../api/usuario.js');

    const req = {};
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockListaColaborador = new Promise((resolve, reject) => {
      resolve([]);
    });

    await usuario.listar(req, res);

    expect(resposta.getResposta()).toEqual([]);
  });

  test('Colaborador registrado', async () => {
    const usuario = require('../api/usuario.js');

    const req = {};
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockListaColaborador = new Promise((resolve, reject) => {
      resolve([{ idColaborador: 1, nomeUsuario: 'teste' }]);
    });

    await usuario.listar(req, res);

    expect(resposta.getResposta().length).toBe(1);
  });

  test('Falha na consulta', async () => {
    const usuario = require('../api/usuario.js');

    const req = {};
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockListaColaborador = new Promise((resolve, reject) => {
      reject();
    });

    await usuario.listar(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });
});

describe('Método isSenhaValida', () => {
  test('Senha não informada', async () => {
    const usuario = require('../api/usuario.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const saida = await usuario.isSenhaValida(undefined, res);

    expect(saida).toBeFalsy();
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Senha em branco', async () => {
    const usuario = require('../api/usuario.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const saida = await usuario.isSenhaValida('', res);

    expect(saida).toBeFalsy();
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Senha fora do padrão', async () => {
    const usuario = require('../api/usuario.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const saida = await usuario.isSenhaValida('2213', res);

    expect(saida).toBeFalsy();
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Senha bem formada', async () => {
    const usuario = require('../api/usuario.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const saida = await usuario.isSenhaValida('AB@78hji', res);

    expect(saida).toBeTruthy();
  });
});

describe('Método isColaboradorValido', () => {
  test('Nome do colaborador não informado', async () => {
    const usuario = require('../api/usuario.js');

    const req = { body: {} };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const saida = await usuario.isColaboradorValido(req, res, true);

    expect(saida).toBeFalsy();
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Nome do colaborador em branco', async () => {
    const usuario = require('../api/usuario.js');

    const req = { body: { nomeColaborador: '' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const saida = await usuario.isColaboradorValido(req, res, true);

    expect(saida).toBeFalsy();
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Nome do usuário não informado', async () => {
    const usuario = require('../api/usuario.js');

    const req = { body: { nomeColaborador: 'Teste' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const saida = await usuario.isColaboradorValido(req, res, true);

    expect(saida).toBeFalsy();
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Nome do usuário em branco', async () => {
    const usuario = require('../api/usuario.js');

    const req = { body: { nomeColaborador: 'Teste', nomeUsuario: '' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const saida = await usuario.isColaboradorValido(req, res, true);

    expect(saida).toBeFalsy();
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Nome do usuário mal formado', async () => {
    const usuario = require('../api/usuario.js');

    const req = { body: { nomeColaborador: 'Teste', nomeUsuario: '123' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const saida = await usuario.isColaboradorValido(req, res, true);

    expect(saida).toBeFalsy();
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Tipo de usuário não informado', async () => {
    const usuario = require('../api/usuario.js');

    const req = { body: { nomeColaborador: 'Teste', nomeUsuario: 'teste123' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const saida = await usuario.isColaboradorValido(req, res, true);

    expect(saida).toBeFalsy();
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Tipo de usuário em branco', async () => {
    const usuario = require('../api/usuario.js');

    const req = {
      body: {
        nomeColaborador: 'Teste',
        nomeUsuario: 'teste123',
        isUsuarioAdministrador: '',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const saida = await usuario.isColaboradorValido(req, res, true);

    expect(saida).toBeFalsy();
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Tipo de usuário mal informado', async () => {
    const usuario = require('../api/usuario.js');

    const req = {
      body: {
        nomeColaborador: 'Teste',
        nomeUsuario: 'teste123',
        isUsuarioAdministrador: 'X',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const saida = await usuario.isColaboradorValido(req, res, true);

    expect(saida).toBeFalsy();
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Senha mal formada', async () => {
    const usuario = require('../api/usuario.js');

    const req = {
      body: {
        nomeColaborador: 'Teste',
        nomeUsuario: 'teste123',
        isUsuarioAdministrador: 'S',
        senha: '123',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const saida = await usuario.isColaboradorValido(req, res, true);

    expect(saida).toBeFalsy();
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Senha bem formada', async () => {
    const usuario = require('../api/usuario.js');

    const req = {
      body: {
        nomeColaborador: 'Teste',
        nomeUsuario: 'teste123',
        isUsuarioAdministrador: 'S',
        senha: 'AB@78hji',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const saida = await usuario.isColaboradorValido(req, res, true);

    expect(saida).toBeTruthy();
  });

  test('Validação modo alteração', async () => {
    const usuario = require('../api/usuario.js');

    const req = {
      body: {
        nomeColaborador: 'Teste',
        nomeUsuario: '123',
        isUsuarioAdministrador: 'S',
        senha: '123',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const saida = await usuario.isColaboradorValido(req, res, false);

    expect(saida).toBeTruthy();
  });
});

describe('Método resetarSenha', () => {
  test('Colaborador não existe', async () => {
    const usuario = require('../api/usuario.js');

    mockColaborador = new Promise((resolve, reject) => {
      resolve(null);
    });

    const req = { body: { idUsuario: 1 } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await usuario.resetarSenha(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Senha mal formada', async () => {
    const usuario = require('../api/usuario.js');

    mockColaborador = new Promise((resolve, reject) => {
      resolve({});
    });

    const req = { body: { idUsuario: 1, senha: '123' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await usuario.resetarSenha(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Sucesso', async () => {
    const usuario = require('../api/usuario.js');

    objetoColaborador = {
      update: jest.fn(),
    };
    jest.spyOn(objetoColaborador, 'update');

    mockColaborador = new Promise((resolve, reject) => {
      resolve(objetoColaborador);
    });

    const req = { body: { idUsuario: 1, senha: 'AB@78hji' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await usuario.resetarSenha(req, res);
    expect(objetoColaborador.update).toHaveBeenCalled();
  });

  test('Falha', async () => {
    const usuario = require('../api/usuario.js');

    mockColaborador = new Promise((resolve, reject) => {
      reject({});
    });

    const req = { body: { idUsuario: 1, senha: '123' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await usuario.resetarSenha(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });
});

describe('alterar', () => {
  test('Alteração falhou, requisicao inválida', async () => {
    const usuario = require('../api/usuario.js');
    const req = {
      body: {
        idUsuario: 1,
        senha: 'ABcde12#',
        isUsuarioAdministrador: 'S',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockColaborador = new Promise((resolve) => {
      resolve(null);
    });
    await usuario.alterar(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Alteração falhou, não foi encontrado o usuário', async () => {
    const usuario = require('../api/usuario.js');
    const req = {
      body: {
        idUsuario: 1,
        nomeColaborador: 'Teste',
        senha: 'ABcde12#',
        isUsuarioAdministrador: 'S',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockColaborador = new Promise((resolve) => {
      resolve(null);
    });
    await usuario.alterar(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Alteração com sucesso', async () => {
    const usuario = require('../api/usuario.js');
    const req = {
      body: {
        idUsuario: 1,
        nomeColaborador: 'Teste',
        senha: 'ABcde12#',
        isUsuarioAdministrador: 'S',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockColaborador = new Promise((resolve) => {
      resolve({ update: jest.fn() });
    });
    await usuario.alterar(req, res);

    expect(res.status).not.toHaveBeenLastCalledWith(400);
  });
});

describe('registrar', () => {
  test('Registro falhou, requisição inválida', async () => {
    const usuario = require('../api/usuario.js');
    const req = {
      body: {
        senha: 'ABcde12#',
        isUsuarioAdministrador: 'S',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockColaborador = new Promise((resolve) => {
      resolve(null);
    });
    await usuario.registrar(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Registro falhou, usuário já existe inválida', async () => {
    const usuario = require('../api/usuario.js');
    const req = {
      body: {
        nomeUsuario: 'teste',
        nomeColaborador: 'Teste',
        senha: 'ABcde12#',
        isUsuarioAdministrador: 'S',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockColaborador = new Promise((resolve) => {
      resolve({});
    });
    await usuario.registrar(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Registro com sucesso', async () => {
    const usuario = require('../api/usuario.js');
    const req = {
      body: {
        nomeUsuario: 'teste',
        nomeColaborador: 'Teste',
        senha: 'ABcde12#',
        isUsuarioAdministrador: 'S',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockColaborador = new Promise((resolve) => {
      resolve(null);
    });
    await usuario.registrar(req, res);

    expect(res.status).toHaveBeenLastCalledWith(201);
  });
});
