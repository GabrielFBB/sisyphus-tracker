export interface Figure {
  name: string;
  initials: string;
  years: string;
  story: string;
}

export const figures: Figure[] = [
  {
    name: 'Viktor Frankl',
    initials: 'VF',
    years: '1905 — 1997',
    story: 'Sobreviveu a três anos em campos de concentração e escreveu que o último resto de liberdade é escolher a atitude perante o sofrimento.',
  },
  {
    name: 'Marco Aurélio',
    initials: 'MA',
    years: '121 — 180',
    story: 'Governou o maior império do mundo durante pestes e guerras, e escrevia todas as noites um diário a lembrar-se de que era apenas um homem.',
  },
  {
    name: 'Epicteto',
    initials: 'EP',
    years: '50 — 135',
    story: 'Nasceu escravo e viveu coxo de uma perna partida pelo dono. Tornou-se um dos mestres mais influentes da filosofia estoica.',
  },
  {
    name: 'Marie Curie',
    initials: 'MC',
    years: '1867 — 1934',
    story: 'Estudou clandestinamente na Polónia ocupada, passou fome em Paris, e tornou-se a primeira pessoa a ganhar dois prémios Nobel em ciências diferentes.',
  },
  {
    name: 'Fiódor Dostoiévski',
    initials: 'FD',
    years: '1821 — 1881',
    story: 'Foi levado ao pelotão de fuzilamento e perdoado no último segundo. Passou quatro anos na Sibéria e escreveu depois disso os seus maiores romances.',
  },
  {
    name: 'Sócrates',
    initials: 'SO',
    years: '470 — 399 a.C.',
    story: 'Podia ter fugido de Atenas e evitado a condenação à morte. Escolheu ficar e beber a cicuta para não trair aquilo que tinha ensinado a vida toda.',
  },
  {
    name: 'Ernest Shackleton',
    initials: 'ES',
    years: '1874 — 1922',
    story: 'O navio ficou preso no gelo antártico. Levou dois anos a atravessar mar e montanhas para pedir ajuda, e não perdeu um único homem.',
  },
  {
    name: 'Vincent van Gogh',
    initials: 'VG',
    years: '1853 — 1890',
    story: 'Pintou mais de novecentos quadros em dez anos e vendeu quase nenhum em vida. Continuou a pintar todos os dias sem qualquer sinal de que valia a pena.',
  },
  {
    name: 'Frederick Douglass',
    initials: 'FD',
    years: '1818 — 1895',
    story: 'Aprendeu a ler às escondidas quando isso era proibido a quem era escravizado. Fugiu, e tornou-se uma das vozes mais poderosas contra a escravatura.',
  },
  {
    name: 'Séneca',
    initials: 'SE',
    years: '4 a.C. — 65',
    story: 'Foi exilado oito anos numa ilha, chamado de volta para educar Nero, e no fim condenado à morte pelo próprio aluno. Escreveu sobre a brevidade da vida até ao último dia.',
  },
  {
    name: 'Temple Grandin',
    initials: 'TG',
    years: '1947 —',
    story: 'Só falou aos quatro anos e disseram à mãe que devia ser institucionalizada. Tornou-se professora universitária e mudou a forma como o mundo trata os animais.',
  },
  {
    name: 'Abraham Lincoln',
    initials: 'AL',
    years: '1809 — 1865',
    story: 'Perdeu quase todas as eleições a que se candidatou, faliu duas vezes e sofreu de depressão profunda. Continuou a apresentar-se.',
  },
  {
    name: 'Malala Yousafzai',
    initials: 'MY',
    years: '1997 —',
    story: 'Levou um tiro na cabeça por defender que raparigas deviam estudar. Voltou à escola e continuou a dizer exatamente a mesma coisa.',
  },
  {
    name: 'Zhang Guimei',
    initials: 'ZG',
    years: '1957 —',
    story: 'Doente e sem dinheiro, fundou uma escola gratuita numa montanha da China para raparigas pobres. Mais de duas mil chegaram à universidade.',
  },
];

export function getFigureOfTheDay(): Figure {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = Date.now() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return figures[dayOfYear % figures.length];
}