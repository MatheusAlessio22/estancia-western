const FRETE_GRATIS_VALOR_MINIMO = Number(process.env.FRETE_GRATIS_VALOR_MINIMO) || 299;
const VALOR_PAC = 24.9;
const VALOR_SEDEX = 39.9;
const PRAZO_PAC = "6 a 9 dias úteis";
const PRAZO_SEDEX = "2 a 4 dias úteis";

function limparCep(cep) {
  return String(cep || "").replace(/\D/g, "");
}

async function consultarViaCep(cep) {
  const cepLimpo = limparCep(cep);
  if (cepLimpo.length !== 8) {
    throw new Error("CEP inválido. Informe um CEP com 8 dígitos.");
  }

  const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
  if (!resposta.ok) {
    throw new Error("Não foi possível consultar o CEP no momento.");
  }

  const dados = await resposta.json();
  if (dados.erro) {
    throw new Error("CEP não encontrado.");
  }

  return {
    cep: cepLimpo,
    logradouro: dados.logradouro || "",
    bairro: dados.bairro || "",
    cidade: dados.localidade || "",
    estado: dados.uf || "",
  };
}

function calcularOpcoesFrete(total) {
  const valorTotal = Number(total) || 0;
  const freteGratis = valorTotal >= FRETE_GRATIS_VALOR_MINIMO;

  return [
    {
      tipo: "PAC",
      valor: freteGratis ? 0 : VALOR_PAC,
      prazo: PRAZO_PAC,
      gratis: freteGratis,
    },
    {
      tipo: "SEDEX",
      valor: VALOR_SEDEX,
      prazo: PRAZO_SEDEX,
      gratis: false,
    },
  ];
}

module.exports = {
  consultarViaCep,
  calcularOpcoesFrete,
  limparCep,
  FRETE_GRATIS_VALOR_MINIMO,
};
