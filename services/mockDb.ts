
import { 
  Produto, GrupoProduto, Cliente, Pedido, Usuario, Caixa, 
  SessaoCaixa, CaixaMovimento, FormaPagamento, ConfiguracaoAdicional,
  TipoOperacaoCaixa, StatusSessao, PedidoStatus, Pagamento, PedidoItemAdicional, Bairro, ConferenciaFechamento, StatusCozinha, SetorProducao,
  ContaFinanceira, OperadoraCartao, ContaReceber
} from '../types';

class MockDB {
  private produtos: Produto[] = [];
  private grupos: GrupoProduto[] = [];
  private clientes: Cliente[] = [];
  private pedidos: Pedido[] = [];
  private usuarios: Usuario[] = [];
  private caixas: Caixa[] = [];
  private sessoes: SessaoCaixa[] = [];
  private caixaMovimentos: CaixaMovimento[] = [];
  private formasPagamento: FormaPagamento[] = [];
  private configuracoesAdicionais: ConfiguracaoAdicional[] = [];
  private bairros: Bairro[] = [];
  
  // Financeiro
  private contasFinanceiras: ContaFinanceira[] = [];
  private operadoras: OperadoraCartao[] = [];
  private contasReceber: ContaReceber[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    // 1. Grupos
    this.grupos = [
        { id: 1, nome: 'Lanches', ativo: true }, 
        { id: 2, nome: 'Bebidas', ativo: true },
        { id: 3, nome: 'Açaí', ativo: true },
        { id: 4, nome: 'Adicionais / Complementos', ativo: true }
    ];

    // 2. Produtos
    this.produtos = [
        { id: 1, ativo: true, tipo: 'Principal', setor: 'Cozinha', codigoInterno: '100', codigoBarras: '7890001', nome: 'X-Burger', preco: 25.00, custo: 10.00, unidadeMedida: 'UN', grupoProdutoId: 1 },
        { id: 2, ativo: true, tipo: 'Principal', setor: 'Bar', codigoInterno: '101', codigoBarras: '7890002', nome: 'Coca-Cola 350ml', preco: 6.00, custo: 3.00, unidadeMedida: 'UN', grupoProdutoId: 2 },
        { id: 3, ativo: true, tipo: 'Complemento', setor: 'Cozinha', codigoInterno: 'ADD1', codigoBarras: '', nome: 'Bacon Extra', preco: 5.00, custo: 2.00, unidadeMedida: 'UN', grupoProdutoId: 1 },
        { id: 10, ativo: true, tipo: 'Principal', setor: 'Cozinha', codigoInterno: 'COP180', codigoBarras: '', nome: 'Copo 180ml (2 Grátis)', preco: 13.00, custo: 4.00, unidadeMedida: 'UN', grupoProdutoId: 3 },
        { id: 11, ativo: true, tipo: 'Principal', setor: 'Cozinha', codigoInterno: 'COP300', codigoBarras: '', nome: 'Copo 300ml (3 Grátis)', preco: 18.00, custo: 6.00, unidadeMedida: 'UN', grupoProdutoId: 3 },
        { id: 12, ativo: true, tipo: 'Principal', setor: 'Cozinha', codigoInterno: 'COP500', codigoBarras: '', nome: 'Copo 500ml (3 Grátis)', preco: 22.00, custo: 8.00, unidadeMedida: 'UN', grupoProdutoId: 3 },
        { id: 13, ativo: true, tipo: 'Principal', setor: 'Cozinha', codigoInterno: 'COP700', codigoBarras: '', nome: 'Copo 700ml (4 Grátis)', preco: 27.00, custo: 10.00, unidadeMedida: 'UN', grupoProdutoId: 3 },
        { id: 14, ativo: true, tipo: 'Principal', setor: 'Cozinha', codigoInterno: 'BARCA500', codigoBarras: '', nome: 'Barca 500ml (6 Grátis)', preco: 32.00, custo: 12.00, unidadeMedida: 'UN', grupoProdutoId: 3 },
        { id: 50, ativo: true, tipo: 'Complemento', setor: 'Cozinha', codigoInterno: 'ADD-LEITE', codigoBarras: '', nome: 'Leite em Pó', preco: 3.00, custo: 0.50, unidadeMedida: 'POR', grupoProdutoId: 4 },
        { id: 51, ativo: true, tipo: 'Complemento', setor: 'Cozinha', codigoInterno: 'ADD-COND', codigoBarras: '', nome: 'Leite Condensado', preco: 3.00, custo: 0.60, unidadeMedida: 'POR', grupoProdutoId: 4 },
        { id: 52, ativo: true, tipo: 'Complemento', setor: 'Cozinha', codigoInterno: 'ADD-GRAN', codigoBarras: '', nome: 'Granola', preco: 3.00, custo: 0.40, unidadeMedida: 'POR', grupoProdutoId: 4 },
        { id: 53, ativo: true, tipo: 'Complemento', setor: 'Cozinha', codigoInterno: 'ADD-PAC', codigoBarras: '', nome: 'Paçoca', preco: 3.00, custo: 0.30, unidadeMedida: 'POR', grupoProdutoId: 4 },
        { id: 54, ativo: true, tipo: 'Complemento', setor: 'Cozinha', codigoInterno: 'ADD-BAN', codigoBarras: '', nome: 'Banana', preco: 3.00, custo: 0.30, unidadeMedida: 'POR', grupoProdutoId: 4 },
        { id: 55, ativo: true, tipo: 'Complemento', setor: 'Cozinha', codigoInterno: 'ADD-MOR', codigoBarras: '', nome: 'Morango', preco: 3.00, custo: 0.80, unidadeMedida: 'POR', grupoProdutoId: 4 },
        { id: 56, ativo: true, tipo: 'Complemento', setor: 'Cozinha', codigoInterno: 'ADD-CHOC', codigoBarras: '', nome: 'Chocoball', preco: 3.00, custo: 0.50, unidadeMedida: 'POR', grupoProdutoId: 4 },
        { id: 80, ativo: true, tipo: 'Complemento', setor: 'Cozinha', codigoInterno: 'PREM-NUT', codigoBarras: '', nome: 'Nutella (Creme Avelã)', preco: 5.00, custo: 2.00, unidadeMedida: 'POR', grupoProdutoId: 4 },
        { id: 81, ativo: true, tipo: 'Complemento', setor: 'Cozinha', codigoInterno: 'PREM-NIN', codigoBarras: '', nome: 'Creme de Ninho', preco: 5.00, custo: 1.80, unidadeMedida: 'POR', grupoProdutoId: 4 },
        { id: 82, ativo: true, tipo: 'Complemento', setor: 'Cozinha', codigoInterno: 'PREM-OVOM', codigoBarras: '', nome: 'Creme de Ovomaltine', preco: 5.00, custo: 1.90, unidadeMedida: 'POR', grupoProdutoId: 4 },
    ];

    // 3. Configurações de Adicionais
    const standardAddons = [50, 51, 52, 53, 54, 55, 56].map(id => ({ produtoComplementoId: id, cobrarSempre: false }));
    const premiumAddons = [80, 81, 82].map(id => ({ produtoComplementoId: id, cobrarSempre: true }));
    const todosAdicionaisAcai = [...standardAddons, ...premiumAddons];

    this.configuracoesAdicionais = [
        { id: 1, produtoPrincipalId: 10, cobrarApartirDe: 2, itens: todosAdicionaisAcai },
        { id: 2, produtoPrincipalId: 11, cobrarApartirDe: 3, itens: todosAdicionaisAcai },
        { id: 3, produtoPrincipalId: 12, cobrarApartirDe: 3, itens: todosAdicionaisAcai },
        { id: 4, produtoPrincipalId: 13, cobrarApartirDe: 4, itens: todosAdicionaisAcai },
        { id: 5, produtoPrincipalId: 14, cobrarApartirDe: 6, itens: todosAdicionaisAcai },
        { id: 6, produtoPrincipalId: 1, cobrarApartirDe: 0, itens: [{ produtoComplementoId: 3, cobrarSempre: true }] }
    ];

    // FINANCE SEED
    this.contasFinanceiras = [
        { id: 1, nome: 'Cofre Principal', tipo: 'Cofre', saldoAtual: 2000.00, ativo: true },
        { id: 2, nome: 'Banco Itaú', tipo: 'Banco', saldoAtual: 50000.00, ativo: true },
        { id: 3, nome: 'Banco Inter', tipo: 'Banco', saldoAtual: 1500.00, ativo: true },
    ];

    this.operadoras = [
        { id: 1, nome: 'Stone', taxaCredito: 3.5, diasRecebimentoCredito: 30, taxaDebito: 1.5, diasRecebimentoDebito: 1, ativo: true },
        { id: 2, nome: 'Cielo', taxaCredito: 4.0, diasRecebimentoCredito: 30, taxaDebito: 1.8, diasRecebimentoDebito: 1, ativo: true },
    ];

    this.formasPagamento = [
        { id: 1, nome: 'Dinheiro', ativo: true, tipoVinculo: 'Nenhum' },
        { id: 2, nome: 'Cartão de Crédito', ativo: true, tipoVinculo: 'Operadora', operadoraId: 1 }, // Linked to Stone
        { id: 3, nome: 'Cartão de Débito', ativo: true, tipoVinculo: 'Operadora', operadoraId: 1 }, // Linked to Stone
        { id: 4, nome: 'PIX', ativo: true, tipoVinculo: 'Conta', contaDestinoId: 2 }, // Linked to Itau
        { id: 5, nome: 'Voucher / VR', ativo: true, tipoVinculo: 'Nenhum' }
    ];

    this.caixas = [{ id: 1, nome: 'Caixa 01', ativo: true }];
    this.usuarios = [{ id: 1, nome: 'Administrador', login: 'admin', senha: '123', perfil: 'Administrador', ativo: true, caixaPadraoId: 1 }];
    this.bairros = [
        { id: 1, nome: 'Centro', taxaEntrega: 0.00, ativo: true },
        { id: 2, nome: 'Zona Norte', taxaEntrega: 5.00, ativo: true },
        { id: 3, nome: 'Zona Sul', taxaEntrega: 7.00, ativo: true },
        { id: 4, nome: 'Industrial', taxaEntrega: 10.00, ativo: true },
    ];
    this.clientes = [{id: 1, nome: 'Cliente Padrão', tipoPessoa: 'Física', cpfCnpj: '000.000.000-00', telefone: '', nomeWhatsapp: '', endereco: '', numero: '', complemento: '', bairro: 'Centro', bairroId: 1, saldoCredito: 0 }];
  }

