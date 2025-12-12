
// Enums mirroring the requested C# logic
export enum TipoAtendimento {
  VendaRapida = 'Venda Rápida',
  Delivery = 'Delivery',
  Retirada = 'Retirada',
  Encomenda = 'Encomenda'
}

export enum TipoOperacaoCaixa {
  Abertura = 'Abertura',
  Reforco = 'Reforço',
  Sangria = 'Sangria',
  Vendas = 'Venda',
  Fechamento = 'Fechamento',
  Troco = 'Troco', // Saída
  CreditoCliente = 'Crédito Cliente', // Entrada (sobra de troco)
  UsoCredito = 'Uso de Crédito' // Pagamento com saldo
}

export enum PedidoStatus {
  Pendente = 'Pendente', // Aberto ou Parcialmente Pago
  Pago = 'Pago',
  Entregue = 'Entregue',
  Cancelado = 'Cancelado'
}

export enum StatusCozinha {
  Aguardando = 'Aguardando',
  Preparando = 'Preparando',
  Pronto = 'Pronto',
  Entregue = 'Entregue' // Sai da tela da cozinha
}

// Entities (Models)
export interface Bairro {
  id: number;
  nome: string;
  taxaEntrega: number;
  ativo: boolean;
}

export interface Cliente {
  id: number;
  tipoPessoa: 'Física' | 'Jurídica';
  nome: string;
  cpfCnpj: string;
  telefone: string;
  nomeWhatsapp?: string; 
  saldoCredito?: number; // Saldo em haver
  // Address breakdown
  endereco: string; // Logradouro
  numero: string;
  complemento: string;
  bairro: string;
  bairroId?: number; // Link to Bairro entity
  cep?: string;
  cidade?: string;
}

export interface GrupoProduto {
  id: number;
  nome: string;
  ativo: boolean;
}

export type TipoProduto = 'Principal' | 'Complemento';
export type SetorProducao = 'Cozinha' | 'Bar' | 'Nenhum';

export interface Produto {
  id: number;
  ativo: boolean; // Status
  tipo: TipoProduto; 
  setor: SetorProducao; // Novo campo para KDS
  codigoInterno: string;
  codigoBarras: string;
  nome: string;
  preco: number;
  custo: number;
  unidadeMedida: string; // 'UN', 'KG', 'LT'
  grupoProdutoId: number;
  imagem?: string;
  disponivelTouch?: boolean; // Nova flag para Totem/Tablet
}

export interface ConfiguracaoItemRule {
  produtoComplementoId: number;
  cobrarSempre: boolean; // Se true, ignora a regra de gratuidade e cobra cheio
}

export interface ConfiguracaoAdicional {
  id: number;
  produtoPrincipalId: number;
  cobrarApartirDe: number; // Quantidade gratuita. Ex: 3 (cobra a partir do 4º)
  itens: ConfiguracaoItemRule[]; 
}

// --- FINANCEIRO / TESOURARIA ---

export type TipoContaFinanceira = 'Cofre' | 'Banco';

export interface ContaFinanceira {
  id: number;
  nome: string;
  tipo: TipoContaFinanceira;
  saldoAtual: number;
  ativo: boolean;
}

// Histórico de movimentação ESPECÍFICO da conta (Extrato)
export interface MovimentoConta {
  id: number;
  contaId: number;
  data: string;
  tipo: 'Entrada' | 'Saída';
  valor: number;
  descricao: string;
  saldoApos: number; // Snapshot do saldo
}

export interface OperadoraCartao {
  id: number;
  nome: string;
  taxaCredito: number; // %
  diasRecebimentoCredito: number;
  taxaDebito: number; // %
  diasRecebimentoDebito: number;
  contaVinculadaId?: number; // ID da Conta Bancária onde cai o dinheiro (Ex: Conta Stone)
  ativo: boolean;
}

export interface FormaPagamento {
  id: number;
  nome: string; // Dinheiro, Cartão Crédito, PIX
  ativo: boolean;
  // Vínculos
  tipoVinculo?: 'Nenhum' | 'Operadora' | 'Conta';
  operadoraId?: number; // Se for cartão
  contaDestinoId?: number; // Se for PIX ou Transferência direta
}

export interface HistoricoTransacao {
  data: string;
  valor: number;
  contaFinanceiraId?: number; // Origem/Destino
  formaPagamentoId?: number; // Meio
  observacao?: string;
}

export interface ContaReceber {
  id: string;
  descricao?: string; // Para lançamentos manuais
  documento?: string; // Novo: Nº Documento
  clienteId?: number;
  clienteNome?: string;
  pedidoId?: number; // Opcional se for lançamento manual
  
  dataVenda: string; // Data de competência
  dataPrevisao: string; // Vencimento / Previsão
  
  valorBruto: number;
  taxaAplicada: number;
  valorLiquido: number; // Valor final esperado
  
