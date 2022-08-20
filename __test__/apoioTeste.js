const gerarRes = (objetoRetorno) => {
  return {
    status: (http) => {
      return {
        send: (resposta) => {
          if (
            objetoRetorno !== undefined &&
            objetoRetorno.setResposta !== undefined
          ) {
            objetoRetorno.setResposta(resposta);
            objetoRetorno.setHttp(http);
          }
        },
      };
    },
    send: (resposta) => {
      objetoRetorno.setResposta(resposta);
    },
  };
};

const gerarResposta = () => {
  let resposta;
  let http;

  const setResposta = (_resposta) => {
    resposta = _resposta;
  };

  const getResposta = () => {
    return resposta;
  };

  const setHttp = (_http) => {
    http = _http;
  };

  const getHttp = () => {
    return http;
  };
  return { getResposta, setResposta, setHttp, getHttp };
};

const gerarApp = () => ({
  get: (url, funcao) => {
    try {
      funcao({}, {});
    } catch {}
  },
  post: (url, funcao) => {
    try {
      funcao({}, {});
    } catch {}
  },
});

module.exports = { gerarRes, gerarResposta, gerarApp };
