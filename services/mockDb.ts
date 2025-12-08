
import { 
  Produto, GrupoProduto, Cliente, Pedido, Usuario, Caixa, 
  SessaoCaixa, CaixaMovimento, FormaPagamento, ConfiguracaoAdicional,
  TipoOperacaoCaixa, StatusSessao, PedidoStatus, Pagamento, PedidoItemAdicional
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

  constructor() {
    this.seed();
  }

  private seed() {
    this.grupos = [{ id: 1, nome: 'Lanches' }, { id: 2, nome: 'Bebidas' }];
    this.produtos = [
        { id: 1, ativo: true, tipo: 'Principal', codigoInterno: '100', codigoBarras: '7890001', nome: 'X-Burger', preco: 25.00, custo: 10.00, unidadeMedida: 'UN', grupoProdutoId: 1 },
        { id: 2, ativo: true, tipo: 'Principal', codigoInterno: '101', codigoBarras: '7890002', nome: 'Coca-Cola 350ml', preco: 6.00, custo: 3.00, unidadeMedida: 'UN', grupoProdutoId: 2 },
        { id: 3, ativo: true, tipo: 'Complemento', codigoInterno: 'ADD1', codigoBarras: '', nome: 'Bacon Extra', preco: 5.00, custo: 2.00, unidadeMedida: 'UN', grupoProdutoId: 1 }
    ];
    this.formasPagamento = [
        { id: 1, nome: 'Dinheiro', ativo: true },
        { id: 2, nome: 'Cartão de Crédito', ativo: true },
        { id: 3, nome: 'Cartão de Débito', ativo: true },
        { id: 4, nome: 'PIX', ativo: true }
    ];
    this.caixas = [{ id: 1, nome: 'Caixa 01', ativo: true }];
    this.usuarios = [{ id: 1, nome: 'Administrador', login: 'admin', senha: '123', perfil: 'Administrador', ativo: true }];
    this.configuracoesAdicionais = [];
    this.clientes = [{id: 1, nome: 'Cliente Padrão', tipoPessoa: 'Física', cpfCnpj: '000.000.000-00', telefone: '', nomeWhatsapp: '', endereco: '', numero: '', complemento: '', bairro: '', saldoCredito: 0 }];
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
  
  // New helper to get Money balance specifically
  getSaldoDinheiroSessao(sessaoId: number): number {
      const movimentos = this.caixaMovimentos.filter(m => m.sessaoId === sessaoId);
      // Assuming ID 1 is always Dinheiro based on Seed. ideally we'd look it up.
      const dinheiroId = 1; 
      
      return movimentos.reduce((acc, mov) => {
          // If it's a generic opening/bleed operation, we assume it affects money
          if (mov.tipoOperacao === TipoOperacaoCaixa.Abertura || mov.tipoOperacao === TipoOperacaoCaixa.Reforco || mov.tipoOperacao === TipoOperacaoCaixa.CreditoCliente) {
             return acc + mov.valor;
          }
          if (mov.tipoOperacao === TipoOperacaoCaixa.Sangria || mov.tipoOperacao === TipoOperacaoCaixa.Troco) {
             return acc - mov.valor;
          }
          
          // For sales, we check the payment method
          if (mov.tipoOperacao === TipoOperacaoCaixa.Vendas) {
              if (mov.formaPagamentoId === dinheiroId) {
                  return acc + mov.valor;
              }
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

  savePedido(pedido: Pedido) {
      // Safety Check: Force status to Paid if amount is covered
      const totalPaid = pedido.pagamentos?.reduce((acc, p) => acc + p.valor, 0) || 0;
      if (totalPaid >= (pedido.total - 0.01)) {
          pedido.status = PedidoStatus.Pago;
      }

      // Check if updating
      const index = this.pedidos.findIndex(p => p.id === pedido.id);
      if(index >= 0) {
          this.pedidos[index] = pedido;
      } else {
          this.pedidos.push(pedido);
      }
  }

  // --- AUTH ---
  authenticate(login: string, pass: string) {
      return this.usuarios.find(u => u.login === login && u.senha === pass && u.ativo);
  }

  // --- CASH CONTROL ---
  getSessaoAberta(userId: number) {
      return this.sessoes.find(s => s.usuarioId === userId && s.status === StatusSessao.Aberta);
  }

  getSaldoSessao(sessaoId: number): number {
    return this.caixaMovimentos
      .filter(m => m.sessaoId === sessaoId)
      .reduce((acc, mov) => {
        if (mov.tipoOperacao === TipoOperacaoCaixa.Sangria || mov.tipoOperacao === TipoOperacaoCaixa.Fechamento || mov.tipoOperacao === TipoOperacaoCaixa.Troco) {
          return acc - mov.valor;
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
      
      // Register initial balance as movement
      this.lancarMovimento(novaSessao.id, TipoOperacaoCaixa.Abertura, saldoInicial, 'Abertura de Caixa');
      
      return novaSessao;
  }
  
  fecharSessao(sessaoId: number, conferencia: any) {
      const sessaoIndex = this.sessoes.findIndex(s => s.id === sessaoId);
      if(sessaoIndex < 0) throw new Error("Sessão não encontrada");
      
      const sessao = this.sessoes[sessaoIndex];
      const saldoFinalCalculado = this.getSaldoSessao(sessaoId);
      const totalContado = conferencia.dinheiro + conferencia.cartaoCredito + conferencia.cartaoDebito + conferencia.pix + conferencia.voucher + conferencia.outros;
      
      this.sessoes[sessaoIndex] = {
          ...sessao,
          status: StatusSessao.Fechada,
          dataFechamento: new Date().toISOString(),
          saldoFinal: saldoFinalCalculado,
          conferencia,
          quebraDeCaixa: totalContado - saldoFinalCalculado
      };
      
      // Closing zeros the logical balance for the session history
      this.lancarMovimento(sessaoId, TipoOperacaoCaixa.Fechamento, saldoFinalCalculado, 'Fechamento de Caixa');
  }
  
  lancarMovimento(sessaoId: number, tipo: TipoOperacaoCaixa, valor: number, obs: string, formaPagamentoId?: number) {
      const mov: CaixaMovimento = {
          id: Math.max(0, ...this.caixaMovimentos.map(m => m.id)) + 1,
          sessaoId,
          data: new Date().toISOString(),
          tipoOperacao: tipo,
          valor,
          observacao: obs,
          formaPagamentoId
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

      // Verify Physical Cash Balance if Change is needed
      const dinheiroId = 1;
      const isDinheiro = payment.formaPagamentoId === dinheiroId;
      
      if (isDinheiro && valorTroco > 0) {
          const saldoDinheiro = this.getSaldoDinheiroSessao(sessao.id);
          if (saldoDinheiro < valorTroco) {
              throw new Error("ERR_SALDO_INSUFICIENTE: Não há dinheiro suficiente em caixa para este troco.");
          }
      }
      
      // Add payment to order
      pedido.pagamentos.push(payment);
      
      // Automatic Status Update
      const totalPaid = pedido.pagamentos.reduce((acc, p) => acc + p.valor, 0);
      if (totalPaid >= (pedido.total - 0.01)) {
          pedido.status = PedidoStatus.Pago;
      }
      
      // Register Movement(s)
      if (isDinheiro && valorBruto > 0) {
          // 1. Entry of Total Amount Handed
          this.lancarMovimento(sessao.id, TipoOperacaoCaixa.Vendas, valorBruto, `Pedido #${orderId} - Dinheiro (Recebido)`, payment.formaPagamentoId);
          
          // 2. Exit of Change
          if (valorTroco > 0) {
              this.lancarMovimento(sessao.id, TipoOperacaoCaixa.Troco, valorTroco, `Pedido #${orderId} - Troco`, payment.formaPagamentoId);
          }
      } else {
          // Standard logic for non-cash or exact amount
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

      // 1. Add Payment to Order
      pedido.pagamentos.push(payment);
      
      const totalPaid = pedido.pagamentos.reduce((acc, p) => acc + p.valor, 0);
      if (totalPaid >= (pedido.total - 0.01)) {
          pedido.status = PedidoStatus.Pago;
      }

      // 2. Register Cash Movement (We keep the FULL amount in drawer, technically)
      // Logic: User gave 10. Sale is 6. 4 goes to credit.
      // Drawer: +10 in Cash.
      // Accounting: Sale +6, Customer Credit Liability +4.
      // For simple cash flow: We register +6 Sales and +4 Credit Entry
      
      // Entry 1: The Sale Part
      this.lancarMovimento(sessao.id, TipoOperacaoCaixa.Vendas, payment.valor, `Pedido #${orderId} - ${payment.formaPagamentoNome}`, payment.formaPagamentoId);
      
      // Entry 2: The Credit Part (Surplus stays in drawer)
      this.lancarMovimento(sessao.id, TipoOperacaoCaixa.CreditoCliente, valorTroco, `Crédito Gerado - Cliente #${cliente.id}`, payment.formaPagamentoId);

      // 3. Update Client Balance
      cliente.saldoCredito = (cliente.saldoCredito || 0) + valorTroco;
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
      
      // Remove payment
      pedido.pagamentos.splice(paymentIndex, 1);
      
      // Always revert status to Pendente
      pedido.status = PedidoStatus.Pendente; 
      
      // Register negative movement (Sangria/Estorno)
      this.lancarMovimento(sessao.id, TipoOperacaoCaixa.Sangria, payment.valor, `ESTORNO Pedido #${orderId} - ${payment.formaPagamentoNome}`, payment.formaPagamentoId);
  }
}

export const db = new MockDB();
