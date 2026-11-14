// Entrada de função da Vercel: o runtime cria uma função por arquivo em `api/`.
// A aplicação continua em `src/`, usada do mesmo jeito pela prévia local e pelos
// testes; aqui só reexportamos o handler para o caminho que a hospedagem espera.
export { default } from '../src/app.mts';
