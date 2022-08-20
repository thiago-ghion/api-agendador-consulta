const Util = require('../util/Util');

test('Data nula', () => {
  expect(Util.isDataValida(null)).toBeFalsy();
});

test('Data em branco', () => {
  expect(Util.isDataValida('')).toBeFalsy();
});

test('Data inválida', () => {
  expect(Util.isDataValida('30.02.2022')).toBeFalsy();
});

test('Data válida', () => {
  expect(Util.isDataValida('01.02.2022')).toBeTruthy();
});

test('Quantidade de dias - Data inicial inválida', () => {
  expect(() => Util.quantidadeDias('30.02.2022', '30.02.2022')).toThrow();
});

test('Quantidade de dias - Data final  inválida', () => {
  expect(() => Util.quantidadeDias('01.02.2022', '30.02.2022')).toThrow();
});

test('Quantidade de dias - Datas invertidas', () => {
  expect(() => Util.quantidadeDias('28.02.2022', '01.02.2022')).toThrow();
});

test('Quantidade de dias ', () => {
  expect(Util.quantidadeDias('01.02.2022', '28.02.2022')).toBe(27);
});

test('Converter em data ISO ', () => {
  expect(Util.converterEmDataIso('01.02.2022')).toBe(
    '2022-02-01T03:00:00.000Z'
  );
});

test('Formatar data ', () => {
  expect(Util.formatarData('2022-02-01T03:00:00.000Z')).toBe('01.02.2022');
});

test('CPF inválido - undefined ', () => {
  expect(Util.isCPFValido(undefined)).toBeFalsy();
});

test('CPF inválido - valor não numérico ', () => {
  expect(Util.isCPFValido('teste')).toBeFalsy();
});

test('CPF inválido - primeiro digito inválido ', () => {
  expect(Util.isCPFValido(67430335626)).toBeFalsy();
});

test('CPF inválido - segundo digito inválido ', () => {
  expect(Util.isCPFValido(67430335611)).toBeFalsy();
});

test('CPF válido', () => {
  expect(Util.isCPFValido(67430335616)).toBeTruthy();
});

test('Telefone inválido - undefined', () => {
  expect(Util.isTelefoneValido(undefined)).toBeFalsy();
});

test('Telefone inválido - valor inválido', () => {
  expect(Util.isTelefoneValido('fsffsd')).toBeFalsy();
});

test('Telefone inválido - valor válido', () => {
  expect(Util.isTelefoneValido('1112345678')).toBeTruthy();
});

test('Email inválido - undefined', () => {
  expect(Util.isEmailValido(undefined)).toBeFalsy();
});

test('Email inválido', () => {
  expect(Util.isEmailValido('flflfl.com')).toBeFalsy();
});

test('Email válido', () => {
  expect(Util.isEmailValido('flflfl@teste.com')).toBeTruthy();
});

test('Formatar minusculo - undefined', () => {
  expect(Util.formatarMinusculo(undefined)).toBe('');
});

test('Formatar minusculo - null', () => {
  expect(Util.formatarMinusculo(null)).toBe('');
});

test('Formatar minusculo', () => {
  expect(Util.formatarMinusculo('TESTE')).toBe('teste');
});

test('Formatar nulidade - undefined', () => {
  expect(Util.formatarNulidade(undefined)).toBe(null);
});

test('Formatar nulidade', () => {
  expect(Util.formatarNulidade('teste')).toBe('teste');
});

test('É data anterior', () => {
  expect(
    Util.isDataAnterior('2022-03-02 08:00', '02.03.2022 07:59')
  ).toBeTruthy();
});

test('É a mesma data', () => {
  expect(
    Util.isDataAnterior('2022-03-02 08:00', '02.03.2022 08:00')
  ).toBeTruthy();
});

test('É data posterior', () => {
  expect(
    Util.isDataAnterior('02.03.2022 08:00', '02.03.2022 08:01')
  ).toBeFalsy();
});

test('Recuperar data e hora atual', () => {
  const data = new Date();
  let dia;
  if (data.getDate() < 10) {
    dia = '0' + data.getDate();
  } else {
    dia = data.getDate();
  }

  let mes = data.getMonth() + 1;
  if (mes < 10) {
    mes = '0' + mes;
  }
  let ano = data.getFullYear();

  let hora;
  if (data.getHours() < 10) {
    hora = '0' + data.getHours();
  } else {
    hora = data.getHours();
  }

  let minuto;
  if (data.getMinutes() < 10) {
    minuto = '0' + data.getMinutes();
  } else {
    minuto = data.getMinutes();
  }

  const dataFormatada = `${dia}.${mes}.${ano} ${hora}:${minuto}`;
  expect(Util.getDataHoraAtual()).toEqual(dataFormatada);
});
