const apoioTeste = require('./apoioTeste');
let mockListaColaborador = null;
let mockColaborador = null;
let mockListaProfissional = null;
let mockProfissional = null;
let mockQuery = null;
let mockVinculo = null;
let mockCreateProfissional = null;
let mockCreateHistoricoProfissional = null;
let mockCreateVinculoProfissionalHorario = null;

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
  Profissional: {
    findAll: () => {
      return mockListaProfissional;
    },
    findOne: (condicoes) => {
      if (typeof mockProfissional === 'function') {
        return mockProfissional(condicoes);
      }
      return mockProfissional;
    },
    create: (objeto) => {
      if (typeof mockCreateProfissional === 'function') {
        return mockCreateProfissional(objeto);
      }
      return mockCreateProfissional;
    },
  },
  HistoricoProfissional: {
    create: (objeto) => {
      if (typeof mockCreateHistoricoProfissional === 'function') {
        return mockCreateHistoricoProfissional(objeto);
      }
      return mockCreateHistoricoProfissional;
    },
  },
  VinculoProfissionalHorario: {
    findOne: (condicoes) => {
      if (typeof mockVinculo === 'function') {
        return mockVinculo(condicoes);
      }
      return mockVinculo;
    },
    create: (objeto) => {
      if (typeof mockCreateVinculoProfissionalHorario === 'function') {
        return mockCreateVinculoProfissionalHorario(objeto);
      }
      return mockCreateVinculoProfissionalHorario;
    },
  },
}));

beforeEach(() => {
  mockListaColaborador = null;
  mockColaborador = null;
  mockListaProfissional = null;
  mockProfissional = null;
  mockQuery = null;
  mockVinculo = null;
  mockCreateProfissional = null;
  mockCreateHistoricoProfissional = null;
  mockCreateVinculoProfissionalHorario = null;
});

describe('Parte comum', () => {
  test('Registrar método', () => {
    const profissional = require('../api/profissional.js');

    const app = apoioTeste.gerarApp();
    jest.spyOn(app, 'get');
    jest.spyOn(app, 'post');

    try {
      profissional.registrarMetodos(app, jest.fn());
    } catch {}

    expect(app.get).toHaveBeenCalled();
    expect(app.post).toHaveBeenCalled();
  });
});

describe('listarVigente', () => {
  test('listarVigente', async () => {
    const profissional = require('../api/profissional.js');

    mockListaProfissional = [{ idProfissional: 1, nomeProfissional: 'Teste' }];
    const req = {};
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);

    await profissional.listarVigente(req, res);

    expect(resposta.getResposta()).toBeDefined();
    expect(resposta.getResposta().length).toBe(1);
  });
});

describe('listarTodos', () => {
  test('listarTodos', async () => {
    const profissional = require('../api/profissional.js');

    mockListaProfissional = [{ idProfissional: 1, nomeProfissional: 'Teste' }];
    const req = {};
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);

    await profissional.listarTodos(req, res);

    expect(resposta.getResposta()).toBeDefined();
    expect(resposta.getResposta().length).toBe(1);
  });
});

