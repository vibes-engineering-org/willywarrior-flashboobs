"use client";

import { useState } from 'react';
import { TrendingUp, TrendingDown, Edit2, Trash2, X, Check, BarChart3 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Card, CardContent } from '~/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { PortfolioToken } from '~/contexts/PortfolioContext';
import { usePortfolio } from '~/contexts/PortfolioContext';
import TokenChart from './TokenChart';

interface TokenCardProps {
  token: PortfolioToken;
}

export default function TokenCard({ token }: TokenCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(token.amount.toString());
  const { updateTokenAmount, removeToken } = usePortfolio();

  const handleSaveEdit = () => {
    const newAmount = parseFloat(editAmount);
    if (!isNaN(newAmount) && newAmount >= 0) {
      updateTokenAmount(token.id, newAmount);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditAmount(token.amount.toString());
    setIsEditing(false);
  };

  const isPositive = token.price_change_percentage_24h >= 0;
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
  const ChangeTrendIcon = isPositive ? TrendingUp : TrendingDown;

  // Prepare sparkline data
  const sparklineData = token.sparkline_in_7d?.price?.map((price, index) => ({
    value: price,
    index,
  })) || [];

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20 hover:bg-card/70 transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1">
            <img
              src={token.image}
              alt={token.name}
              className="w-12 h-12 rounded-full"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="48" height="48" fill="%23ddd"/></svg>';
              }}
            />
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{token.name}</h3>
              <p className="text-sm text-muted-foreground uppercase">{token.symbol}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-3">
                    <img
                      src={token.image}
                      alt={token.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <span>{token.name} ({token.symbol.toUpperCase()})</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Current Price:</span>
                      <span className="block font-semibold">${token.current_price.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">24h Change:</span>
                      <span className={`block font-semibold ${changeColor}`}>
                        {isPositive ? '+' : ''}{token.price_change_percentage_24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <TokenChart
                    data={token.sparkline_in_7d?.price || []}
                    name={token.name}
                    symbol={token.symbol}
                    isPositive={isPositive}
                  />
                </div>
              </DialogContent>
            </Dialog>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-8 w-8 p-0"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeToken(token.id)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Price and change */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-2xl font-bold">
              ${token.current_price.toLocaleString()}
            </p>
            <div className={`flex items-center space-x-1 ${changeColor}`}>
              <ChangeTrendIcon className="w-4 h-4" />
              <span className="font-medium">
                {Math.abs(token.price_change_percentage_24h).toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Mini chart */}
          {sparklineData.length > 0 && (
            <div className="w-24 h-12">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={isPositive ? "#10b981" : "#ef4444"}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Holdings */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Holdings:</span>
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="h-6 w-20 text-xs p-1"
                  min="0"
                  step="any"
                />
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  className="h-6 w-6 p-0"
                >
                  <Check className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <span className="font-medium">
                {token.amount.toLocaleString()} {token.symbol.toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Value:</span>
            <span className="font-bold text-primary">
              ${token.value.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">24h Change:</span>
            <span className={`font-medium ${changeColor}`}>
              {isPositive ? '+' : ''}${((token.price_change_percentage_24h / 100) * token.value).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Additional info */}
        <div className="pt-4 mt-4 border-t border-primary/20 grid grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <span className="block">Market Cap</span>
            <span className="font-medium text-foreground">
              ${token.market_cap ? (token.market_cap / 1e9).toFixed(2) + 'B' : 'N/A'}
            </span>
          </div>
          <div>
            <span className="block">Volume 24h</span>
            <span className="font-medium text-foreground">
              ${token.total_volume ? (token.total_volume / 1e6).toFixed(2) + 'M' : 'N/A'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}