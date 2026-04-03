/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Book, 
  Users, 
  UserCheck, 
  ClipboardList, 
  Database, 
  Shield, 
  History, 
  Info, 
  Search, 
  Plus, 
  PlusCircle,
  CheckCircle2, 
  XCircle,
  LayoutDashboard,
  FileText,
  ChevronRight,
  DatabaseZap,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookType, 
  EmployeeType, 
  CitizenType, 
  LoanType, 
  INITIAL_BOOKS, 
  INITIAL_EMPLOYEES, 
  INITIAL_CITIZENS, 
  INITIAL_LOANS 
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'documentation' | 'book' | 'citizen' | 'loan' | 'employee'>('dashboard');
  const [books, setBooks] = useState<BookType[]>(INITIAL_BOOKS);
  const [citizens, setCitizens] = useState<CitizenType[]>(INITIAL_CITIZENS);
  const [employees, setEmployees] = useState<EmployeeType[]>(INITIAL_EMPLOYEES);
  const [loans, setLoans] = useState<LoanType[]>(INITIAL_LOANS);
  const [searchTerm, setSearchTerm] = useState('');
  const [loanSearchCpf, setLoanSearchCpf] = useState('');

  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookType | null>(null);
  const [isCitizenModalOpen, setIsCitizenModalOpen] = useState(false);
  const [editingCitizen, setEditingCitizen] = useState<CitizenType | null>(null);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeType | null>(null);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [selectedCitizenName, setSelectedCitizenName] = useState('');

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginStep, setLoginStep] = useState<'cpf' | 'otp'>('cpf');
  const [loginCpf, setLoginCpf] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [sentOtp, setSentOtp] = useState('');
  const [currentUser, setCurrentUser] = useState<EmployeeType | null>(null);

  const handleLoginCpf = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const cpf = formData.get('cpf') as string;
    
    const employee = employees.find(emp => emp.cpf === cpf);
    if (employee) {
      setLoginCpf(cpf);
      setCurrentUser(employee);
      // Simulate sending OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSentOtp(code);
      setLoginStep('otp');
      console.log(`[SIMULATION] Código enviado para o WhatsApp de ${employee.nome}: ${code}`);
    } else {
      setError('CPF não encontrado no quadro de funcionários.');
    }
  };

  const handleLoginOtp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (otpCode === sentOtp) {
      setIsAuthenticated(true);
    } else {
      setError('Código inválido. Verifique o código enviado ao seu WhatsApp.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginStep('cpf');
    setLoginCpf('');
    setOtpCode('');
    setSentOtp('');
    setCurrentUser(null);
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return 0;
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const isOverdue = (loan: LoanType) => {
    if (loan.dataDevolucaoReal) return false;
    const today = new Date();
    const due = new Date(loan.dataDevolucaoPrevista);
    return today > due;
  };

  const filteredBooks = useMemo(() => 
    books.filter(b => b.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || b.autor.toLowerCase().includes(searchTerm.toLowerCase())),
    [books, searchTerm]
  );

  const filteredLoans = useMemo(() => {
    let result = [...loans].sort((a, b) => {
      const aOverdue = isOverdue(a);
      const bOverdue = isOverdue(b);
      
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      // For both overdue and non-overdue, show the one with the due date closest to today first
      // This means sorting by dataDevolucaoPrevista in ascending order
      return new Date(a.dataDevolucaoPrevista).getTime() - new Date(b.dataDevolucaoPrevista).getTime();
    });
    if (loanSearchCpf) {
      result = result.filter(l => l.cidadaoCpf.includes(loanSearchCpf));
    }
    return result;
  }, [loans, loanSearchCpf]);

  const stats = {
    totalBooks: books.length,
    availableBooks: books.filter(b => b.status === 'disponivel').length,
    activeLoans: loans.filter(l => !l.dataDevolucaoReal).length,
    totalCitizens: citizens.length
  };

  const [error, setError] = useState<string | null>(null);

  const handleSaveBook = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const bookData: Partial<BookType> = {
      titulo: formData.get('titulo') as string,
      autor: formData.get('autor') as string,
      dataCadastro: formData.get('dataCadastro') as string,
      volume: formData.get('volume') as string,
      paginas: Number(formData.get('paginas')),
      editora: formData.get('editora') as string,
      tema: formData.get('tema') as string,
    };

    if (editingBook) {
      setBooks(prev => prev.map(b => b.id === editingBook.id ? { ...b, ...bookData } : b));
    } else {
      const newBook: BookType = {
        id: Math.max(0, ...books.map(b => b.id)) + 1,
        status: 'disponivel',
        ...bookData as BookType
      };
      setBooks(prev => [...prev, newBook]);
    }
    setIsBookModalOpen(false);
    setEditingBook(null);
    setError(null);
  };

  const handleDeleteBook = (id: number) => {
    setBooks(prev => prev.filter(b => b.id !== id));
  };

  const handleSaveCitizen = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const citizenData: CitizenType = {
      id: editingCitizen ? editingCitizen.id : Math.max(0, ...citizens.map(c => c.id)) + 1,
      cpf: formData.get('cpf') as string,
      nome: formData.get('nome') as string,
      email: formData.get('email') as string,
      telefone: formData.get('telefone') as string,
      endereco: formData.get('endereco') as string,
      dataNascimento: formData.get('dataNascimento') as string,
      responsavel: formData.get('responsavel') as string || undefined,
      cpfResponsavel: formData.get('cpfResponsavel') as string || undefined,
      telefoneResponsavel: formData.get('telefoneResponsavel') as string || undefined,
      bloqueado: editingCitizen ? editingCitizen.bloqueado : false,
    };

    if (editingCitizen) {
      setCitizens(prev => prev.map(c => c.id === editingCitizen.id ? citizenData : c));
    } else {
      if (citizenData.cpf && citizens.some(c => c.cpf === citizenData.cpf)) {
        setError('Este CPF já está cadastrado.');
        return;
      }
      setCitizens(prev => [...prev, citizenData]);
    }
    setIsCitizenModalOpen(false);
    setEditingCitizen(null);
    setError(null);
  };

  const handleDeleteCitizen = (id: number) => {
    setCitizens(prev => prev.filter(c => c.id !== id));
  };

  const handleSaveEmployee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (currentUser?.setor !== 'Administrador') {
      setError('Apenas administradores podem gerenciar funcionários.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const employeeData: EmployeeType = {
      id: editingEmployee ? editingEmployee.id : Math.max(0, ...employees.map(emp => emp.id)) + 1,
      nome: formData.get('nome') as string,
      setor: formData.get('setor') as string,
      cpf: formData.get('cpf') as string,
      telefone: formData.get('telefone') as string,
    };

    if (editingEmployee) {
      setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? employeeData : emp));
    } else {
      if (employees.some(emp => emp.cpf === employeeData.cpf)) {
        setError('Este CPF de funcionário já está cadastrado.');
        return;
      }
      setEmployees(prev => [...prev, employeeData]);
    }
    setIsEmployeeModalOpen(false);
    setEditingEmployee(null);
    setError(null);
  };

  const handleDeleteEmployee = (id: number) => {
    if (currentUser?.setor !== 'Administrador') {
      alert('Apenas administradores podem excluir funcionários.');
      return;
    }
    setEmployees(prev => prev.filter(emp => emp.id !== id));
  };

  const handleSaveLoan = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    const bookTitle = formData.get('livroTitulo') as string;
    const book = books.find(b => b.titulo.toLowerCase() === bookTitle.toLowerCase());
    
    if (!book) {
      setError('Livro não encontrado pelo título.');
      return;
    }

    if (book.status === 'emprestado') {
      setError('Este livro já está emprestado.');
      return;
    }

    const citizenCpf = formData.get('cidadaoCpf') as string;
    const citizen = citizens.find(c => c.cpf === citizenCpf);

    if (!citizen) {
      setError('Cidadão não encontrado pelo CPF.');
      return;
    }

    if (citizen.bloqueado) {
      setError('Este cidadão está bloqueado para novos empréstimos.');
      return;
    }

    const loanDate = new Date(formData.get('dataEmprestimo') as string);
    const dueDate = new Date(formData.get('dataDevolucaoPrevista') as string);

    if (dueDate < loanDate) {
      setError('A data de devolução não pode ser anterior à data de empréstimo.');
      return;
    }

    const newLoan: LoanType = {
      id: Math.max(0, ...loans.map(l => l.id)) + 1,
      livroId: book.id,
      cidadaoCpf: citizen.cpf,
      funcionarioNome: formData.get('funcionarioNome') as string,
      dataEmprestimo: formData.get('dataEmprestimo') as string,
      dataDevolucaoPrevista: formData.get('dataDevolucaoPrevista') as string,
    };

    setLoans(prev => [...prev, newLoan]);
    setBooks(prev => prev.map(b => b.id === book.id ? { ...b, status: 'emprestado' } : b));
    setIsLoanModalOpen(false);
    setError(null);
  };

  const handleReturnBook = (loanId: number) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    setLoans(prev => prev.map(l => l.id === loanId ? { ...l, dataDevolucaoReal: new Date().toISOString().split('T')[0] } : l));
    setBooks(prev => prev.map(b => b.id === loan.livroId ? { ...b, status: 'disponivel' } : b));
  };

  const toggleBlockCitizen = (cpf: string) => {
    setCitizens(prev => prev.map(c => c.cpf === cpf ? { ...c, bloqueado: !c.bloqueado } : c));
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10">
          <h2 className="text-3xl font-black tracking-tight mb-2 font-display">Bem-vindo, {currentUser?.nome}!</h2>
          <p className="text-slate-400 font-medium max-w-md">Você está logado como <span className="text-blue-400 font-bold">{currentUser?.setor}</span>. O sistema está pronto para uso.</p>
        </div>
      </motion.div>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 font-display">Painel Giroteca</h1>
          <p className="text-slate-500 mt-1 font-medium">Gestão inteligente para a biblioteca municipal de Mesquita.</p>
        </div>
        <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200">
          {['#2563eb', '#7c3aed', '#059669', '#dc2626'].map(color => (
            <button 
              key={color}
              onClick={() => document.documentElement.style.setProperty('--primary-color', color)}
              className="w-6 h-6 rounded-lg transition-transform hover:scale-110 active:scale-95 shadow-sm"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </header>

      <div className="bento-grid">
        {/* Main Stats Bento Items */}
        {[
          { id: 'book', label: 'Acervo Total', value: stats.totalBooks, icon: Book, color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Livros catalogados' },
          { id: 'book', label: 'Disponíveis', value: stats.availableBooks, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Prontos para empréstimo' },
          { id: 'loan', label: 'Em Uso', value: stats.activeLoans, icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50', desc: 'Empréstimos ativos' },
          { id: 'citizen', label: 'Leitores', value: stats.totalCitizens, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', desc: 'Cidadãos cadastrados' },
        ].map((stat, i) => (
          <motion.button 
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label} 
            onClick={() => setActiveTab(stat.id as any)}
            className="glass-card p-6 flex flex-col justify-between group"
          >
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center transition-transform group-hover:rotate-6`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 font-display">{stat.value}</p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-tight">{stat.label}</p>
              <p className="text-[10px] text-slate-400 mt-1">{stat.desc}</p>
            </div>
          </motion.button>
        ))}

        {/* Large Bento Item: Recent Activity */}
        <div className="bento-item-large glass-card p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-3 font-display">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <History className="w-5 h-5 text-white" />
              </div>
              Atividade Recente
            </h2>
            <button onClick={() => setActiveTab('loan')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors">
              Ver Histórico Completo
            </button>
          </div>
          <div className="flex-1 space-y-4">
            {loans.length > 0 ? loans.slice(0, 6).map((loan) => {
              const book = books.find(b => b.id === loan.livroId);
              const citizen = citizens.find(c => c.cpf === loan.cidadaoCpf);
              return (
                <div key={loan.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm group-hover:scale-110 transition-transform">
                      <Book className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{book?.titulo}</p>
                      <p className="text-xs text-slate-500 font-medium">Emprestado para <span className="text-blue-600">{citizen?.nome}</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">{loan.dataEmprestimo}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Data</p>
                  </div>
                </div>
              );
            }) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <DatabaseZap className="w-12 h-12 opacity-20" />
                <p className="text-sm font-medium">Nenhum empréstimo registrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Medium Bento Item: New Books */}
        <div className="glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2 font-display">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              Novidades
            </h2>
          </div>
          <div className="space-y-3">
            {books.slice(0, 3).map((book) => (
              <div key={book.id} className="p-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:border-blue-200 transition-colors">
                <p className="text-xs font-bold text-slate-900 truncate">{book.titulo}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                    book.status === 'disponivel' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {book.status}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">{book.tema}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Small Info Bento Item */}
        <div className="glass-card p-6 bg-slate-900 text-white flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-600/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <Shield className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400">Segurança</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">Banco de Dados SQLite com integridade referencial ativa.</p>
          </div>
          <div className="relative z-10 mt-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Sistema Online</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocumentation = () => (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest">
          Documentação Técnica
        </div>
        <h1 className="text-4xl font-bold text-slate-900">Projeto de Banco de Dados: Giroteca</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Este documento detalha o planejamento, modelagem e implementação do banco de dados para a biblioteca municipal de Mesquita.
        </p>
      </header>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">1</div>
          <h2 className="text-2xl font-bold">Definir Escopo</h2>
        </div>
        <div className="glass-card p-6 space-y-4">
          <p className="text-slate-600">
            O objetivo é criar um sistema centralizado para gerenciar o acervo e a circulação de livros na Giroteca de Mesquita. 
            O sistema deve permitir o cadastro de livros, funcionários e cidadãos, além de registrar e consultar empréstimos em tempo real.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <h3 className="font-bold text-sm mb-2">Entidades Principais</h3>
              <ul className="text-xs space-y-1 text-slate-500">
                <li>• Livros (Acervo)</li>
                <li>• Cidadãos (Leitores)</li>
                <li>• Funcionários (Operadores)</li>
                <li>• Empréstimos (Transações)</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <h3 className="font-bold text-sm mb-2">Consultas Críticas</h3>
              <ul className="text-xs space-y-1 text-slate-500">
                <li>• Livros disponíveis por categoria</li>
                <li>• Histórico de empréstimos por cidadão</li>
                <li>• Livros com devolução atrasada</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <h3 className="font-bold text-sm mb-2">Objetivo</h3>
              <p className="text-xs text-slate-500">Modernizar o controle da biblioteca, garantindo integridade e agilidade no atendimento ao cidadão mesquitense.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">2</div>
          <h2 className="text-2xl font-bold">Escolher SGBD</h2>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">SGBD Escolhido: SQLite</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Para este projeto, optamos pelo **SQLite** devido à sua natureza "serverless" e facilidade de portabilidade. 
                Considerando que a Giroteca é uma biblioteca municipal com volume de dados moderado, o SQLite oferece:
              </p>
              <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-500">
                <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-blue-500" /> Baixa complexidade de manutenção</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-blue-500" /> Desempenho excelente para leituras</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-blue-500" /> Facilidade de backup (arquivo único)</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-blue-500" /> Custo zero de infraestrutura inicial</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">3</div>
          <h2 className="text-2xl font-bold">Modelo Entidade Relacionamento (MER)</h2>
        </div>
        <div className="glass-card p-6">
          <div className="aspect-video bg-slate-50 rounded-lg border border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 p-8 flex flex-wrap gap-8 justify-center items-center">
              {/* Simplified ER Diagram Visualization */}
              <div className="p-4 bg-white border-2 border-blue-500 rounded shadow-sm text-center min-w-[120px]">
                <p className="font-bold text-xs">LIVROS</p>
                <div className="h-px bg-slate-200 my-2"></div>
                <p className="text-[10px] text-slate-400">PK: id</p>
              </div>
              <div className="w-12 h-px bg-slate-300 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-slate-400">1:N</div>
              </div>
              <div className="p-4 bg-white border-2 border-amber-500 rounded shadow-sm text-center min-w-[120px]">
                <p className="font-bold text-xs">EMPRÉSTIMOS</p>
                <div className="h-px bg-slate-200 my-2"></div>
                <p className="text-[10px] text-slate-400">PK: id<br/>FK: livro_id<br/>FK: cidadao_id</p>
              </div>
              <div className="w-12 h-px bg-slate-300 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-slate-400">N:1</div>
              </div>
              <div className="p-4 bg-white border-2 border-emerald-500 rounded shadow-sm text-center min-w-[120px]">
                <p className="font-bold text-xs">CIDADÃOS</p>
                <div className="h-px bg-slate-200 my-2"></div>
                <p className="text-[10px] text-slate-400">PK: id</p>
              </div>
            </div>
            <p className="absolute bottom-4 text-xs text-slate-400 italic">Esboço do Modelo Lógico (Representação Visual)</p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">4 & 5</div>
          <h2 className="text-2xl font-bold">Implementação e Conexão (DDL)</h2>
        </div>
        <div className="glass-card p-6 space-y-4">
          <p className="text-sm text-slate-600">Comandos para criação das tabelas e estabelecimento das chaves estrangeiras:</p>
          <pre className="sql-block">
{`-- Tabela de Livros
CREATE TABLE LIVROS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(150) NOT NULL,
    data_cadastro DATE,
    volume VARCHAR(20),
    paginas INTEGER,
    editora VARCHAR(100),
    tema VARCHAR(100),
    status VARCHAR(20) DEFAULT 'disponivel'
);

-- Tabela de Cidadãos
CREATE TABLE CIDADAOS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    email VARCHAR(100),
    telefone VARCHAR(20),
    endereco TEXT,
    data_nascimento DATE,
    responsavel VARCHAR(150),
    cpf_responsavel VARCHAR(14),
    telefone_responsavel VARCHAR(20),
    bloqueado BOOLEAN DEFAULT FALSE
);

-- Tabela de Funcionários
CREATE TABLE FUNCIONARIOS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(150) NOT NULL,
    setor VARCHAR(100),
    cpf VARCHAR(14) UNIQUE NOT NULL,
    telefone VARCHAR(20)
);

-- Tabela de Empréstimos (Conexão via FK)
CREATE TABLE EMPRESTIMOS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    livro_id INTEGER NOT NULL,
    cidadao_cpf VARCHAR(14) NOT NULL,
    funcionario_nome VARCHAR(150) NOT NULL,
    data_emprestimo DATE DEFAULT CURRENT_DATE,
    data_devolucao_prevista DATE NOT NULL,
    data_devolucao_real DATE,
    FOREIGN KEY (livro_id) REFERENCES LIVROS(id),
    FOREIGN KEY (cidadao_cpf) REFERENCES CIDADAOS(cpf)
);`}
          </pre>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">6</div>
          <h2 className="text-2xl font-bold">Inserir Dados (DML)</h2>
        </div>
        <div className="glass-card p-6 space-y-4">
          <pre className="sql-block">
{`INSERT INTO LIVROS (titulo, autor, tema, editora) VALUES 
('Dom Casmurro', 'Machado de Assis', 'Literatura Brasileira', 'Principis'),
('Sapiens', 'Yuval Noah Harari', 'História', 'L&PM');

INSERT INTO CIDADAOS (nome, cpf, email, data_nascimento) VALUES 
('João Silva', '123.456.789-00', 'joao@email.com', '1990-05-15');

INSERT INTO FUNCIONARIOS (nome, setor, cpf, telefone) VALUES 
('Ana Souza', 'Biblioteca', '111.222.333-44', '(21) 99999-8888');

INSERT INTO EMPRESTIMOS (livro_id, cidadao_cpf, funcionario_nome, data_devolucao_prevista) 
VALUES (1, '123.456.789-00', 'Ana Souza', '2024-04-15');`}
          </pre>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">7</div>
          <h2 className="text-2xl font-bold">Testar Consultas (CRUD)</h2>
        </div>
        <div className="glass-card p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Consultar Livros Disponíveis</h3>
            <pre className="sql-block">
{`SELECT titulo, autor FROM LIVROS WHERE status = 'disponivel';`}
            </pre>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Relatório de Empréstimos Ativos</h3>
            <pre className="sql-block">
{`SELECT L.titulo, C.nome AS cidadao, E.data_emprestimo 
FROM EMPRESTIMOS E
JOIN LIVROS L ON E.livro_id = L.id
JOIN CIDADAOS C ON E.cidadao_id = C.id
WHERE E.data_devolucao_real IS NULL;`}
            </pre>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-600" />
          Segurança e Manutenção
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" /> Medidas de Segurança
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Implementação de níveis de acesso (RBAC). Apenas funcionários com cargo de 'Bibliotecário' podem realizar exclusões de registros de acervo. Uso de Prepared Statements para evitar SQL Injection.
            </p>
          </div>
          <div className="glass-card p-6">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-500" /> Backup e Atualização
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Rotina de backup diário automatizada para o Google Drive municipal. Atualizações de esquema realizadas via scripts de migração (Flyway/Liquibase) para garantir consistência entre ambientes.
            </p>
          </div>
        </div>
      </section>
    </div>
  );

  const renderBook = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Livros</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por título ou autor..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { setEditingBook(null); setIsBookModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" /> Novo Livro
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredBooks.map((book) => (
          <motion.div 
            layout
            key={book.id} 
            className="glass-card p-5 hover:shadow-md transition-shadow group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                book.status === 'disponivel' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }`}>
                {book.status}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setEditingBook(book); setIsBookModalOpen(true); }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteBook(book.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="font-bold text-slate-900 line-clamp-1">{book.titulo}</h3>
            <p className="text-sm text-slate-500 mb-2">{book.autor}</p>
            <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-500 mb-4">
              <p><span className="font-medium text-slate-400">Editora:</span> {book.editora}</p>
              <p><span className="font-medium text-slate-400">Volume:</span> {book.volume}</p>
              <p><span className="font-medium text-slate-400">Páginas:</span> {book.paginas}</p>
              <p><span className="font-medium text-slate-400">Tema:</span> {book.tema}</p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-mono">Cadastrado: {book.dataCadastro}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Book Modal */}
      <AnimatePresence>
        {isBookModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold">{editingBook ? 'Editar Livro' : 'Novo Livro'}</h3>
                <button onClick={() => setIsBookModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSaveBook} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-lg">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título</label>
                    <input name="titulo" defaultValue={editingBook?.titulo} required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Autor</label>
                    <input name="autor" defaultValue={editingBook?.autor} required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Cadastro</label>
                    <input name="dataCadastro" type="date" defaultValue={editingBook?.dataCadastro || new Date().toISOString().split('T')[0]} required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Volume</label>
                    <input name="volume" defaultValue={editingBook?.volume} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Páginas</label>
                    <input name="paginas" type="number" defaultValue={editingBook?.paginas} required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Editora</label>
                    <input name="editora" defaultValue={editingBook?.editora} required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tema</label>
                    <input name="tema" defaultValue={editingBook?.tema} required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsBookModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50">Cancelar</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderCitizen = () => {
    const age = birthDate ? calculateAge(birthDate) : 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Cidadão</h2>
          <button 
            onClick={() => { setEditingCitizen(null); setBirthDate(''); setIsCitizenModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Novo Cadastro
          </button>
        </div>
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-bottom border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cidadão</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">CPF</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contato</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {citizens.map((citizen) => (
                <tr key={citizen.id} className={`hover:bg-slate-50/50 transition-colors ${citizen.bloqueado ? 'bg-red-50/30' : ''}`}>
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium">#{citizen.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center text-xs font-bold text-blue-600">
                        {citizen.nome.charAt(0)}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-900 block">{citizen.nome}</span>
                        <span className="text-[10px] text-slate-400">{calculateAge(citizen.dataNascimento)} anos</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono">{citizen.cpf}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-900">{citizen.email}</p>
                    <p className="text-xs text-slate-500">{citizen.telefone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${citizen.bloqueado ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {citizen.bloqueado ? 'Bloqueado' : 'Ativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setEditingCitizen(citizen); setBirthDate(citizen.dataNascimento); setIsCitizenModalOpen(true); }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDeleteCitizen(citizen.id)}
                        className="text-xs font-bold text-red-600 hover:text-red-800"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Citizen Modal */}
        <AnimatePresence>
          {isCitizenModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold">{editingCitizen ? 'Editar Cidadão' : 'Novo Cidadão'}</h3>
                  <button onClick={() => setIsCitizenModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSaveCitizen} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-lg">
                      {error}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                      <input name="nome" defaultValue={editingCitizen?.nome} required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF {!birthDate || calculateAge(birthDate) >= 18 ? '' : '(Opcional para menores)'}</label>
                      <input name="cpf" defaultValue={editingCitizen?.cpf} required={!birthDate || calculateAge(birthDate) >= 18} placeholder="000.000.000-00" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Nascimento</label>
                      <input 
                        name="dataNascimento" 
                        type="date" 
                        value={birthDate} 
                        onChange={(e) => setBirthDate(e.target.value)}
                        required 
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                      <input name="email" type="email" defaultValue={editingCitizen?.email} required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone</label>
                      <input name="telefone" defaultValue={editingCitizen?.telefone} required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Endereço</label>
                      <input name="endereco" defaultValue={editingCitizen?.endereco} required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>

                    {birthDate && calculateAge(birthDate) < 18 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="col-span-2 grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100"
                      >
                        <div className="col-span-2">
                          <p className="text-xs font-bold text-blue-600 uppercase mb-2">Informações do Responsável (Menor de Idade)</p>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Responsável</label>
                          <input name="responsavel" defaultValue={editingCitizen?.responsavel} required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF do Responsável</label>
                          <input name="cpfResponsavel" defaultValue={editingCitizen?.cpfResponsavel} required placeholder="000.000.000-00" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone do Responsável</label>
                          <input name="telefoneResponsavel" defaultValue={editingCitizen?.telefoneResponsavel} required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                        </div>
                      </motion.div>
                    )}
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsCitizenModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50">Cancelar</button>
                    <button type="submit" className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800">Salvar</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderLoan = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Empréstimo</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por CPF do cidadão..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full sm:w-64"
              value={loanSearchCpf}
              onChange={(e) => setLoanSearchCpf(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { setSelectedCitizenName(''); setIsLoanModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
          >
            <ClipboardList className="w-4 h-4" /> Novo Empréstimo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredLoans.map((loan) => {
          const book = books.find(b => b.id === loan.livroId);
          const citizen = citizens.find(c => c.cpf === loan.cidadaoCpf);
          const overdue = isOverdue(loan);
          
          return (
            <div key={loan.id} className={`glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 ${overdue ? 'border-red-200 bg-red-50/10' : ''}`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${overdue ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Book className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">#{loan.id}</span>
                    <h3 className="font-bold text-slate-900">{book?.titulo}</h3>
                    {overdue && (
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-600 text-[10px] font-bold uppercase">Atrasado</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">Emprestado para: <span className="font-medium text-slate-700">{citizen?.nome}</span> <span className="text-xs text-slate-400">({citizen?.cpf})</span></p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Atendido por: <span className="font-bold text-slate-600">{loan.funcionarioNome}</span></p>
                </div>
              </div>
              <div className="flex flex-wrap gap-8">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Empréstimo</p>
                  <p className="text-sm font-medium">{loan.dataEmprestimo}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Devolução Prevista</p>
                  <p className={`text-sm font-medium ${overdue ? 'text-red-600' : 'text-amber-600'}`}>{loan.dataDevolucaoPrevista}</p>
                </div>
                {loan.dataDevolucaoReal && (
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Devolução Real</p>
                    <p className="text-sm font-medium text-emerald-600">{loan.dataDevolucaoReal}</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {!loan.dataDevolucaoReal && (
                    <button 
                      onClick={() => handleReturnBook(loan.id)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      Devolver
                    </button>
                  )}
                  {overdue && citizen && (
                    <button 
                      onClick={() => toggleBlockCitizen(citizen.cpf)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors border ${
                        citizen.bloqueado 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      {citizen.bloqueado ? 'Desbloquear' : 'Bloquear Cidadão'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Loan Modal */}
      <AnimatePresence>
        {isLoanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold">Novo Empréstimo</h3>
                <button onClick={() => setIsLoanModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSaveLoan} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-lg">
                    {error}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título do Livro</label>
                    <select name="livroTitulo" required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                      <option value="">Selecione um livro...</option>
                      {books.filter(b => b.status === 'disponivel').map(b => (
                        <option key={b.id} value={b.titulo}>{b.titulo}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF do Cidadão</label>
                      <input 
                        name="cidadaoCpf" 
                        list="citizens-list" 
                        required 
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                        onChange={(e) => {
                          const cpf = e.target.value;
                          const citizen = citizens.find(c => c.cpf === cpf);
                          setSelectedCitizenName(citizen ? citizen.nome : '');
                        }}
                      />
                      <datalist id="citizens-list">
                        {citizens.filter(c => !c.bloqueado).map(c => (
                          <option key={c.cpf} value={c.cpf}>{c.nome}</option>
                        ))}
                      </datalist>
                      {selectedCitizenName && (
                        <p className="text-[10px] text-blue-600 mt-1 font-bold">Cidadão: {selectedCitizenName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Funcionário Responsável</label>
                      <select name="funcionarioNome" required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                        <option value="">Selecione...</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.nome}>{emp.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data de Empréstimo</label>
                      <input name="dataEmprestimo" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data de Devolução</label>
                      <input name="dataDevolucaoPrevista" type="date" required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsLoanModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50">Cancelar</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">Registrar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderEmployee = () => {
    if (currentUser?.setor !== 'Administrador') {
      return (
        <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-6">
            <Shield className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Acesso Restrito</h2>
          <p className="text-slate-500 max-w-md">Desculpe, apenas usuários com perfil de <strong>Administrador</strong> podem acessar e gerenciar o quadro de funcionários.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Funcionário</h2>
          <button 
            onClick={() => { setEditingEmployee(null); setIsEmployeeModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" /> Novo Funcionário
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {employees.map((emp) => (
            <div key={emp.id} className="glass-card p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{emp.nome}</h3>
                  <p className="text-sm text-slate-500">{emp.setor}</p>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">ID: #{emp.id} | CPF: {emp.cpf}</p>
                  <p className="text-[10px] text-slate-400">TEL: {emp.telefone}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => { setEditingEmployee(emp); setIsEmployeeModalOpen(true); }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <History className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteEmployee(emp.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Employee Modal */}
        <AnimatePresence>
          {isEmployeeModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold">{editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}</h3>
                  <button onClick={() => setIsEmployeeModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSaveEmployee} className="p-6 space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-lg">
                      {error}
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                      <input name="nome" defaultValue={editingEmployee?.nome} required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF</label>
                      <input name="cpf" defaultValue={editingEmployee?.cpf} required placeholder="000.000.000-00" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Setor</label>
                      <input name="setor" defaultValue={editingEmployee?.setor} required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone</label>
                      <input name="telefone" defaultValue={editingEmployee?.telefone} required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsEmployeeModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50">Cancelar</button>
                    <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">Salvar</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderLogin = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
      >
        <div className="p-8 bg-slate-900 text-white text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Book className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter mb-2">GIROTECA</h1>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Sistema de Gestão</p>
        </div>

        <div className="p-8">
          {loginStep === 'cpf' ? (
            <form onSubmit={handleLoginCpf} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-slate-900">Acesso Restrito</h2>
                <p className="text-sm text-slate-500 mt-1">Identifique-se com seu CPF para continuar</p>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-lg flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">CPF do Funcionário</label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    name="cpf" 
                    required 
                    placeholder="000.000.000-00"
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-lg"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-[0.98]"
              >
                Solicitar Código de Acesso
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginOtp} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-slate-900">Verificação de Segurança</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Enviamos um código para o WhatsApp de <br/>
                  <span className="font-bold text-slate-900">{currentUser?.nome}</span>
                </p>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-lg flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-6">
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest text-center mb-2">Simulação de WhatsApp</p>
                <p className="text-sm text-blue-800 text-center font-mono font-bold tracking-[0.5em]">{sentOtp}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Código de 6 dígitos</label>
                <input 
                  type="text"
                  maxLength={6}
                  required 
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="000000"
                  className="w-full px-4 py-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-center text-3xl font-black tracking-[0.5em]"
                />
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  type="submit"
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                >
                  Entrar no Sistema
                </button>
                <button 
                  type="button"
                  onClick={() => { setLoginStep('cpf'); setError(null); }}
                  className="w-full py-3 text-slate-500 text-sm font-bold hover:text-slate-700 transition-colors"
                >
                  Voltar e alterar CPF
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );

  if (!isAuthenticated) {
    return renderLogin();
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar (Header) */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-6 flex items-center justify-between z-30 sticky top-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20">
            <Book className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-[48px] font-black text-slate-900 tracking-tighter leading-none font-display">GIROTECA</h1>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold text-sm"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden sm:inline">Sair do Sistema</span>
        </button>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-auto lg:h-[calc(100vh-97px)] z-20">
          <div className="p-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Menu Principal</p>
            <nav className="space-y-1.5">
              {[
                { id: 'loan', label: 'Empréstimo', icon: ClipboardList },
                { id: 'citizen', label: 'Cidadão', icon: Users },
                { id: 'book', label: 'Livro', icon: Book },
                { id: 'employee', label: 'Funcionário', icon: UserCheck, adminOnly: true },
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'documentation', label: 'Projeto BD', icon: FileText },
              ].filter(item => !item.adminOnly || currentUser?.setor === 'Administrador').map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group ${
                    activeTab === item.id 
                      ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === item.id ? 'text-blue-400' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-8 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-slate-900/20">
                {currentUser?.nome.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-900 truncate">{currentUser?.nome}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{currentUser?.setor}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full py-3 rounded-xl text-xs font-black text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-red-100"
            >
              <XCircle className="w-4 h-4" /> Sair do Sistema
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-slate-50/30 p-6 lg:p-12 overflow-y-auto h-[calc(100vh-97px-64px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'documentation' && renderDocumentation()}
              {activeTab === 'book' && renderBook()}
              {activeTab === 'citizen' && renderCitizen()}
              {activeTab === 'employee' && renderEmployee()}
              {activeTab === 'loan' && renderLoan()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Bottom Bar (Footer) */}
      <footer className="bg-slate-900 text-slate-400 px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 z-30">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Projeto BD</span>
          <div className="w-1 h-1 rounded-full bg-slate-700"></div>
          <span className="text-xs">Desenvolvimento - Setor de Otimização de Serviços - 2026</span>
        </div>
        <div className="text-[10px] font-mono text-slate-600">
          v2.1.0-stable
        </div>
      </footer>
    </div>
  );
}
