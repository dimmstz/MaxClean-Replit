# MaxClean

Aplicativo Android em Expo e React Native para localizar e revisar arquivos que podem ser removidos. O acesso depende das permissões concedidas pelo usuário e das regras de armazenamento do Android.

[![Build Android](https://github.com/dimmstz/MaxClean-Replit/actions/workflows/android.yml/badge.svg?branch=main)](https://github.com/dimmstz/MaxClean-Replit/actions/workflows/android.yml)
[![Última release](https://img.shields.io/github/v/release/dimmstz/MaxClean-Replit)](https://github.com/dimmstz/MaxClean-Replit/releases)

## Recursos

- Varredura de mídias e arquivos acessíveis ao app.
- Ferramentas para revisar arquivos duplicados, arquivos grandes, APKs e itens da pasta Downloads.
- Seleção dos itens antes da exclusão e registro do resultado real das exclusões.
- Suporte a acesso parcial a fotos e vídeos: a varredura continua disponível para os itens selecionados, com indicação de que a biblioteca pode estar incompleta.
- Interface em português, inglês e espanhol.

### Limitações do Android

O Android pode limitar o acesso a fotos, vídeos, áudio e pastas como Downloads. O conteúdo encontrado pode ser parcial, e algumas pastas precisam ser autorizadas pelo seletor de arquivos do sistema. O app não remove o cache privado de outros aplicativos nem contorna as proteções do Android.

## Tecnologias

- Expo SDK 54
- React Native 0.81 e React 19
- Expo Router e TypeScript
- pnpm em um workspace monorepo

## Executar localmente

Requer Node.js 22 e pnpm 10.

```bash
corepack enable
corepack prepare pnpm@10.26.1 --activate
pnpm install --frozen-lockfile
cd artifacts/mobile
pnpm exec expo start
```

Para verificar os tipos a partir da raiz:

```bash
pnpm --filter @workspace/mobile run typecheck
```

Os recursos que dependem de permissões nativas de arquivos devem ser verificados em um dispositivo Android. O Expo Go pode não oferecer o mesmo acesso que uma compilação nativa.

## Compilação automática

### GitHub Actions

O workflow em `.github/workflows/android.yml` compila um APK `debug` em pushes para qualquer branch, em pull requests e por execução manual. O APK fica disponível como artefato do workflow por 14 dias.

Ao enviar uma tag no formato `v*`, o workflow também publica o APK na release correspondente do GitHub. Se uma release for publicada pela interface ou API do GitHub, o evento de publicação também inicia a compilação e anexa o APK.

### Codemagic

O arquivo `codemagic.yaml` configura uma compilação Android em cada push para qualquer branch e em tags `v*`. Para ativá-la:

1. Adicione `dimmstz/MaxClean-Replit` como aplicação na sua conta Codemagic.
2. Selecione a configuração por `codemagic.yaml`.
3. Crie/ative o webhook do repositório nas configurações da aplicação no Codemagic.

O APK gerado fica nos artefatos da compilação do Codemagic. A configuração usa assinatura de debug para permitir instalação e testes; uma versão de distribuição exige uma keystore de release configurada com segurança no Codemagic.

## Versão

Veja as [releases e tags](https://github.com/dimmstz/MaxClean-Replit/releases).
