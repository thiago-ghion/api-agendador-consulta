const apoioTeste = require('./apoioTeste');

jest.mock('../api/seguranca.js', () => {
  return { registrarMetodos: jest.fn() };
});
jest.mock('../api/profissional.js', () => {
  return { registrarMetodos: jest.fn() };
});
jest.mock('../api/consulta.js', () => {
  return { registrarMetodos: jest.fn() };
});
jest.mock('../api/paciente.js', () => {
  return { registrarMetodos: jest.fn() };
});
jest.mock('../api/horario.js', () => {
  return { registrarMetodos: jest.fn() };
});
jest.mock('../api/usuario.js', () => {
  return { registrarMetodos: jest.fn() };
});
jest.mock('../api/estatistica.js', () => {
  return { registrarMetodos: jest.fn() };
});

jest.mock('express');
jest.mock('swagger-ui-express', () => ({
  serve: jest.fn(),
  setup: jest.fn(),
}));

let mockPadrao = null;

jest.mock('passport', () => {
  return {
    use: jest.fn(),
    authenticate: (tipo, parametros, funcao) => {
      console.log('auth');
      return mockPadrao(tipo, parametros, funcao);
    },
  };
});

beforeEach(() => {
  mockPadrao = (param1, param2, funcao) => {
    return (req, res) => {
      funcao(undefined, 'teste');
    };
  };
});

describe('incluirNivelAcesso', () => {
  test('Inclusão de rota sem path param', () => {
    const index = require('../index');
    index.listaAcesso.splice(0, index.listaAcesso.length);
    index.incluirNivelAcesso('/v1/grupo/teste', 3);
    expect(index.listaAcesso.length === 1).toBeTruthy();
    expect(index.listaAcesso[0].rota === '/v1/grupo/teste').toBeTruthy();
    expect(index.listaAcesso[0].nivel === 3).toBeTruthy();
  });

  test('Inclusão de rota com path param', () => {
    const index = require('../index');
    index.listaAcesso.splice(0, index.listaAcesso.length);
    index.incluirNivelAcesso('/v1/grupo/teste2/:id', 3);
    expect(index.listaAcesso.length === 1).toBeTruthy();
    expect(index.listaAcesso[0].rota === '/v1/grupo/teste2').toBeTruthy();
    expect(index.listaAcesso[0].nivel === 3).toBeTruthy();
  });
});

describe('filtroSegurancao', () => {
  test('URL seguranca deve ser ignorado pelo filtro', () => {
    const index = require('../index');

    const req = { url: '/v1/seguranca/login' };
    const res = {};
    const next = jest.fn();
    index.filtroSegurancao(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('URL seguranca deve ser ignorado pelo filtro', () => {
    const index = require('../index');

    const req = { url: '/v1/api-docs/' };
    const res = {};
    const next = jest.fn();
    index.filtroSegurancao(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('URL seguranca deve ser ignorado pelo filtro', () => {
    const index = require('../index');

    const req = { url: '/v1/token/introspect' };
    const res = {};
    const next = jest.fn();
    index.filtroSegurancao(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('URL com method OPTIONS deve ser ignorado pelo filtro', () => {
    const index = require('../index');

    const req = { url: '/v1/consulta/agendar', method: 'OPTIONS' };
    const res = {};
    const next = jest.fn();
    index.filtroSegurancao(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('URL autorizado pelo filtro de segurança', () => {
    const index = require('../index');

    const req = { url: '/v1/consulta/agendar' };
    const res = {};
    const next = jest.fn();
    index.filtroSegurancao(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('URL negado pelo filtro de segurança, falta de acesso necessário', () => {
    const index = require('../index');

    const req = { url: '/v1/consulta/agendar' };
    const next = jest.fn();

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockPadrao = (param1, param2, funcao) => {
      return (req, res) => {
        funcao({ message: 'Falta acesso' }, 'teste');
      };
    };

    index.filtroSegurancao(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenLastCalledWith(401);
  });

  test('URL negado pelo filtro de segurança, falha na validação do token', () => {
    const index = require('../index');

    const req = { url: '/v1/consulta/agendar' };
    const next = jest.fn();

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    mockPadrao = (param1, param2, funcao) => {
      return (req, res) => {
        funcao(null, '');
      };
    };

    index.filtroSegurancao(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenLastCalledWith(401);
  });

  test('URL autorizado pelo filtro de segurança, com match da URL', () => {
    const index = require('../index');
    index.listaAcesso.splice(0, index.listaAcesso.length);
    index.incluirNivelAcesso('/v1/consulta/agendar', 3);

    const req = { url: '/v1/consulta/agendar' };
    const res = {};
    const next = jest.fn();
    index.filtroSegurancao(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
