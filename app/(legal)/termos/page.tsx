import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalSection } from '@/components/legal/legal-section';
import { LEGAL_CONTACT_EMAIL, LEGAL_UPDATED_AT } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Termos de Uso · TaskDY',
  description: 'Regras de uso da plataforma TaskDY.',
};

export default function TermosPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground">Última atualização: {LEGAL_UPDATED_AT}</p>
        <p className="text-sm leading-relaxed text-foreground/85">
          Estes termos regem o uso do TaskDY, disponível em{' '}
          <a href="https://app.taskdy.com.br" className="text-primary underline underline-offset-2">
            app.taskdy.com.br
          </a>
          . Ao criar uma conta ou usar a plataforma, você concorda com eles e com a{' '}
          <Link href="/privacidade" className="text-primary underline underline-offset-2">
            Política de Privacidade
          </Link>
          .
        </p>
      </header>

      <LegalSection title="1. O serviço">
        <p>
          O TaskDY é uma plataforma online de gestão de projetos e tarefas, organizada em
          empresas, workspaces, projetos e quadros Kanban, com agenda, notificações, registro de
          tempo e integrações opcionais, como o Google Agenda.
        </p>
      </LegalSection>

      <LegalSection title="2. Conta e acesso">
        <ul>
          <li>Você deve fornecer dados verdadeiros e mantê-los atualizados.</li>
          <li>
            A senha é pessoal. Você é responsável pelo que for feito com a sua conta e deve nos
            avisar se suspeitar de uso indevido.
          </li>
          <li>
            Os administradores de cada empresa controlam quem participa dela e com qual papel, e
            podem remover membros.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Planos, cobrança e cancelamento">
        <ul>
          <li>
            O uso contínuo depende de uma assinatura paga pela empresa, conforme o plano e os
            valores exibidos no sistema no momento da contratação. Pode haver período de teste
            gratuito.
          </li>
          <li>
            Os pagamentos são processados pelo Asaas. Em caso de atraso, o acesso da empresa pode
            ser limitado até a regularização.
          </li>
          <li>
            O administrador pode cancelar a assinatura a qualquer momento pelo sistema. O
            cancelamento impede novas cobranças, e o efeito sobre o acesso segue as regras do
            plano contratado.
          </li>
          <li>
            Os direitos previstos no Código de Defesa do Consumidor são preservados quando
            aplicáveis.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Uso aceitável">
        <p>Não é permitido usar o TaskDY para:</p>
        <ul>
          <li>Publicar conteúdo ilegal, ofensivo ou que viole direitos de terceiros;</li>
          <li>Enviar spam ou malware, ou tentar acessar contas e dados de outras pessoas;</li>
          <li>Sobrecarregar, explorar falhas ou contornar limites e controles da plataforma;</li>
          <li>Revender ou redistribuir o serviço sem autorização.</li>
        </ul>
        <p>Podemos suspender contas que violem estas regras.</p>
      </LegalSection>

      <LegalSection title="5. Seu conteúdo">
        <p>
          O conteúdo que você e a sua empresa inserem (tarefas, comentários, arquivos, eventos)
          continua sendo de vocês. Você nos concede apenas a permissão necessária para armazenar,
          processar e exibir esse conteúdo a fim de prestar o serviço. Você é responsável por ter
          o direito de usar o que envia.
        </p>
      </LegalSection>

      <LegalSection title="6. Integrações de terceiros">
        <p>
          Integrações como o Google Agenda são opcionais e dependem também dos termos do
          respectivo provedor. Ao conectar, você autoriza a troca de dados descrita na{' '}
          <Link href="/privacidade#google">Política de Privacidade</Link> e pode desconectar a
          qualquer momento em <em>Perfil › Integrações</em>. Não respondemos por indisponibilidade
          ou mudanças nos serviços de terceiros.
        </p>
      </LegalSection>

      <LegalSection title="7. Disponibilidade e responsabilidade">
        <p>
          Trabalhamos para manter o TaskDY disponível e seguro, mas o serviço é fornecido
          &quot;no estado em que se encontra&quot;, podendo haver interrupções para manutenção ou
          por falhas. Na máxima extensão permitida pela lei, não respondemos por lucros cessantes
          ou danos indiretos, e a nossa responsabilidade total fica limitada ao valor pago pela
          empresa nos 12 meses anteriores ao fato.
        </p>
      </LegalSection>

      <LegalSection title="8. Encerramento">
        <p>
          Você pode deixar de usar o serviço a qualquer momento. Encerrada a conta ou a empresa,
          os dados são excluídos conforme a Política de Privacidade, ressalvados os que a lei
          obriga a manter.
        </p>
      </LegalSection>

      <LegalSection title="9. Alterações e foro">
        <p>
          Podemos atualizar estes termos; mudanças relevantes serão avisadas com antecedência no
          sistema ou por e-mail. Estes termos seguem a lei brasileira. Dúvidas:{' '}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </article>
  );
}