  // Controle de Baixa
  status: 'Pendente' | 'Recebido' | 'Conciliado' | 'Parcial';
  valorRecebido: number; // Acumulado
  historicoRecebimentos: HistoricoTransacao[];

  formaPagamentoNome: string;
  origem: string; // Nome da Operadora ou Banco
  contaDestinoId?: number; // Para facilitar filtragem por conta
}

// --- CONTAS A PAGAR / FORNECEDORES ---

export interface Fornecedor {
  id: number;
  nome: string; // Razão Social / Nome Fantasia
  documento: string; // CNPJ / CPF
  telefone: string;
  email?: string;
  ativo: boolean;
}

export interface ContaPagar {
  id: number;
  fornecedorId: number;
  fornecedorNome: string; // Denormalized for easy listing
  documento?: string; // Novo: Nº Documento (NFe, Boleto)
  descricao: string; // "Compra de Matéria Prima", "Energia", etc.
  valor: number;
  dataEmissao: string; // YYYY-MM-DD (Nova)
  dataVencimento: string; // YYYY-MM-DD
  
  // Dados de Baixa
  status: 'Pendente' | 'Pago' | 'Parcial';
  valorPago: number; // Acumulado
  historicoPagamentos: HistoricoTransacao[];
  
  // Campos legado mantidos para compatibilidade, mas o histórico é a fonte da verdade
  dataPagamento?: string;
  contaOrigemId?: number; 
  formaPagamentoId?: number;
  observacoes?: string;
}

// --------------------------------

export interface PedidoItemAdicional {
  produtoId: number;
  nome: string;
  precoOriginal: number;
  precoCobrado: number; // Pode ser 0 se estiver dentro da gratuidade
}

export interface PedidoItem {
  produto: Produto;
  quantidade: number;
  adicionais?: PedidoItemAdicional[];
  status?: StatusCozinha; // Status individual do item
}

export interface Pagamento {
  id: string;
  data: string;
  formaPagamentoId: number;
  formaPagamentoNome: string;
  valor: number;
}

export interface Pedido {
  id: number;
  data: string; // ISO String
  tipoAtendimento: TipoAtendimento;
  clienteId?: number;
  clienteNome?: string; // Denormalized for display
  total: number;
  status: PedidoStatus; // Financeiro / Geral
  statusCozinha: StatusCozinha; // Controle de Produção (Agregado)
  itens: PedidoItem[];
  
  // Payment Details (Updated for Partial Payments)
  pagamentos: Pagamento[];
  
  cpfNaNota?: string; // Novo campo para o módulo Totem
  
  // Legacy fields kept optional for backward compatibility types, but logic moves to 'pagamentos'
  valorRecebido?: number; 
  troco?: number;
}

// --- CASH CONTROL TYPES ---

export interface Caixa {
  id: number;
  nome: string;
  ativo: boolean;
}

export enum StatusSessao {
  Aberta = 'Aberta',
  Fechada = 'Fechada',      // Fechada pelo operador, aguardando conferência
  Consolidada = 'Consolidada' // Conferida e finalizada pelo gerente
}

export interface ConferenciaFechamento {
  dinheiro: number;
  cartaoCredito: number;
  cartaoDebito: number;
  pix: number;
  voucher: number;
  outros: number;
  observacoes: string;
}

export interface SessaoCaixa {
  id: number;
  caixaId: number;
  caixaNome: string;
  usuarioId: number;
  usuarioNome: string;
  dataAbertura: string;
  dataFechamento?: string;
  dataConsolidacao?: string;
  
  saldoInicial: number;
  contaOrigemId?: number; // De onde veio o fundo de troco (Cofre)

  saldoFinalSistema?: number; // Calculado pelo sistema
  saldoFinalInformado?: number; // Contado pelo operador
  
  quebraDeCaixa?: number; // Diferença Final
  
  status: StatusSessao;
  conferenciaOperador?: ConferenciaFechamento;
  conferenciaAuditoria?: ConferenciaFechamento; // Valores corrigidos pela gerência
}

export interface CaixaMovimento {
  id: number;
  sessaoId: number; // Linked to a session
  data: string;
  tipoOperacao: TipoOperacaoCaixa;
  valor: number;
  observacao: string;
  formaPagamentoId?: number; // Para rastrear saldo de dinheiro físico
  
  // Treasury Links
  contaOrigemId?: number; // De onde veio o dinheiro (Reforço)
  contaDestinoId?: number; // Para onde foi o dinheiro (Sangria)
}

// User Management
export type PerfilAcesso = 'Administrador' | 'Padrão';

export interface Usuario {
  id: number;
  nome: string;
  login: string;
  senha?: string; // Optional when listing to avoid exposing
  perfil: PerfilAcesso;
  ativo: boolean;
  caixaPadraoId?: number; // Link to default terminal
}
