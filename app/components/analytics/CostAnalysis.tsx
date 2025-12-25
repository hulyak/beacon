'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils/analytics-utils';

interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface CostAnalysisProps {
  financialImpact: {
    directCosts: number;
    opportunityCosts: number;
    laborCosts: number;
    materialCosts: number;
    logisticsCosts: number;
    totalImpact: number;
    currency: string;
  };
  onCostCategorySelect?: (category: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function CostAnalysis({ financialImpact, onCostCategorySelect }: CostAnalysisProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);

  useEffect(() => {
    if (financialImpact) {
      const breakdown = calculateCostBreakdown(financialImpact);
      setCostBreakdown(breakdown);
    }
  }, [financialImpact]);

  const calculateCostBreakdown = (impact: CostAnalysisProps['financialImpact']): CostBreakdown[] => {
    const categories = [
      { name: 'Direct Costs', amount: impact.directCosts },
      { name: 'Opportunity Costs', amount: impact.opportunityCosts },
      { name: 'Labor Costs', amount: impact.laborCosts },
      { name: 'Material Costs', amount: impact.materialCosts },
      { name: 'Logistics Costs', amount: impact.logisticsCosts },
    ];

    return categories.map((category, index) => ({
      category: category.name,
      amount: category.amount,
      percentage: (category.amount / impact.totalImpact) * 100,
      color: COLORS[index % COLORS.length],
    }));
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    onCostCategorySelect?.(category);
  };

  const getLargestCostCategory = () => {
    return costBreakdown.reduce((max, current) => 
      current.amount > max.amount ? current : max
    );
  };

  const pieData = costBreakdown.map(item => ({
    name: item.category,
    value: item.amount,
    percentage: item.percentage,
  }));

  const barData = costBreakdown.map(item => ({
    category: item.category.replace(' Costs', ''),
    amount: item.amount,
  }));

  if (!financialImpact || costBreakdown.length === 0) {
    return <div className="p-6">Loading cost analysis...</div>;
  }

  const largestCategory = getLargestCostCategory();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Financial Impact</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(financialImpact.totalImpact, financialImpact.currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all cost categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Largest Cost Driver</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {largestCategory.category}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(largestCategory.amount)} ({formatPercentage(largestCategory.percentage)})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              HIGH
            </div>
            <p className="text-xs text-muted-foreground">
              Immediate action required
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      onClick={() => handleCategoryClick(entry.name)}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(typeof value === 'number' ? value : 0)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <XAxis 
                  dataKey="category" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value) => formatCurrency(typeof value === 'number' ? value : 0)} />
                <Bar 
                  dataKey="amount" 
                  fill="#8884d8"
                  onClick={(data) => handleCategoryClick(((data as unknown as { category: string }).category || '') + ' Costs')}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {costBreakdown.map((item, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedCategory === item.category ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleCategoryClick(item.category)}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium">{item.category}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatCurrency(item.amount, financialImpact.currency)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatPercentage(item.percentage)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Category Details */}
      {selectedCategory && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedCategory} - Detailed Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                This category represents {formatPercentage(
                  costBreakdown.find(c => c.category === selectedCategory)?.percentage || 0
                )} of the total financial impact.
              </p>
              <div className="mt-4">
                <h4 className="font-medium mb-2">Mitigation Strategies:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {getCategoryMitigationStrategies(selectedCategory).map((strategy, index) => (
                    <li key={index}>{strategy}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getCategoryMitigationStrategies(category: string): string[] {
  const strategies: Record<string, string[]> = {
    'Direct Costs': [
      'Negotiate emergency contracts with alternative suppliers',
      'Implement cost-sharing agreements with key partners',
      'Activate pre-negotiated contingency pricing'
    ],
    'Opportunity Costs': [
      'Prioritize high-margin products and key customers',
      'Implement dynamic pricing to capture available demand',
      'Accelerate product launches to compensate for lost revenue'
    ],
    'Labor Costs': [
      'Optimize workforce allocation across facilities',
      'Implement flexible work arrangements',
      'Cross-train employees for critical functions'
    ],
    'Material Costs': [
      'Activate alternative material sourcing',
      'Implement material substitution where possible',
      'Negotiate volume discounts with backup suppliers'
    ],
    'Logistics Costs': [
      'Optimize transportation routes and modes',
      'Consolidate shipments to reduce per-unit costs',
      'Negotiate emergency logistics contracts'
    ]
  };

  return strategies[category] || ['Implement general cost reduction measures'];
}