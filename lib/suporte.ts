/**
 * Canal de atendimento humano, vindo do ambiente.
 *
 * Lido **no servidor** (sem prefixo `NEXT_PUBLIC_`) de propósito: variável
 * `NEXT_PUBLIC_` é gravada no bundle durante o `pnpm build`, então trocar o número
 * do suporte exigiria rebuild da imagem. Aqui basta ajustar o ambiente e reiniciar
 * o container — o valor desce como prop para o componente de tela.
 *
 * `null` enquanto nada estiver configurado. Quem usa deve mostrar o botão
 * desabilitado, nunca um link quebrado: um "Falar com o suporte" que não vai a
 * lugar nenhum é pior do que não ter botão.
 */
export interface SuporteConfig {
  tipo: 'whatsapp' | 'email';
  /** Número só com dígitos (DDI+DDD+número) ou endereço de e-mail. */
  destino: string;
}

/** Resolve o canal configurado. Só chame de server component / server action. */
export function suporteConfig(): SuporteConfig | null {
  const whatsapp = process.env.SUPPORT_WHATSAPP?.replace(/\D/g, '');
  if (whatsapp) return { tipo: 'whatsapp', destino: whatsapp };

  const email = process.env.SUPPORT_EMAIL?.trim();
  if (email) return { tipo: 'email', destino: email };

  return null;
}

/** Monta o link do canal já com assunto e mensagem preenchidos. */
export function linkDeSuporte(
  config: SuporteConfig,
  assunto: string,
  mensagem: string,
): { href: string; rotulo: string } {
  if (config.tipo === 'whatsapp') {
    const texto = `${assunto}\n\n${mensagem}`;
    return {
      href: `https://wa.me/${config.destino}?text=${encodeURIComponent(texto)}`,
      rotulo: 'Falar com o suporte no WhatsApp',
    };
  }

  // `encodeURIComponent`, não `URLSearchParams`: este último codifica espaço como
  // `+` (form-urlencoded), e vários clientes de e-mail mostram o `+` literal no
  // assunto. O mailto (RFC 6068) pede percent-encoding.
  const query = `subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(mensagem)}`;
  return {
    href: `mailto:${config.destino}?${query}`,
    rotulo: 'Falar com o suporte por e-mail',
  };
}
