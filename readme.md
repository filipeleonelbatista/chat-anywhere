<a href="https://github.com/filipeleonelbatista/chat-anywhere/blob/master/README_EN.md" target="_blank">
  <img src="https://raw.githubusercontent.com/filipeleonelbatista/filipeleonelbatista/master/assets/usa_flag.png" width="28px" />
  Version in English
</a>
</br>
</br>

<img width="100%" src="front/public/banner.png">

# Indice

- [Sobre](#-sobre)
- [Tecnologias](#Tecnologias)
- [Instalação](#Instalação)

## 🔖&nbsp; Sobre

Aplicação que você cria uma sala pelo link da url e pode enviar o link para amigos. Você e seus amigos precisam apenas selecionar um nome e um avatar e entram na mesma sala.
A idéia é ser um local de troca de texto em tempo real, sem salvar dados apenas mantendo o registro na memoria da aplicação.

[Link do projeto rodando na WEB](https://chat-anywhere-two.vercel.app/)

Você pode criar a sua sala adicionando `/nome_da_sala` ao lado da barra final do endereço. Ou `?room=Minha Sala Aqui` que ele abrirá também.

## Objetivo

Conectar pessoas de forma rápida e sem registros. Usei este projeto para testar o uso de websockets em uma aplicação cliente react, aprendi muito sobre deploy da aplicação nos ambientes AWS, GCP, DO, Vercel e VPS e suas particularidades em relação ao uso de websockets em cada situação. 


### Principais funcionalidades

- Lista de usuarios online
- Notificação se está na sala ou saiu
- Identificação de mensagens do usuario ou de convidados
- Criação da salas por links e pela aplicação
- Monitoramento do servidor exibindo alerta caso offline.
 

#### Considerações 

Criei esta aplicação usando Next JS, na minha maquina e na VPS rodou, mas em alguns casos como os planos da Vercel e gratuitos do GCP não aceitam o uso do WS por algum motivo.
Então retornei apenas para React Vite com o Servidor rodando em Node, Subi o front na Vercel e o Servidor no Render. Eventualmente o Render ele fica offline, mas pelo que entendi ele retorna, então ao tentar acessar novamente é possivel que o serviço retorne. Proximo passo seria usar um VPS ou expor um ambiente local usando Cloudflare ou similar.


---
## Tecnologias

Esse projeto foi desenvolvido com as seguintes principais tecnologias:

- [Typescript](https://www.typescriptlang.org/)
- [React JS](https://legacy.reactjs.org/docs/getting-started.html)
- [Socket IO](https://socket.io/)
- [Node JS](https://facebook.github.io/react-native/)
- [Tailwind](https://tailwindcss.com/)

e mais...

---
## Instalação

O projeto roda com [Node.js](https://nodejs.org/) v20+.

Instruções para instalar as dependencias e inicie o projeto.

### Web

```sh
cd chat-anywhere/front
npm i
npx run dev
```

### Servidor

```sh
cd chat-anywhere/server
npm i
npx run dev
```

---

<h3 align="center" >Vamos nos conectar 😉</h3>
<p align="center">
  <a href="https://www.linkedin.com/in/filipeleonelbatista/">
    <img alt="LinkedIn" width="22px" src="https://github.com/filipeleonelbatista/filipeleonelbatista/blob/master/assets/052-linkedin.svg" />
  </a>&ensp;
  <a href="mailto:filipe.x2016@gmail.com">
    <img alt="Email" width="22px" src="https://github.com/filipeleonelbatista/filipeleonelbatista/blob/master/assets/gmail.svg" />
  </a>&ensp;
  <a href="https://instagram.com/filipeleonelbatista">
    <img alt="Instagram" width="22px" src="https://github.com/filipeleonelbatista/filipeleonelbatista/blob/master/assets/044-instagram.svg" />
  </a>
</p>
<br />
<p align="center">
    Desenvolvido 💜 por Filipe Batista 
</p>
