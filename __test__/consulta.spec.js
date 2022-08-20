const apoioTeste = require('./apoioTeste');
const db = require('../models/index.js');
const moment = require('moment');

let mockListaPaciente = null;
let mockPaciente = null;
let mockListaProfissional = null;
let mockProfissional = null;
let mockListaHorario = null;
let mockHorario = null;
let mockRequisicaoHistoricoConsulta = null;
let mockListaVinculo = null;
let mockVinculo = null;
let mockConsulta = null;
let mockConsultaIndicador = null;
let mockConsultaCreate = jest.fn();

jest.mock('../models/index.js', () => ({
  sequelize: {
    transaction: async (funcao) => {
      return funcao();
    },
    literal: () => '',
    query: () => mockListaPaciente,
    QueryTypes: {
      SELECT: 1,
    },
  },
  Paciente: {
    findAll: () => {
      return mockListaPaciente;
    },
    findOne: () => {
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
  Consulta: {
    findAll: () => {
      return mockListaConsulta;
    },
    findOne: (objeto) => {
      if (
        objeto !== undefined &&
        objeto.where !== undefined &&
        objeto.where.indicadorConsultaCancelada !== undefined
      ) {
        return mockConsultaIndicador;
      }
      return mockConsulta;
    },
    create: () => {
      mockConsultaCreate();
      return new Promise((resolve, reject) => {
        resolve();
      });
    },
  },
  HistoricoConsulta: {
    create: (objeto) => {
      mockRequisicaoHistoricoConsulta = objeto;
      return new Promise((resolve) => {
        resolve();
      });
    },
  },
  Profissional: {
    findAll: () => {
      return mockListaProfissional;
    },
    findOne: () => {
      return mockProfissional;
    },
  },
  Horario: {
    findAll: () => {
      return mockListaHorario;
    },
    findOne: () => {
      return mockHorario;
    },
  },
  VinculoProfissionalHorario: {
    findAll: () => {
      return mockListaVinculo;
    },
    findOne: () => {
      return mockVinculo;
    },
  },
}));

jest.mock('../util/Util.js', () => {
  const originalModule = jest.requireActual('../util/Util.js');
  return {
    ...originalModule,
    getDataHoraAtual: () => {
      return '02.05.2022 08:00';
    },
  };
});

beforeEach(() => {
  mockListaPaciente = null;
  mockPaciente = null;
  mockListaProfissional = null;
  mockProfissional = null;
  mockListaHorario = null;
  mockHorario = null;
  mockListaConsulta = null;
  mockConsulta = null;
  mockRequisicaoHistoricoConsulta = null;
  mockListaVinculo = null;
  mockVinculo = null;
  mockConsultaIndicador = null;
  mockConsultaCreate = jest.fn();
});

test('listarConsultaTodasProfissional - id do profissional não preenchido', async () => {
  const paciente = require('../api/consulta.js');

  const req = { query: {} };
  const res = apoioTeste.gerarRes({});

  jest.spyOn(res, 'status');

  await paciente.listarConsultaTodasProfissional(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('listarConsultaTodasProfissional - data início não preenchido', async () => {
  const paciente = require('../api/consulta.js');

  const req = { query: { idProfissional: 1 } };
  const res = apoioTeste.gerarRes({});

  jest.spyOn(res, 'status');

  await paciente.listarConsultaTodasProfissional(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('listarConsultaTodasProfissional - data início inválida', async () => {
  const paciente = require('../api/consulta.js');

  const req = { query: { idProfissional: 1, dataInicio: '23989283' } };
  const res = apoioTeste.gerarRes({});

  jest.spyOn(res, 'status');

  await paciente.listarConsultaTodasProfissional(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('listarConsultaTodasProfissional - data fim não preenchido', async () => {
  const paciente = require('../api/consulta.js');

  const req = { query: { idProfissional: 1, dataInicio: '02.05.2022' } };
  const res = apoioTeste.gerarRes({});

  jest.spyOn(res, 'status');

  await paciente.listarConsultaTodasProfissional(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('listarConsultaTodasProfissional - data fim inválida', async () => {
  const paciente = require('../api/consulta.js');

  const req = {
    query: { idProfissional: 1, dataInicio: '02.05.2022', dataFim: '33232' },
  };
  const res = apoioTeste.gerarRes({});

  jest.spyOn(res, 'status');

  await paciente.listarConsultaTodasProfissional(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('listarConsultaTodasProfissional - intervalo inválido', async () => {
  const paciente = require('../api/consulta.js');

  const req = {
    query: {
      idProfissional: 1,
      dataInicio: '02.05.2022',
      dataFim: '02.12.2022',
    },
  };
  const res = apoioTeste.gerarRes({});

  jest.spyOn(res, 'status');

  await paciente.listarConsultaTodasProfissional(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('listarConsultaTodasProfissional - lista vazia', async () => {
  const paciente = require('../api/consulta.js');

  mockListaPaciente = new Promise((resolve, reject) => {
    resolve(null);
  });

  const req = {
    query: {
      idProfissional: 1,
      dataInicio: '02.05.2022',
      dataFim: '03.05.2022',
    },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);

  await paciente.listarConsultaTodasProfissional(req, res);
  expect(resposta.getResposta()).toEqual([]);
});

test('listarConsultaTodasProfissional - erro na consulta', async () => {
  const paciente = require('../api/consulta.js');

  mockListaPaciente = new Promise((resolve, reject) => {
    reject();
  });

  const req = {
    query: {
      idProfissional: 1,
      dataInicio: '02.05.2022',
      dataFim: '03.05.2022',
    },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await paciente.listarConsultaTodasProfissional(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

//////

test('listarConsultaTodasPaciente - id do paciente não preenchido', async () => {
  const paciente = require('../api/consulta.js');

  const req = { query: {} };
  const res = apoioTeste.gerarRes({});

  jest.spyOn(res, 'status');

  await paciente.listarConsultaTodasPaciente(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('listarConsultaTodasPaciente - data início não preenchido', async () => {
  const paciente = require('../api/consulta.js');

  const req = { query: { idPaciente: 1 } };
  const res = apoioTeste.gerarRes({});

  jest.spyOn(res, 'status');

  await paciente.listarConsultaTodasPaciente(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('listarConsultaTodasPaciente - data início inválida', async () => {
  const paciente = require('../api/consulta.js');

  const req = { query: { idPaciente: 1, dataInicio: '23989283' } };
  const res = apoioTeste.gerarRes({});

  jest.spyOn(res, 'status');

  await paciente.listarConsultaTodasPaciente(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('listarConsultaTodasPaciente - data fim não preenchido', async () => {
  const paciente = require('../api/consulta.js');

  const req = { query: { idPaciente: 1, dataInicio: '02.05.2022' } };
  const res = apoioTeste.gerarRes({});

  jest.spyOn(res, 'status');

  await paciente.listarConsultaTodasPaciente(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('listarConsultaTodasPaciente - data fim inválida', async () => {
  const paciente = require('../api/consulta.js');

  const req = {
    query: { idPaciente: 1, dataInicio: '02.05.2022', dataFim: '33232' },
  };
  const res = apoioTeste.gerarRes({});

  jest.spyOn(res, 'status');

  await paciente.listarConsultaTodasPaciente(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('listarConsultaTodasPaciente - intervalo inválido', async () => {
  const paciente = require('../api/consulta.js');

  const req = {
    query: {
      idPaciente: 1,
      dataInicio: '02.05.2022',
      dataFim: '02.12.2022',
    },
  };
  const res = apoioTeste.gerarRes({});

  jest.spyOn(res, 'status');

  await paciente.listarConsultaTodasPaciente(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('listarConsultaTodasPaciente - lista vazia', async () => {
  const paciente = require('../api/consulta.js');

  mockListaPaciente = new Promise((resolve, reject) => {
    resolve(null);
  });

  const req = {
    query: {
      idPaciente: 1,
      dataInicio: '02.05.2022',
      dataFim: '03.05.2022',
    },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);

  await paciente.listarConsultaTodasPaciente(req, res);
  expect(resposta.getResposta()).toEqual([]);
});

test('listarConsultaTodasPaciente - erro na consulta', async () => {
  const paciente = require('../api/consulta.js');

  mockListaPaciente = new Promise((resolve, reject) => {
    reject();
  });

  const req = {
    query: {
      idPaciente: 1,
      dataInicio: '02.05.2022',
      dataFim: '03.05.2022',
    },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await paciente.listarConsultaTodasPaciente(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

///

test('listarConsulta - id do paciente não preenchido', async () => {
  const paciente = require('../api/consulta.js');

  const req = { query: {} };
  const res = apoioTeste.gerarRes({});

  jest.spyOn(res, 'status');

  await paciente.listarConsulta(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('listarConsulta - id do profissional não preenchido', async () => {
  const paciente = require('../api/consulta.js');

  const req = { query: { idPaciente: 1 } };
  const res = apoioTeste.gerarRes({});

  jest.spyOn(res, 'status');

  await paciente.listarConsulta(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('listarConsulta - data início não preenchido', async () => {
  const paciente = require('../api/consulta.js');

  const req = { query: { idPaciente: 1, idProfissional: 1 } };
  const res = apoioTeste.gerarRes({});

  jest.spyOn(res, 'status');

  await paciente.listarConsulta(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('listarConsulta - data início inválida', async () => {
  const paciente = require('../api/consulta.js');

  const req = {
    query: { idPaciente: 1, idProfissional: 1, dataInicio: '3232232' },
  };
  const res = apoioTeste.gerarRes({});

  jest.spyOn(res, 'status');

  await paciente.listarConsulta(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('listarConsulta - data fim não preenchida', async () => {
  const paciente = require('../api/consulta.js');

  const req = {
    query: { idPaciente: 1, idProfissional: 1, dataInicio: '02.05.2022' },
  };
  const res = apoioTeste.gerarRes({});

  jest.spyOn(res, 'status');

  await paciente.listarConsulta(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('listarConsulta - data fim inválida', async () => {
  const paciente = require('../api/consulta.js');

  const req = {
    query: {
      idPaciente: 1,
      idProfissional: 1,
      dataInicio: '02.05.2022',
      dataFim: '2323232',
    },
  };
  const res = apoioTeste.gerarRes({});

  jest.spyOn(res, 'status');

  await paciente.listarConsulta(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('listarConsulta - intervalo inválido', async () => {
  const paciente = require('../api/consulta.js');

  const req = {
    query: {
      idPaciente: 1,
      idProfissional: 1,
      dataInicio: '02.05.2022',
      dataFim: '02.05.2023',
    },
  };
  const res = apoioTeste.gerarRes({});

  jest.spyOn(res, 'status');

  await paciente.listarConsulta(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('listarConsulta - lista vazia', async () => {
  const paciente = require('../api/consulta.js');

  mockListaPaciente = new Promise((resolve, reject) => {
    resolve(null);
  });

  const req = {
    query: {
      idPaciente: 1,
      idProfissional: 1,
      dataInicio: '02.05.2022',
      dataFim: '03.05.2022',
    },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);

  await paciente.listarConsulta(req, res);
  expect(resposta.getResposta()).toEqual([]);
});

test('listarConsulta - erro na consulta', async () => {
  const paciente = require('../api/consulta.js');

  mockListaPaciente = new Promise((resolve, reject) => {
    reject();
  });

  const req = {
    query: {
      idPaciente: 1,
      idProfissional: 1,
      dataInicio: '02.05.2022',
      dataFim: '03.05.2022',
    },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await paciente.listarConsulta(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

///

test('Cancelamento da consulta - paciente não informado', async () => {
  const paciente = require('../api/consulta.js');

  const req = {
    token: {
      id: 32,
      nivelUsuario: 3,
    },
    body: {},
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await paciente.cancelar(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Cancelamento da consulta - paciente não existe', async () => {
  const paciente = require('../api/consulta.js');

  mockPaciente = new Promise((resolve, reject) => {
    resolve(null);
  });

  const req = {
    token: {
      id: 32,
      nivelUsuario: 3,
    },
    body: { idPaciente: 1 },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await paciente.cancelar(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Cancelamento da consulta - profissional não informado', async () => {
  const paciente = require('../api/consulta.js');

  mockPaciente = new Promise((resolve, reject) => {
    resolve({});
  });

  const req = {
    token: {
      id: 32,
      nivelUsuario: 3,
    },
    body: { idPaciente: 1 },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await paciente.cancelar(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Cancelamento da consulta - profissional não encontrado', async () => {
  const paciente = require('../api/consulta.js');

  mockPaciente = new Promise((resolve, reject) => {
    resolve({});
  });

  mockProfissional = new Promise((resolve, reject) => {
    resolve(null);
  });

  const req = {
    token: {
      id: 32,
      nivelUsuario: 3,
    },
    body: { idPaciente: 1, idProfissional: 1 },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await paciente.cancelar(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Cancelamento da consulta - data consulta não informada', async () => {
  const paciente = require('../api/consulta.js');

  mockPaciente = new Promise((resolve, reject) => {
    resolve({});
  });

  mockProfissional = new Promise((resolve, reject) => {
    resolve({});
  });

  const req = {
    token: {
      id: 32,
      nivelUsuario: 3,
    },
    body: { idPaciente: 1, idProfissional: 1 },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await paciente.cancelar(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Cancelamento da consulta - data consulta inválida', async () => {
  const paciente = require('../api/consulta.js');

  mockPaciente = new Promise((resolve, reject) => {
    resolve({});
  });

  mockProfissional = new Promise((resolve, reject) => {
    resolve({});
  });

  const req = {
    token: {
      id: 32,
      nivelUsuario: 3,
    },
    body: { idPaciente: 1, idProfissional: 1, dataConsulta: '223242' },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await paciente.cancelar(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Cancelamento da consulta - horário não informado', async () => {
  const paciente = require('../api/consulta.js');

  mockPaciente = new Promise((resolve, reject) => {
    resolve({});
  });

  mockProfissional = new Promise((resolve, reject) => {
    resolve({});
  });

  const req = {
    token: {
      id: 32,
      nivelUsuario: 3,
    },
    body: { idPaciente: 1, idProfissional: 1, dataConsulta: '02.05.2022' },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await paciente.cancelar(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Cancelamento da consulta - horário não encontrado', async () => {
  const paciente = require('../api/consulta.js');

  mockPaciente = new Promise((resolve, reject) => {
    resolve({});
  });

  mockProfissional = new Promise((resolve, reject) => {
    resolve({});
  });

  mockHorario = new Promise((resolve, reject) => {
    resolve(null);
  });

  const req = {
    token: {
      id: 32,
      nivelUsuario: 3,
    },
    body: {
      idPaciente: 1,
      idProfissional: 1,
      dataConsulta: '02.05.2022',
      idHorario: 1,
    },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await paciente.cancelar(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Cancelamento da consulta - consulta não encontrado', async () => {
  const paciente = require('../api/consulta.js');

  mockPaciente = new Promise((resolve, reject) => {
    resolve({});
  });

  mockProfissional = new Promise((resolve, reject) => {
    resolve({});
  });

  mockHorario = new Promise((resolve, reject) => {
    resolve({});
  });

  mockConsulta = new Promise((resolve, reject) => {
    resolve(null);
  });

  const req = {
    token: {
      id: 32,
      nivelUsuario: 3,
    },
    body: {
      idPaciente: 1,
      idProfissional: 1,
      dataConsulta: '02.05.2022',
      idHorario: 1,
    },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await paciente.cancelar(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Cancelamento da consulta - consulta já cancelada', async () => {
  const paciente = require('../api/consulta.js');

  mockPaciente = new Promise((resolve, reject) => {
    resolve({});
  });

  mockProfissional = new Promise((resolve, reject) => {
    resolve({});
  });

  mockHorario = new Promise((resolve, reject) => {
    resolve({});
  });

  mockConsulta = new Promise((resolve, reject) => {
    resolve({ indicadorConsultaCancelada: 'S' });
  });

  const req = {
    token: {
      id: 32,
      nivelUsuario: 3,
    },
    body: {
      idPaciente: 1,
      idProfissional: 1,
      dataConsulta: '02.05.2022',
      idHorario: 1,
    },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await paciente.cancelar(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Cancelamento da consulta - consulta expirou o prazo para cancelar', async () => {
  const consulta = require('../api/consulta.js');

  mockPaciente = new Promise((resolve, reject) => {
    resolve({});
  });

  mockProfissional = new Promise((resolve, reject) => {
    resolve({});
  });

  mockHorario = new Promise((resolve, reject) => {
    resolve({ textoHorario: '07:30' });
  });

  mockConsulta = new Promise((resolve, reject) => {
    resolve({ indicadorConsultaCancelada: 'N', dataVinculo: '02.05.2022' });
  });

  const req = {
    token: {
      id: 32,
      nivelUsuario: 3,
    },
    body: {
      idPaciente: 1,
      idProfissional: 1,
      dataConsulta: '02.05.2022',
      idHorario: 1,
    },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await consulta.cancelar(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Cancelamento da consulta - falha na consulta', async () => {
  const consulta = require('../api/consulta.js');

  mockPaciente = new Promise((resolve, reject) => {
    resolve({});
  });

  mockProfissional = new Promise((resolve, reject) => {
    resolve({});
  });

  mockHorario = new Promise((resolve, reject) => {
    resolve({ textoHorario: '07:30' });
  });

  mockConsulta = new Promise((resolve, reject) => {
    reject();
  });

  const req = {
    token: {
      id: 32,
      nivelUsuario: 3,
    },
    body: {
      idPaciente: 1,
      idProfissional: 1,
      dataConsulta: '02.05.2022',
      idHorario: 1,
    },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await consulta.cancelar(req, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Cancelamento da consulta - próprio paciente', async () => {
  const consulta = require('../api/consulta.js');

  mockPaciente = new Promise((resolve, reject) => {
    resolve({});
  });

  mockProfissional = new Promise((resolve, reject) => {
    resolve({});
  });

  mockHorario = new Promise((resolve, reject) => {
    resolve({ textoHorario: '08:30' });
  });

  mockConsulta = new Promise((resolve, reject) => {
    resolve({
      indicadorConsultaCancelada: 'N',
      dataVinculo: '2022-05-02',
      update: jest.fn(),
    });
  });

  const req = {
    token: {
      id: 1,
      nivelUsuario: 1,
    },
    body: {
      idPaciente: 1,
      idProfissional: 1,
      dataConsulta: '02.05.2022',
      idHorario: 1,
    },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await consulta.cancelar(req, res);

  expect(mockRequisicaoHistoricoConsulta.idColaborador).toBeNull();
});

test('Cancelamento da consulta - colaborador não administrador', async () => {
  const consulta = require('../api/consulta.js');

  mockPaciente = new Promise((resolve, reject) => {
    resolve({});
  });

  mockProfissional = new Promise((resolve, reject) => {
    resolve({});
  });

  mockHorario = new Promise((resolve, reject) => {
    resolve({ textoHorario: '08:30' });
  });

  mockConsulta = new Promise((resolve, reject) => {
    resolve({
      indicadorConsultaCancelada: 'N',
      dataVinculo: '2022-05-02',
      update: jest.fn(),
    });
  });

  const req = {
    token: {
      id: 1,
      nivelUsuario: 2,
    },
    body: {
      idPaciente: 1,
      idProfissional: 1,
      dataConsulta: '02.05.2022',
      idHorario: 1,
    },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await consulta.cancelar(req, res);

  expect(mockRequisicaoHistoricoConsulta.idColaborador).toBe(1);
});

test('Cancelamento da consulta - colaborador administrador', async () => {
  const consulta = require('../api/consulta.js');

  mockPaciente = new Promise((resolve, reject) => {
    resolve({});
  });

  mockProfissional = new Promise((resolve, reject) => {
    resolve({});
  });

  mockHorario = new Promise((resolve, reject) => {
    resolve({ textoHorario: '08:30' });
  });

  mockConsulta = new Promise((resolve, reject) => {
    resolve({
      indicadorConsultaCancelada: 'N',
      dataVinculo: '2022-05-02',
      update: jest.fn(),
    });
  });

  const req = {
    token: {
      id: 32,
      nivelUsuario: 3,
    },
    body: {
      idPaciente: 1,
      idProfissional: 1,
      dataConsulta: '02.05.2022',
      idHorario: 1,
    },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await consulta.cancelar(req, res);

  expect(mockRequisicaoHistoricoConsulta.idColaborador).toBe(32);
});

test('Cancelamento da consulta - Paciente tentando outro paciente', async () => {
  const consulta = require('../api/consulta.js');

  mockPaciente = new Promise((resolve, reject) => {
    resolve({});
  });

  mockProfissional = new Promise((resolve, reject) => {
    resolve({});
  });

  mockHorario = new Promise((resolve, reject) => {
    resolve({ textoHorario: '08:30' });
  });

  mockConsulta = new Promise((resolve, reject) => {
    resolve({
      indicadorConsultaCancelada: 'N',
      dataVinculo: '02.05.2022',
      update: jest.fn(),
    });
  });

  const req = {
    token: {
      id: 2,
      nivelUsuario: 1,
    },
    body: {
      idPaciente: 1,
      idProfissional: 1,
      dataConsulta: '02.05.2022',
      idHorario: 1,
    },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await consulta.cancelar(req, res);

  expect(res.status).toHaveBeenLastCalledWith(400);
});

///

test('Agendamento da consulta - Paciente tentando outro paciente', async () => {
  const consulta = require('../api/consulta.js');

  mockPaciente = new Promise((resolve, reject) => {
    resolve({});
  });

  mockProfissional = new Promise((resolve, reject) => {
    resolve({});
  });

  mockHorario = new Promise((resolve, reject) => {
    resolve({ textoHorario: '08:30' });
  });

  mockConsulta = new Promise((resolve, reject) => {
    resolve({
      indicadorConsultaCancelada: 'N',
      dataVinculo: '02.05.2022',
      update: jest.fn(),
    });
  });

  const req = {
    token: {
      id: 2,
      nivelUsuario: 1,
    },
    body: {
      idPaciente: 1,
      idProfissional: 1,
      dataConsulta: '02.05.2022',
      idHorario: 1,
    },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await consulta.agendar(req, res);

  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Agendamento da consulta - configuração de horário não existente', async () => {
  const consulta = require('../api/consulta.js');

  mockPaciente = new Promise((resolve, reject) => {
    resolve({});
  });

  mockProfissional = new Promise((resolve, reject) => {
    resolve({});
  });

  mockHorario = new Promise((resolve, reject) => {
    resolve({ textoHorario: '08:30' });
  });

  mockConsulta = new Promise((resolve, reject) => {
    resolve({
      indicadorConsultaCancelada: 'N',
      dataVinculo: '02.05.2022',
      update: jest.fn(),
    });
  });

  mockVinculo = new Promise((resolve) => {
    resolve(null);
  });

  const req = {
    token: {
      id: 1,
      nivelUsuario: 1,
    },
    body: {
      idPaciente: 1,
      idProfissional: 1,
      dataConsulta: '02.05.2022',
      idHorario: 1,
    },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await consulta.agendar(req, res);

  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Agendamento da consulta - horário não disponível', async () => {
  const consulta = require('../api/consulta.js');

  mockPaciente = new Promise((resolve, reject) => {
    resolve({});
  });

  mockProfissional = new Promise((resolve, reject) => {
    resolve({});
  });

  mockHorario = new Promise((resolve, reject) => {
    resolve({ textoHorario: '08:30' });
  });

  mockConsultaIndicador = new Promise((resolve, reject) => {
    resolve({
      indicadorConsultaCancelada: 'N',
      dataVinculo: '02.05.2022',
      update: jest.fn(),
    });
  });

  mockVinculo = new Promise((resolve) => {
    resolve({});
  });

  const req = {
    token: {
      id: 1,
      nivelUsuario: 1,
    },
    body: {
      idPaciente: 1,
      idProfissional: 1,
      dataConsulta: '02.05.2022',
      idHorario: 1,
    },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await consulta.agendar(req, res);

  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Agendamento da consulta - próprio paciente - horário não utilizado por ele anteriormente', async () => {
  const consulta = require('../api/consulta.js');

  mockPaciente = new Promise((resolve, reject) => {
    resolve({});
  });

  mockProfissional = new Promise((resolve, reject) => {
    resolve({});
  });

  mockHorario = new Promise((resolve, reject) => {
    resolve({ textoHorario: '08:30' });
  });

  mockConsultaIndicador = new Promise((resolve, reject) => {
    resolve(null);
  });

  mockVinculo = new Promise((resolve) => {
    resolve({});
  });

  mockConsulta = new Promise((resolve) => {
    resolve(null);
  });

  const req = {
    token: {
      id: 1,
      nivelUsuario: 1,
    },
    body: {
      idPaciente: 1,
      idProfissional: 1,
      dataConsulta: '02.05.2022',
      idHorario: 1,
    },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await consulta.agendar(req, res);

  expect(mockConsultaCreate).toHaveBeenCalled();
  expect(res.status).toHaveBeenLastCalledWith(201);
});

test('Agendamento da consulta - próprio paciente - horário já utilizado por ele anteriormente', async () => {
  const consulta = require('../api/consulta.js');

  mockPaciente = new Promise((resolve, reject) => {
    resolve({});
  });

  mockProfissional = new Promise((resolve, reject) => {
    resolve({});
  });

  mockHorario = new Promise((resolve, reject) => {
    resolve({ textoHorario: '08:30' });
  });

  mockConsultaIndicador = new Promise((resolve, reject) => {
    resolve(null);
  });

  mockVinculo = new Promise((resolve) => {
    resolve({});
  });

  objetoConsulta = { update: jest.fn() };
  mockConsulta = new Promise((resolve) => {
    resolve(objetoConsulta);
  });

  const req = {
    token: {
      id: 1,
      nivelUsuario: 1,
    },
    body: {
      idPaciente: 1,
      idProfissional: 1,
      dataConsulta: '02.05.2022',
      idHorario: 1,
    },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await consulta.agendar(req, res);

  expect(mockConsultaCreate).not.toHaveBeenCalled();
  expect(objetoConsulta.update).toHaveBeenCalled();
  expect(res.status).toHaveBeenLastCalledWith(201);
});

///

test('Agendamento da consulta - colaborador administrador', async () => {
  const consulta = require('../api/consulta.js');

  mockPaciente = new Promise((resolve, reject) => {
    resolve({});
  });

  mockProfissional = new Promise((resolve, reject) => {
    resolve({});
  });

  mockHorario = new Promise((resolve, reject) => {
    resolve({ textoHorario: '08:30' });
  });

  mockConsultaIndicador = new Promise((resolve, reject) => {
    resolve(null);
  });

  mockVinculo = new Promise((resolve) => {
    resolve({});
  });

  mockConsulta = new Promise((resolve) => {
    resolve(null);
  });

  const req = {
    token: {
      id: 32,
      nivelUsuario: 2,
    },
    body: {
      idPaciente: 1,
      idProfissional: 1,
      dataConsulta: '02.05.2022',
      idHorario: 1,
    },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await consulta.agendar(req, res);

  expect(mockConsultaCreate).toHaveBeenCalled();
  expect(res.status).toHaveBeenLastCalledWith(201);
});

test('Agendamento da consulta - colaborador não administrador', async () => {
  const consulta = require('../api/consulta.js');

  mockPaciente = new Promise((resolve, reject) => {
    resolve({});
  });

  mockProfissional = new Promise((resolve, reject) => {
    resolve({});
  });

  mockHorario = new Promise((resolve, reject) => {
    resolve({ textoHorario: '08:30' });
  });

  mockConsultaIndicador = new Promise((resolve, reject) => {
    resolve(null);
  });

  mockVinculo = new Promise((resolve) => {
    resolve({});
  });

  mockConsulta = new Promise((resolve) => {
    resolve(null);
  });

  const req = {
    token: {
      id: 32,
      nivelUsuario: 3,
    },
    body: {
      idPaciente: 1,
      idProfissional: 1,
      dataConsulta: '02.05.2022',
      idHorario: 1,
    },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await consulta.agendar(req, res);

  expect(mockConsultaCreate).toHaveBeenCalled();
  expect(res.status).toHaveBeenLastCalledWith(201);
});

///

test('Agendamento da consulta - falha na consulta', async () => {
  const consulta = require('../api/consulta.js');

  mockPaciente = new Promise((resolve, reject) => {
    reject({});
  });

  mockProfissional = new Promise((resolve, reject) => {
    resolve({});
  });

  mockHorario = new Promise((resolve, reject) => {
    resolve({ textoHorario: '08:30' });
  });

  mockConsultaIndicador = new Promise((resolve, reject) => {
    resolve(null);
  });

  mockVinculo = new Promise((resolve) => {
    resolve({});
  });

  mockConsulta = new Promise((resolve) => {
    resolve(null);
  });

  const req = {
    token: {
      id: 32,
      nivelUsuario: 3,
    },
    body: {
      idPaciente: 1,
      idProfissional: 1,
      dataConsulta: '02.05.2022',
      idHorario: 1,
    },
  };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await consulta.agendar(req, res);

  expect(res.status).toHaveBeenLastCalledWith(400);
});

describe('Parte comum', () => {
  test('Registrar método', () => {
    const consulta = require('../api/consulta.js');

    const app = apoioTeste.gerarApp();
    jest.spyOn(app, 'get');
    jest.spyOn(app, 'post');

    try {
      consulta.registrarMetodos(app, jest.fn());
    } catch {}

    expect(app.get).toHaveBeenCalled();
    expect(app.post).toHaveBeenCalled();
  });
});

describe('podeCancelarConsulta', () => {
  test('Data consulta inferior a data atual, consulta não cancelada', () => {
    const consulta = require('../api/consulta.js');

    const dataConsulta = moment().subtract(1, 'day').format('DD.MM.YYYY');;
    const horario = '08:00';
    const indicadorConsultaCancelada = 'N';

    expect(
      consulta.podeCancelarConsulta(
        dataConsulta,
        horario,
        indicadorConsultaCancelada
      )
    ).toBe('N');
  });

  test('Data consulta inferior a data atual, consulta cancelada', () => {
    const consulta = require('../api/consulta.js');

    const dataConsulta = moment().subtract(1, 'day').format('DD.MM.YYYY');;
    const horario = '08:00';
    const indicadorConsultaCancelada = 'N';

    expect(
      consulta.podeCancelarConsulta(
        dataConsulta,
        horario,
        indicadorConsultaCancelada
      )
    ).toBe('N');
  });

  test('Data consulta superior a data atual, consulta não cancelada', () => {
    const consulta = require('../api/consulta.js');

    const dataConsulta = moment().add(1, 'day').format('DD.MM.YYYY');
    const horario = '08:00';
    const indicadorConsultaCancelada = 'N';

    console.log('dataConsulta', dataConsulta);
    console.log('horario', horario);
    console.log('indicadorConsultaCancelada', indicadorConsultaCancelada);


    expect(
      consulta.podeCancelarConsulta(
        dataConsulta,
        horario,
        indicadorConsultaCancelada
      )
    ).toBe('S');
  });

  test('Data consulta superior a data atual, consulta cancelada', () => {
    const consulta = require('../api/consulta.js');

    const dataConsulta = moment().add(1, 'day').format('DD.MM.YYYY');
    const horario = '08:00';
    const indicadorConsultaCancelada = 'S';

    console.log('dataConsulta', dataConsulta);
    console.log('horario', horario);
    console.log('indicadorConsultaCancelada', indicadorConsultaCancelada);


    expect(
      consulta.podeCancelarConsulta(
        dataConsulta,
        horario,
        indicadorConsultaCancelada
      )
    ).toBe('N');
  });

});
