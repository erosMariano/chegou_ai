# ADR-005: Adoção do Prisma ORM no Back-end Core (NestJS)

* **Status:** Aceito
* **Data:** Novembro/2026
* **Decisores:** Arquitetura de Software

## Contexto
O Back-end Core da aplicação (`apps/api`, construído em **NestJS + TypeScript**) precisa persistir entidades relacionais no **PostgreSQL 16** com forte garantia de integridade transacional (ACID), suporte a transações atômicas (atualização de estado da encomenda + registro imutável na tabela de auditoria `package_events`), controle de concorrência (*Optimistic Locking*) e alta produtividade de desenvolvimento assistido por IA.

## Opções Consideradas
1. **TypeORM:** ORM tradicional do ecossistema NestJS, porém apresenta inferência de tipos inferior nas consultas relacionais e histórico de comportamentos inesperados em migrations automáticas.
2. **Drizzle ORM:** Extremamente leve (~7 KB) e próximo ao SQL nativo, mas exige maior verbosidade na definição de relações aninhadas e não possui ferramenta visual nativa integrada para inspeção rápida de dados em desenvolvimento.
3. **Prisma ORM:** Schema declarativo centralizado (`schema.prisma`), geração automática de tipos TypeScript profundos, migrations SQL versionadas e API intuitiva para transações ACID (`$transaction`).

## Decisão
Adotar o **Prisma ORM** como camada de acesso a dados no serviço **NestJS** (`apps/api`).

## Justificativa & Trade-offs
1. **Fonte Única de Verdade Declarativa (`schema.prisma`):** Centraliza tabelas, relações, chaves estrangeiras e enums em um formato altamente legível tanto para engenheiros quanto para agentes de IA (reduzindo erros de tipagem e alucinações de schema).
2. **Segurança de Tipos Ponta a Ponta (Type Safety):** O client gerado (`@prisma/client`) infere automaticamente os tipos exatos de consultas com `include` e `select`, eliminando dessincronização entre o banco de dados e os serviços de domínio.
3. **Transações Atômicas & Concorrência:** O método `prisma.$transaction()` garante que a baixa de uma encomenda (`status = DELIVERED`) e a gravação do evento de auditoria (`package_events`) ocorram de forma atômica, enquanto o *Optimistic Locking* é assegurado validando o incremento do campo `version`.
4. **Produtividade Operacional:** Migrations determinísticas (`prisma migrate`) e inspeção visual imediata via **Prisma Studio** aceleram o ciclo de desenvolvimento e testes.

## Consequências
* **Positivas:** Alta velocidade de implementação com tipagem estrita; migrations versionadas e auditáveis em SQL puro; integração nativa como `PrismaService` injetável nos módulos do NestJS.
* **Negativas:** Consumo adicional de memória (~35–50 MB) pela *Query Engine* binária e necessidade de executar `prisma generate` após alterações no schema (impactos irrelevantes em um servidor NestJS persistente em contêiner Docker).
