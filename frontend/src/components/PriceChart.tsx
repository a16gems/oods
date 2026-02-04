'use client';

import { useEffect, useRef } from 'react';

interface PricePoint {
  time: number; // 0-100 representing timeline position
  price: number;
}

interface PriceChartProps {
  priceHistory: PricePoint[];
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
  onSelectPrice: (price: number) => void;
  selectedPrice: number | null;
}

const styles = {
  container: {
    position: 'relative' as const,
    width: '100%',
    height: '300px',
    backgroundColor: '#000',
    border: '1px solid #333',
  },
  canvas: {
    width: '100%',
    height: '100%',
    cursor: 'crosshair',
  },
  tooltip: {
    position: 'absolute' as const,
    backgroundColor: '#111',
    border: '1px solid #333',
    padding: '8px 12px',
    pointerEvents: 'none' as const,
    zIndex: 100,
  },
  tooltipPrice: {
    color: '#22c55e',
    fontSize: '14px',
    fontFamily: 'monospace',
    fontWeight: 600,
  },
  yAxis: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: '60px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    padding: '10px 8px',
    borderRight: '1px solid #222',
  },
  yLabel: {
    color: '#666',
    fontSize: '11px',
    fontFamily: 'monospace',
    textAlign: 'right' as const,
  },
  xAxis: {
    position: 'absolute' as const,
    left: '60px',
    right: 0,
    bottom: 0,
    height: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 10px',
    borderTop: '1px solid #222',
  },
  xLabel: {
    color: '#666',
    fontSize: '11px',
    fontFamily: 'monospace',
  },
  currentPriceIndicator: {
    position: 'absolute' as const,
    right: '10px',
    transform: 'translateY(-50%)',
    backgroundColor: '#22c55e',
    color: '#000',
    padding: '2px 8px',
    fontSize: '12px',
    fontFamily: 'monospace',
    fontWeight: 600,
  },
};

export function PriceChart({ 
  priceHistory, 
  currentPrice, 
  minPrice, 
  maxPrice,
  onSelectPrice,
  selectedPrice 
}: PriceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `$${Math.round(price / 1000)}k`;
    return `$${price}`;
  };

  const priceToY = (price: number, height: number) => {
    const padding = 30;
    const chartHeight = height - padding * 2;
    const ratio = (price - minPrice) / (maxPrice - minPrice);
    return padding + chartHeight * (1 - ratio);
  };

  const yToPrice = (y: number, height: number) => {
    const padding = 30;
    const chartHeight = height - padding * 2;
    const ratio = 1 - (y - padding) / chartHeight;
    return minPrice + ratio * (maxPrice - minPrice);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const chartLeft = 70;
    const chartRight = width - 20;
    const chartWidth = chartRight - chartLeft;

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    const gridLevels = 5;
    for (let i = 0; i <= gridLevels; i++) {
      const y = priceToY(minPrice + (maxPrice - minPrice) * (i / gridLevels), height);
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartRight, y);
      ctx.stroke();
    }

    // Draw selected price line
    if (selectedPrice) {
      const y = priceToY(selectedPrice, height);
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartRight, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw price history line
    if (priceHistory.length > 1) {
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      priceHistory.forEach((point, i) => {
        const x = chartLeft + (point.time / 100) * chartWidth;
        const y = priceToY(point.price, height);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw glow effect
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      priceHistory.forEach((point, i) => {
        const x = chartLeft + (point.time / 100) * chartWidth;
        const y = priceToY(point.price, height);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw current point
      const lastPoint = priceHistory[priceHistory.length - 1];
      const lastX = chartLeft + (lastPoint.time / 100) * chartWidth;
      const lastY = priceToY(lastPoint.price, height);
      
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Y axis labels
    ctx.fillStyle = '#666';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= gridLevels; i++) {
      const price = minPrice + (maxPrice - minPrice) * (i / gridLevels);
      const y = priceToY(price, height);
      ctx.fillText(formatPrice(price), chartLeft - 8, y + 4);
    }

    // Draw X axis labels
    ctx.textAlign = 'center';
    const timeLabels = ['0h', '6h', '12h', '18h', '24h'];
    timeLabels.forEach((label, i) => {
      const x = chartLeft + (i / 4) * chartWidth;
      ctx.fillText(label, x, height - 8);
    });

    // Draw "NOW" marker
    if (priceHistory.length > 0) {
      const lastPoint = priceHistory[priceHistory.length - 1];
      const nowX = chartLeft + (lastPoint.time / 100) * chartWidth;
      ctx.fillStyle = '#22c55e';
      ctx.font = '10px monospace';
      ctx.fillText('▲', nowX, height - 20);
      ctx.fillText('NOW', nowX, height - 32);
    }

  }, [priceHistory, currentPrice, minPrice, maxPrice, selectedPrice]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const price = yToPrice(y, rect.height);
    
    // Snap to nearest breakpoint
    const breakpoints = [25000, 50000, 75000, 100000, 125000, 150000, 200000, 250000];
    const nearest = breakpoints.reduce((prev, curr) => 
      Math.abs(curr - price) < Math.abs(prev - price) ? curr : prev
    );
    
    onSelectPrice(nearest);
  };

  const currentY = priceToY(currentPrice, 300);

  return (
    <div ref={containerRef} style={styles.container}>
      <canvas 
        ref={canvasRef} 
        style={styles.canvas}
        onClick={handleClick}
      />
      <div style={{
        ...styles.currentPriceIndicator,
        top: `${(currentY / 300) * 100}%`,
      }}>
        {formatPrice(currentPrice)}
      </div>
    </div>
  );
}
