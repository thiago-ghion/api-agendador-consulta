const apoioTeste = require('./apoioTeste');
let mockListaPaciente = null;
let mockPaciente = null;

jest.mock('../models/index.js', () => ({
  sequelize: {
    transaction: async (funcao) => {
      return funcao();
    },
    literal: () => '',
  },
  Sequelize: { Op: { iLike: {} } },
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

beforeEach(() => {
  mockListaPaciente = null;
  mockPaciente = null;
});

describe('Parte comum', () => {
  test('Registrar método', () => {
    const paciente = require('../api/paciente.js');

    const app = apoioTeste.gerarApp();
    jest.spyOn(app, 'get');
    jest.spyOn(app, 'post');

    try {
      paciente.registrarMetodos(app, jest.fn());
    } catch {}

    expect(app.get).toHaveBeenCalled();
    expect(app.post).toHaveBeenCalled();
  });
});

test('Listar Todos - lista vazia', async () => {
  const paciente = require('../api/paciente.js');

  mockListaPaciente = [];

  const req = {};
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);

  await paciente.listarTodos(req, res);

  expect(resposta.getResposta().length).toBe(0);
});

test('Listar Todos - Erro', async () => {
  const paciente = require('../api/paciente.js');

  mockListaPaciente = new Promise((resolve, reject) => {
    reject();
  });

  const req = {};
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await paciente.listarTodos(req, res);

  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Consultar paciente - ID paciente não informado', async () => {
  const paciente = require('../api/paciente.js');

  const req = { query: {} };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await paciente.consultar(req, res);

  expect(res.status).toHaveBeenLastCalledWith(400);
});

test('Consultar paciente - não encontrou o paciente', async () => {
  const paciente = require('../api/paciente.js');

  const req = { query: { idPaciente: 1 } };
  const resposta = apoioTeste.gerarResposta();
  const res = apoioTeste.gerarRes(resposta);
  jest.spyOn(res, 'status');

  await paciente.consultar(req, res);

  expect(res.status).toHaveBeenLastCalledWith(400);
});

describe('listarParcial', () => {
  test('Listar com sucesso', async () => {
    const paciente = require('../api/paciente.js');

    mockListaPaciente = new Promise((resolve) => {
      resolve([{ idPaciente: 1, nomePaciente: 'Teste' }]);
    });

    const req = { query: { nomeParcial: 'Teste' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await paciente.listarParcial(req, res);

    expect(resposta.getResposta()).toBeDefined();
    expect(resposta.getResposta().length).toBe(1);
  });
});

describe('consultar', () => {
  test('Sucesso', async () => {
    const paciente = require('../api/paciente.js');

    mockPaciente = new Promise((resolve) => {
      resolve([
        {
          idPaciente: 1,
          nomePaciente: 'Teste',
          numeroCPF: 12345678901,
          dataNascimento: '2022-02-1900',
          numeroTelefone: 1112345678,
          enderecoEmail: 'teste@teste.com',
        },
      ]);
    });

    const req = { query: { idPaciente: 1 } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await paciente.consultar(req, res);

    expect(resposta.getResposta()).toBeDefined();
  });
});

describe('validarPaciente', () => {
  test('Nome do paciente não informado', async () => {
    const paciente = require('../api/paciente.js');

    const req = { token: { nivelUsuario: 3 }, body: {} };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const retorno = paciente.validarPaciente(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
    expect(retorno).toBeFalsy();
  });

  test('Nome do paciente em branco', async () => {
    const paciente = require('../api/paciente.js');

    const req = { token: { nivelUsuario: 3 }, body: { nomePaciente: '' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const retorno = paciente.validarPaciente(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
    expect(retorno).toBeFalsy();
  });

  test('Colaborador não informou CPF', async () => {
    const paciente = require('../api/paciente.js');

    const req = { token: { nivelUsuario: 3 }, body: { nomePaciente: 'Teste' } };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const retorno = paciente.validarPaciente(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
    expect(retorno).toBeFalsy();
  });

  test('Colaborador informou CPF inválido', async () => {
    const paciente = require('../api/paciente.js');

    const req = {
      token: { nivelUsuario: 3 },
      body: { nomePaciente: 'Teste', numeroCPF: 12121212125 },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const retorno = paciente.validarPaciente(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
    expect(retorno).toBeFalsy();
  });

  test('Colaborador não informou data de nascimento', async () => {
    const paciente = require('../api/paciente.js');

    const req = {
      token: { nivelUsuario: 3 },
      body: { nomePaciente: 'Teste', numeroCPF: 11111111111 },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const retorno = paciente.validarPaciente(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
    expect(retorno).toBeFalsy();
  });

  test('Colaborador informou data de nascimento inválida', async () => {
    const paciente = require('../api/paciente.js');

    const req = {
      token: { nivelUsuario: 3 },
      body: {
        nomePaciente: 'Teste',
        numeroCPF: 11111111111,
        dataNascimento: 'SSSAD',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const retorno = paciente.validarPaciente(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
    expect(retorno).toBeFalsy();
  });

  test('Colaborador não informou telefone', async () => {
    const paciente = require('../api/paciente.js');

    const req = {
      token: { nivelUsuario: 3 },
      body: {
        nomePaciente: 'Teste',
        numeroCPF: 11111111111,
        dataNascimento: '02.02.2020',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const retorno = paciente.validarPaciente(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
    expect(retorno).toBeFalsy();
  });

  test('Colaborador informou telefone inválido', async () => {
    const paciente = require('../api/paciente.js');

    const req = {
      token: { nivelUsuario: 3 },
      body: {
        nomePaciente: 'Teste',
        numeroCPF: 11111111111,
        dataNascimento: '02.02.2020',
        numeroTelefone: '111',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const retorno = paciente.validarPaciente(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
    expect(retorno).toBeFalsy();
  });

  test('Colaborador não informou email', async () => {
    const paciente = require('../api/paciente.js');

    const req = {
      token: { nivelUsuario: 3 },
      body: {
        nomePaciente: 'Teste',
        numeroCPF: 11111111111,
        dataNascimento: '02.02.2020',
        numeroTelefone: '1112345678',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const retorno = paciente.validarPaciente(req, res);
    expect(retorno).toBeTruthy();
  });

  test('Colaborador informou email inválido', async () => {
    const paciente = require('../api/paciente.js');

    const req = {
      token: { nivelUsuario: 3 },
      body: {
        nomePaciente: 'Teste',
        numeroCPF: 11111111111,
        dataNascimento: '02.02.2020',
        numeroTelefone: '1112345678',
        enderecoEmail: 'rrrrrrr',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const retorno = paciente.validarPaciente(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
    expect(retorno).toBeFalsy();
  });

  test('Colaborador informou email em branco', async () => {
    const paciente = require('../api/paciente.js');

    const req = {
      token: { nivelUsuario: 3 },
      body: {
        nomePaciente: 'Teste',
        numeroCPF: 11111111111,
        dataNascimento: '02.02.2020',
        numeroTelefone: '1112345678',
        enderecoEmail: '',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const retorno = paciente.validarPaciente(req, res);
    expect(retorno).toBeTruthy();
  });

  test('Paciente informou email em branco', async () => {
    const paciente = require('../api/paciente.js');

    const req = {
      token: { nivelUsuario: 1 },
      body: {
        nomePaciente: 'Teste',
        numeroCPF: 11111111111,
        dataNascimento: '02.02.2020',
        numeroTelefone: '1112345678',
        enderecoEmail: '',
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const retorno = paciente.validarPaciente(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
    expect(retorno).toBeFalsy();
  });

  test('Lançar exceção com tipo de campo errado', async () => {
    const paciente = require('../api/paciente.js');

    const req = {
      token: { nivelUsuario: 1 },
      body: {
        nomePaciente: 'Teste',
        numeroCPF: 11111111111,
        dataNascimento: '02.02.2020',
        numeroTelefone: '1112345678',
        enderecoEmail: true,
      },
    };
    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    const retorno = paciente.validarPaciente(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
    expect(retorno).toBeFalsy();
  });
});

describe('registrar', () => {
  test('Email já registrado para outro paciente', async () => {
    const paciente = require('../api/paciente.js');

    const req = {
      token: { nivelUsuario: 1 },
      body: {
        nomePaciente: 'Teste',
        numeroCPF: 11111111111,
        dataNascimento: '02.02.2020',
        numeroTelefone: '1112345678',
        enderecoEmail: 'teste@teste.com',
      },
    };

    mockPaciente = new Promise((resolve) => {
      resolve({});
    });

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await paciente.registrar(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Email não utilizado por outro paciente', async () => {
    const paciente = require('../api/paciente.js');

    const req = {
      token: { nivelUsuario: 1 },
      body: {
        nomePaciente: 'Teste',
        numeroCPF: 11111111111,
        dataNascimento: '02.02.2020',
        numeroTelefone: '1112345678',
        enderecoEmail: 'teste@teste.com',
        senha: 'AAbbb12#',
        senhaRepetida: 'AAbbb12#',
      },
    };

    mockPaciente = new Promise((resolve) => {
      resolve(null);
    });

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await paciente.registrar(req, res);
    expect(res.status).toHaveBeenLastCalledWith(201);
  });

  test('Colaborador não informou email', async () => {
    const paciente = require('../api/paciente.js');

    const req = {
      token: { nivelUsuario: 2 },
      body: {
        nomePaciente: 'Teste',
        numeroCPF: 11111111111,
        dataNascimento: '02.02.2020',
        numeroTelefone: '1112345678',
      },
    };

    mockPaciente = new Promise((resolve) => {
      resolve(null);
    });

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await paciente.registrar(req, res);
    expect(res.status).toHaveBeenLastCalledWith(201);
  });

  test('Dados inválidos para o registro', async () => {
    const paciente = require('../api/paciente.js');

    const req = {
      token: { nivelUsuario: 2 },
      body: {},
    };

    mockPaciente = new Promise((resolve) => {
      resolve(null);
    });

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await paciente.registrar(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });
});

describe('alterar', () => {
  test('Não informou o idPaciente', async () => {
    const paciente = require('../api/paciente.js');

    const req = {
      token: { nivelUsuario: 2 },
      params: {},
      body: {},
    };

    mockPaciente = new Promise((resolve) => {
      resolve(null);
    });

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await paciente.alterar(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Paciente não encontrado', async () => {
    const paciente = require('../api/paciente.js');

    const req = {
      token: { nivelUsuario: 2 },
      params: { idPaciente: 1 },
      body: {
        nomePaciente: 'Teste',
        numeroCPF: 11111111111,
        dataNascimento: '02.02.2020',
        numeroTelefone: '1112345678',
      },
    };

    mockPaciente = new Promise((resolve) => {
      resolve(null);
    });

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await paciente.alterar(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Email já registrado para outro paciente', async () => {
    const paciente = require('../api/paciente.js');

    const req = {
      token: { nivelUsuario: 2 },
      params: { idPaciente: 1 },
      body: {
        nomePaciente: 'Teste',
        numeroCPF: 11111111111,
        dataNascimento: '02.02.2020',
        numeroTelefone: '1112345678',
        enderecoEmail: 'teste@teste.com',
      },
    };

    mockPaciente = (objeto) => {
      if (objeto.where !== undefined) {
        if (objeto.where.idPaciente !== undefined) {
          return new Promise((resolve) => {
            resolve({});
          });
        }

        if (objeto.where.enderecoEmail !== undefined) {
          return new Promise((resolve) => {
            resolve({});
          });
        }
      }
      return new Promise((resolve) => {
        resolve(null);
      });
    };

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await paciente.alterar(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  test('Email não registrado para outro paciente', async () => {
    const paciente = require('../api/paciente.js');

    const req = {
      token: { nivelUsuario: 2 },
      params: { idPaciente: 1 },
      body: {
        nomePaciente: 'Teste',
        numeroCPF: 11111111111,
        dataNascimento: '02.02.2020',
        numeroTelefone: '1112345678',
        enderecoEmail: 'teste@teste.com',
      },
    };

    mockPaciente = (objeto) => {
      if (objeto.where !== undefined) {
        if (objeto.where.idPaciente !== undefined) {
          return new Promise((resolve) => {
            resolve({ update: jest.fn() });
          });
        }

        if (objeto.where.enderecoEmail !== undefined) {
          return new Promise((resolve) => {
            resolve(null);
          });
        }
      }
      return new Promise((resolve) => {
        resolve(null);
      });
    };

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await paciente.alterar(req, res);
    expect(resposta.getResposta()).toBeDefined();
  });

  test('Não informou endereço de email', async () => {
    const paciente = require('../api/paciente.js');

    const req = {
      token: { nivelUsuario: 2 },
      params: { idPaciente: 1 },
      body: {
        nomePaciente: 'Teste',
        numeroCPF: 11111111111,
        dataNascimento: '02.02.2020',
        numeroTelefone: '1112345678',
      },
    };

    mockPaciente = (objeto) => {
      if (objeto.where !== undefined) {
        if (objeto.where.idPaciente !== undefined) {
          return new Promise((resolve) => {
            resolve({ update: jest.fn() });
          });
        }

        if (objeto.where.enderecoEmail !== undefined) {
          return new Promise((resolve) => {
            resolve(null);
          });
        }
      }
      return new Promise((resolve) => {
        resolve(null);
      });
    };

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await paciente.alterar(req, res);
    expect(res.status).not.toHaveBeenLastCalledWith(400);
  });

  test('Informou dados inválidos', async () => {
    const paciente = require('../api/paciente.js');

    const req = {
      token: { nivelUsuario: 2 },
      params: { idPaciente: 1 },
      body: {
        nomePaciente: 'Teste',
        numeroCPF: true,
        dataNascimento: '02.02.2020',
        numeroTelefone: '1112345678',
      },
    };

    mockPaciente = (objeto) => {
      if (objeto.where !== undefined) {
        if (objeto.where.idPaciente !== undefined) {
          return new Promise((resolve) => {
            resolve({ update: jest.fn() });
          });
        }

        if (objeto.where.enderecoEmail !== undefined) {
          return new Promise((resolve) => {
            resolve(null);
          });
        }
      }
      return new Promise((resolve) => {
        resolve(null);
      });
    };

    const resposta = apoioTeste.gerarResposta();
    const res = apoioTeste.gerarRes(resposta);
    jest.spyOn(res, 'status');

    await paciente.alterar(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });
});