  // --- GETTERS ---
  getProdutos() { return this.produtos; }
  getGrupos() { return this.grupos; }
  getClientes() { return this.clientes; }
  getPedidos() { return this.pedidos; }
  getUsuarios() { return this.usuarios; }
  getCaixas() { return this.caixas; }
  getFormasPagamento() { return this.formasPagamento; }
  getConfiguracoesAdicionais() { return this.configuracoesAdicionais; }
  getBairros() { return this.bairros; }
  
  getContasFinanceiras() { return this.contasFinanceiras; }
  getOperadoras() { return this.operadoras; }
  getContasReceber() { return this.contasReceber.sort((a,b) => new Date(a.dataPrevisao).getTime() - new Date(b.dataPrevisao).getTime()); }

  getPedidoById(id: number) { return this.pedidos.find(p => p.id === id); }

  getSaldoCaixa() { 
      // Simplified: Just sum of open sessions balance
      const openSessions = this.sessoes.filter(s => s.status === StatusSessao.Aberta);
      let total = 0;
      for(const s of openSessions) {
          total += this.getSaldoSessao(s.id);
      }
      return total;
  }
  
  getSaldoDinheiroSessao(sessaoId: number): number {
      const movimentos = this.caixaMovimentos.filter(m => m.sessaoId === sessaoId);
      const dinheiroId = 1; 
      
      return movimentos.reduce((acc, mov) => {
          if (mov.tipoOperacao === TipoOperacaoCaixa.Abertura || mov.tipoOperacao === TipoOperacaoCaixa.Reforco || mov.tipoOperacao === TipoOperacaoCaixa.CreditoCliente) {
             return acc + mov.valor;
          }
          if (mov.tipoOperacao === TipoOperacaoCaixa.Sangria || mov.tipoOperacao === TipoOperacaoCaixa.Troco) {
             return acc - mov.valor;
          }
          
          if (mov.tipoOperacao === TipoOperacaoCaixa.Vendas) {
              if (mov.formaPagamentoId === dinheiroId) {
                  return acc + mov.valor;
              }
          }
          
          return acc;
      }, 0);
  }
  
