import { useState, useEffect } from 'react';
import DatabaseService from '../services/DatabaseService.js';

export const useIndexedDB = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initDB = async () => {
      const success = await DatabaseService.initialize();
      setIsReady(success);
    };
    initDB();
  }, []);

  return {
    isReady,
    db: DatabaseService
  };
};