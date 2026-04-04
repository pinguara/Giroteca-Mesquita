import { Book, Users, UserCheck, ClipboardList, Database, Shield, History, Info, Trophy, Compass, Clock, Award, LucideIcon } from 'lucide-react';

export interface BookType {
  id: number;
  titulo: string;
  autor: string;
  dataCadastro: string;
  volume: string;
  paginas: number;
  editora: string;
  tema: string;
  status: 'disponivel' | 'emprestado';
}

export interface EmployeeType {
  id: number;
  nome: string;
  setor: string;
  cpf: string;
  telefone: string;
  senha?: string;
}

export interface CitizenType {
  id: number;
  cpf: string; // Primary Key
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  dataNascimento: string;
  responsavel?: string;
  cpfResponsavel?: string;
  telefoneResponsavel?: string;
  bloqueado: boolean;
}

export interface LoanType {
  id: number;
  livroId: number;
  cidadaoCpf: string;
  funcionarioNome: string;
  dataEmprestimo: string;
  dataDevolucaoPrevista: string;
  dataDevolucaoReal?: string;
  rating?: number;
  comment?: string;
}

export interface ReservationType {
  id: number;
  livroId: number;
  cidadaoCpf: string;
  dataReserva: string;
  status: 'pendente' | 'notificado' | 'cancelado' | 'concluido';
}

export interface BadgeType {
  id: string;
  nome: string;
  descricao: string;
  icon: LucideIcon;
}

export const BADGES: BadgeType[] = [
  { id: 'reader_month', nome: 'Leitor do Mês', descricao: 'Realizou mais de 5 empréstimos no mês', icon: Trophy },
  { id: 'theme_explorer', nome: 'Explorador de Temas', descricao: 'Leu livros de 3 temas diferentes', icon: Compass },
  { id: 'punctual', nome: 'Pontual', descricao: 'Devolveu todos os livros no prazo', icon: Clock },
  { id: 'veteran', nome: 'Veterano', descricao: 'Mais de 1 ano cadastrado no sistema', icon: Award },
];

export const INITIAL_BOOKS: BookType[] = [
  { 
    id: 1, 
    titulo: "Dom Casmurro", 
    autor: "Machado de Assis", 
    dataCadastro: "2024-01-10", 
    volume: "1", 
    paginas: 256, 
    editora: "Principis", 
    tema: "Literatura Brasileira", 
    status: 'disponivel' 
  },
  { 
    id: 2, 
    titulo: "O Alquimista", 
    autor: "Paulo Coelho", 
    dataCadastro: "2024-01-15", 
    volume: "1", 
    paginas: 208, 
    editora: "Paralela", 
    tema: "Ficção", 
    status: 'emprestado' 
  },
];

export const INITIAL_EMPLOYEES: EmployeeType[] = [
  { id: 1, nome: "Ana Souza", setor: "Biblioteca", cpf: "111.222.333-44", telefone: "(21) 99999-8888", senha: "123456" },
  { id: 2, nome: "Carlos Lima", setor: "Administração", cpf: "555.666.777-88", telefone: "(21) 98888-7777", senha: "123456" },
  { id: 3, nome: "Ramon Lameira", setor: "Administrador", cpf: "15074693730", telefone: "2198132744", senha: "123456" },
];

export const INITIAL_CITIZENS: CitizenType[] = [
  { 
    id: 1,
    cpf: "123.456.789-00", 
    nome: "João Silva", 
    email: "joao@email.com", 
    telefone: "(21) 98888-7777", 
    endereco: "Rua Arthur Oliveira Vecchi, 120, Mesquita - RJ", 
    dataNascimento: "1990-05-15", 
    bloqueado: false 
  },
  { 
    id: 2,
    cpf: "987.654.321-11", 
    nome: "Maria Oliveira", 
    email: "maria@email.com", 
    telefone: "(21) 97777-6666", 
    endereco: "Rua Feliciano Sodré, 2100, Mesquita - RJ", 
    dataNascimento: "2010-08-20", 
    responsavel: "Roberto Oliveira", 
    cpfResponsavel: "111.222.333-44",
    telefoneResponsavel: "(21) 96666-5555", 
    bloqueado: false 
  },
  { 
    id: 3,
    cpf: "MENOR-3", 
    nome: "Pedro Santos", 
    email: "pedro@email.com", 
    telefone: "(21) 95555-4444", 
    endereco: "Rua das Flores, 50, Mesquita - RJ", 
    dataNascimento: "2015-03-10", 
    responsavel: "Ana Santos", 
    cpfResponsavel: "222.333.444-55",
    telefoneResponsavel: "(21) 94444-3333", 
    bloqueado: false 
  },
];

export const INITIAL_LOANS: LoanType[] = [
  { 
    id: 1, 
    livroId: 2, 
    cidadaoCpf: "123.456.789-00", 
    funcionarioNome: "Ana Souza", 
    dataEmprestimo: "2024-03-20", 
    dataDevolucaoPrevista: "2024-04-01" 
  },
];