  getSaldoFormaPagamentoSessao(sessaoId: number, formaPagamentoId: number): number {
      const movimentos = this.caixaMovimentos.filter(m => m.sessaoId === sessaoId && m.formaPagamentoId === formaPagamentoId);
      return movimentos.reduce((acc, mov) => {
          if (mov.tipoOperacao === TipoOperacaoCaixa.Vendas || mov.tipoOperacao === TipoOperacaoCaixa.CreditoCliente) {
             return acc + mov.valor;
          }
           if (mov.tipoOperacao === TipoOperacaoCaixa.Troco || mov.tipoOperacao === TipoOperacaoCaixa.Sangria) {
             return acc - mov.valor;
          }
          return acc;
      }, 0);
  }

  getVendasDoDia() {
      const today = new Date().toISOString().split('T')[0];
      return this.pedidos
        .filter(p => p.data.startsWith(today) && p.status !== PedidoStatus.Cancelado)
        .reduce((acc, p) => acc + p.total, 0);
  }

  // --- SAVERS / DELETERS ---

  saveProduto(item: Produto) {
      if(item.id === 0) {
          item.id = Math.max(0, ...this.produtos.map(p => p.id)) + 1;
          this.produtos.push(item);
      } else {
          const index = this.produtos.findIndex(p => p.id === item.id);
          if(index >= 0) this.produtos[index] = item;
      }
  }
  deleteProduto(id: number) { this.produtos = this.produtos.filter(p => p.id !== id); }
  
