const moment = require('moment');
const _ = require('underscore');

const isDataValida = (data) => {
  if (data === null) {
    return false;
  }

  if (data === '') {
    return false;
  }

  return moment(data, 'DD.MM.YYYY').isValid();
};

const quantidadeDias = (_dataInicio, _dataFim) => {
  if (!isDataValida(_dataInicio)) {
    throw Error('Data início inválida');
  }

  if (!isDataValida(_dataFim)) {
    throw Error('Data fim inválida');
  }

  const dataInicio = moment(_dataInicio, 'DD.MM.YYYY').startOf('day');
  const dataFim = moment(_dataFim, 'DD.MM.YYYY').startOf('day');

  if (dataFim.isBefore(dataInicio)) {
    throw Error('Data fim anterior a data início');
  }

  return dataFim.diff(dataInicio, 'days');
};

const converterEmDataIso = (data) => moment(data, 'DD.MM.YYYY').toISOString();

const converterEmDataInvertida = (data) =>
  moment(data, 'DD.MM.YYYY').format('YYYY-MM-DD');

const formatarData = (data) => moment(data).format('DD.MM.YYYY');

const calculoDigito = (multiplicador, tamanho, array_cpf) => {
  let soma = 0;

  for (let i = 0; i <= tamanho; i++) {
    soma += array_cpf[i] * multiplicador--;
  }
  let digito = 11 - (soma % 11);
  if (digito === 10 || digito === 11) {
    digito = 0;
  }
  return digito;
};

const isCPFValido = (cpf) => {
  if (cpf === undefined || !_.isNumber(cpf)) {
    return false;
  }

  let texto_cpf = '00000000000' + cpf;
  texto_cpf = texto_cpf.substring(texto_cpf.length - 11);

  const array_cpf = texto_cpf.split('');

  const primeiroDigito = calculoDigito(10, 8, array_cpf);
  if (array_cpf[9] !== `${primeiroDigito}`) {
    return false;
  }

  const segundoDigito = calculoDigito(11, 9, array_cpf);
  if (array_cpf[10] !== `${segundoDigito}`) {
    return false;
  }

  return true;
};

const isTelefoneValido = (telefone) => {
  if (telefone === undefined) {
    return false;
  }
  return telefone.match(/^([1-9]{2}){0,1}[0-9]{4,5}[0-9]{4}$/);
};

const isEmailValido = (email) => {
  if (email === undefined) {
    return false;
  }
  return email.match(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/);
};

const formatarMinusculo = (texto) => {
  let _texto = '';
  if (texto !== undefined && texto !== null) {
    _texto = texto.toLowerCase();
  }
  return _texto;
};

const formatarNulidade = (campo) => {
  return campo === undefined ? null : campo;
};

const isDataAnterior = (_dataBase, _dataComparacao) => {
  const dataBase = moment(_dataBase, 'YYYY-MM-DD HH:mm');
  const dataCompararacao = moment(_dataComparacao, 'DD.MM.YYYY HH:mm');
  return dataCompararacao.isSameOrBefore(dataBase);
};

const getDataHoraAtual = () => moment().format('DD.MM.YYYY HH:mm');

const formatarDataHora = (data) => moment(data).format('DD.MM.YYYY HH:mm');

const isSenhaValida = (senha) => {
  const patternSenha =
    '^(?=.*[A-Z].*[A-Z])(?=.*[!@#<% swaggerOptions %>*])(?=.*[0-9].*[0-9])(?=.*[a-z].*[a-z].*[a-z]).{8}$';

  if (!senha.match(patternSenha)) {
    return false;
  }

  return true;
};

module.exports = {
  isDataValida,
  quantidadeDias,
  converterEmDataIso,
  formatarData,
  isCPFValido,
  isTelefoneValido,
  isEmailValido,
  formatarMinusculo,
  formatarNulidade,
  isDataAnterior,
  getDataHoraAtual,
  formatarDataHora,
  isSenhaValida,
  converterEmDataInvertida,
};
