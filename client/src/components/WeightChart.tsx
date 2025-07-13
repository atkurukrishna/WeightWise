import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

interface WeightEntry {
  weight: string;
  recordedAt: string;
}

interface WeightChartProps {
  entries: WeightEntry[];
}

export default function WeightChart({ entries }: WeightChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || entries.length === 0) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Sort entries by date (oldest first for chart)
    const sortedEntries = [...entries]
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .slice(-30); // Show last 30 entries

    const labels = sortedEntries.map(entry => 
      new Date(entry.recordedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    );
    
    const data = sortedEntries.map(entry => parseFloat(entry.weight));

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Weight (lbs)",
            data,
            borderColor: "hsl(207, 90%, 54%)",
            backgroundColor: "hsla(207, 90%, 54%, 0.1)",
            tension: 0.4,
            fill: true,
            pointBackgroundColor: "hsl(207, 90%, 54%)",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: false,
            min: data.length > 0 ? Math.min(...data) - 5 : 0,
            grid: {
              color: "hsl(0, 0%, 90%)",
            },
          },
        },
        elements: {
          point: {
            hoverRadius: 6,
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">No weight data yet</p>
          <p className="text-sm">Start by adding your first weight entry!</p>
        </div>
      </div>
    );
  }

  return <canvas ref={chartRef} className="w-full h-full" />;
}
