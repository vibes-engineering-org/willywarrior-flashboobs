"use client";

import { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { TokenData } from '~/services/coingecko';

interface PortfolioToken extends TokenData {
  amount: number;
  value: number;
  addedAt: number;
}

interface PortfolioState {
  tokens: PortfolioToken[];
  totalValue: number;
  totalChange24h: number;
  isLoading: boolean;
  sortBy: 'value' | 'change' | 'name';
  sortOrder: 'asc' | 'desc';
}

type PortfolioAction =
  | { type: 'ADD_TOKEN'; payload: { token: TokenData; amount: number } }
  | { type: 'REMOVE_TOKEN'; payload: string }
  | { type: 'UPDATE_TOKEN_AMOUNT'; payload: { id: string; amount: number } }
  | { type: 'UPDATE_PRICES'; payload: TokenData[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SORT'; payload: { sortBy: PortfolioState['sortBy']; sortOrder: PortfolioState['sortOrder'] } }
  | { type: 'LOAD_PORTFOLIO'; payload: PortfolioToken[] };

const initialState: PortfolioState = {
  tokens: [],
  totalValue: 0,
  totalChange24h: 0,
  isLoading: false,
  sortBy: 'value',
  sortOrder: 'desc',
};

function portfolioReducer(state: PortfolioState, action: PortfolioAction): PortfolioState {
  switch (action.type) {
    case 'ADD_TOKEN': {
      const existingToken = state.tokens.find(t => t.id === action.payload.token.id);
      if (existingToken) {
        return {
          ...state,
          tokens: state.tokens.map(t =>
            t.id === action.payload.token.id
              ? { ...t, amount: t.amount + action.payload.amount, value: (t.amount + action.payload.amount) * t.current_price }
              : t
          ),
        };
      }

      const newToken: PortfolioToken = {
        ...action.payload.token,
        amount: action.payload.amount,
        value: action.payload.amount * action.payload.token.current_price,
        addedAt: Date.now(),
      };

      return {
        ...state,
        tokens: [...state.tokens, newToken],
      };
    }

    case 'REMOVE_TOKEN':
      return {
        ...state,
        tokens: state.tokens.filter(t => t.id !== action.payload),
      };

    case 'UPDATE_TOKEN_AMOUNT':
      return {
        ...state,
        tokens: state.tokens.map(t =>
          t.id === action.payload.id
            ? { ...t, amount: action.payload.amount, value: action.payload.amount * t.current_price }
            : t
        ),
      };

    case 'UPDATE_PRICES':
      const updatedTokens = state.tokens.map(portfolioToken => {
        const updatedPrice = action.payload.find(p => p.id === portfolioToken.id);
        if (updatedPrice) {
          return {
            ...portfolioToken,
            ...updatedPrice,
            value: portfolioToken.amount * updatedPrice.current_price,
          };
        }
        return portfolioToken;
      });

      const totalValue = updatedTokens.reduce((sum, token) => sum + token.value, 0);
      const totalChange24h = updatedTokens.reduce((sum, token) => {
        const change = (token.price_change_percentage_24h / 100) * token.value;
        return sum + change;
      }, 0);

      return {
        ...state,
        tokens: updatedTokens,
        totalValue,
        totalChange24h,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_SORT':
      const sortedTokens = [...state.tokens].sort((a, b) => {
        let aValue, bValue;

        switch (action.payload.sortBy) {
          case 'value':
            aValue = a.value;
            bValue = b.value;
            break;
          case 'change':
            aValue = a.price_change_percentage_24h;
            bValue = b.price_change_percentage_24h;
            break;
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          default:
            return 0;
        }

        if (action.payload.sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        }
        return aValue < bValue ? 1 : -1;
      });

      return {
        ...state,
        tokens: sortedTokens,
        sortBy: action.payload.sortBy,
        sortOrder: action.payload.sortOrder,
      };

    case 'LOAD_PORTFOLIO':
      const loadedTotalValue = action.payload.reduce((sum, token) => sum + token.value, 0);
      const loadedTotalChange24h = action.payload.reduce((sum, token) => {
        const change = (token.price_change_percentage_24h / 100) * token.value;
        return sum + change;
      }, 0);

      return {
        ...state,
        tokens: action.payload,
        totalValue: loadedTotalValue,
        totalChange24h: loadedTotalChange24h,
      };

    default:
      return state;
  }
}

interface PortfolioContextType extends PortfolioState {
  addToken: (token: TokenData, amount: number) => void;
  removeToken: (id: string) => void;
  updateTokenAmount: (id: string, amount: number) => void;
  updatePrices: (prices: TokenData[]) => void;
  setLoading: (loading: boolean) => void;
  setSorting: (sortBy: PortfolioState['sortBy'], sortOrder: PortfolioState['sortOrder']) => void;
  exportPortfolio: () => string;
  importPortfolio: (data: string) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(portfolioReducer, initialState);

  // Load portfolio from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('flashboobs-portfolio');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        dispatch({ type: 'LOAD_PORTFOLIO', payload: parsedData.tokens || [] });
      } catch (error) {
        console.error('Failed to load portfolio:', error);
      }
    }
  }, []);

  // Save portfolio to localStorage when tokens change
  useEffect(() => {
    if (state.tokens.length > 0) {
      localStorage.setItem('flashboobs-portfolio', JSON.stringify({
        tokens: state.tokens,
        lastUpdated: Date.now(),
      }));
    }
  }, [state.tokens]);

  const contextValue: PortfolioContextType = {
    ...state,
    addToken: (token, amount) => dispatch({ type: 'ADD_TOKEN', payload: { token, amount } }),
    removeToken: (id) => dispatch({ type: 'REMOVE_TOKEN', payload: id }),
    updateTokenAmount: (id, amount) => dispatch({ type: 'UPDATE_TOKEN_AMOUNT', payload: { id, amount } }),
    updatePrices: (prices) => dispatch({ type: 'UPDATE_PRICES', payload: prices }),
    setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setSorting: (sortBy, sortOrder) => dispatch({ type: 'SET_SORT', payload: { sortBy, sortOrder } }),
    exportPortfolio: () => {
      return JSON.stringify({
        tokens: state.tokens,
        exportedAt: Date.now(),
        version: '1.0',
      }, null, 2);
    },
    importPortfolio: (data) => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.tokens && Array.isArray(parsed.tokens)) {
          dispatch({ type: 'LOAD_PORTFOLIO', payload: parsed.tokens });
        }
      } catch (error) {
        console.error('Failed to import portfolio:', error);
      }
    },
  };

  return (
    <PortfolioContext.Provider value={contextValue}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}

export type { PortfolioToken };