import format from 'date-fns/format';
import ptBR from 'date-fns/locale/pt-BR';

export function dateFormater(date: string): string {
  return format(new Date(date), 'dd MMM yyyy', {
    locale: ptBR,
  });
}

export function dateTimeFormater(date: string): string {
  return format(new Date(date), "dd MMM yyyy', às 'HH:mm", {
    locale: ptBR,
  });
}
