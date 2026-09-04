import React, { useState, useEffect } from 'react';
import './LoadingScreen.css';

const messages = [
  "Estimando o tempo de carregamento em 3 pontos...",
  "Sincronizando o backlog de pixels...",
  "Aguardando aprovação do Product Owner...",
  "Rodando a daily: 'O que fiz ontem? Nada. O que farei hoje? Carregar.'",
  "Refinando os requisitos da tela...",
  "Movendo card para 'Em Progresso'...",
  "Verificando se o deploy quebrou alguma coisa...",
  "Consultando a velocidade da equipe... parece 1 SP.",
  "Aplicando o conceito de 'definition of done' no loading...",
  "Bugando graciosamente enquanto carrega...",
  "Sprint 1: Criar o app. Sprint 2: Fazer funcionar.",
  "Git commit -m 'WIP'",
  "Testando em produção (shhh, ninguém vai saber).",
  "Convencendo o cliente que isso é uma feature, não um bug...",
  "Copiando código do Stack Overflow com confiança...",
  "Escrevendo documentação... brincadeira, nunca.",
  "Calculando velocity: 'muito devagar'.",
  "Aguardando o PM responder no Slack...",
  "Gerando relatório de impedimentos: 'internet lenta'.",
  "Retrospectiva: O que foi bom? O café. O que pode melhorar? Tudo.",
];

const LoadingScreen = () => {
  const [messageIdx, setMessageIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMessageIdx(prev => (prev + 1) % messages.length);
        setVisible(true);
      }, 500);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-logo-wrapper">
          <div className="loading-logo-ring ring-1" />
          <div className="loading-logo-ring ring-2" />
          <div className="loading-logo-ring ring-3" />
          <div className="loading-logo-icon">A</div>
        </div>

        <h1 className="loading-title">AgileFlow</h1>

        <div className="loading-bar-wrapper">
          <div className="loading-bar" />
        </div>

        <p className={`loading-message ${visible ? 'msg-visible' : 'msg-hidden'}`}>
          {messages[messageIdx]}
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
