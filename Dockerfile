FROM node:20-slim AS base

RUN addgroup --gid 1001 nodegroup && adduser --uid 1001 --ingroup nodegroup --disabled-password nodeuser
RUN npm i -g pnpm

FROM base AS dependencies

WORKDIR /app
COPY --chown=nodeuser:nodegroup package.json pnpm-lock.yaml ./
RUN pnpm install

FROM base AS build

WORKDIR /app
COPY --chown=nodeuser:nodegroup . .
COPY --from=dependencies /app/node_modules ./node_modules
RUN pnpm build
RUN pnpm prune --prod

FROM base AS deploy

RUN apt-get update && apt-get install -y netcat-traditional iputils-ping python3 python3-pip python3-venv && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --chown=nodeuser:nodegroup --from=build /app/dist ./dist
COPY --chown=nodeuser:nodegroup --from=build /app/node_modules ./node_modules
COPY --chown=nodeuser:nodegroup --from=build /app/package.json ./package.json
COPY --chown=nodeuser:nodegroup --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --chown=nodeuser:nodegroup ./scripts/docker-entrypoint.sh ./scripts/

# Python scripts (ups_manager) that drive VMware/iLO/UPS operations. The
# "ups_manager" build context is a sibling repo folder, wired up via
# docker-compose's additional_contexts for this service.
COPY --chown=nodeuser:nodegroup --from=ups_manager . /home/upstra/ups_manager
RUN python3 -m venv /home/upstra/ups_manager/.venv \
    && /home/upstra/ups_manager/.venv/bin/pip install --no-cache-dir --upgrade pip \
    && /home/upstra/ups_manager/.venv/bin/pip install --no-cache-dir -r /home/upstra/ups_manager/requirements.txt \
    && chown -R nodeuser:nodegroup /home/upstra/ups_manager/.venv \
    && chmod +x /home/upstra/ups_manager/*.sh

RUN chmod +x ./scripts/docker-entrypoint.sh

USER nodeuser
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
CMD ["pnpm", "run", "start:prod"]
