export interface Quote {
  text: string;
  author: string;
}

export const quotes: Quote[] = [
  { text: 'É preciso imaginar Sísifo feliz.', author: 'Albert Camus' },
  { text: 'Não é porque as coisas são difíceis que não ousamos; é porque não ousamos que elas são difíceis.', author: 'Séneca' },
  { text: 'Tens poder sobre a tua mente, não sobre os acontecimentos. Percebe isto e encontrarás a força.', author: 'Marco Aurélio' },
  { text: 'Quem tem um porquê para viver suporta quase qualquer como.', author: 'Friedrich Nietzsche' },
  { text: 'Não são as coisas que perturbam os homens, mas as opiniões que deles fazem.', author: 'Epicteto' },
  { text: 'Somos aquilo que repetidamente fazemos. A excelência não é um ato, mas um hábito.', author: 'Aristóteles' },
  { text: 'Uma vida não examinada não vale a pena ser vivida.', author: 'Sócrates' },
  { text: 'O que fazemos em vida ecoa na eternidade.', author: 'Marco Aurélio' },
  { text: 'Começa já a ser quem queres ser daqui a dez anos.', author: 'Séneca' },
  { text: 'A felicidade da tua vida depende da qualidade dos teus pensamentos.', author: 'Marco Aurélio' },
  { text: 'Primeiro decide quem queres ser. Depois faz o que tens de fazer.', author: 'Epicteto' },
  { text: 'Aquele que move montanhas começa por carregar pequenas pedras.', author: 'Confúcio' },
  { text: 'Nenhum vento é favorável a quem não sabe para onde vai.', author: 'Séneca' },
  { text: 'A dificuldade fortalece a mente, como o trabalho fortalece o corpo.', author: 'Séneca' },
  { text: 'Torna-te aquilo que és.', author: 'Friedrich Nietzsche' },
];

export function getQuoteOfTheDay(): Quote {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = Date.now() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return quotes[dayOfYear % quotes.length];
}
