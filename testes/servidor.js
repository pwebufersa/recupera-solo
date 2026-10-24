import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* Servidor estático mínimo, sem dependências, para os testes de navegador. */

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'codigo_fonte');
const porta = Number(process.env.PORTA || 8099);

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

http.createServer(function (pedido, resposta) {
  const caminho = decodeURIComponent(new URL(pedido.url, 'http://local').pathname);
  const alvo = path.join(raiz, caminho === '/' ? 'index.html' : caminho);

  if (!alvo.startsWith(raiz)) {
    resposta.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    resposta.end('Fora da raiz do site.');
    return;
  }

  fs.readFile(alvo, function (erro, conteudo) {
    if (erro) {
      resposta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      resposta.end('Arquivo não encontrado: ' + caminho);
      return;
    }
    resposta.writeHead(200, {
      'Content-Type': TIPOS[path.extname(alvo)] || 'application/octet-stream'
    });
    resposta.end(conteudo);
  });
}).listen(porta, '127.0.0.1', function () {
  console.log('servidor em http://127.0.0.1:' + porta);
});
