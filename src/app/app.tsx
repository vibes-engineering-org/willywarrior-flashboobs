"use client";

import { PortfolioProvider } from "~/contexts/PortfolioContext";
import TokenSearch from "~/components/TokenSearch";
import PortfolioDashboard from "~/components/PortfolioDashboard";
import PopularTokens from "~/components/PopularTokens";
import DarkModeToggle from "~/components/DarkModeToggle";
import { PROJECT_TITLE } from "~/lib/constants";

export default function App() {
  return (
    <PortfolioProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="max-w-6xl mx-auto px-4 py-4 md:py-8">
          {/* Header */}
          <div className="text-center mb-8 relative">
            {/* Dark mode toggle in top right */}
            <div className="absolute top-0 right-0">
              <DarkModeToggle />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
              {PROJECT_TITLE}
            </h1>
            <p className="text-muted-foreground">
              Advanced cryptocurrency portfolio tracker
            </p>
          </div>

          {/* Search */}
          <div className="mb-8 max-w-2xl mx-auto">
            <TokenSearch />
          </div>

          {/* Popular Tokens */}
          <PopularTokens />

          {/* Dashboard */}
          <PortfolioDashboard />
        </div>
      </div>
    </PortfolioProvider>
  );
}
