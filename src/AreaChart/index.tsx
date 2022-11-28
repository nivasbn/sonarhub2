import React, { useEffect, useRef } from "react";
import AreaChartD3 from "./assets/AreaChartD3";
import "./assets/AreaChart.css";
import weekSampleData from './sampleData/week.json'
import defaultConfig from './sampleData/config.json'

interface TimeSeriesData {
  timestamp: string;
  [index: string]: number | null | string;
}

interface AreaChartProps {
  data: TimeSeriesData[];
  style?: React.CSSProperties;
  config: any;
}

const AreaChart = ({ data, config, style }: AreaChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      const chart = AreaChartD3({
        container: chartRef.current,
        data: data,
        config: config
      }).render()
      chart.updateData({
        data,
        config,
      })
    }
  }, [data, config]);

  return <div ref={chartRef} style={style}></div>
};

export default AreaChart;


// <AreaChart data={weekSampleData} config={defaultConfig} />
