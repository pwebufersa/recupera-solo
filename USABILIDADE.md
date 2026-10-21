# Teste de usabilidade: o que só a pessoa avalia

Os testes automáticos cobrem digitação, colagem, limites, casas decimais, foco,
ordem de leitura, alvos de toque e o resultado do exemplo. O que sobra para o
teste com pessoas é o que depende de corpo, ambiente e entendimento.

## Antes da sessão

- Aparelho real, com o APK instalado, e o site aberto no mesmo aparelho.
- Uso ao ar livre, com sol direto na tela, se possível no horário da manhã.
- Uma luva de campo e as mãos molhadas ou empoeiradas.
- Caderno com os casos fictícios e o roteiro impresso.

## O que observar

1. **Leitura ao sol.** O texto é lido sem sombra da mão? O contraste do rótulo,
   da dica e do resultado se mantém?
2. **Toque com luva.** Os campos e os botões são acionados sem erro? O teclado
   numérico aparece e cobre o campo em edição?
3. **Uso com uma mão.** A rolagem e o botão de calcular são alcançados com o
   polegar?
4. **Tela suja ou trincada.** As bordas dos campos continuam distinguíveis?
5. **Entendimento das unidades.** A pessoa sabe o que é CEes, CTC e PST? Lê a
   dica do campo e corrige a unidade sozinha?
6. **Confiança no resultado.** A pessoa entende por que um corretivo foi
   classificado como adequado e outro não?
7. **Erro provocado.** Ao digitar uma letra, a pessoa percebe que o caractere
   não entrou? Ao estourar a faixa, entende a mensagem e corrige?
8. **Sem internet.** O APK abre e calcula em modo avião, sem tela de erro?
9. **Instalação.** A pessoa instala o APK sozinha, a partir do arquivo recebido,
   e entende o aviso de fonte desconhecida?
10. **Retorno ao uso.** Depois de uma semana, a pessoa reencontra o caminho sem
    ajuda?

## Como registrar

Para cada tarefa do roteiro, anotar: concluiu sem ajuda, concluiu com
dificuldade, não concluiu ou função indisponível. Registrar também o tempo, as
frases ditas em voz alta e os pontos em que a pessoa parou.

## Critério para voltar ao desenvolvimento

Um problema volta para a lista de correções quando aparece em pelo menos dois
participantes, ou quando impede a conclusão da tarefa por um. Ajustes de
preferência estética não entram nessa lista.

## O que não precisa ser testado com pessoas

- Se letra entra em campo numérico.
- Se valor fora da faixa é recusado.
- Se o cálculo do exemplo confere.
- Se a página rola de lado em tela estreita.
- Se o campo tem nome acessível.
- Se o foco vai para o primeiro erro.

Esses itens são verificados por `npm test` a cada alteração.
