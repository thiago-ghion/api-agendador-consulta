const apoioTeste = require('./apoioTeste');

let mockQuery = null;

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
}));

beforeEach(() => {
  mockQuery = null;
});

describe('Parte comum', () => {
  test('Registrar método', () => {
    const paciente = require('../api/estatistica.js');

    const app = apoioTeste.gerarApp();
    jest.spyOn(app, 'get');
    jest.spyOn(app, 'post');

    try {
      paciente.registrarMetodos(app, jest.fn());
    } catch {}

    expect(app.get).toHaveBeenCalled();
  });
});

describe('Validar período', () => {
  test('Data inicio não preenchido', async () => {
    const estatistica = require('../api/estatistica.js');

    const req = { query: {} };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    estatistica.validarPeriodo(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Data inicio inválida', async () => {
    const estatistica = require('../api/estatistica.js');

    const req = { query: { dataInicio: 'aaaaaaaa' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    estatistica.validarPeriodo(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Data fim não preenchida', async () => {
    const estatistica = require('../api/estatistica.js');

    const req = { query: { dataInicio: '12.02.2022' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    estatistica.validarPeriodo(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Data fim inválida', async () => {
    const estatistica = require('../api/estatistica.js');

    const req = { query: { dataInicio: '12.02.2022', dataFim: 'aaaaaaa' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    estatistica.validarPeriodo(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Período de data inválido', async () => {
    const estatistica = require('../api/estatistica.js');

    const req = { query: { dataInicio: '12.02.2022', dataFim: '12.05.2022' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    estatistica.validarPeriodo(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Datas invertidas', async () => {
    const estatistica = require('../api/estatistica.js');

    const req = { query: { dataInicio: '12.05.2022', dataFim: '12.04.2022' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    estatistica.validarPeriodo(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Período válido', async () => {
    const estatistica = require('../api/estatistica.js');

    const req = { query: { dataInicio: '12.04.2022', dataFim: '12.05.2022' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const datas = estatistica.validarPeriodo(req, res);

    expect(datas.dataInicio).toBe('2022-04-12T03:00:00.000Z');
    expect(datas.dataFim).toBe('2022-05-12T03:00:00.000Z');
  });
});

describe('listarHorariosMaisUtilizados', () => {
  test('Data inválida', async () => {
    const estatistica = require('../api/estatistica.js');

    const req = { query: { dataInicio: '12.04.2022', dataFim: '12.12.2022' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await estatistica.listarHorariosMaisUtilizados(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Falha na consulta', async () => {
    const estatistica = require('../api/estatistica.js');

    const req = { query: { dataInicio: '12.04.2022', dataFim: '12.04.2022' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockQuery = new Promise((resolve, reject) => {
      reject();
    });

    await estatistica.listarHorariosMaisUtilizados(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Consulta com sucesso', async () => {
    const estatistica = require('../api/estatistica.js');

    const req = { query: { dataInicio: '12.04.2022', dataFim: '12.04.2022' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockQuery = new Promise((resolve, reject) => {
      resolve({});
    });

    await estatistica.listarHorariosMaisUtilizados(req, res);

    expect(resposta.getResposta()).toBeDefined();
  });
});

describe('listarConsultasDiasSemana', () => {
  test('Data inválida', async () => {
    const estatistica = require('../api/estatistica.js');

    const req = { query: { dataInicio: '12.04.2022', dataFim: '12.12.2022' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await estatistica.listarConsultasDiasSemana(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Falha na consulta', async () => {
    const estatistica = require('../api/estatistica.js');

    const req = { query: { dataInicio: '12.04.2022', dataFim: '12.04.2022' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockQuery = new Promise((resolve, reject) => {
      reject();
    });

    await estatistica.listarConsultasDiasSemana(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Consulta com sucesso, todos os dias com quantidade', async () => {
    const estatistica = require('../api/estatistica.js');

    const req = { query: { dataInicio: '12.04.2022', dataFim: '12.04.2022' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockQuery = new Promise((resolve, reject) => {
      resolve([
        { dia: 0, quantidade: 1 },
        { dia: 1, quantidade: 1 },
        { dia: 2, quantidade: 1 },
        { dia: 3, quantidade: 1 },
        { dia: 4, quantidade: 1 },
        { dia: 5, quantidade: 1 },
        { dia: 6, quantidade: 1 },
      ]);
    });

    await estatistica.listarConsultasDiasSemana(req, res);

    expect(resposta.getResposta()).toBeDefined();
  });

  test('Consulta com sucesso, faltando segunda e quarta', async () => {
    const estatistica = require('../api/estatistica.js');

    const req = { query: { dataInicio: '12.04.2022', dataFim: '12.04.2022' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockQuery = new Promise((resolve, reject) => {
      resolve([
        { dia: 0, quantidade: 1 },
        { dia: 2, quantidade: 1 },
        { dia: 4, quantidade: 1 },
        { dia: 5, quantidade: 1 },
        { dia: 6, quantidade: 1 },
      ]);
    });

    await estatistica.listarConsultasDiasSemana(req, res);

    expect(resposta.getResposta()).toEqual([
      { dia: 0, quantidade: 1 },
      { dia: 1, quantidade: 0 },
      { dia: 2, quantidade: 1 },
      { dia: 3, quantidade: 0 },
      { dia: 4, quantidade: 1 },
      { dia: 5, quantidade: 1 },
      { dia: 6, quantidade: 1 },
    ]);
  });
});

describe('listarProfissionaisMaisConsultas', () => {
  test('Data inválida', async () => {
    const estatistica = require('../api/estatistica.js');

    const req = { query: { dataInicio: '12.04.2022', dataFim: '12.12.2022' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await estatistica.listarProfissionaisMaisConsultas(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Falha na consulta', async () => {
    const estatistica = require('../api/estatistica.js');

    const req = { query: { dataInicio: '12.04.2022', dataFim: '12.04.2022' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockQuery = new Promise((resolve, reject) => {
      reject();
    });

    await estatistica.listarProfissionaisMaisConsultas(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Consulta com sucesso', async () => {
    const estatistica = require('../api/estatistica.js');

    const req = { query: { dataInicio: '12.04.2022', dataFim: '12.04.2022' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockQuery = new Promise((resolve, reject) => {
      resolve({});
    });

    await estatistica.listarProfissionaisMaisConsultas(req, res);

    expect(resposta.getResposta()).toBeDefined();
  });
});

describe('listarConsultasAtivasVersusCanceladas', () => {
  test('Data inválida', async () => {
    const estatistica = require('../api/estatistica.js');

    const req = { query: { dataInicio: '12.04.2022', dataFim: '12.12.2022' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await estatistica.listarConsultasAtivasVersusCanceladas(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Falha na consulta', async () => {
    const estatistica = require('../api/estatistica.js');

    const req = { query: { dataInicio: '12.04.2022', dataFim: '12.04.2022' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockQuery = new Promise((resolve, reject) => {
      reject();
    });

    await estatistica.listarConsultasAtivasVersusCanceladas(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Consulta com sucesso', async () => {
    const estatistica = require('../api/estatistica.js');

    const req = { query: { dataInicio: '12.04.2022', dataFim: '12.04.2022' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockQuery = new Promise((resolve, reject) => {
      resolve({});
    });

    await estatistica.listarConsultasAtivasVersusCanceladas(req, res);

    expect(resposta.getResposta()).toBeDefined();
  });
});

describe('listarLoginProprioVersusOauth', () => {
  test('Data inválida', async () => {
    const estatistica = require('../api/estatistica.js');

    const req = { query: { dataInicio: '12.04.2022', dataFim: '12.12.2022' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await estatistica.listarLoginProprioVersusOauth(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Falha na consulta', async () => {
    const estatistica = require('../api/estatistica.js');

    const req = { query: { dataInicio: '12.04.2022', dataFim: '12.04.2022' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockQuery = new Promise((resolve, reject) => {
      reject();
    });

    await estatistica.listarLoginProprioVersusOauth(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Consulta com sucesso', async () => {
    const estatistica = require('../api/estatistica.js');

    const req = { query: { dataInicio: '12.04.2022', dataFim: '12.04.2022' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockQuery = new Promise((resolve, reject) => {
      resolve({});
    });

    await estatistica.listarLoginProprioVersusOauth(req, res);

    expect(resposta.getResposta()).toBeDefined();
  });
});
