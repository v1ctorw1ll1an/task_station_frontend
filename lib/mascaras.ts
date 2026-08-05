import { somenteDigitos } from '@/lib/tax-id';

/**
 * Máscaras de digitação. Todas seguem a mesma regra: recebem o que o usuário
 * digitou, jogam fora o que não é dígito e reconstroem a formatação. Aplicadas no
 * `onChange`, funcionam também quando a pessoa cola um valor já formatado, apaga
 * no meio ou digita fora de ordem — nada de posicionar separador "quando chega no
 * caractere N".
 *
 * O valor mascarado é o que fica no estado do formulário (é o que a pessoa lê); o
 * envio tira a máscara de novo. O backend aceita os dois formatos, mas normaliza
 * antes de falar com o provedor de pagamento.
 */

/** CPF (000.000.000-00) até 11 dígitos; a partir daí vira CNPJ (00.000.000/0000-00). */
export function mascaraCpfCnpj(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
  }
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/** CEP: 00000-000 */
export function mascaraCep(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 8);
  return d.replace(/^(\d{5})(\d)/, '$1-$2');
}

/** Telefone: (00) 0000-0000 ou (00) 00000-0000 */
export function mascaraTelefone(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d.replace(/^(\d{1,2})$/, '($1');
  const corpo = d.slice(2);
  const meio = d.length <= 10 ? corpo.slice(0, 4) : corpo.slice(0, 5);
  const fim = d.length <= 10 ? corpo.slice(4) : corpo.slice(5);
  return `(${d.slice(0, 2)}) ${meio}${fim ? `-${fim}` : ''}`;
}

/**
 * Aplica as máscaras num endereço vindo do backend (que guarda só dígitos), para o
 * formulário abrir legível. Sem isto o CPF salvo voltava como "12345678909".
 */
export function comMascaras<T extends { cpfCnpj: string; postalCode: string; phone: string }>(
  holder: T,
): T {
  return {
    ...holder,
    cpfCnpj: mascaraCpfCnpj(holder.cpfCnpj),
    postalCode: mascaraCep(holder.postalCode),
    phone: mascaraTelefone(holder.phone),
  };
}