  saveGrupo(item: GrupoProduto) {
      if(item.id === 0) {
          item.id = Math.max(0, ...this.grupos.map(p => p.id)) + 1;
          this.grupos.push(item);
      } else {
          const index = this.grupos.findIndex(p => p.id === item.id);
          if(index >= 0) this.grupos[index] = item;
      }
  }
  deleteGrupo(id: number) { this.grupos = this.grupos.filter(p => p.id !== id); }

  saveCliente(item: Cliente) {
      if(item.id === 0) {
          item.id = Math.max(0, ...this.clientes.map(p => p.id)) + 1;
          item.saldoCredito = 0;
          this.clientes.push(item);
      } else {
          const index = this.clientes.findIndex(p => p.id === item.id);
          if(index >= 0) this.clientes[index] = item;
      }
  }
  deleteCliente(id: number) { this.clientes = this.clientes.filter(p => p.id !== id); }

  saveFormaPagamento(item: FormaPagamento) {
      if(item.id === 0) {
          item.id = Math.max(0, ...this.formasPagamento.map(p => p.id)) + 1;
          this.formasPagamento.push(item);
      } else {
          const index = this.formasPagamento.findIndex(p => p.id === item.id);
          if(index >= 0) this.formasPagamento[index] = item;
      }
  }
  deleteFormaPagamento(id: number) { this.formasPagamento = this.formasPagamento.filter(p => p.id !== id); }
  
  // Finance Savers
  saveContaFinanceira(item: ContaFinanceira) {
      if(item.id === 0) {
          item.id = Math.max(0, ...this.contasFinanceiras.map(p => p.id)) + 1;
          this.contasFinanceiras.push(item);
      } else {
          const index = this.contasFinanceiras.findIndex(p => p.id === item.id);
          if(index >= 0) this.contasFinanceiras[index] = item;
      }
  }
  deleteContaFinanceira(id: number) { this.contasFinanceiras = this.contasFinanceiras.filter(p => p.id !== id); }

  saveOperadora(item: OperadoraCartao) {
      if(item.id === 0) {
          item.id = Math.max(0, ...this.operadoras.map(p => p.id)) + 1;
          this.operadoras.push(item);
      } else {
          const index = this.operadoras.findIndex(p => p.id === item.id);
          if(index >= 0) this.operadoras[index] = item;
      }
  }
  deleteOperadora(id: number) { this.operadoras = this.operadoras.filter(p => p.id !== id); }

  saveConfiguracaoAdicional(item: ConfiguracaoAdicional) {
      if(item.id === 0) {
          item.id = Math.max(0, ...this.configuracoesAdicionais.map(p => p.id)) + 1;
          this.configuracoesAdicionais.push(item);
      } else {
          const index = this.configuracoesAdicionais.findIndex(p => p.id === item.id);
          if(index >= 0) this.configuracoesAdicionais[index] = item;
      }
  }
  deleteConfiguracaoAdicional(id: number) { this.configuracoesAdicionais = this.configuracoesAdicionais.filter(p => p.id !== id); }

  saveUsuario(item: Usuario) {
      if(item.id === 0) {
          item.id = Math.max(0, ...this.usuarios.map(p => p.id)) + 1;
          this.usuarios.push(item);
      } else {
          const index = this.usuarios.findIndex(p => p.id === item.id);
          if(index >= 0) this.usuarios[index] = item;
      }
  }
  deleteUsuario(id: number) { this.usuarios = this.usuarios.filter(p => p.id !== id); }

  saveCaixa(item: Caixa) {
      if(item.id === 0) {
          item.id = Math.max(0, ...this.caixas.map(p => p.id)) + 1;
          this.caixas.push(item);
      } else {
          const index = this.caixas.findIndex(p => p.id === item.id);
          if(index >= 0) this.caixas[index] = item;
      }
  }
  deleteCaixa(id: number) { this.caixas = this.caixas.filter(p => p.id !== id); }
  
