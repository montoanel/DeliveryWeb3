
import { 
  Produto, GrupoProduto, Cliente, Pedido, Usuario, Caixa, 
  SessaoCaixa, CaixaMovimento, FormaPagamento, ConfiguracaoAdicional,
  TipoOperacaoCaixa, StatusSessao, PedidoStatus, Pagamento, PedidoItemAdicional, Bairro, ConferenciaFechamento, StatusCozinha, SetorProducao,
  ContaFinanceira, OperadoraCartao, ContaReceber, MovimentoConta, Fornecedor, ContaPagar
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
  private movimentosContas: MovimentoConta[] = []; // Store account history
  private operadoras: OperadoraCartao[] = [];
  private contasReceber: ContaReceber[] = [];
  private fornecedores: Fornecedor[] = [];
  private contasPagar: ContaPagar[] = [];

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

    // 2. Produtos (Added Images)
    this.produtos = [
        { id: 1, ativo: true, tipo: 'Principal', setor: 'Cozinha', codigoInterno: '100', codigoBarras: '7890001', nome: 'X-Burger', preco: 25.00, custo: 10.00, unidadeMedida: 'UN', grupoProdutoId: 1, imagem: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60' },
        { id: 2, ativo: true, tipo: 'Principal', setor: 'Bar', codigoInterno: '101', codigoBarras: '7890002', nome: 'Coca-Cola 350ml', preco: 6.00, custo: 3.00, unidadeMedida: 'UN', grupoProdutoId: 2, imagem: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=60' },
        { id: 3, ativo: true, tipo: 'Complemento', setor: 'Cozinha', codigoInterno: 'ADD1', codigoBarras: '', nome: 'Bacon Extra', preco: 5.00, custo: 2.00, unidadeMedida: 'UN', grupoProdutoId: 1 },
        { id: 10, ativo: true, tipo: 'Principal', setor: 'Cozinha', codigoInterno: 'COP180', codigoBarras: '', nome: 'Copo 180ml (2 Grátis)', preco: 13.00, custo: 4.00, unidadeMedida: 'UN', grupoProdutoId: 3, imagem: 'https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?auto=format&fit=crop&w=500&q=60' },
        { id: 11, ativo: true, tipo: 'Principal', setor: 'Cozinha', codigoInterno: 'COP300', codigoBarras: '', nome: 'Copo 300ml (3 Grátis)', preco: 18.00, custo: 6.00, unidadeMedida: 'UN', grupoProdutoId: 3, imagem: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=500&q=60' },
        { id: 12, ativo: true, tipo: 'Principal', setor: 'Cozinha', codigoInterno: 'COP500', codigoBarras: '', nome: 'Copo 500ml (3 Grátis)', preco: 22.00, custo: 8.00, unidadeMedida: 'UN', grupoProdutoId: 3, imagem: 'https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?auto=format&fit=crop&w=500&q=60' },
        { id: 13, ativo: true, tipo: 'Principal', setor: 'Cozinha', codigoInterno: 'COP700', codigoBarras: '', nome: 'Copo 700ml (4 Grátis)', preco: 27.00, custo: 10.00, unidadeMedida: 'UN', grupoProdutoId: 3, imagem: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=500&q=60' },
        { id: 14, ativo: true, tipo: 'Principal', setor: 'Cozinha', codigoInterno: 'BARCA500', codigoBarras: '', nome: 'Barca 500ml (6 Grátis)', preco: 32.00, custo: 12.00, unidadeMedida: 'UN', grupoProdutoId: 3, imagem: 'https://images.unsplash.com/photo-1553882951-9c3dab4a50cb?auto=format&fit=crop&w=500&q=60' },
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
        { id: 1, nome: 'Cofre Principal', tipo: 'Cofre', saldoAtual: 1000.00, ativo: true },
        { id: 2, nome: 'Conta Stone', tipo: 'Banco', saldoAtual: 2500.00, ativo: true }, 
        { id: 3, nome: 'Conta Inter', tipo: 'Banco', saldoAtual: 1500.00, ativo: true },
    ];
    
    // Seed initial movements for accounts to match balance
    this.movimentosContas = [
        { id: 1, contaId: 1, data: new Date().toISOString(), tipo: 'Entrada', valor: 1000.00, descricao: 'Saldo Inicial Implantado', saldoApos: 1000.00 },
        { id: 2, contaId: 2, data: new Date().toISOString(), tipo: 'Entrada', valor: 2500.00, descricao: 'Saldo Inicial Implantado', saldoApos: 2500.00 },
        { id: 3, contaId: 3, data: new Date().toISOString(), tipo: 'Entrada', valor: 1500.00, descricao: 'Saldo Inicial Implantado', saldoApos: 1500.00 },
    ];

    this.operadoras = [
        // Linked Stone to Account ID 2 (Conta Stone)
        { id: 1, nome: 'Stone', taxaCredito: 3.5, diasRecebimentoCredito: 30, taxaDebito: 1.5, diasRecebimentoDebito: 1, contaVinculadaId: 2, ativo: true },
        { id: 2, nome: 'Cielo', taxaCredito: 4.0, diasRecebimentoCredito: 30, taxaDebito: 1.8, diasRecebimentoDebito: 1, ativo: true },
    ];

    this.formasPagamento = [
        { id: 1, nome: 'Dinheiro', ativo: true, tipoVinculo: 'Nenhum' },
        { id: 2, nome: 'Cartão de Crédito', ativo: true, tipoVinculo: 'Operadora', operadoraId: 1 }, // Linked to Stone
        { id: 3, nome: 'Cartão de Débito', ativo: true, tipoVinculo: 'Operadora', operadoraId: 1 }, // Linked to Stone
        { id: 4, nome: 'PIX', ativo: true, tipoVinculo: 'Conta', contaDestinoId: 2 }, // Linked to Stone (Assuming PIX falls there too)
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

    // SEED SUPPLIERS & BILLS
    this.fornecedores = [
        { id: 1, nome: 'Atacadão das Bebidas', documento: '12.345.678/0001-90', telefone: '(11) 9999-9999', ativo: true },
        { id: 2, nome: 'Fornecedor de Embalagens', documento: '98.765.432/0001-10', telefone: '(11) 8888-8888', ativo: true },
        { id: 3, nome: 'Companhia de Energia', documento: '00.000.000/0001-00', telefone: '0800', ativo: true },
    ];

    const today = new Date().toISOString().split('T')[0];
    this.contasPagar = [
        { id: 1, fornecedorId: 3, fornecedorNome: 'Companhia de Energia', documento: 'NFe 9988', descricao: 'Conta de Luz - Dezembro', valor: 350.50, valorPago: 0, historicoPagamentos: [], dataEmissao: today, dataVencimento: today, status: 'Pendente' },
        { id: 2, fornecedorId: 1, fornecedorNome: 'Atacadão das Bebidas', documento: 'Boleto 123', descricao: 'Reposição Refrigerantes', valor: 1200.00, valorPago: 0, historicoPagamentos: [], dataEmissao: today, dataVencimento: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], status: 'Pendente' }, 
    ];
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
  
  getMovimentosConta(contaId: number, start?: string, end?: string) {
      let filtered = this.movimentosContas.filter(m => m.contaId === contaId);
      if (start) {
          const startDate = new Date(start);
          startDate.setHours(0,0,0,0);
          filtered = filtered.filter(m => new Date(m.data) >= startDate);
      }
      if (end) {
          const endDate = new Date(end);
          endDate.setHours(23,59,59,999);
          filtered = filtered.filter(m => new Date(m.data) <= endDate);
      }
      // Sort desc
      return filtered.sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }

  getOperadoras() { return this.operadoras; }
  
  getRecebiveisPorConta(contaId: number, start?: string, end?: string) {
      let filtered = this.contasReceber.filter(r => r.contaDestinoId === contaId);
      
      if (start) {
          const startDate = new Date(start);
          startDate.setHours(0,0,0,0);
          filtered = filtered.filter(r => new Date(r.dataPrevisao) >= startDate);
      }
      if (end) {
          const endDate = new Date(end);
          endDate.setHours(23,59,59,999);
          filtered = filtered.filter(r => new Date(r.dataPrevisao) <= endDate);
      }
      return filtered.sort((a,b) => new Date(a.dataPrevisao).getTime() - new Date(b.dataPrevisao).getTime());
  }

  getContasReceber() { return this.contasReceber.sort((a,b) => new Date(a.dataPrevisao).getTime() - new Date(b.dataPrevisao).getTime()); }

  getFornecedores() { return this.fornecedores; }
  getContasPagar() { return this.contasPagar.sort((a,b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime()); }

  getPedidoById(id: number) { return this.pedidos.find(p => p.id === id); }

  getSaldoCaixa() { 
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

  // --- REPORTING METHODS ---
  getDashboardData(startDate: Date, endDate: Date) {
      // Normalize dates
      const start = new Date(startDate); start.setHours(0,0,0,0);
      const end = new Date(endDate); end.setHours(23,59,59,999);

      const pedidosNoPeriodo = this.pedidos.filter(p => {
          const pDate = new Date(p.data);
          return pDate >= start && pDate <= end && p.status !== PedidoStatus.Cancelado;
      });

      const totalVendas = pedidosNoPeriodo.reduce((acc, p) => acc + p.total, 0);
      const totalPedidos = pedidosNoPeriodo.length;

      // Sales by Payment Method
      const salesByMethod: Record<string, number> = {};
      pedidosNoPeriodo.forEach(p => {
          if (p.pagamentos) {
              p.pagamentos.forEach(pag => {
                  salesByMethod[pag.formaPagamentoNome] = (salesByMethod[pag.formaPagamentoNome] || 0) + pag.valor;
              });
          }
      });
      const pieDataPayment = Object.keys(salesByMethod).map(key => ({ name: key, value: salesByMethod[key] }));

      // Sales by Service Type
      const salesByType: Record<string, number> = {};
      pedidosNoPeriodo.forEach(p => {
          salesByType[p.tipoAtendimento] = (salesByType[p.tipoAtendimento] || 0) + p.total;
      });
      const pieDataType = Object.keys(salesByType).map(key => ({ name: key, value: salesByType[key] }));

      // Top Products
      const productStats: Record<number, {name: string, qty: number, total: number}> = {};
      pedidosNoPeriodo.forEach(p => {
          p.itens.forEach(item => {
              if (!productStats[item.produto.id]) {
                  productStats[item.produto.id] = { name: item.produto.nome, qty: 0, total: 0 };
              }
              productStats[item.produto.id].qty += item.quantidade;
              productStats[item.produto.id].total += (item.quantidade * item.produto.preco);
          });
      });
      const topProducts = Object.values(productStats).sort((a,b) => b.qty - a.qty).slice(0, 5);

      // Hourly Data (Aggregated for all days in period - simplified)
      const hourlyData: Record<string, number> = {};
      pedidosNoPeriodo.forEach(p => {
          const hour = new Date(p.data).getHours();
          const label = `${hour.toString().padStart(2, '0')}:00`;
          hourlyData[label] = (hourlyData[label] || 0) + p.total;
      });
      const chartData = Object.keys(hourlyData).sort().map(key => ({ name: key, vendas: hourlyData[key] }));

      return {
          totalVendas,
          totalPedidos,
          pieDataPayment,
          pieDataType,
          topProducts,
          chartData
      };
  }

  getVendasDoDia() {
      const today = new Date();
      return this.getDashboardData(today, today).totalVendas;
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
          // Initial balance movement
          if (item.saldoAtual > 0) {
              this.lancarMovimentoConta(item.id, 'Entrada', item.saldoAtual, 'Saldo Inicial Implantado');
          }
      } else {
          const index = this.contasFinanceiras.findIndex(p => p.id === item.id);
          if(index >= 0) {
              // Update only name/type, balance is controlled by movements
              this.contasFinanceiras[index].nome = item.nome;
              this.contasFinanceiras[index].tipo = item.tipo;
              this.contasFinanceiras[index].ativo = item.ativo;
          }
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

  // SUPPLIERS & BILLS
  saveFornecedor(item: Fornecedor) {
      if (item.id === 0) {
          item.id = Math.max(0, ...this.fornecedores.map(f => f.id)) + 1;
          this.fornecedores.push(item);
      } else {
          const index = this.fornecedores.findIndex(f => f.id === item.id);
          if (index >= 0) this.fornecedores[index] = item;
      }
  }
  deleteFornecedor(id: number) { this.fornecedores = this.fornecedores.filter(f => f.id !== id); }

  saveContaPagar(item: ContaPagar) {
      if (item.id === 0) {
          item.id = Math.max(0, ...this.contasPagar.map(c => c.id)) + 1;
          // Fill denormalized name
          const supplier = this.fornecedores.find(f => f.id === item.fornecedorId);
          item.fornecedorNome = supplier ? supplier.nome : 'Desconhecido';
          item.valorPago = 0;
          item.historicoPagamentos = [];
          this.contasPagar.push(item);
      } else {
          const index = this.contasPagar.findIndex(c => c.id === item.id);
          if (index >= 0) {
              const supplier = this.fornecedores.find(f => f.id === item.fornecedorId);
              item.fornecedorNome = supplier ? supplier.nome : 'Desconhecido';
              // Preserve payment history if editing (should ideally block editing paid bills)
              item.valorPago = this.contasPagar[index].valorPago;
              item.historicoPagamentos = this.contasPagar[index].historicoPagamentos;
              this.contasPagar[index] = item;
          }
      }
  }
  
  deleteContaPagar(id: number) { this.contasPagar = this.contasPagar.filter(c => c.id !== id); }

  pagarConta(contaId: number, contaFinanceiraId: number, dataPagamento: string, formaPagamentoId?: number, observacoes?: string, valorPago: number = 0) {
      const index = this.contasPagar.findIndex(c => c.id === contaId);
      if (index === -1) throw new Error("Conta a pagar não encontrada.");
      
      const conta = this.contasPagar[index];
      
      // Calculate remaining amount
      const restante = conta.valor - (conta.valorPago || 0);
      
      // Default to full remaining if not specified or 0
      const valorParaPagar = (valorPago > 0) ? valorPago : restante;

      if (valorParaPagar > restante + 0.01) { // 0.01 tolerance
          throw new Error(`Valor a pagar (R$ ${valorParaPagar.toFixed(2)}) é maior que o saldo restante (R$ ${restante.toFixed(2)}).`);
      }

      // Check balance and debit
      this.lancarMovimentoConta(
          contaFinanceiraId, 
          'Saída', 
          valorParaPagar, 
          `Pagto. Fornecedor: ${conta.fornecedorNome} - ${conta.descricao} ${valorParaPagar < restante ? '(Parcial)' : ''}`
      );

      // Update Bill Status
      const novoTotalPago = (conta.valorPago || 0) + valorParaPagar;
      const novoStatus = novoTotalPago >= (conta.valor - 0.01) ? 'Pago' : 'Parcial';

      this.contasPagar[index] = {
          ...conta,
          status: novoStatus,
          valorPago: novoTotalPago,
          historicoPagamentos: [
              ...(conta.historicoPagamentos || []),
              {
                  data: dataPagamento,
                  valor: valorParaPagar,
                  contaFinanceiraId,
                  formaPagamentoId,
                  observacao: observacoes
              }
          ]
      };
  }

  // --- ACCOUNTS RECEIVABLE (MANUAL) ---
  saveContaReceber(item: ContaReceber) {
      if(!item.id) item.id = Math.random().toString(36).substr(2, 9);
      
      // If manual entry, ensure arrays exist
      if(!item.historicoRecebimentos) item.historicoRecebimentos = [];
      if(!item.valorRecebido) item.valorRecebido = 0;

      const index = this.contasReceber.findIndex(c => c.id === item.id);
      if(index >= 0) {
          this.contasReceber[index] = item;
      } else {
          this.contasReceber.push(item);
      }
  }

  deleteContaReceber(id: string) {
      this.contasReceber = this.contasReceber.filter(c => c.id !== id);
  }

  receberConta(contaId: string, contaFinanceiraId: number, dataRecebimento: string, formaPagamentoId?: number, observacoes?: string, valorRecebido: number = 0) {
      const index = this.contasReceber.findIndex(c => c.id === contaId);
      if (index === -1) throw new Error("Conta a receber não encontrada.");
      
      const conta = this.contasReceber[index];
      
      const restante = conta.valorLiquido - (conta.valorRecebido || 0);
      const valorParaReceber = (valorRecebido > 0) ? valorRecebido : restante;

      if (valorParaReceber > restante + 0.01) {
          throw new Error(`Valor a receber (R$ ${valorParaReceber.toFixed(2)}) é maior que o saldo restante (R$ ${restante.toFixed(2)}).`);
      }

      // Credit Account
      this.lancarMovimentoConta(
          contaFinanceiraId, 
          'Entrada', 
          valorParaReceber, 
          `Recebimento: ${conta.origem} - ${conta.descricao || 'Pedido'} ${valorParaReceber < restante ? '(Parcial)' : ''}`
      );

      const novoTotalRecebido = (conta.valorRecebido || 0) + valorParaReceber;
      const novoStatus = novoTotalRecebido >= (conta.valorLiquido - 0.01) ? 'Recebido' : 'Parcial';

      this.contasReceber[index] = {
          ...conta,
          status: novoStatus,
          valorRecebido: novoTotalRecebido,
          historicoRecebimentos: [
              ...(conta.historicoRecebimentos || []),
              {
                  data: dataRecebimento,
                  valor: valorParaReceber,
                  contaFinanceiraId,
                  formaPagamentoId,
                  observacao: observacoes
              }
          ]
      };
  }

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
      return this.sessoes.filter(s => s.status === StatusSessao.Fechada);
  }
  
  getSessoesConsolidadas() {
      return this.sessoes.filter(s => s.status === StatusSessao.Consolidada).sort((a,b) => new Date(b.dataConsolidacao!).getTime() - new Date(a.dataConsolidacao!).getTime());
  }

  abrirSessao(userId: number, caixaId: number, saldoInicial: number, contaOrigemId?: number) {
      if (this.getSessaoAberta(userId)) {
          throw new Error("Você já possui um caixa aberto.");
      }
      
      // Treasury Logic: Debit from Source Account
      if (contaOrigemId && saldoInicial > 0) {
          this.lancarMovimentoConta(
              contaOrigemId, 
              'Saída', 
              saldoInicial, 
              `Abertura de Caixa #${caixaId} - Usuário ${userId}`
          );
      }

      const user = this.usuarios.find(u => u.id === userId)!;
      const caixa = this.caixas.find(c => c.id === caixaId)!;

      const newSession: SessaoCaixa = {
          id: Math.max(0, ...this.sessoes.map(s => s.id)) + 1,
          caixaId,
          caixaNome: caixa.nome,
          usuarioId: userId,
          usuarioNome: user.nome,
          dataAbertura: new Date().toISOString(),
          saldoInicial,
          contaOrigemId, // Track source
          status: StatusSessao.Aberta
      };

      this.sessoes.push(newSession);
      this.lancarMovimento(newSession.id, TipoOperacaoCaixa.Abertura, saldoInicial, 'Fundo de Troco', 1, contaOrigemId);

      return newSession;
  }

  fecharSessao(sessaoId: number, conferencia: ConferenciaFechamento) {
      const index = this.sessoes.findIndex(s => s.id === sessaoId);
      if (index === -1) throw new Error("Sessão não encontrada");

      const sessao = this.sessoes[index];
      
      // Calculate System Balance
      const saldoDinheiro = this.getSaldoDinheiroSessao(sessaoId);
      const saldoFinalSistema = saldoDinheiro; // Cash is what matters for physical count
      
      this.sessoes[index] = {
          ...sessao,
          status: StatusSessao.Fechada,
          dataFechamento: new Date().toISOString(),
          saldoFinalSistema,
          conferenciaOperador: conferencia
      };
      
      this.lancarMovimento(sessaoId, TipoOperacaoCaixa.Fechamento, saldoDinheiro, 'Fechamento de Caixa');
  }

  consolidarSessao(sessaoId: number, audit: ConferenciaFechamento) {
     const index = this.sessoes.findIndex(s => s.id === sessaoId);
      if (index === -1) throw new Error("Sessão não encontrada");
      
      const sessao = this.sessoes[index];
      const saldoSistema = this.getSaldoDinheiroSessao(sessaoId); // Actually checks movements
      
      const diffDinheiro = audit.dinheiro - saldoSistema;
      
      this.sessoes[index] = {
          ...sessao,
          status: StatusSessao.Consolidada,
          dataConsolidacao: new Date().toISOString(),
          conferenciaAuditoria: audit,
          quebraDeCaixa: diffDinheiro
      };
      
      // Treasury Integration: 
      // UPDATED LOGIC: ALL MONEY in the drawer goes to the Safe.
      // e.g. Start 100 + Sale 100 = 200 Total.
      // If operator returns 200, we deposit 200 to safe.
      
      const cofrePrincipal = this.contasFinanceiras.find(c => c.tipo === 'Cofre');
      if (cofrePrincipal && audit.dinheiro > 0) {
          // Deposit the FULL audited amount
          this.lancarMovimentoConta(
              cofrePrincipal.id, 
              'Entrada', 
              audit.dinheiro, 
              `Sangria de Fechamento (Total) - Sessão #${sessao.id}`
          );
      }
  }

  getSaldoSessao(sessaoId: number) {
      return this.caixaMovimentos
        .filter(m => m.sessaoId === sessaoId)
        .reduce((acc, m) => {
            if (m.tipoOperacao === TipoOperacaoCaixa.Sangria || m.tipoOperacao === TipoOperacaoCaixa.Troco) return acc - m.valor;
            if (m.tipoOperacao === TipoOperacaoCaixa.Vendas || m.tipoOperacao === TipoOperacaoCaixa.Abertura || m.tipoOperacao === TipoOperacaoCaixa.Reforco || m.tipoOperacao === TipoOperacaoCaixa.CreditoCliente) return acc + m.valor;
            return acc;
        }, 0);
  }

  getCaixaMovimentos(sessaoId: number) {
      return this.caixaMovimentos.filter(m => m.sessaoId === sessaoId).sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }

  lancarMovimento(sessaoId: number, tipo: TipoOperacaoCaixa, valor: number, obs: string, formaPagamentoId?: number, contaOrigemId?: number, contaDestinoId?: number) {
      const mov: CaixaMovimento = {
          id: Math.max(0, ...this.caixaMovimentos.map(m => m.id)) + 1,
          sessaoId,
          data: new Date().toISOString(),
          tipoOperacao: tipo,
          valor,
          observacao: obs,
          formaPagamentoId: formaPagamentoId || 1, // Default Money
          contaOrigemId,
          contaDestinoId
      };
      this.caixaMovimentos.push(mov);

      // --- TREASURY INTEGRATION ---
      if (tipo === TipoOperacaoCaixa.Reforco && contaOrigemId) {
          this.lancarMovimentoConta(contaOrigemId, 'Saída', valor, `Reforço para Caixa (Sessão #${sessaoId})`);
      }
      if (tipo === TipoOperacaoCaixa.Sangria && contaDestinoId) {
          this.lancarMovimentoConta(contaDestinoId, 'Entrada', valor, `Sangria de Caixa (Sessão #${sessaoId})`);
      }
  }

  // --- TREASURY METHODS ---

  lancarMovimentoConta(contaId: number, tipo: 'Entrada' | 'Saída', valor: number, descricao: string) {
      const conta = this.contasFinanceiras.find(c => c.id === contaId);
      if (!conta) throw new Error("Conta financeira não encontrada.");

      if (tipo === 'Saída' && conta.saldoAtual < valor) {
          throw new Error(`Saldo insuficiente na conta ${conta.nome}. Atual: R$ ${conta.saldoAtual.toFixed(2)}`);
      }

      // Update Balance
      if (tipo === 'Entrada') conta.saldoAtual += valor;
      else conta.saldoAtual -= valor;

      // Log Movement
      const mov: MovimentoConta = {
          id: Math.max(0, ...this.movimentosContas.map(m => m.id)) + 1,
          contaId,
          data: new Date().toISOString(),
          tipo,
          valor,
          descricao,
          saldoApos: conta.saldoAtual
      };
      this.movimentosContas.push(mov);
  }

  agendarRecebivel(pedidoId: number, valorBruto: number, formaPagamento: FormaPagamento, dataVenda: string) {
      let valorLiquido = valorBruto;
      let dataPrev = new Date();
      let taxa = 0;
      let origem = 'Desconhecida';
      let status: 'Pendente' | 'Recebido' = 'Pendente';
      let contaDestinoId: number | undefined = undefined;

      if (formaPagamento.tipoVinculo === 'Operadora' && formaPagamento.operadoraId) {
          const op = this.operadoras.find(o => o.id === formaPagamento.operadoraId);
          if (op) {
              origem = op.nome;
              // Link Account from Operator if exists
              contaDestinoId = op.contaVinculadaId;

              // Simple check based on name to guess credit/debit
              const isCredit = formaPagamento.nome.toLowerCase().includes('crédito');
              if (isCredit) {
                  taxa = (valorBruto * op.taxaCredito) / 100;
                  dataPrev.setDate(dataPrev.getDate() + op.diasRecebimentoCredito);
              } else {
                  taxa = (valorBruto * op.taxaDebito) / 100;
                  dataPrev.setDate(dataPrev.getDate() + op.diasRecebimentoDebito);
              }
              valorLiquido = valorBruto - taxa;
          }
      } else if (formaPagamento.tipoVinculo === 'Conta' && formaPagamento.contaDestinoId) {
          const conta = this.contasFinanceiras.find(c => c.id === formaPagamento.contaDestinoId);
          if (conta) {
              origem = conta.nome;
              contaDestinoId = conta.id;
              status = 'Recebido'; // PIX is instant usually
              dataPrev = new Date();
              // Auto-credit account logic for PIX
              this.lancarMovimentoConta(conta.id, 'Entrada', valorLiquido, `Recebimento PIX Pedido #${pedidoId}`);
          }
      }

      const recebivel: ContaReceber = {
          id: Math.random().toString(36).substr(2, 9),
          pedidoId,
          dataVenda,
          dataPrevisao: dataPrev.toISOString(),
          valorBruto,
          taxaAplicada: taxa,
          valorLiquido,
          status,
          valorRecebido: status === 'Recebido' ? valorLiquido : 0,
          historicoRecebimentos: [],
          formaPagamentoNome: formaPagamento.nome,
          origem,
          contaDestinoId
      };
      
      this.contasReceber.push(recebivel);
  }
  
  // Update Payment logic to trigger Receivables
  addPagamento(pedidoId: number, pagamento: Pagamento, usuarioId: number, change: number, bruteValue: number) {
      const sessao = this.getSessaoAberta(usuarioId);
      if (!sessao) throw new Error("Caixa Fechado. Abra o caixa para vender.");
      
      // 1. Add movement to Cash
      const forma = this.formasPagamento.find(f => f.id === pagamento.formaPagamentoId);
      if(!forma) throw new Error("Forma de pagamento inválida");

      // Register payment (Entry)
      this.lancarMovimento(sessao.id, TipoOperacaoCaixa.Vendas, pagamento.valor, `Venda #${pedidoId}`, forma.id);

      // Register change (Exit) if any
      if (change > 0) {
           this.lancarMovimento(sessao.id, TipoOperacaoCaixa.Troco, change, `Troco Venda #${pedidoId}`, 1);
      }
      
      // 2. Add Payment to Order
      const pedido = this.getPedidoById(pedidoId);
      if(pedido) {
          if (!pedido.pagamentos) pedido.pagamentos = [];
          pedido.pagamentos.push(pagamento);
          this.savePedido(pedido);
          
          // 3. Treasury Schedule
          if (forma.tipoVinculo !== 'Nenhum') {
              this.agendarRecebivel(pedidoId, pagamento.valor, forma, new Date().toISOString());
          }
      }
  }

  converterTrocoEmCredito(pedidoId: number, pagamento: Pagamento, troco: number, usuarioId: number, bruteValue: number) {
        const sessao = this.getSessaoAberta(usuarioId);
        if (!sessao) throw new Error("Caixa Fechado.");
        
        // 1. Register full payment entry
        const forma = this.formasPagamento.find(f => f.id === pagamento.formaPagamentoId);
        if(!forma) throw new Error("Forma inválida");
        
        // Register Sale (90)
        this.lancarMovimento(sessao.id, TipoOperacaoCaixa.Vendas, pagamento.valor, `Venda #${pedidoId}`, forma.id);
        
        // Register Credit TopUp (10)
        this.lancarMovimento(sessao.id, TipoOperacaoCaixa.CreditoCliente, troco, `Troco em Crédito #${pedidoId}`, forma.id);
        
        // Update Order
        const pedido = this.getPedidoById(pedidoId);
        if(pedido) {
            if(!pedido.pagamentos) pedido.pagamentos = [];
            pedido.pagamentos.push(pagamento);
            this.savePedido(pedido);
            
             // Add credit to client
            if (pedido.clienteId) {
                this.addCreditoCliente(pedido.clienteId, troco);
            }
        }
  }
  
  addCreditoCliente(clienteId: number, valor: number) {
      const client = this.clientes.find(c => c.id === clienteId);
      if (client) {
          client.saldoCredito = (client.saldoCredito || 0) + valor;
      }
  }

  usarCreditoCliente(pedidoId: number, valor: number, usuarioId: number) {
      const sessao = this.getSessaoAberta(usuarioId);
      if (!sessao) throw new Error("Caixa Fechado.");

      const pedido = this.getPedidoById(pedidoId);
      if (!pedido || !pedido.clienteId) throw new Error("Pedido inválido ou sem cliente.");

      const client = this.clientes.find(c => c.id === pedido.clienteId);
      if (!client || (client.saldoCredito || 0) < valor) throw new Error("Saldo de crédito insuficiente.");

      // Deduct Credit
      client.saldoCredito = (client.saldoCredito || 0) - valor;

      // Register Payment on Order
      const pag: Pagamento = {
          id: Math.random().toString(36).substr(2, 9),
          data: new Date().toISOString(),
          formaPagamentoId: -1, // Special ID for Credit
          formaPagamentoNome: 'Crédito em Loja',
          valor: valor
      };
      
      if(!pedido.pagamentos) pedido.pagamentos = [];
      pedido.pagamentos.push(pag);
      this.savePedido(pedido);

      // Register Usage in Cash (Virtual Entry?)
      this.lancarMovimento(sessao.id, TipoOperacaoCaixa.UsoCredito, valor, `Uso Crédito Pedido #${pedidoId}`, -1);
  }
  
  cancelPagamento(pedidoId: number, pagamentoId: string, usuarioId: number) {
       const sessao = this.getSessaoAberta(usuarioId);
       if (!sessao) throw new Error("Caixa Fechado.");
       
       const pedido = this.getPedidoById(pedidoId);
       if (!pedido) throw new Error("Pedido não encontrado");
       
       const pagIndex = pedido.pagamentos.findIndex(p => p.id === pagamentoId);
       if (pagIndex === -1) throw new Error("Pagamento não encontrado");
       
       const pag = pedido.pagamentos[pagIndex];
       
       // Remove from order
       pedido.pagamentos.splice(pagIndex, 1);
       // Revert status if needed
       if (pedido.status === PedidoStatus.Pago) pedido.status = PedidoStatus.Pendente;
       
       this.savePedido(pedido);
       
       if (pag.formaPagamentoNome === 'Crédito em Loja') {
            // Refund credit to client
            if (pedido.clienteId) this.addCreditoCliente(pedido.clienteId, pag.valor);
       } else {
            // Physical money back
            this.lancarMovimento(sessao.id, TipoOperacaoCaixa.Sangria, pag.valor, `ESTORNO Venda #${pedidoId}`, pag.formaPagamentoId);
       }
  }

}

export const db = new MockDB();
