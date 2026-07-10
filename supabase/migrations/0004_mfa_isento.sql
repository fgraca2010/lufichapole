-- lufichapole — isenção de 2FA para contas específicas (uso: QA/teste).
-- Não exposto em nenhuma tela de Admin de propósito — é uma isenção de
-- segurança, não deve ser algo que se troca casualmente pela UI. Alterar via
-- SQL direto quando necessário.

alter table perfis add column mfa_isento boolean not null default false;

comment on column perfis.mfa_isento is 'Se true, pula o portão de 2FA por e-mail no middleware. Uso restrito a contas de teste/QA — nunca setar para aluno/professor/admin reais.';
