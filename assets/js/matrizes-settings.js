/* Metas não presentes nas tabelas devem ser confirmadas antes de configurar.
 * Não preencher com valores dos prints: são referências, não vigência de metas.
 */
globalThis.MATRIZES_SETTINGS = Object.freeze({
  discardTarget: null,
  incubationTarget: null,
  // Cadastro opcional, por empresa/unidade/máquina e empresa/unidade/lote.
  // Ex.: { empresa: "2", unidade: "12", maquina: "17", estagio: "Múltiplo" }
  machines: [],
  // Ex.: { empresa: "2", unidade: "12", lote: "406", origem: "Próprio" }
  lotOrigins: []
});
