'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getProfileAction, type UserProfile } from '@/actions/perfil/get-profile.action';
import { updateProfileAction } from '@/actions/perfil/update-profile.action';
import { updatePasswordAction } from '@/actions/perfil/update-password.action';
import { gravatarUrl } from '@/lib/gravatar';
import { AvatarUpload } from '@/components/perfil/avatar-upload';

export default function PerfilPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Avatar state
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  // Profile form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [savingProfile, startSaveProfile] = useTransition();

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [savingPassword, startSavePassword] = useTransition();

  useEffect(() => {
    getProfileAction().then((res) => {
      if (res.data) {
        setProfile(res.data);
        setName(res.data.name);
        setPhone(res.data.phone ?? '');
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!profile) return;
    const resolveAvatar = profile.photoUrl
      ? Promise.resolve(
          profile.photoUrl.startsWith('http')
            ? profile.photoUrl
            : `${process.env.NEXT_PUBLIC_API_URL}${profile.photoUrl}`
        )
      : gravatarUrl(profile.email, 96);
    resolveAvatar.then((url) => {
      setAvatarSrc(url);
    });
  }, [profile]);

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    startSaveProfile(async () => {
      const res = await updateProfileAction({
        name: name || undefined,
        phone: phone || undefined,
      });
      if (res.error) {
        setProfileMsg({ type: 'err', text: res.error });
      } else {
        setProfileMsg({ type: 'ok', text: 'Perfil atualizado com sucesso.' });
        setProfile((prev) => prev ? { ...prev, name, phone: phone || null } : prev);
      }
    });
  }

  function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'err', text: 'As senhas não coincidem.' });
      return;
    }
    startSavePassword(async () => {
      const res = await updatePasswordAction(currentPassword, newPassword);
      if (res.error) {
        setPasswordMsg({ type: 'err', text: res.error });
      } else {
        setPasswordMsg({ type: 'ok', text: 'Senha alterada com sucesso.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Slim page header */}
      <div className="border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="text-sm font-medium">Meu Perfil</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Avatar + name hero */}
        <AvatarUpload
          currentSrc={avatarSrc}
          fallbackInitial={profile?.name?.charAt(0) ?? profile?.email?.charAt(0) ?? 'U'}
          onUploadSuccess={(url) => {
            setAvatarSrc(url);
            setProfile((prev) => prev ? { ...prev, photoUrl: url } : prev);
          }}
        />
        <div className="text-center">
          <p className="text-lg font-semibold">{profile?.name}</p>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
        </div>

        <Separator />

        {/* Dados Pessoais card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile?.email ?? ''} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+55 11 99999-9999"
                />
              </div>

              {profileMsg && (
                <p className={`text-sm ${profileMsg.type === 'ok' ? 'text-green-600' : 'text-destructive'}`}>
                  {profileMsg.text}
                </p>
              )}

              <Button type="submit" disabled={savingProfile} className="gap-1.5">
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar dados
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Alterar Senha card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alterar Senha</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Senha atual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showCurrent ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-9"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showNew ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {passwordMsg && (
                <p className={`text-sm ${passwordMsg.type === 'ok' ? 'text-green-600' : 'text-destructive'}`}>
                  {passwordMsg.text}
                </p>
              )}

              <Button type="submit" disabled={savingPassword} className="gap-1.5">
                {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Alterar senha
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
