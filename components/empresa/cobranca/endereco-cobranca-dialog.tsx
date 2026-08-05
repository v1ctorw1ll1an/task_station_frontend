'use client';

import { useState, useTransition } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CampoTexto, emptyPerfil } from '@/components/empresa/cobranca/billing-fields';
import { fetchCepAction } from '@/actions/empresa/billing.action';
import { comMascaras, mascaraCep, mascaraCpfCnpj, mascaraTelefone } from '@/lib/mascaras';
import { billingProfileSchema, type BillingProfileInput } from '@/lib/schemas/billing.schema';
import { somenteDigitos, validarCpfCnpj } from '@/lib/tax-id';

/**
 * Dados de cobrança da empresa — quem paga, onde e com que documento.
 *
 * Deixou de ser opcional: como o cartão passou a ser digitado na página hospedada do
 * Asaas, é este cadastro que aparece lá e é ele que o antifraude do provedor vê. Sem
 * ele completo, o botão de pagar abre este diálogo antes de qualquer coisa.
 *
 * O CEP preenche logradouro, bairro, cidade e UF sozinho (consulta no backend). Se a
 * consulta falhar, os campos ficam editáveis como sempre — um serviço de terceiro fora
 * do ar não pode impedir alguém de pagar.
 */
export function EnderecoCobrancaDialog({
  companyId,
  enderecoSalvo,
  empresa,
  pending,
  onConfirm,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  trigger = true,
}: {
  companyId: string;
  enderecoSalvo: BillingProfileInput | null;
  /** Dados fiscais da empresa — razão social e documento, o que sai na nota. */
  empresa: { legalName: string; taxId: string };
  pending: boolean;
  onConfirm: (dados: BillingProfileInput & { legalName: string; taxId: string }) => void;
  /** Controlado por fora quando outro fluxo (pagar) precisa abrir o cadastro antes. */
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  trigger?: boolean;
}) {
  const [openInterno, setOpenInterno] = useState(false);
  const open = openProp ?? openInterno;
  const setOpen = onOpenChangeProp ?? setOpenInterno;

  const [perfil, setPerfil] = useState<BillingProfileInput>(
    enderecoSalvo ? comMascaras(enderecoSalvo) : emptyPerfil,
  );
  const [fiscal, setFiscal] = useState({
    legalName: empresa.legalName,
    taxId: mascaraCpfCnpj(empresa.taxId),
  });
  const [erro, setErro] = useState<string | null>(null);
  const [buscandoCep, buscarCep] = useTransition();
  // Sem cadastro salvo, isto é convite e não correção.
  const incompleto = enderecoSalvo == null;

  function handleOpenChange(o: boolean) {
    setOpen(o);
    if (o) {
      // Reabrir sempre parte do que está salvo: edição abandonada não pode
      // reaparecer como se fosse o valor gravado.
      setPerfil(enderecoSalvo ? comMascaras(enderecoSalvo) : emptyPerfil);
      setFiscal({ legalName: empresa.legalName, taxId: mascaraCpfCnpj(empresa.taxId) });
      setErro(null);
    }
  }

  /** Ao sair do campo de CEP, completa o endereço. Silencioso quando não encontra. */
  function completarPeloCep() {
    if (somenteDigitos(perfil.postalCode).length !== 8) return;
    buscarCep(async () => {
      const achado = await fetchCepAction(companyId, perfil.postalCode);
      if (!achado) return;
      setPerfil((p) => ({
        ...p,
        // Não sobrescreve o que a pessoa já digitou: o ViaCEP erra em rua sem
        // logradouro definido, e apagar o que foi digitado à mão é pior que não ajudar.
        street: p.street || achado.street,
        neighborhood: p.neighborhood || achado.neighborhood,
        city: p.city || achado.city,
        state: p.state || achado.state,
      }));
    });
  }

  function confirmar() {
    if (fiscal.legalName.trim().length < 1) {
      setErro('Informe a razão social da empresa');
      return;
    }
    if (!validarCpfCnpj(fiscal.taxId)) {
      setErro('CNPJ ou CPF da empresa inválido — confira os números digitados');
      return;
    }
    const parsed = billingProfileSchema.safeParse(perfil);
    if (!parsed.success) {
      setErro(parsed.error.issues[0]?.message ?? 'Dados inválidos');
      return;
    }
    setErro(null);
    // `parsed.data` — sai daqui sem máscara.
    onConfirm({
      ...parsed.data,
      legalName: fiscal.legalName.trim(),
      taxId: somenteDigitos(fiscal.taxId),
    });
  }

  const set = (campo: keyof BillingProfileInput, valor: string) =>
    setPerfil((e) => ({ ...e, [campo]: valor }));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          <Button variant={incompleto ? 'default' : 'outline'} size="sm" disabled={pending}>
            <MapPin className="mr-1 h-4 w-4" />
            {incompleto ? 'Complete seu cadastro' : 'Dados de cobrança'}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{incompleto ? 'Complete seu cadastro' : 'Dados de cobrança'}</DialogTitle>
          <DialogDescription>
            {incompleto
              ? 'Precisamos destes dados antes do pagamento — são eles que aparecem na página segura do Asaas e na nota. Nada é cobrado aqui.'
              : 'É o que sai na nota e o que aparece na página de pagamento. Alterar aqui não cobra nada e não mexe no seu plano.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Dados da empresa. Fora daqui, editar empresa é exclusivo do superadmin —
              o admin ficava sem como corrigir a própria razão social ou o CNPJ. */}
          <p className="text-xs text-muted-foreground">Empresa</p>
          <CampoTexto
            label="Razão social"
            value={fiscal.legalName}
            onChange={(v) => setFiscal((f) => ({ ...f, legalName: v }))}
          />
          <CampoTexto
            label="CNPJ ou CPF da empresa"
            placeholder="00.000.000/0000-00"
            value={fiscal.taxId}
            onChange={(v) => setFiscal((f) => ({ ...f, taxId: mascaraCpfCnpj(v) }))}
            inputMode="numeric"
          />

          <p className="pt-1 text-xs text-muted-foreground">Titular da cobrança</p>
          <CampoTexto label="Nome do titular" value={perfil.name} onChange={(v) => set('name', v)} />
          <div className="grid grid-cols-2 gap-2">
            <CampoTexto label="Email" value={perfil.email} onChange={(v) => set('email', v)} />
            <CampoTexto
              label="CPF/CNPJ"
              placeholder="000.000.000-00"
              value={perfil.cpfCnpj}
              onChange={(v) => set('cpfCnpj', mascaraCpfCnpj(v))}
              inputMode="numeric"
            />
          </div>

          <p className="pt-1 text-xs text-muted-foreground">Endereço</p>
          <div className="grid grid-cols-2 gap-2">
            <CampoTexto
              label={buscandoCep ? 'CEP (buscando…)' : 'CEP'}
              placeholder="00000-000"
              value={perfil.postalCode}
              onChange={(v) => set('postalCode', mascaraCep(v))}
              onBlur={completarPeloCep}
              inputMode="numeric"
            />
            <CampoTexto
              label="Número"
              value={perfil.addressNumber}
              onChange={(v) => set('addressNumber', v)}
            />
          </div>
          <CampoTexto
            label="Logradouro"
            placeholder="Rua, avenida..."
            value={perfil.street}
            onChange={(v) => set('street', v)}
          />
          <CampoTexto
            label="Complemento (opcional)"
            placeholder="Apto, bloco, sala..."
            value={perfil.addressComplement}
            onChange={(v) => set('addressComplement', v)}
          />
          <div className="grid grid-cols-2 gap-2">
            <CampoTexto
              label="Bairro"
              value={perfil.neighborhood}
              onChange={(v) => set('neighborhood', v)}
            />
            <CampoTexto label="Cidade" value={perfil.city} onChange={(v) => set('city', v)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <CampoTexto
              label="UF"
              placeholder="SP"
              maxLength={2}
              value={perfil.state}
              onChange={(v) => set('state', v.replace(/[^A-Za-z]/g, '').toUpperCase())}
            />
            <CampoTexto
              label="Telefone"
              placeholder="(11) 98765-4321"
              value={perfil.phone}
              onChange={(v) => set('phone', mascaraTelefone(v))}
              inputMode="numeric"
            />
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>

        <DialogFooter>
          <Button disabled={pending} onClick={confirmar}>
            {pending ? 'Salvando...' : 'Salvar cadastro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
