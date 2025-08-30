import React, { useState, useMemo, useRef } from 'react';

interface ChartData {
  week: string;
  timeSpent: number;
  timeSaved: number;
}

interface PerformanceChartProps {
  data: ChartData[];
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const chartHeight = 300;
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const width = 1000;
  const height = chartHeight - margin.top - margin.bottom;

  const yMax = useMemo(() => {
    const maxVal = Math.max(...data.map(d => d.timeSpent), ...data.map(d => d.timeSaved));
    return Math.ceil(maxVal / 10) * 10 || 10;
  }, [data]);

  const x = (i: number) => (data.length > 1 ? (i / (data.length - 1)) * width : width / 2);
  const y = (value: number) => height - (value / yMax) * height;

  const spentPath = useMemo(() => {
    if (data.length < 1) return "";
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d.timeSpent)}`).join(' ');
  }, [data, yMax]);

  const savedPath = useMemo(() => {
    if (data.length < 1) return "";
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d.timeSaved)}`).join(' ');
  }, [data, yMax]);
  
  const spentAreaPath = `${spentPath} L ${x(data.length - 1)},${height} L ${x(0)},${height} Z`;
  const savedAreaPath = `${savedPath} L ${x(data.length - 1)},${height} L ${x(0)},${height} Z`;

  const yTicks = useMemo(() => {
    if (yMax <= 0) return [];
    const ticks = [];
    for (let i = 0; i <= yMax; i += Math.max(1, yMax / 5)) {
      ticks.push(i);
    }
    return ticks;
  }, [yMax]);

  const formatWeekLabel = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
  };
  
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || data.length === 0) return;
    
    const svgPoint = svgRef.current.createSVGPoint();
    svgPoint.x = e.clientX;
    svgPoint.y = e.clientY;
    
    const pointInSVG = svgPoint.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
    
    const pointsPerPixel = data.length > 1 ? (data.length - 1) / width : 0;
    let index = Math.round((pointInSVG.x - margin.left) * pointsPerPixel);
    index = Math.max(0, Math.min(data.length - 1, index));
    
    setActiveIndex(index);
  };
  
  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  const activeData = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div className="relative">
      <svg ref={svgRef} viewBox={`0 0 ${width + margin.left + margin.right} ${chartHeight}`} className="w-full h-auto" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="spentGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="savedGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>

        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Y-axis grid lines */}
          {yTicks.map(tick => (
            <line
              key={`grid-${tick}`}
              x1="0"
              y1={y(tick)}
              x2={width}
              y2={y(tick)}
              className="stroke-light-border dark:stroke-dark-border"
              strokeDasharray="2,2"
            />
          ))}

          {/* Y-axis labels */}
          {yTicks.map(tick => (
            <text
              key={`label-${tick}`}
              x="-10"
              y={y(tick)}
              dy="0.32em"
              textAnchor="end"
              className="text-xs fill-light-text-secondary dark:fill-dark-text-secondary"
            >
              {Math.round(tick)}h
            </text>
          ))}
          
          {/* X-axis labels */}
          {data.map((d, i) => (
            <text
              key={`xlabel-${i}`}
              x={x(i)}
              y={height + 20}
              textAnchor="middle"
              className="text-xs fill-light-text-secondary dark:fill-dark-text-secondary"
            >
              {formatWeekLabel(d.week)}
            </text>
          ))}

          {/* Area Fills */}
          <path d={savedAreaPath} fill="url(#savedGradient)" />
          <path d={spentAreaPath} fill="url(#spentGradient)" />

          {/* Lines */}
          <path d={spentPath} fill="none" stroke="#4f46e5" strokeWidth="2.5" />
          <path d={savedPath} fill="none" stroke="#10b981" strokeWidth="2.5" />
          
          {/* Interaction layer - vertical line and points */}
          {activeData && activeIndex !== null && (
            <g>
              <line 
                x1={x(activeIndex)} 
                y1="0" 
                x2={x(activeIndex)} 
                y2={height}
                className="stroke-light-text-secondary/50 dark:stroke-dark-text-secondary/50"
                strokeWidth="1"
              />
              <circle cx={x(activeIndex)} cy={y(activeData.timeSpent)} r="4" className="fill-light-card dark:fill-dark-bg stroke-brand-primary" strokeWidth="2" />
              <circle cx={x(activeIndex)} cy={y(activeData.timeSaved)} r="4" className="fill-light-card dark:fill-dark-bg stroke-green-500" strokeWidth="2" />
            </g>
          )}

        </g>
      </svg>
      {activeData && activeIndex !== null && (
        <div
          className="absolute pointer-events-none p-3 bg-light-card/80 dark:bg-dark-bg/80 backdrop-blur-sm rounded-lg shadow-xl text-xs text-light-text-primary dark:text-dark-text-primary border border-light-border dark:border-dark-border"
          style={{ 
            left: x(activeIndex) + margin.left, 
            top: y(activeData.timeSpent) + margin.top, // Position based on one of the points
            transform: `translate(${x(activeIndex) > width / 2 ? '-110%' : '10%'}) translateY(-50%)`
          }}
        >
          <p className="font-bold mb-1">{formatWeekLabel(activeData.week)}</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-brand-primary rounded-full"></span>
            <span>Spent: {activeData.timeSpent.toFixed(1)}h</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
            <span>Saved: {activeData.timeSaved.toFixed(1)}h</span>
          </div>
        </div>
      )}
      <div className="flex justify-center items-center gap-6 mt-4 text-xs text-light-text-secondary dark:text-dark-text-secondary">
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-brand-primary"></div>
              <span>Time Spent</span>
          </div>
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-green-500"></div>
              <span>Time Saved</span>
          </div>
      </div>
    </div>
  );
};

export default PerformanceChart;