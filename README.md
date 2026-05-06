# Bike Finder

Aplicacao web simples para recomendar a mota ideal com base num questionario curto.

## Como funciona

- O questionario recolhe preferencia de uso, experiencia, orcamento, estilo e prioridade.
- O motor de recomendacao usa scoring interno por regras (sem dependencia de IA para decisao).
- O resultado mostra 1 recomendacao principal + 2 alternativas.
- A API de imagens enriquece a apresentacao visual.
- A API BikeSpecs gera um comparador tecnico das motas selecionadas; se falhar, usa fallback local.

## Requisitos

- Node.js 18+

## Setup local

1. Instalar dependencias do backend:

   ```bash
   npm install
   ```

2. Instalar dependencias do frontend:

   ```bash
   cd client && npm install
   ```

3. Criar `.env` a partir do exemplo:

   ```bash
   cp .env.example .env
   ```

4. Preencher chaves (opcional para MVP local):
   - `PEXELS_API_KEY` para imagens.
   - `BIKESPECS_API_BASE_URL` para customizar o endpoint da BikeSpecs (por defeito usa `https://www.bikespecs.org/api/v1`).

5. Arrancar app em desenvolvimento (Express + Vite):

   ```bash
   npm run dev
   ```

6. Abrir no browser:
   - `http://localhost:5173`

## Build e execucao em producao

1. Gerar build do frontend:

   ```bash
   npm run build
   ```

2. Arrancar servidor:

   ```bash
   npm start
   ```

3. Abrir no browser:
   - `http://localhost:3000`

## Estrutura

- `client/src/App.jsx`: fluxo principal da UI em React.
- `client/src/components/*`: componentes do quiz e resultados.
- `client/src/lib/scoring.js`: logica de recomendacao interna.
- `client/src/lib/fallbacks.js`: fallbacks de imagens e comparador.
- `client/src/services/api.js`: chamadas de frontend para backend.
- `client/public/data/*`: dados locais do questionario e catalogo.
- `server.js`: backend minimo para servir app e proteger chaves de API.

## APIs gratuitas usadas

- Imagens: endpoint com base em Pexels.
- Comparador tecnico: endpoint com base em BikeSpecs.

As integracoes externas sao opcionais para correr o MVP: sem APIs externas, a app continua funcional com fallback.

## Deploy gratuito (Render)

### Opcao rapida

1. Criar conta gratuita.
2. Ligar repositório.
3. Selecionar Web Service Node.
4. Build command: `npm install`
5. Start command: `npm start`
6. Definir variaveis de ambiente:
   - `PEXELS_API_KEY`
   - `BIKESPECS_API_BASE_URL` (opcional)
7. Publicar.

### Opcao com ficheiro

O projeto inclui `render.yaml` com configuracao base.

## Notas de robustez

- Rate limit basico no backend para evitar abuso.
- Cache local para imagens, reduzindo chamadas externas.
- Fallback local para manter demo funcional mesmo sem APIs.
