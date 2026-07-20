# Calendário Interativo

Calendário editorial interativo desenvolvido para organizar e visualizar boletins, eventos e ações de comunicação em um ambiente simples, visual e funcional.

Este projeto foi criado para funcionar como uma ferramenta prática de planejamento editorial, permitindo registrar informações por dia, navegar entre meses, salvar automaticamente o estado e gerar uma versão para impressão em PDF.

## Visão geral

O Calendário Interativo é uma aplicação web estática, sem dependências de backend, que oferece:

- cadastro de boletins por dia;
- suporte a múltiplos boletins no mesmo dia;
- navegação entre meses do ano;
- persistência automática dos dados no navegador;
- edição e remoção individual de boletins;
- exportação para PDF.

## Funcionalidades

### Cadastro e organização
- Clique em qualquer dia para criar ou editar um boletim;
- Cada dia pode receber mais de um boletim;
- O conteúdo pode incluir título, descrição e imagem de arte;
- Os boletins podem ser removidos individualmente.

### Persistência
- Os dados são salvos automaticamente no navegador;
- O calendário permanece disponível mesmo após fechar e reabrir a página;
- O estado é preservado até a remoção explícita do boletim.

### Navegação mensal
- É possível navegar entre meses anteriores e posteriores;
- O título do calendário é atualizado dinamicamente conforme o mês selecionado.

### Exportação
- O calendário pode ser exportado para PDF com uma versão otimizada para impressão.

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript vanilla
- Armazenamento local via localStorage

## Estrutura do projeto

- index.html: estrutura da interface do calendário e modal de edição;
- style.css: estilização visual do projeto;
- script.js: lógica de renderização, persistência, navegação e exportação;
- .github/workflows/deploy-pages.yml: fluxo de deploy para GitHub Pages.

## Como usar

1. Abra o arquivo index.html em um navegador.
2. Clique em um dia para adicionar um boletim.
3. Preencha título, descrição e, se desejar, a URL da arte.
4. Salve as alterações.
5. O calendário será preservado automaticamente para futuras sessões.

## Persistência de dados

Os boletins são armazenados no navegador utilizando armazenamento local. Isso garante que as informações permaneçam disponíveis mesmo após reiniciar o navegador ou o computador, desde que o mesmo ambiente e navegador sejam usados.

## Deploy

O projeto está preparado para ser publicado no GitHub Pages por meio de GitHub Actions. O fluxo de deploy encontra-se no diretório .github/workflows.

## Próximos passos

Algumas evoluções planejadas para o projeto incluem:

- categorias personalizadas para boletins;
- filtros e busca;
- visualização em lista;
- upload de imagens locais;
- compartilhamento e exportação mais avançada.

## Licença

Este projeto está licenciado sob a licença MIT. Consulte o arquivo LICENSE para mais detalhes.

## Contribuição

Contribuições são bem-vindas. Para colaborar:

1. Faça um fork do repositório;
2. Crie uma branch para sua alteração;
3. Envie suas mudanças por pull request.