describe('listarDataDisponivel', () => {
  test('idProfissional não preenchido', async () => {
    const profissional = require('../api/profissional.js');

    const req = { query: {} };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.listarDataDisponivel(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Profissional não encontrado', async () => {
    const profissional = require('../api/profissional.js');

    const req = { query: { idProfissional: 1 } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.listarDataDisponivel(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Data inicio não preenchido', async () => {
    const profissional = require('../api/profissional.js');

    mockProfissional = {};
    const req = { query: { idProfissional: 1 } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.listarDataDisponivel(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Data inicio formato inválido', async () => {
    const profissional = require('../api/profissional.js');

    mockProfissional = {};
    const req = { query: { idProfissional: 1, dataInicio: 'aaaaaa' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.listarDataDisponivel(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Data fim não preenchido', async () => {
    const profissional = require('../api/profissional.js');

    mockProfissional = {};
    const req = { query: { idProfissional: 1, dataInicio: '02.05.2022' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.listarDataDisponivel(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Data fim formato inválido', async () => {
    const profissional = require('../api/profissional.js');

    mockProfissional = {};
    const req = {
      query: { idProfissional: 1, dataInicio: '02.05.2022', dataFim: 'aaaaa' },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.listarDataDisponivel(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Intervalo de consulta inválido', async () => {
    const profissional = require('../api/profissional.js');

    mockProfissional = {};
    const req = {
      query: {
        idProfissional: 1,
        dataInicio: '02.05.2022',
        dataFim: '12.12.2022',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.listarDataDisponivel(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Lista com sucesso', async () => {
    const profissional = require('../api/profissional.js');

    mockProfissional = {};
    mockQuery = new Promise((resolve) => {
      resolve([{ dataVinculo: '2022-05-02' }]);
    });

    const req = {
      query: {
        idProfissional: 1,
        dataInicio: '02.05.2022',
        dataFim: '02.05.2022',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.listarDataDisponivel(req, res);

    expect(resposta.getResposta()).toBeDefined();
    expect(resposta.getResposta().length).toBe(1);
  });
});

describe('listarHorarioDisponivel', () => {
  test('idProfissional não preenchido', async () => {
    const profissional = require('../api/profissional.js');

    const req = { query: {} };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.listarHorarioDisponivel(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Profissional não encontrado', async () => {
    const profissional = require('../api/profissional.js');

    const req = { query: { idProfissional: 1 } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.listarHorarioDisponivel(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Data pesquisa não preenchido', async () => {
    const profissional = require('../api/profissional.js');

    mockProfissional = {};
    const req = { query: { idProfissional: 1 } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.listarHorarioDisponivel(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Data pesquisa formato inválido', async () => {
    const profissional = require('../api/profissional.js');

    mockProfissional = {};
    const req = { query: { idProfissional: 1, dataPesquisa: 'aaaaaa' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.listarHorarioDisponivel(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Lista com sucesso', async () => {
    const profissional = require('../api/profissional.js');

    mockProfissional = {};
    mockQuery = new Promise((resolve) => {
      resolve([{ idHorario: '1', textoHorario: '08:00' }]);
    });

    const req = {
      query: {
        idProfissional: 1,
        dataPesquisa: '02.05.2022',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.listarHorarioDisponivel(req, res);

    expect(resposta.getResposta()).toBeDefined();
    expect(resposta.getResposta().length).toBe(1);
  });
});

describe('listarConfiguracaoHorario', () => {
  test('idProfissional não preenchido', async () => {
    const profissional = require('../api/profissional.js');

    const req = { query: {} };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.listarConfiguracaoHorario(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Data pesquisa não preenchida', async () => {
    const profissional = require('../api/profissional.js');

    const req = { query: { idProfissional: 1 } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.listarConfiguracaoHorario(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Data pesquisa formato inválido', async () => {
    const profissional = require('../api/profissional.js');

    const req = { query: { idProfissional: 1, dataPesquisa: 'aaaaa' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.listarConfiguracaoHorario(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Lista com sucesso', async () => {
    const profissional = require('../api/profissional.js');

    mockProfissional = {};
    mockQuery = new Promise((resolve) => {
      resolve([{ idHorario: '1', textoHorario: '08:00' }]);
    });

    const req = {
      query: {
        idProfissional: 1,
        dataPesquisa: '02.05.2022',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.listarConfiguracaoHorario(req, res);

    expect(resposta.getResposta()).toBeDefined();
    expect(resposta.getResposta().length).toBe(1);
  });
});

describe('listarConfiguracaoHorarioPeriodo', () => {
  test('idProfissional não preenchido', async () => {
    const profissional = require('../api/profissional.js');

    const req = { query: {} };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.listarConfiguracaoHorarioPeriodo(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('dataInicio não preenchido', async () => {
    const profissional = require('../api/profissional.js');

    const req = { query: { idProfissional: 1 } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.listarConfiguracaoHorarioPeriodo(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('dataInicio formato inválido', async () => {
    const profissional = require('../api/profissional.js');

    const req = { query: { idProfissional: 1, dataInicio: 'aaaaaa' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.listarConfiguracaoHorarioPeriodo(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('dataFim não preenchido', async () => {
    const profissional = require('../api/profissional.js');

    const req = { query: { idProfissional: 1, dataInicio: '02.05.2022' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.listarConfiguracaoHorarioPeriodo(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('dataFim formato inválido', async () => {
    const profissional = require('../api/profissional.js');

    const req = {
      query: { idProfissional: 1, dataInicio: '02.05.2022', dataFim: 'aaaaa' },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.listarConfiguracaoHorarioPeriodo(req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Lista com sucesso', async () => {
    const profissional = require('../api/profissional.js');

    mockProfissional = {};
    mockQuery = new Promise((resolve) => {
      resolve([
        { dataVinculo: '2022-05-02', idHorario: '1', textoHorario: '08:00' },
      ]);
    });

    const req = {
      query: {
        idProfissional: 1,
        dataInicio: '02.05.2022',
        dataFim: '02.05.2022',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.listarConfiguracaoHorarioPeriodo(req, res);

    expect(resposta.getResposta()).toBeDefined();
    expect(resposta.getResposta().length).toBe(1);
  });
});

describe('validarProfissional', () => {
  test('idProfissional não informado em modo alteração', async () => {
    const profissional = require('../api/profissional.js');

    const req = { params: {} };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.validarProfissional(req, res, true);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('idProfissional não encontrado em modo alteração', async () => {
    const profissional = require('../api/profissional.js');

    const req = { params: { idProfissional: 1 } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.validarProfissional(req, res, true);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('idProfissional encontrado em modo alteração', async () => {
    const profissional = require('../api/profissional.js');

    mockProfissional = {};
    const req = { params: { idProfissional: 1 } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.validarProfissional(req, res, true);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('nomeProfissional não informado', async () => {
    const profissional = require('../api/profissional.js');

    const req = { body: {} };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.validarProfissional(req, res, false);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('nomeProfissional em branco', async () => {
    const profissional = require('../api/profissional.js');

    const req = { body: { nomeProfissional: '' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.validarProfissional(req, res, false);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('vinculoDataHorario não informado', async () => {
    const profissional = require('../api/profissional.js');

    const req = { body: { nomeProfissional: 'Teste de nome' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const retorno = await profissional.validarProfissional(req, res, false);

    expect(retorno).toBeTruthy();
  });

  test('vinculoDataHorario informado com data não informada', async () => {
    const profissional = require('../api/profissional.js');

    const req = {
      body: { nomeProfissional: 'Teste de nome', vinculoDataHorario: [{}] },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.validarProfissional(req, res, false);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('vinculoDataHorario informado com data no formato inválido', async () => {
    const profissional = require('../api/profissional.js');

    const req = {
      body: {
        nomeProfissional: 'Teste de nome',
        vinculoDataHorario: [{ data: 'aaaaaa' }],
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.validarProfissional(req, res, false);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('vinculoDataHorario informado com listaHorario não informado', async () => {
    const profissional = require('../api/profissional.js');

    const req = {
      body: {
        nomeProfissional: 'Teste de nome',
        vinculoDataHorario: [{ data: '02.05.2022' }],
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.validarProfissional(req, res, false);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('vinculoDataHorario informado com listaHorario vazia', async () => {
    const profissional = require('../api/profissional.js');

    const req = {
      body: {
        nomeProfissional: 'Teste de nome',
        vinculoDataHorario: [{ data: '02.05.2022', listaHorario: [] }],
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.validarProfissional(req, res, false);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('vinculoDataHorario informado com idHorario não informado', async () => {
    const profissional = require('../api/profissional.js');

    const req = {
      body: {
        nomeProfissional: 'Teste de nome',
        vinculoDataHorario: [{ data: '02.05.2022', listaHorario: [{}] }],
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.validarProfissional(req, res, false);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('vinculoDataHorario informado com idHorario inválido', async () => {
    const profissional = require('../api/profissional.js');

    const req = {
      body: {
        nomeProfissional: 'Teste de nome',
        vinculoDataHorario: [
          { data: '02.05.2022', listaHorario: [{ idHorario: 0 }] },
        ],
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.validarProfissional(req, res, false);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('vinculoDataHorario informado com ação não informado', async () => {
    const profissional = require('../api/profissional.js');

    const req = {
      body: {
        nomeProfissional: 'Teste de nome',
        vinculoDataHorario: [
          { data: '02.05.2022', listaHorario: [{ idHorario: 1 }] },
        ],
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.validarProfissional(req, res, false);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('vinculoDataHorario informado com ação inválido', async () => {
    const profissional = require('../api/profissional.js');

    const req = {
      body: {
        nomeProfissional: 'Teste de nome',
        vinculoDataHorario: [
          {
            data: '02.05.2022',
            listaHorario: [
              { idHorario: 1, acao: 'X' },
              { idHorario: 2, acao: 'A' },
              { idHorario: 1, acao: 'D' },
            ],
          },
        ],
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.validarProfissional(req, res, false);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('vinculoDataHorario com data repetida', async () => {
    const profissional = require('../api/profissional.js');

    const req = {
      body: {
        nomeProfissional: 'Teste de nome',
        vinculoDataHorario: [
          {
            data: '02.05.2022',
            listaHorario: [
              { idHorario: 1, acao: 'A' },
              { idHorario: 1, acao: 'D' },
            ],
          },
          {
            data: '02.05.2022',
            listaHorario: [
              { idHorario: 1, acao: 'A' },
              { idHorario: 1, acao: 'D' },
            ],
          },
        ],
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.validarProfissional(req, res, false);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('vinculoDataHorario com horários repetidos', async () => {
    const profissional = require('../api/profissional.js');

    const req = {
      body: {
        nomeProfissional: 'Teste de nome',
        vinculoDataHorario: [
          {
            data: '02.05.2022',
            listaHorario: [
              { idHorario: 1, acao: 'A' },
              { idHorario: 1, acao: 'D' },
            ],
          },
        ],
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.validarProfissional(req, res, false);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('vinculoDataHorario modo inclusão com sucesso', async () => {
    const profissional = require('../api/profissional.js');

    const req = {
      body: {
        nomeProfissional: 'Teste de nome',
        vinculoDataHorario: [
          {
            data: '02.05.2022',
            listaHorario: [
              { idHorario: 1, acao: 'A' },
              { idHorario: 2, acao: 'D' },
            ],
          },
        ],
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const retorno = await profissional.validarProfissional(req, res, false);

    expect(retorno).toBeDefined();
    expect(retorno).toBeTruthy();
  });

  test('vinculoDataHorario modo alteração com sucesso', async () => {
    const profissional = require('../api/profissional.js');

    mockProfissional = {};

    mockVinculo = (condicao) => {
      switch (condicao.where.idHorario) {
        case 1:
          return new Promise((resolve) => {
            resolve({ indicadorAtivo: 'S' });
          });
        case 2:
          return new Promise((resolve) => {
            resolve({ indicadorAtivo: 'S' });
          });
        case 3:
          return new Promise((resolve) => {
            resolve({ indicadorAtivo: 'N' });
          });
        case 4:
          return new Promise((resolve) => {
            resolve({ indicadorAtivo: 'N' });
          });
        default:
          return new Promise((resolve) => {
            resolve(null);
          });
      }
    };

    mockQuery = (sql) => {
      if (sql.includes('888')) {
        return new Promise((resolve) => {
          resolve([{}]);
        });
      }
      return new Promise((resolve) => {
        resolve([]);
      });
    };

    const req = {
      params: { idProfissional: 9999 },
      body: {
        nomeProfissional: 'Teste de nome',
        vinculoDataHorario: [
          {
            data: '02.05.2022',
            listaHorario: [
              { idHorario: 1, acao: 'A' },
              { idHorario: 2, acao: 'D' },
              { idHorario: 3, acao: 'A' },
              { idHorario: 4, acao: 'D' },
              { idHorario: 5, acao: 'A' },
              { idHorario: 6, acao: 'D' },
            ],
          },
        ],
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const retorno = await profissional.validarProfissional(req, res, true);

    expect(retorno).toBeDefined();
    expect(retorno).toBeTruthy();
  });

  test('vinculoDataHorario, desativar horário com consulta vinculada', async () => {
    const profissional = require('../api/profissional.js');

    mockProfissional = {};

    mockVinculo = (condicao) => {
      switch (condicao.where.idHorario) {
        case 1:
          return new Promise((resolve) => {
            resolve({ indicadorAtivo: 'S' });
          });
        case 2:
          return new Promise((resolve) => {
            resolve({ indicadorAtivo: 'S' });
          });
        case 3:
          return new Promise((resolve) => {
            resolve({ indicadorAtivo: 'N' });
          });
        case 4:
          return new Promise((resolve) => {
            resolve({ indicadorAtivo: 'N' });
          });
        default:
          return new Promise((resolve) => {
            resolve({});
          });
      }
    };

    mockQuery = (sql) => {
      if (sql.includes('2')) {
        return new Promise((resolve) => {
          resolve([{}]);
        });
      }
      return new Promise((resolve) => {
        resolve([]);
      });
    };

    const req = {
      params: { idProfissional: 9999 },
      body: {
        nomeProfissional: 'Teste de nome',
        vinculoDataHorario: [
          {
            data: '02.05.2022',
            listaHorario: [
              { idHorario: 1, acao: 'A' },
              { idHorario: 2, acao: 'D' },
              { idHorario: 3, acao: 'A' },
              { idHorario: 4, acao: 'D' },
            ],
          },
        ],
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const retorno = await profissional.validarProfissional(req, res, true);

    expect(retorno).toBeDefined();
    expect(retorno).toBeFalsy();
    expect(res.status).toHaveBeenLastCalledWith(400);
  });
});

describe('registrar', () => {
  test('Requisicao não válida', async () => {
    const profissional = require('../api/profissional.js');
    profissional.validarProfissional = new Promise((resolve) => {
      resolve(false);
    });

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.registrar({}, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Registro de profissional sem vinculação de horário', async () => {
    const profissional = require('../api/profissional.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockCreateProfissional = new Promise((resolve) => {
      resolve({ idProfissional: 1 });
    });

    mockCreateHistoricoProfissional = new Promise((resolve) => {
      resolve({});
    });

    await profissional.registrar({ body: { nomeProfissional: 'Teste' } }, res);

    expect(res.status).toHaveBeenLastCalledWith(201);
  });

  test('Registro de profissional com vinculação de horário', async () => {
    const profissional = require('../api/profissional.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockCreateProfissional = new Promise((resolve) => {
      resolve({ idProfissional: 1 });
    });

    mockCreateHistoricoProfissional = new Promise((resolve) => {
      resolve({});
    });

    mockCreateVinculoProfissionalHorario = new Promise((resolve) => {
      resolve({});
    });

    await profissional.registrar(
      {
        body: {
          nomeProfissional: 'Teste',
          vinculoDataHorario: [
            {
              data: '02.05.2022',
              listaHorario: [
                { idHorario: 1, acao: 'A' },
                { idHorario: 2, acao: 'D' },
                { idHorario: 3, acao: 'A' },
                { idHorario: 4, acao: 'D' },
              ],
            },
          ],
        },
      },
      res
    );

    expect(resposta.getResposta().idProfissional).toBe(1);
    expect(res.status).toHaveBeenLastCalledWith(201);
  });
});

describe('alterar', () => {
  test('Profissional não encontrado', async () => {
    const profissional = require('../api/profissional.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockProfissional = new Promise((resolve) => {
      resolve({ update: jest.fn() });
    });

    mockQuery = () => {
      return new Promise((resolve) => {
        resolve([]);
      });
    };

    mockVinculo = (condicao) => {
      switch (condicao.where.idHorario) {
        case 1:
          return new Promise((resolve) => {
            resolve({ indicadorAtivo: 'S', update: jest.fn() });
          });
        case 2:
          return new Promise((resolve) => {
            resolve({ indicadorAtivo: 'S', update: jest.fn() });
          });
        case 3:
          return new Promise((resolve) => {
            resolve({ indicadorAtivo: 'N', update: jest.fn() });
          });
        case 4:
          return new Promise((resolve) => {
            resolve({ indicadorAtivo: 'N', update: jest.fn() });
          });
        default:
          return new Promise((resolve) => {
            resolve(null);
          });
      }
    };

    await profissional.alterar(
      {
        params: {
          idProfissional: 9999,
        },
        body: {
          nomeProfissional: 'Teste',
          vinculoDataHorario: [
            {
              data: '02.05.2022',
              listaHorario: [
                { idHorario: 1, acao: 'A' },
                { idHorario: 2, acao: 'D' },
                { idHorario: 3, acao: 'A' },
                { idHorario: 4, acao: 'D' },
                { idHorario: 5, acao: 'A' },
                { idHorario: 6, acao: 'D' },
              ],
            },
          ],
        },
      },
      res
    );

    expect(resposta.getResposta().idProfissional).toBe(9999);
  });
});

describe('ativar', () => {
  test('idProfissional não informado', async () => {
    const profissional = require('../api/profissional.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.ativar({ params: {} }, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Profissional não encontrado', async () => {
    const profissional = require('../api/profissional.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockProfissional = new Promise((resolve) => {
      resolve(null);
    });

    await profissional.ativar({ params: { idProfissional: 1 } }, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Ativando um profissional já ativo', async () => {
    const profissional = require('../api/profissional.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockProfissional = new Promise((resolve) => {
      resolve({ indicadorAtivo: 'S' });
    });

    await profissional.ativar({ params: { idProfissional: 1 } }, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Ativando um profissional com SUCESSO', async () => {
    const profissional = require('../api/profissional.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockProfissional = new Promise((resolve) => {
      resolve({
        idProfissional: 1,
        nomeProfissional: 'Teste',
        indicadorAtivo: 'N',
        update: jest.fn(),
      });
    });

    await profissional.ativar({ params: { idProfissional: 1 } }, res);
    expect(resposta.getResposta()).toEqual({ idProfissional: 1 });
  });

  test('Ativando um profissional com ERRO', async () => {
    const profissional = require('../api/profissional.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockProfissional = new Promise((resolve) => {
      reject();
    });

    await profissional.ativar({ params: { idProfissional: 1 } }, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });
});

describe('desativar', () => {
  test('Desativar SEM consulta vinculada', async () => {
    const profissional = require('../api/profissional.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockQuery = new Promise((resolve) => {
      resolve([]);
    });

    mockProfissional = new Promise((resolve) => {
      resolve({
        idProfissional: 1,
        nomeProfissional: 'Teste',
        indicadorAtivo: 'S',
        update: jest.fn(),
      });
    });

    await profissional.desativar({ params: { idProfissional: 1 } }, res);
    expect(resposta.getResposta()).toEqual({ idProfissional: 1 });
  });

  test('Desativar COM consulta vinculada', async () => {
    const profissional = require('../api/profissional.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockQuery = new Promise((resolve) => {
      resolve([{}]);
    });

    mockProfissional = new Promise((resolve) => {
      resolve({
        idProfissional: 1,
        nomeProfissional: 'Teste',
        indicadorAtivo: 'S',
        update: jest.fn(),
      });
    });
    await profissional.desativar({ params: { idProfissional: 1 } }, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });
});

describe('consultarVinculo', () => {
  test('idProfissional não informado', async () => {
    const profissional = require('../api/profissional.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.consultarVinculo({ query: {} }, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('dataPesquisa não informado', async () => {
    const profissional = require('../api/profissional.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.consultarVinculo({ query: { idProfissional: 1 } }, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('dataPesquisa com formato inválido', async () => {
    const profissional = require('../api/profissional.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await profissional.consultarVinculo(
      { query: { idProfissional: 1, dataPesquisa: 'aaaaa' } },
      res
    );
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Lista com sucesso', async () => {
    const profissional = require('../api/profissional.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockQuery = new Promise((resolve) => {
      resolve([{ idHorario: 1, textoHorario: '08:00', indicadorAtivo: 'S' }]);
    });

    await profissional.consultarVinculo(
      { query: { idProfissional: 1, dataPesquisa: '02.02.2022' } },
      res
    );

    expect(resposta.getResposta().length).toBe(1);
  });
});