  saveBairro(item: Bairro) {
      if(item.id === 0) {
          item.id = Math.max(0, ...this.bairros.map(p => p.id)) + 1;
          this.bairros.push(item);
      } else {
          const index = this.bairros.findIndex(p => p.id === item.id);
          if(index >= 0) this.bairros[index] = item;
      }
  }
  deleteBairro(id: number) { this.bairros = this.bairros.filter(p => p.id !== id); }

  savePedido(pedido: Pedido) {
      const totalPaid = pedido.pagamentos?.reduce((acc, p) => acc + p.valor, 0) || 0;
      if (totalPaid >= (pedido.total - 0.01)) {
          pedido.status = PedidoStatus.Pago;
      }

      if (!pedido.statusCozinha) {
          pedido.statusCozinha = StatusCozinha.Aguardando;
      }

      pedido.itens.forEach(item => {
          if (!item.status) item.status = StatusCozinha.Aguardando;
      });

      const index = this.pedidos.findIndex(p => p.id === pedido.id);
      if(index >= 0) {
          this.pedidos[index] = pedido;
      } else {
          this.pedidos.push(pedido);
      }
  }

  updateKitchenStatus(orderId: number, status: StatusCozinha, sector?: SetorProducao) {
      const index = this.pedidos.findIndex(p => p.id === orderId);
      if(index < 0) return;
      
      const pedido = this.pedidos[index];

      if (sector) {
          pedido.itens.forEach(item => {
              const itemSector = item.produto.setor || 'Cozinha';
              if (itemSector === sector) {
                  item.status = status;
              }
          });
      } else {
          pedido.itens.forEach(item => item.status = status);
      }

      const allItems = pedido.itens;
      if (allItems.length === 0) return;

      const allDelivered = allItems.every(i => i.status === StatusCozinha.Entregue);
      const allReadyOrDelivered = allItems.every(i => i.status === StatusCozinha.Pronto || i.status === StatusCozinha.Entregue);
      const anyPreparing = allItems.some(i => i.status === StatusCozinha.Preparando);
      const anyReady = allItems.some(i => i.status === StatusCozinha.Pronto);

      if (allDelivered) {
          pedido.statusCozinha = StatusCozinha.Entregue;
      } else if (allReadyOrDelivered) {
          pedido.statusCozinha = StatusCozinha.Pronto;
      } else if (anyPreparing || anyReady) {
          pedido.statusCozinha = StatusCozinha.Preparando;
      } else {
          pedido.statusCozinha = StatusCozinha.Aguardando;
      }

      this.pedidos[index] = { ...pedido };
  }

  // --- AUTH ---
  authenticate(login: string, pass: string) {
      return this.usuarios.find(u => u.login === login && u.senha === pass && u.ativo);
  }

  // --- CASH CONTROL ---
  getSessaoAberta(userId: number) {
      return this.sessoes.find(s => s.usuarioId === userId && s.status === StatusSessao.Aberta);
  }

  getSessoesFechadas() {
      return this.sessoes.filter(s => s.status === StatusSessao.Fechada).sort((a,b) => new Date(b.dataFechamento!).getTime() - new Date(a.dataFechamento!).getTime());
  }

  getSessoesConsolidadas(start?: string, end?: string) {
      let query = this.sessoes.filter(s => s.status === StatusSessao.Consolidada);
      
      if (start) {
          const startDate = new Date(start);
          startDate.setHours(0,0,0,0);
          query = query.filter(s => new Date(s.dataAbertura) >= startDate);
      }
      
      if (end) {
          const endDate = new Date(end);
          endDate.setHours(23,59,59,999);
          query = query.filter(s => new Date(s.dataAbertura) <= endDate);
      }

      return query.sort((a,b) => new Date(b.dataConsolidacao || b.dataAbertura).getTime() - new Date(a.dataConsolidacao || a.dataAbertura).getTime());
  }

  getSaldoSessao(sessaoId: number): number {
    return this.caixaMovimentos
      .filter(m => m.sessaoId === sessaoId)
      .reduce((acc, mov) => {
        if (mov.tipoOperacao === TipoOperacaoCaixa.Sangria || mov.tipoOperacao === TipoOperacaoCaixa.Fechamento || mov.tipoOperacao === TipoOperacaoCaixa.Troco) {
          return acc - mov.valor;
        }
        if (mov.tipoOperacao === TipoOperacaoCaixa.UsoCredito) {
            return acc;
        }
        return acc + mov.valor;
      }, 0);
  }
  
