import React, { useState, useEffect } from 'react';
import { getKudosBoards } from '../../services/kudosService';
import KudoCard from '../kudos/KudoCard';
import './DashboardComponents.css';

const KudosCarousel = () => {
  const [kudos, setKudos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchKudos = async () => {
      try {
        const boards = await getKudosBoards();
        if (boards && boards.length > 0) {
          // Get kudos from the most recent board
          const latestBoard = boards[0];
          setKudos(latestBoard.kudos || []);
        }
      } catch (error) {
        console.error("Erro ao carregar kudos:", error);
      }
    };
    fetchKudos();
  }, []);

  useEffect(() => {
    if (kudos.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % kudos.length);
    }, 5000); // Muda a cada 5 segundos
    
    return () => clearInterval(interval);
  }, [kudos]);

  if (kudos.length === 0) {
    return (
      <div className="kudos-carousel empty">
        <p>Nenhum Kudo enviado ainda nesta Sprint.</p>
      </div>
    );
  }

  const currentKudo = kudos[currentIndex];

  return (
    <div className="kudos-carousel">
      <div key={currentKudo._id || currentIndex} className="kudos-slide animate-fade-in-out">
        <KudoCard kudo={currentKudo} readOnly={true} />
      </div>
    </div>
  );
};

export default KudosCarousel;
