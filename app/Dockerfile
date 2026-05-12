FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN node_modules/.bin/prisma generate
RUN npm run build

# Compile seed.ts to seed.js so the runner doesn't need ts-node
RUN node -e "\
const ts = require('typescript');\
const fs = require('fs');\
const src = fs.readFileSync('prisma/seed.ts', 'utf8');\
const out = ts.transpileModule(src, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}});\
fs.writeFileSync('prisma/seed.js', out.outputText);\
console.log('seed.ts compiled to seed.js');"

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# Prisma v5 CLI for migrations + seeding (avoids npx downloading v7)
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
# Runtime dep for compiled seed.js
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