  abrirSessao(userId: number, caixaId: number, saldoInicial: number) {
      if(this.getSessaoAberta(userId)) throw new Error("Usuário já possui sessão aberta.");
      
      const caixa = this.caixas.find(c => c.id === caixaId);
      const usuario = this.usuarios.find(u => u.id === userId);
      
      const novaSessao: SessaoCaixa = {
          id: Math.max(0, ...this.sessoes.map(s => s.id)) + 1,
          caixaId,
          caixaNome: caixa?.nome || 'Caixa',
          usuarioId: userId,
          usuarioNome: usuario?.nome || 'User',
          dataAbertura: new Date().toISOString(),
          saldoInicial,
          status: StatusSessao.Aberta
      };
      
      this.sessoes.push(novaSessao);
      
      // We assume opening balance is physically there or Reforco is done later.
      // But for logical balance, we add it.
      this.lancarMovimento(novaSessao.id, TipoOperacaoCaixa.Abertura, saldoInicial, 'Abertura de Caixa');
      
      return novaSessao;
  }
  
  fecharSessao(sessaoId: number, conferencia: ConferenciaFechamento) {
      const sessaoIndex = this.sessoes.findIndex(s => s.id === sessaoId);
      if(sessaoIndex < 0) throw new Error("Sessão não encontrada");
      
      const sessao = this.sessoes[sessaoIndex];
      const saldoFinalCalculado = this.getSaldoSessao(sessaoId);
      const totalContado = conferencia.dinheiro + conferencia.cartaoCredito + conferencia.cartaoDebito + conferencia.pix + conferencia.voucher + conferencia.outros;
      
      this.sessoes[sessaoIndex] = {
          ...sessao,
          status: StatusSessao.Fechada, 
          dataFechamento: new Date().toISOString(),
          saldoFinalSistema: saldoFinalCalculado,
          saldoFinalInformado: totalContado, 
          conferenciaOperador: conferencia,
          quebraDeCaixa: totalContado - saldoFinalCalculado
      };
      
      this.lancarMovimento(sessaoId, TipoOperacaoCaixa.Fechamento, saldoFinalCalculado, 'Fechamento de Caixa');
  }

  consolidarSessao(sessaoId: number, conferenciaAuditada: ConferenciaFechamento) {
      const sessaoIndex = this.sessoes.findIndex(s => s.id === sessaoId);
      if(sessaoIndex < 0) throw new Error("Sessão não encontrada");
      
      const sessao = this.sessoes[sessaoIndex];
      if (sessao.status !== StatusSessao.Fechada) {
          throw new Error("Sessão não está pronta para consolidação ou já foi consolidada.");
      }

      const totalAuditado = conferenciaAuditada.dinheiro + conferenciaAuditada.cartaoCredito + conferenciaAuditada.cartaoDebito + conferenciaAuditada.pix + conferenciaAuditada.voucher + conferenciaAuditada.outros;
      const diff = totalAuditado - (sessao.saldoFinalSistema || 0);

      this.sessoes[sessaoIndex] = {
          ...sessao,
          status: StatusSessao.Consolidada,
          dataConsolidacao: new Date().toISOString(),
          conferenciaAuditoria: conferenciaAuditada,
          quebraDeCaixa: diff
      };
  }
  
  lancarMovimento(sessaoId: number, tipo: TipoOperacaoCaixa, valor: number, obs: string, formaPagamentoId?: number, contaOrigemId?: number, contaDestinoId?: number) {
      
      // Treasury Logic for Transfers
      if (tipo === TipoOperacaoCaixa.Reforco && contaOrigemId) {
          const conta = this.contasFinanceiras.find(c => c.id === contaOrigemId);
          if (conta) {
              if (conta.saldoAtual < valor) throw new Error(`Saldo insuficiente no ${conta.nome} para realizar este reforço.`);
              conta.saldoAtual -= valor;
              obs += ` (Origem: ${conta.nome})`;
          }
      }
      
      if (tipo === TipoOperacaoCaixa.Sangria && contaDestinoId) {
          const conta = this.contasFinanceiras.find(c => c.id === contaDestinoId);
          if (conta) {
              conta.saldoAtual += valor;
              obs += ` (Destino: ${conta.nome})`;
          }
      }

      const mov: CaixaMovimento = {
          id: Math.max(0, ...this.caixaMovimentos.map(m => m.id)) + 1,
          sessaoId,
          data: new Date().toISOString(),
          tipoOperacao: tipo,
          valor,
          observacao: obs,
          formaPagamentoId,
          contaOrigemId,
          contaDestinoId
      };
      this.caixaMovimentos.push(mov);
  }
  
  getCaixaMovimentos(sessaoId: number) {
      return this.caixaMovimentos.filter(m => m.sessaoId === sessaoId).sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }

