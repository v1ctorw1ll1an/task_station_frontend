import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalSection } from '@/components/legal/legal-section';
import { LEGAL_CONTACT_EMAIL, LEGAL_UPDATED_AT } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Política de Privacidade · TaskDY',
  description: 'Como o TaskDY coleta, usa, armazena e protege os seus dados.',
};

export default function PrivacidadePage() {
  return (
    <article className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground">Última atualização: {LEGAL_UPDATED_AT}</p>
        <p className="text-sm leading-relaxed text-foreground/85">
          Esta política explica quais dados pessoais o TaskDY coleta, para que são usados, com
          quem são compartilhados e quais são os seus direitos, nos termos da Lei Geral de Proteção
          de Dados (Lei nº 13.709/2018 — LGPD). Ao usar o TaskDY você também concorda com os{' '}
          <Link href="/termos" className="text-primary underline underline-offset-2">
            Termos de Uso
          </Link>
          .
        </p>
      </header>

      <LegalSection title="1. Quem somos">
        <p>
          O TaskDY é uma plataforma de gestão de projetos e tarefas (Kanban) oferecida como
          serviço em <a href="https://app.taskdy.com.br">app.taskdy.com.br</a>. Para assuntos de
          privacidade, fale com o nosso encarregado pelo e-mail{' '}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
        </p>
        <p>
          Os dados que uma empresa cliente insere na plataforma (projetos, tarefas, comentários,
          arquivos) pertencem a essa empresa. Em relação a esse conteúdo, a empresa cliente é a
          controladora e o TaskDY atua como operador, tratando os dados conforme as instruções
          dela.
        </p>
      </LegalSection>

      <LegalSection title="2. Dados que coletamos">
        <ul>
          <li>
            <strong>Cadastro e conta:</strong> nome, e-mail, senha (armazenada apenas como hash),
            foto de perfil e preferências de notificação.
          </li>
          <li>
            <strong>Empresa e cobrança:</strong> razão social, CPF ou CNPJ, endereço de cobrança e
            o histórico de assinaturas e pagamentos. Dados de cartão são digitados e guardados pelo
            processador de pagamentos — o TaskDY não armazena o número do cartão.
          </li>
          <li>
            <strong>Conteúdo de trabalho:</strong> empresas, workspaces, projetos, tarefas,
            comentários, checklists, notas, eventos de agenda, anexos e o registro de tempo
            dedicado às tarefas.
          </li>
          <li>
            <strong>Uso e segurança:</strong> endereço IP, navegador, data e hora de acesso e
            registros técnicos (logs), usados para manter o serviço funcionando e prevenir abuso.
          </li>
          <li>
            <strong>Google Agenda (opcional):</strong> somente se você conectar a sua conta Google
            — detalhes na seção 4.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Para que usamos os dados">
        <ul>
          <li>Criar e manter a sua conta e autenticar o seu acesso;</li>
          <li>Prestar o serviço: exibir quadros, tarefas, agenda e notificações;</li>
          <li>Enviar e-mails do sistema (convites, redefinição de senha, lembretes e avisos);</li>
          <li>Cobrar a assinatura e emitir os documentos fiscais correspondentes;</li>
          <li>Garantir a segurança, investigar falhas e cumprir obrigações legais.</li>
        </ul>
        <p>
          As bases legais são a execução do contrato com você ou com a sua empresa, o cumprimento
          de obrigação legal (por exemplo, fiscal) e o legítimo interesse em manter o serviço
          seguro. Não vendemos dados pessoais e não os usamos para publicidade.
        </p>
      </LegalSection>

      <LegalSection id="google" title="4. Integração com o Google Agenda">
        <p>
          A integração é opcional e é ativada por você em <em>Perfil › Integrações</em>. Ao
          conectar, você autoriza o TaskDY a acessar a sua conta Google com os escopos abaixo:
        </p>
        <ul>
          <li>
            <code>openid</code> e <code>email</code> — identificar qual conta Google foi conectada
            e exibir o e-mail dela para você.
          </li>
          <li>
            <code>https://www.googleapis.com/auth/calendar</code> — criar na sua conta um
            calendário chamado &quot;TaskDY&quot; e manter nele os seus eventos e tarefas com prazo;
            ler as alterações que você fizer nesse calendário para atualizá-las no TaskDY; listar os
            seus calendários e, apenas se você escolher, importar eventos de outros calendários
            para a sua agenda no TaskDY, somente para leitura.
          </li>
        </ul>
        <p>
          <strong>O que fazemos com esses dados:</strong> usamos os dados do Google Agenda
          exclusivamente para sincronizar a sua agenda entre o TaskDY e o Google, exibindo-os a
          você (e, no caso de eventos do TaskDY, aos participantes que você convidou). Não usamos
          esses dados para publicidade, não os vendemos, não os transferimos a terceiros e não os
          usamos para treinar modelos de inteligência artificial. Nenhuma pessoa da equipe do
          TaskDY lê os seus eventos, exceto com o seu consentimento expresso, quando necessário
          para segurança ou para cumprir a lei.
        </p>
        <p>
          <strong>Como guardamos:</strong> os tokens de acesso concedidos pelo Google são
          armazenados criptografados (AES-256) e trafegam apenas por conexões HTTPS.
        </p>
        <p>
          <strong>Como revogar:</strong> você pode desconectar a qualquer momento em{' '}
          <em>Perfil › Integrações</em> — o TaskDY revoga o acesso junto ao Google e apaga os
          tokens. Também é possível remover o acesso em{' '}
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">
            myaccount.google.com/permissions
          </a>
          . O calendário &quot;TaskDY&quot; permanece na sua conta Google e pode ser excluído por
          você. Para apagar os dados importados do Google que ficaram no TaskDY, escreva para{' '}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
        </p>
        <p>
          O uso e a transferência, pelo TaskDY, de informações recebidas das APIs do Google para
          qualquer outro aplicativo seguem a{' '}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noreferrer"
          >
            Política de Dados do Usuário dos Serviços de API do Google
          </a>
          , incluindo os requisitos de Uso Limitado (<em>Limited Use</em>).
        </p>
      </LegalSection>

      <LegalSection title="5. Com quem compartilhamos">
        <p>Compartilhamos dados somente com fornecedores necessários para operar o serviço:</p>
        <ul>
          <li>
            <strong>Asaas</strong> — processamento de pagamentos (Pix, boleto e cartão) e emissão
            de cobranças;
          </li>
          <li>
            <strong>Resend</strong> — envio dos e-mails transacionais do sistema;
          </li>
          <li>
            <strong>Google</strong> — apenas se você conectar o Google Agenda;
          </li>
          <li>Provedores de infraestrutura onde os servidores e o banco de dados são hospedados.</li>
        </ul>
        <p>
          Dentro de uma empresa, o seu nome, e-mail e o conteúdo que você cria ficam visíveis aos
          demais membros conforme as permissões definidas pelos administradores. Links públicos
          de tarefas só existem quando um membro os gera. Também podemos compartilhar dados quando
          exigido por lei ou ordem judicial.
        </p>
      </LegalSection>

      <LegalSection title="6. Armazenamento e retenção">
        <p>
          Os dados ficam armazenados enquanto a conta ou a empresa estiver ativa. Itens excluídos
          vão para a lixeira e são apagados definitivamente após o período de retenção. Dados de
          cobrança e fiscais são mantidos pelo prazo exigido pela legislação. Logs técnicos são
          mantidos por tempo limitado, apenas para segurança e diagnóstico.
        </p>
      </LegalSection>

      <LegalSection title="7. Segurança">
        <p>
          Usamos HTTPS em todas as conexões, senhas com hash, tokens de terceiros criptografados,
          controle de acesso por papel (administrador, administrador de workspace e membro) e
          limites de requisição contra abuso. Nenhum sistema é totalmente imune a incidentes; se
          ocorrer um incidente relevante, comunicaremos os afetados e a ANPD conforme a LGPD.
        </p>
      </LegalSection>

      <LegalSection title="8. Seus direitos">
        <p>
          Você pode pedir a confirmação do tratamento, o acesso, a correção, a portabilidade, a
          anonimização ou a exclusão dos seus dados, além de informações sobre o compartilhamento
          e a revogação de consentimentos. Envie o pedido para{' '}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>. Se o dado fizer
          parte do conteúdo de uma empresa cliente, podemos encaminhar o pedido a ela. Você também
          pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
      </LegalSection>

      <LegalSection title="9. Cookies">
        <p>
          Usamos apenas cookies e armazenamento local necessários para manter a sua sessão e as
          suas preferências (como o tema claro/escuro). Não usamos cookies de publicidade.
        </p>
      </LegalSection>

      <LegalSection title="10. Alterações">
        <p>
          Podemos atualizar esta política. A data no topo indica a versão vigente; mudanças
          relevantes serão avisadas no sistema ou por e-mail.
        </p>
      </LegalSection>
    </article>
  );
}
