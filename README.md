# Bike Finder

Aplicacao web simples para recomendar a mota ideal com base num questionario curto.

## Como funciona

- O questionario recolhe preferencia de uso, experiencia, orcamento, estilo e prioridade.
- O motor de recomendacao usa scoring interno por regras (sem dependencia de IA para decisao).
- O resultado mostra 1 recomendacao principal + 2 alternativas.
- A API de imagens enriquece a apresentacao visual.
- A API de texto gera explicacao natural; se falhar, usa texto local de fallback.

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
   - `GROQ_API_KEY` para explicacao inteligente.

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
- `client/src/lib/fallbacks.js`: fallbacks de imagens e texto.
- `client/src/services/api.js`: chamadas de frontend para backend.
- `client/public/data/*`: dados locais do questionario e catalogo.
- `server.js`: backend minimo para servir app e proteger chaves de API.

## APIs gratuitas usadas

- Imagens: endpoint com base em Pexels.
- Texto: endpoint com base em Gemini.

Ambas sao opcionais para correr o MVP: sem chaves, a app continua funcional com fallback.

## Deploy gratuito (Render)

### Opcao rapida

1. Criar conta gratuita.
2. Ligar repositório.
3. Selecionar Web Service Node.
4. Build command: `npm install`
5. Start command: `npm start`
6. Definir variaveis de ambiente:
   - `PEXELS_API_KEY`
   - `GROQ_API_KEY`
7. Publicar.

### Opcao com ficheiro

O projeto inclui `render.yaml` com configuracao base.

## Notas de robustez

- Rate limit basico no backend para evitar abuso.
- Cache local para imagens, reduzindo chamadas externas (a explicacao e sempre pedida de novo ao modelo).
- Fallback local para manter demo funcional mesmo sem APIs.