  // --- PAYMENT PROCESSING ---
  addPagamento(orderId: number, payment: Pagamento, userId: number, valorTroco: number = 0, valorBruto: number = 0) {
      const sessao = this.getSessaoAberta(userId);
      if(!sessao) throw new Error("Caixa Fechado. Abra o caixa para receber.");
      
      const pedido = this.getPedidoById(orderId);
      if(!pedido) throw new Error("Pedido não encontrado");

      const dinheiroId = 1;
      const isDinheiro = payment.formaPagamentoId === dinheiroId;
      
      if (isDinheiro && valorTroco > 0) {
          const saldoDinheiro = this.getSaldoDinheiroSessao(sessao.id);
          if (saldoDinheiro < valorTroco) {
              throw new Error("ERR_SALDO_INSUFICIENTE: Não há dinheiro suficiente em caixa para este troco.");
          }
      }
      
      pedido.pagamentos.push(payment);
      
      const totalPaid = pedido.pagamentos.reduce((acc, p) => acc + p.valor, 0);
      if (totalPaid >= (pedido.total - 0.01)) {
          pedido.status = PedidoStatus.Pago;
      }
      
      // --- TREASURY LOGIC: CREATE RECEIVABLES ---
      const formaPgto = this.formasPagamento.find(f => f.id === payment.formaPagamentoId);
      
      if (formaPgto) {
          // If Linked to Operator (Credit/Debit Card)
          if (formaPgto.tipoVinculo === 'Operadora' && formaPgto.operadoraId) {
              const operadora = this.operadoras.find(op => op.id === formaPgto.operadoraId);
              if (operadora) {
                  const isDebit = formaPgto.nome.toLowerCase().includes('débito') || formaPgto.nome.toLowerCase().includes('debito');
                  const taxa = isDebit ? operadora.taxaDebito : operadora.taxaCredito;
                  const dias = isDebit ? operadora.diasRecebimentoDebito : operadora.diasRecebimentoCredito;
                  
                  const valorTaxa = (payment.valor * taxa) / 100;
                  const valorLiquido = payment.valor - valorTaxa;
                  
                  const dataPrevisao = new Date();
                  dataPrevisao.setDate(dataPrevisao.getDate() + dias);

                  const receivable: ContaReceber = {
                      id: Math.random().toString(36).substr(2, 9),
                      pedidoId: pedido.id,
                      dataVenda: new Date().toISOString(),
                      dataPrevisao: dataPrevisao.toISOString(),
                      valorBruto: payment.valor,
                      taxaAplicada: taxa,
                      valorLiquido: valorLiquido,
                      status: 'Pendente',
                      formaPagamentoNome: formaPgto.nome,
                      origem: operadora.nome
                  };
                  this.contasReceber.push(receivable);
              }
          } 
          // If Linked to Bank Account directly (PIX)
          else if (formaPgto.tipoVinculo === 'Conta' && formaPgto.contaDestinoId) {
              const conta = this.contasFinanceiras.find(c => c.id === formaPgto.contaDestinoId);
              if (conta) {
                  // For PIX, usually D+0. We create a Receivable marked as 'Pendente' (for conciliation) or 'Recebido'
                  // User asked for "Check to see if everything is debiting correctly". So let's create a Receivable D+0
                  const receivable: ContaReceber = {
                      id: Math.random().toString(36).substr(2, 9),
                      pedidoId: pedido.id,
                      dataVenda: new Date().toISOString(),
                      dataPrevisao: new Date().toISOString(), // Today
                      valorBruto: payment.valor,
                      taxaAplicada: 0, // Usually 0 or small fee, for now 0
                      valorLiquido: payment.valor,
                      status: 'Pendente', // Needs conciliation
                      formaPagamentoNome: formaPgto.nome,
                      origem: conta.nome
                  };
                  this.contasReceber.push(receivable);
                  
                  // Optional: Automatically increment bank balance?
                  // conta.saldoAtual += payment.valor; 
                  // Better to let user "Conciliate" in treasury screen to confirm receipt.
              }
          }
      }

      // Register Movement
      if (isDinheiro && valorBruto > 0) {
          this.lancarMovimento(sessao.id, TipoOperacaoCaixa.Vendas, valorBruto, `Pedido #${orderId} - Dinheiro (Recebido)`, payment.formaPagamentoId);
          if (valorTroco > 0) {
              this.lancarMovimento(sessao.id, TipoOperacaoCaixa.Troco, valorTroco, `Pedido #${orderId} - Troco`, payment.formaPagamentoId);
          }
      } else {
          this.lancarMovimento(sessao.id, TipoOperacaoCaixa.Vendas, payment.valor, `Pedido #${orderId} - ${payment.formaPagamentoNome}`, payment.formaPagamentoId);
      }
  }

