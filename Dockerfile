# Stage 1: install dependencies
FROM node:22-alpine AS deps
# pnpm pinado (igual ao local), nunca `@latest`: o pnpm 12 passou a recusar o install
# por scripts de build não aprovados e ignora o `onlyBuiltDependencies`, quebrando o
# deploy sem ninguém ter tocado no projeto.
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
WORKDIR /app
# pnpm-workspace.yaml carrega o onlyBuiltDependencies (sharp, msw, unrs-resolver).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: build
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars must be available at build time
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Auto-cadastro de empresa (link no login + página /register). Precisa existir
# AQUI, não só no ambiente do container: `NEXT_PUBLIC_*` é gravada no bundle
# durante o `pnpm build`, então definir só em runtime deixa o valor `undefined`
# e a tela some. O enforcement real é o PUBLIC_SIGNUP_ENABLED do backend.
ARG NEXT_PUBLIC_SIGNUP_ENABLED
ENV NEXT_PUBLIC_SIGNUP_ENABLED=$NEXT_PUBLIC_SIGNUP_ENABLED

# Stable encryption key for Server Action IDs — must match across builds/replicas,
# otherwise clients get "Failed to find Server Action" after redeploys.
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
ENV NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY

RUN pnpm build

# Stage 3: production runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
# Explicitly copy the full server directory — standalone omits some server action
# manifest files, causing "Failed to find Server Action" errors at runtime.
COPY --from=builder /app/.next/server ./.next/server
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
