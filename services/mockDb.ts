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
    this.clientes = [{id: 1, nome: 'Cliente Padrão', tipoPessoa: 'Física', cpfCnpj: '000.000.000-00', telefone: '', endereco: '', numero: '', complemento: '', bairro: '' }];
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
        if (mov.tipoOperacao === TipoOperacaoCaixa.Sangria || mov.tipoOperacao === TipoOperacaoCaixa.Fechamento) {
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
      
      // Lançar movimento de fechamento (Zera o saldo lógico para fins de registro?) 
      // Usually closing doesn't create a movement that reduces balance unless it's a cash withdrawal for deposit.
      // Let's assume we just close status.
  }
  
  lancarMovimento(sessaoId: number, tipo: TipoOperacaoCaixa, valor: number, obs: string) {
      const mov: CaixaMovimento = {
          id: Math.max(0, ...this.caixaMovimentos.map(m => m.id)) + 1,
          sessaoId,
          data: new Date().toISOString(),
          tipoOperacao: tipo,
          valor,
          observacao: obs
      };
      this.caixaMovimentos.push(mov);
  }
  
  getCaixaMovimentos(sessaoId: number) {
      return this.caixaMovimentos.filter(m => m.sessaoId === sessaoId).sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }

  // --- PAYMENT PROCESSING ---
  addPagamento(orderId: number, payment: Pagamento, userId: number) {
      const sessao = this.getSessaoAberta(userId);
      if(!sessao) throw new Error("Caixa Fechado. Abra o caixa para receber.");
      
      const pedido = this.getPedidoById(orderId);
      if(!pedido) throw new Error("Pedido não encontrado");
      
      // Add payment to order
      pedido.pagamentos.push(payment);
      
      // Update Order Status Logic? Handled in POS usually, but let's ensure consistency if we want
      // MockDb is simple storage usually.
      
      // Register Movement in Cash
      this.lancarMovimento(sessao.id, TipoOperacaoCaixa.Vendas, payment.valor, `Pedido #${orderId} - ${payment.formaPagamentoNome}`);
  }
  
  cancelPagamento(orderId: number, paymentId: string, userId: number) {
      const sessao = this.getSessaoAberta(userId);
      if(!sessao) throw new Error("Caixa Fechado. Abra o caixa para estornar.");
      
      const pedido = this.getPedidoById(orderId);
      if(!pedido) throw new Error("Pedido não encontrado");
      
      const paymentIndex = pedido.pagamentos.findIndex(p => p.id === paymentId);
      if(paymentIndex < 0) throw new Error("Pagamento não encontrado");
      
      const payment = pedido.pagamentos[paymentIndex];
      
      // Remove payment
      pedido.pagamentos.splice(paymentIndex, 1);
      pedido.status = PedidoStatus.Pendente; // Revert status
      
      // Register negative movement (Sangria/Estorno)
      this.lancarMovimento(sessao.id, TipoOperacaoCaixa.Sangria, payment.valor, `ESTORNO Pedido #${orderId} - ${payment.formaPagamentoNome}`);
  }
}

export const db = new MockDB();