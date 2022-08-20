let mockListaHorario = null;
let mockRegistroHorario = null;
let mockQuery = null;

const apoioTeste = require('./apoioTeste');

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
  Horario: {
    findAll: () => {
      return mockListaHorario;
    },
    findOne: () => {
      return mockRegistroHorario;
    },
    create: () => {
      return new Promise((resolve, reject) => {
        resolve({ idHorario: 1 });
      });
    },
  },
  HistoricoHorario: {
    create: () => {
      return new Promise((resolve, reject) => {
        resolve();
      });
    },
  },
}));

beforeEach(() => {
  mockListaHorario = null;
  mockRegistroHorario = null;
  mockQuery = null;
});

test('Listar URL - lista vazia', async () => {
  const horario = require('../api/horario.js');

  mockListaHorario = null;

  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);

  await horario.listar({}, res);

  expect(resposta.getResposta().length).toBe(0);
});

test('Listar URL - lançar exceção', async () => {
  const horario = require('../api/horario.js');

  mockListaHorario = new Error();
  let retorno;

  const res = {
    status: () => {
      return { send: () => {} };
    },
    send: (resposta) => {
      retorno = resposta;
    },
  };

  jest.spyOn(res, 'status');
  await horario.listar({}, res);

  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Listar URL', async () => {
  const horario = require('../api/horario.js');
  mockListaHorario = [{ idHorario: 1, horario: '08:00', indicadorAtivo: 'S' }];

  let retorno;

  const res = {
    status: () => {
      return { send: () => {} };
    },
    send: (resposta) => {
      retorno = resposta;
    },
  };
  await horario.listar({}, res);
  expect(retorno.length).toBe(1);
});

test('Validação de horário - undefined', () => {
  const horario = require('../api/horario.js');

  const req = {
    params: {},
  };
  const res = apoioTeste.gerarRes(jest.fn());
  jest.spyOn(res, 'status');

  horario.isHorarioValido(req, res);

  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Validação de horário - inválido', () => {
  const horario = require('../api/horario.js');

  const req = {
    params: {
      horario: '2234',
    },
  };

  const res = apoioTeste.gerarRes(jest.fn());
  jest.spyOn(res, 'status');

  horario.isHorarioValido(req, res);

  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Validação de horário - válido', () => {
  const horario = require('../api/horario.js');

  const req = {
    params: {
      horario: '22:34',
    },
  };

  const res = apoioTeste.gerarRes(jest.fn());
  jest.spyOn(res, 'status');

  expect(horario.isHorarioValido(req, res)).toBeTruthy();
});

test('Ativação de horário - horário não existe ', async () => {
  const horario = require('../api/horario.js');

  const req = {
    params: {
      idHorario: 1,
    },
  };

  const res = apoioTeste.gerarRes(jest.fn());
  jest.spyOn(res, 'status');

  await horario.ativar(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Ativação de horário - situação inválida ', async () => {
  const horario = require('../api/horario.js');

  const req = {
    params: {
      idHorario: 1,
    },
  };

  mockRegistroHorario = {
    indicadorAtivo: 'S',
  };

  const res = apoioTeste.gerarRes(jest.fn());
  jest.spyOn(res, 'status');

  await horario.ativar(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Ativação de horário - sucesso ', async () => {
  const horario = require('../api/horario.js');

  mockRegistroHorario = {
    idHorario: 1,
    indicadorAtivo: 'N',
    update: () =>
      new Promise((resolve, reject) => {
        resolve();
      }),
  };

  const req = {
    params: {
      idHorario: 1,
    },
  };

  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);

  await horario.ativar(req, res);
  //expect(resposta.getResposta()).toEqual({ idHorario: 1 });
});

test('Ativação de horário - erro', async () => {
  const horario = require('../api/horario.js');

  const req = {
    params: {
      idHorario: 1,
    },
  };

  mockRegistroHorario = new Promise((resolve, reject) => {
    reject();
  });

  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await horario.ativar(req, res);

  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Desativação de horário - sucesso ', async () => {
  const horario = require('../api/horario.js');

  mockRegistroHorario = {
    idHorario: 1,
    indicadorAtivo: 'S',
    update: () =>
      new Promise((resolve, reject) => {
        resolve();
      }),
  };

  const req = {
    params: {
      idHorario: 1,
    },
  };

  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);

  await horario.desativar(req, res);
  //expect(resposta.getResposta()).toEqual({ idHorario: 1 });
});

test('Desativação de horário - situação inválida ', async () => {
  const horario = require('../api/horario.js');

  const req = {
    params: {
      idHorario: 1,
    },
  };

  mockRegistroHorario = {
    indicadorAtivo: 'N',
  };

  const res = apoioTeste.gerarRes(jest.fn());
  jest.spyOn(res, 'status');

  await horario.desativar(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Registrar horário - inválido', async () => {
  const horario = require('../api/horario.js');
  const req = {
    params: {},
  };

  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await horario.registrar(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Registrar horário - horário já existe', async () => {
  const horario = require('../api/horario.js');
  const req = {
    params: { horario: '08:00' },
  };

  mockRegistroHorario = {
    idHorario: 1,
    indicadorAtivo: 'S',
    update: () =>
      new Promise((resolve, reject) => {
        resolve();
      }),
  };

  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await horario.registrar(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Registrar horário - sucesso', async () => {
  const horario = require('../api/horario.js');
  const req = {
    params: { horario: '08:00' },
  };

  mockRegistroHorario = null;

  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await horario.registrar(req, res);
  expect(res.status).toHaveBeenLastCalledWith(201);
});

test('Registrar horário - erro', async () => {
  const horario = require('../api/horario.js');
  const req = {
    params: { horario: '08:00' },
  };

  mockRegistroHorario = new Promise((resolve, reject) => {
    reject();
  });

  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await horario.registrar(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Registrar método', () => {
  const horario = require('../api/horario.js');

  const app = apoioTeste.gerarApp();
  jest.spyOn(app, 'get');
  jest.spyOn(app, 'post');

  try {
    horario.registrarMetodos(app, jest.fn());
  } catch {}

  expect(app.get).toHaveBeenCalled();
  expect(app.post).toHaveBeenCalled();
});

describe('manutencaoSituacao', () => {
  test('Horário possui profissional vinculado, não pode ser desativado', async () => {
    const horario = require('../api/horario.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockRegistroHorario = new Promise((resolve) => {
      resolve({ indicadorAtivo: 'S' });
    });

    mockQuery = new Promise((resolve) => {
      resolve([{}]);
    });

    const req = { params: { idHorario: 1 } };
    await horario.manutencaoSituacao('N', req, res);

    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Horário não possui profissional vinculado, pode ser desativado', async () => {
    const horario = require('../api/horario.js');

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockRegistroHorario = new Promise((resolve) => {
      resolve({ indicadorAtivo: 'S', update: jest.fn() });
    });

    mockQuery = new Promise((resolve) => {
      resolve([]);
    });

    const req = { params: { idHorario: 1 } };
    await horario.manutencaoSituacao('N', req, res);

    expect(res.status).not.toHaveBeenLastCalledWith(400);
  });
});
