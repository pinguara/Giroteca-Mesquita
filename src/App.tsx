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
  AlertCircle,
  Clock,
  LayoutDashboard,
  FileText,
  ChevronRight,
  DatabaseZap,
  LogOut,
  Lock,
  Trophy,
  Compass,
  Award,
  Star,
  QrCode,
  BarChart3,
  Bell,
  CalendarDays,
  MessageSquare,
  Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { 
  BookType, 
  EmployeeType, 
  CitizenType, 
  LoanType, 
  ReservationType,
  BadgeType,
  BADGES,
  INITIAL_BOOKS, 
  INITIAL_EMPLOYEES, 
  INITIAL_CITIZENS, 
  INITIAL_LOANS 
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'documentation' | 'book' | 'citizen' | 'loan' | 'employee' | 'reports'>('dashboard');
  const [books, setBooks] = useState<BookType[]>(INITIAL_BOOKS);
  const [citizens, setCitizens] = useState<CitizenType[]>(INITIAL_CITIZENS);
  const [employees, setEmployees] = useState<EmployeeType[]>(INITIAL_EMPLOYEES);
  const [loans, setLoans] = useState<LoanType[]>(INITIAL_LOANS);
  const [reservations, setReservations] = useState<ReservationType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loanSearchCpf, setLoanSearchCpf] = useState('');
  const [loanStatusFilter, setLoanStatusFilter] = useState<'todos' | 'atrasado' | 'devolvido' | 'ativo'>('todos');
  const [loanEmployeeFilter, setLoanEmployeeFilter] = useState('');
  const [loanDueDateFilter, setLoanDueDateFilter] = useState('');

  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookType | null>(null);
  const [isCitizenModalOpen, setIsCitizenModalOpen] = useState(false);
  const [editingCitizen, setEditingCitizen] = useState<CitizenType | null>(null);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeType | null>(null);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState<{ value: string; title: string } | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeLoanForReview, setActiveLoanForReview] = useState<LoanType | null>(null);
  const [historyCitizen, setHistoryCitizen] = useState<CitizenType | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [selectedCitizenName, setSelectedCitizenName] = useState('');

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<EmployeeType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [prefilledLoanData, setPrefilledLoanData] = useState<{ bookId: number; citizenCpf: string } | null>(null);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const cpf = formData.get('cpf') as string;
    const password = formData.get('password') as string;
    
    const employee = employees.find(emp => emp.cpf === cpf);
    
    if (employee) {
      if (employee.senha === password) {
        setCurrentUser(employee);
        setIsAuthenticated(true);
      } else {
        setError('Senha incorreta.');
      }
    } else {
      setError('CPF não encontrado no quadro de funcionários.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setError(null);
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

  const getCitizenBadges = (cpf: string) => {
    const citizenLoans = loans.filter(l => l.cidadaoCpf === cpf);
    const citizen = citizens.find(c => c.cpf === cpf);
    const earnedBadges: BadgeType[] = [];

    if (!citizen) return earnedBadges;

    // Reader of the Month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const recentLoans = citizenLoans.filter(l => new Date(l.dataEmprestimo) > lastMonth);
    if (recentLoans.length >= 5) earnedBadges.push(BADGES.find(b => b.id === 'reader_month')!);

    // Theme Explorer
    const themes = new Set();
    citizenLoans.forEach(l => {
      const book = books.find(b => b.id === l.livroId);
      if (book) themes.add(book.tema);
    });
    if (themes.size >= 3) earnedBadges.push(BADGES.find(b => b.id === 'theme_explorer')!);

    // Punctual
    const returnedLoans = citizenLoans.filter(l => l.dataDevolucaoReal);
    const allOnTime = returnedLoans.length > 0 && returnedLoans.every(l => {
      const due = new Date(l.dataDevolucaoPrevista);
      const real = new Date(l.dataDevolucaoReal!);
      return real <= due;
    });
    if (allOnTime) earnedBadges.push(BADGES.find(b => b.id === 'punctual')!);

    // Veteran (Simulated based on ID for demo)
    if (citizen.id <= 2) earnedBadges.push(BADGES.find(b => b.id === 'veteran')!);

    return earnedBadges;
  };

  const [activeBookForReservation, setActiveBookForReservation] = useState<number | null>(null);

  const handleReserveBook = (bookId: number) => {
    setActiveBookForReservation(bookId);
    setIsReservationModalOpen(true);
  };

  const confirmReservation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const cpf = formData.get('cidadaoCpf') as string;
    
    if (!activeBookForReservation) return;

    const newReservation: ReservationType = {
      id: reservations.length + 1,
      livroId: activeBookForReservation,
      cidadaoCpf: cpf,
      dataReserva: new Date().toISOString().split('T')[0],
      status: 'pendente'
    };
    setReservations([...reservations, newReservation]);
    setIsReservationModalOpen(false);
    setActiveBookForReservation(null);
  };

  const handleSaveReview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const rating = Number(formData.get('rating'));
    const comment = formData.get('comment') as string;

    if (!activeLoanForReview) return;

    setLoans(loans.map(l => l.id === activeLoanForReview.id ? { ...l, rating, comment } : l));
    setIsReviewModalOpen(false);
    setActiveLoanForReview(null);
  };

  const filteredBooks = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return books.filter(b => 
      b.titulo.toLowerCase().includes(term) || 
      b.autor.toLowerCase().includes(term) ||
      b.editora.toLowerCase().includes(term) ||
      b.tema.toLowerCase().includes(term)
    );
  }, [books, searchTerm]);

  const filteredLoans = useMemo(() => {
    let result = [...loans].sort((a, b) => {
      const aOverdue = isOverdue(a);
      const bOverdue = isOverdue(b);
      
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      return new Date(a.dataDevolucaoPrevista).getTime() - new Date(b.dataDevolucaoPrevista).getTime();
    });

    if (loanSearchCpf) {
      result = result.filter(l => l.cidadaoCpf.includes(loanSearchCpf));
    }

    if (loanStatusFilter !== 'todos') {
      result = result.filter(l => {
        const overdue = isOverdue(l);
        if (loanStatusFilter === 'atrasado') return overdue && !l.dataDevolucaoReal;
        if (loanStatusFilter === 'devolvido') return !!l.dataDevolucaoReal;
        if (loanStatusFilter === 'ativo') return !l.dataDevolucaoReal && !overdue;
        return true;
      });
    }

    if (loanEmployeeFilter) {
      result = result.filter(l => l.funcionarioNome === loanEmployeeFilter);
    }

    if (loanDueDateFilter) {
      result = result.filter(l => l.dataDevolucaoPrevista === loanDueDateFilter);
    }

    return result;
  }, [loans, loanSearchCpf, loanStatusFilter, loanEmployeeFilter, loanDueDateFilter]);

  const stats = {
    totalBooks: books.length,
    availableBooks: books.filter(b => b.status === 'disponivel').length,
    activeLoans: loans.filter(l => !l.dataDevolucaoReal).length,
    totalCitizens: citizens.length,
    overdueLoans: loans.filter(l => isOverdue(l)).length,
    pendingReservations: reservations.filter(r => r.status === 'pendente').length
  };

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
    const id = editingCitizen ? editingCitizen.id : Math.max(0, ...citizens.map(c => c.id)) + 1;
    const birthDateStr = formData.get('dataNascimento') as string;
    const age = calculateAge(birthDateStr);
    let cpf = formData.get('cpf') as string;

    // Se for menor de idade e o CPF estiver vazio, gera um identificador interno
    if (age < 18 && !cpf) {
      cpf = `MENOR-${id}`;
    }

    if (!cpf && age >= 18) {
      setError('O CPF é obrigatório para maiores de 18 anos.');
      return;
    }

    const citizenData: CitizenType = {
      id,
      cpf,
      nome: formData.get('nome') as string,
      email: formData.get('email') as string,
      telefone: formData.get('telefone') as string,
      endereco: formData.get('endereco') as string,
      dataNascimento: birthDateStr,
      responsavel: age < 18 ? (formData.get('responsavel') as string || undefined) : undefined,
      cpfResponsavel: age < 18 ? (formData.get('cpfResponsavel') as string || undefined) : undefined,
      telefoneResponsavel: age < 18 ? (formData.get('telefoneResponsavel') as string || undefined) : undefined,
      bloqueado: editingCitizen ? editingCitizen.bloqueado : false,
    };

    if (editingCitizen) {
      // Verifica se o novo CPF (se alterado) já existe em outro registro
      if (citizenData.cpf !== editingCitizen.cpf && citizens.some(c => c.cpf === citizenData.cpf)) {
        setError('Este CPF já está cadastrado em outro registro.');
        return;
      }
      setCitizens(prev => prev.map(c => c.id === editingCitizen.id ? citizenData : c));
    } else {
      if (citizens.some(c => c.cpf === citizenData.cpf)) {
        setError('Este CPF já está cadastrado.');
        return;
      }
      setCitizens(prev => [...prev, citizenData]);
    }
    setIsCitizenModalOpen(false);
    setEditingCitizen(null);
    setBirthDate('');
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
      senha: (formData.get('senha') as string) || '123456',
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

    // Check for reservation priority
    const reservation = reservations.find(r => r.livroId === book.id && r.status === 'pendente');
    if (reservation && reservation.cidadaoCpf !== citizen.cpf) {
      setError(`Este livro está reservado para outro cidadão (${citizens.find(c => c.cpf === reservation.cidadaoCpf)?.nome}).`);
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
    
    // Update reservation status if exists
    setReservations(prev => prev.map(r => 
      (r.livroId === book.id && r.cidadaoCpf === citizen.cpf && r.status === 'pendente') 
        ? { ...r, status: 'concluido' } 
        : r
    ));

    setIsLoanModalOpen(false);
    setPrefilledLoanData(null);
    setError(null);
  };

  const handleCancelReservation = (id: number) => {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelado' } : r));
  };

  const handleConvertReservationToLoan = (reservation: ReservationType) => {
    const book = books.find(b => b.id === reservation.livroId);
    const citizen = citizens.find(c => c.cpf === reservation.cidadaoCpf);
    
    if (book && citizen) {
      setPrefilledLoanData({ bookId: book.id, citizenCpf: citizen.cpf });
      setSelectedCitizenName(citizen.nome);
      setIsLoanModalOpen(true);
    }
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

  const renderReports = () => {
    const loansByTheme = books.reduce((acc: any, book) => {
      const loanCount = loans.filter(l => l.livroId === book.id).length;
      acc[book.tema] = (acc[book.tema] || 0) + loanCount;
      return acc;
    }, {});

    const themeData = Object.keys(loansByTheme).map(theme => ({
      name: theme,
      value: loansByTheme[theme]
    }));

    const loansByMonth = loans.reduce((acc: any, loan) => {
      const month = loan.dataEmprestimo.substring(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const monthData = Object.keys(loansByMonth).sort().map(month => ({
      name: month,
      loans: loansByMonth[month]
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-slate-900 font-display">Relatórios de Inteligência</h2>
            <p className="text-slate-500 font-medium">Análise de dados e métricas da Giroteca.</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-2xl">
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Loans by Theme */}
          <div className="glass-card p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-blue-600" /> Temas Mais Procurados
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={themeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {themeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Loans over Time */}
          <div className="glass-card p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-emerald-600" /> Evolução de Empréstimos
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="loans" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Books */}
          <div className="glass-card p-8 lg:col-span-2">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Livros Mais Lidos
            </h3>
            <div className="space-y-4">
              {books
                .map(book => ({ ...book, count: loans.filter(l => l.livroId === book.id).length }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map((book, i) => (
                  <div key={book.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-400 text-xs">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{book.titulo}</p>
                        <p className="text-xs text-slate-500">{book.autor}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-blue-600">{book.count}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Empréstimos</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
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

        {/* Notifications Bento Item */}
        <div className="glass-card p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-3 font-display">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              Alertas
            </h2>
          </div>
          <div className="space-y-4">
            {loans.filter(l => isOverdue(l) && !l.dataDevolucaoReal).length > 0 ? (
              loans.filter(l => isOverdue(l) && !l.dataDevolucaoReal).slice(0, 3).map(loan => {
                const citizen = citizens.find(c => c.cpf === loan.cidadaoCpf);
                return (
                  <div key={loan.id} className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-red-900">Atraso Detectado</p>
                      <p className="text-[10px] text-red-700 font-medium">{citizen?.nome} está com livro atrasado desde {loan.dataDevolucaoPrevista}.</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-emerald-50 border border-emerald-100 rounded-2xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-emerald-900">Tudo em dia!</p>
                <p className="text-[10px] text-emerald-700">Não há pendências críticas no momento.</p>
              </div>
            )}

            {reservations.filter(r => r.status === 'pendente').length > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                <Bookmark className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-blue-900">Novas Reservas</p>
                  <p className="text-[10px] text-blue-700 font-medium">Existem {reservations.filter(r => r.status === 'pendente').length} reservas aguardando disponibilidade.</p>
                </div>
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
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setQrData(`book:${book.id}`); setIsQrModalOpen(true); }}
                  className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                  title="Gerar QR Code"
                >
                  <QrCode className="w-4 h-4" />
                </button>
                {book.status === 'emprestado' && (
                  <button 
                    onClick={() => handleReserveBook(book.id)}
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition-colors"
                  >
                    Reservar
                  </button>
                )}
              </div>
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
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px] text-slate-400">{calculateAge(citizen.dataNascimento)} anos</span>
                          <div className="flex items-center gap-0.5 ml-2">
                            {getCitizenBadges(citizen.cpf).map(badge => (
                              <div key={badge.id} title={badge.nome} className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center">
                                <badge.icon className="w-2.5 h-2.5 text-slate-600" />
                              </div>
                            ))}
                          </div>
                        </div>
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
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => { setQrData(`citizen:${citizen.cpf}`); setIsQrModalOpen(true); }}
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        title="Gerar QR Code do Cidadão"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => { setHistoryCitizen(citizen); setIsHistoryModalOpen(true); }}
                        className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1"
                        title="Ver Histórico de Empréstimos"
                      >
                        <History className="w-3 h-3" /> Histórico
                      </button>
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

        {/* History Modal */}
        <AnimatePresence>
          {isHistoryModalOpen && historyCitizen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Histórico de Empréstimos</h3>
                    <p className="text-sm text-slate-500">{historyCitizen.nome} • {historyCitizen.cpf}</p>
                  </div>
                  <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                  {loans.filter(l => l.cidadaoCpf === historyCitizen.cpf).length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ClipboardList className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500">Nenhum empréstimo encontrado para este cidadão.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {loans
                        .filter(l => l.cidadaoCpf === historyCitizen.cpf)
                        .sort((a, b) => new Date(b.dataEmprestimo).getTime() - new Date(a.dataEmprestimo).getTime())
                        .map((loan) => {
                          const book = books.find(b => b.id === loan.livroId);
                          const overdue = isOverdue(loan);
                          return (
                            <div key={loan.id} className={`p-4 rounded-xl border-2 ${
                              loan.dataDevolucaoReal 
                                ? 'bg-emerald-50/30 border-emerald-100' 
                                : overdue 
                                  ? 'bg-red-50 border-red-200 shadow-sm' 
                                  : 'bg-blue-50/30 border-blue-100'
                            }`}>
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-bold text-slate-900">{book?.titulo || 'Livro não encontrado'}</h4>
                                  <p className="text-xs text-slate-500">Atendido por: {loan.funcionarioNome}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 ${
                                  loan.dataDevolucaoReal ? 'bg-emerald-100 text-emerald-600' : 
                                  overdue ? 'bg-red-600 text-white animate-pulse' : 'bg-blue-100 text-blue-600'
                                }`}>
                                  {loan.dataDevolucaoReal ? (
                                    <CheckCircle2 className="w-3 h-3" />
                                  ) : overdue ? (
                                    <AlertCircle className="w-3 h-3" />
                                  ) : (
                                    <Clock className="w-3 h-3" />
                                  )}
                                  {loan.dataDevolucaoReal ? 'Devolvido' : overdue ? 'Atrasado' : 'Ativo'}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <p className="text-[10px] text-slate-400 uppercase font-bold">Empréstimo</p>
                                  <p className="text-xs font-medium text-slate-700">{loan.dataEmprestimo}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-slate-400 uppercase font-bold">Previsto</p>
                                  <p className={`text-xs font-bold ${overdue && !loan.dataDevolucaoReal ? 'text-red-600' : 'text-slate-700'}`}>{loan.dataDevolucaoPrevista}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-slate-400 uppercase font-bold">Devolução</p>
                                  <p className="text-xs font-bold text-emerald-600">{loan.dataDevolucaoReal || '-'}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                  <button 
                    onClick={() => setIsHistoryModalOpen(false)}
                    className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

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
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        CPF {birthDate && calculateAge(birthDate) < 18 ? <span className="text-blue-500 font-normal lowercase">(opcional para menores)</span> : <span className="text-red-500">*</span>}
                      </label>
                      <input 
                        name="cpf" 
                        defaultValue={editingCitizen?.cpf?.startsWith('MENOR-') ? '' : editingCitizen?.cpf} 
                        required={!birthDate || calculateAge(birthDate) >= 18} 
                        placeholder="000.000.000-00" 
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                      />
                      {birthDate && calculateAge(birthDate) < 18 && (
                        <p className="text-[10px] text-slate-400 mt-1 italic">Se deixado em branco, um ID interno será gerado.</p>
                      )}
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-900">Empréstimo</h2>
          <button 
            onClick={() => { setSelectedCitizenName(''); setIsLoanModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm w-fit"
          >
            <ClipboardList className="w-4 h-4" /> Novo Empréstimo
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por CPF..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full text-sm"
              value={loanSearchCpf}
              onChange={(e) => setLoanSearchCpf(e.target.value)}
            />
          </div>

          <select 
            value={loanStatusFilter}
            onChange={(e) => setLoanStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
          >
            <option value="todos">Todos os Status</option>
            <option value="ativo">Ativos (Em dia)</option>
            <option value="atrasado">Atrasados</option>
            <option value="devolvido">Devolvidos</option>
          </select>

          <select 
            value={loanEmployeeFilter}
            onChange={(e) => setLoanEmployeeFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
          >
            <option value="">Todos os Funcionários</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.nome}>{emp.nome}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={loanDueDateFilter}
              onChange={(e) => setLoanDueDateFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm flex-1"
              title="Filtrar por data de devolução prevista"
            />
            {loanDueDateFilter && (
              <button 
                onClick={() => setLoanDueDateFilter('')}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Limpar data"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-blue-600" /> Reservas Ativas
          </h3>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">
            {reservations.filter(r => r.status === 'pendente').length} Pendentes
          </span>
        </div>
        
        {reservations.filter(r => r.status === 'pendente').length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-400 font-medium">Nenhuma reserva pendente no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reservations.filter(r => r.status === 'pendente').map(res => {
              const book = books.find(b => b.id === res.livroId);
              const citizen = citizens.find(c => c.cpf === res.cidadaoCpf);
              const isBookAvailable = book?.status === 'disponivel';

              return (
                <div key={res.id} className={`glass-card p-4 border-l-4 ${isBookAvailable ? 'border-l-emerald-500' : 'border-l-blue-500'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${isBookAvailable ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                        <Bookmark className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{book?.titulo}</h4>
                        <p className="text-[10px] text-slate-500">{citizen?.nome}</p>
                      </div>
                    </div>
                    {isBookAvailable && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase rounded tracking-wider animate-pulse">Disponível</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <button 
                      onClick={() => handleCancelReservation(res.id)}
                      className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => handleConvertReservationToLoan(res)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        isBookAvailable 
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200' 
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                      disabled={!isBookAvailable}
                    >
                      {isBookAvailable ? 'Efetivar Empréstimo' : 'Aguardando Devolução'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between mt-8 mb-2">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" /> Histórico de Empréstimos
          </h3>
        </div>
        
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
                  {loan.dataDevolucaoReal && !loan.rating && (
                    <button 
                      onClick={() => { setActiveLoanForReview(loan); setIsReviewModalOpen(true); }}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                    >
                      Avaliar
                    </button>
                  )}
                  {loan.rating && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 rounded-lg border border-amber-100">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold text-amber-700">{loan.rating}</span>
                    </div>
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
                    <select 
                      name="livroTitulo" 
                      required 
                      defaultValue={prefilledLoanData ? books.find(b => b.id === prefilledLoanData.bookId)?.titulo : ""}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    >
                      <option value="">Selecione um livro...</option>
                      {books.filter(b => b.status === 'disponivel' || (prefilledLoanData && b.id === prefilledLoanData.bookId)).map(b => {
                        const reservation = reservations.find(r => r.livroId === b.id && r.status === 'pendente');
                        return (
                          <option key={b.id} value={b.titulo}>
                            {b.titulo} {reservation ? `(Reservado para ${citizens.find(c => c.cpf === reservation.cidadaoCpf)?.nome})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF do Cidadão</label>
                      <input 
                        name="cidadaoCpf" 
                        list="citizens-list" 
                        required 
                        defaultValue={prefilledLoanData?.citizenCpf || ""}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                        onChange={(e) => {
                          const cpf = e.target.value;
                          const citizen = citizens.find(c => c.cpf === cpf);
                          setSelectedCitizenName(citizen ? citizen.nome : '');
                        }}
                      />
                      <datalist id="citizens-list">
                        {citizens.filter(c => !c.bloqueado).map(c => (
                          <option key={c.id} value={c.cpf}>
                            {c.nome} {c.cpf.startsWith('MENOR-') ? '(Menor de Idade)' : `(CPF: ${c.cpf})`}
                          </option>
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
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha de Acesso</label>
                      <input name="senha" type="password" defaultValue={editingEmployee?.senha || '123456'} required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
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
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-slate-900">Acesso Restrito</h2>
              <p className="text-sm text-slate-500 mt-1">Identifique-se para continuar</p>
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

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">CPF do Funcionário</label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    name="cpf" 
                    required 
                    placeholder="000.000.000-00"
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    name="password" 
                    type="password"
                    required 
                    placeholder="••••••"
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-[0.98]"
            >
              Entrar no Sistema
            </button>
          </form>
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
                { id: 'reports', label: 'Relatórios', icon: BarChart3 },
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
              {/* QR Code Modal */}
      <AnimatePresence>
        {isQrModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-900 font-display">QR Code de Acesso</h3>
                <button onClick={() => setIsQrModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <XCircle className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <div className="bg-slate-50 p-8 rounded-3xl border-2 border-dashed border-slate-200 mb-8 flex items-center justify-center">
                <QRCodeSVG value={qrData} size={200} level="H" includeMargin={true} />
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-1">Identificador</p>
                  <p className="text-sm font-mono font-bold text-blue-600">{qrData}</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Utilize este código para agilizar o processo de empréstimo e devolução nos totens de autoatendimento.
                </p>
              </div>

              <button 
                onClick={() => setIsQrModalOpen(false)}
                className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
              >
                Concluído
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {isReviewModalOpen && activeLoanForReview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-black text-slate-900 font-display">Avaliar Leitura</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">O que você achou deste livro?</p>
                </div>
                <button onClick={() => setIsReviewModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm">
                  <XCircle className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <form id="review-form" onSubmit={handleSaveReview} className="p-8 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                    <Book className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{books.find(b => b.id === activeLoanForReview.livroId)?.titulo}</p>
                    <p className="text-xs text-slate-500">{books.find(b => b.id === activeLoanForReview.livroId)?.autor}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Sua Nota</label>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => {
                          const form = document.getElementById('review-form') as HTMLFormElement;
                          if (form) {
                            const ratingInput = form.querySelector('input[name="rating"]') as HTMLInputElement;
                            if (ratingInput) ratingInput.value = star.toString();
                            // Force re-render for visual feedback if needed, but here we'll use a local state or just DOM
                            const stars = form.querySelectorAll('.star-btn');
                            stars.forEach((s, i) => {
                              if (i < star) s.classList.add('text-amber-500', 'fill-amber-500');
                              else s.classList.remove('text-amber-500', 'fill-amber-500');
                            });
                          }
                        }}
                        className="star-btn p-2 text-slate-200 hover:scale-110 transition-all"
                      >
                        <Star className="w-8 h-8" />
                      </button>
                    ))}
                  </div>
                  <input type="hidden" name="rating" required />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Comentário (Opcional)</label>
                  <textarea 
                    name="comment"
                    placeholder="Conte-nos o que achou da história..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all min-h-[120px] text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsReviewModalOpen(false)}
                    className="flex-1 py-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Pular
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                  >
                    Enviar Avaliação
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reservation Modal */}
      <AnimatePresence>
        {isReservationModalOpen && activeBookForReservation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-black text-slate-900 font-display">Reservar Livro</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Entre na fila de espera para este título.</p>
                </div>
                <button onClick={() => setIsReservationModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm">
                  <XCircle className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={confirmReservation} className="p-8 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                    <Bookmark className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{books.find(b => b.id === activeBookForReservation)?.titulo}</p>
                    <p className="text-xs text-slate-500">{books.find(b => b.id === activeBookForReservation)?.autor}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Cidadão Solicitante</label>
                  <select name="cidadaoCpf" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm">
                    <option value="">Selecione o cidadão...</option>
                    {citizens.map(c => (
                      <option key={c.id} value={c.cpf}>{c.nome} ({c.cpf})</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsReservationModalOpen(false)}
                    className="flex-1 py-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                  >
                    Confirmar Reserva
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reservation Modal (Implicitly handled by handleReserveBook, but could have a list) */}
      
      {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'documentation' && renderDocumentation()}
              {activeTab === 'book' && renderBook()}
              {activeTab === 'citizen' && renderCitizen()}
              {activeTab === 'employee' && renderEmployee()}
              {activeTab === 'loan' && renderLoan()}
              {activeTab === 'reports' && renderReports()}
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
