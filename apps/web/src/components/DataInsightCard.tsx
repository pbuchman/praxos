import { BarChart3, TrendingUp, Eye } from 'lucide-react';
import { Button, Card } from '@/components/ui/index.js';
import type { DataInsight } from '@/types';

interface DataInsightCardProps {
  insight: DataInsight;
  onConfigureChart: (insightId: string) => void;
  isConfiguring: boolean;
}

const CHART_TYPE_NAMES: Record<string, string> = {
  C1: 'Line Chart',
  C2: 'Bar Chart',
  C3: 'Scatter Plot',
  C4: 'Area Chart',
  C5: 'Pie Chart',
  C6: 'Heatmap',
};

export function DataInsightCard({ insight, onConfigureChart, isConfiguring }: DataInsightCardProps): React.JSX.Element {
  return (
    <Card className="transition-all hover:-translate-y-1 hover:shadow-hard-hover">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-cyan-100 shadow-hard-sm">
            <BarChart3 className="h-5 w-5 text-black" />
          </div>
          <div>
            <h3 className="font-mono text-lg font-bold uppercase tracking-tight text-black">{insight.title}</h3>
            <span className="inline-block bg-yellow-100 px-1 font-mono text-xs font-bold uppercase text-black border border-black">{CHART_TYPE_NAMES[insight.suggestedChartType]}</span>
          </div>
        </div>
        <span className="font-mono text-xs font-bold text-neutral-500">
          {new Date(insight.generatedAt).toLocaleDateString()}
        </span>
      </div>
      <p className="mt-4 font-medium leading-relaxed text-black">{insight.description}</p>
      <div className="mt-4 border-2 border-black bg-neutral-100 p-3 shadow-hard-sm">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-black" />
          <span className="font-mono text-xs font-bold uppercase text-black">Trackable metric:</span>
        </div>
        <p className="mt-1 font-mono text-xs font-medium text-black">{insight.trackableMetric}</p>
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            onConfigureChart(insight.id);
          }}
          isLoading={isConfiguring}
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          Configure Chart
        </Button>
      </div>
    </Card>
  );
}
