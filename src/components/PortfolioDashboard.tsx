"use client";

import { useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, ArrowUpDown, Download, Upload } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { usePortfolio } from '~/contexts/PortfolioContext';
import { coinGeckoService } from '~/services/coingecko';
import TokenCard from './TokenCard';

export default function PortfolioDashboard() {
  const {
    tokens,
    totalValue,
    totalChange24h,
    isLoading,
    sortBy,
    sortOrder,
    setSorting,
    updatePrices,
    setLoading,
    exportPortfolio,
    importPortfolio,
  } = usePortfolio();

  // Auto-refresh prices every 30 seconds
  useEffect(() => {
    const refreshPrices = async () => {
      if (tokens.length === 0) return;

      setLoading(true);
      try {
        const tokenIds = tokens.map(t => t.id);
        const updatedPrices = await coinGeckoService.getTokenData(tokenIds);
        updatePrices(updatedPrices);
      } catch (error) {
        console.error('Failed to refresh prices:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    refreshPrices();

    // Set up interval
    const interval = setInterval(refreshPrices, 30000);
    return () => clearInterval(interval);
  }, [tokens.length, updatePrices, setLoading]);

  const handleRefresh = async () => {
    if (tokens.length === 0) return;

    setLoading(true);
    try {
      const tokenIds = tokens.map(t => t.id);
      const updatedPrices = await coinGeckoService.getTokenData(tokenIds);
      updatePrices(updatedPrices);
    } catch (error) {
      console.error('Failed to refresh prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-') as [typeof sortBy, typeof sortOrder];
    setSorting(newSortBy, newSortOrder);
  };

  const handleExport = () => {
    const data = exportPortfolio();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashboobs-portfolio-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = e.target?.result as string;
          if (data) {
            importPortfolio(data);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const isPositiveChange = totalChange24h >= 0;
  const changeColor = isPositiveChange ? 'text-green-500' : 'text-red-500';
  const ChangeTrendIcon = isPositiveChange ? TrendingUp : TrendingDown;

  if (tokens.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Start Building Your Portfolio</h3>
        <p className="text-muted-foreground">
          Search for tokens above to add them to your portfolio and track their performance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio summary */}
      <Card className="bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Portfolio Value</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleImport}
                className="h-8 w-8 p-0"
              >
                <Upload className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleExport}
                className="h-8 w-8 p-0"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRefresh}
                disabled={isLoading}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-3xl font-bold">
              ${totalValue.toLocaleString()}
            </div>
            <div className={`flex items-center space-x-2 ${changeColor}`}>
              <ChangeTrendIcon className="w-5 h-5" />
              <span className="text-lg font-semibold">
                {isPositiveChange ? '+' : ''}${Math.abs(totalChange24h).toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">
                ({isPositiveChange ? '+' : ''}{((totalChange24h / (totalValue - totalChange24h)) * 100).toFixed(2)}%)
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {tokens.length} token{tokens.length !== 1 ? 's' : ''} • Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Tokens</h2>
        <Select value={`${sortBy}-${sortOrder}`} onValueChange={handleSortChange}>
          <SelectTrigger className="w-48 bg-background/50 backdrop-blur-sm border-primary/20">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="value-desc">Value (High to Low)</SelectItem>
            <SelectItem value="value-asc">Value (Low to High)</SelectItem>
            <SelectItem value="change-desc">Gain/Loss (Best to Worst)</SelectItem>
            <SelectItem value="change-asc">Gain/Loss (Worst to Best)</SelectItem>
            <SelectItem value="name-asc">Name (A to Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z to A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Token grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tokens.map((token) => (
          <TokenCard key={token.id} token={token} />
        ))}
      </div>

      {isLoading && (
        <div className="text-center py-4">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Updating prices...</p>
        </div>
      )}
    </div>
  );
}