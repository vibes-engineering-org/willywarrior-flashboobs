"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { coinGeckoService, SearchResult, TokenData } from '~/services/coingecko';
import { usePortfolio } from '~/contexts/PortfolioContext';

export default function TokenSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);
  const [amount, setAmount] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { addToken } = usePortfolio();

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const searchResults = await coinGeckoService.searchTokens(query);
        setResults(searchResults);
        setShowResults(true);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTokenSelect = async (result: SearchResult) => {
    setIsLoadingToken(true);
    try {
      const tokenData = await coinGeckoService.getTokenData([result.id]);
      if (tokenData.length > 0) {
        setSelectedToken(tokenData[0]);
        setShowResults(false);
        setQuery(result.name);
      }
    } catch (error) {
      console.error('Failed to load token data:', error);
    } finally {
      setIsLoadingToken(false);
    }
  };

  const handleContractSearch = async () => {
    if (!contractAddress.trim()) return;

    setIsLoadingToken(true);
    try {
      // Try different platforms
      const platforms = ['ethereum', 'binance-smart-chain', 'polygon-pos', 'solana'];
      let tokenData = null;

      for (const platform of platforms) {
        try {
          tokenData = await coinGeckoService.getTokenByContractAddress(contractAddress, platform);
          if (tokenData) break;
        } catch (error) {
          continue;
        }
      }

      if (tokenData) {
        setSelectedToken(tokenData);
        setQuery(tokenData.name);
      } else {
        console.error('Token not found on any supported platform');
      }
    } catch (error) {
      console.error('Contract search failed:', error);
    } finally {
      setIsLoadingToken(false);
    }
  };

  const handleAddToken = () => {
    if (!selectedToken || !amount) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    addToken(selectedToken, numAmount);
    setSelectedToken(null);
    setQuery('');
    setAmount('');
    setContractAddress('');
  };

  const handleReset = () => {
    setSelectedToken(null);
    setQuery('');
    setAmount('');
    setContractAddress('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="space-y-4">
      <div className="relative" ref={searchRef}>
        {/* Main search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search tokens by name or symbol..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 bg-background/50 backdrop-blur-sm border-primary/20"
            onFocus={() => results.length > 0 && setShowResults(true)}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin" />
          )}
        </div>

        {/* Search results dropdown */}
        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background/95 backdrop-blur-sm border border-primary/20 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleTokenSelect(result)}
                className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-primary/10 transition-colors text-left"
                disabled={isLoadingToken}
              >
                <img
                  src={result.thumb}
                  alt={result.name}
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="%23ddd"/></svg>';
                  }}
                />
                <div className="flex-1">
                  <div className="font-medium">{result.name}</div>
                  <div className="text-sm text-muted-foreground uppercase">{result.symbol}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  #{result.market_cap_rank || 'N/A'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contract address search */}
      <div className="flex space-x-2">
        <Input
          placeholder="Or enter contract address..."
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          className="bg-background/50 backdrop-blur-sm border-primary/20"
        />
        <Button
          onClick={handleContractSearch}
          disabled={!contractAddress.trim() || isLoadingToken}
          variant="outline"
        >
          {isLoadingToken ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </Button>
      </div>

      {/* Selected token and amount input */}
      {selectedToken && (
        <div className="p-4 bg-card/50 backdrop-blur-sm border border-primary/20 rounded-lg space-y-4">
          <div className="flex items-center space-x-3">
            <img
              src={selectedToken.image}
              alt={selectedToken.name}
              className="w-12 h-12 rounded-full"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="48" height="48" fill="%23ddd"/></svg>';
              }}
            />
            <div className="flex-1">
              <h3 className="font-semibold">{selectedToken.name}</h3>
              <p className="text-sm text-muted-foreground uppercase">{selectedToken.symbol}</p>
              <p className="text-sm text-primary font-medium">
                ${selectedToken.current_price.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              type="number"
              placeholder="Enter amount you hold..."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-background/50 backdrop-blur-sm border-primary/20"
              min="0"
              step="any"
            />

            <div className="flex space-x-2">
              <Button
                onClick={handleAddToken}
                disabled={!amount || parseFloat(amount) <= 0}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Portfolio
              </Button>
              <Button onClick={handleReset} variant="outline">
                Cancel
              </Button>
            </div>

            {amount && parseFloat(amount) > 0 && selectedToken.current_price && (
              <div className="text-sm text-muted-foreground text-center">
                Portfolio value: ${(parseFloat(amount) * selectedToken.current_price).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}