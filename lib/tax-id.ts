/**
 * Validação de CPF/CNPJ — **espelho de `backend/src/common/tax-id.ts`**. Mesmo
 * algoritmo dos dois lados; mudança aqui vai junto lá.
 *
 * O backend é quem vale. Aqui a validação existe para o cliente não descobrir o
 * documento errado só depois de digitar o cartão inteiro e o Asaas recusar com
 * "O CPF/CNPJ informado é inválido".
 */
export function somenteDigitos(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function validarCpfCnpj(raw: string): boolean {
  const d = somenteDigitos(raw);
  if (d.length === 11) return validarCpf(d);
  if (d.length === 14) return validarCnpj(d);
  return false;
}

/** Dígito verificador por soma ponderada módulo 11 — igual para CPF e CNPJ. */
function digitoVerificador(base: string, pesos: number[]): number {
  const soma = base.split('').reduce((acc, char, i) => acc + Number(char) * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function validarCpf(d: string): boolean {
  if (d.length !== 11) return false;
  // Sequência repetida passa no cálculo mas não é CPF de ninguém.
  if (/^(\d)\1{10}$/.test(d)) return false;
  if (digitoVerificador(d.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]) !== Number(d[9])) return false;
  return digitoVerificador(d.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[10]);
}

export function validarCnpj(d: string): boolean {
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;
  if (digitoVerificador(d.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) !== Number(d[12])) {
    return false;
  }
  return (
    digitoVerificador(d.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[13])
  );
}