  converterTrocoEmCredito(orderId: number, payment: Pagamento, valorTroco: number, userId: number, valorBruto: number) {
      const sessao = this.getSessaoAberta(userId);
      if(!sessao) throw new Error("Caixa Fechado.");
      
      const pedido = this.getPedidoById(orderId);
      if(!pedido) throw new Error("Pedido não encontrado");
      if(!pedido.clienteId) throw new Error("Pedido sem cliente vinculado.");
      
      const cliente = this.clientes.find(c => c.id === pedido.clienteId);
      if(!cliente) throw new Error("Cliente não encontrado.");

      if (cliente.id === 1 || !cliente.cpfCnpj || cliente.cpfCnpj === '000.000.000-00') {
          throw new Error("Não é permitido gerar crédito para Cliente Padrão/Consumidor Final.");
      }

      pedido.pagamentos.push(payment);
      
      const totalPaid = pedido.pagamentos.reduce((acc, p) => acc + p.valor, 0);
      if (totalPaid >= (pedido.total - 0.01)) {
          pedido.status = PedidoStatus.Pago;
      }

      this.lancarMovimento(sessao.id, TipoOperacaoCaixa.Vendas, payment.valor, `Pedido #${orderId} - ${payment.formaPagamentoNome}`, payment.formaPagamentoId);
      this.lancarMovimento(sessao.id, TipoOperacaoCaixa.CreditoCliente, valorTroco, `Crédito Gerado - Cliente #${cliente.id}`, payment.formaPagamentoId);

      cliente.saldoCredito = (cliente.saldoCredito || 0) + valorTroco;
  }
  
  usarCreditoCliente(orderId: number, valor: number, userId: number) {
      const sessao = this.getSessaoAberta(userId);
      if(!sessao) throw new Error("Caixa Fechado.");

      const pedido = this.getPedidoById(orderId);
      if(!pedido) throw new Error("Pedido não encontrado");
      if(!pedido.clienteId) throw new Error("Pedido sem cliente vinculado.");
      
      const cliente = this.clientes.find(c => c.id === pedido.clienteId);
      if(!cliente) throw new Error("Cliente não encontrado.");
      
      if ((cliente.saldoCredito || 0) < valor) {
          throw new Error("Saldo de crédito insuficiente.");
      }

      cliente.saldoCredito = (cliente.saldoCredito || 0) - valor;

      const payment: Pagamento = {
          id: Math.random().toString(36).substr(2, 9),
          data: new Date().toISOString(),
          formaPagamentoId: 999,
          formaPagamentoNome: 'Crédito Cliente',
          valor: valor
      };
      pedido.pagamentos.push(payment);

      const totalPaid = pedido.pagamentos.reduce((acc, p) => acc + p.valor, 0);
      if (totalPaid >= (pedido.total - 0.01)) {
          pedido.status = PedidoStatus.Pago;
      }

      this.lancarMovimento(sessao.id, TipoOperacaoCaixa.UsoCredito, valor, `Pagamento com Crédito - Cliente #${cliente.id}`);
  }

  cancelPagamento(orderId: number, paymentId: string, userId: number) {
      const sessao = this.getSessaoAberta(userId);
      if(!sessao) throw new Error("Caixa Fechado. Abra o caixa para estornar.");
      
      const pedido = this.getPedidoById(orderId);
      if(!pedido) throw new Error("Pedido não encontrado");
      
      if (!pedido.pagamentos) pedido.pagamentos = [];

      const paymentIndex = pedido.pagamentos.findIndex(p => p.id === paymentId);
      if(paymentIndex < 0) throw new Error("Pagamento não encontrado");
      
      const payment = pedido.pagamentos[paymentIndex];
      
      if (payment.formaPagamentoNome === 'Crédito Cliente') {
          const cliente = this.clientes.find(c => c.id === pedido.clienteId);
          if (cliente) {
              cliente.saldoCredito = (cliente.saldoCredito || 0) + payment.valor;
          }
      }

      pedido.pagamentos.splice(paymentIndex, 1);
      pedido.status = PedidoStatus.Pendente; 
      
      this.lancarMovimento(sessao.id, TipoOperacaoCaixa.Sangria, payment.valor, `ESTORNO Pedido #${orderId} - ${payment.formaPagamentoNome}`, payment.formaPagamentoId);
  }
}

export const db = new MockDB();
