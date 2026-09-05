# Auditoria UX — checkpoint antes de alterar UI

## Princípio

O painel já entrega os fluxos centrais de gestão, mas sua arquitetura de informação ainda reflete a ordem em que as funções foram implementadas, não o trabalho diário de um operador/gestor. A próxima fase deve melhorar experiência sem reescrever funcionalidades que já funcionam.

## P0 — bloqueios de experiência do produto

### Prospecção não está acessível na navegação atual

O servidor já possui capabilities e operações de leads/prospecção, mas o router e o AppShell atuais expõem apenas Conversas e Consumo. Para um produto de prospecção, iniciar/importar leads precisa ser um fluxo de primeira classe.

**Próxima fase:** desenhar o fluxo completo `importar → validar → iniciar prospecção → acompanhar resultado` antes de codificar a tela.

### Não existe visão operacional inicial

Depois do login, a experiência leva o usuário diretamente para módulos específicos. Falta uma visão que responda rapidamente: o bot está operando? quantas conversas exigem atenção? quantos leads estão em prospecção? houve erros? qual o consumo recente?

**Próxima fase:** dashboard inicial orientado a decisão, não coleção de cards decorativos.

## P1 — alto impacto na operação

### Conversas precisam funcionar como inbox operacional

A listagem atual é funcional, porém deve evoluir para priorização: estado, intenção, pendência, última atividade e necessidade de intervenção precisam ser legíveis sem abrir cada conversa.

### Ações manuais precisam de feedback mais explícito

Handoff, retomada e mensagem manual são ações de consequência operacional. A UI futura deve explicitar estado em andamento, sucesso, erro e o novo dono da conversa.

### Erro de backend e sessão expirada precisam ser diferenciados

O bootstrap de autenticação atual usa uma chamada de overview; falhas gerais podem acabar apresentadas como estado anônimo. A experiência futura deve separar 401/sessão expirada de indisponibilidade/erro do servidor.

### Capabilities não devem mascarar falha operacional

A consulta de capabilities é tolerante a ausência do endpoint, útil para compatibilidade, mas um erro de rede/servidor não deve ser indistinguível de capability ausente na experiência final.

### Consumo precisa mostrar significado, não apenas métrica

A tela deve ajudar o gestor a relacionar consumo/custo com atividade: período, mensagens/conversas, LLM e tendência, com contexto suficiente para tomada de decisão.

## P2 — refinamento e qualidade

- estados vazios com próxima ação clara;
- skeleton/loading consistente entre telas;
- mensagens de erro recuperáveis;
- navegação e densidade adequadas a desktop sem perder mobile;
- foco visível, labels e contraste acessíveis;
- atalhos e redução de cliques para operador recorrente;
- consistência de nomenclatura entre servidor, OpenSpec e interface.

## Fluxos que devem guiar o redesign

1. **Gestor:** entrar → entender saúde/volume/custo → localizar exceções → agir.
2. **SDR/operador:** entrar → ver conversas que pedem atenção → abrir contexto → assumir/responder/retomar.
3. **Prospecção:** importar leads → revisar validação → iniciar lote → acompanhar progresso/falhas → abrir conversas geradas.

## Limite deste checkpoint

Nenhum componente visual, CSS, layout, rota nova ou comportamento de interação foi alterado por esta auditoria. O próximo passo é abrir uma mudança OpenSpec própria para o redesign do dashboard e dos fluxos acima.
