
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
  Fechamento = 'Fechamento'
}

export enum PedidoStatus {
  Pendente = 'Pendente', // Aberto ou Parcialmente Pago
  Pago = 'Pago',
  Entregue = 'Entregue',
  Cancelado = 'Cancelado'
}

// Entities (Models)
export interface Cliente {
  id: number;
  tipoPessoa: 'Física' | 'Jurídica';
  nome: string;
  cpfCnpj: string;
  telefone: string;
  nomeWhatsapp?: string; // New field
  // Address breakdown
  endereco: string; // Logradouro
  numero: string;
  complemento: string;
  bairro: string;
  cep?: string;
  cidade?: string;
}

export interface GrupoProduto {
  id: number;
  nome: string;
}

export type TipoProduto = 'Principal' | 'Complemento';

export interface Produto {
  id: number;
  ativo: boolean; // Status
  tipo: TipoProduto; // New field
  codigoInterno: string;
  codigoBarras: string;
  nome: string;
  preco: number;
  custo: number;
  unidadeMedida: string; // 'UN', 'KG', 'LT'
  grupoProdutoId: number;
  imagem?: string;
}

export interface ConfiguracaoItemRule {
  produtoComplementoId: number;
  cobrarSempre: boolean; // Se true, ignora a regra de gratuidade e cobra cheio
}

export interface ConfiguracaoAdicional {
  id: number;
  produtoPrincipalId: number;
  cobrarApartirDe: number; // Quantidade gratuita. Ex: 3 (cobra a partir do 4º)
  itens: ConfiguracaoItemRule[]; // Changed from simple number[] to object array
}

export interface FormaPagamento {
  id: number;
  nome: string; // Dinheiro, Cartão Crédito, PIX
  ativo: boolean;
}

export interface PedidoItemAdicional {
  produtoId: number;
  nome: string;
  precoOriginal: number;
  precoCobrado: number; // Pode ser 0 se estiver dentro da gratuidade
}

export interface PedidoItem {
  produto: Produto;
  quantidade: number;
  adicionais?: PedidoItemAdicional[]; // New field
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
  status: PedidoStatus;
  itens: PedidoItem[];
  
  // Payment Details (Updated for Partial Payments)
  pagamentos: Pagamento[]; 
  
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
  Fechada = 'Fechada'
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
  saldoInicial: number;
  saldoFinal?: number; // Calculated by system
  quebraDeCaixa?: number; // Difference between calculated and counted
  status: StatusSessao;
  conferencia?: ConferenciaFechamento;
}

export interface CaixaMovimento {
  id: number;
  sessaoId: number; // Linked to a session
  data: string;
  tipoOperacao: TipoOperacaoCaixa;
  valor: number;
  observacao: string;
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