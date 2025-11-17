"use client";

import { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { coinGeckoService, TokenData } from '~/services/coingecko';
import { usePortfolio } from '~/contexts/PortfolioContext';

export default function PopularTokens() {
  const [popularTokens, setPopularTokens] = useState<TokenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingTokens, setAddingTokens] = useState<Set<string>>(new Set());
  const { addToken, tokens } = usePortfolio();

  useEffect(() => {
    const fetchPopularTokens = async () => {
      try {
        const trending = await coinGeckoService.getTrendingTokens();
        setPopularTokens(trending.slice(0, 8)); // Show top 8
      } catch (error) {
        console.error('Failed to fetch trending tokens:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopularTokens();
  }, []);

  const handleQuickAdd = async (token: TokenData) => {
    setAddingTokens(prev => new Set(prev).add(token.id));

    // Add with a default amount of 1
    addToken(token, 1);

    setTimeout(() => {
      setAddingTokens(prev => {
        const newSet = new Set(prev);
        newSet.delete(token.id);
        return newSet;
      });
    }, 1000);
  };

  const isTokenInPortfolio = (tokenId: string) => {
    return tokens.some(t => t.id === tokenId);
  };

  if (tokens.length > 0) {
    return null; // Hide when user has tokens
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading popular tokens...</p>
      </div>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20 mb-8">
      <CardHeader>
        <CardTitle className="text-lg">Popular Tokens</CardTitle>
        <p className="text-sm text-muted-foreground">
          Quick add popular tokens to get started
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {popularTokens.map((token) => {
            const isAdding = addingTokens.has(token.id);
            const isInPortfolio = isTokenInPortfolio(token.id);
            const isPositive = token.price_change_percentage_24h >= 0;

            return (
              <div
                key={token.id}
                className="flex flex-col p-3 bg-background/50 rounded-lg border border-primary/10 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <img
                    src={token.image}
                    alt={token.name}
                    className="w-6 h-6 rounded-full"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect width="24" height="24" fill="%23ddd"/></svg>';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs truncate">{token.name}</p>
                    <p className="text-xs text-muted-foreground uppercase">{token.symbol}</p>
                  </div>
                </div>

                <div className="mb-2">
                  <p className="text-sm font-semibold">${token.current_price.toLocaleString()}</p>
                  <p className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{token.price_change_percentage_24h.toFixed(2)}%
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickAdd(token)}
                  disabled={isAdding || isInPortfolio}
                  className="h-7 text-xs"
                >
                  {isAdding ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : isInPortfolio ? (
                    'Added'
                  ) : (
                    <>
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}