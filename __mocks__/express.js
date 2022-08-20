'use strict';

const funcao = () => {
  return {
    use: (param1) => {
      try {
        param1();
      } catch {}
    },
    get: (param1, param2) => {
      try {
        param2();
      } catch {}
    },
    listen: () => {},
  };
};

exports = module.exports = funcao;

exports.json = () => {};
